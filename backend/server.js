// ============================================
// BHARAT TRANSPORT COMPANY - BACKEND SERVER
// ============================================

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err.message);
  console.error('Stack:', err.stack);
  process.exit(1);
});
const app = express();
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Database Connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
pool.on('error', (err) => {
  console.error('DATABASE POOL ERROR:', err.message);
});
// ============================================
// HEALTH CHECK
// ============================================
app.get('/', (req, res) => {
    res.json({
        status: 'OK',
        company: 'BHARAT TRANSPORT COMPANY',
        message: 'Backend API running successfully',
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
        
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1 AND is_active = TRUE',
            [username]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        
        const user = result.rows[0];
        
        const validPassword = password === user.password || 
                             await bcrypt.compare(password, user.password).catch(() => false);
        
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role, branch_code: user.branch_code },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                full_name: user.full_name,
                role: user.role,
                branch_code: user.branch_code
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// BRANCH ROUTES
// ============================================

app.get('/api/branches', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM branches WHERE is_active = TRUE ORDER BY branch_code');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/branches', async (req, res) => {
    try {
        const { branch_code, branch_name, address, city, state, pincode, mobile, email, gst_no } = req.body;
        const result = await pool.query(
            `INSERT INTO branches (branch_code, branch_name, address, city, state, pincode, mobile, email, gst_no)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
            [branch_code, branch_name, address, city, state, pincode, mobile, email, gst_no]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// CUSTOMER ROUTES
// ============================================

app.get('/api/customers', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM customers WHERE is_active = TRUE ORDER BY customer_name');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/customers', async (req, res) => {
    try {
        const { customer_code, customer_name, address, city, state, mobile, email, gst_no, pan_no, customer_type } = req.body;
        const result = await pool.query(
            `INSERT INTO customers (customer_code, customer_name, address, city, state, mobile, email, gst_no, pan_no, customer_type)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
            [customer_code, customer_name, address, city, state, mobile, email, gst_no, pan_no, customer_type]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
  
// ============================================
// CONSIGNMENT (LR) ROUTES
// ============================================

app.get('/api/consignments', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM consignments ORDER BY id DESC LIMIT 100');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/consignments/:lr_no', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM consignments WHERE lr_no = $1', [req.params.lr_no]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'LR not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/consignments', async (req, res) => {
    try {
        const c = req.body;
        
        if (!c.lr_no) {
            const count = await pool.query('SELECT COUNT(*) FROM consignments');
            const nextNo = parseInt(count.rows[0].count) + 1;
            c.lr_no = String(nextNo).padStart(5, '0');
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
                freight, aoc_percent, aoc_amount, eov_charges, cover_charges,
                material_charges, mgmt_charges, collection_charges, door_delivery,
                with_pass_cc, enroute_charges, statistical_charges, misc_charges, grand_total,
                eway_bill_no, eway_valid_upto,
                payment_type, declared_value, basis_of_booking, billed_at, gst_through,
                status, remarks, created_by
            ) VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
                $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39,
                $40,$41,$42,$43,$44,$45,$46,$47,$48,$49,$50,$51,$52,$53,$54,$55,$56,$57,$58
            ) RETURNING *`,
            [
                c.lr_no, c.lr_date, c.branch_code,
                c.consignor_name, c.consignor_address, c.consignor_gst, c.consignor_mobile,
                c.consignee_name, c.consignee_address, c.consignee_gst, c.consignee_mobile,
                c.invoice_no, c.invoice_date,
                c.from_code, c.from_name, c.to_code, c.to_name,
                c.lorry_no, c.driver_name, c.driver_mobile,
                c.delivery_type, c.pickup_address, c.delivery_godown,
                c.no_of_packages, c.method_of_packing, c.hsn_code, c.description,
                c.actual_weight, c.charged_weight, c.rate,
                c.length, c.width, c.height, c.cft_cmt,
                c.freight, c.aoc_percent, c.aoc_amount, c.eov_charges, c.cover_charges,
                c.material_charges, c.mgmt_charges, c.collection_charges, c.door_delivery,
                c.with_pass_cc, c.enroute_charges, c.statistical_charges, c.misc_charges, c.grand_total,
                c.eway_bill_no, c.eway_valid_upto,
                c.payment_type, c.declared_value, c.basis_of_booking, c.billed_at, c.gst_through,
                c.status || 'Booked', c.remarks, c.created_by
            ]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// BILL BOOK ROUTES
// ============================================

app.get('/api/bills', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM bill_book ORDER BY id DESC LIMIT 100');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/bills/:bill_no', async (req, res) => {
    try {
        const bill = await pool.query('SELECT * FROM bill_book WHERE bill_no = $1', [req.params.bill_no]);
        if (bill.rows.length === 0) return res.status(404).json({ error: 'Bill not found' });
        
        const items = await pool.query('SELECT * FROM bill_items WHERE bill_id = $1', [bill.rows[0].id]);
        
        res.json({ ...bill.rows[0], items: items.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/bills', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const b = req.body;
        
        if (!b.bill_no) {
            const year = new Date().getFullYear().toString().slice(-2) + '-' + 
                         (new Date().getFullYear() + 1).toString().slice(-2);
            const count = await client.query('SELECT COUNT(*) FROM bill_book');
            const nextNo = parseInt(count.rows[0].count) + 1;
            b.bill_no = `BTC/${year}/${String(nextNo).padStart(4, '0')}`;
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
                b.grand_total, b.advance_received, b.balance_due,
                b.trip_subtotal, b.gst_percent, b.gst_amount, b.net_balance,
                b.payment_mode, b.payment_details,
                b.amount_in_words, b.status || 'Active', b.remarks, b.created_by
            ]
        );
        
        const billId = result.rows[0].id;
        
        if (b.items && b.items.length > 0) {
            for (const item of b.items) {
                await client.query(
                    `INSERT INTO bill_items (bill_id, lr_no, invoice_no, from_name, to_name, weight_mt, loading, unloading, other_charges, total)
                     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
                    [billId, item.lr_no, item.invoice_no, item.from_name, item.to_name, item.weight_mt, item.loading || 0, item.unloading || 0, item.other_charges || 0, item.total || 0]
                );
            }
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

// ============================================
// REPORTS
// ============================================

app.get('/api/reports/dashboard', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        const todayLR = await pool.query('SELECT COUNT(*) FROM consignments WHERE lr_date = $1', [today]);
        const todayBills = await pool.query('SELECT COUNT(*) FROM bill_book WHERE bill_date = $1', [today]);
        const totalBranches = await pool.query('SELECT COUNT(*) FROM branches WHERE is_active = TRUE');
        const totalCustomers = await pool.query('SELECT COUNT(*) FROM customers WHERE is_active = TRUE');
        
        const totalRevenue = await pool.query('SELECT COALESCE(SUM(grand_total),0) as total FROM bill_book WHERE bill_date = $1', [today]);
        const pendingPayments = await pool.query('SELECT COALESCE(SUM(balance_due),0) as total FROM bill_book WHERE status = $1', ['Active']);
        
        res.json({
            today_lr: parseInt(todayLR.rows[0].count),
            today_bills: parseInt(todayBills.rows[0].count),
            total_branches: parseInt(totalBranches.rows[0].count),
            total_customers: parseInt(totalCustomers.rows[0].count),
            today_revenue: parseFloat(totalRevenue.rows[0].total),
            pending_payments: parseFloat(pendingPayments.rows[0].total)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, HOST, () => {
    console.log('===========================================');
    console.log('  BHARAT TRANSPORT COMPANY - Backend API');
    console.log('===========================================');
    console.log(`  Server running on port ${PORT}`);
    console.log(`  Environment: ${process.env.NODE_ENV}`);
    console.log('===========================================');
});
});
