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

// Cache for table columns
const tableColumnsCache = {};

// Get actual columns from database
async function getTableColumns(tableName) {
  if (tableColumnsCache[tableName]) {
    return tableColumnsCache[tableName];
  }
  const result = await pool.query(
    `SELECT column_name FROM information_schema.columns 
     WHERE table_name = $1 
     ORDER BY ordinal_position`,
    [tableName]
  );
  const columns = result.rows.map(r => r.column_name);
  tableColumnsCache[tableName] = columns;
  return columns;
}

// Smart insert - only uses columns that actually exist
async function smartInsert(tableName, data) {
  // Convert empty strings to null (fixes date field errors)
  for (let key in data) {
    if (data[key] === '') {
      data[key] = null;
    }
  }  
  const columns = await getTableColumns(tableName);
  
  // Filter: only keep keys that exist in table AND are not auto-generated
  const autoColumns = ['id', 'created_at', 'updated_at'];
  const validKeys = Object.keys(data).filter(
    key => columns.includes(key) && !autoColumns.includes(key) && data[key] !== undefined
  );
  
  if (validKeys.length === 0) {
    throw new Error('No valid columns to insert');
  }
  
  const columnsList = validKeys.join(', ');
  const placeholders = validKeys.map((_, i) => `$${i + 1}`).join(', ');
  const values = validKeys.map(key => data[key]);
  
  const query = `INSERT INTO ${tableName} (${columnsList}) VALUES (${placeholders}) RETURNING *`;
  const result = await pool.query(query, values);
  return result.rows[0];
}

// Smart update
async function smartUpdate(tableName, data, id) {
   // Convert empty strings to null (fixes date field errors)
  for (let key in data) {
    if (data[key] === '') {
      data[key] = null;
    }
  } 
  const columns = await getTableColumns(tableName);
  const autoColumns = ['id', 'created_at', 'updated_at', 'lr_no', 'bill_no'];
  const validKeys = Object.keys(data).filter(
    key => columns.includes(key) && !autoColumns.includes(key) && data[key] !== undefined
  );
  
  if (validKeys.length === 0) {
    throw new Error('No valid columns to update');
  }
  
  const setClause = validKeys.map((key, i) => `${key} = $${i + 1}`).join(', ');
  const values = validKeys.map(key => data[key]);
  values.push(id);
  
  const query = `UPDATE ${tableName} SET ${setClause}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`;
  const result = await pool.query(query, values);
  return result.rows[0];
}

async function generateBiltyNo() {
  const year = String(new Date().getFullYear()).slice(-2);
  let nextSerial = 1;
  
  // Try up to 100 times to find a unique LR number
  for (let attempt = 0; attempt < 100; attempt++) {
    const lrNo = `BTC/${year}/${String(nextSerial).padStart(4, '0')}`;
    
    // Check if this LR number already exists
    const check = await pool.query(
      `SELECT lr_no FROM consignments WHERE lr_no = $1`,
      [lrNo]
    );
    
    if (check.rows.length === 0) {
      return lrNo; // Found unique number
    }
    
    nextSerial++; // Try next number
  }
  
  throw new Error('Could not generate unique LR number');
}
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    req.user = jwt.verify(authHeader.substring(7), process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'Bharat Transport API v3.0 - Smart Column Detection' });
});

// AUTH
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt:', username);
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      console.log('User not found:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = result.rows[0];
    console.log('User found. Stored password:', user.password);
    console.log('Entered password:', password);
    
    let valid = false;
    
    // Try bcrypt compare
    if (user.password && user.password.startsWith('$2')) {
      try {
        valid = await bcrypt.compare(password, user.password);
        console.log('bcrypt compare result:', valid);
      } catch (e) {
        console.log('bcrypt error:', e.message);
        valid = false;
      }
    }
    
    // Fallback: plain text compare
    if (!valid && password === user.password) {
      valid = true;
      console.log('Plain text match');
    }
    
    if (!valid) {
      console.log('Login failed for:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    console.log('Login successful for:', username);
    res.json({ success: true, token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    console.error('Login error:', err.message);
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
  try {
    const row = await smartInsert('customers', req.body);
    res.json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/customers/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/customers/:id', authMiddleware, async (req, res) => {
  try {
    const row = await smartUpdate('customers', req.body, req.params.id);
    res.json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/customers/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('UPDATE customers SET is_active = FALSE WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// CONSIGNMENTS (BILTY) - SMART INSERT
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
    console.error('Consignment insert error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/consignments/:id', authMiddleware, async (req, res) => {
  try {
    const row = await smartUpdate('consignments', req.body, req.params.id);
    res.json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/consignments/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query("UPDATE consignments SET status = 'Cancelled' WHERE id = $1", [req.params.id]);
    res.json({ success: true });
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
  try {
    const row = await smartInsert('bill_book', req.body);
    res.json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
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
// Force-reset admin password to 'admin123'
async function ensureAdminUser() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const result = await pool.query('SELECT id FROM users WHERE username = $1', ['admin']);
    
    if (result.rows.length === 0) {
      // Create new admin
      await pool.query(
        `INSERT INTO users (username, password, full_name, role, is_active) 
         VALUES ($1, $2, $3, $4, $5)`,
        ['admin', hashedPassword, 'Administrator', 'admin', true]
      );
      console.log('✅ New admin user created (username: admin, password: admin123)');
    } else {
      // Update existing admin password
      await pool.query(
        `UPDATE users SET password = $1, is_active = TRUE WHERE username = $2`,
        [hashedPassword, 'admin']
      );
      console.log('✅ Admin password reset to admin123');
    }
  } catch (err) {
    console.error('⚠️ Could not setup admin user:', err.message);
  }
}

ensureAdminUser();
ensureAdminUser();
app.listen(PORT, HOST, () => {
  console.log('✅ Bharat Transport API v3.0 running on port', PORT);
  console.log('✅ Smart Column Detection Enabled - No more missing column errors!');
});

module.exports = app;
