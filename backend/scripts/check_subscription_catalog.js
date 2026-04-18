const db = require('../src/db');
const env = require('../src/config/env');
const SubscriptionService = require('../src/services/subscription.service');

async function checkSubscriptionCatalog() {
  console.log('Checking subscription catalog seeding...');
  console.log(`Environment file: ${env.ENV_FILE_PATH}`);

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
    } else {
      console.error(error);
    }

    process.exitCode = 1;
  } finally {
    await db.pool.end().catch(() => {});
  }
}

void checkSubscriptionCatalog();
