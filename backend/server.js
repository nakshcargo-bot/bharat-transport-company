// ============================================
// BHARAT TRANSPORT COMPANY - BACKEND SERVER
// Version 2.0 (Complete + Fixed)
// ============================================

console.log('=== SERVER.JS STARTING ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);

// ============================================
// REQUIRES
// ============================================
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// ============================================
// UNCAUGHT EXCEPTION HANDLER
// ============================================
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err.message);
  console.error('Stack:', err.stack);
});

process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason);
});

// ============================================
// EXPRESS APP
// ============================================
const app = express();
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// ============================================
// DATABASE CONNECTION (POOL - multiple connections)
// ============================================
console.log('Creating database pool...');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err.message);
});

pool.connect()
  .then((client) => {
    console.log('✅ DATABASE CONNECTED SUCCESSFULLY!');
    client.release();
  })
  .catch((err) => {
    console.error('❌ DATABASE CONNECTION FAILED:', err.message);
  });

// ============================================
// HELPER FUNCTIONS
// ============================================

// Get current financial year (Apr-Mar)
function getFinancialYear() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12

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

// Generate Bilty Number: BTC/26/0001 → BTC/26/10000
async function generateBiltyNo() {
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2);

  const result = await pool.query(
    `SELECT lr_no FROM consignments 
     WHERE lr_no LIKE $1 
     ORDER BY id DESC LIMIT 1`,
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

  // Pad to minimum 4 digits
  let serialStr = String(nextSerial);
  while (serialStr.length < 4) {
    serialStr = '0' + serialStr;
  }

  return `BTC/${year}/${serialStr}`;
}

// Generate Bill Number: BTC-BILL/26/0001
async function generateBillNo() {
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2);

  const result = await pool.query(
    `SELECT bill_no FROM bill_book 
     WHERE bill_no LIKE $1 
     ORDER BY id DESC LIMIT 1`,
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

// Generate Trip Number: TRIP/26/0001
async function generateTripNo() {
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2);

  const result = await pool.query(
    `SELECT trip_no FROM trips 
     WHERE trip_no LIKE $1 
     ORDER BY id DESC LIMIT 1`,
    [`TRIP/${year}/%`]
  );

  let nextSerial = 1;
  if (result.rows.length > 0) {
    const lastTripNo = result.rows[0].trip_no;
    const parts = lastTripNo.split('/');
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

  return `TRIP/${year}/${serialStr}`;
}

// ============================================
// AUTH MIDDLEWARE (JWT Verify)
// ============================================
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

// ============================================
// HEALTH CHECK
// ============================================
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    company: 'BHARAT TRANSPORT COMPANY',
    message: 'Backend API v2.0 running',
    time: new Date().toISOString()
  });
});

// ============================================
// AUTH ROUTES
// ============================================

// Login
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

    // Try bcrypt first, then plain text
    let validPassword = false;
    try {
      validPassword = await bcrypt.compare(password, user.password);
    } catch (e) {
      validPassword = false;
    }

    if (!validPassword && password === user.password) {
      validPassword = true;
    }

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        branch_code: user.branch_code
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Update last login
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

// Register new user (only admin can do this - protected)
app.post('/api/auth/register', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can register users' });
    }

    const { username, password, full_name, role, branch_code, mobile, email } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (username, password, full_name, role, branch_code, mobile, email)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, username, full_name, role, branch_code, mobile, email`,
      [username, hashedPassword, full_name, role || 'branch', branch_code, mobile, email]
    );

    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Username already exists' });
    }
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get current user profile
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, full_name, role, branch_code, mobile, email, last_login FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Change password
app.post('/api/auth/change-password', authMiddleware, async (req, res) => {
  try {
    const { old_password, new_password } = req.body;

    if (!old_password || !new_password) {
      return res.status(400).json({ error: 'Old and new password required' });
    }

    const result = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];

    let validOld = false;
    try {
      validOld = await bcrypt.compare(old_password, user.password);
    } catch (e) {
      validOld = false;
    }
    if (!validOld && old_password === user.password) {
      validOld = true;
    }

    if (!validOld) {
      return res.status(401).json({ error: 'Old password is incorrect' });
    }

    const hashedNew = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedNew, req.user.id]);

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// CUSTOMER ROUTES (Party Master)
// ============================================

// Get all customers
app.get('/api/customers', authMiddleware, async (req, res) => {
  try {
    const { search, type } = req.query;
    let query = 'SELECT * FROM customers WHERE is_active = TRUE';
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (customer_name ILIKE $${params.length} 
                 OR customer_code ILIKE $${params.length} 
                 OR mobile ILIKE $${params.length} 
                 OR gst_no ILIKE $${params.length})`;
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

// Get single customer
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

// Create new customer
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

    // Auto-generate customer_code if not provided
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

// Update customer
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

// Soft delete customer (set is_active = false)
app.delete('/api/customers/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE customers SET is_active = FALSE WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ success: true, message: 'Customer deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// BRANCH ROUTES
// ============================================

app.get('/api/branches', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM branches WHERE is_active = TRUE ORDER BY branch_code'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/branches/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM branches WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Branch not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/branches', authMiddleware, async (req, res) => {
  try {
    const {
      branch_code, branch_name, address, city, state, pincode,
      mobile, email, gst_no, manager_name
    } = req.body;

    if (!branch_code || !branch_name) {
      return res.status(400).json({ error: 'Branch code and name required' });
    }

    const result = await pool.query(
      `INSERT INTO branches (branch_code, branch_name, address, city, state, pincode, mobile, email, gst_no, manager_name)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [branch_code, branch_name, address, city, state, pincode, mobile, email, gst_no, manager_name]
    );

    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Branch code already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/branches/:id', authMiddleware, async (req, res) => {
  try {
    const {
      branch_code, branch_name, address, city, state, pincode,
      mobile, email, gst_no, manager_name, is_active
    } = req.body;

    const result = await pool.query(
      `UPDATE branches SET
        branch_code = COALESCE($1, branch_code),
        branch_name = COALESCE($2, branch_name),
        address = COALESCE($3, address),
        city = COALESCE($4, city),
        state = COALESCE($5, state),
        pincode = COALESCE($6, pincode),
        mobile = COALESCE($7, mobile),
        email = COALESCE($8, email),
        gst_no = COALESCE($9, gst_no),
        manager_name = COALESCE($10, manager_name),
        is_active = COALESCE($11, is_active)
      WHERE id = $12 RETURNING *`,
      [branch_code, branch_name, address, city, state, pincode, mobile, email, gst_no, manager_name, is_active, req.params.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Branch not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/branches/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('UPDATE branches SET is_active = FALSE WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Branch deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// DRIVER ROUTES
// ============================================

app.get('/api/drivers', authMiddleware, async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM drivers WHERE is_active = TRUE';
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (driver_name ILIKE $1 OR mobile ILIKE $1 OR license_no ILIKE $1)`;
    }

    query += ' ORDER BY driver_name';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/drivers/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM drivers WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Driver not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/drivers', authMiddleware, async (req, res) => {
  try {
    const {
      driver_name, mobile, license_no, license_expiry, aadhaar_no,
      address, date_of_birth, blood_group, emergency_contact
    } = req.body;

    if (!driver_name) {
      return res.status(400).json({ error: 'Driver name required' });
    }

    const result = await pool.query(
      `INSERT INTO drivers (driver_name, mobile, license_no, license_expiry, aadhaar_no, address, date_of_birth, blood_group, emergency_contact)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [driver_name, mobile, license_no, license_expiry, aadhaar_no, address, date_of_birth, blood_group, emergency_contact]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/drivers/:id', authMiddleware, async (req, res) => {
  try {
    const {
      driver_name, mobile, license_no, license_expiry, aadhaar_no,
      address, date_of_birth, blood_group, emergency_contact, is_active
    } = req.body;

    const result = await pool.query(
      `UPDATE drivers SET
        driver_name = COALESCE($1, driver_name),
        mobile = COALESCE($2, mobile),
        license_no = COALESCE($3, license_no),
        license_expiry = COALESCE($4, license_expiry),
        aadhaar_no = COALESCE($5, aadhaar_no),
        address = COALESCE($6, address),
        date_of_birth = COALESCE($7, date_of_birth),
        blood_group = COALESCE($8, blood_group),
        emergency_contact = COALESCE($9, emergency_contact),
        is_active = COALESCE($10, is_active)
      WHERE id = $11 RETURNING *`,
      [driver_name, mobile, license_no, license_expiry, aadhaar_no, address, date_of_birth, blood_group, emergency_contact, is_active, req.params.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Driver not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/drivers/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('UPDATE drivers SET is_active = FALSE WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Driver deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// VEHICLE ROUTES
// ============================================

app.get('/api/vehicles', authMiddleware, async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM vehicles WHERE is_active = TRUE';
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (vehicle_no ILIKE $1 OR vehicle_type ILIKE $1)`;
    }

    query += ' ORDER BY vehicle_no';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/vehicles/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vehicles WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Vehicle not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/vehicles', authMiddleware, async (req, res) => {
  try {
    const {
      vehicle_no, vehicle_type, owner_type, owner_vendor_id, capacity_mt,
      rc_no, insurance_no, insurance_expiry, fitness_expiry, permit_expiry,
      pollution_expiry, gps_device_id
    } = req.body;

    if (!vehicle_no) {
      return res.status(400).json({ error: 'Vehicle number required' });
    }

    const result = await pool.query(
      `INSERT INTO vehicles (vehicle_no, vehicle_type, owner_type, owner_vendor_id, capacity_mt, rc_no, insurance_no, insurance_expiry, fitness_expiry, permit_expiry, pollution_expiry, gps_device_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [vehicle_no, vehicle_type, owner_type, owner_vendor_id, capacity_mt, rc_no, insurance_no, insurance_expiry, fitness_expiry, permit_expiry, pollution_expiry, gps_device_id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Vehicle number already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/vehicles/:id', authMiddleware, async (req, res) => {
  try {
    const {
      vehicle_no, vehicle_type, owner_type, owner_vendor_id, capacity_mt,
      rc_no, insurance_no, insurance_expiry, fitness_expiry, permit_expiry,
      pollution_expiry, gps_device_id, is_active
    } = req.body;

    const result = await pool.query(
      `UPDATE vehicles SET
        vehicle_no = COALESCE($1, vehicle_no),
        vehicle_type = COALESCE($2, vehicle_type),
        owner_type = COALESCE($3, owner_type),
        owner_vendor_id = COALESCE($4, owner_vendor_id),
        capacity_mt = COALESCE($5, capacity_mt),
        rc_no = COALESCE($6, rc_no),
        insurance_no = COALESCE($7, insurance_no),
        insurance_expiry = COALESCE($8, insurance_expiry),
        fitness_expiry = COALESCE($9, fitness_expiry),
        permit_expiry = COALESCE($10, permit_expiry),
        pollution_expiry = COALESCE($11, pollution_expiry),
        gps_device_id = COALESCE($12, gps_device_id),
        is_active = COALESCE($13, is_active)
      WHERE id = $14 RETURNING *`,
      [vehicle_no, vehicle_type, owner_type, owner_vendor_id, capacity_mt, rc_no, insurance_no, insurance_expiry, fitness_expiry, permit_expiry, pollution_expiry, gps_device_id, is_active, req.params.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Vehicle not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/vehicles/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('UPDATE vehicles SET is_active = FALSE WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Vehicle deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ITEM ROUTES
// ============================================

app.get('/api/items', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM items WHERE is_active = TRUE ORDER BY item_name'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/items/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM items WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/items', authMiddleware, async (req, res) => {
  try {
    const {
      item_code, item_name, hsn_code, unit, category,
      default_rate, is_fragile, is_hazardous
    } = req.body;

    if (!item_name) {
      return res.status(400).json({ error: 'Item name required' });
    }

    const result = await pool.query(
      `INSERT INTO items (item_code, item_name, hsn_code, unit, category, default_rate, is_fragile, is_hazardous)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [item_code, item_name, hsn_code, unit || 'MT', category, default_rate || 0, is_fragile || false, is_hazardous || false]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/items/:id', authMiddleware, async (req, res) => {
  try {
    const {
      item_code, item_name, hsn_code, unit, category,
      default_rate, is_fragile, is_hazardous, is_active
    } = req.body;

    const result = await pool.query(
      `UPDATE items SET
        item_code = COALESCE($1, item_code),
        item_name = COALESCE($2, item_name),
        hsn_code = COALESCE($3, hsn_code),
        unit = COALESCE($4, unit),
        category = COALESCE($5, category),
        default_rate = COALESCE($6, default_rate),
        is_fragile = COALESCE($7, is_fragile),
        is_hazardous = COALESCE($8, is_hazardous),
        is_active = COALESCE($9, is_active)
      WHERE id = $10 RETURNING *`,
      [item_code, item_name, hsn_code, unit, category, default_rate, is_fragile, is_hazardous, is_active, req.params.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/items/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('UPDATE items SET is_active = FALSE WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// END OF PART 1
// ============================================
// ============================================
console.log('✅ Part 1 loaded: Auth + Customers + Branches + Drivers + Vehicles + Items');
// ============================================
// PART 2: BILTY (LR) + BILLING
// ============================================

// ============================================
// CONSIGNMENT (BILTY / LR) ROUTES
// ============================================

// Get all consignments (with filters + pagination)
app.get('/api/consignments', authMiddleware, async (req, res) => {
  try {
    const {
      search, status, from_code, to_code, branch_code,
      date_from, date_to, page = 1, limit = 50
    } = req.query;

    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM consignments WHERE 1=1';
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (lr_no ILIKE $${params.length} 
                 OR consignor_name ILIKE $${params.length} 
                 OR consignee_name ILIKE $${params.length} 
                 OR consignee_mobile ILIKE $${params.length}
                 OR invoice_no ILIKE $${params.length})`;
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

    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Add pagination
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

// Get single consignment by LR No
app.get('/api/consignments/:lr_no', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM consignments WHERE lr_no = $1',
      [req.params.lr_no]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'LR not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new consignment (Bilty)
app.post('/api/consignments', authMiddleware, async (req, res) => {
  try {
    const c = req.body;

    // Auto-generate LR No if not provided
    if (!c.lr_no) {
      c.lr_no = await generateBiltyNo();
    }

    // Auto-generate amount in words (if not provided)
    // (Frontend will handle this normally)

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
        length, width, height, dimension_pkgs, cft_cmt,
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
        $57,$58,$59,$60,$61,$62,$63,$64,$65,$66,$67,$68,$69,$70
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
        c.length, c.width, c.height, c.cft_cmt, c.distance_km,
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

    const newConsignment = result.rows[0];

    // Auto-reduce stock for Bilty
    try {
      await pool.query(
        `INSERT INTO stock_transactions (item_id, branch_code, transaction_type, quantity, reference_no, transaction_date, created_by)
         SELECT id, $1, 'OUT', 1, $2, CURRENT_DATE, $3
         FROM stock_items WHERE item_type = 'bilty' LIMIT 1`,
        [c.branch_code, newConsignment.lr_no, req.user.username]
      );

      // Check stock level and create alert if needed
      const stockResult = await pool.query(
        `SELECT si.id, si.item_name, si.min_level, si.critical_level,
          COALESCE(SUM(CASE WHEN st.transaction_type = 'IN' THEN st.quantity ELSE -st.quantity END), 0) as current_stock
         FROM stock_items si
         LEFT JOIN stock_transactions st ON st.item_id = si.id AND st.branch_code = $1
         WHERE si.item_type = 'bilty'
         GROUP BY si.id`,
        [c.branch_code]
      );

      if (stockResult.rows.length > 0) {
        const stock = stockResult.rows[0];
        const currentStock = parseInt(stock.current_stock);

        if (currentStock <= stock.critical_level) {
          await pool.query(
            `INSERT INTO stock_alerts (item_id, branch_code, current_stock, alert_level)
             VALUES ($1, $2, $3, $4)`,
            [stock.id, c.branch_code, currentStock, currentStock <= 10 ? 'urgent' : 'critical']
          );
        } else if (currentStock <= stock.min_level) {
          await pool.query(
            `INSERT INTO stock_alerts (item_id, branch_code, current_stock, alert_level)
             VALUES ($1, $2, $3, 'warning')`,
            [stock.id, c.branch_code, currentStock]
          );
        }
      }
    } catch (stockErr) {
      console.error('Stock update error (non-fatal):', stockErr.message);
    }

    res.json(newConsignment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Update consignment
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

// Update consignment status only (Booked → In-Transit → Delivered)
app.patch('/api/consignments/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status, location, remarks } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status required' });
    }

    const result = await pool.query(
      'UPDATE consignments SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Consignment not found' });
    }

    // Log status history
    await pool.query(
      `INSERT INTO delivery_status (lr_no, status, location, remarks, updated_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [result.rows[0].lr_no, status, location, remarks, req.user.username]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete consignment (cancel)
app.delete('/api/consignments/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "UPDATE consignments SET status = 'Cancelled', updated_at = NOW() WHERE id = $1 RETURNING *",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Consignment not found' });
    }

    res.json({ success: true, message: 'Consignment cancelled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// BILL BOOK (INVOICE) ROUTES
// ============================================

// Get all bills
app.get('/api/bills', authMiddleware, async (req, res) => {
  try {
    const {
      search, status, customer_id, branch_code,
      date_from, date_to, page = 1, limit = 50
    } = req.query;

    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM bill_book WHERE 1=1';
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (bill_no ILIKE $${params.length} 
                 OR party_name ILIKE $${params.length} 
                 OR invoice_no ILIKE $${params.length})`;
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

// Get single bill with items
app.get('/api/bills/:bill_no', authMiddleware, async (req, res) => {
  try {
    const bill = await pool.query(
      'SELECT * FROM bill_book WHERE bill_no = $1',
      [req.params.bill_no]
    );

    if (bill.rows.length === 0) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    const items = await pool.query(
      'SELECT * FROM bill_items WHERE bill_id = $1',
      [bill.rows[0].id]
    );

    const payments = await pool.query(
      'SELECT * FROM bill_payments WHERE bill_id = $1 ORDER BY payment_date',
      [bill.rows[0].id]
    );

    res.json({ ...bill.rows[0], items: items.rows, payments: payments.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new bill
app.post('/api/bills', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const b = req.body;

    // Auto-generate Bill No
    if (!b.bill_no) {
      b.bill_no = await generateBillNo();
    }

    const result = await client.query(
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

    const billId = result.rows[0].id;

    // Insert bill items
    if (b.items && b.items.length > 0) {
      for (const item of b.items) {
        await client.query(
          `INSERT INTO bill_items (bill_id, lr_no, invoice_no, from_name, to_name, weight_mt, loading, unloading, other_charges, total)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [
            billId, item.lr_no, item.invoice_no, item.from_name, item.to_name,
            item.weight_mt || 0, item.loading || 0, item.unloading || 0,
            item.other_charges || 0, item.total || 0
          ]
        );
      }
    }

    // Auto-reduce stock for Bill
    try {
      await client.query(
        `INSERT INTO stock_transactions (item_id, branch_code, transaction_type, quantity, reference_no, transaction_date, created_by)
         SELECT id, $1, 'OUT', 1, $2, CURRENT_DATE, $3
         FROM stock_items WHERE item_type = 'bill' LIMIT 1`,
        [b.branch_code, result.rows[0].bill_no, req.user.username]
      );
    } catch (stockErr) {
      console.error('Stock update error (non-fatal):', stockErr.message);
    }

    await client.query('COMMIT');
    res.json({ ...result.rows[0], items: b.items });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Update bill
app.put('/api/bills/:id', authMiddleware, async (req, res) => {
  try {
    const b = req.body;

    const result = await pool.query(
      `UPDATE bill_book SET
        party_name = COALESCE($1, party_name),
        party_gst = COALESCE($2, party_gst),
        party_address = COALESCE($3, party_address),
        invoice_no = COALESCE($4, invoice_no),
        from_name = COALESCE($5, from_name),
        to_name = COALESCE($6, to_name),
        consignor_name = COALESCE($7, consignor_name),
        consignee_name = COALESCE($8, consignee_name),
        vehicle_no = COALESCE($9, vehicle_no),
        grand_total = COALESCE($10, grand_total),
        advance_received = COALESCE($11, advance_received),
        balance_due = COALESCE($12, balance_due),
        trip_subtotal = COALESCE($13, trip_subtotal),
        gst_percent = COALESCE($14, gst_percent),
        gst_amount = COALESCE($15, gst_amount),
        net_balance = COALESCE($16, net_balance),
        payment_mode = COALESCE($17, payment_mode),
        payment_details = COALESCE($18, payment_details),
        amount_in_words = COALESCE($19, amount_in_words),
        status = COALESCE($20, status),
        remarks = COALESCE($21, remarks)
      WHERE id = $22 RETURNING *`,
      [
        b.party_name, b.party_gst, b.party_address, b.invoice_no,
        b.from_name, b.to_name, b.consignor_name, b.consignee_name,
        b.vehicle_no, b.grand_total, b.advance_received, b.balance_due,
        b.trip_subtotal, b.gst_percent, b.gst_amount, b.net_balance,
        b.payment_mode, b.payment_details, b.amount_in_words,
        b.status, b.remarks, req.params.id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add payment to bill
app.post('/api/bills/:id/payments', authMiddleware, async (req, res) => {
  try {
    const { payment_date, amount, payment_mode, reference_no, remarks } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount required' });
    }

    const result = await pool.query(
      `INSERT INTO bill_payments (bill_id, payment_date, amount, payment_mode, reference_no, remarks)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.params.id, payment_date || new Date(), amount, payment_mode, reference_no, remarks]
    );

    // Update bill's advance_received and balance_due
    const billResult = await pool.query(
      `UPDATE bill_book SET
        advance_received = advance_received + $1,
        balance_due = GREATEST(0, balance_due - $1),
        status = CASE 
          WHEN balance_due - $1 <= 0 THEN 'Paid'
          WHEN advance_received + $1 > 0 THEN 'Partial'
          ELSE status
        END
      WHERE id = $2 RETURNING *`,
      [amount, req.params.id]
    );

    res.json({ payment: result.rows[0], bill: billResult.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete bill (cancel)
app.delete('/api/bills/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "UPDATE bill_book SET status = 'Cancelled' WHERE id = $1 RETURNING *",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    res.json({ success: true, message: 'Bill cancelled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// POD (Proof of Delivery) ROUTES
// ============================================

app.get('/api/pod', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pod ORDER BY id DESC LIMIT 100');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/pod/:lr_no', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pod WHERE lr_no = $1', [req.params.lr_no]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/pod', authMiddleware, async (req, res) => {
  try {
    const {
      lr_no, delivery_date, received_by, receiver_mobile,
      signature_url, photo_url, delivery_remarks
    } = req.body;

    if (!lr_no) {
      return res.status(400).json({ error: 'LR No required' });
    }

    const result = await pool.query(
      `INSERT INTO pod (lr_no, delivery_date, received_by, receiver_mobile, signature_url, photo_url, delivery_remarks, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [lr_no, delivery_date || new Date(), received_by, receiver_mobile, signature_url, photo_url, delivery_remarks, req.user.username]
    );

    // Update consignment status to Delivered
    await pool.query(
      "UPDATE consignments SET status = 'Delivered', updated_at = NOW() WHERE lr_no = $1",
      [lr_no]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// E-WAY BILL ROUTES
// ============================================

app.get('/api/eway-bills', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM eway_bills ORDER BY id DESC LIMIT 100');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/eway-bills', authMiddleware, async (req, res) => {
  try {
    const e = req.body;

    const result = await pool.query(
      `INSERT INTO eway_bills (eway_bill_no, eway_date, valid_upto, lr_no, from_gst, to_gst, vehicle_no, transporter_id, distance_km, taxable_value, total_value, status, remarks)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [
        e.eway_bill_no, e.eway_date, e.valid_upto, e.lr_no,
        e.from_gst, e.to_gst, e.vehicle_no, e.transporter_id,
        e.distance_km, e.taxable_value, e.total_value,
        e.status || 'Active', e.remarks
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// WHATSAPP LOG ROUTES
// ============================================

app.get('/api/notifications', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM notifications ORDER BY id DESC LIMIT 100');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notifications/whatsapp', authMiddleware, async (req, res) => {
  try {
    const { recipient_mobile, recipient_name, reference_no, message, status } = req.body;

    const result = await pool.query(
      `INSERT INTO notifications (notification_type, recipient_mobile, recipient_name, reference_no, message, status, created_by)
       VALUES ('whatsapp', $1, $2, $3, $4, $5, $6) RETURNING *`,
      [recipient_mobile, recipient_name, reference_no, message, status || 'Sent', req.user.username]
    );

    // Generate wa.me link
    const cleanMobile = String(recipient_mobile).replace(/\D/g, '');
    const waLink = `https://wa.me/${cleanMobile.startsWith('91') ? cleanMobile : '91' + cleanMobile}?text=${encodeURIComponent(message)}`;

    res.json({ notification: result.rows[0], wa_link: waLink });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// END OF PART 2
// ============================================
console.log('✅ Part 2 loaded: Consignments + Bills + POD + E-way + WhatsApp log');
// ============================================
// PART 3: TRIP + ACCOUNTING + STOCK
// ============================================

// ============================================
// TRIP / MANIFEST ROUTES
// ============================================

// Get all trips
app.get('/api/trips', authMiddleware, async (req, res) => {
  try {
    const {
      search, status, vehicle_id, driver_id,
      date_from, date_to, page = 1, limit = 50
    } = req.query;

    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM trips WHERE 1=1';
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (trip_no ILIKE $${params.length} 
                 OR vehicle_no ILIKE $${params.length} 
                 OR driver_name ILIKE $${params.length})`;
    }

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    if (vehicle_id) {
      params.push(vehicle_id);
      query += ` AND vehicle_id = $${params.length}`;
    }

    if (driver_id) {
      params.push(driver_id);
      query += ` AND driver_id = $${params.length}`;
    }

    if (date_from) {
      params.push(date_from);
      query += ` AND trip_date >= $${params.length}`;
    }

    if (date_to) {
      params.push(date_to);
      query += ` AND trip_date <= $${params.length}`;
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

// Get single trip with consignments + expenses
app.get('/api/trips/:id', authMiddleware, async (req, res) => {
  try {
    const trip = await pool.query('SELECT * FROM trips WHERE id = $1', [req.params.id]);
    if (trip.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const consignments = await pool.query(
      `SELECT c.* FROM consignments c
       JOIN trip_consignments tc ON tc.consignment_id = c.id
       WHERE tc.trip_id = $1`,
      [req.params.id]
    );

    const expenses = await pool.query(
      'SELECT * FROM trip_expenses WHERE trip_id = $1 ORDER BY expense_date',
      [req.params.id]
    );

    const advances = await pool.query(
      'SELECT * FROM driver_advances WHERE trip_id = $1 ORDER BY advance_date',
      [req.params.id]
    );

    // Calculate totals
    const totalFreight = consignments.rows.reduce((sum, c) => sum + parseFloat(c.grand_total || 0), 0);
    const totalExpense = expenses.rows.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const totalAdvance = advances.rows.reduce((sum, a) => sum + parseFloat(a.amount || 0), 0);
    const totalWeight = consignments.rows.reduce((sum, c) => sum + parseFloat(c.charged_weight || 0), 0);

    res.json({
      ...trip.rows[0],
      consignments: consignments.rows,
      expenses: expenses.rows,
      advances: advances.rows,
      summary: {
        total_freight: totalFreight,
        total_expense: totalExpense,
        total_advance: totalAdvance,
        total_weight: totalWeight,
        net_profit: totalFreight - totalExpense,
        consignment_count: consignments.rows.length
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new trip
app.post('/api/trips', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const t = req.body;

    // Auto-generate Trip No
    if (!t.trip_no) {
      t.trip_no = await generateTripNo();
    }

    const result = await client.query(
      `INSERT INTO trips (
        trip_no, trip_date, vehicle_id, vehicle_no, driver_id, driver_name,
        from_code, to_code, start_km, end_km, total_km,
        start_time, end_time, status, remarks, created_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      RETURNING *`,
      [
        t.trip_no, t.trip_date, t.vehicle_id, t.vehicle_no, t.driver_id, t.driver_name,
        t.from_code, t.to_code, t.start_km, t.end_km, t.total_km,
        t.start_time, t.end_time, t.status || 'Running', t.remarks, req.user.username
      ]
    );

    const tripId = result.rows[0].id;

    // Add consignments to trip
    if (t.consignment_ids && t.consignment_ids.length > 0) {
      for (const consId of t.consignment_ids) {
        await client.query(
          'INSERT INTO trip_consignments (trip_id, consignment_id) VALUES ($1, $2)',
          [tripId, consId]
        );

        // Update consignment status to In-Transit
        await client.query(
          "UPDATE consignments SET status = 'In-Transit', updated_at = NOW() WHERE id = $1",
          [consId]
        );
      }
    }

    // Add expenses if any
    if (t.expenses && t.expenses.length > 0) {
      for (const exp of t.expenses) {
        await client.query(
          `INSERT INTO trip_expenses (trip_id, expense_date, expense_type, amount, paid_to, reference_no, remarks, created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [tripId, exp.expense_date || t.trip_date, exp.expense_type, exp.amount, exp.paid_to, exp.reference_no, exp.remarks, req.user.username]
        );
      }
    }

    // Add driver advance if any
    if (t.advance_amount && t.advance_amount > 0) {
      await client.query(
        `INSERT INTO driver_advances (driver_id, trip_id, advance_date, amount, payment_mode, remarks)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [t.driver_id, tripId, t.trip_date, t.advance_amount, t.advance_mode || 'Cash', 'Trip advance']
      );
    }

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Update trip
app.put('/api/trips/:id', authMiddleware, async (req, res) => {
  try {
    const t = req.body;

    const result = await pool.query(
      `UPDATE trips SET
        vehicle_id = COALESCE($1, vehicle_id),
        vehicle_no = COALESCE($2, vehicle_no),
        driver_id = COALESCE($3, driver_id),
        driver_name = COALESCE($4, driver_name),
        from_code = COALESCE($5, from_code),
        to_code = COALESCE($6, to_code),
        start_km = COALESCE($7, start_km),
        end_km = COALESCE($8, end_km),
        total_km = COALESCE($9, total_km),
        start_time = COALESCE($10, start_time),
        end_time = COALESCE($11, end_time),
        status = COALESCE($12, status),
        remarks = COALESCE($13, remarks)
      WHERE id = $14 RETURNING *`,
      [
        t.vehicle_id, t.vehicle_no, t.driver_id, t.driver_name,
        t.from_code, t.to_code, t.start_km, t.end_km, t.total_km,
        t.start_time, t.end_time, t.status, t.remarks,
        req.params.id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // If trip is completed, update all consignments status
    if (t.status === 'Completed') {
      await pool.query(
        `UPDATE consignments SET status = 'Reached', updated_at = NOW()
         WHERE id IN (SELECT consignment_id FROM trip_consignments WHERE trip_id = $1)`,
        [req.params.id]
      );
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete trip
app.delete('/api/trips/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM trips WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Trip deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// TRIP EXPENSES ROUTES
// ============================================

app.get('/api/trip-expenses', authMiddleware, async (req, res) => {
  try {
    const { trip_id } = req.query;
    let query = 'SELECT * FROM trip_expenses';
    const params = [];

    if (trip_id) {
      params.push(trip_id);
      query += ' WHERE trip_id = $1';
    }

    query += ' ORDER BY id DESC LIMIT 200';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/trip-expenses', authMiddleware, async (req, res) => {
  try {
    const e = req.body;

    if (!e.trip_id || !e.amount) {
      return res.status(400).json({ error: 'Trip ID and amount required' });
    }

    const result = await pool.query(
      `INSERT INTO trip_expenses (trip_id, expense_date, expense_type, amount, paid_to, reference_no, remarks, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [e.trip_id, e.expense_date || new Date(), e.expense_type, e.amount, e.paid_to, e.reference_no, e.remarks, req.user.username]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/trip-expenses/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM trip_expenses WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Expense deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// DRIVER ADVANCES
// ============================================

app.get('/api/driver-advances', authMiddleware, async (req, res) => {
  try {
    const { driver_id, trip_id } = req.query;
    let query = 'SELECT * FROM driver_advances WHERE 1=1';
    const params = [];

    if (driver_id) {
      params.push(driver_id);
      query += ` AND driver_id = $${params.length}`;
    }
    if (trip_id) {
      params.push(trip_id);
      query += ` AND trip_id = $${params.length}`;
    }

    query += ' ORDER BY id DESC LIMIT 200';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/driver-advances', authMiddleware, async (req, res) => {
  try {
    const a = req.body;

    const result = await pool.query(
      `INSERT INTO driver_advances (driver_id, trip_id, advance_date, amount, payment_mode, remarks)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [a.driver_id, a.trip_id, a.advance_date || new Date(), a.amount, a.payment_mode || 'Cash', a.remarks]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// PAYMENT ROUTES (Party Receipt)
// ============================================

app.get('/api/payments', authMiddleware, async (req, res) => {
  try {
    const {
      search, customer_id, branch_code,
      date_from, date_to, page = 1, limit = 50
    } = req.query;

    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM payments WHERE 1=1';
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (payment_no ILIKE $${params.length} 
                 OR party_name ILIKE $${params.length} 
                 OR reference_no ILIKE $${params.length})`;
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
      query += ` AND payment_date >= $${params.length}`;
    }

    if (date_to) {
      params.push(date_to);
      query += ` AND payment_date <= $${params.length}`;
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

app.post('/api/payments', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const p = req.body;

    // Auto-generate payment number
    if (!p.payment_no) {
      const countResult = await client.query('SELECT COUNT(*) FROM payments');
      const nextNo = parseInt(countResult.rows[0].count) + 1;
      p.payment_no = 'PAY/' + String(nextNo).padStart(5, '0');
    }

    const result = await client.query(
      `INSERT INTO payments (payment_no, payment_date, customer_id, party_name, amount, payment_mode, reference_no, bank_name, branch_code, against_bill_no, remarks, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [
        p.payment_no, p.payment_date || new Date(), p.customer_id, p.party_name,
        p.amount, p.payment_mode, p.reference_no, p.bank_name,
        p.branch_code, p.against_bill_no, p.remarks, req.user.username
      ]
    );

    // Auto-add to ledger (credit for customer = they paid)
    if (p.customer_id) {
      await client.query(
        `INSERT INTO ledger (entry_date, customer_id, party_name, entry_type, reference_no, debit, credit, remarks, created_by)
         VALUES ($1, $2, $3, 'Payment', $4, 0, $5, $6, $7)`,
        [
          p.payment_date || new Date(),
          p.customer_id,
          p.party_name,
          p.payment_no,
          p.amount,
          p.remarks || 'Payment received',
          req.user.username
        ]
      );
    }

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.delete('/api/payments/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM payments WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Payment deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// VENDOR PAYMENTS
// ============================================

app.get('/api/vendor-payments', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vendor_payments ORDER BY id DESC LIMIT 200');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/vendor-payments', authMiddleware, async (req, res) => {
  try {
    const p = req.body;

    if (!p.payment_no) {
      const countResult = await pool.query('SELECT COUNT(*) FROM vendor_payments');
      const nextNo = parseInt(countResult.rows[0].count) + 1;
      p.payment_no = 'VPAY/' + String(nextNo).padStart(5, '0');
    }

    const result = await pool.query(
      `INSERT INTO vendor_payments (payment_no, payment_date, vendor_id, vendor_name, amount, payment_mode, reference_no, bank_name, against_trip_no, remarks, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [
        p.payment_no, p.payment_date || new Date(), p.vendor_id, p.vendor_name,
        p.amount, p.payment_mode, p.reference_no, p.bank_name,
        p.against_trip_no, p.remarks, req.user.username
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// LEDGER ROUTES (Party-wise हिसाब)
// ============================================

app.get('/api/ledger/:customer_id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM ledger WHERE customer_id = $1 
       ORDER BY entry_date, id`,
      [req.params.customer_id]
    );

    // Calculate running balance
    let balance = 0;
    const entries = result.rows.map(entry => {
      balance = balance + parseFloat(entry.debit || 0) - parseFloat(entry.credit || 0);
      return { ...entry, running_balance: balance };
    });

    res.json({ entries, final_balance: balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ledger', authMiddleware, async (req, res) => {
  try {
    const l = req.body;

    const result = await pool.query(
      `INSERT INTO ledger (entry_date, customer_id, party_name, entry_type, reference_no, debit, credit, remarks, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [
        l.entry_date || new Date(), l.customer_id, l.party_name,
        l.entry_type, l.reference_no, l.debit || 0, l.credit || 0,
        l.remarks, req.user.username
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// EXPENSES ROUTES (Office / General)
// ============================================

app.get('/api/expenses', authMiddleware, async (req, res) => {
  try {
    const { category, branch_code, date_from, date_to } = req.query;
    let query = 'SELECT * FROM expenses WHERE 1=1';
    const params = [];

    if (category) {
      params.push(category);
      query += ` AND expense_category = $${params.length}`;
    }
    if (branch_code) {
      params.push(branch_code);
      query += ` AND branch_code = $${params.length}`;
    }
    if (date_from) {
      params.push(date_from);
      query += ` AND expense_date >= $${params.length}`;
    }
    if (date_to) {
      params.push(date_to);
      query += ` AND expense_date <= $${params.length}`;
    }

    query += ' ORDER BY id DESC LIMIT 500';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/expenses', authMiddleware, async (req, res) => {
  try {
    const e = req.body;

    const result = await pool.query(
      `INSERT INTO expenses (expense_date, expense_category, description, amount, paid_to, payment_mode, reference_no, branch_code, remarks, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [
        e.expense_date || new Date(), e.expense_category, e.description,
        e.amount, e.paid_to, e.payment_mode, e.reference_no,
        e.branch_code, e.remarks, req.user.username
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/expenses/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM expenses WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Expense deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// STOCK MANAGEMENT ROUTES
// ============================================

// Get all stock items
app.get('/api/stock/items', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM stock_items WHERE is_active = TRUE ORDER BY item_name'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create stock item
app.post('/api/stock/items', authMiddleware, async (req, res) => {
  try {
    const s = req.body;

    const result = await pool.query(
      `INSERT INTO stock_items (item_code, item_name, item_type, unit, min_level, critical_level, urgent_level)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [
        s.item_code, s.item_name, s.item_type, s.unit || 'sheets',
        s.min_level || 50, s.critical_level || 20, s.urgent_level || 10
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Item code already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Get current stock levels (with branch filter)
app.get('/api/stock/current', authMiddleware, async (req, res) => {
  try {
    const { branch_code } = req.query;

    let query = `
      SELECT 
        si.id, si.item_code, si.item_name, si.item_type, si.unit,
        si.min_level, si.critical_level, si.urgent_level,
        COALESCE(SUM(CASE WHEN st.transaction_type = 'IN' THEN st.quantity ELSE 0 END), 0) as total_in,
        COALESCE(SUM(CASE WHEN st.transaction_type = 'OUT' THEN st.quantity ELSE 0 END), 0) as total_out,
        COALESCE(SUM(CASE WHEN st.transaction_type = 'IN' THEN st.quantity ELSE -st.quantity END), 0) as current_stock
      FROM stock_items si
      LEFT JOIN stock_transactions st ON st.item_id = si.id
    `;
    const params = [];

    if (branch_code) {
      params.push(branch_code);
      query += ` AND st.branch_code = $${params.length}`;
    }

    query += ` WHERE si.is_active = TRUE GROUP BY si.id ORDER BY si.item_name`;

    const result = await pool.query(query, params);

    // Add status indicator
    const items = result.rows.map(item => {
      const stock = parseInt(item.current_stock);
      let status = 'ok';
      if (stock <= item.urgent_level) status = 'urgent';
      else if (stock <= item.critical_level) status = 'critical';
      else if (stock <= item.min_level) status = 'warning';
      return { ...item, status };
    });

    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get stock transactions (history)
app.get('/api/stock/transactions', authMiddleware, async (req, res) => {
  try {
    const { item_id, branch_code, type, date_from, date_to } = req.query;
    let query = `
      SELECT st.*, si.item_name, si.item_type 
      FROM stock_transactions st
      JOIN stock_items si ON si.id = st.item_id
      WHERE 1=1
    `;
    const params = [];

    if (item_id) {
      params.push(item_id);
      query += ` AND st.item_id = $${params.length}`;
    }
    if (branch_code) {
      params.push(branch_code);
      query += ` AND st.branch_code = $${params.length}`;
    }
    if (type) {
      params.push(type);
      query += ` AND st.transaction_type = $${params.length}`;
    }
    if (date_from) {
      params.push(date_from);
      query += ` AND st.transaction_date >= $${params.length}`;
    }
    if (date_to) {
      params.push(date_to);
      query += ` AND st.transaction_date <= $${params.length}`;
    }

    query += ' ORDER BY st.id DESC LIMIT 500';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add stock (IN)
app.post('/api/stock/in', authMiddleware, async (req, res) => {
  try {
    const s = req.body;

    if (!s.item_id || !s.quantity) {
      return res.status(400).json({ error: 'Item ID and quantity required' });
    }

    const result = await pool.query(
      `INSERT INTO stock_transactions (item_id, branch_code, transaction_type, quantity, serial_from, serial_to, reference_no, transaction_date, supplier, remarks, created_by)
       VALUES ($1,$2,'IN',$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [
        s.item_id, s.branch_code, s.quantity, s.serial_from, s.serial_to,
        s.reference_no, s.transaction_date || new Date(), s.supplier, s.remarks, req.user.username
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get stock alerts
app.get('/api/stock/alerts', authMiddleware, async (req, res) => {
  try {
    const { unread_only, branch_code } = req.query;
    let query = `
      SELECT sa.*, si.item_name, si.item_type
      FROM stock_alerts sa
      JOIN stock_items si ON si.id = sa.item_id
      WHERE 1=1
    `;
    const params = [];

    if (unread_only === 'true') {
      query += ' AND sa.is_read = FALSE';
    }
    if (branch_code) {
      params.push(branch_code);
      query += ` AND sa.branch_code = $${params.length}`;
    }

    query += ' ORDER BY sa.id DESC LIMIT 100';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark alert as read
app.patch('/api/stock/alerts/:id/read', authMiddleware, async (req, res) => {
  try {
    await pool.query('UPDATE stock_alerts SET is_read = TRUE WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// END OF PART 3
// ============================================
console.log('✅ Part 3 loaded: Trips + Payments + Ledger + Expenses + Stock');
// ============================================
// PART 4: REPORTS + DASHBOARD + SETTINGS + SERVER START
// ============================================

// ============================================
// DASHBOARD ROUTES (8 Cards + Charts)
// ============================================

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

// Dashboard - Recent bilties
app.get('/api/dashboard/recent-bilties', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, lr_no, lr_date, consignor_name, consignee_name, 
              from_name, to_name, charged_weight, grand_total, status
       FROM consignments 
       WHERE status != 'Cancelled'
       ORDER BY id DESC LIMIT 10`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dashboard - Top 5 parties
app.get('/api/dashboard/top-parties', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT customer_id, party_name, COUNT(*) as bill_count, 
              COALESCE(SUM(grand_total),0) as total_amount
       FROM bill_book 
       WHERE status != 'Cancelled' AND party_name IS NOT NULL
       GROUP BY customer_id, party_name
       ORDER BY total_amount DESC LIMIT 5`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dashboard - Revenue chart (last 12 months)
app.get('/api/dashboard/revenue-chart', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT TO_CHAR(bill_date, 'YYYY-MM') as month, 
              COALESCE(SUM(grand_total),0) as revenue,
              COUNT(*) as bill_count
       FROM bill_book 
       WHERE bill_date >= CURRENT_DATE - INTERVAL '12 months'
         AND status != 'Cancelled'
       GROUP BY TO_CHAR(bill_date, 'YYYY-MM')
       ORDER BY month`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dashboard - LR chart (last 12 months)
app.get('/api/dashboard/lr-chart', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT TO_CHAR(lr_date, 'YYYY-MM') as month, 
              COUNT(*) as lr_count
       FROM consignments 
       WHERE lr_date >= CURRENT_DATE - INTERVAL '12 months'
         AND status != 'Cancelled'
       GROUP BY TO_CHAR(lr_date, 'YYYY-MM')
       ORDER BY month`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// MONTHLY REPORT (महीने का summary + P&L)
// ============================================

app.get('/api/reports/monthly', authMiddleware, async (req, res) => {
  try {
    const { month, year, branch_code } = req.query;
    
    const targetYear = year || new Date().getFullYear();
    const targetMonth = month || (new Date().getMonth() + 1);

    const monthStart = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
    const monthEnd = new Date(targetYear, targetMonth, 0).toISOString().split('T')[0];

    const branchFilter = branch_code ? ` AND branch_code = '${branch_code}'` : '';

    // Revenue & Bills
    const revenueResult = await pool.query(
      `SELECT COUNT(*) as total_bills, COALESCE(SUM(grand_total),0) as total_revenue,
              COALESCE(SUM(gst_amount),0) as total_gst
       FROM bill_book 
       WHERE bill_date >= $1 AND bill_date <= $2 
         AND status != 'Cancelled'${branchFilter}`,
      [monthStart, monthEnd]
    );

    // LR count
    const lrResult = await pool.query(
      `SELECT COUNT(*) as total_lr, COALESCE(SUM(charged_weight),0) as total_weight,
              COALESCE(SUM(grand_total),0) as total_freight
       FROM consignments 
       WHERE lr_date >= $1 AND lr_date <= $2 
         AND status != 'Cancelled'${branchFilter}`,
      [monthStart, monthEnd]
    );

    // Expenses (trip + office)
    const tripExpResult = await pool.query(
      `SELECT COALESCE(SUM(amount),0) as total FROM trip_expenses 
       WHERE expense_date >= $1 AND expense_date <= $2`,
      [monthStart, monthEnd]
    );

    const officeExpResult = await pool.query(
      `SELECT COALESCE(SUM(amount),0) as total FROM expenses 
       WHERE expense_date >= $1 AND expense_date <= $2${branchFilter}`,
      [monthStart, monthEnd]
    );

    // Payments received
    const paymentResult = await pool.query(
      `SELECT COALESCE(SUM(amount),0) as total FROM payments 
       WHERE payment_date >= $1 AND payment_date <= $2${branchFilter}`,
      [monthStart, monthEnd]
    );

    // Pending / Outstanding
    const outstandingResult = await pool.query(
      `SELECT COALESCE(SUM(balance_due),0) as total FROM bill_book 
       WHERE status IN ('Active','Partial')${branchFilter}`
    );

    const totalRevenue = parseFloat(revenueResult.rows[0].total_revenue);
    const totalTripExpense = parseFloat(tripExpResult.rows[0].total);
    const totalOfficeExpense = parseFloat(officeExpResult.rows[0].total);
    const totalExpense = totalTripExpense + totalOfficeExpense;

    res.json({
      period: { month: targetMonth, year: targetYear, from: monthStart, to: monthEnd },
      revenue: {
        total_bills: parseInt(revenueResult.rows[0].total_bills),
        total_revenue: totalRevenue,
        total_gst: parseFloat(revenueResult.rows[0].total_gst)
      },
      lr: {
        total_lr: parseInt(lrResult.rows[0].total_lr),
        total_weight: parseFloat(lrResult.rows[0].total_weight),
        total_freight: parseFloat(lrResult.rows[0].total_freight)
      },
      expenses: {
        trip_expense: totalTripExpense,
        office_expense: totalOfficeExpense,
        total: totalExpense
      },
      payments: {
        total_received: parseFloat(paymentResult.rows[0].total)
      },
      outstanding: {
        total: parseFloat(outstandingResult.rows[0].total)
      },
      pnl: {
        gross_profit: totalRevenue - totalTripExpense,
        net_profit: totalRevenue - totalExpense,
        profit_margin: totalRevenue > 0 ? (((totalRevenue - totalExpense) / totalRevenue) * 100).toFixed(2) : 0
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// OUTSTANDING REPORT
// ============================================

app.get('/api/reports/outstanding', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        customer_id, party_name, party_gst, party_address,
        COUNT(*) as bill_count,
        COALESCE(SUM(grand_total),0) as total_billed,
        COALESCE(SUM(advance_received),0) as total_received,
        COALESCE(SUM(balance_due),0) as total_outstanding
       FROM bill_book 
       WHERE status IN ('Active','Partial')
       GROUP BY customer_id, party_name, party_gst, party_address
       ORDER BY total_outstanding DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// PENDING LR REPORT
// ============================================

app.get('/api/reports/pending-lr', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, lr_no, lr_date, consignor_name, consignee_name,
              from_name, to_name, charged_weight, grand_total, status,
              created_at
       FROM consignments 
       WHERE status IN ('Booked','In-Transit','Reached','Out for Delivery')
       ORDER BY lr_date DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// PARTY-WISE REPORT
// ============================================

app.get('/api/reports/party-wise', authMiddleware, async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    let query = `
      SELECT 
        customer_id, party_name,
        COUNT(*) as bill_count,
        COALESCE(SUM(grand_total),0) as total_amount,
        COALESCE(SUM(balance_due),0) as total_outstanding
      FROM bill_book 
      WHERE status != 'Cancelled'
    `;
    const params = [];

    if (date_from) {
      params.push(date_from);
      query += ` AND bill_date >= $${params.length}`;
    }
    if (date_to) {
      params.push(date_to);
      query += ` AND bill_date <= $${params.length}`;
    }

    query += ` GROUP BY customer_id, party_name ORDER BY total_amount DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// BRANCH-WISE REPORT
// ============================================

app.get('/api/reports/branch-wise', authMiddleware, async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    const today = new Date().toISOString().split('T')[0];
    const df = date_from || today.substring(0, 7) + '-01';
    const dt = date_to || today;

    const result = await pool.query(
      `SELECT 
        b.branch_code, b.branch_name, b.city, b.state,
        COALESCE(lr.lr_count, 0) as lr_count,
        COALESCE(lr.lr_freight, 0) as lr_freight,
        COALESCE(bills.bill_count, 0) as bill_count,
        COALESCE(bills.bill_revenue, 0) as bill_revenue,
        COALESCE(bills.outstanding, 0) as outstanding
      FROM branches b
      LEFT JOIN (
        SELECT branch_code, COUNT(*) as lr_count, COALESCE(SUM(grand_total),0) as lr_freight
        FROM consignments
        WHERE lr_date >= $1 AND lr_date <= $2 AND status != 'Cancelled'
        GROUP BY branch_code
      ) lr ON lr.branch_code = b.branch_code
      LEFT JOIN (
        SELECT branch_code, COUNT(*) as bill_count, 
               COALESCE(SUM(grand_total),0) as bill_revenue,
               COALESCE(SUM(balance_due),0) as outstanding
        FROM bill_book
        WHERE bill_date >= $1 AND bill_date <= $2 AND status != 'Cancelled'
        GROUP BY branch_code
      ) bills ON bills.branch_code = b.branch_code
      WHERE b.is_active = TRUE
      ORDER BY b.branch_code`,
      [df, dt]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// GST REPORT (GSTR-1 ready)
// ============================================

app.get('/api/reports/gst', authMiddleware, async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    const today = new Date().toISOString().split('T')[0];
    const df = date_from || today.substring(0, 7) + '-01';
    const dt = date_to || today;

    const result = await pool.query(
      `SELECT 
        party_gst as gstin, party_name,
        bill_no, bill_date, invoice_no,
        trip_subtotal as taxable_amount,
        gst_percent, gst_amount,
        grand_total
       FROM bill_book
       WHERE bill_date >= $1 AND bill_date <= $2 
         AND status != 'Cancelled'
         AND party_gst IS NOT NULL
       ORDER BY bill_date`,
      [df, dt]
    );

    // Summary
    const summary = await pool.query(
      `SELECT 
        COUNT(*) as total_invoices,
        COALESCE(SUM(trip_subtotal),0) as total_taxable,
        COALESCE(SUM(gst_amount),0) as total_gst,
        COALESCE(SUM(grand_total),0) as total_value
       FROM bill_book
       WHERE bill_date >= $1 AND bill_date <= $2 
         AND status != 'Cancelled'
         AND party_gst IS NOT NULL`,
      [df, dt]
    );

    res.json({
      period: { from: df, to: dt },
      invoices: result.rows,
      summary: summary.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// VEHICLE-WISE REPORT
// ============================================

app.get('/api/reports/vehicle-wise', authMiddleware, async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    let query = `
      SELECT 
        v.vehicle_no, v.vehicle_type,
        COUNT(DISTINCT t.id) as trip_count,
        COALESCE(SUM(t.total_km),0) as total_km,
        COALESCE(SUM(exp.amount),0) as total_expense
      FROM vehicles v
      LEFT JOIN trips t ON t.vehicle_id = v.id
      LEFT JOIN trip_expenses exp ON exp.trip_id = t.id
    `;
    const params = [];

    if (date_from) {
      params.push(date_from);
      query += ` WHERE t.trip_date >= $${params.length}`;
    }

    query += ` GROUP BY v.id, v.vehicle_no, v.vehicle_type ORDER BY total_km DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// DRIVER-WISE REPORT
// ============================================

app.get('/api/reports/driver-wise', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        d.id, d.driver_name, d.mobile,
        COUNT(t.id) as trip_count,
        COALESCE(SUM(t.total_km),0) as total_km,
        COALESCE(SUM(da.amount),0) as total_advance
       FROM drivers d
       LEFT JOIN trips t ON t.driver_id = d.id
       LEFT JOIN driver_advances da ON da.driver_id = d.id
       GROUP BY d.id, d.driver_name, d.mobile
       ORDER BY total_km DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// SETTINGS ROUTES
// ============================================

app.get('/api/settings', authMiddleware, async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM settings';
    const params = [];

    if (category) {
      params.push(category);
      query += ' WHERE category = $1';
    }

    query += ' ORDER BY category, setting_key';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/settings/:key', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT setting_value FROM settings WHERE setting_key = $1',
      [req.params.key]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    res.json({ key: req.params.key, value: result.rows[0].setting_value });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/settings/:key', authMiddleware, async (req, res) => {
  try {
    const { value } = req.body;

    const result = await pool.query(
      `INSERT INTO settings (setting_key, setting_value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (setting_key) 
       DO UPDATE SET setting_value = $2, updated_at = NOW()
       RETURNING *`,
      [req.params.key, value]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk update settings
app.put('/api/settings', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const settings = req.body;

    for (const [key, value] of Object.entries(settings)) {
      await client.query(
        `INSERT INTO settings (setting_key, setting_value, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (setting_key) 
         DO UPDATE SET setting_value = $2, updated_at = NOW()`,
        [key, String(value)]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Settings updated' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ============================================
// AUDIT LOG ROUTES
// ============================================

app.get('/api/audit-log', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can view audit log' });
    }

    const result = await pool.query(
      'SELECT * FROM audit_log ORDER BY id DESC LIMIT 200'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// PUBLIC TRACKING (No auth required)
// ============================================

app.get('/api/track/:lr_no', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT lr_no, lr_date, consignor_name, consignee_name, 
              from_name, to_name, no_of_packages, charged_weight, 
              status, updated_at
       FROM consignments WHERE lr_no = $1`,
      [req.params.lr_no]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'LR not found' });
    }

    const statusHistory = await pool.query(
      `SELECT status, location, remarks, updated_at 
       FROM delivery_status WHERE lr_no = $1 
       ORDER BY updated_at`,
      [req.params.lr_no]
    );

    res.json({ consignment: result.rows[0], history: statusHistory.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// 404 HANDLER
// ============================================
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

// ============================================
// GLOBAL ERROR HANDLER
// ============================================
app.use((err, req, res, next) => {
  console.error('GLOBAL ERROR:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ============================================
// START SERVER
// ============================================
console.log('Starting server...');
console.log('PORT from env:', process.env.PORT);
console.log('Actual PORT:', PORT);
console.log('HOST:', HOST);

app.listen(PORT, HOST, () => {
  console.log('===========================================');
  console.log('  BHARAT TRANSPORT COMPANY - Backend API');
  console.log('  Version 2.0');
  console.log('===========================================');
  console.log(`  Server running on port ${PORT}`);
  console.log(`  Environment: ${process.env.NODE_ENV}`);
  console.log(`  Time: ${new Date().toISOString()}`);
  console.log('===========================================');
  console.log('✅ ALL PARTS LOADED SUCCESSFULLY!');
  console.log('===========================================');
});

module.exports = app;
