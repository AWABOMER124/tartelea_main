const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { pool } = require('../src/db');

const migrationsDir = path.resolve(__dirname, '../migrations');

const checksum = (content) =>
  crypto.createHash('sha256').update(content, 'utf8').digest('hex');

async function ensureMigrationTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      checksum TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function runMigrations() {
  const client = await pool.connect();

  try {
    await ensureMigrationTable(client);

    const files = fs
      .readdirSync(migrationsDir)
      .filter((name) => name.endsWith('.sql'))
      .sort();

    for (const filename of files) {
      const fullPath = path.join(migrationsDir, filename);
      const sql = fs.readFileSync(fullPath, 'utf8');
      const digest = checksum(sql);

      const existing = await client.query(
        'SELECT checksum FROM schema_migrations WHERE filename = $1',
        [filename],
      );

      if (existing.rowCount > 0) {
        if (existing.rows[0].checksum !== digest) {
          throw new Error(
            `Migration checksum mismatch for ${filename}. Never edit an applied migration; create a new migration instead.`,
          );
        }

        console.log(`[MIGRATE] skip ${filename} (already applied)`);
        continue;
      }

      console.log(`[MIGRATE] applying ${filename}`);
      await client.query('BEGIN');

      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (filename, checksum) VALUES ($1, $2)',
          [filename, digest],
        );
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }

      console.log(`[MIGRATE] applied ${filename}`);
    }

    console.log('[MIGRATE] database is up to date');
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch((error) => {
  console.error('[MIGRATE] failed:', error.message);
  process.exitCode = 1;
});
