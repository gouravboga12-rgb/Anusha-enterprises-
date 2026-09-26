-- ==============================================================================
-- ANUSHA ENTERPRISES (Nandipet, Nizamabad)
-- Complete Supabase PostgreSQL Schema & Relational Structure
-- v2 — Major Feature Expansion (Godowns, Multi-User, Wallet, Activity Log, Audit Trail)
-- Run this script in your Supabase Dashboard -> SQL Editor -> Run
-- SAFE TO RE-RUN: All statements use IF NOT EXISTS / OR IGNORE patterns
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- EXISTING TABLES (UNCHANGED — v1 compatible)
-- ==============================================================================

-- 2. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    customer_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    mobile VARCHAR(20),
    area VARCHAR(255),
    address TEXT,
    status VARCHAR(20) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SUPPLIERS TABLE
CREATE TABLE IF NOT EXISTS public.suppliers (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    supplier_id VARCHAR(50) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    supplier_name VARCHAR(255),
    mobile VARCHAR(20),
    area VARCHAR(255),
    address TEXT,
    status VARCHAR(20) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- 4. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    current_stock INTEGER NOT NULL DEFAULT 0,
    unit VARCHAR(50) DEFAULT 'boxes',
    purchase_price DECIMAL(12,2) DEFAULT 0.00,
    selling_price DECIMAL(12,2) DEFAULT 0.00,
    min_stock_alert INTEGER DEFAULT 20,
    image_url TEXT,
    cloudinary_public_id VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CUSTOMER SALES (Header)
CREATE TABLE IF NOT EXISTS public.customer_sales (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    invoice_no VARCHAR(50) UNIQUE NOT NULL,
    customer_id TEXT NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time VARCHAR(20) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    pending_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    payment_status VARCHAR(30) DEFAULT 'Pending',
    notes TEXT,
    recorded_by VARCHAR(100) DEFAULT 'Admin',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CUSTOMER SALE ITEMS (Details)
CREATE TABLE IF NOT EXISTS public.customer_sale_items (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    sale_id TEXT NOT NULL REFERENCES public.customer_sales(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    product_name VARCHAR(255),
    quantity INTEGER NOT NULL,
    selling_price DECIMAL(12,2) NOT NULL,
    total DECIMAL(12,2) NOT NULL,
    godown_id TEXT,  -- NEW: which godown this item was sold from
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SUPPLIER PURCHASES (Header)
CREATE TABLE IF NOT EXISTS public.supplier_purchases (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    purchase_no VARCHAR(50) UNIQUE NOT NULL,
    supplier_id TEXT NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time VARCHAR(20) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    pending_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    payment_status VARCHAR(30) DEFAULT 'Pending',
    notes TEXT,
    recorded_by VARCHAR(100) DEFAULT 'Admin',
    godown_id TEXT,  -- NEW: which godown received this purchase
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. SUPPLIER PURCHASE ITEMS (Details)
CREATE TABLE IF NOT EXISTS public.supplier_purchase_items (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    purchase_id TEXT NOT NULL REFERENCES public.supplier_purchases(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    product_name VARCHAR(255),
    quantity INTEGER NOT NULL,
    purchase_price DECIMAL(12,2) NOT NULL,
    total DECIMAL(12,2) NOT NULL,
    godown_id TEXT,  -- NEW: which godown this item went to
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist for existing tables
ALTER TABLE public.supplier_purchases ADD COLUMN IF NOT EXISTS godown_id TEXT;
ALTER TABLE public.supplier_purchases ADD COLUMN IF NOT EXISTS vehicle_no VARCHAR(100);
ALTER TABLE public.supplier_purchase_items ADD COLUMN IF NOT EXISTS godown_id TEXT;
ALTER TABLE public.supplier_purchase_items ADD COLUMN IF NOT EXISTS unit VARCHAR(50);
ALTER TABLE public.customer_sales ADD COLUMN IF NOT EXISTS godown_id TEXT;
ALTER TABLE public.customer_sales ADD COLUMN IF NOT EXISTS vehicle_no VARCHAR(100);
ALTER TABLE public.customer_sale_items ADD COLUMN IF NOT EXISTS godown_id TEXT;
ALTER TABLE public.customer_sale_items ADD COLUMN IF NOT EXISTS unit VARCHAR(50);
ALTER TABLE public.stock_transfers ADD COLUMN IF NOT EXISTS vehicle_no VARCHAR(100);

-- 9. CUSTOMER PAYMENTS
CREATE TABLE IF NOT EXISTS public.customer_payments (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    receipt_no VARCHAR(50) UNIQUE NOT NULL,
    customer_id TEXT NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    sale_id TEXT REFERENCES public.customer_sales(id) ON DELETE SET NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_mode VARCHAR(50) NOT NULL,
    reference_no VARCHAR(100),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time VARCHAR(20) NOT NULL,
    notes TEXT,
    recorded_by VARCHAR(100) DEFAULT 'Admin',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. SUPPLIER PAYMENTS
CREATE TABLE IF NOT EXISTS public.supplier_payments (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    receipt_no VARCHAR(50) UNIQUE NOT NULL,
    supplier_id TEXT NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    purchase_id TEXT REFERENCES public.supplier_purchases(id) ON DELETE SET NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_mode VARCHAR(50) NOT NULL,
    reference_no VARCHAR(100),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time VARCHAR(20) NOT NULL,
    notes TEXT,
    recorded_by VARCHAR(100) DEFAULT 'Admin',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. MANUAL STOCK ADJUSTMENTS
CREATE TABLE IF NOT EXISTS public.manual_stock_adjustments (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    adjustment_type VARCHAR(20) NOT NULL,
    quantity INTEGER NOT NULL,
    reason TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time VARCHAR(20) NOT NULL,
    recorded_by VARCHAR(100) DEFAULT 'Admin',
    godown_id TEXT,  -- NEW: which godown was adjusted
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. STOCK MOVEMENTS AUDIT LOG
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    movement_type VARCHAR(50) NOT NULL,
    reference_id VARCHAR(100),
    quantity_change INTEGER NOT NULL,
    stock_before INTEGER NOT NULL,
    stock_after INTEGER NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time VARCHAR(20) NOT NULL,
    reason TEXT,
    recorded_by VARCHAR(100) DEFAULT 'Admin',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- NEW TABLES — v2 Feature Expansion
-- ==============================================================================

-- 13. GODOWNS
CREATE TABLE IF NOT EXISTS public.godowns (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    location TEXT,
    contact_person VARCHAR(255),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,  -- The "Main Godown" for migration
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. GODOWN STOCK (Authoritative per-product per-godown quantity)
-- products.current_stock = SUM of all rows here for that product
CREATE TABLE IF NOT EXISTS public.godown_stock (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    godown_id TEXT NOT NULL REFERENCES public.godowns(id) ON DELETE RESTRICT,
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(godown_id, product_id)
);

-- 15. STOCK TRANSFERS (Permanent log — never deleted)
CREATE TABLE IF NOT EXISTS public.stock_transfers (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    transfer_no VARCHAR(50) UNIQUE NOT NULL,
    from_godown_id TEXT NOT NULL REFERENCES public.godowns(id) ON DELETE RESTRICT,
    to_godown_id TEXT NOT NULL REFERENCES public.godowns(id) ON DELETE RESTRICT,
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time VARCHAR(20) NOT NULL,
    reason TEXT,
    notes TEXT,
    recorded_by VARCHAR(100) DEFAULT 'Admin',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. SUPPLIER-PRODUCT MAPPING
-- Tracks which supplier supplies which products (editable, historical purchases unaffected)
CREATE TABLE IF NOT EXISTS public.supplier_products (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    supplier_id TEXT NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(supplier_id, product_id)
);

-- 17. CRM USERS (Staff accounts linked to same business)
CREATE TABLE IF NOT EXISTS public.crm_users (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(30),
    password_hash TEXT NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'partial_access',
    -- roles: owner | full_access | partial_access
    is_active BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(100) DEFAULT 'Admin',
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. ACTIVITY LOG (Central record of every important action)
CREATE TABLE IF NOT EXISTS public.activity_log (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    -- e.g. LOGIN, LOGOUT, LOGIN_FAILED, CREATE, UPDATE, DELETE, TRANSFER, PAYMENT, etc.
    module VARCHAR(100),
    -- e.g. Products, Purchases, Sales, Godowns, Wallet, Users
    record_id TEXT,
    record_ref VARCHAR(100),
    -- human-readable reference like PUR-125, INV-002
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. AUDIT TRAIL (Before/after record for every transaction correction)
CREATE TABLE IF NOT EXISTS public.audit_trail (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    table_name VARCHAR(100) NOT NULL,
    record_id TEXT NOT NULL,
    record_ref VARCHAR(100),
    field_name VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    reason TEXT,
    changed_by VARCHAR(255) NOT NULL,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. WALLET TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    txn_no VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL,
    -- budget | expense
    category VARCHAR(100),
    -- Diesel, Vehicle Parts, Office, Salary, Utilities, Other
    reason TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time VARCHAR(20) NOT NULL,
    notes TEXT,
    recorded_by VARCHAR(100) DEFAULT 'Admin',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_customer_sales_customer ON public.customer_sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_sales_date ON public.customer_sales(date);
CREATE INDEX IF NOT EXISTS idx_customer_payments_customer ON public.customer_payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_payments_date ON public.customer_payments(date);
CREATE INDEX IF NOT EXISTS idx_supplier_purchases_supplier ON public.supplier_purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_purchases_date ON public.supplier_purchases(date);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_supplier ON public.supplier_payments(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_date ON public.supplier_payments(date);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON public.stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON public.stock_movements(date);
CREATE INDEX IF NOT EXISTS idx_godown_stock_godown ON public.godown_stock(godown_id);
CREATE INDEX IF NOT EXISTS idx_godown_stock_product ON public.godown_stock(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_product ON public.stock_transfers(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_date ON public.stock_transfers(date);
CREATE INDEX IF NOT EXISTS idx_supplier_products_supplier ON public.supplier_products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_products_product ON public.supplier_products(product_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON public.activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_trail_record ON public.audit_trail(record_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_date ON public.wallet_transactions(date);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) — Allow Public Anon Read/Write for CRM
-- ==============================================================================
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all on customers" ON public.customers;
CREATE POLICY "Allow anon all on customers" ON public.customers FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all on suppliers" ON public.suppliers;
CREATE POLICY "Allow anon all on suppliers" ON public.suppliers FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all on products" ON public.products;
CREATE POLICY "Allow anon all on products" ON public.products FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.customer_sales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all on customer_sales" ON public.customer_sales;
CREATE POLICY "Allow anon all on customer_sales" ON public.customer_sales FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.customer_sale_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all on customer_sale_items" ON public.customer_sale_items;
CREATE POLICY "Allow anon all on customer_sale_items" ON public.customer_sale_items FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.supplier_purchases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all on supplier_purchases" ON public.supplier_purchases;
CREATE POLICY "Allow anon all on supplier_purchases" ON public.supplier_purchases FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.supplier_purchase_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all on supplier_purchase_items" ON public.supplier_purchase_items;
CREATE POLICY "Allow anon all on supplier_purchase_items" ON public.supplier_purchase_items FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.customer_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all on customer_payments" ON public.customer_payments;
CREATE POLICY "Allow anon all on customer_payments" ON public.customer_payments FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.supplier_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all on supplier_payments" ON public.supplier_payments;
CREATE POLICY "Allow anon all on supplier_payments" ON public.supplier_payments FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.manual_stock_adjustments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all on manual_stock_adjustments" ON public.manual_stock_adjustments;
CREATE POLICY "Allow anon all on manual_stock_adjustments" ON public.manual_stock_adjustments FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all on stock_movements" ON public.stock_movements;
CREATE POLICY "Allow anon all on stock_movements" ON public.stock_movements FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.godowns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all on godowns" ON public.godowns;
CREATE POLICY "Allow anon all on godowns" ON public.godowns FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.godown_stock ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all on godown_stock" ON public.godown_stock;
CREATE POLICY "Allow anon all on godown_stock" ON public.godown_stock FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.stock_transfers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all on stock_transfers" ON public.stock_transfers;
CREATE POLICY "Allow anon all on stock_transfers" ON public.stock_transfers FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.supplier_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all on supplier_products" ON public.supplier_products;
CREATE POLICY "Allow anon all on supplier_products" ON public.supplier_products FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.crm_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all on crm_users" ON public.crm_users;
CREATE POLICY "Allow anon all on crm_users" ON public.crm_users FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all on activity_log" ON public.activity_log;
CREATE POLICY "Allow anon all on activity_log" ON public.activity_log FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.audit_trail ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all on audit_trail" ON public.audit_trail;
CREATE POLICY "Allow anon all on audit_trail" ON public.audit_trail FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all on wallet_transactions" ON public.wallet_transactions;
CREATE POLICY "Allow anon all on wallet_transactions" ON public.wallet_transactions FOR ALL TO anon USING (true) WITH CHECK (true);

-- ==============================================================================
-- SCHEMA MIGRATION / SAFETY COLUMN ADDITIONS
-- (In case tables already existed from v1 without the new columns)
-- ==============================================================================
ALTER TABLE public.customer_sale_items ADD COLUMN IF NOT EXISTS godown_id TEXT;
ALTER TABLE public.supplier_purchases ADD COLUMN IF NOT EXISTS godown_id TEXT;
ALTER TABLE public.supplier_purchase_items ADD COLUMN IF NOT EXISTS godown_id TEXT;
ALTER TABLE public.manual_stock_adjustments ADD COLUMN IF NOT EXISTS godown_id TEXT;
ALTER TABLE public.godowns ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50);
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- ==============================================================================
-- SUPABASE REALTIME REPLICATION
-- ==============================================================================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE
      public.customers, public.suppliers, public.products,
      public.customer_sales, public.customer_sale_items,
      public.supplier_purchases, public.supplier_purchase_items,
      public.customer_payments, public.supplier_payments,
      public.manual_stock_adjustments,
      public.godowns, public.godown_stock, public.stock_transfers,
      public.supplier_products, public.crm_users,
      public.activity_log, public.audit_trail, public.wallet_transactions;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;

-- ==============================================================================
-- INITIAL SEED / DEFAULT DATA (Safe to run multiple times)
-- ==============================================================================

-- 1. Create Default Godowns if none exist
INSERT INTO public.godowns (id, name, code, location, notes, is_active, is_default)
VALUES 
  ('godown-main', 'Main Godown', 'GD-01', 'Nandipet, Nizamabad', 'Primary warehouse and central storage', true, true),
  ('godown-branch-1', 'Branch Godown 1', 'GD-02', 'Nizamabad Town', 'Secondary distribution godown', true, false)
ON CONFLICT (id) DO NOTHING;

-- 2. Seed godown_stock for all existing products into Main Godown if not already present
INSERT INTO public.godown_stock (id, godown_id, product_id, quantity)
SELECT 
  'gs-' || p.id || '-main',
  'godown-main',
  p.id,
  COALESCE(p.current_stock, 0)
FROM public.products p
ON CONFLICT (godown_id, product_id) DO NOTHING;

-- 3. Create Default Staff Users if none exist
INSERT INTO public.crm_users (id, name, email, phone, password_hash, role, is_active, created_by)
VALUES 
  ('user-admin-1', 'Admin (Owner)', 'admin@anusha.com', '9876543210', 'admin', 'owner', true, 'System'),
  ('user-staff-1', 'Operations Staff', 'staff@anusha.com', '9876543211', 'staff123', 'full_access', true, 'Admin')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 18. GODOWN CLEANUP & CASCADE DELETION SQL QUERIES (Reference / Run when needed)
-- ==============================================================================
-- To manually delete a specific godown in Supabase SQL Editor:
-- Replace 'TARGET_GODOWN_ID' with the actual godown ID (e.g., 'godown-1789991737973')
--
-- DO $$
-- DECLARE
--   target_id TEXT := 'TARGET_GODOWN_ID';
-- BEGIN
--   -- 1. Remove associated godown stock rows
--   DELETE FROM public.godown_stock WHERE godown_id = target_id;
--
--   -- 2. Remove associated stock transfers referencing this godown
--   DELETE FROM public.stock_transfers WHERE from_godown_id = target_id OR to_godown_id = target_id;
--
--   -- 3. Delete the godown record
--   DELETE FROM public.godowns WHERE id = target_id;
-- END $$;


