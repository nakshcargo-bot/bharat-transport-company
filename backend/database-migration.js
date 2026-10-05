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

    // Gate Pass Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS gate_passes (
        id SERIAL PRIMARY KEY,
        pass_no VARCHAR(50) UNIQUE NOT NULL,
        lr_no VARCHAR(50),
        vehicle_no VARCHAR(20),
        driver_name VARCHAR(100),
        driver_mobile VARCHAR(15),
        material_desc TEXT,
        quantity VARCHAR(50),
        weight VARCHAR(20),
        valid_until DATE,
        issued_by VARCHAR(100),
        issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) DEFAULT 'Active',
        qr_code TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Gate passes table created');

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
