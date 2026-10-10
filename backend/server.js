const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ✅ .env हमेशा load करो (production में भी)
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

// ✅ CORS - सिर्फ allowed origins
app.use(cors({
  origin: [
    'https://bharat-transport.pages.dev',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:4173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// ✅ Env variables check
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is missing!');
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET is missing!');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20,
});

// ==========================================
// SAFE MIGRATION
// ==========================================
async function addColumnIfNotExists(table, column, definition) {
  try {
    const check = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND column_name = $2`,
      [table, column]
    );
    if (check.rows.length === 0) {
      await pool.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
      console.log(`  ✅ Added column "${column}" to "${table}"`);
    }
  } catch (err) {
    console.error(`  ⚠️ Error adding ${column} to ${table}:`, err.message);
  }
}

async function runMigrations() {
  console.log('🏃 Running database migrations...');

  const tables = [
    `CREATE TABLE IF NOT EXISTS branches (
      id SERIAL PRIMARY KEY, branch_code TEXT UNIQUE NOT NULL, branch_name TEXT NOT NULL,
      address TEXT, city TEXT, state TEXT, pincode TEXT, phone TEXT, email TEXT, gst_no TEXT, pan_no TEXT,
      manager_name TEXT, manager_phone TEXT, is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL,
      full_name TEXT, role TEXT DEFAULT 'operator', branch_id INTEGER,
      is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS parties (
      id SERIAL PRIMARY KEY, party_code TEXT UNIQUE NOT NULL, party_name TEXT NOT NULL, party_type TEXT DEFAULT 'Consignor',
      address TEXT, city TEXT, state TEXT, pincode TEXT, gst_no TEXT, pan_no TEXT, email TEXT, phone TEXT, mobile TEXT,
      contact_person TEXT, credit_days INTEGER DEFAULT 0, opening_balance NUMERIC DEFAULT 0, is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY, customer_name TEXT NOT NULL, customer_code TEXT UNIQUE, address TEXT, gst_no TEXT,
      email TEXT, phone TEXT, is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS drivers (
      id SERIAL PRIMARY KEY, driver_code TEXT UNIQUE NOT NULL, driver_name TEXT NOT NULL, father_name TEXT,
      aadhar_no TEXT, license_no TEXT, license_expiry DATE, phone TEXT, address TEXT, photo_url TEXT,
      joining_date DATE, status TEXT DEFAULT 'Active', created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS vehicles (
      id SERIAL PRIMARY KEY, vehicle_no TEXT UNIQUE NOT NULL, vehicle_type TEXT, owner_name TEXT, owner_phone TEXT,
      rc_expiry DATE, insurance_expiry DATE, fitness_expiry DATE, permit_expiry DATE, puc_expiry DATE,
      status TEXT DEFAULT 'Active', created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS freight_rates (
      id SERIAL PRIMARY KEY, from_city TEXT NOT NULL, to_city TEXT NOT NULL, material TEXT, rate_per_kg NUMERIC, rate_per_pkg NUMERIC,
      min_charge NUMERIC, distance_km NUMERIC, effective_from DATE, effective_to DATE, is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS materials (
      id SERIAL PRIMARY KEY, material_name TEXT UNIQUE NOT NULL, material_code TEXT, hsn_code TEXT, category TEXT,
      is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS routes (
      id SERIAL PRIMARY KEY, from_city TEXT NOT NULL, to_city TEXT NOT NULL, distance_km NUMERIC, via TEXT, estimated_days INTEGER,
      is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS consignments (
      id SERIAL PRIMARY KEY, lr_no TEXT UNIQUE NOT NULL, lr_date DATE, branch_id INTEGER, branch_code TEXT,
      from_name TEXT, to_name TEXT, consignor_code TEXT, consignor_name TEXT, consignor_address TEXT, consignor_gst TEXT,
      consignee_code TEXT, consignee_name TEXT, consignee_address TEXT, consignee_gst TEXT, invoice_no TEXT, invoice_date TEXT, po_no TEXT,
      lorry_no TEXT, driver_name TEXT, driver_mobile TEXT, delivery_type TEXT DEFAULT 'DOOR DELIVERY',
      packages TEXT, no_of_packages TEXT, method_of_packing TEXT, hsn_code TEXT, actual_weight TEXT, charged_weight TEXT,
      material_desc TEXT, description TEXT, eway_bill_no TEXT, length TEXT, width TEXT, height TEXT, total_cft TEXT, cft_cmt TEXT,
      declared_value TEXT, basis_party TEXT, basis_booking TEXT DEFAULT 'TO PAY', rv_no TEXT, rv_dt TEXT, rv_am TEXT,
      insurance_company TEXT, policy_no TEXT, insurance_amount TEXT, freight TEXT, aoc_percent TEXT, material_mgmt_ch TEXT, material_charges TEXT,
      collection_charges TEXT, door_dly_charges TEXT, door_delivery TEXT, misc_charges TEXT, grand_total TEXT, status TEXT DEFAULT 'Booked',
      payment_status TEXT DEFAULT 'Unpaid', mr_no TEXT, pod_status TEXT DEFAULT 'Pending', pod_date DATE, pod_remarks TEXT,
      from_state TEXT, to_state TEXT, transporter_id TEXT, transporter_name TEXT, eway_valid_upto DATE,
      created_by TEXT, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS pod_records (
      id SERIAL PRIMARY KEY, lr_no TEXT NOT NULL, branch_id INTEGER, delivery_date DATE, delivered_by TEXT,
      receiver_name TEXT, receiver_signature TEXT, receiver_phone TEXT, delivery_remarks TEXT,
      photo_url TEXT, status TEXT DEFAULT 'Delivered', created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS bill_book (
      id SERIAL PRIMARY KEY, bill_no TEXT UNIQUE, bill_date DATE, branch_id INTEGER, party_name TEXT, party_code TEXT,
      party_gst TEXT, party_address TEXT, from_name TEXT, to_name TEXT, consignor_name TEXT, consignee_name TEXT,
      vehicle_no TEXT, lr_nos TEXT, amount TEXT, gst_amount TEXT, total_amount TEXT, grand_total NUMERIC DEFAULT 0,
      advance_received NUMERIC DEFAULT 0, balance_due NUMERIC DEFAULT 0, net_balance NUMERIC DEFAULT 0,
      trip_subtotal NUMERIC DEFAULT 0, gst_percent NUMERIC DEFAULT 0, invoice_no TEXT, invoice_date DATE,
      amount_in_words TEXT, payment_mode TEXT, payment_details TEXT, remarks TEXT,
      status TEXT DEFAULT 'Pending', payment_status TEXT DEFAULT 'Unpaid',
      mr_no TEXT, branch_code TEXT, customer_id INTEGER, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS bill_items (
      id SERIAL PRIMARY KEY, bill_id INTEGER REFERENCES bill_book(id) ON DELETE CASCADE,
      lr_no TEXT, invoice_no TEXT, from_name TEXT, to_name TEXT,
      weight_mt NUMERIC DEFAULT 0, packages INTEGER DEFAULT 0, freight NUMERIC DEFAULT 0,
      loading NUMERIC DEFAULT 0, unloading NUMERIC DEFAULT 0, other_charges NUMERIC DEFAULT 0, total NUMERIC DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS money_receipts (
      id SERIAL PRIMARY KEY, mr_no TEXT UNIQUE NOT NULL, mr_date DATE NOT NULL, branch_id INTEGER,
      party_type TEXT NOT NULL, party_name TEXT NOT NULL, bilty_id INTEGER, bilty_lr_no TEXT,
      bill_id INTEGER, bill_no TEXT, amount NUMERIC NOT NULL, payment_mode TEXT DEFAULT 'Cash',
      is_advance BOOLEAN DEFAULT FALSE, remarks TEXT, created_by TEXT, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS party_ledger (
      id SERIAL PRIMARY KEY, party_code TEXT NOT NULL, branch_id INTEGER, transaction_date DATE, transaction_type TEXT,
      reference_no TEXT, debit NUMERIC DEFAULT 0, credit NUMERIC DEFAULT 0, balance NUMERIC DEFAULT 0, remarks TEXT, created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS expenses (
      id SERIAL PRIMARY KEY, expense_date DATE, branch_id INTEGER, category TEXT, description TEXT, amount NUMERIC,
      payment_mode TEXT, bill_no TEXT, approved_by TEXT, created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS claims (
      id SERIAL PRIMARY KEY, lr_no TEXT, branch_id INTEGER, claim_date DATE, claim_type TEXT, description TEXT,
      claim_amount NUMERIC, settled_amount NUMERIC, status TEXT DEFAULT 'Open', remarks TEXT, created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS commissions (
      id SERIAL PRIMARY KEY, lr_no TEXT, branch_id INTEGER, agent_name TEXT, commission_percent NUMERIC, commission_amount NUMERIC,
      status TEXT DEFAULT 'Pending', paid_date DATE, created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY, lr_no TEXT, party_name TEXT, phone TEXT, email TEXT, message TEXT,
      type TEXT, status TEXT DEFAULT 'Pending', sent_at TIMESTAMP, created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY, action TEXT NOT NULL, module TEXT NOT NULL, record_id TEXT, details TEXT, performed_by TEXT,
      branch_id INTEGER, created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS gate_passes (
      id SERIAL PRIMARY KEY, pass_no TEXT UNIQUE NOT NULL, branch_id INTEGER, lr_no TEXT, vehicle_no TEXT,
      driver_name TEXT, driver_mobile TEXT, material_desc TEXT, quantity TEXT, weight TEXT,
      valid_until DATE, issued_by TEXT, qr_code TEXT, created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS gadi_challans (
      id SERIAL PRIMARY KEY, challan_no TEXT UNIQUE NOT NULL, branch_id INTEGER, lr_no TEXT, vehicle_no TEXT,
      driver_name TEXT, driver_mobile TEXT, driver_license TEXT, owner_name TEXT, owner_mobile TEXT,
      broker_name TEXT, broker_mobile TEXT, broker_commission TEXT, from_place TEXT, to_place TEXT, material_desc TEXT,
      weight TEXT, packages TEXT, bilty_date DATE, consignor_name TEXT, consignee_name TEXT,
      freight_amount NUMERIC, advance_paid NUMERIC, balance_due NUMERIC, toll_expense NUMERIC, diesel_expense NUMERIC, other_expense NUMERIC,
      tds_deduction NUMERIC, net_payable NUMERIC, issue_date DATE, created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS trips (
      id SERIAL PRIMARY KEY, trip_no TEXT UNIQUE NOT NULL, trip_date DATE, branch_id INTEGER,
      vehicle_no TEXT, driver_name TEXT, driver_mobile TEXT,
      from_branch TEXT, to_branch TEXT, via_hub TEXT,
      expected_departure DATE, expected_arrival DATE,
      distance_km NUMERIC, estimated_days INTEGER,
      status TEXT DEFAULT 'Planning', remarks TEXT,
      created_by TEXT, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS rate_contracts (
      id SERIAL PRIMARY KEY, branch_id INTEGER, party_code TEXT,
      from_city TEXT NOT NULL, to_city TEXT NOT NULL,
      rate_type TEXT DEFAULT 'per_kg', rate_per_kg NUMERIC, rate_per_pkg NUMERIC, fixed_rate NUMERIC, min_charge NUMERIC,
      weight_from NUMERIC, weight_to NUMERIC, effective_from DATE NOT NULL, effective_to DATE,
      is_active BOOLEAN DEFAULT TRUE, remarks TEXT, created_by TEXT,
      created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    )`
  ];

  for (const sql of tables) {
    try { await pool.query(sql); } catch (err) { console.error('Table error:', err.message); }
  }

  await pool.query(`CREATE TABLE IF NOT EXISTS manifests (
      id SERIAL PRIMARY KEY, manifest_no TEXT UNIQUE NOT NULL, manifest_date DATE NOT NULL, branch_id INTEGER,
      from_branch TEXT, to_branch TEXT, vehicle_no TEXT, driver_name TEXT, driver_mobile TEXT,
      status TEXT DEFAULT 'Created', remarks TEXT, created_by TEXT, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    )`);

  await pool.query(`CREATE TABLE IF NOT EXISTS manifest_items (
      id SERIAL PRIMARY KEY, manifest_id INTEGER REFERENCES manifests(id) ON DELETE CASCADE,
      lr_no TEXT NOT NULL, branch_id INTEGER, created_at TIMESTAMP DEFAULT NOW()
    )`);
  console.log('✅ Manifests tables created successfully');

  console.log('🔧 Adding missing columns...');

  await addColumnIfNotExists('branches', 'address', 'TEXT');
  await addColumnIfNotExists('branches', 'city', 'TEXT');
  await addColumnIfNotExists('branches', 'state', 'TEXT');
  await addColumnIfNotExists('branches', 'pincode', 'TEXT');
  await addColumnIfNotExists('branches', 'phone', 'TEXT');
  await addColumnIfNotExists('branches', 'email', 'TEXT');
  await addColumnIfNotExists('branches', 'gst_no', 'TEXT');
  await addColumnIfNotExists('branches', 'pan_no', 'TEXT');
  await addColumnIfNotExists('branches', 'manager_name', 'TEXT');
  await addColumnIfNotExists('branches', 'manager_phone', 'TEXT');
  await addColumnIfNotExists('branches', 'is_active', 'BOOLEAN DEFAULT TRUE');

  await addColumnIfNotExists('users', 'branch_id', 'INTEGER');
  await addColumnIfNotExists('users', 'full_name', 'TEXT');
  await addColumnIfNotExists('users', 'role', "TEXT DEFAULT 'operator'");
  await addColumnIfNotExists('users', 'is_active', 'BOOLEAN DEFAULT TRUE');

  await addColumnIfNotExists('parties', 'is_active', 'BOOLEAN DEFAULT TRUE');
  await addColumnIfNotExists('parties', 'party_type', "TEXT DEFAULT 'Consignor'");
  await addColumnIfNotExists('parties', 'city', 'TEXT');
  await addColumnIfNotExists('parties', 'state', 'TEXT');
  await addColumnIfNotExists('parties', 'pincode', 'TEXT');
  await addColumnIfNotExists('parties', 'pan_no', 'TEXT');
  await addColumnIfNotExists('parties', 'mobile', 'TEXT');
  await addColumnIfNotExists('parties', 'contact_person', 'TEXT');
  await addColumnIfNotExists('parties', 'credit_days', 'INTEGER DEFAULT 0');
  await addColumnIfNotExists('parties', 'opening_balance', 'NUMERIC DEFAULT 0');

  await addColumnIfNotExists('customers', 'is_active', 'BOOLEAN DEFAULT TRUE');
  await addColumnIfNotExists('drivers', 'status', "TEXT DEFAULT 'Active'");
  await addColumnIfNotExists('drivers', 'phone', 'TEXT');
  await addColumnIfNotExists('vehicles', 'status', "TEXT DEFAULT 'Active'");

  await addColumnIfNotExists('money_receipts', 'branch_id', 'INTEGER');
  await addColumnIfNotExists('money_receipts', 'updated_at', 'TIMESTAMP DEFAULT NOW()');
  await addColumnIfNotExists('money_receipts', 'created_by', 'TEXT');

  await addColumnIfNotExists('consignments', 'branch_id', 'INTEGER');
  await addColumnIfNotExists('consignments', 'branch_code', 'TEXT');
  await addColumnIfNotExists('consignments', 'pod_status', "TEXT DEFAULT 'Pending'");
  await addColumnIfNotExists('consignments', 'pod_date', 'DATE');
  await addColumnIfNotExists('consignments', 'pod_remarks', 'TEXT');
  await addColumnIfNotExists('consignments', 'updated_at', 'TIMESTAMP DEFAULT NOW()');
  await addColumnIfNotExists('consignments', 'payment_status', "TEXT DEFAULT 'Unpaid'");
  await addColumnIfNotExists('consignments', 'mr_no', 'TEXT');
  await addColumnIfNotExists('consignments', 'from_state', 'TEXT');
  await addColumnIfNotExists('consignments', 'to_state', 'TEXT');
  await addColumnIfNotExists('consignments', 'transporter_id', 'TEXT');
  await addColumnIfNotExists('consignments', 'transporter_name', 'TEXT');
  await addColumnIfNotExists('consignments', 'eway_valid_upto', 'DATE');

  await addColumnIfNotExists('consignments', 'no_of_packages', 'TEXT');
  await addColumnIfNotExists('consignments', 'description', 'TEXT');
  await addColumnIfNotExists('consignments', 'cft_cmt', 'TEXT');
  await addColumnIfNotExists('consignments', 'material_charges', 'TEXT');
  await addColumnIfNotExists('consignments', 'door_delivery', 'TEXT');

  await addColumnIfNotExists('bill_book', 'branch_id', 'INTEGER');
  await addColumnIfNotExists('bill_book', 'updated_at', 'TIMESTAMP DEFAULT NOW()');
  await addColumnIfNotExists('bill_book', 'payment_status', "TEXT DEFAULT 'Unpaid'");
  await addColumnIfNotExists('bill_book', 'party_gst', 'TEXT');
  await addColumnIfNotExists('bill_book', 'party_address', 'TEXT');
  await addColumnIfNotExists('bill_book', 'from_name', 'TEXT');
  await addColumnIfNotExists('bill_book', 'to_name', 'TEXT');
  await addColumnIfNotExists('bill_book', 'consignor_name', 'TEXT');
  await addColumnIfNotExists('bill_book', 'consignee_name', 'TEXT');
  await addColumnIfNotExists('bill_book', 'vehicle_no', 'TEXT');
  await addColumnIfNotExists('bill_book', 'grand_total', 'NUMERIC DEFAULT 0');
  await addColumnIfNotExists('bill_book', 'advance_received', 'NUMERIC DEFAULT 0');
  await addColumnIfNotExists('bill_book', 'balance_due', 'NUMERIC DEFAULT 0');
  await addColumnIfNotExists('bill_book', 'net_balance', 'NUMERIC DEFAULT 0');
  await addColumnIfNotExists('bill_book', 'trip_subtotal', 'NUMERIC DEFAULT 0');
  await addColumnIfNotExists('bill_book', 'gst_percent', 'NUMERIC DEFAULT 0');
  await addColumnIfNotExists('bill_book', 'gst_amount', 'TEXT');
  await addColumnIfNotExists('bill_book', 'amount_in_words', 'TEXT');
  await addColumnIfNotExists('bill_book', 'payment_mode', 'TEXT');
  await addColumnIfNotExists('bill_book', 'payment_details', 'TEXT');
  await addColumnIfNotExists('bill_book', 'remarks', 'TEXT');
  await addColumnIfNotExists('bill_book', 'invoice_no', 'TEXT');
  await addColumnIfNotExists('bill_book', 'invoice_date', 'DATE');
  await addColumnIfNotExists('bill_book', 'branch_code', 'TEXT');
  await addColumnIfNotExists('bill_book', 'customer_id', 'INTEGER');
  await addColumnIfNotExists('bill_book', 'lr_nos', 'TEXT');

  await addColumnIfNotExists('bill_items', 'packages', 'INTEGER DEFAULT 0');
  await addColumnIfNotExists('bill_items', 'freight', 'NUMERIC DEFAULT 0');

  await addColumnIfNotExists('party_ledger', 'branch_id', 'INTEGER');
  await addColumnIfNotExists('expenses', 'branch_id', 'INTEGER');
  await addColumnIfNotExists('claims', 'branch_id', 'INTEGER');
  await addColumnIfNotExists('commissions', 'branch_id', 'INTEGER');
  await addColumnIfNotExists('audit_logs', 'branch_id', 'INTEGER');
  await addColumnIfNotExists('gate_passes', 'branch_id', 'INTEGER');
  await addColumnIfNotExists('gadi_challans', 'branch_id', 'INTEGER');
  await addColumnIfNotExists('pod_records', 'branch_id', 'INTEGER');

  await addColumnIfNotExists('freight_rates', 'is_active', 'BOOLEAN DEFAULT TRUE');
  await addColumnIfNotExists('materials', 'is_active', 'BOOLEAN DEFAULT TRUE');
  await addColumnIfNotExists('routes', 'is_active', 'BOOLEAN DEFAULT TRUE');
  await addColumnIfNotExists('rate_contracts', 'is_active', 'BOOLEAN DEFAULT TRUE');
  await addColumnIfNotExists('trips', 'status', "TEXT DEFAULT 'Planning'");
  await addColumnIfNotExists('manifests', 'status', "TEXT DEFAULT 'Created'");

  console.log('✅ All migrations completed');
}

// ==========================================
// AUTH MIDDLEWARE
// ==========================================
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(authHeader.substring(7), process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

async function logAudit(action, module, recordId, details, performedBy, branchId = null) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (action, module, record_id, details, performed_by, branch_id) VALUES ($1,$2,$3,$4,$5,$6)`,
      [action, module, recordId, details, performedBy, branchId]
    );
  } catch (e) { console.error('Audit error:', e.message); }
}

// ==========================================
// ROOT & AUTH
// ==========================================
app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'Bharat Transport TMS v6.0' });
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });

    const result = await pool.query(
      `SELECT u.*, b.branch_code, b.branch_name FROM users u 
       LEFT JOIN branches b ON u.branch_id = b.id 
       WHERE u.username = $1`, [username]
    );

    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const user = result.rows[0];

    let valid = false;
    if (user.password && user.password.startsWith('$2')) {
      valid = await bcrypt.compare(password, user.password).catch(() => false);
    } else {
      valid = (password === user.password);
    }

    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role || 'admin', branch_id: user.branch_id, branch_code: user.branch_code },
      process.env.JWT_SECRET, { expiresIn: '7d' }
    );

    res.json({
      success: true, token,
      user: { id: user.id, username: user.username, role: user.role || 'admin', branch_id: user.branch_id, branch_code: user.branch_code, branch_name: user.branch_name }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// DASHBOARD STATS
// ==========================================
app.get('/api/dashboard/stats', authMiddleware, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = today.substring(0, 7);

    const userRole = req.user?.role || 'admin';
    const branchId = req.user?.branch_id ? parseInt(req.user.branch_id) : null;
    const branchCode = req.user?.branch_code || 'All';
    const isAdmin = userRole === 'admin' || !branchId;

    const whereBranch = isAdmin ? '' : `WHERE branch_id = ${branchId}`;
    const andBranch = isAdmin ? '' : `AND branch_id = ${branchId}`;

    const queries = [
      pool.query(`SELECT COUNT(*) as count FROM consignments WHERE lr_date = $1 ${andBranch}`, [today]),
      pool.query(`SELECT COUNT(*) as count FROM consignments WHERE to_char(lr_date, 'YYYY-MM') = $1 ${andBranch}`, [thisMonth]),
      pool.query(`SELECT COUNT(*) as count FROM consignments WHERE 1=1 ${andBranch}`),
      pool.query(`SELECT COUNT(*) as count FROM consignments WHERE status IN ('Booked','In-Transit') ${andBranch}`),
      pool.query(`SELECT COUNT(*) as count FROM consignments WHERE COALESCE(payment_status, 'Unpaid') = 'Paid' ${andBranch}`),
      pool.query(`SELECT COUNT(*) as count FROM bill_book ${whereBranch}`),
      pool.query(`SELECT COUNT(*) as count FROM bill_book ${whereBranch} ${whereBranch ? 'AND' : 'WHERE'} COALESCE(payment_status, 'Unpaid') = 'Unpaid'`),
      pool.query(`SELECT COUNT(*) as count FROM money_receipts ${whereBranch}`),
      pool.query(`SELECT COUNT(*) as count FROM parties WHERE COALESCE(is_active, TRUE) = TRUE`),
      pool.query(`SELECT COUNT(*) as count FROM customers WHERE COALESCE(is_active, TRUE) = TRUE`),
      pool.query(`SELECT COALESCE(SUM(CAST(grand_total AS NUMERIC)), 0) as total FROM consignments WHERE COALESCE(payment_status, 'Unpaid') = 'Paid' ${andBranch}`),
      pool.query(`SELECT COALESCE(SUM(CAST(grand_total AS NUMERIC)), 0) as total FROM consignments WHERE COALESCE(payment_status, 'Unpaid') = 'Unpaid' ${andBranch}`),
      pool.query(`SELECT COUNT(*) as count FROM pod_records WHERE COALESCE(status, 'Pending') = 'Pending' ${andBranch}`),
      pool.query(`SELECT COUNT(*) as count FROM drivers WHERE COALESCE(status, 'Active') = 'Active'`),
      pool.query(`SELECT COUNT(*) as count FROM vehicles WHERE COALESCE(status, 'Active') = 'Active'`),
      pool.query(`SELECT COUNT(*) as count FROM claims WHERE COALESCE(status, 'Open') = 'Open' ${andBranch}`),
      pool.query(`SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE expense_date >= $1 ${andBranch}`, [today]),
      pool.query(`SELECT COUNT(*) as count FROM branches WHERE COALESCE(is_active, TRUE) = TRUE`),
      pool.query(`SELECT COALESCE(SUM(CAST(grand_total AS NUMERIC)), 0) as total FROM consignments WHERE lr_date = $1 AND COALESCE(payment_status, 'Unpaid') = 'Paid' ${andBranch}`, [today]),
      pool.query(`SELECT COALESCE(SUM(CAST(grand_total AS NUMERIC)), 0) as total FROM consignments WHERE to_char(lr_date, 'YYYY-MM') = $1 AND COALESCE(payment_status, 'Unpaid') = 'Paid' ${andBranch}`, [thisMonth])
    ];

    const results = await Promise.all(queries);
    const get = (idx, field = 'count') => {
      const row = results[idx]?.rows?.[0];
      if (!row) return 0;
      return field === 'count' ? parseInt(row.count || 0) : parseFloat(row.total || 0);
    };

    res.json({
      today_lr: get(0), month_lr: get(1), total_lr: get(2),
      pending_lr: get(3), paid_lr: get(4), total_bills: get(5),
      pending_bills: get(6), total_mr: get(7), total_parties: get(8),
      total_customers: get(9), total_revenue: get(10, 'total'),
      pending_amount: get(11, 'total'), pending_pod: get(12),
      active_drivers: get(13), active_vehicles: get(14),
      open_claims: get(15), today_expenses: get(16, 'total'),
      total_branches: get(17), today_revenue: get(18, 'total'),
      month_revenue: get(19, 'total'),
      user_role: userRole, user_branch: branchCode, success: true
    });
  } catch (err) {
    console.error('Dashboard stats error:', err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/dashboard/recent', authMiddleware, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const branchCondition = isAdmin ? '' : `WHERE branch_id = ${parseInt(req.user.branch_id)}`;
    const [recentBilties, recentMR, recentClaims] = await Promise.all([
      pool.query(`SELECT lr_no, lr_date, consignor_name, consignee_name, grand_total, status, COALESCE(payment_status, 'Unpaid') as payment_status, created_at FROM consignments ${branchCondition} ORDER BY created_at DESC LIMIT 5`),
      pool.query(`SELECT mr_no, mr_date, party_name, amount, payment_mode, created_at FROM money_receipts ${branchCondition} ORDER BY created_at DESC LIMIT 5`),
      pool.query(`SELECT lr_no, claim_type, claim_amount, COALESCE(status, 'Open') as status, created_at FROM claims ${branchCondition} ORDER BY created_at DESC LIMIT 3`)
    ]);
    res.json({ bilties: recentBilties.rows, receipts: recentMR.rows, claims: recentClaims.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/dashboard/top-parties', authMiddleware, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const branchCondition = isAdmin ? '' : `WHERE branch_id = ${parseInt(req.user.branch_id)}`;
    const result = await pool.query(`
      SELECT consignor_name, consignor_code, COUNT(*) as total_bilties, SUM(CAST(grand_total AS NUMERIC)) as total_revenue
      FROM consignments ${branchCondition} GROUP BY consignor_name, consignor_code ORDER BY total_revenue DESC LIMIT 5
    `);
    res.json({ data: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// BRANCH MANAGEMENT
// ==========================================
app.get('/api/branches', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM branches WHERE COALESCE(is_active, TRUE) = TRUE ORDER BY branch_name');
    res.json({ data: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/branches', authMiddleware, async (req, res) => {
  try {
    const keys = Object.keys(req.body); const values = Object.values(req.body);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const result = await pool.query(`INSERT INTO branches (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`, values);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/branches/:id', authMiddleware, async (req, res) => {
  try {
    const id = req.params.id; const data = { ...req.body }; delete data.id; delete data.created_at;
    const keys = Object.keys(data); const values = Object.values(data);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', '); values.push(id);
    const result = await pool.query(`UPDATE branches SET ${setClause} WHERE id = $${values.length} RETURNING *`, values);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/branches/:id', authMiddleware, async (req, res) => {
  try { await pool.query('UPDATE branches SET is_active = FALSE WHERE id = $1', [req.params.id]); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// CONSIGNMENTS
// ==========================================
async function generateBiltyNo(branchCode) {
  const year = String(new Date().getFullYear()).slice(-2);
  const prefix = branchCode || 'BTC';
  const result = await pool.query(`SELECT lr_no FROM consignments WHERE lr_no LIKE $1 ORDER BY id DESC LIMIT 1`, [`${prefix}/${year}/%`]);
  let nextSerial = 1;
  if (result.rows.length > 0 && result.rows[0].lr_no) {
    const parts = result.rows[0].lr_no.split('/');
    if (parts.length === 3) nextSerial = parseInt(parts[2]) + 1;
  }
  return `${prefix}/${year}/${String(nextSerial).padStart(4, '0')}`;
}

// ✅ TRACK route को :id से ऊपर रखा (bug fix)
app.get('/api/consignments/track', async (req, res) => {
  try {
    const lr_no = req.query.lr_no;
    if (!lr_no) return res.status(400).json({ error: 'LR number required' });
    const result = await pool.query('SELECT lr_no, lr_date, from_name, to_name, consignor_name, consignee_name, status, pod_status, branch_code FROM consignments WHERE lr_no = $1', [lr_no]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Bilty not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/consignments', authMiddleware, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const branchCondition = isAdmin ? '' : `WHERE branch_id = ${parseInt(req.user.branch_id)}`;
    const result = await pool.query(`SELECT * FROM consignments ${branchCondition} ORDER BY id DESC LIMIT 500`);
    res.json({ data: result.rows, total: result.rows.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/consignments/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM consignments WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/consignments', authMiddleware, async (req, res) => {
  try {
    const c = { ...req.body };
    if (!c.branch_id) c.branch_id = req.user.branch_id;
    if (!c.branch_code && req.user.branch_code) c.branch_code = req.user.branch_code;
    if (!c.lr_no) c.lr_no = await generateBiltyNo(c.branch_code);
    if (!c.status) c.status = 'Booked';
    if (!c.payment_status) c.payment_status = c.basis_booking === 'PAID' ? 'Paid' : 'Unpaid';
    if (!c.created_by) c.created_by = req.user.username;
    if (!c.lr_date) c.lr_date = new Date().toISOString().split('T')[0];
    const keys = Object.keys(c); const values = Object.values(c);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const result = await pool.query(`INSERT INTO consignments (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`, values);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/consignments/:id', authMiddleware, async (req, res) => {
  try {
    const id = req.params.id; const data = { ...req.body }; delete data.id; delete data.created_at; data.updated_at = new Date().toISOString();
    const keys = Object.keys(data); const values = Object.values(data);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', '); values.push(id);
    const result = await pool.query(`UPDATE consignments SET ${setClause} WHERE id = $${values.length} RETURNING *`, values);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/consignments/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query("UPDATE consignments SET status = 'Cancelled' WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// POD
// ==========================================
app.get('/api/pod', authMiddleware, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const branchCondition = isAdmin ? '' : `WHERE branch_id = ${parseInt(req.user.branch_id)}`;
    const result = await pool.query(`SELECT * FROM pod_records ${branchCondition} ORDER BY id DESC LIMIT 200`);
    res.json({ data: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/pod', authMiddleware, async (req, res) => {
  try {
    const { lr_no, delivery_date, delivered_by, receiver_name, receiver_signature, receiver_phone, delivery_remarks, photo_url, branch_id } = req.body;
    const result = await pool.query(
      `INSERT INTO pod_records (lr_no, branch_id, delivery_date, delivered_by, receiver_name, receiver_signature, receiver_phone, delivery_remarks, photo_url, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'Delivered') RETURNING *`,
      [lr_no, branch_id || req.user.branch_id, delivery_date, delivered_by, receiver_name, receiver_signature, receiver_phone, delivery_remarks, photo_url]
    );
    await pool.query("UPDATE consignments SET pod_status = 'Delivered', pod_date = $1 WHERE lr_no = $2", [delivery_date, lr_no]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// DRIVERS & VEHICLES
// ==========================================
app.get('/api/drivers', authMiddleware, async (req, res) => {
  try { const result = await pool.query("SELECT * FROM drivers WHERE COALESCE(status, 'Active') = 'Active' ORDER BY driver_name"); res.json({ data: result.rows }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/drivers', authMiddleware, async (req, res) => {
  try {
    const keys = Object.keys(req.body); const values = Object.values(req.body);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const result = await pool.query(`INSERT INTO drivers (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`, values);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/drivers/:id', authMiddleware, async (req, res) => {
  try {
    const id = req.params.id; const data = { ...req.body }; delete data.id; delete data.created_at;
    const keys = Object.keys(data); const values = Object.values(data);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', '); values.push(id);
    const result = await pool.query(`UPDATE drivers SET ${setClause} WHERE id = $${values.length} RETURNING *`, values);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/vehicles', authMiddleware, async (req, res) => {
  try { const result = await pool.query("SELECT * FROM vehicles WHERE COALESCE(status, 'Active') = 'Active' ORDER BY vehicle_no"); res.json({ data: result.rows }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/vehicles', authMiddleware, async (req, res) => {
  try {
    const keys = Object.keys(req.body); const values = Object.values(req.body);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const result = await pool.query(`INSERT INTO vehicles (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`, values);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/vehicles/expiring', authMiddleware, async (req, res) => {
  try {
    const thirtyDays = new Date(); thirtyDays.setDate(thirtyDays.getDate() + 30);
    const result = await pool.query(
      `SELECT * FROM vehicles WHERE insurance_expiry <= $1 OR fitness_expiry <= $1 OR permit_expiry <= $1 OR rc_expiry <= $1 ORDER BY insurance_expiry ASC`,
      [thirtyDays.toISOString().split('T')[0]]
    );
    res.json({ data: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// FREIGHT RATES, MATERIALS, ROUTES
// ==========================================
app.get('/api/freight-rates', authMiddleware, async (req, res) => {
  try { const result = await pool.query("SELECT * FROM freight_rates WHERE COALESCE(is_active, TRUE) = TRUE ORDER BY from_city, to_city"); res.json({ data: result.rows }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/freight-rates', authMiddleware, async (req, res) => {
  try {
    const keys = Object.keys(req.body); const values = Object.values(req.body);
    const result = await pool.query(`INSERT INTO freight_rates (${keys.join(', ')}) VALUES (${keys.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *`, values);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/materials', authMiddleware, async (req, res) => {
  try { const result = await pool.query("SELECT * FROM materials WHERE COALESCE(is_active, TRUE) = TRUE ORDER BY material_name"); res.json({ data: result.rows }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/materials', authMiddleware, async (req, res) => {
  try {
    const keys = Object.keys(req.body); const values = Object.values(req.body);
    const result = await pool.query(`INSERT INTO materials (${keys.join(', ')}) VALUES (${keys.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *`, values);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/routes', authMiddleware, async (req, res) => {
  try { const result = await pool.query("SELECT * FROM routes WHERE COALESCE(is_active, TRUE) = TRUE ORDER BY from_city, to_city"); res.json({ data: result.rows }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/routes', authMiddleware, async (req, res) => {
  try {
    const keys = Object.keys(req.body); const values = Object.values(req.body);
    const result = await pool.query(`INSERT INTO routes (${keys.join(', ')}) VALUES (${keys.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *`, values);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// PARTY LEDGER & OUTSTANDING
// ==========================================
app.get('/api/ledger/:partyCode', authMiddleware, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const branchCondition = isAdmin ? '' : `AND branch_id = ${parseInt(req.user.branch_id)}`;
    const result = await pool.query(`SELECT * FROM party_ledger WHERE party_code = $1 ${branchCondition} ORDER BY transaction_date DESC`, [req.params.partyCode]);
    const balance = await pool.query(`SELECT COALESCE(SUM(debit),0) - COALESCE(SUM(credit),0) as balance FROM party_ledger WHERE party_code = $1 ${branchCondition}`, [req.params.partyCode]);
    res.json({ data: result.rows, balance: parseFloat(balance.rows[0].balance || 0) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/ledger', authMiddleware, async (req, res) => {
  try {
    const keys = Object.keys(req.body); const values = Object.values(req.body);
    const result = await pool.query(`INSERT INTO party_ledger (${keys.join(', ')}) VALUES (${keys.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *`, values);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/outstanding', authMiddleware, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const branchCondition = isAdmin ? '' : `WHERE branch_id = ${parseInt(req.user.branch_id)}`;
    const result = await pool.query(
      `SELECT consignor_name as party_name, consignor_code as party_code, branch_code, COUNT(*) as total_bilties,
       SUM(CASE WHEN COALESCE(payment_status, 'Unpaid') = 'Unpaid' THEN CAST(grand_total AS NUMERIC) ELSE 0 END) as pending_amount,
       SUM(CAST(grand_total AS NUMERIC)) as total_amount FROM consignments ${branchCondition}
       GROUP BY consignor_name, consignor_code, branch_code
       HAVING SUM(CASE WHEN COALESCE(payment_status, 'Unpaid') = 'Unpaid' THEN CAST(grand_total AS NUMERIC) ELSE 0 END) > 0 ORDER BY pending_amount DESC`
    );
    res.json({ data: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// EXPENSES, CLAIMS, COMMISSIONS
// ==========================================
app.get('/api/expenses', authMiddleware, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const branchCondition = isAdmin ? '' : `WHERE branch_id = ${parseInt(req.user.branch_id)}`;
    const result = await pool.query(`SELECT * FROM expenses ${branchCondition} ORDER BY expense_date DESC LIMIT 200`);
    res.json({ data: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/expenses', authMiddleware, async (req, res) => {
  try {
    const data = { ...req.body }; if (!data.branch_id) data.branch_id = req.user.branch_id;
    const keys = Object.keys(data); const values = Object.values(data);
    const result = await pool.query(`INSERT INTO expenses (${keys.join(', ')}) VALUES (${keys.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *`, values);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/claims', authMiddleware, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const branchCondition = isAdmin ? '' : `WHERE branch_id = ${parseInt(req.user.branch_id)}`;
    const result = await pool.query(`SELECT * FROM claims ${branchCondition} ORDER BY id DESC`);
    res.json({ data: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/claims', authMiddleware, async (req, res) => {
  try {
    const data = { ...req.body }; if (!data.branch_id) data.branch_id = req.user.branch_id;
    const keys = Object.keys(data); const values = Object.values(data);
    const result = await pool.query(`INSERT INTO claims (${keys.join(', ')}) VALUES (${keys.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *`, values);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/claims/:id', authMiddleware, async (req, res) => {
  try {
    const id = req.params.id; const data = { ...req.body }; delete data.id; delete data.created_at;
    const keys = Object.keys(data); const values = Object.values(data);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', '); values.push(id);
    const result = await pool.query(`UPDATE claims SET ${setClause} WHERE id = $${values.length} RETURNING *`, values);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/commissions', authMiddleware, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const branchCondition = isAdmin ? '' : `WHERE branch_id = ${parseInt(req.user.branch_id)}`;
    const result = await pool.query(`SELECT * FROM commissions ${branchCondition} ORDER BY id DESC`);
    res.json({ data: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/commissions', authMiddleware, async (req, res) => {
  try {
    const data = { ...req.body }; if (!data.branch_id) data.branch_id = req.user.branch_id;
    const keys = Object.keys(data); const values = Object.values(data);
    const result = await pool.query(`INSERT INTO commissions (${keys.join(', ')}) VALUES (${keys.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *`, values);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// PARTIES, BILLS, MONEY RECEIPTS
// ==========================================
app.get('/api/parties', authMiddleware, async (req, res) => {
  try { const result = await pool.query('SELECT * FROM parties WHERE COALESCE(is_active, TRUE) = TRUE ORDER BY party_name'); res.json({ data: result.rows }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/parties', authMiddleware, async (req, res) => {
  try {
    const { party_code, party_name, address, gst_no, email, phone } = req.body;
    const result = await pool.query(
      `INSERT INTO parties (party_code, party_name, address, gst_no, email, phone) VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT(party_code) DO UPDATE SET party_name=EXCLUDED.party_name, address=EXCLUDED.address, gst_no=EXCLUDED.gst_no RETURNING *`,
      [party_code, party_name, address || '', gst_no || '', email || '', phone || '']
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/bills', authMiddleware, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const branchCondition = isAdmin ? '' : `WHERE branch_id = ${parseInt(req.user.branch_id)}`;
    const result = await pool.query(`SELECT * FROM bill_book ${branchCondition} ORDER BY id DESC LIMIT 500`);
    res.json({ data: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/bills/:billNo', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM bill_book WHERE bill_no = $1`, [req.params.billNo]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Bill not found' });
    const bill = result.rows[0];
    const itemsResult = await pool.query(`SELECT * FROM bill_items WHERE bill_id = $1`, [bill.id]);
    res.json({ ...bill, items: itemsResult.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/bills', authMiddleware, async (req, res) => {
  try {
    const b = { ...req.body }
    const items = b.items || []
    delete b.items

    if (!b.branch_id) b.branch_id = req.user.branch_id
    if (!b.bill_date) b.bill_date = new Date().toISOString().split('T')[0]
    if (!b.status) b.status = 'Pending'
    if (!b.payment_status) b.payment_status = 'Unpaid'
    if (!b.bill_no) {
      const year = String(new Date().getFullYear()).slice(-2)
      const countRes = await pool.query(`SELECT COUNT(*) as count FROM bill_book`)
      const nextNum = parseInt(countRes.rows[0].count || 0) + 1
      b.bill_no = `BILL/${year}/${String(nextNum).padStart(3, '0')}`
    }

    const keys = Object.keys(b)
    const values = Object.values(b)
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ')
    const result = await pool.query(
      `INSERT INTO bill_book (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`,
      values
    )
    const billId = result.rows[0].id

    if (items && items.length > 0) {
      for (const item of items) {
        if (item.lr_no || item.invoice_no || item.total > 0) {
          await pool.query(
            `INSERT INTO bill_items (bill_id, lr_no, invoice_no, from_name, to_name, weight_mt, packages, freight, loading, unloading, other_charges, total) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
              billId,
              item.lr_no || null,
              item.invoice_no || null,
              item.from_name || null,
              item.to_name || null,
              parseFloat(item.weight_mt) || 0,
              parseInt(item.packages) || 0,
              parseFloat(item.freight) || 0,
              parseFloat(item.loading) || 0,
              parseFloat(item.unloading) || 0,
              parseFloat(item.other_charges) || 0,
              parseFloat(item.total) || 0
            ]
          )
        }
      }
    }

    res.json(result.rows[0])
  } catch (err) {
    console.error('Bill create error:', err.message)
    res.status(500).json({ error: err.message })
  }
});

// ==========================================
// MR (MONEY RECEIPTS)
// ==========================================
app.get('/api/mr', authMiddleware, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const branchCondition = isAdmin ? '' : `WHERE branch_id = ${parseInt(req.user.branch_id)}`;
    const result = await pool.query(`SELECT * FROM money_receipts ${branchCondition} ORDER BY id DESC LIMIT 500`);
    res.json({ data: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/mr/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM money_receipts WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'MR not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/mr', authMiddleware, async (req, res) => {
  try {
    const { mr_no, mr_date, party_type, party_name, bilty_id, bilty_lr_no, bill_id, bill_no, amount, payment_mode, is_advance, remarks } = req.body;
    let finalMRNo = mr_no;
    if (!finalMRNo || finalMRNo === 'Auto-generated') {
      const year = new Date().getFullYear().toString().slice(-2);
      const lastMR = await pool.query(`SELECT mr_no FROM money_receipts WHERE mr_no LIKE $1 ORDER BY id DESC LIMIT 1`, [`MR/${year}/%`]);
      let nextNum = 1;
      if (lastMR.rows.length > 0 && lastMR.rows[0].mr_no) {
        const parts = lastMR.rows[0].mr_no.split('/'); nextNum = parseInt(parts[2] || '0') + 1;
      }
      finalMRNo = `MR/${year}/${String(nextNum).padStart(4, '0')}`;
    }
    const branchId = req.body.branch_id || req.user.branch_id;
    const result = await pool.query(
      `INSERT INTO money_receipts (mr_no, mr_date, branch_id, party_type, party_name, bilty_id, bilty_lr_no, bill_id, bill_no, amount, payment_mode, is_advance, remarks, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [finalMRNo, mr_date || new Date().toISOString().split('T')[0], branchId, party_type, party_name, bilty_id || null, bilty_lr_no || null, bill_id || null, bill_no || null, parseFloat(amount || 0), payment_mode || 'Cash', is_advance || false, remarks || '', req.user.username]
    );
    if (bilty_id) await pool.query(`UPDATE consignments SET payment_status = 'Paid', mr_no = $1 WHERE id = $2`, [finalMRNo, bilty_id]);
    if (bill_id) await pool.query(`UPDATE bill_book SET payment_status = 'Paid', mr_no = $1 WHERE id = $2`, [finalMRNo, bill_id]);
    res.json({ success: true, mr_no: finalMRNo, data: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/mr/:id', authMiddleware, async (req, res) => {
  try { await pool.query('DELETE FROM money_receipts WHERE id = $1', [req.params.id]); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// AUDIT, CUSTOMERS, GATE PASS, GADI CHALLAN
// ==========================================
app.get('/api/audit', authMiddleware, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const branchCondition = isAdmin ? '' : `WHERE branch_id = ${parseInt(req.user.branch_id)}`;
    const result = await pool.query(`SELECT * FROM audit_logs ${branchCondition} ORDER BY id DESC LIMIT 200`);
    res.json({ data: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/customers', authMiddleware, async (req, res) => {
  try { const result = await pool.query('SELECT * FROM customers WHERE COALESCE(is_active, TRUE) = TRUE ORDER BY customer_name'); res.json(result.rows); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/gate-pass', authMiddleware, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const branchCondition = isAdmin ? '' : `WHERE branch_id = ${parseInt(req.user.branch_id)}`;
    const result = await pool.query(`SELECT * FROM gate_passes ${branchCondition} ORDER BY id DESC LIMIT 100`);
    res.json({ data: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/gate-pass', authMiddleware, async (req, res) => {
  try {
    const { lr_no, vehicle_no, driver_name, driver_mobile, material_desc, quantity, weight, valid_until, issued_by } = req.body;
    const branchId = req.body.branch_id || req.user.branch_id;
    const year = String(new Date().getFullYear()).slice(-2);
    const result = await pool.query(`SELECT pass_no FROM gate_passes WHERE pass_no LIKE $1 ORDER BY id DESC LIMIT 1`, [`GP/${year}/%`]);
    let nextSerial = 1;
    if (result.rows.length > 0 && result.rows[0].pass_no) {
      const parts = result.rows[0].pass_no.split('/'); if (parts.length === 3) nextSerial = parseInt(parts[2]) + 1;
    }
    const pass_no = `GP/${year}/${String(nextSerial).padStart(4, '0')}`;
    const row = await pool.query(
      `INSERT INTO gate_passes (pass_no, branch_id, lr_no, vehicle_no, driver_name, driver_mobile, material_desc, quantity, weight, valid_until, issued_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [pass_no, branchId, lr_no, vehicle_no, driver_name, driver_mobile, material_desc, quantity, weight, valid_until, issued_by]
    );
    res.json(row.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GADI CHALLAN
app.get('/api/gadi-challan', authMiddleware, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const branchCondition = isAdmin ? '' : `WHERE branch_id = ${parseInt(req.user.branch_id)}`;
    const result = await pool.query(`SELECT * FROM gadi_challans ${branchCondition} ORDER BY id DESC LIMIT 100`);
    res.json({ data: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/gadi-challan/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM gadi_challans WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Challan not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/gadi-challan', authMiddleware, async (req, res) => {
  try {
    const c = { ...req.body }; if (!c.branch_id) c.branch_id = req.user.branch_id;
    const year = String(new Date().getFullYear()).slice(-2);
    const result = await pool.query(`SELECT challan_no FROM gadi_challans WHERE challan_no LIKE $1 ORDER BY id DESC LIMIT 1`, [`GC/${year}/%`]);
    let nextSerial = 1;
    if (result.rows.length > 0 && result.rows[0].challan_no) {
      const parts = result.rows[0].challan_no.split('/'); if (parts.length === 3) nextSerial = parseInt(parts[2]) + 1;
    }
    c.challan_no = `GC/${year}/${String(nextSerial).padStart(4, '0')}`;
    const numericFields = ['freight_amount', 'advance_paid', 'balance_due', 'toll_expense', 'diesel_expense', 'other_expense', 'tds_deduction', 'net_payable', 'broker_commission'];
    numericFields.forEach(field => { if (c[field] === '' || c[field] === null || c[field] === undefined) c[field] = null; else c[field] = parseFloat(c[field]); });
    const keys = Object.keys(c); const values = Object.values(c);
    const row = await pool.query(`INSERT INTO gadi_challans (${keys.join(', ')}) VALUES (${keys.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *`, values);
    res.json(row.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// TRANSIT / MANIFEST MODULE
// ==========================================
app.get('/api/manifests', authMiddleware, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const branchCondition = isAdmin ? '' : `WHERE m.branch_id = ${parseInt(req.user.branch_id)}`;
    const result = await pool.query(`
      SELECT m.*, COUNT(mi.id) as total_lrs, STRING_AGG(mi.lr_no, ', ') as lr_nos
      FROM manifests m LEFT JOIN manifest_items mi ON m.id = mi.manifest_id
      ${branchCondition} GROUP BY m.id ORDER BY m.created_at DESC LIMIT 200
    `);
    res.json({ data: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/manifests', authMiddleware, async (req, res) => {
  try {
    const { manifest_no, manifest_date, branch_id, from_branch, to_branch, vehicle_no, driver_name, driver_mobile, lr_nos, status, remarks } = req.body;
    const bId = branch_id || req.user.branch_id;
    const year = String(new Date().getFullYear()).slice(-2);
    let finalManifestNo = manifest_no;
    if (!finalManifestNo) {
      const lastManifest = await pool.query(`SELECT manifest_no FROM manifests WHERE manifest_no LIKE $1 ORDER BY id DESC LIMIT 1`, [`MF/${year}/%`]);
      let nextSerial = 1;
      if (lastManifest.rows.length > 0 && lastManifest.rows[0].manifest_no) {
        const parts = lastManifest.rows[0].manifest_no.split('/'); nextSerial = parseInt(parts[2] || '0') + 1;
      }
      finalManifestNo = `MF/${year}/${String(nextSerial).padStart(4, '0')}`;
    }
    const result = await pool.query(
      `INSERT INTO manifests (manifest_no, manifest_date, branch_id, from_branch, to_branch, vehicle_no, driver_name, driver_mobile, status, remarks, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [finalManifestNo, manifest_date || new Date().toISOString().split('T')[0], bId, from_branch, to_branch, vehicle_no, driver_name, driver_mobile, status || 'Created', remarks || '', req.user.username]
    );
    const manifestId = result.rows[0].id;
    if (lr_nos && lr_nos.length > 0) {
      const lrArray = lr_nos.split(',').map(lr => lr.trim());
      for (const lr_no of lrArray) {
        await pool.query(`INSERT INTO manifest_items (manifest_id, lr_no, branch_id) VALUES ($1, $2, $3)`, [manifestId, lr_no, bId]);
        await pool.query(`UPDATE consignments SET status = 'In-Transit', lorry_no = $1, driver_name = $2 WHERE lr_no = $3`, [vehicle_no, driver_name, lr_no]);
      }
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// PUBLIC POD UPLOAD & VIEW
// ==========================================
app.post('/api/public/pod-upload', async (req, res) => {
  try {
    const { lr_no, delivery_date, delivered_by, receiver_name, receiver_phone, delivery_remarks, photo_url } = req.body;
    if (!lr_no) return res.status(400).json({ error: 'LR Number is required' });
    const biltyCheck = await pool.query('SELECT id, lr_no FROM consignments WHERE lr_no = $1', [lr_no]);
    if (biltyCheck.rows.length === 0) return res.status(404).json({ error: 'Bilty not found' });
    const finalDate = delivery_date || new Date().toISOString().split('T')[0];
    const result = await pool.query(
      `INSERT INTO pod_records (lr_no, branch_id, delivery_date, delivered_by, receiver_name, receiver_phone, delivery_remarks, photo_url, status)
       VALUES ($1, NULL, $2, $3, $4, $5, $6, $7, 'Delivered') RETURNING *`,
      [lr_no, finalDate, delivered_by || '', receiver_name || '', receiver_phone || '', delivery_remarks || '', photo_url || '']
    );
    await pool.query("UPDATE consignments SET pod_status = 'Delivered', pod_date = $1 WHERE lr_no = $2", [finalDate, lr_no]);
    res.json({ success: true, message: 'POD uploaded successfully!', data: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/public/pod-view', async (req, res) => {
  try {
    const lr_no = req.query.lr_no;
    if (!lr_no) return res.status(400).json({ error: 'LR Number is required' });
    const podResult = await pool.query(`SELECT * FROM pod_records WHERE lr_no = $1 ORDER BY created_at DESC LIMIT 1`, [lr_no]);
    const biltyResult = await pool.query(`SELECT lr_no, lr_date, consignor_name, consignee_name, from_name, to_name, packages, actual_weight, grand_total, status, pod_status FROM consignments WHERE lr_no = $1`, [lr_no]);
    if (podResult.rows.length === 0 && biltyResult.rows.length === 0) return res.status(404).json({ error: 'No POD or Bilty found' });
    res.json({ success: true, pod: podResult.rows[0] || null, bilty: biltyResult.rows[0] || null });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// TRIP MANAGEMENT MODULE
// ==========================================
app.get('/api/trips', authMiddleware, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const branchCondition = isAdmin ? '' : `WHERE branch_id = ${parseInt(req.user.branch_id)}`;
    const result = await pool.query(`SELECT * FROM trips ${branchCondition} ORDER BY trip_date DESC LIMIT 200`);
    res.json({ data: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/trips', authMiddleware, async (req, res) => {
  try {
    const t = { ...req.body }; if (!t.branch_id) t.branch_id = req.user.branch_id; if (!t.created_by) t.created_by = req.user.username;
    const year = String(new Date().getFullYear()).slice(-2);
    const result = await pool.query(`SELECT trip_no FROM trips WHERE trip_no LIKE $1 ORDER BY id DESC LIMIT 1`, [`TRP/${year}/%`]);
    let nextSerial = 1;
    if (result.rows.length > 0 && result.rows[0].trip_no) {
      const parts = result.rows[0].trip_no.split('/'); if (parts.length === 3) nextSerial = parseInt(parts[2]) + 1;
    }
    t.trip_no = `TRP/${year}/${String(nextSerial).padStart(4, '0')}`;
    const keys = Object.keys(t); const values = Object.values(t);
    const row = await pool.query(`INSERT INTO trips (${keys.join(', ')}) VALUES (${keys.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *`, values);
    res.json(row.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/trips/:id', authMiddleware, async (req, res) => {
  try {
    const id = req.params.id; const data = { ...req.body }; delete data.id; delete data.created_at; data.updated_at = new Date().toISOString();
    const keys = Object.keys(data); const values = Object.values(data);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', '); values.push(id);
    const result = await pool.query(`UPDATE trips SET ${setClause} WHERE id = $${values.length} RETURNING *`, values);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// SMART RATE ENGINE MODULE
// ==========================================
app.get('/api/rates', authMiddleware, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const branchCondition = isAdmin ? '' : `WHERE branch_id = ${parseInt(req.user.branch_id)}`;
    const result = await pool.query(`SELECT * FROM rate_contracts ${branchCondition} ORDER BY from_city, to_city, effective_from DESC`);
    res.json({ data: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/rates', authMiddleware, async (req, res) => {
  try {
    const r = { ...req.body }; if (!r.branch_id) r.branch_id = req.user.branch_id; if (!r.created_by) r.created_by = req.user.username;
    const keys = Object.keys(r); const values = Object.values(r);
    const row = await pool.query(`INSERT INTO rate_contracts (${keys.join(', ')}) VALUES (${keys.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *`, values);
    res.json(row.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/rates/:id', authMiddleware, async (req, res) => {
  try {
    const id = req.params.id; const data = { ...req.body }; delete data.id; delete data.created_at; data.updated_at = new Date().toISOString();
    const keys = Object.keys(data); const values = Object.values(data);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', '); values.push(id);
    const result = await pool.query(`UPDATE rate_contracts SET ${setClause} WHERE id = $${values.length} RETURNING *`, values);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/rates/:id', authMiddleware, async (req, res) => {
  try { await pool.query('DELETE FROM rate_contracts WHERE id = $1', [req.params.id]); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/rates/calculate', authMiddleware, async (req, res) => {
  try {
    const { from_city, to_city, weight_kg, packages, party_code } = req.body;
    if (!from_city || !to_city) return res.status(400).json({ error: 'From and To cities are required' });
    const today = new Date().toISOString().split('T')[0];
    let query = `SELECT * FROM rate_contracts WHERE from_city = $1 AND to_city = $2 AND effective_from <= $3 AND (effective_to IS NULL OR effective_to >= $3) AND COALESCE(is_active, TRUE) = TRUE`;
    const params = [from_city, to_city, today];
    if (party_code) { query += ` AND (party_code = $4 OR party_code IS NULL)`; params.push(party_code); }
    query += ` ORDER BY party_code DESC NULLS LAST, weight_from DESC LIMIT 1`;
    const result = await pool.query(query, params);
    if (result.rows.length === 0) return res.json({ found: false, message: 'No rate contract found', freight: 0 });
    const rate = result.rows[0]; let freight = 0;
    if (rate.rate_type === 'per_kg' && weight_kg) freight = parseFloat(weight_kg) * parseFloat(rate.rate_per_kg);
    else if (rate.rate_type === 'per_pkg' && packages) freight = parseFloat(packages) * parseFloat(rate.rate_per_pkg);
    else if (rate.rate_type === 'fixed') freight = parseFloat(rate.fixed_rate || 0);
    if (rate.min_charge && freight < parseFloat(rate.min_charge)) freight = parseFloat(rate.min_charge);
    res.json({ found: true, rate_contract: rate, freight: Math.round(freight * 100) / 100, calculation: { weight_kg, packages, rate_applied: rate.rate_type === 'per_kg' ? rate.rate_per_kg : rate.rate_per_pkg, min_charge: rate.min_charge } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// ADVANCED ACCOUNTING MODULE
// ==========================================
app.get('/api/accounts/summary', authMiddleware, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const branchCondition = isAdmin ? '' : `AND branch_id = ${parseInt(req.user.branch_id)}`;
    const branchWhere = isAdmin ? '' : `WHERE branch_id = ${parseInt(req.user.branch_id)}`;
    const receivableRes = await pool.query(`SELECT COALESCE(SUM(CAST(grand_total AS NUMERIC)), 0) as total FROM consignments WHERE COALESCE(payment_status, 'Unpaid') = 'Unpaid' ${branchCondition}`);
    const payableRes = await pool.query(`SELECT COALESCE(SUM(balance_due), 0) as total FROM gadi_challans WHERE balance_due > 0 ${branchCondition}`);
    const revenueRes = await pool.query(`SELECT COALESCE(SUM(CAST(grand_total AS NUMERIC)), 0) as total FROM consignments WHERE COALESCE(payment_status, 'Unpaid') = 'Paid' ${branchCondition}`);
    const expenseRes = await pool.query(`SELECT COALESCE(SUM(amount), 0) as total FROM expenses ${branchWhere}`);
    const tdsRes = await pool.query(`SELECT COALESCE(SUM(tds_deduction), 0) as total FROM gadi_challans ${branchCondition}`);
    res.json({
      success: true, data: {
        total_receivable: parseFloat(receivableRes.rows[0].total || 0), total_payable: parseFloat(payableRes.rows[0].total || 0),
        total_revenue: parseFloat(revenueRes.rows[0].total || 0), total_expenses: parseFloat(expenseRes.rows[0].total || 0),
        tds_pending: parseFloat(tdsRes.rows[0].total || 0), net_profit: parseFloat(revenueRes.rows[0].total || 0) - parseFloat(expenseRes.rows[0].total || 0)
      }
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/accounts/tds-register', authMiddleware, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const branchCondition = isAdmin ? `WHERE tds_deduction > 0` : `WHERE branch_id = ${parseInt(req.user.branch_id)} AND tds_deduction > 0`;
    const result = await pool.query(`SELECT challan_no, issue_date, broker_name, freight_amount, tds_deduction, net_payable FROM gadi_challans ${branchCondition} ORDER BY issue_date DESC LIMIT 200`);
    res.json({ data: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// E-WAY BILL MODULE
// ==========================================
app.get('/api/eway-bills', authMiddleware, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const branchCondition = isAdmin ? '' : `AND c.branch_id = ${parseInt(req.user.branch_id)}`;
    const result = await pool.query(`
      SELECT c.id, c.lr_no, c.lr_date, c.consignor_name, c.consignee_name, c.from_name, c.to_name, 
             c.declared_value, c.eway_bill_no, c.eway_valid_upto, c.transporter_id, c.transporter_name, c.status, c.from_state, c.to_state
      FROM consignments c
      WHERE CAST(c.declared_value AS NUMERIC) > CASE WHEN c.from_state IS NOT NULL AND c.to_state IS NOT NULL AND UPPER(TRIM(c.from_state)) = UPPER(TRIM(c.to_state)) THEN 100000 ELSE 50000 END ${branchCondition}
      ORDER BY c.lr_date DESC LIMIT 200
    `);
    res.json({ data: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/eway-bills/:id', authMiddleware, async (req, res) => {
  try {
    const id = req.params.id; const { eway_bill_no, eway_valid_upto, transporter_id, transporter_name } = req.body;
    const result = await pool.query(`UPDATE consignments SET eway_bill_no = $1, eway_valid_upto = $2, transporter_id = $3, transporter_name = $4, updated_at = NOW() WHERE id = $5 RETURNING id, lr_no, eway_bill_no`, [eway_bill_no || null, eway_valid_upto || null, transporter_id || null, transporter_name || null, id]);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// USER MANAGEMENT MODULE
// ==========================================
app.get('/api/users', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Only admin can view all users' });
    const result = await pool.query(`SELECT u.id, u.username, u.full_name, u.role, u.branch_id, COALESCE(u.is_active, TRUE) as is_active, u.created_at, b.branch_code, b.branch_name, b.city FROM users u LEFT JOIN branches b ON u.branch_id = b.id ORDER BY u.created_at DESC`);
    res.json({ data: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/users', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Only admin can create users' });
    const { username, password, full_name, role, branch_id } = req.body;
    if (!username || !password || !full_name || !role) return res.status(400).json({ error: 'All fields are required' });
    const existing = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Username already exists' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(`INSERT INTO users (username, password, full_name, role, branch_id, is_active) VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING id, username, full_name, role, branch_id`, [username, hashedPassword, full_name, role, branch_id || null]);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/users/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Only admin can update users' });
    const id = req.params.id; const { full_name, role, branch_id, is_active, password } = req.body;
    let query = `UPDATE users SET full_name = $1, role = $2, branch_id = $3, is_active = $4`;
    const params = [full_name, role, branch_id || null, is_active !== undefined ? is_active : true];
    let paramCount = 4;
    if (password) { paramCount++; const hashedPassword = await bcrypt.hash(password, 10); query += `, password = $${paramCount}`; params.push(hashedPassword); }
    paramCount++; query += ` WHERE id = $${paramCount} RETURNING id, username, full_name, role, branch_id, is_active`; params.push(id);
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/users/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Only admin can delete users' });
    const id = req.params.id;
    if (parseInt(id) === req.user.id) return res.status(400).json({ error: 'Cannot delete your own account' });
    await pool.query('UPDATE users SET is_active = FALSE WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// START SERVER
// ==========================================
async function ensureAdminUser() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const result = await pool.query('SELECT id FROM users WHERE username = $1', ['admin']);
    if (result.rows.length === 0) {
      await pool.query(`INSERT INTO users (username, password, full_name, role, is_active) VALUES ($1, $2, $3, $4, $5)`, ['admin', hashedPassword, 'Administrator', 'admin', true]);
      console.log('✅ Admin user created (admin / admin123)');
    }
  } catch (err) { console.error('Admin setup error:', err.message); }
}

async function startServer() {
  await runMigrations();
  await ensureAdminUser();
  app.listen(PORT, HOST, () => {
    console.log(`✅ Bharat Transport TMS v6.0 running on port ${PORT}`);
  });
}

startServer();
module.exports = app;
