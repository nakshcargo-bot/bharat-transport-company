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
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

async function generateBiltyNo() {
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2);
  const result = await pool.query(
    `SELECT lr_no FROM consignments WHERE lr_no LIKE $1 ORDER BY id DESC LIMIT 1`,
    [`BTC/${year}/%`]
  );
  let nextSerial = 1;
  if (result.rows.length > 0) {
    const lastLrNo = result.rows[0].lr_no;
    const parts = lastLrNo.split('/');
    if (parts.length === 3) {
      const lastSerial = parseInt(parts[2]);
      if (!isNaN(lastSerial)) nextSerial = lastSerial + 1;
    }
  }
  let serialStr = String(nextSerial);
  while (serialStr.length < 4) serialStr = '0' + serialStr;
  return `BTC/${year}/${serialStr}`;
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

app.get('/', (req, res) => {
  res.json({ status: 'OK', company: 'BHARAT TRANSPORT COMPANY', message: 'Backend API running' });
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    const result = await pool.query('SELECT * FROM users WHERE username = $1 AND is_active = TRUE', [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    const user = result.rows[0];
    let validPassword = false;
    try {
      validPassword = await bcrypt.compare(password, user.password);
    } catch (e) {
      validPassword = password === user.password;
    }
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, branch_code: user.branch_code },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
    res.json({
      success: true,
      token,
      user: { id: user.id, username: user.username, full_name: user.full_name, role: user.role, branch_code: user.branch_code }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/customers', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers WHERE is_active = TRUE ORDER BY customer_name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/customers', authMiddleware, async (req, res) => {
  try {
    const c = req.body;
    const result = await pool.query(
      `INSERT INTO customers (customer_code, customer_name, address, city, state, pincode, mobile, whatsapp, email, gst_no, pan_no, customer_type, credit_limit, credit_days, opening_balance)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [c.customer_code, c.customer_name, c.address, c.city, c.state, c.pincode, c.mobile, c.whatsapp || c.mobile, c.email, c.gst_no, c.pan_no, c.customer_type || 'Cash', c.credit_limit || 0, c.credit_days || 0, c.opening_balance || 0]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/customers/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/customers/:id', authMiddleware, async (req, res) => {
  try {
    const c = req.body;
    const result = await pool.query(
      `UPDATE customers SET customer_code = $1, customer_name = $2, address = $3, city = $4, state = $5, pincode = $6, mobile = $7, whatsapp = $8, email = $9, gst_no = $10, pan_no = $11, customer_type = $12, credit_limit = $13, credit_days = $14, opening_balance = $15, is_active = $16 WHERE id = $17 RETURNING *`,
      [c.customer_code, c.customer_name, c.address, c.city, c.state, c.pincode, c.mobile, c.whatsapp, c.email, c.gst_no, c.pan_no, c.customer_type, c.credit_limit, c.credit_days, c.opening_balance, c.is_active !== false, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/customers/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('UPDATE customers SET is_active = FALSE WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CONSIGNMENT ROUTES - FIXED (Only columns that exist in database)
app.get('/api/consignments', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM consignments ORDER BY id DESC LIMIT 100');
    res.json({ data: result.rows, total: result.rows.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/consignments/:lr_no', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM consignments WHERE lr_no = $1', [req.params.lr_no]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'LR not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/consignments', authMiddleware, async (req, res) => {
  try {
    const c = req.body;
    if (!c.lr_no) c.lr_no = await generateBiltyNo();
    
    const result = await pool.query(
      `INSERT INTO consignments (
        lr_no, lr_date, branch_code,
        consignor_name, consignor_address, consignor_gst, consignor_mobile,
        consignee_name, consignee_address, consignee_gst, consignee_mobile,
        invoice_no, invoice_date,
        from_code, from_name, to_code, to_name,
        lorry_no, driver_name, driver_mobile,
        delivery_type, pickup_address, delivery_godown,
        no_of_packages, method_of_packing, hsn_code, description,
        actual_weight, charged_weight, rate,
        length, width, height, cft_cmt,
        mr_no, mr_date, mr_amount, load_type,
        freight, aoc_percent, aoc_amount, eov_charges, cover_charges,
        material_charges, mgmt_charges, collection_charges, door_delivery,
        with_pass_cc, enroute_charges, statistical_charges, misc_charges, grand_total,
        eway_bill_no, eway_valid_upto,
        payment_type, declared_value, basis_of_booking, billed_at, gst_through,
        to_pay_paid_tbb_amount, amount_in_words,
        status, remarks, created_by
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
        $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,
        $39,$40,$41,$42,$43,$44,$45,$46,$47,$48,$49,$50,$51,$52,$53,$54,$55,$56,
        $57,$58,$59,$60,$61,$62,$63,$64,$65
      ) RETURNING *`,
      [
        c.lr_no, c.lr_date, c.branch_code,
        c.consignor_name, c.consignor_address, c.consignor_gst, c.consignor_mobile,
        c.consignee_name, c.consignee_address, c.consignee_gst, c.consignee_mobile,
        c.invoice_no, c.invoice_date,
        c.from_code, c.from_name, c.to_code, c.to_name,
        c.lorry_no, c.driver_name, c.driver_mobile,
        c.delivery_type || 'Door Delivery', c.pickup_address, c.delivery_godown,
        c.no_of_packages || 0, c.method_of_packing, c.hsn_code, c.description,
        c.actual_weight || 0, c.charged_weight || 0, c.rate || 0,
        c.length || 0, c.width || 0, c.height || 0, c.cft_cmt || 0,
        c.mr_no, c.mr_date, c.mr_amount || 0, c.load_type,
        c.freight || 0, c.aoc_percent || 0, c.aoc_amount || 0, c.eov_charges || 0, c.cover_charges || 0,
        c.material_charges || 0, c.mgmt_charges || 0, c.collection_charges || 0, c.door_delivery || 0,
        c.with_pass_cc || 0, c.enroute_charges || 0, c.statistical_charges || 0, c.misc_charges || 0, c.grand_total || 0,
        c.eway_bill_no, c.eway_valid_upto,
        c.payment_type, c.declared_value || 0, c.basis_of_booking, c.billed_at, c.gst_through,
        c.to_pay_paid_tbb_amount || 0, c.amount_in_words,
        c.status || 'Booked', c.remarks, req.user.username
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('INSERT ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/consignments/:id', authMiddleware, async (req, res) => {
  try {
    const c = req.body;
    const result = await pool.query(
      `UPDATE consignments SET
        consignor_name = $1, consignor_mobile = $2, consignee_name = $3, consignee_mobile = $4,
        lorry_no = $5, driver_name = $6, driver_mobile = $7,
        no_of_packages = $8, charged_weight = $9, rate = $10,
        freight = $11, grand_total = $12, status = $13, updated_at = NOW()
      WHERE id = $14 RETURNING *`,
      [c.consignor_name, c.consignor_mobile, c.consignee_name, c.consignee_mobile,
       c.lorry_no, c.driver_name, c.driver_mobile,
       c.no_of_packages, c.charged_weight, c.rate,
       c.freight, c.grand_total, c.status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/consignments/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query("UPDATE consignments SET status = 'Cancelled' WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// BILL ROUTES
app.get('/api/bills', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM bill_book ORDER BY id DESC LIMIT 100');
    res.json({ data: result.rows, total: result.rows.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bills', authMiddleware, async (req, res) => {
  try {
    const b = req.body;
    const result = await pool.query(
      `INSERT INTO bill_book (bill_no, bill_date, branch_code, customer_id, party_name, party_gst, party_address, grand_total, advance_received, balance_due, status, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [b.bill_no, b.bill_date, b.branch_code, b.customer_id, b.party_name, b.party_gst, b.party_address, b.grand_total || 0, b.advance_received || 0, b.balance_due || 0, b.status || 'Active', req.user.username]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DASHBOARD
app.get('/api/dashboard/stats', authMiddleware, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [todayLR, todayBills, totalCustomers, pendingLR] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM consignments WHERE lr_date = $1', [today]),
      pool.query('SELECT COUNT(*) FROM bill_book WHERE bill_date = $1', [today]),
      pool.query('SELECT COUNT(*) FROM customers WHERE is_active = TRUE'),
      pool.query("SELECT COUNT(*) FROM consignments WHERE status IN ('Booked','In-Transit')")
    ]);
    res.json({
      today_lr: parseInt(todayLR.rows[0].count),
      today_bills: parseInt(todayBills.rows[0].count),
      total_customers: parseInt(totalCustomers.rows[0].count),
      pending_lr: parseInt(pendingLR.rows[0].count)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, HOST, () => {
  console.log('✅ BHARAT TRANSPORT Backend running on port', PORT);
});

module.exports = app;
