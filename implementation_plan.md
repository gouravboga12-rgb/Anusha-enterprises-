# Implementation Plan: Anusha Enterprises Business Management & Digital Ledger

## Two-Phase Execution Strategy

To ensure you can review, test, and refine the look, feel, and daily bookkeeping workflows before touching the live cloud database, the implementation is structured into two dedicated phases:

---

### Phase 1: Complete Interactive Frontend & UI Review (Current Phase)
**Goal**: Build a fully interactive, responsive frontend application with simulated local business data engine so you can click through every screen, test sales, purchases, partial payments, ledgers, day book, and animations on desktop, tablet, and mobile.

1. **Vite + React Project Setup**:
   - Clean setup with Lucide icons and modern typography.
   - Design System styling: Crisp White (`#FFFFFF`, `#F8FAFC`), Professional Light Blue (`#0284C7`, `#38BDF8`, `#E0F2FE`), and Deep Slate/Black (`#0F172A`, `#1E293B`).
2. **Interactive Local Data Engine**:
   - Seeded with the 6 initial products (*Ideal Boost Box, Ideal Power 90, Ideal Core, Solar Eco Prime, Salvo Thunderbolt, 3D*).
   - Pre-populated with realistic customers, suppliers, past sales, purchases, and partial installments.
   - Fully dynamic in-memory & local state: creating a sale deducts stock, making an installment payment recalculates pending balance, recording a purchase adds stock.
3. **Frontend Components & Screens**:
   - **Dashboard**: High-level KPIs, fast quick-action buttons, recent transactions feed, and AI voice/visual assistant widget.
   - **Customer Management & Profile**: Customer list, search/filters, customer details, lifetime stats, and **Customer Ledger** (chronological debit/credit running balance).
   - **Supplier Management & Profile**: Supplier directory, purchase history, payment outward records, and **Supplier Ledger**.
   - **Products & Inventory**: Catalog with current stock badges, low-stock alerts, stock movement drawer, and **Image Uploader** with instant preview and drag-and-drop.
   - **Sales Billing**: Multi-product invoicing with live stock checks, automatic inventory deduction, and initial partial payment support.
   - **Purchase Entry**: Multi-product supplier entry with automatic inventory increase.
   - **Payments & Installments**: Non-destructive installment tracking (e.g. ₹50,000 bill $\rightarrow$ ₹20k $\rightarrow$ ₹15k $\rightarrow$ ₹15k).
   - **Daily Transactions / Day Book (Roznamcha)**: Select any date to see all transactions and net cash flow summary for that day.
   - **Manual Stock Adjustments**: Dedicated stock correction interface with audit reasons (Damage, Missing, Recount difference).
   - **Revenue & Profit Reports**: Gross profit estimation (`Revenue - Purchase Cost`), top products, customer revenue breakdown.
4. **Testing & Walkthrough**:
   - Test across Mobile, Tablet, and Desktop.
   - Present live frontend demo and walkthrough for your review and approval.

---

### Phase 2: Live Supabase & Cloudinary Integration (After Phase 1 Review)
**Goal**: Connect the verified UI to live Supabase tables and direct Cloudinary uploads.

1. **Supabase Database Provisioning**:
   - Generate and run `supabase_schema.sql` on `https://kboqrpfifsorfkexkpfd.supabase.co`.
   - Tables: `customers`, `suppliers`, `products`, `customer_sales`, `customer_sale_items`, `supplier_purchases`, `supplier_purchase_items`, `customer_payments`, `supplier_payments`, `stock_movements`, `manual_stock_adjustments`, `audit_logs`.
   - Foreign keys, constraints, and indexes.
2. **Cloudinary Integration**:
   - Activate live upload to Cloud Name: `df7cgufv`, Upload Preset: `anusha_products`.
   - Test live image uploads from desktop and mobile camera/gallery directly into Cloudinary.
3. **Data Service Switchover**:
   - Switch data service from local state to live Supabase client (`@supabase/supabase-js`).
   - Verify real-time synchronization, persistence across devices, and end-to-end data integrity.

---

## Phase 1 Deliverables & Verification
- [ ] Vite + React app configured and running cleanly.
- [ ] All 10 core modules implemented and navigable via responsive sidebar/drawer.
- [ ] Business logic fully operational in frontend (inventory adjustments, installment calculations, running ledger balances).
- [ ] AI-style visual/voice assistant animation widget operational.
- [ ] Image uploader with drag-and-drop & instant thumbnail preview.
- [ ] Visual verification on desktop and mobile viewports.

Once you approve this phased plan, I will immediately begin executing **Phase 1**.
