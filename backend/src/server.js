const http = require('http');
const env = require('./config/env');
const logger = require('./utils/logger');
const app = require('./app');
const { pool } = require('./db');
const { describeDbIssue, getDbTarget } = require('./utils/dbDiagnostics');

const port = env.PORT || 3000;
const server = http.createServer(app);

function validateProductionEnvironment() {
  if (env.NODE_ENV !== 'production') {
    return;
  }

  const errors = [];
  const allowedOrigins = (env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (allowedOrigins.length === 0 || allowedOrigins.includes('*')) {
    errors.push('ALLOWED_ORIGINS must be an explicit non-wildcard allowlist in production.');
  }

  const jwtSecret = String(env.JWT_SECRET || '');
  if (jwtSecret.length < 32 || jwtSecret.toLowerCase().includes('change_me')) {
    errors.push('JWT_SECRET must be a strong production secret of at least 32 characters.');
  }

  if (!env.DATABASE_URL) {
    const dbPassword = String(env.DB_PASSWORD || '');
    if (!dbPassword || dbPassword.toLowerCase().includes('change_me')) {
      errors.push('DB_PASSWORD must be set to a non-placeholder production value.');
    }
  }

  if (env.OTP_DEV_FALLBACK) {
    errors.push('OTP_DEV_FALLBACK must be false in production.');
  }

  if (errors.length) {
    logger.error('Refusing to start with an unsafe production environment.', { errors });
    const error = new Error('Unsafe production environment configuration.');
    error.code = 'UNSAFE_PRODUCTION_ENV';
    error.details = errors;
    throw error;
  }
}

const startServer = async () => {
  try {
    validateProductionEnvironment();

    await pool.query('SELECT 1');
    logger.info('Database connection established.');
    logger.info('Backend environment loaded.', {
      nodeEnv: env.NODE_ENV,
      envFilePath: env.ENV_FILE_PATH,
      emailEnabled: env.EMAIL_ENABLED,
      requireEmailVerification: env.REQUIRE_EMAIL_VERIFICATION,
      autoVerifyEmail: env.AUTO_VERIFY_EMAIL,
      otpDevFallback: env.OTP_DEV_FALLBACK,
      subscriptionsPaused: env.SUBSCRIPTIONS_PAUSED,
      trainerEmailsConfigured: Boolean(env.TRAINER_EMAILS && env.TRAINER_EMAILS.trim()),
    });

    server.listen(port, '0.0.0.0', () => {
      logger.info(`Server is running on http://0.0.0.0:${port} in ${env.NODE_ENV} mode`);
    });
  } catch (err) {
    if (err.code === 'UNSAFE_PRODUCTION_ENV') {
      process.exitCode = 1;
      return;
    }

    const issue = describeDbIssue(err, env);
    logger.error('Failed to connect to the database. Retrying in 5 seconds.', {
      error: err.message,
      code: err.code,
      summary: issue.summary,
      hints: issue.hints,
      target: getDbTarget(env),
      envFilePath: env.ENV_FILE_PATH,
      envLocalFileLoaded: env.ENV_LOCAL_FILE_LOADED,
    });
    setTimeout(startServer, 5000);
  }
};

const gracefulShutdown = async () => {
  logger.info('Received shutdown signal. Closing server...');
  server.close(() => {
    logger.info('HTTP server closed.');
    pool.end(() => {
      logger.info('Database pool closed.');
      process.exit(0);
    });
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

startServer();
