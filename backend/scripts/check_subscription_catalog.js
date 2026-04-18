const db = require('../src/db');
const env = require('../src/config/env');
const SubscriptionService = require('../src/services/subscription.service');

async function checkSubscriptionCatalog() {
  console.log('Checking subscription catalog seeding...');
  console.log(`Environment file: ${env.ENV_FILE_PATH}`);
  if (env.ENV_LOCAL_FILE_LOADED) {
    console.log(`Environment override: ${env.ENV_LOCAL_FILE_PATH}`);
  }

  try {
    const plans = await SubscriptionService.listPlans();
    console.log(`Plans found: ${plans.length}`);

    for (const plan of plans) {
      console.log(`- ${plan.name} (${plan.code}): ${plan.entitlements.join(', ')}`);
    }

    const entitlementsResult = await db.query('SELECT COUNT(*)::int AS total FROM subscription_entitlements');
    const plansResult = await db.query('SELECT COUNT(*)::int AS total FROM subscription_plans');

    console.log(`Total entitlements in DB: ${entitlementsResult.rows[0]?.total ?? 0}`);
    console.log(`Total plans in DB: ${plansResult.rows[0]?.total ?? 0}`);
  } catch (error) {
    console.error('Subscription catalog check failed.');

    if (error?.code === 'ENOTFOUND') {
      console.error(`Database host could not be resolved: ${error.hostname || env.DB_HOST}`);
      console.error('Use DB_HOST=localhost for a host machine database, DB_HOST=db inside Docker Compose, or set DATABASE_URL.');
    } else if (error?.code === 'ECONNREFUSED') {
      console.error(`Database is not accepting connections on ${env.DB_HOST}:${env.DB_PORT}.`);
      console.error('Start PostgreSQL locally or provide a reachable DATABASE_URL / DB_HOST override.');
    } else {
      console.error(error);
    }

    process.exitCode = 1;
  } finally {
    await db.pool.end().catch(() => {});
  }
}

void checkSubscriptionCatalog();
