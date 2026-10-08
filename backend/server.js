const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

if (process.env.NODE_ENV !== 'production') require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20,
});

// ==========================================
// ALL DATABASE TABLES (MULTI-BRANCH READY)
// ==========================================
async function createTables() {
  const tables = [
    // ===== BRANCH MANAGEMENT =====
    `CREATE TABLE IF NOT EXISTS branches (
      id SERIAL PRIMARY KEY,
      branch_code TEXT UNIQUE NOT NULL,
      branch_name TEXT NOT NULL,
      address TEXT,
      city TEXT,
      state TEXT,
      pincode TEXT,
      phone TEXT,
      email TEXT,
      gst_no TEXT,
      pan_no TEXT,
      manager_name TEXT,
      manager_phone TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // ===== USERS & ROLES =====
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      full_name TEXT,
      role TEXT DEFAULT 'operator',
      branch_id INTEGER REFERENCES branches(id),
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // ===== PARTIES (Shared across branches) =====
    `CREATE TABLE IF NOT EXISTS parties (
      id SERIAL PRIMARY KEY,
      party_code TEXT UNIQUE NOT NULL,
      party_name TEXT NOT NULL,
      party_type TEXT DEFAULT 'Consignor',
      address TEXT,
      city TEXT,
      state TEXT,
      pincode TEXT,
      gst_no TEXT,
      pan_no TEXT,
      email TEXT,
      phone TEXT,
      mobile TEXT,
      contact_person TEXT,
      credit_days INTEGER DEFAULT 0,
      opening_balance NUMERIC DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      customer_name TEXT NOT NULL,
      customer_code TEXT UNIQUE,
      address TEXT,
      gst_no TEXT,
      email TEXT,
      phone TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // ===== DRIVER MASTER (Shared) =====
    `CREATE TABLE IF NOT EXISTS drivers (
      id SERIAL PRIMARY KEY,
      driver_code TEXT UNIQUE NOT NULL,
      driver_name TEXT NOT NULL,
      father_name TEXT,
      aadhar_no TEXT,
      license_no TEXT,
      license_expiry DATE,
      phone TEXT,
      address TEXT,
      photo_url TEXT,
      joining_date DATE,
      status TEXT DEFAULT 'Active',
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // ===== VEHICLE MASTER (Shared) =====
    `CREATE TABLE IF NOT EXISTS vehicles (
      id SERIAL PRIMARY KEY,
      vehicle_no TEXT UNIQUE NOT NULL,
      vehicle_type TEXT,
      owner_name TEXT,
      owner_phone TEXT,
      rc_expiry DATE,
      insurance_expiry DATE,
      fitness_expiry DATE,
      permit_expiry DATE,
      puc_expiry DATE,
      status TEXT DEFAULT 'Active',
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // ===== FREIGHT RATE MASTER =====
    `CREATE TABLE IF NOT EXISTS freight_rates (
      id SERIAL PRIMARY KEY,
      from_city TEXT NOT NULL,
      to_city TEXT NOT NULL,
      material TEXT,
      rate_per_kg NUMERIC,
      rate_per_pkg NUMERIC,
      min_charge NUMERIC,
      distance_km NUMERIC,
      effective_from DATE,
      effective_to DATE,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // ===== MATERIAL MASTER =====
    `CREATE TABLE IF NOT EXISTS materials (
      id SERIAL PRIMARY KEY,
      material_name TEXT UNIQUE NOT NULL,
      material_code TEXT,
      hsn_code TEXT,
      category TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // ===== ROUTE MASTER =====
    `CREATE TABLE IF NOT EXISTS routes (
      id SERIAL PRIMARY KEY,
      from_city TEXT NOT NULL,
      to_city TEXT NOT NULL,
      distance_km NUMERIC,
      via TEXT,
      estimated_days INTEGER,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // ===== CONSIGNMENTS (BILTY) - BRANCH TAGGED =====
    `CREATE TABLE IF NOT EXISTS consignments (
      id SERIAL PRIMARY KEY,
      lr_no TEXT UNIQUE NOT NULL,
      lr_date DATE,
      branch_id INTEGER REFERENCES branches(id),
      branch_code TEXT,
      from_name TEXT,
      to_name TEXT,
      consignor_code TEXT,
      consignor_name TEXT,
      consignor_address TEXT,
      consignor_gst TEXT,
      consignee_code TEXT,
      consignee_name TEXT,
      consignee_address TEXT,
      consignee_gst TEXT,
      invoice_no TEXT,
      invoice_date TEXT,
      po_no TEXT,
      lorry_no TEXT,
      driver_name TEXT,
      driver_mobile TEXT,
      delivery_type TEXT DEFAULT 'DOOR DELIVERY',
      packages TEXT,
      method_of_packing TEXT,
      hsn_code TEXT,
      actual_weight TEXT,
      charged_weight TEXT,
      material_desc TEXT,
      eway_bill_no TEXT,
      length TEXT,
      width TEXT,
      height TEXT,
      total_cft TEXT,
      declared_value TEXT,
      basis_party TEXT,
      basis_booking TEXT DEFAULT 'TO PAY',
      rv_no TEXT,
      rv_dt TEXT,
      rv_am TEXT,
      insurance_company TEXT,
      policy_no TEXT,
      insurance_amount TEXT,
      freight TEXT,
      aoc_percent TEXT,
      material_mgmt_ch TEXT,
      collection_charges TEXT,
      door_dly_charges TEXT,
      misc_charges TEXT,
      grand_total TEXT,
      status TEXT DEFAULT 'Booked',
      payment_status TEXT DEFAULT 'Unpaid',
      mr_no TEXT,
      pod_status TEXT DEFAULT 'Pending',
      pod_date DATE,
      pod_remarks TEXT,
      created_by TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,

    // ===== POD RECORDS =====
    `CREATE TABLE IF NOT EXISTS pod_records (
      id SERIAL PRIMARY KEY,
      lr_no TEXT NOT NULL,
      branch_id INTEGER REFERENCES branches(id),
      delivery_date DATE,
      delivered_by TEXT,
      receiver_name TEXT,
      receiver_signature TEXT,
      receiver_phone TEXT,
      delivery_remarks TEXT,
      photo_url TEXT,
      status TEXT DEFAULT 'Delivered',
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // ===== BILL BOOK =====
    `CREATE TABLE IF NOT EXISTS bill_book (
      id SERIAL PRIMARY KEY,
      bill_no TEXT UNIQUE,
      bill_date DATE,
      branch_id INTEGER REFERENCES branches(id),
      party_name TEXT,
      party_code TEXT,
      lr_nos TEXT,
      amount TEXT,
      gst_amount TEXT,
      total_amount TEXT,
      status TEXT DEFAULT 'Pending',
      payment_status TEXT DEFAULT 'Unpaid',
      mr_no TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,

    // ===== MONEY RECEIPTS =====
    `CREATE TABLE IF NOT EXISTS money_receipts (
      id SERIAL PRIMARY KEY,
      mr_no TEXT UNIQUE NOT NULL,
      mr_date DATE NOT NULL,
      branch_id INTEGER REFERENCES branches(id),
      party_type TEXT NOT NULL,
      party_name TEXT NOT NULL,
      bilty_id INTEGER REFERENCES consignments(id),
      bilty_lr_no TEXT,
      bill_id INTEGER REFERENCES bill_book(id),
      bill_no TEXT,
      amount NUMERIC NOT NULL,
      payment_mode TEXT DEFAULT 'Cash',
      is_advance BOOLEAN DEFAULT FALSE,
      remarks TEXT,
      created_by TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,

    // ===== PARTY LEDGER =====
    `CREATE TABLE IF NOT EXISTS party_ledger (
      id SERIAL PRIMARY KEY,
      party_code TEXT NOT NULL,
      branch_id INTEGER REFERENCES branches(id),
      transaction_date DATE,
      transaction_type TEXT,
      reference_no TEXT,
      debit NUMERIC DEFAULT 0,
      credit NUMERIC DEFAULT 0,
      balance NUMERIC DEFAULT 0,
      remarks TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // ===== EXPENSES =====
    `CREATE TABLE IF NOT EXISTS expenses (
      id SERIAL PRIMARY KEY,
      expense_date DATE,
      branch_id INTEGER REFERENCES branches(id),
      category TEXT,
      description TEXT,
      amount NUMERIC,
      payment_mode TEXT,
      bill_no TEXT,
      approved_by TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // ===== CLAIMS =====
    `CREATE TABLE IF NOT EXISTS claims (
      id SERIAL PRIMARY KEY,
      lr_no TEXT,
      branch_id INTEGER REFERENCES branches(id),
      claim_date DATE,
      claim_type TEXT,
      description TEXT,
      claim_amount NUMERIC,
      settled_amount NUMERIC,
      status TEXT DEFAULT 'Open',
      remarks TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // ===== COMMISSIONS =====
    `CREATE TABLE IF NOT EXISTS commissions (
      id SERIAL PRIMARY KEY,
      lr_no TEXT,
      branch_id INTEGER REFERENCES branches(id),
      agent_name TEXT,
      commission_percent NUMERIC,
      commission_amount NUMERIC,
      status TEXT DEFAULT 'Pending',
      paid_date DATE,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // ===== NOTIFICATIONS =====
    `CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      lr_no TEXT,
      party_name TEXT,
      phone TEXT,
      email TEXT,
      message TEXT,
      type TEXT,
      status TEXT DEFAULT 'Pending',
      sent_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // ===== AUDIT LOGS =====
    `CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      action TEXT NOT NULL,
      module TEXT NOT NULL,
      record_id TEXT,
      details TEXT,
      performed_by TEXT,
      branch_id INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // ===== GATE PASSES =====
    `CREATE TABLE IF NOT EXISTS gate_passes (
      id SERIAL PRIMARY KEY,
      pass_no TEXT UNIQUE NOT NULL,
      branch_id INTEGER REFERENCES branches(id),
      lr_no TEXT,
      vehicle_no TEXT,
      driver_name TEXT,
      driver_mobile TEXT,
      material_desc TEXT,
      quantity TEXT,
      weight TEXT,
      valid_until DATE,
      issued_by TEXT,
      qr_code TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // ===== GADI CHALLANS =====
    `CREATE TABLE IF NOT EXISTS gadi_challans (
      id SERIAL PRIMARY KEY,
      challan_no TEXT UNIQUE NOT NULL,
      branch_id INTEGER REFERENCES branches(id),
      lr_no TEXT,
      vehicle_no TEXT,
      driver_name TEXT,
      driver_mobile TEXT,
      driver_license TEXT,
      owner_name TEXT,
      owner_mobile TEXT,
      broker_name TEXT,
      broker_mobile TEXT,
      broker_commission TEXT,
      from_place TEXT,
      to_place TEXT,
      material_desc TEXT,
      weight TEXT,
      packages TEXT,
      bilty_date DATE,
      consignor_name TEXT,
      consignee_name TEXT,
      freight_amount NUMERIC,
      advance_paid NUMERIC,
      balance_due NUMERIC,
      toll_expense NUMERIC,
      diesel_expense NUMERIC,
      other_expense NUMERIC,
      tds_deduction NUMERIC,
      net_payable NUMERIC,
      issue_date DATE,
      created_at TIMESTAMP DEFAULT NOW()
    )`
  ];

  for (const sql of tables) {
    try {
      await pool.query(sql);
    } catch (err) {
      console.error('Table error:', err.message);
    }
  }
  console.log('✅ All multi-branch database tables ready');
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

// ==========================================
// AUDIT HELPER
// ==========================================
async function logAudit(action, module, recordId, details, performedBy, branchId = null) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (action, module, record_id, details, performed_by, branch_id) VALUES ($1,$2,$3,$4,$5,$6)`,
      [action, module, recordId, details, performedBy, branchId]
    );
  } catch (e) { console.error('Audit error:', e.message); }
}

// ==========================================
// ROOT
// ==========================================
app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'Bharat Transport TMS v6.0 - Multi-Branch Professional' });
});

// ==========================================
// AUTH
// ==========================================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await pool.query(
      `SELECT u.*, b.branch_code, b.branch_name FROM users u 
       LEFT JOIN branches b ON u.branch_id = b.id 
       WHERE u.username = $1 AND u.is_active = TRUE`,
      [username]
    );
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const user = result.rows[0];
    let valid = false;
    if (user.password && user.password.startsWith('$2')) {
      try { valid = await bcrypt.compare(password, user.password); } catch (e) { valid = false; }
    }
    if (!valid && password === user.password) valid = true;
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, branch_id: user.branch_id, branch_code: user.branch_code },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    await logAudit('LOGIN', 'AUTH', user.id, `User ${username} logged in`, username, user.branch_id);
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        branch_id: user.branch_id,
        branch_code: user.branch_code,
        branch_name: user.branch_name
      }
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// BRANCH MANAGEMENT APIs
// ==========================================
app.get('/api/branches', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM branches WHERE is_active = TRUE ORDER BY branch_name');
    res.json({ data: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/branches', authMiddleware, async (req, res) => {
  try {
    const keys = Object.keys(req.body);
    const values = Object.values(req.body);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const result = await pool.query(`INSERT INTO branches (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`, values);
    await logAudit('CREATE', 'BRANCH', result.rows[0].id, `Branch ${req.body.branch_name} created`, req.user.username);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/branches/:id', authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    const data = { ...req.body };
    delete data.id; delete data.created_at;
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    values.push(id);
    const result = await pool.query(`UPDATE branches SET ${setClause} WHERE id = $${values.length} RETURNING *`, values);
    await logAudit('UPDATE', 'BRANCH', id, `Branch updated`, req.user.username);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/branches/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('UPDATE branches SET is_active = FALSE WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// DASHBOARD STATS (MULTI-BRANCH)
// ==========================================
app.get('/api/dashboard/stats', authMiddleware, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = today.substring(0, 7);
    const branchId = req.query.branch_id; // Optional filter
    const branchFilter = branchId ? `AND branch_id = ${parseInt(branchId)}` : '';

    const results = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM consignments WHERE lr_date = $1 ${branchFilter}`, [today]),
      pool.query(`SELECT COUNT(*) FROM consignments WHERE lr_date LIKE $1 ${branchFilter}`, [`${thisMonth}%`]),
      pool.query(`SELECT COUNT(*) FROM consignments WHERE 1=1 ${branchFilter}`),
      pool.query(`SELECT COUNT(*) FROM consignments WHERE status IN ('Booked','In-Transit') ${branchFilter}`),
      pool.query(`SELECT COUNT(*) FROM consignments WHERE payment_status = 'Paid' ${branchFilter}`),
      pool.query(`SELECT COUNT(*) FROM bill_book WHERE 1=1 ${branchFilter}`),
      pool.query(`SELECT COUNT(*) FROM bill_book WHERE payment_status = 'Unpaid' ${branchFilter}`),
      pool.query(`SELECT COUNT(*) FROM money_receipts WHERE 1=1 ${branchFilter}`),
      pool.query('SELECT COUNT(*) FROM parties WHERE is_active = TRUE'),
      pool.query('SELECT COUNT(*) FROM customers WHERE is_active = TRUE'),
      pool.query(`SELECT COALESCE(SUM(CAST(grand_total AS NUMERIC)), 0) as total FROM consignments WHERE payment_status = 'Paid' ${branchFilter}`),
      pool.query(`SELECT COALESCE(SUM(CAST(grand_total AS NUMERIC)), 0) as total FROM consignments WHERE payment_status = 'Unpaid' ${branchFilter}`),
      pool.query(`SELECT COUNT(*) FROM pod_records WHERE status = 'Pending' ${branchFilter}`),
      pool.query("SELECT COUNT(*) FROM drivers WHERE status = 'Active'"),
      pool.query("SELECT COUNT(*) FROM vehicles WHERE status = 'Active'"),
      pool.query("SELECT COUNT(*) FROM claims WHERE status = 'Open'"),
      pool.query(`SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE expense_date >= $1 ${branchFilter}`, [today]),
      pool.query('SELECT COUNT(*) FROM branches WHERE is_active = TRUE')
    ]);

    res.json({
      today_lr: parseInt(results[0].rows[0].count),
      month_lr: parseInt(results[1].rows[0].count),
      total_lr: parseInt(results[2].rows[0].count),
      pending_lr: parseInt(results[3].rows[0].count),
      paid_lr: parseInt(results[4].rows[0].count),
      total_bills: parseInt(results[5].rows[0].count),
      pending_bills: parseInt(results[6].rows[0].count),
      total_mr: parseInt(results[7].rows[0].count),
      total_parties: parseInt(results[8].rows[0].count),
      total_customers: parseInt(results[9].rows[0].count),
      total_revenue: parseFloat(results[10].rows[0].total || 0),
      pending_amount: parseFloat(results[11].rows[0].total || 0),
      pending_pod: parseInt(results[12].rows[0].count),
      active_drivers: parseInt(results[13].rows[0].count),
      active_vehicles: parseInt(results[14].rows[0].count),
      open_claims: parseInt(results[15].rows[0].count),
      today_expenses: parseFloat(results[16].rows[0].total || 0),
      total_branches: parseInt(results[17].rows[0].count)
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Branch-wise stats for dashboard cards
app.get('/api/dashboard/branch-stats', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.branch_code, b.branch_name, b.city,
        COUNT(c.id) as total_lr,
        SUM(CASE WHEN c.payment_status = 'Paid' THEN COALESCE(CAST(c.grand_total AS NUMERIC), 0) ELSE 0 END) as revenue,
        SUM(CASE WHEN c.payment_status = 'Unpaid' THEN COALESCE(CAST(c.grand_total AS NUMERIC), 0) ELSE 0 END) as pending
      FROM branches b
      LEFT JOIN consignments c ON b.id = c.branch_id
      WHERE b.is_active = TRUE
      GROUP BY b.id, b.branch_code, b.branch_name, b.city
      ORDER BY revenue DESC
    `);
    res.json({ data: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// CONSIGNMENTS (BILTY) - BRANCH TAGGED
// ==========================================
async function generateBiltyNo(branchCode) {
  const year = String(new Date().getFullYear()).slice(-2);
  const prefix = branchCode ? `${branchCode}` : 'BTC';
  const result = await pool.query(`SELECT lr_no FROM consignments WHERE lr_no LIKE $1 ORDER BY id DESC LIMIT 1`, [`${prefix}/${year}/%`]);
  let nextSerial = 1;
  if (result.rows.length > 0 && result.rows[0].lr_no) {
    const parts = result.rows[0].lr_no.split('/');
    if (parts.length === 3) nextSerial = parseInt(parts[2]) + 1;
  }
  return `${prefix}/${year}/${String(nextSerial).padStart(4, '0')}`;
}

app.get('/api/consignments', authMiddleware, async (req, res) => {
  try {
    const branchId = req.query.branch_id;
    const where = branchId ? `WHERE branch_id = ${parseInt(branchId)}` : '';
    const result = await pool.query(`SELECT * FROM consignments ${where} ORDER BY id DESC LIMIT 500`);
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
    if (!c.branch_id && req.user.branch_id) c.branch_id = req.user.branch_id;
    if (!c.branch_code && req.user.branch_code) c.branch_code = req.user.branch_code;
    if (!c.lr_no) c.lr_no = await generateBiltyNo(c.branch_code || 'BTC');
    if (!c.status) c.status = 'Booked';
    if (!c.payment_status) c.payment_status = c.basis_booking === 'PAID' ? 'Paid' : 'Unpaid';
    if (!c.created_by) c.created_by = req.user.username;
    if (!c.lr_date) c.lr_date = new Date().toISOString().split('T')[0];
    
    const keys = Object.keys(c);
    const values = Object.values(c);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    
    const result = await pool.query(
      `INSERT INTO consignments (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`, values
    );
    await logAudit('CREATE', 'CONSIGNMENT', result.rows[0].id, `Bilty ${c.lr_no} created`, req.user.username, c.branch_id);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/consignments/:id', authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    const data = { ...req.body };
    delete data.id; delete data.created_at;
    data.updated_at = new Date().toISOString();
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    values.push(id);
    const result = await pool.query(`UPDATE consignments SET ${setClause} WHERE id = $${values.length} RETURNING *`, values);
    await logAudit('UPDATE', 'CONSIGNMENT', id, 'Bilty modified', req.user.username, data.branch_id);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/consignments/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query("UPDATE consignments SET status = 'Cancelled' WHERE id = $1", [req.params.id]);
    await logAudit('CANCEL', 'CONSIGNMENT', req.params.id, 'Bilty cancelled', req.user.username);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// POD (PROOF OF DELIVERY)
// ==========================================
app.get('/api/pod', authMiddleware, async (req, res) => {
  try {
    const branchId = req.query.branch_id;
    const where = branchId ? `WHERE branch_id = ${parseInt(branchId)}` : '';
    const result = await pool.query(`SELECT * FROM pod_records ${where} ORDER BY id DESC LIMIT 200`);
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
    await logAudit('POD', 'DELIVERY', lr_no, `POD submitted for ${lr_no}`, req.user.username, branch_id);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// DRIVERS
// ==========================================
app.get('/api/drivers', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM drivers WHERE status = 'Active' ORDER BY driver_name");
    res.json({ data: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/drivers', authMiddleware, async (req, res) => {
  try {
    const keys = Object.keys(req.body);
    const values = Object.values(req.body);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const result = await pool.query(`INSERT INTO drivers (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`, values);
    await logAudit('CREATE', 'DRIVER', result.rows[0].id, `Driver ${req.body.driver_name} added`, req.user.username);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/drivers/:id', authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    const data = { ...req.body };
    delete data.id; delete data.created_at;
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    values.push(id);
    const result = await pool.query(`UPDATE drivers SET ${setClause} WHERE id = $${values.length} RETURNING *`, values);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// VEHICLES + EXPIRY ALERTS
// ==========================================
app.get('/api/vehicles', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM vehicles WHERE status = 'Active' ORDER BY vehicle_no");
    res.json({ data: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/vehicles', authMiddleware, async (req, res) => {
  try {
    const keys = Object.keys(req.body);
    const values = Object.values(req.body);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const result = await pool.query(`INSERT INTO vehicles (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`, values);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/vehicles/expiring', authMiddleware, async (req, res) => {
  try {
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);
    const result = await pool.query(
      `SELECT * FROM vehicles WHERE 
       insurance_expiry <= $1 OR fitness_expiry <= $1 OR permit_expiry <= $1 OR rc_expiry <= $1
       ORDER BY insurance_expiry ASC`,
      [thirtyDays.toISOString().split('T')[0]]
    );
    res.json({ data: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// FREIGHT RATES
// ==========================================
app.get('/api/freight-rates', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM freight_rates WHERE is_active = TRUE ORDER BY from_city, to_city");
    res.json({ data: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/freight-rates', authMiddleware, async (req, res) => {
  try {
    const keys = Object.keys(req.body);
    const values = Object.values(req.body);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const result = await pool.query(`INSERT INTO freight_rates (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`, values);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// MATERIALS
// ==========================================
app.get('/api/materials', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM materials WHERE is_active = TRUE ORDER BY material_name");
    res.json({ data: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/materials', authMiddleware, async (req, res) => {
  try {
    const keys = Object.keys(req.body);
    const values = Object.values(req.body);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const result = await pool.query(`INSERT INTO materials (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`, values);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// ROUTES
// ==========================================
app.get('/api/routes', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM routes WHERE is_active = TRUE ORDER BY from_city, to_city");
    res.json({ data: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/routes', authMiddleware, async (req, res) => {
  try {
    const keys = Object.keys(req.body);
    const values = Object.values(req.body);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const result = await pool.query(`INSERT INTO routes (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`, values);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// PARTY LEDGER (BRANCH-WISE)
// ==========================================
app.get('/api/ledger/:partyCode', authMiddleware, async (req, res) => {
  try {
    const branchId = req.query.branch_id;
    const where = branchId ? `AND branch_id = ${parseInt(branchId)}` : '';
    const result = await pool.query(`SELECT * FROM party_ledger WHERE party_code = $1 ${where} ORDER BY transaction_date DESC`, [req.params.partyCode]);
    const balance = await pool.query(`SELECT COALESCE(SUM(debit),0) - COALESCE(SUM(credit),0) as balance FROM party_ledger WHERE party_code = $1 ${where}`, [req.params.partyCode]);
    res.json({ data: result.rows, balance: parseFloat(balance.rows[0].balance || 0) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/ledger', authMiddleware, async (req, res) => {
  try {
    const keys = Object.keys(req.body);
    const values = Object.values(req.body);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const result = await pool.query(`INSERT INTO party_ledger (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`, values);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// OUTSTANDING REPORT (BRANCH-WISE)
// ==========================================
app.get('/api/outstanding', authMiddleware, async (req, res) => {
  try {
    const branchId = req.query.branch_id;
    const where = branchId ? `WHERE branch_id = ${parseInt(branchId)}` : '';
    const result = await pool.query(
      `SELECT consignor_name as party_name, consignor_code as party_code, branch_code,
       COUNT(*) as total_bilties,
       SUM(CASE WHEN payment_status = 'Unpaid' THEN CAST(grand_total AS NUMERIC) ELSE 0 END) as pending_amount,
       SUM(CAST(grand_total AS NUMERIC)) as total_amount
       FROM consignments ${where}
       GROUP BY consignor_name, consignor_code, branch_code
       HAVING SUM(CASE WHEN payment_status = 'Unpaid' THEN CAST(grand_total AS NUMERIC) ELSE 0 END) > 0
       ORDER BY pending_amount DESC`
    );
    res.json({ data: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// EXPENSES
// ==========================================
app.get('/api/expenses', authMiddleware, async (req, res) => {
  try {
    const branchId = req.query.branch_id;
    const where = branchId ? `WHERE branch_id = ${parseInt(branchId)}` : '';
    const result = await pool.query(`SELECT * FROM expenses ${where} ORDER BY expense_date DESC LIMIT 200`);
    res.json({ data: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/expenses', authMiddleware, async (req, res) => {
  try {
    const data = { ...req.body };
    if (!data.branch_id) data.branch_id = req.user.branch_id;
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const result = await pool.query(`INSERT INTO expenses (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`, values);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// CLAIMS
// ==========================================
app.get('/api/claims', authMiddleware, async (req, res) => {
  try {
    const branchId = req.query.branch_id;
    const where = branchId ? `WHERE branch_id = ${parseInt(branchId)}` : '';
    const result = await pool.query(`SELECT * FROM claims ${where} ORDER BY id DESC`);
    res.json({ data: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/claims', authMiddleware, async (req, res) => {
  try {
    const data = { ...req.body };
    if (!data.branch_id) data.branch_id = req.user.branch_id;
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const result = await pool.query(`INSERT INTO claims (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`, values);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// COMMISSIONS
// ==========================================
app.get('/api/commissions', authMiddleware, async (req, res) => {
  try {
    const branchId = req.query.branch_id;
    const where = branchId ? `WHERE branch_id = ${parseInt(branchId)}` : '';
    const result = await pool.query(`SELECT * FROM commissions ${where} ORDER BY id DESC`);
    res.json({ data: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/commissions', authMiddleware, async (req, res) => {
  try {
    const data = { ...req.body };
    if (!data.branch_id) data.branch_id = req.user.branch_id;
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const result = await pool.query(`INSERT INTO commissions (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`, values);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// PARTIES
// ==========================================
app.get('/api/parties', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM parties WHERE is_active = TRUE ORDER BY party_name');
    res.json({ data: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/parties', authMiddleware, async (req, res) => {
  try {
    const { party_code, party_name, address, gst_no, email, phone } = req.body;
    const result = await pool.query(
      `INSERT INTO parties (party_code, party_name, address, gst_no, email, phone)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT(party_code) DO UPDATE SET party_name=EXCLUDED.party_name, address=EXCLUDED.address, gst_no=EXCLUDED.gst_no
       RETURNING *`,
      [party_code, party_name, address || '', gst_no || '', email || '', phone || '']
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// BILLS
// ==========================================
app.get('/api/bills', authMiddleware, async (req, res) => {
  try {
    const branchId = req.query.branch_id;
    const where = branchId ? `WHERE branch_id = ${parseInt(branchId)}` : '';
    const result = await pool.query(`SELECT * FROM bill_book ${where} ORDER BY id DESC LIMIT 500`);
    res.json({ data: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/bills', authMiddleware, async (req, res) => {
  try {
    const b = { ...req.body };
    if (!b.branch_id) b.branch_id = req.user.branch_id;
    if (!b.bill_date) b.bill_date = new Date().toISOString().split('T')[0];
    if (!b.status) b.status = 'Pending';
    if (!b.payment_status) b.payment_status = 'Unpaid';
    const keys = Object.keys(b);
    const values = Object.values(b);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const result = await pool.query(`INSERT INTO bill_book (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`, values);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// MONEY RECEIPTS
// ==========================================
app.get('/api/mr', authMiddleware, async (req, res) => {
  try {
    const branchId = req.query.branch_id;
    const where = branchId ? `WHERE branch_id = ${parseInt(branchId)}` : '';
    const result = await pool.query(`SELECT * FROM money_receipts ${where} ORDER BY id DESC LIMIT 500`);
    res.json({ data: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
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
        const parts = lastMR.rows[0].mr_no.split('/');
        nextNum = parseInt(parts[2] || '0') + 1;
      }
      finalMRNo = `MR/${year}/${String(nextNum).padStart(4, '0')}`;
    }
    const finalDate = mr_date || new Date().toISOString().split('T')[0];
    const finalAmount = parseFloat(amount || 0);
    const branchId = req.body.branch_id || req.user.branch_id;
    const result = await pool.query(
      `INSERT INTO money_receipts (mr_no, mr_date, branch_id, party_type, party_name, bilty_id, bilty_lr_no, bill_id, bill_no, amount, payment_mode, is_advance, remarks, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [finalMRNo, finalDate, branchId, party_type, party_name, bilty_id || null, bilty_lr_no || null, bill_id || null, bill_no || null, finalAmount, payment_mode || 'Cash', is_advance || false, remarks || '', req.user.username]
    );
    if (bilty_id) await pool.query(`UPDATE consignments SET payment_status = 'Paid', mr_no = $1 WHERE id = $2`, [finalMRNo, bilty_id]);
    if (bill_id) await pool.query(`UPDATE bill_book SET payment_status = 'Paid', mr_no = $1 WHERE id = $2`, [finalMRNo, bill_id]);
    await logAudit('CREATE', 'MONEY_RECEIPT', result.rows[0].id, `MR ${finalMRNo} ₹${finalAmount}`, req.user.username, branchId);
    res.json({ success: true, mr_no: finalMRNo, data: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/mr/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM money_receipts WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// AUDIT
// ==========================================
app.get('/api/audit', authMiddleware, async (req, res) => {
  try {
    const branchId = req.query.branch_id;
    const where = branchId ? `WHERE branch_id = ${parseInt(branchId)}` : '';
    const result = await pool.query(`SELECT * FROM audit_logs ${where} ORDER BY id DESC LIMIT 200`);
    res.json({ data: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// CUSTOMERS
// ==========================================
app.get('/api/customers', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers WHERE is_active = TRUE ORDER BY customer_name');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// GATE PASS
// ==========================================
app.get('/api/gate-pass', authMiddleware, async (req, res) => {
  try {
    const branchId = req.query.branch_id;
    const where = branchId ? `WHERE branch_id = ${parseInt(branchId)}` : '';
    const result = await pool.query(`SELECT * FROM gate_passes ${where} ORDER BY id DESC LIMIT 100`);
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
      const parts = result.rows[0].pass_no.split('/');
      if (parts.length === 3) nextSerial = parseInt(parts[2]) + 1;
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

// ==========================================
// GADI CHALLAN
// ==========================================
app.get('/api/gadi-challan', authMiddleware, async (req, res) => {
  try {
    const branchId = req.query.branch_id;
    const where = branchId ? `WHERE branch_id = ${parseInt(branchId)}` : '';
    const result = await pool.query(`SELECT * FROM gadi_challans ${where} ORDER BY id DESC LIMIT 100`);
    res.json({ data: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/gadi-challan', authMiddleware, async (req, res) => {
  try {
    const c = { ...req.body };
    if (!c.branch_id) c.branch_id = req.user.branch_id;
    const year = String(new Date().getFullYear()).slice(-2);
    const result = await pool.query(`SELECT challan_no FROM gadi_challans WHERE challan_no LIKE $1 ORDER BY id DESC LIMIT 1`, [`GC/${year}/%`]);
    let nextSerial = 1;
    if (result.rows.length > 0 && result.rows[0].challan_no) {
      const parts = result.rows[0].challan_no.split('/');
      if (parts.length === 3) nextSerial = parseInt(parts[2]) + 1;
    }
    c.challan_no = `GC/${year}/${String(nextSerial).padStart(4, '0')}`;
    const keys = Object.keys(c);
    const values = Object.values(c);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const row = await pool.query(`INSERT INTO gadi_challans (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`, values);
    res.json(row.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// PUBLIC TRACKING
// ==========================================
app.get('/api/consignments/track', async (req, res) => {
  try {
    const lr_no = req.query.lr_no;
    if (!lr_no) return res.status(400).json({ error: 'LR number required' });
    const result = await pool.query('SELECT lr_no, lr_date, from_name, to_name, consignor_name, consignee_name, status, pod_status, branch_code FROM consignments WHERE lr_no = $1', [lr_no]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Bilty not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// START
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
  await createTables();
  await ensureAdminUser();
  app.listen(PORT, HOST, () => {
    console.log(`✅ Bharat Transport TMS v6.0 - Multi-Branch running on port ${PORT}`);
  });
}

startServer();
module.exports = app;
