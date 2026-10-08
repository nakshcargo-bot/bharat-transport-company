const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

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
// ✅ DATABASE TABLES CREATION (PostgreSQL)
// ==========================================
async function createTables() {
  try {
    // Users table
    await pool.query(`CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      full_name TEXT,
      role TEXT DEFAULT 'user',
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    )`);
    console.log('✓ Users table ready');

    // Customers/Parties table
    await pool.query(`CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      customer_name TEXT NOT NULL,
      customer_code TEXT UNIQUE,
      address TEXT,
      gst_no TEXT,
      email TEXT,
      phone TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    )`);
    console.log('✓ Customers table ready');

    // Parties table (for party codes)
    await pool.query(`CREATE TABLE IF NOT EXISTS parties (
      id SERIAL PRIMARY KEY,
      party_code TEXT UNIQUE NOT NULL,
      party_name TEXT NOT NULL,
      address TEXT,
      gst_no TEXT,
      email TEXT,
      phone TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`);
    console.log('✓ Parties table ready');

    // Consignments (Bilty) table
    await pool.query(`CREATE TABLE IF NOT EXISTS consignments (
      id SERIAL PRIMARY KEY,
      lr_no TEXT UNIQUE NOT NULL,
      lr_date DATE,
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
      created_by TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`);
    console.log('✓ Consignments table ready');

    // Bill Book table
    await pool.query(`CREATE TABLE IF NOT EXISTS bill_book (
      id SERIAL PRIMARY KEY,
      bill_no TEXT UNIQUE,
      bill_date DATE,
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
    )`);
    console.log('✓ Bill Book table ready');

    // ✅ MONEY RECEIPTS TABLE (यही missing था!)
    await pool.query(`CREATE TABLE IF NOT EXISTS money_receipts (
      id SERIAL PRIMARY KEY,
      mr_no TEXT UNIQUE NOT NULL,
      mr_date DATE NOT NULL,
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
    )`);
    console.log('✅ Money Receipts table ready');

    // Gate Passes table
    await pool.query(`CREATE TABLE IF NOT EXISTS gate_passes (
      id SERIAL PRIMARY KEY,
      pass_no TEXT UNIQUE NOT NULL,
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
    )`);
    console.log('✓ Gate Passes table ready');

    // Gadi Challans table
    await pool.query(`CREATE TABLE IF NOT EXISTS gadi_challans (
      id SERIAL PRIMARY KEY,
      challan_no TEXT UNIQUE NOT NULL,
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
    )`);
    console.log('✓ Gadi Challans table ready');

    // Audit Log table
    await pool.query(`CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      action TEXT NOT NULL,
      module TEXT NOT NULL,
      record_id TEXT,
      details TEXT,
      performed_by TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`);
    console.log('✓ Audit Logs table ready');

  } catch (err) {
    console.error('❌ Error creating tables:', err.message);
  }
}

// ==========================================
// AUTH MIDDLEWARE
// ==========================================
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(authHeader.substring(7), process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// ==========================================
// HELPER: Audit Log
// ==========================================
async function logAudit(action, module, recordId, details, performedBy) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (action, module, record_id, details, performed_by) VALUES ($1,$2,$3,$4,$5)`,
      [action, module, recordId, details, performedBy]
    );
  } catch (e) { console.error('Audit log error:', e.message); }
}

// ==========================================
// ROOT
// ==========================================
app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'Bharat Transport API v4.0 - Professional TMS' });
});

// ==========================================
// AUTH
// ==========================================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE username = $1 AND is_active = TRUE', [username]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const user = result.rows[0];
    let valid = false;
    if (user.password && user.password.startsWith('$2')) {
      try { valid = await bcrypt.compare(password, user.password); } catch (e) { valid = false; }
    }
    if (!valid && password === user.password) valid = true;
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    await logAudit('LOGIN', 'AUTH', user.id, `User ${username} logged in`, username);
    res.json({ success: true, token, user: { id: user.id, username: user.username, role: user.role } });
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
    
    const [todayLR, monthLR, totalLR, pendingLR, paidLR, totalBills, pendingBills, totalMR, totalParties, totalCustomers] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM consignments WHERE lr_date = $1', [today]),
      pool.query("SELECT COUNT(*) FROM consignments WHERE lr_date LIKE $1", [`${thisMonth}%`]),
      pool.query('SELECT COUNT(*) FROM consignments'),
      pool.query("SELECT COUNT(*) FROM consignments WHERE status IN ('Booked','In-Transit')"),
      pool.query("SELECT COUNT(*) FROM consignments WHERE payment_status = 'Paid'"),
      pool.query('SELECT COUNT(*) FROM bill_book'),
      pool.query("SELECT COUNT(*) FROM bill_book WHERE payment_status = 'Unpaid'"),
      pool.query('SELECT COUNT(*) FROM money_receipts'),
      pool.query('SELECT COUNT(*) FROM parties'),
      pool.query('SELECT COUNT(*) FROM customers WHERE is_active = TRUE')
    ]);

    const [revenueResult, pendingAmountResult] = await Promise.all([
      pool.query("SELECT COALESCE(SUM(CAST(grand_total AS NUMERIC)), 0) as total FROM consignments WHERE payment_status = 'Paid'"),
      pool.query("SELECT COALESCE(SUM(CAST(grand_total AS NUMERIC)), 0) as total FROM consignments WHERE payment_status = 'Unpaid'")
    ]);

    res.json({
      today_lr: parseInt(todayLR.rows[0].count),
      month_lr: parseInt(monthLR.rows[0].count),
      total_lr: parseInt(totalLR.rows[0].count),
      pending_lr: parseInt(pendingLR.rows[0].count),
      paid_lr: parseInt(paidLR.rows[0].count),
      total_bills: parseInt(totalBills.rows[0].count),
      pending_bills: parseInt(pendingBills.rows[0].count),
      total_mr: parseInt(totalMR.rows[0].count),
      total_parties: parseInt(totalParties.rows[0].count),
      total_customers: parseInt(totalCustomers.rows[0].count),
      total_revenue: parseFloat(revenueResult.rows[0].total || 0),
      pending_amount: parseFloat(pendingAmountResult.rows[0].total || 0)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// CONSIGNMENTS (BILTY)
// ==========================================
async function generateBiltyNo() {
  const year = String(new Date().getFullYear()).slice(-2);
  const result = await pool.query(`SELECT lr_no FROM consignments WHERE lr_no LIKE $1 ORDER BY id DESC LIMIT 1`, [`BTC/${year}/%`]);
  let nextSerial = 1;
  if (result.rows.length > 0) {
    const parts = result.rows[0].lr_no.split('/');
    if (parts.length === 3) nextSerial = parseInt(parts[2]) + 1;
  }
  return `BTC/${year}/${String(nextSerial).padStart(4, '0')}`;
}

app.get('/api/consignments', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM consignments ORDER BY id DESC LIMIT 500');
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
    if (!c.lr_no) c.lr_no = await generateBiltyNo();
    if (!c.status) c.status = 'Booked';
    if (!c.payment_status) c.payment_status = c.basis_booking === 'PAID' ? 'Paid' : 'Unpaid';
    if (!c.created_by) c.created_by = req.user.username;
    if (!c.lr_date) c.lr_date = new Date().toISOString().split('T')[0];
    
    const keys = Object.keys(c);
    const values = Object.values(c);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    
    const result = await pool.query(
      `INSERT INTO consignments (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`,
      values
    );
    
    await logAudit('CREATE', 'CONSIGNMENT', result.rows[0].id, `Bilty ${c.lr_no} created`, req.user.username);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/consignments/:id', authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body;
    delete data.id;
    delete data.created_at;
    data.updated_at = new Date().toISOString();
    
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    values.push(id);
    
    const result = await pool.query(
      `UPDATE consignments SET ${setClause} WHERE id = $${values.length} RETURNING *`,
      values
    );
    
    await logAudit('UPDATE', 'CONSIGNMENT', id, `Bilty modified`, req.user.username);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/consignments/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query("UPDATE consignments SET status = 'Cancelled' WHERE id = $1", [req.params.id]);
    await logAudit('CANCEL', 'CONSIGNMENT', req.params.id, `Bilty cancelled`, req.user.username);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// PARTIES
// ==========================================
app.get('/api/parties', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM parties ORDER BY party_name ASC');
    res.json({ data: result.rows, count: result.rows.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/parties', authMiddleware, async (req, res) => {
  try {
    const { party_code, party_name, address, gst_no, email, phone } = req.body;
    if (!party_code || !party_name) return res.status(400).json({ error: 'Party Code and Name required' });
    
    const result = await pool.query(
      `INSERT INTO parties (party_code, party_name, address, gst_no, email, phone)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT(party_code) DO UPDATE SET
       party_name = EXCLUDED.party_name, address = EXCLUDED.address,
       gst_no = EXCLUDED.gst_no, email = EXCLUDED.email, phone = EXCLUDED.phone
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
    const result = await pool.query('SELECT * FROM bill_book ORDER BY id DESC LIMIT 500');
    res.json({ data: result.rows, total: result.rows.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/bills', authMiddleware, async (req, res) => {
  try {
    const b = { ...req.body };
    if (!b.bill_date) b.bill_date = new Date().toISOString().split('T')[0];
    if (!b.status) b.status = 'Pending';
    if (!b.payment_status) b.payment_status = 'Unpaid';
    
    const keys = Object.keys(b);
    const values = Object.values(b);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    
    const result = await pool.query(
      `INSERT INTO bill_book (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`,
      values
    );
    await logAudit('CREATE', 'BILL', result.rows[0].id, `Bill created`, req.user.username);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/bills/:id', authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body;
    delete data.id;
    delete data.created_at;
    data.updated_at = new Date().toISOString();
    
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    values.push(id);
    
    const result = await pool.query(
      `UPDATE bill_book SET ${setClause} WHERE id = $${values.length} RETURNING *`,
      values
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// MONEY RECEIPTS
// ==========================================
app.get('/api/mr', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM money_receipts ORDER BY id DESC LIMIT 500');
    res.json({ data: result.rows, count: result.rows.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/mr/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM money_receipts WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'MR not found' });
    res.json(result.rows[0]);
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
        const lastNum = parseInt(parts[2] || '0');
        nextNum = lastNum + 1;
      }
      finalMRNo = `MR/${year}/${String(nextNum).padStart(4, '0')}`;
    }
    
    const finalDate = mr_date || new Date().toISOString().split('T')[0];
    const finalAmount = parseFloat(amount || 0);
    
    const result = await pool.query(
      `INSERT INTO money_receipts 
       (mr_no, mr_date, party_type, party_name, bilty_id, bilty_lr_no, bill_id, bill_no, amount, payment_mode, is_advance, remarks, created_by) 
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [finalMRNo, finalDate, party_type, party_name, bilty_id || null, bilty_lr_no || null, bill_id || null, bill_no || null, finalAmount, payment_mode || 'Cash', is_advance || false, remarks || '', req.user.username]
    );
    
    // Update bilty payment status if linked
    if (bilty_id) {
      await pool.query(`UPDATE consignments SET payment_status = 'Paid', mr_no = $1 WHERE id = $2`, [finalMRNo, bilty_id]);
    }
    if (bill_id) {
      await pool.query(`UPDATE bill_book SET payment_status = 'Paid', mr_no = $1 WHERE id = $2`, [finalMRNo, bill_id]);
    }
    
    await logAudit('CREATE', 'MONEY_RECEIPT', result.rows[0].id, `MR ${finalMRNo} created for ₹${finalAmount}`, req.user.username);
    res.json({ success: true, mr_no: finalMRNo, data: result.rows[0] });
  } catch (err) {
    console.error('MR Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/mr/:id', authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body;
    delete data.id;
    delete data.created_at;
    data.updated_at = new Date().toISOString();
    
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    values.push(id);
    
    const result = await pool.query(
      `UPDATE money_receipts SET ${setClause} WHERE id = $${values.length} RETURNING *`,
      values
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/mr/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM money_receipts WHERE id = $1', [req.params.id]);
    await logAudit('DELETE', 'MONEY_RECEIPT', req.params.id, `MR deleted`, req.user.username);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// AUDIT LOGS
// ==========================================
app.get('/api/audit', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 200');
    res.json({ data: result.rows, count: result.rows.length });
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

app.post('/api/customers', authMiddleware, async (req, res) => {
  try {
    const keys = Object.keys(req.body);
    const values = Object.values(req.body);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const result = await pool.query(`INSERT INTO customers (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`, values);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// GATE PASS
// ==========================================
app.post('/api/gate-pass', authMiddleware, async (req, res) => {
  try {
    const { lr_no, vehicle_no, driver_name, driver_mobile, material_desc, quantity, weight, valid_until, issued_by } = req.body;
    const year = String(new Date().getFullYear()).slice(-2);
    const result = await pool.query(`SELECT pass_no FROM gate_passes WHERE pass_no LIKE $1 ORDER BY id DESC LIMIT 1`, [`GP/${year}/%`]);
    let nextSerial = 1;
    if (result.rows.length > 0) {
      const parts = result.rows[0].pass_no.split('/');
      if (parts.length === 3) nextSerial = parseInt(parts[2]) + 1;
    }
    const pass_no = `GP/${year}/${String(nextSerial).padStart(4, '0')}`;
    const row = await pool.query(
      `INSERT INTO gate_passes (pass_no, lr_no, vehicle_no, driver_name, driver_mobile, material_desc, quantity, weight, valid_until, issued_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [pass_no, lr_no, vehicle_no, driver_name, driver_mobile, material_desc, quantity, weight, valid_until, issued_by]
    );
    res.json(row.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/gate-pass', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM gate_passes ORDER BY id DESC LIMIT 100');
    res.json({ data: result.rows, total: result.rows.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// GADI CHALLAN
// ==========================================
app.post('/api/gadi-challan', authMiddleware, async (req, res) => {
  try {
    const c = { ...req.body };
    const year = String(new Date().getFullYear()).slice(-2);
    const result = await pool.query(`SELECT challan_no FROM gadi_challans WHERE challan_no LIKE $1 ORDER BY id DESC LIMIT 1`, [`GC/${year}/%`]);
    let nextSerial = 1;
    if (result.rows.length > 0) {
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

app.get('/api/gadi-challan', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM gadi_challans ORDER BY id DESC LIMIT 100');
    res.json({ data: result.rows, total: result.rows.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// PUBLIC TRACKING
// ==========================================
app.get('/api/consignments/track', async (req, res) => {
  try {
    const lr_no = req.query.lr_no;
    if (!lr_no) return res.status(400).json({ error: 'LR number required' });
    const result = await pool.query('SELECT * FROM consignments WHERE lr_no = $1', [lr_no]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Bilty not found' });
    res.json(result.rows[0]);
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
  } catch (err) { console.error('⚠️ Admin setup error:', err.message); }
}

async function startServer() {
  await createTables();
  await ensureAdminUser();
  app.listen(PORT, HOST, () => {
    console.log(`✅ Bharat Transport API v4.0 running on port ${PORT}`);
  });
}

startServer();
module.exports = app;
