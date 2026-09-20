-- ============================================
-- BHARAT TRANSPORT COMPANY - DATABASE
-- ============================================

-- 1. USERS (Admin + Branch login)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'branch',
    branch_code VARCHAR(20),
    mobile VARCHAR(15),
    email VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. BRANCHES
CREATE TABLE IF NOT EXISTS branches (
    id SERIAL PRIMARY KEY,
    branch_code VARCHAR(20) UNIQUE NOT NULL,
    branch_name VARCHAR(100) NOT NULL,
    address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    pincode VARCHAR(10),
    mobile VARCHAR(15),
    email VARCHAR(100),
    gst_no VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. CUSTOMERS (Parties)
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    customer_code VARCHAR(20) UNIQUE,
    customer_name VARCHAR(200) NOT NULL,
    address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    pincode VARCHAR(10),
    mobile VARCHAR(15),
    email VARCHAR(100),
    gst_no VARCHAR(20),
    pan_no VARCHAR(20),
    customer_type VARCHAR(20) DEFAULT 'credit',
    opening_balance NUMERIC(12,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. VENDORS (Hired Vehicle Owners)
CREATE TABLE IF NOT EXISTS vendors (
    id SERIAL PRIMARY KEY,
    vendor_code VARCHAR(20) UNIQUE,
    vendor_name VARCHAR(200) NOT NULL,
    address TEXT,
    mobile VARCHAR(15),
    email VARCHAR(100),
    gst_no VARCHAR(20),
    pan_no VARCHAR(20),
    bank_name VARCHAR(100),
    bank_ac VARCHAR(50),
    bank_ifsc VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. VEHICLES (Hired)
CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    vehicle_no VARCHAR(20) UNIQUE NOT NULL,
    vehicle_type VARCHAR(50),
    owner_vendor_id INTEGER REFERENCES vendors(id),
    capacity_mt NUMERIC(8,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  
-- 6. CONSIGNMENTS (LR / Bilty)
CREATE TABLE IF NOT EXISTS consignments (
    id SERIAL PRIMARY KEY,
    lr_no VARCHAR(30) UNIQUE NOT NULL,
    lr_date DATE NOT NULL,
    branch_code VARCHAR(20),
    consignor_name VARCHAR(200),
    consignor_address TEXT,
    consignor_gst VARCHAR(20),
    consignor_mobile VARCHAR(15),
    consignee_name VARCHAR(200),
    consignee_address TEXT,
    consignee_gst VARCHAR(20),
    consignee_mobile VARCHAR(15),
    invoice_no VARCHAR(50),
    invoice_date DATE,
    from_code VARCHAR(20),
    from_name VARCHAR(100),
    to_code VARCHAR(20),
    to_name VARCHAR(100),
    lorry_no VARCHAR(20),
    driver_name VARCHAR(100),
    driver_mobile VARCHAR(15),
    delivery_type VARCHAR(30),
    pickup_address TEXT,
    delivery_godown TEXT,
    no_of_packages INTEGER,
    method_of_packing VARCHAR(50),
    hsn_code VARCHAR(20),
    description TEXT,
    actual_weight NUMERIC(10,2),
    charged_weight NUMERIC(10,2),
    rate NUMERIC(10,2),
    length NUMERIC(8,2),
    width NUMERIC(8,2),
    height NUMERIC(8,2),
    cft_cmt NUMERIC(10,2),
    freight NUMERIC(12,2) DEFAULT 0,
    aoc_percent NUMERIC(5,2) DEFAULT 0,
    aoc_amount NUMERIC(12,2) DEFAULT 0,
    eov_charges NUMERIC(12,2) DEFAULT 0,
    cover_charges NUMERIC(12,2) DEFAULT 0,
    material_charges NUMERIC(12,2) DEFAULT 0,
    mgmt_charges NUMERIC(12,2) DEFAULT 0,
    collection_charges NUMERIC(12,2) DEFAULT 0,
    door_delivery NUMERIC(12,2) DEFAULT 0,
    with_pass_cc NUMERIC(12,2) DEFAULT 0,
    enroute_charges NUMERIC(12,2) DEFAULT 0,
    statistical_charges NUMERIC(12,2) DEFAULT 0,
    misc_charges NUMERIC(12,2) DEFAULT 0,
    grand_total NUMERIC(12,2) DEFAULT 0,
    eway_bill_no VARCHAR(30),
    eway_valid_upto DATE,
    payment_type VARCHAR(20),
    declared_value NUMERIC(12,2),
    basis_of_booking INTEGER,
    billed_at VARCHAR(100),
    gst_through VARCHAR(30),
    status VARCHAR(30) DEFAULT 'Booked',
    remarks TEXT,
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. BILL BOOK (Invoice)
CREATE TABLE IF NOT EXISTS bill_book (
    id SERIAL PRIMARY KEY,
    bill_no VARCHAR(30) UNIQUE NOT NULL,
    bill_date DATE NOT NULL,
    branch_code VARCHAR(20),
    customer_id INTEGER REFERENCES customers(id),
    party_name VARCHAR(200),
    party_gst VARCHAR(20),
    party_address TEXT,
    invoice_no VARCHAR(50),
    invoice_date DATE,
    from_name VARCHAR(100),
    to_name VARCHAR(100),
    consignor_name VARCHAR(200),
    consignee_name VARCHAR(200),
    vehicle_no VARCHAR(20),
    grand_total NUMERIC(12,2) DEFAULT 0,
    advance_received NUMERIC(12,2) DEFAULT 0,
    balance_due NUMERIC(12,2) DEFAULT 0,
    trip_subtotal NUMERIC(12,2) DEFAULT 0,
    gst_percent NUMERIC(5,2) DEFAULT 0,
    gst_amount NUMERIC(12,2) DEFAULT 0,
    net_balance NUMERIC(12,2) DEFAULT 0,
    payment_mode VARCHAR(30),
    payment_details TEXT,
    amount_in_words VARCHAR(500),
    status VARCHAR(20) DEFAULT 'Active',
    remarks TEXT,
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. BILL ITEMS
CREATE TABLE IF NOT EXISTS bill_items (
    id SERIAL PRIMARY KEY,
    bill_id INTEGER REFERENCES bill_book(id) ON DELETE CASCADE,
    lr_no VARCHAR(30),
    invoice_no VARCHAR(50),
    from_name VARCHAR(100),
    to_name VARCHAR(100),
    weight_mt NUMERIC(10,2),
    loading NUMERIC(12,2) DEFAULT 0,
    unloading NUMERIC(12,2) DEFAULT 0,
    other_charges NUMERIC(12,2) DEFAULT 0,
    total NUMERIC(12,2) DEFAULT 0
);

-- 9. BILL PAYMENTS
CREATE TABLE IF NOT EXISTS bill_payments (
    id SERIAL PRIMARY KEY,
    bill_id INTEGER REFERENCES bill_book(id) ON DELETE CASCADE,
    payment_date DATE,
    amount NUMERIC(12,2),
    payment_mode VARCHAR(30),
    reference_no VARCHAR(50),
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- SAMPLE DATA
-- ============================================

-- Admin User
INSERT INTO users (username, password, full_name, role, mobile, email)
VALUES ('admin', 'admin123', 'Head Office Admin', 'admin', '9680264231', 'bharattransportcompany@gmail.com')
ON CONFLICT (username) DO NOTHING;

-- Sample Branches
INSERT INTO branches (branch_code, branch_name, address, city, state, pincode, mobile, gst_no) VALUES
('RAJ', 'Rajgarh (Head Office)', 'Ward No. 17, Purana Falsa, Pilani Road', 'Rajgarh', 'Rajasthan', '331023', '9680264231', '08CMRPP0955N1Z5'),
('DEL', 'Delhi', 'Karol Bagh', 'Delhi', 'Delhi', '110005', '', ''),
('MUM', 'Mumbai', 'Andheri East', 'Mumbai', 'Maharashtra', '400069', '', ''),
('JAI', 'Jaipur', 'Transport Nagar', 'Jaipur', 'Rajasthan', '302003', '', ''),
('AHM', 'Ahmedabad', 'Naroda', 'Ahmedabad', 'Gujarat', '382330', '', ''),
('PUN', 'Pune', 'Hadapsar', 'Pune', 'Maharashtra', '411028', '', ''),
('SUR', 'Surat', 'Udhna', 'Surat', 'Gujarat', '394210', '', ''),
('IND', 'Indore', 'Vijay Nagar', 'Indore', 'Madhya Pradesh', '452010', '', ''),
('BHO', 'Bhopal', 'Bairagarh', 'Bhopal', 'Madhya Pradesh', '462030', '', ''),
('NAG', 'Nagpur', 'Central Avenue', 'Nagpur', 'Maharashtra', '440018', '', ''),
('KOL', 'Kolkata', 'Howrah', 'Kolkata', 'West Bengal', '700001', '', ''),
('CHE', 'Chennai', 'Parrys', 'Chennai', 'Tamil Nadu', '600001', '', ''),
('BAN', 'Bangalore', 'Yeshwanthpur', 'Bangalore', 'Karnataka', '560022', '', ''),
('HYD', 'Hyderabad', 'Kukatpally', 'Hyderabad', 'Telangana', '500072', '', ''),
('LUC', 'Lucknow', 'Alambagh', 'Lucknow', 'Uttar Pradesh', '226005', '', '')
ON CONFLICT (branch_code) DO NOTHING;

-- Sample Customers
INSERT INTO customers (customer_code, customer_name, address, city, state, mobile, gst_no, customer_type) VALUES
('CUST001', 'Vedant Sales Corporation', 'Main Market', 'Rajgarh', 'Rajasthan', '', '27AVGPG9369R1ZJ', 'credit'),
('CUST002', 'Electromech Infraprojects Pvt Ltd', 'Andheri East', 'Mumbai', 'Maharashtra', '', '', 'credit'),
('CUST003', 'Shree Traders', 'Transport Nagar', 'Jaipur', 'Rajasthan', '', '', 'cash')
ON CONFLICT (customer_code) DO NOTHING;
);
