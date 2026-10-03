const { Pool } = require('pg');

async function runMigrations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  console.log('🔄 Running database migrations...');

  try {
    // Add consignor_email column
    await pool.query(`
      ALTER TABLE consignments 
      ADD COLUMN IF NOT EXISTS consignor_email VARCHAR(255)
    `);
    console.log('✅ Added consignor_email column');

    // Add consignee_email column
    await pool.query(`
      ALTER TABLE consignments 
      ADD COLUMN IF NOT EXISTS consignee_email VARCHAR(255)
    `);
    console.log('✅ Added consignee_email column');

    console.log('✅ All migrations completed successfully!');
  } catch (err) {
    console.error('❌ Migration error:', err.message);
  } finally {
    await pool.end();
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
