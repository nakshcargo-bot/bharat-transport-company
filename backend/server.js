// ============================================
// BHARAT TRANSPORT COMPANY - BACKEND SERVER
// Version 2.0 (Fixed - All Columns Removed)
// ============================================

console.log('=== SERVER.JS STARTING ===');
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

// Database Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Helper Functions
function getFinancialYear() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  let fyStart, fyEnd;
  if (month >= 4) {
    fyStart = year;
    fyEnd = year + 1;
  } else {
    fyStart = year - 1;
    fyEnd = year;
  }
  const startYY = String(fyStart).slice(-2);
  const endYY = String(fyEnd).slice(-2);
  return { fy: `${startYY}-${endYY}`, year: year };
}

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
      if (!isNaN(lastSerial)) {
        nextSerial = lastSerial + 1;
      }
    }
  }
  let serialStr = String(nextSerial);
  while (serialStr.length < 4) {
    serialStr = '0' + serialStr;
  }
  return `BTC/${year}/${serialStr}`;
}

async function generateBillNo() {
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2);
  const result = await pool.query(
    `SELECT bill_no FROM bill_book WHERE bill_no LIKE $1 ORDER BY id DESC LIMIT 1`,
    [`BTC-BILL/${year}/%`]
  );
  let nextSerial = 1;
  if (result.rows.length > 0) {
    const lastBillNo = result.rows[0].bill_no;
    const parts = lastBillNo.split('/');
    if (parts.length === 3) {
      const lastSerial = parseInt(parts[2]);
      if (!isNaN(lastSerial)) {
        nextSerial = lastSerial + 1;
      }
    }
  }
  let serialStr = String(nextSerial);
  while (serialStr.length < 4) {
    serialStr = '0' + serialStr;
  }
  return `BTC-BILL/${year}/${serialStr}`;
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

// Health Check
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    company: 'BHARAT TRANSPORT COMPANY',
    message: 'Backend API v2.0 running',
    time: new Date().toISOString()
  });
});

// AUTH ROUTES
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND is_active = TRUE',
      [username]
    );
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
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        branch_code: user.branch_code,
        mobile: user.mobile,
        email: user.email
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// CUSTOMER ROUTES
app.get('/api/customers', authMiddleware, async (req, res) => {
  try {
    const { search, type } = req.query;
    let query = 'SELECT * FROM customers WHERE is_active = TRUE';
    const params = [];
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (customer_name ILIKE $${params.length} OR customer_code ILIKE $${params.length} OR mobile ILIKE $${params.length} OR gst_no ILIKE $${params.length})`;
    }
    if (type) {
      params.push(type);
      query += ` AND customer_type = $${params.length}`;
    }
    query += ' ORDER BY customer_name';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/customers', authMiddleware, async (req, res) => {
  try {
    const {
      customer_code, customer_name, address, city, state, pincode,
      mobile, whatsapp, email, gst_no, pan_no, customer_type,
      credit_limit, credit_days, opening_balance
    } = req.body;
    if (!customer_name) {
      return res.status(400).json({ error: 'Customer name is required' });
    }
    let finalCode = customer_code;
    if (!finalCode) {
      const countResult = await pool.query('SELECT COUNT(*) FROM customers');
      const nextNo = parseInt(countResult.rows[0].count) + 1;
      finalCode = 'CUST' + String(nextNo).padStart(4, '0');
    }
    const result = await pool.query(
      `INSERT INTO customers (
        customer_code, customer_name, address, city, state, pincode,
        mobile, whatsapp, email, gst_no, pan_no, customer_type,
        credit_limit, credit_days, opening_balance
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      RETURNING *`,
      [
        finalCode, customer_name, address, city, state, pincode,
        mobile, whatsapp || mobile, email, gst_no, pan_no,
        customer_type || 'credit', credit_limit || 0,
        credit_days || 0, opening_balance || 0
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Customer code already exists' });
    }
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/customers/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/customers/:id', authMiddleware, async (req, res) => {
  try {
    const {
      customer_code, customer_name, address, city, state, pincode,
      mobile, whatsapp, email, gst_no, pan_no, customer_type,
      credit_limit, credit_days, opening_balance, is_active
    } = req.body;
    const result = await pool.query(
      `UPDATE customers SET
        customer_code = COALESCE($1, customer_code),
        customer_name = COALESCE($2, customer_name),
        address = COALESCE($3, address),
        city = COALESCE($4, city),
        state = COALESCE($5, state),
        pincode = COALESCE($6, pincode),
        mobile = COALESCE($7, mobile),
        whatsapp = COALESCE($8, whatsapp),
        email = COALESCE($9, email),
        gst_no = COALESCE($10, gst_no),
        pan_no = COALESCE($11, pan_no),
        customer_type = COALESCE($12, customer_type),
        credit_limit = COALESCE($13, credit_limit),
        credit_days = COALESCE($14, credit_days),
        opening_balance = COALESCE($15, opening_balance),
        is_active = COALESCE($16, is_active)
      WHERE id = $17 RETURNING *`,
      [
        customer_code, customer_name, address, city, state, pincode,
        mobile, whatsapp, email, gst_no, pan_no, customer_type,
        credit_limit, credit_days, opening_balance, is_active,
        req.params.id
      ]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/customers/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('UPDATE customers SET is_active = FALSE WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Customer deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CONSIGNMENT (BILTY) ROUTES - FIXED
app.get('/api/consignments', authMiddleware, async (req, res) => {
  try {
    const { search, status, from_code, to_code, branch_code, date_from, date_to, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM consignments WHERE 1=1';
    const params = [];
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (lr_no ILIKE $${params.length} OR consignor_name ILIKE $${params.length} OR consignee_name ILIKE $${params.length} OR consignee_mobile ILIKE $${params.length} OR invoice_no ILIKE $${params.length})`;
    }
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    if (from_code) {
      params.push(from_code);
      query += ` AND from_code = $${params.length}`;
    }
    if (to_code) {
      params.push(to_code);
      query += ` AND to_code = $${params.length}`;
    }
    if (branch_code) {
      params.push(branch_code);
      query += ` AND branch_code = $${params.length}`;
    }
    if (date_from) {
      params.push(date_from);
      query += ` AND lr_date >= $${params.length}`;
    }
    if (date_to) {
      params.push(date_to);
      query += ` AND lr_date <= $${params.length}`;
    }
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);
    params.push(limit);
    query += ` ORDER BY id DESC LIMIT $${params.length}`;
    params.push(offset);
    query += ` OFFSET $${params.length}`;
    const result = await pool.query(query, params);
    res.json({
      data: result.rows,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      total_pages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/consignments/:lr_no', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM consignments WHERE lr_no = $1', [req.params.lr_no]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'LR not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/consignments', authMiddleware, async (req, res) => {
  try {
    const c = req.body;
    if (!c.lr_no) {
      c.lr_no = await generateBiltyNo();
    }
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
        private_marks, mr_no, mr_date, mr_amount, load_type,
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
        c.no_of_packages, c.method_of_packing, c.hsn_code, c.description,
        c.actual_weight, c.charged_weight, c.rate,
        c.length, c.width, c.height, c.cft_cmt,
        c.private_marks, c.mr_no, c.mr_date, c.mr_amount, c.load_type,
        c.freight || 0, c.aoc_percent || 0, c.aoc_amount || 0, c.eov_charges || 0, c.cover_charges || 0,
        c.material_charges || 0, c.mgmt_charges || 0, c.collection_charges || 0, c.door_delivery || 0,
        c.with_pass_cc || 0, c.enroute_charges || 0, c.statistical_charges || 0, c.misc_charges || 0, c.grand_total || 0,
        c.eway_bill_no, c.eway_valid_upto,
        c.payment_type, c.declared_value, c.basis_of_booking, c.billed_at, c.gst_through,
        c.to_pay_paid_tbb_amount, c.amount_in_words,
        c.status || 'Booked', c.remarks, req.user.username
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/consignments/:id', authMiddleware, async (req, res) => {
  try {
    const c = req.body;
    const result = await pool.query(
      `UPDATE consignments SET
        consignor_name = COALESCE($1, consignor_name),
        consignor_address = COALESCE($2, consignor_address),
        consignor_gst = COALESCE($3, consignor_gst),
        consignor_mobile = COALESCE($4, consignor_mobile),
        consignee_name = COALESCE($5, consignee_name),
        consignee_address = COALESCE($6, consignee_address),
        consignee_gst = COALESCE($7, consignee_gst),
        consignee_mobile = COALESCE($8, consignee_mobile),
        invoice_no = COALESCE($9, invoice_no),
        from_code = COALESCE($10, from_code),
        from_name = COALESCE($11, from_name),
        to_code = COALESCE($12, to_code),
        to_name = COALESCE($13, to_name),
        lorry_no = COALESCE($14, lorry_no),
        driver_name = COALESCE($15, driver_name),
        driver_mobile = COALESCE($16, driver_mobile),
        delivery_type = COALESCE($17, delivery_type),
        no_of_packages = COALESCE($18, no_of_packages),
        description = COALESCE($19, description),
        actual_weight = COALESCE($20, actual_weight),
        charged_weight = COALESCE($21, charged_weight),
        rate = COALESCE($22, rate),
        freight = COALESCE($23, freight),
        aoc_percent = COALESCE($24, aoc_percent),
        aoc_amount = COALESCE($25, aoc_amount),
        eov_charges = COALESCE($26, eov_charges),
        cover_charges = COALESCE($27, cover_charges),
        door_delivery = COALESCE($28, door_delivery),
        grand_total = COALESCE($29, grand_total),
        status = COALESCE($30, status),
        remarks = COALESCE($31, remarks),
        updated_at = NOW()
      WHERE id = $32 RETURNING *`,
      [
        c.consignor_name, c.consignor_address, c.consignor_gst, c.consignor_mobile,
        c.consignee_name, c.consignee_address, c.consignee_gst, c.consignee_mobile,
        c.invoice_no, c.from_code, c.from_name, c.to_code, c.to_name,
        c.lorry_no, c.driver_name, c.driver_mobile, c.delivery_type,
        c.no_of_packages, c.description, c.actual_weight, c.charged_weight, c.rate,
        c.freight, c.aoc_percent, c.aoc_amount, c.eov_charges, c.cover_charges,
        c.door_delivery, c.grand_total, c.status, c.remarks,
        req.params.id
      ]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Consignment not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/consignments/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query("UPDATE consignments SET status = 'Cancelled', updated_at = NOW() WHERE id = $1", [req.params.id]);
    res.json({ success: true, message: 'Consignment cancelled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// BILL ROUTES
app.get('/api/bills', authMiddleware, async (req, res) => {
  try {
    const { search, status, customer_id, branch_code, date_from, date_to, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM bill_book WHERE 1=1';
    const params = [];
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (bill_no ILIKE $${params.length} OR party_name ILIKE $${params.length} OR invoice_no ILIKE $${params.length})`;
    }
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    if (customer_id) {
      params.push(customer_id);
      query += ` AND customer_id = $${params.length}`;
    }
    if (branch_code) {
      params.push(branch_code);
      query += ` AND branch_code = $${params.length}`;
    }
    if (date_from) {
      params.push(date_from);
      query += ` AND bill_date >= $${params.length}`;
    }
    if (date_to) {
      params.push(date_to);
      query += ` AND bill_date <= $${params.length}`;
    }
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);
    params.push(limit);
    query += ` ORDER BY id DESC LIMIT $${params.length}`;
    params.push(offset);
    query += ` OFFSET $${params.length}`;
    const result = await pool.query(query, params);
    res.json({
      data: result.rows,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      total_pages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bills', authMiddleware, async (req, res) => {
  try {
    const b = req.body;
    if (!b.bill_no) {
      b.bill_no = await generateBillNo();
    }
    const result = await pool.query(
      `INSERT INTO bill_book (
        bill_no, bill_date, branch_code,
        customer_id, party_name, party_gst, party_address,
        invoice_no, invoice_date,
        from_name, to_name, consignor_name, consignee_name,
        vehicle_no,
        grand_total, advance_received, balance_due,
        trip_subtotal, gst_percent, gst_amount, net_balance,
        payment_mode, payment_details,
        amount_in_words, status, remarks, created_by
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27
      ) RETURNING *`,
      [
        b.bill_no, b.bill_date, b.branch_code,
        b.customer_id, b.party_name, b.party_gst, b.party_address,
        b.invoice_no, b.invoice_date,
        b.from_name, b.to_name, b.consignor_name, b.consignee_name,
        b.vehicle_no,
        b.grand_total || 0, b.advance_received || 0, b.balance_due || 0,
        b.trip_subtotal || 0, b.gst_percent || 0, b.gst_amount || 0, b.net_balance || 0,
        b.payment_mode, b.payment_details,
        b.amount_in_words, b.status || 'Active', b.remarks, req.user.username
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// DASHBOARD
app.get('/api/dashboard/stats', authMiddleware, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const monthStart = today.substring(0, 7) + '-01';
    const [
      todayLR, todayBills, totalBranches, totalCustomers,
      todayRevenue, thisMonthRevenue, totalOutstanding, pendingLR
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM consignments WHERE lr_date = $1 AND status != $2', [today, 'Cancelled']),
      pool.query('SELECT COUNT(*) FROM bill_book WHERE bill_date = $1 AND status != $2', [today, 'Cancelled']),
      pool.query('SELECT COUNT(*) FROM branches WHERE is_active = TRUE'),
      pool.query('SELECT COUNT(*) FROM customers WHERE is_active = TRUE'),
      pool.query('SELECT COALESCE(SUM(grand_total),0) as total FROM bill_book WHERE bill_date = $1 AND status != $2', [today, 'Cancelled']),
      pool.query('SELECT COALESCE(SUM(grand_total),0) as total FROM bill_book WHERE bill_date >= $1 AND status != $2', [monthStart, 'Cancelled']),
      pool.query("SELECT COALESCE(SUM(balance_due),0) as total FROM bill_book WHERE status IN ('Active','Partial')"),
      pool.query("SELECT COUNT(*) FROM consignments WHERE status IN ('Booked','In-Transit','Reached','Out for Delivery')")
    ]);
    res.json({
      today_lr: parseInt(todayLR.rows[0].count),
      today_bills: parseInt(todayBills.rows[0].count),
      total_branches: parseInt(totalBranches.rows[0].count),
      total_customers: parseInt(totalCustomers.rows[0].count),
      today_revenue: parseFloat(todayRevenue.rows[0].total),
      this_month_revenue: parseFloat(thisMonthRevenue.rows[0].total),
      total_outstanding: parseFloat(totalOutstanding.rows[0].total),
      pending_lr: parseInt(pendingLR.rows[0].count)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// START SERVER
app.listen(PORT, HOST, () => {
  console.log('===========================================');
  console.log('  BHARAT TRANSPORT COMPANY - Backend API');
  console.log('  Version 2.0 - All Columns Fixed');
  console.log('===========================================');
  console.log(`  Server running on port ${PORT}`);
  console.log(`  Environment: ${process.env.NODE_ENV}`);
  console.log(`  Time: ${new Date().toISOString()}`);
  console.log('===========================================');
  console.log('✅ SERVER STARTED SUCCESSFULLY!');
  console.log('===========================================');
});

module.exports = app;
