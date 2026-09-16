-- ==============================================================================
-- ANUSHA ENTERPRISES (Nandipet, Nizamabad)
-- Complete Supabase PostgreSQL Schema & Relational Structure
-- Run this script in your Supabase Dashboard -> SQL Editor -> Run
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

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
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. CUSTOMER PAYMENTS (Non-destructive Individual Receipts)
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

-- 10. SUPPLIER PAYMENTS (Non-destructive Individual Vouchers)
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

-- 13. INDEXES FOR HIGH-SPEED LEDGER & DAY BOOK QUERIES
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

-- 14. ROW LEVEL SECURITY (RLS) POLICIES (Allow Public Anon Read/Write for CRM)
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

-- 15. ENABLE SUPABASE REALTIME REPLICATION FOR INSTANT LIVE SYNC
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.customers, public.suppliers, public.products, public.customer_sales, public.customer_sale_items, public.supplier_purchases, public.supplier_purchase_items, public.customer_payments, public.supplier_payments, public.manual_stock_adjustments;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;
