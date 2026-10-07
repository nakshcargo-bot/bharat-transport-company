const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const { sendBiltyEmail } = require('./services/emailService');
const { runMigrations } = require('./database-migration');

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

const tableColumnsCache = {};

async function getTableColumns(tableName) {
  if (tableColumnsCache[tableName]) return tableColumnsCache[tableName];
  const result = await pool.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position`,
    [tableName]
  );
  const columns = result.rows.map(r => r.column_name);
  tableColumnsCache[tableName] = columns;
  return columns;
}

async function smartInsert(tableName, data) {
  for (let key in data) { if (data[key] === '') data[key] = null; }  
  const columns = await getTableColumns(tableName);
  const autoColumns = ['id', 'created_at', 'updated_at'];
  const validKeys = Object.keys(data).filter(key => columns.includes(key) && !autoColumns.includes(key) && data[key] !== undefined);
  if (validKeys.length === 0) throw new Error('No valid columns to insert');
  
  const columnsList = validKeys.join(', ');
  const placeholders = validKeys.map((_, i) => `$${i + 1}`).join(', ');
  const values = validKeys.map(key => data[key]);
  const query = `INSERT INTO ${tableName} (${columnsList}) VALUES (${placeholders}) RETURNING *`;
  const result = await pool.query(query, values);
  return result.rows[0];
}

async function smartUpdate(tableName, data, id) {
  for (let key in data) { if (data[key] === '') data[key] = null; } 
  const columns = await getTableColumns(tableName);
  const autoColumns = ['id', 'created_at', 'updated_at', 'lr_no', 'bill_no'];
  const validKeys = Object.keys(data).filter(key => columns.includes(key) && !autoColumns.includes(key) && data[key] !== undefined);
  if (validKeys.length === 0) throw new Error('No valid columns to update');
  
  const setClause = validKeys.map((key, i) => `${key} = $${i + 1}`).join(', ');
  const values = validKeys.map(key => data[key]);
  values.push(id);
  const query = `UPDATE ${tableName} SET ${setClause}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`;
  const result = await pool.query(query, values);
  return result.rows[0];
}

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

app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'Bharat Transport API v3.0' });
});

// AUTH
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const user = result.rows[0];
    let valid = false;
    if (user.password && user.password.startsWith('$2')) {
      try { valid = await bcrypt.compare(password, user.password); } catch (e) { valid = false; }
    }
    if (!valid && password === user.password) valid = true;
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CUSTOMERS
app.get('/api/customers', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers WHERE is_active = TRUE ORDER BY customer_name');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/customers', authMiddleware, async (req, res) => {
  try { res.json(await smartInsert('customers', req.body)); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/customers/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/customers/:id', authMiddleware, async (req, res) => {
  try { res.json(await smartUpdate('customers', req.body, req.params.id)); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/customers/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('UPDATE customers SET is_active = FALSE WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ✅ FIXED: PUBLIC TRACKING API (Uses SELECT * to avoid missing column errors)
app.get('/api/consignments/track', async (req, res) => {
  try {
    const lr_no = req.query.lr_no;
    if (!lr_no) return res.status(400).json({ error: 'LR number is required' });
    
    // Use SELECT * to get all available columns safely
    const result = await pool.query(
      `SELECT * FROM consignments WHERE lr_no = $1`, 
      [lr_no]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Bilty not found' });
    res.json(result.rows[0]);
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

app.get('/api/consignments', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM consignments ORDER BY id DESC LIMIT 200');
    res.json({ data: result.rows, total: result.rows.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/consignments/:lr_no', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM consignments WHERE lr_no = $1', [req.params.lr_no]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/consignments', authMiddleware, async (req, res) => {
  try {
    const c = { ...req.body };
    if (!c.lr_no) c.lr_no = await generateBiltyNo();
    if (!c.status) c.status = 'Booked';
    if (!c.created_by) c.created_by = req.user.username;
    if (!c.lr_date) c.lr_date = new Date().toISOString().split('T')[0];
    const row = await smartInsert('consignments', c);
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put('/api/consignments/:id', authMiddleware, async (req, res) => {
  try { res.json(await smartUpdate('consignments', req.body, req.params.id)); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/consignments/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query("UPDATE consignments SET status = 'Cancelled' WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GATE PASS APIs
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
    const qr_code = Buffer.from(`GP:${pass_no}|LR:${lr_no}|Vehicle:${vehicle_no}`).toString('base64');
    const row = await pool.query(
      `INSERT INTO gate_passes (pass_no, lr_no, vehicle_no, driver_name, driver_mobile, material_desc, quantity, weight, valid_until, issued_by, qr_code) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [pass_no, lr_no, vehicle_no, driver_name, driver_mobile, material_desc, quantity, weight, valid_until, issued_by, qr_code]
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

// GADI CHALLAN API
app.post('/api/gadi-challan', authMiddleware, async (req, res) => {
  try {
    const {
      lr_no, vehicle_no, driver_name, driver_mobile, driver_license,
      owner_name, owner_mobile, broker_name, broker_mobile, broker_commission,
      from_place, to_place, material_desc, weight, packages,
      bilty_date, consignor_name, consignee_name,
      freight_amount, advance_paid, toll_expense, diesel_expense,
      other_expense, tds_deduction, issue_date
    } = req.body;

    const freight = parseFloat(freight_amount || 0);
    const advance = parseFloat(advance_paid || 0);
    const tds = parseFloat(tds_deduction || 0);
    const balance = freight - advance;
    const net_payable = freight - advance - tds;

    const year = String(new Date().getFullYear()).slice(-2);
    const result = await pool.query(`SELECT challan_no FROM gadi_challans WHERE challan_no LIKE $1 ORDER BY id DESC LIMIT 1`, [`GC/${year}/%`]);
    let nextSerial = 1;
    if (result.rows.length > 0) {
      const parts = result.rows[0].challan_no.split('/');
      if (parts.length === 3) nextSerial = parseInt(parts[2]) + 1;
    }
    const challan_no = `GC/${year}/${String(nextSerial).padStart(4, '0')}`;
    
    const row = await pool.query(
      `INSERT INTO gadi_challans 
       (challan_no, lr_no, vehicle_no, driver_name, driver_mobile, driver_license,
        owner_name, owner_mobile, broker_name, broker_mobile, broker_commission,
        from_place, to_place, material_desc, weight, packages,
        bilty_date, consignor_name, consignee_name,
        freight_amount, advance_paid, balance_due, toll_expense, diesel_expense,
        other_expense, tds_deduction, net_payable, issue_date) 
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28) 
       RETURNING *`,
      [challan_no, lr_no, vehicle_no, driver_name, driver_mobile, driver_license,
       owner_name, owner_mobile, broker_name, broker_mobile, broker_commission,
       from_place, to_place, material_desc, weight, packages,
       bilty_date, consignor_name, consignee_name,
       freight, advance, balance, toll_expense, diesel_expense,
       other_expense, tds, net_payable, issue_date]
    );
    res.json(row.rows[0]);
  } catch (err) {
    console.error('Gadi challan error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/gadi-challan', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM gadi_challans ORDER BY id DESC LIMIT 100');
    res.json({ data: result.rows, total: result.rows.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// BILLS
app.get('/api/bills', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM bill_book ORDER BY id DESC LIMIT 200');
    res.json({ data: result.rows, total: result.rows.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/bills', authMiddleware, async (req, res) => {
  try { res.json(await smartInsert('bill_book', req.body)); } catch (err) { res.status(500).json({ error: err.message }); }
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
  } catch (err) { res.status(500).json({ error: err.message }); }
});

async function ensureAdminUser() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const result = await pool.query('SELECT id FROM users WHERE username = $1', ['admin']);
    if (result.rows.length === 0) {
      await pool.query(`INSERT INTO users (username, password, full_name, role, is_active) VALUES ($1, $2, $3, $4, $5)`, ['admin', hashedPassword, 'Administrator', 'admin', true]);
    } else {
      await pool.query(`UPDATE users SET password = $1, is_active = TRUE WHERE username = $2`, [hashedPassword, 'admin']);
    }
  } catch (err) { console.error('⚠️ Could not setup admin user:', err.message); }
}
ensureAdminUser();

runMigrations().then(() => { console.log('✅ Database migrations completed'); });

app.listen(PORT, HOST, () => {
  console.log('✅ Bharat Transport API v3.0 running on port', PORT);
});

module.exports = app;

// ============ MR (MONEY RECEIPT) TABLE ============
await db.run(`CREATE TABLE IF NOT EXISTS money_receipts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mr_no TEXT UNIQUE NOT NULL,
  mr_date TEXT NOT NULL,
  party_type TEXT NOT NULL,
  party_name TEXT NOT NULL,
  bilty_id INTEGER,
  bilty_lr_no TEXT,
  bill_id INTEGER,
  bill_no TEXT,
  amount REAL NOT NULL,
  payment_mode TEXT DEFAULT 'Cash',
  is_advance INTEGER DEFAULT 0,
  remarks TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bilty_id) REFERENCES consignments(id),
  FOREIGN KEY (bill_id) REFERENCES bills(id)
)`);

console.log('✓ Money Receipts table created');

// ============ MR (MONEY RECEIPT) APIs ============

// Generate MR Number
function generateMRNo() {
  const year = new Date().getFullYear().toString().slice(-2);
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `MR/${year}/${random}`;
}

// Create MR
// Create MR with Auto Number (MR/26/0001 format)
app.post('/api/mr', async (req, res) => {
  try {
    const { mr_no, mr_date, party_type, party_name, bilty_id, bilty_lr_no, bill_id, bill_no, amount, payment_mode, is_advance, remarks } = req.body;
    
    // Auto-generate MR number in MR/YY/XXXX format
    let finalMRNo = mr_no;
    if (!finalMRNo || finalMRNo === 'Auto-generated') {
      const year = new Date().getFullYear().toString().slice(-2);
      const lastMR = await db.get(`SELECT mr_no FROM money_receipts WHERE mr_no LIKE 'MR/${year}/%' ORDER BY id DESC LIMIT 1`);
      let nextNum = 1;
      if (lastMR && lastMR.mr_no) {
        const parts = lastMR.mr_no.split('/');
        const lastNum = parseInt(parts[2] || '0');
        nextNum = lastNum + 1;
      }
      finalMRNo = `MR/${year}/${String(nextNum).padStart(4, '0')}`;
    }
    
    const finalDate = mr_date || new Date().toISOString().split('T')[0];
    const finalAmount = parseFloat(amount || 0);
    const finalIsAdvance = is_advance ? 1 : 0;
    
    const stmt = await db.prepare(`INSERT INTO money_receipts 
      (mr_no, mr_date, party_type, party_name, bilty_id, bilty_lr_no, bill_id, bill_no, amount, payment_mode, is_advance, remarks) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    
    await stmt.run(finalMRNo, finalDate, party_type, party_name, bilty_id || null, bilty_lr_no || null, bill_id || null, bill_no || null, finalAmount, payment_mode || 'Cash', finalIsAdvance, remarks || '');
    await stmt.finalize();
    
    if (bilty_id) {
      await db.run(`UPDATE consignments SET payment_status = 'Paid', mr_no = ? WHERE id = ?`, [finalMRNo, bilty_id]);
    }
    
    if (bill_id) {
      await db.run(`UPDATE bills SET payment_status = 'Paid', mr_no = ? WHERE id = ?`, [finalMRNo, bill_id]);
    }
    
    res.json({ success: true, mr_no: finalMRNo, message: 'MR created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
// Get All MRs
app.get('/api/mr', async (req, res) => {
  try {
    const mrs = await db.all(`SELECT * FROM money_receipts ORDER BY created_at DESC`);
    res.json({ data: mrs, count: mrs.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Single MR
app.get('/api/mr/:id', async (req, res) => {
  try {
    const mr = await db.get(`SELECT * FROM money_receipts WHERE id = ?`, [req.params.id]);
    if (!mr) return res.status(404).json({ error: 'MR not found' });
    res.json(mr);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update MR
app.put('/api/mr/:id', async (req, res) => {
  try {
    const { mr_date, party_type, party_name, amount, payment_mode, is_advance, remarks } = req.body;
    await db.run(`UPDATE money_receipts SET mr_date=?, party_type=?, party_name=?, amount=?, payment_mode=?, is_advance=?, remarks=? WHERE id=?`,
      [mr_date, party_type, party_name, amount, payment_mode, is_advance ? 1 : 0, remarks, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete MR
app.delete('/api/mr/:id', async (req, res) => {
  try {
    await db.run(`DELETE FROM money_receipts WHERE id = ?`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get MRs by Bilty
app.get('/api/mr/bilty/:biltyId', async (req, res) => {
  try {
    const mrs = await db.all(`SELECT * FROM money_receipts WHERE bilty_id = ?`, [req.params.biltyId]);
    res.json({ data: mrs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get MRs by Bill
app.get('/api/mr/bill/:billId', async (req, res) => {
  try {
    const mrs = await db.all(`SELECT * FROM money_receipts WHERE bill_id = ?`, [req.params.billId]);
    res.json({ data: mrs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
