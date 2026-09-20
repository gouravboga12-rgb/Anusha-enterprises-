// Centralized Live Supabase Data Engine & Business Logic for Anusha Enterprises CRM
// v2 — Godown Management, Multi-User, Wallet, Activity Log, Audit Trail, Product Ledger
// Zero localStorage reliance - powered directly by PostgreSQL via Supabase

import { supabase, isSupabaseConfigured } from './supabaseClient.js';
import {
  initialProducts,
  initialCustomers,
  initialSuppliers,
  initialSales,
  initialPurchases,
  initialPayments,
  initialAdjustments
} from '../mock/initialData.js';
import { generateId, getTodayDateString, getCurrentTimeString } from '../utils/formatters.js';

// Simple hash function for password storage (production should use bcrypt via edge function)
const simpleHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'h' + Math.abs(hash).toString(36);
};

class DataService {
  constructor() {
    if (isSupabaseConfigured) {
      this.products = [];
      this.customers = [];
      this.suppliers = [];
      this.sales = [];
      this.purchases = [];
      this.payments = [];
      this.adjustments = [];
      // v2 data
      this.godowns = [];
      this.godownStock = [];
      this.stockTransfers = [];
      this.supplierProducts = [];
      this.crmUsers = [];
      this.activityLog = [];
      this.auditTrail = [];
      this.walletTransactions = [];
      this.isLoading = true;
    } else {
      this.products = JSON.parse(JSON.stringify(initialProducts));
      this.customers = JSON.parse(JSON.stringify(initialCustomers));
      this.suppliers = JSON.parse(JSON.stringify(initialSuppliers));
      this.sales = JSON.parse(JSON.stringify(initialSales));
      this.purchases = JSON.parse(JSON.stringify(initialPurchases));
      this.payments = JSON.parse(JSON.stringify(initialPayments));
      this.adjustments = JSON.parse(JSON.stringify(initialAdjustments));
      this.godowns = [];
      this.godownStock = [];
      this.stockTransfers = [];
      this.supplierProducts = [];
      this.crmUsers = [];
      this.activityLog = [];
      this.auditTrail = [];
      this.walletTransactions = [];
      this.isLoading = false;
    }

    this.isLiveConnected = false;
    this.connectionError = null;
    this.listeners = new Set();
    this.realtimeChannel = null;

    this.init();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach((fn) => fn());
  }

  async init() {
    try {
      if (!isSupabaseConfigured) {
        this.isLiveConnected = false;
        this.connectionError = 'Configure Supabase environment variables in Vercel settings';
        // Ensure default godown exists for demo mode
        this._ensureDefaultGodownDemo();
        this.notify();
        return;
      }

      this.isLoading = true;
      this.notify();

      await this.fetchAll();
      await this._runFirstTimeMigration();
      this.setupRealtimeSubscription();
      this.isLiveConnected = true;
      this.connectionError = null;
    } catch (err) {
      console.warn('Supabase initialization warning:', err.message);
      this.isLiveConnected = false;
      this.connectionError = err.message || 'Connecting to Supabase...';
    } finally {
      this.isLoading = false;
      this.notify();
    }
  }

  // Ensure a default godown exists for demo/mock mode
  _ensureDefaultGodownDemo() {
    if (this.godowns.length === 0) {
      const mainGodown = {
        id: 'godown-main',
        name: 'Main Godown',
        code: 'GD-01',
        location: 'Nandipet, Nizamabad',
        contact_person: '',
        notes: 'Default godown — all existing stock assigned here',
        is_active: true,
        is_default: true,
        created_at: new Date().toISOString()
      };
      this.godowns = [mainGodown];

      // Seed godown_stock from products
      this.godownStock = this.products.map((p) => ({
        id: `gs-${p.id}`,
        godown_id: 'godown-main',
        product_id: p.id,
        quantity: p.current_stock || 0,
        updated_at: new Date().toISOString()
      }));
    }
  }

  // First-time migration: if godowns table is empty, create "Main Godown" and seed godown_stock
  async _runFirstTimeMigration() {
    if (!isSupabaseConfigured) return;
    if (this.godowns.length > 0) return; // Already migrated

    try {
      const mainGodownId = 'godown-main-' + Date.now();
      const mainGodown = {
        id: mainGodownId,
        name: 'Main Godown',
        code: 'GD-01',
        location: 'Nandipet, Nizamabad',
        contact_person: '',
        notes: 'Default godown — all existing stock assigned here during system migration',
        is_active: true,
        is_default: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await supabase.from('godowns').insert([mainGodown]);
      this.godowns = [mainGodown];

      // Seed godown_stock from current product stock
      const stockRows = this.products.map((p) => ({
        id: `gs-${p.id}-${Date.now()}`,
        godown_id: mainGodownId,
        product_id: p.id,
        quantity: p.current_stock || 0,
        updated_at: new Date().toISOString()
      }));

      if (stockRows.length > 0) {
        await supabase.from('godown_stock').insert(stockRows);
        this.godownStock = stockRows;
      }

      console.log('✅ First-time migration: Main Godown created and stock seeded.');
    } catch (e) {
      console.warn('Migration warning:', e);
    }
  }

  async fetchAll() {
    try {
      // 1. Products
      const { data: prods, error: pErr } = await supabase
        .from('products').select('*').neq('is_active', false).order('created_at', { ascending: false });
      if (pErr) throw pErr;

      // 2. Customers
      const { data: custs, error: cErr } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
      if (cErr) throw cErr;

      // 3. Suppliers
      const { data: supps, error: sErr } = await supabase.from('suppliers').select('*').order('created_at', { ascending: false });
      if (sErr) throw sErr;

      // 4. Sales with items
      const { data: salesData, error: saleErr } = await supabase
        .from('customer_sales').select('*, items:customer_sale_items(*)').order('date', { ascending: false });
      if (saleErr) throw saleErr;

      // 5. Purchases with items
      const { data: purData, error: purErr } = await supabase
        .from('supplier_purchases').select('*, items:supplier_purchase_items(*)').order('date', { ascending: false });
      if (purErr) throw purErr;

      // 6. Customer Payments
      const { data: custPayments, error: cpErr } = await supabase
        .from('customer_payments').select('*').order('created_at', { ascending: false });
      if (cpErr) throw cpErr;

      // 7. Supplier Payments
      const { data: suppPayments, error: spErr } = await supabase
        .from('supplier_payments').select('*').order('created_at', { ascending: false });
      if (spErr) throw spErr;

      // 8. Adjustments
      const { data: adjs, error: adjErr } = await supabase
        .from('manual_stock_adjustments').select('*').order('created_at', { ascending: false });
      if (adjErr) throw adjErr;

      // 9. Godowns
      const { data: godownsData } = await supabase.from('godowns').select('*').order('created_at', { ascending: true });

      // 10. Godown Stock
      const { data: godownStockData } = await supabase.from('godown_stock').select('*');

      // 11. Stock Transfers
      const { data: transfersData } = await supabase
        .from('stock_transfers').select('*').order('created_at', { ascending: false });

      // 12. Supplier Products
      const { data: suppProdsData } = await supabase.from('supplier_products').select('*');

      // 13. CRM Users
      const { data: usersData } = await supabase.from('crm_users').select('*').order('created_at', { ascending: false });

      // 14. Activity Log (last 500)
      const { data: activityData } = await supabase
        .from('activity_log').select('*').order('created_at', { ascending: false }).limit(500);

      // 15. Audit Trail
      const { data: auditData } = await supabase
        .from('audit_trail').select('*').order('changed_at', { ascending: false }).limit(1000);

      // 16. Wallet Transactions
      const { data: walletData } = await supabase
        .from('wallet_transactions').select('*').order('created_at', { ascending: false });

      // Normalize data
      this.products = (prods || []).map((p) => ({
        ...p,
        current_stock: Number(p.current_stock) || 0,
        purchase_price: Number(p.purchase_price) || 0,
        selling_price: Number(p.selling_price) || 0
      }));

      this.customers = custs || [];
      this.suppliers = supps || [];

      this.sales = (salesData || []).map((s) => ({
        ...s,
        total_amount: Number(s.total_amount) || 0,
        paid_amount: Number(s.paid_amount) || 0,
        pending_amount: Number(s.pending_amount) || 0,
        items: (s.items || []).map((i) => ({
          ...i,
          quantity: Number(i.quantity) || 0,
          selling_price: Number(i.selling_price) || 0,
          total: Number(i.total) || 0
        }))
      }));

      this.purchases = (purData || []).map((p) => ({
        ...p,
        total_amount: Number(p.total_amount) || 0,
        paid_amount: Number(p.paid_amount) || 0,
        pending_amount: Number(p.pending_amount) || 0,
        items: (p.items || []).map((i) => ({
          ...i,
          quantity: Number(i.quantity) || 0,
          purchase_price: Number(i.purchase_price) || 0,
          total: Number(i.total) || 0
        }))
      }));

      const unifiedCustomerPayments = (custPayments || []).map((p) => ({ ...p, type: 'customer_payment', amount: Number(p.amount) || 0 }));
      const unifiedSupplierPayments = (suppPayments || []).map((p) => ({ ...p, type: 'supplier_payment', amount: Number(p.amount) || 0 }));
      this.payments = [...unifiedCustomerPayments, ...unifiedSupplierPayments].sort((a, b) =>
        new Date(b.created_at || b.date) - new Date(a.created_at || a.date)
      );

      this.adjustments = (adjs || []).map((a) => ({ ...a, quantity: Number(a.quantity) || 0 }));

      this.godowns = (godownsData || []);
      this.godownStock = (godownStockData || []).map((gs) => ({ ...gs, quantity: Number(gs.quantity) || 0 }));
      this.stockTransfers = (transfersData || []).map((t) => ({ ...t, quantity: Number(t.quantity) || 0 }));
      this.supplierProducts = suppProdsData || [];
      this.crmUsers = usersData || [];
      this.activityLog = activityData || [];
      this.auditTrail = auditData || [];
      this.walletTransactions = (walletData || []).map((w) => ({ ...w, amount: Number(w.amount) || 0 }));

      this.isLiveConnected = true;
      this.connectionError = null;
      this.notify();
    } catch (err) {
      throw err;
    }
  }

  setupRealtimeSubscription() {
    if (!isSupabaseConfigured) return;
    try {
      if (this.realtimeChannel) supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = supabase
        .channel('anusha-crm-live-v2')
        .on('postgres_changes', { event: '*', schema: 'public' }, () => {
          this.fetchAll().catch((e) => console.warn('Realtime refresh error:', e));
        })
        .subscribe();
    } catch (e) {
      console.warn('Realtime subscription error:', e);
    }
  }

  // ==============================================================================
  // PERMISSION HELPERS
  // ==============================================================================
  canDelete(currentUser) {
    if (!currentUser) return false;
    return currentUser.role === 'owner' || currentUser.role === 'full_access';
  }

  canEdit(currentUser) {
    if (!currentUser) return false;
    return true; // All roles can edit
  }

  // ==============================================================================
  // ACTIVITY LOG
  // ==============================================================================
  logActivity(userObj, action, module, recordId, recordRef, details) {
    const entry = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).slice(2),
      user_name: userObj?.name || 'System',
      user_email: userObj?.email || '',
      action,
      module: module || '',
      record_id: recordId || null,
      record_ref: recordRef || null,
      details: details || null,
      created_at: new Date().toISOString()
    };
    this.activityLog = [entry, ...this.activityLog].slice(0, 1000);

    if (isSupabaseConfigured) {
      supabase.from('activity_log').insert([entry]).then().catch((e) => console.warn('Activity log error:', e));
    }
  }

  getActivityLog(filters = {}) {
    let logs = this.activityLog;
    if (filters.module) logs = logs.filter((l) => l.module === filters.module);
    if (filters.user_email) logs = logs.filter((l) => l.user_email === filters.user_email);
    if (filters.fromDate) logs = logs.filter((l) => l.created_at >= filters.fromDate);
    if (filters.toDate) logs = logs.filter((l) => l.created_at <= filters.toDate + 'T23:59:59');
    return logs;
  }

  // ==============================================================================
  // AUDIT TRAIL
  // ==============================================================================
  recordAuditEntry(tableName, recordId, recordRef, changes, reason, changedBy) {
    const entries = changes.map((c) => ({
      id: 'aud-' + Date.now() + '-' + Math.random().toString(36).slice(2),
      table_name: tableName,
      record_id: recordId,
      record_ref: recordRef,
      field_name: c.field,
      old_value: String(c.oldValue ?? ''),
      new_value: String(c.newValue ?? ''),
      reason: reason || '',
      changed_by: changedBy || 'Admin',
      changed_at: new Date().toISOString()
    }));

    this.auditTrail = [...entries, ...this.auditTrail];

    if (isSupabaseConfigured) {
      supabase.from('audit_trail').insert(entries).then().catch((e) => console.warn('Audit trail error:', e));
    }
  }

  getAuditTrail(recordId) {
    return this.auditTrail.filter((a) => a.record_id === recordId).sort((a, b) =>
      new Date(b.changed_at) - new Date(a.changed_at)
    );
  }

  // ==============================================================================
  // GODOWN MANAGEMENT
  // ==============================================================================
  getGodowns(includeInactive = false) {
    return includeInactive ? this.godowns : this.godowns.filter((g) => g.is_active);
  }

  getGodownById(id) {
    return this.godowns.find((g) => g.id === id);
  }

  getDefaultGodown() {
    return this.godowns.find((g) => g.is_default) || this.godowns[0] || null;
  }

  saveGodown(godownData, currentUser) {
    const isNew = !godownData.id;
    const gId = godownData.id || 'godown-' + Date.now();

    const dbRecord = {
      id: gId,
      name: godownData.name,
      code: godownData.code || '',
      location: godownData.location || '',
      contact_person: godownData.contact_person || '',
      notes: godownData.notes || '',
      is_active: godownData.is_active !== false,
      is_default: godownData.is_default || false,
      updated_at: new Date().toISOString()
    };

    let saved;
    if (isNew) {
      saved = { ...dbRecord, created_at: new Date().toISOString() };
      this.godowns = [...this.godowns, saved];
      this.logActivity(currentUser, 'CREATE', 'Godowns', gId, dbRecord.name, `Created godown: ${dbRecord.name}`);
    } else {
      saved = { ...this.getGodownById(gId), ...dbRecord };
      this.godowns = this.godowns.map((g) => (g.id === gId ? saved : g));
      this.logActivity(currentUser, 'UPDATE', 'Godowns', gId, dbRecord.name, `Updated godown: ${dbRecord.name}`);
    }
    this.notify();

    if (isNew) {
      supabase.from('godowns').insert([dbRecord]).then().catch((e) => console.warn('saveGodown error:', e));
    } else {
      supabase.from('godowns').update(dbRecord).eq('id', gId).then().catch((e) => console.warn('saveGodown error:', e));
    }

    return saved;
  }

  archiveGodown(id, currentUser) {
    const godown = this.getGodownById(id);
    if (!godown) throw new Error('Godown not found');

    // Block if has any stock
    const stockInGodown = this.godownStock.filter((gs) => gs.godown_id === id && gs.quantity > 0);
    if (stockInGodown.length > 0) {
      throw new Error('Cannot deactivate this godown. It still has active stock. Transfer or adjust stock to zero first.');
    }

    // Block if has any transaction history
    const hasTransfers = this.stockTransfers.some(
      (t) => t.from_godown_id === id || t.to_godown_id === id
    );
    const hasPurchases = this.purchases.some((p) => p.godown_id === id);
    const hasSales = this.sales.some((s) => s.items?.some((i) => i.godown_id === id));

    if (hasTransfers || hasPurchases || hasSales) {
      throw new Error('Cannot deactivate this godown — it has transaction history. It will be archived (visible in history but not selectable for new transactions).');
    }

    const updated = { ...godown, is_active: false, updated_at: new Date().toISOString() };
    this.godowns = this.godowns.map((g) => (g.id === id ? updated : g));
    this.logActivity(currentUser, 'ARCHIVE', 'Godowns', id, godown.name, `Archived godown: ${godown.name}`);
    this.notify();

    supabase.from('godowns').update({ is_active: false, updated_at: updated.updated_at }).eq('id', id).then().catch((e) => console.warn(e));
  }

  // ==============================================================================
  // GODOWN STOCK
  // ==============================================================================
  getGodownStock(godownId) {
    const rows = this.godownStock.filter((gs) => gs.godown_id === godownId);
    return rows.map((gs) => {
      const prod = this.getProductById(gs.product_id);
      return { ...gs, product: prod };
    });
  }

  getProductGodownStock(productId) {
    const rows = this.godownStock.filter((gs) => gs.product_id === productId && gs.quantity > 0);
    return rows.map((gs) => {
      const godown = this.getGodownById(gs.godown_id);
      return { ...gs, godown };
    });
  }

  getProductStockInGodown(productId, godownId) {
    const row = this.godownStock.find((gs) => gs.product_id === productId && gs.godown_id === godownId);
    return row ? row.quantity : 0;
  }

  // Update godown stock and recompute product total
  _updateGodownStock(godownId, productId, quantityDelta) {
    const existing = this.godownStock.find((gs) => gs.godown_id === godownId && gs.product_id === productId);

    if (existing) {
      const newQty = Math.max(0, existing.quantity + quantityDelta);
      this.godownStock = this.godownStock.map((gs) =>
        gs.godown_id === godownId && gs.product_id === productId
          ? { ...gs, quantity: newQty, updated_at: new Date().toISOString() }
          : gs
      );

      if (isSupabaseConfigured) {
        supabase.from('godown_stock')
          .update({ quantity: newQty, updated_at: new Date().toISOString() })
          .eq('godown_id', godownId).eq('product_id', productId)
          .then().catch((e) => console.warn('godown_stock update error:', e));
      }
    } else if (quantityDelta > 0) {
      const newRow = {
        id: `gs-${godownId}-${productId}-${Date.now()}`,
        godown_id: godownId,
        product_id: productId,
        quantity: quantityDelta,
        updated_at: new Date().toISOString()
      };
      this.godownStock = [...this.godownStock, newRow];

      if (isSupabaseConfigured) {
        supabase.from('godown_stock').upsert([newRow], { onConflict: 'godown_id,product_id' })
          .then().catch((e) => console.warn('godown_stock insert error:', e));
      }
    }

    // Recompute product total from godown_stock
    this._recomputeProductTotal(productId);
  }

  _recomputeProductTotal(productId) {
    const total = this.godownStock
      .filter((gs) => gs.product_id === productId)
      .reduce((sum, gs) => sum + (gs.quantity || 0), 0);

    this.products = this.products.map((p) =>
      p.id === productId ? { ...p, current_stock: total } : p
    );

    if (isSupabaseConfigured) {
      supabase.from('products').update({ current_stock: total }).eq('id', productId)
        .then().catch((e) => console.warn('products current_stock sync error:', e));
    }
  }

  // ==============================================================================
  // STOCK TRANSFERS
  // ==============================================================================
  transferStock(transferData, currentUser) {
    const { from_godown_id, to_godown_id, product_id, quantity, date, time, reason, notes } = transferData;
    const qty = Number(quantity) || 0;

    // Validations
    if (from_godown_id === to_godown_id) throw new Error('Source and destination godown cannot be the same.');
    if (qty <= 0) throw new Error('Transfer quantity must be greater than zero.');

    const fromGodown = this.getGodownById(from_godown_id);
    const toGodown = this.getGodownById(to_godown_id);
    if (!fromGodown || !fromGodown.is_active) throw new Error('Source godown is not active.');
    if (!toGodown || !toGodown.is_active) throw new Error('Destination godown is not active.');

    const availableQty = this.getProductStockInGodown(product_id, from_godown_id);
    if (qty > availableQty) {
      throw new Error(`Insufficient stock in ${fromGodown.name}. Available: ${availableQty}, Requested: ${qty}`);
    }

    const prod = this.getProductById(product_id);
    if (!prod) throw new Error('Product not found.');

    const transferId = 'tr-' + Date.now();
    const transferNo = `TR-${Math.floor(10000 + Math.random() * 90000)}`;

    const newTransfer = {
      id: transferId,
      transfer_no: transferNo,
      from_godown_id,
      to_godown_id,
      product_id,
      quantity: qty,
      date: date || getTodayDateString(),
      time: time || getCurrentTimeString(),
      reason: reason || '',
      notes: notes || '',
      recorded_by: currentUser?.name || 'Admin',
      created_at: new Date().toISOString()
    };

    // Atomic stock update
    this._updateGodownStock(from_godown_id, product_id, -qty);
    this._updateGodownStock(to_godown_id, product_id, qty);

    this.stockTransfers = [newTransfer, ...this.stockTransfers];

    this.logActivity(currentUser, 'TRANSFER', 'Stock', transferId, transferNo,
      `Transferred ${qty} ${prod.unit || 'units'} of ${prod.name} from ${fromGodown.name} to ${toGodown.name}. Reason: ${reason || 'N/A'}`
    );

    this.notify();

    if (isSupabaseConfigured) {
      supabase.from('stock_transfers').insert([newTransfer]).then().catch((e) => console.warn('transfer insert error:', e));
    }

    return newTransfer;
  }

  getStockTransfers(filters = {}) {
    let transfers = this.stockTransfers;
    if (filters.product_id) transfers = transfers.filter((t) => t.product_id === filters.product_id);
    if (filters.godown_id) transfers = transfers.filter((t) => t.from_godown_id === filters.godown_id || t.to_godown_id === filters.godown_id);
    if (filters.fromDate) transfers = transfers.filter((t) => t.date >= filters.fromDate);
    if (filters.toDate) transfers = transfers.filter((t) => t.date <= filters.toDate);
    return transfers;
  }

  // ==============================================================================
  // SUPPLIER-PRODUCT MAPPING
  // ==============================================================================
  getSupplierProducts(supplierId) {
    const mappings = this.supplierProducts.filter((sp) => sp.supplier_id === supplierId);
    return mappings.map((m) => this.getProductById(m.product_id)).filter(Boolean);
  }

  getProductSuppliers(productId) {
    const mappings = this.supplierProducts.filter((sp) => sp.product_id === productId);
    return mappings.map((m) => this.getSupplierById(m.supplier_id)).filter(Boolean);
  }

  saveSupplierProducts(supplierId, productIds, currentUser) {
    // Remove existing mappings for this supplier
    this.supplierProducts = this.supplierProducts.filter((sp) => sp.supplier_id !== supplierId);

    // Add new mappings
    const newMappings = productIds.map((pid) => ({
      id: `sp-${supplierId}-${pid}`,
      supplier_id: supplierId,
      product_id: pid,
      created_at: new Date().toISOString()
    }));
    this.supplierProducts = [...this.supplierProducts, ...newMappings];

    const supplier = this.getSupplierById(supplierId);
    this.logActivity(currentUser, 'UPDATE', 'Suppliers', supplierId, supplier?.company_name,
      `Updated product mapping for ${supplier?.company_name}: ${productIds.length} products linked`
    );

    this.notify();

    if (isSupabaseConfigured) {
      supabase.from('supplier_products').delete().eq('supplier_id', supplierId)
        .then(() => {
          if (newMappings.length > 0) {
            supabase.from('supplier_products').insert(newMappings).then().catch((e) => console.warn(e));
          }
        }).catch((e) => console.warn('saveSupplierProducts error:', e));
    }
  }

  // ==============================================================================
  // PRODUCTS
  // ==============================================================================
  getProducts() {
    return (this.products || []).filter((p) => p && p.is_active !== false);
  }

  getProductById(id) {
    return this.products.find((p) => p.id === id);
  }

  saveProduct(productData, currentUser) {
    const isNew = !productData.id;
    const prodId = productData.id || 'prod-' + Date.now();

    const dbRecord = {
      id: prodId,
      sku: productData.sku || `SKU-${Math.floor(100 + Math.random() * 900)}`,
      name: productData.name,
      current_stock: productData.current_stock !== undefined && productData.current_stock !== ''
        ? Number(productData.current_stock) : 0,
      unit: productData.unit || 'boxes',
      purchase_price: Number(productData.purchase_price) || 0,
      selling_price: Number(productData.selling_price) || 0,
      min_stock_alert: productData.min_stock_alert !== undefined && productData.min_stock_alert !== ''
        ? Number(productData.min_stock_alert)
        : (productData.low_stock_threshold !== undefined ? Number(productData.low_stock_threshold) : 0),
      image_url: productData.image_url || null,
      cloudinary_public_id: productData.cloudinary_public_id || null,
      is_active: productData.is_active !== undefined ? productData.is_active : true,
      description: productData.description || null,
      updated_at: new Date().toISOString()
    };

    let saved;
    if (isNew) {
      saved = { ...dbRecord, created_at: new Date().toISOString() };
      this.products = [saved, ...this.products];
      this.logActivity(currentUser, 'CREATE', 'Products', prodId, dbRecord.name, `Created product: ${dbRecord.name}`);
    } else {
      saved = { ...this.getProductById(prodId), ...dbRecord };
      this.products = this.products.map((p) => (p.id === prodId ? saved : p));
      this.logActivity(currentUser, 'UPDATE', 'Products', prodId, dbRecord.name, `Updated product: ${dbRecord.name}`);
    }
    this.notify();

    if (isNew) {
      supabase.from('products').insert([dbRecord]).then().catch((e) => console.warn('saveProduct error:', e));
    } else {
      supabase.from('products').update(dbRecord).eq('id', prodId).then().catch((e) => console.warn('saveProduct error:', e));
    }

    return saved;
  }

  async deleteProduct(id, currentUser) {
    if (!this.canDelete(currentUser)) throw new Error('Permission denied: you do not have delete access.');

    const prod = this.getProductById(id);
    this.products = this.products.filter((p) => p.id !== id);
    this.notify();

    this.logActivity(currentUser, 'DELETE', 'Products', id, prod?.name, `Deleted product: ${prod?.name}`);

    if (!isSupabaseConfigured) return;

    try {
      await supabase.from('manual_stock_adjustments').delete().eq('product_id', id);
      await supabase.from('customer_sale_items').delete().eq('product_id', id);
      await supabase.from('supplier_purchase_items').delete().eq('product_id', id);
      await supabase.from('godown_stock').delete().eq('product_id', id);

      const { error: delErr } = await supabase.from('products').delete().eq('id', id);
      if (delErr) await supabase.from('products').update({ is_active: false }).eq('id', id);
    } catch (e) {
      console.warn('deleteProduct exception:', e);
      try { await supabase.from('products').update({ is_active: false }).eq('id', id); } catch { }
    }
  }

  toggleProductActive(id) {
    const prod = this.getProductById(id);
    if (!prod) return;
    const newStatus = !prod.is_active;
    this.products = this.products.map((p) => (p.id === id ? { ...p, is_active: newStatus } : p));
    this.notify();
    supabase.from('products').update({ is_active: newStatus }).eq('id', id).then().catch((e) => console.warn(e));
  }

  // ==============================================================================
  // PRODUCT LEDGER (Unified chronological history for one product)
  // ==============================================================================
  getProductLedger(productId) {
    const entries = [];
    const prod = this.getProductById(productId);
    if (!prod) return { product: null, godownBreakdown: [], entries: [] };

    // Godown breakdown
    const godownBreakdown = this.getProductGodownStock(productId);

    // Purchases
    this.purchases.forEach((pur) => {
      const items = (pur.items || []).filter((i) => i.product_id === productId);
      items.forEach((item) => {
        const supp = this.getSupplierById(pur.supplier_id);
        const godown = this.getGodownById(item.godown_id || pur.godown_id);
        entries.push({
          id: pur.id,
          date: pur.date,
          time: pur.time,
          type: 'PURCHASE',
          type_label: 'Purchase',
          party: supp ? supp.company_name : 'Supplier',
          party_id: pur.supplier_id,
          godown: godown ? godown.name : 'Main Godown',
          godown_id: item.godown_id || pur.godown_id,
          quantity_change: +Number(item.quantity),
          quantity: Number(item.quantity),
          unit_price: Number(item.purchase_price),
          total: Number(item.total),
          reference: pur.purchase_no,
          reference_id: pur.id,
          notes: pur.notes
        });
      });
    });

    // Sales
    this.sales.forEach((sale) => {
      const items = (sale.items || []).filter((i) => i.product_id === productId);
      items.forEach((item) => {
        const cust = this.getCustomerById(sale.customer_id);
        const godown = this.getGodownById(item.godown_id);
        entries.push({
          id: sale.id,
          date: sale.date,
          time: sale.time,
          type: 'SALE',
          type_label: 'Sale',
          party: cust ? cust.name : 'Customer',
          party_id: sale.customer_id,
          godown: godown ? godown.name : '—',
          godown_id: item.godown_id,
          quantity_change: -Number(item.quantity),
          quantity: Number(item.quantity),
          unit_price: Number(item.selling_price),
          total: Number(item.total),
          reference: sale.invoice_no,
          reference_id: sale.id,
          notes: sale.notes
        });
      });
    });

    // Transfers
    this.stockTransfers.filter((t) => t.product_id === productId).forEach((t) => {
      const fromG = this.getGodownById(t.from_godown_id);
      const toG = this.getGodownById(t.to_godown_id);
      entries.push({
        id: t.id + '-out',
        date: t.date,
        time: t.time,
        type: 'TRANSFER_OUT',
        type_label: 'Transfer Out',
        party: `${fromG?.name || '?'} → ${toG?.name || '?'}`,
        godown: fromG?.name || '—',
        godown_id: t.from_godown_id,
        quantity_change: -Number(t.quantity),
        quantity: Number(t.quantity),
        unit_price: null,
        total: null,
        reference: t.transfer_no,
        reference_id: t.id,
        notes: t.reason
      });
      entries.push({
        id: t.id + '-in',
        date: t.date,
        time: t.time,
        type: 'TRANSFER_IN',
        type_label: 'Transfer In',
        party: `${fromG?.name || '?'} → ${toG?.name || '?'}`,
        godown: toG?.name || '—',
        godown_id: t.to_godown_id,
        quantity_change: +Number(t.quantity),
        quantity: Number(t.quantity),
        unit_price: null,
        total: null,
        reference: t.transfer_no,
        reference_id: t.id,
        notes: t.reason
      });
    });

    // Adjustments
    this.adjustments.filter((a) => a.product_id === productId).forEach((a) => {
      const godown = this.getGodownById(a.godown_id);
      entries.push({
        id: a.id,
        date: a.date,
        time: a.time,
        type: 'ADJUSTMENT',
        type_label: a.adjustment_type === 'increase' ? 'Stock Addition' : 'Stock Reduction',
        party: '—',
        godown: godown?.name || 'Main Godown',
        godown_id: a.godown_id,
        quantity_change: a.adjustment_type === 'increase' ? +a.quantity : -a.quantity,
        quantity: a.quantity,
        unit_price: null,
        total: null,
        reference: 'ADJ',
        reference_id: a.id,
        notes: a.reason
      });
    });

    // Sort chronologically (oldest first)
    entries.sort((a, b) => {
      const dateA = new Date(`${a.date}T${(a.time || '00:00').replace(/\s*(AM|PM)/i, '')}`);
      const dateB = new Date(`${b.date}T${(b.time || '00:00').replace(/\s*(AM|PM)/i, '')}`);
      return dateA - dateB;
    });

    return { product: prod, godownBreakdown, entries };
  }

  // ==============================================================================
  // CUSTOMERS
  // ==============================================================================
  getCustomers() { return this.customers; }
  getCustomerById(id) { return this.customers.find((c) => c.id === id); }

  saveCustomer(custData, currentUser) {
    const isNew = !custData.id;
    const custId = custData.id || 'cust-' + Date.now();

    const dbRecord = {
      id: custId,
      customer_id: custData.customer_id || `CUST-${100 + this.customers.length + 1}`,
      name: custData.name,
      mobile: custData.mobile || null,
      area: custData.area || null,
      address: custData.address || null,
      status: custData.status || 'active',
      notes: custData.notes || null,
      updated_at: new Date().toISOString()
    };

    let saved;
    if (isNew) {
      saved = { ...dbRecord, created_at: new Date().toISOString() };
      this.customers = [saved, ...this.customers];
      this.logActivity(currentUser, 'CREATE', 'Customers', custId, custData.name, `Created customer: ${custData.name}`);
    } else {
      saved = { ...this.getCustomerById(custId), ...dbRecord };
      this.customers = this.customers.map((c) => (c.id === custId ? saved : c));
      this.logActivity(currentUser, 'UPDATE', 'Customers', custId, custData.name, `Updated customer: ${custData.name}`);
    }
    this.notify();

    if (isNew) {
      supabase.from('customers').insert([dbRecord]).then().catch((e) => console.warn(e));
    } else {
      supabase.from('customers').update(dbRecord).eq('id', custId).then().catch((e) => console.warn(e));
    }
    return saved;
  }

  deleteCustomer(id, currentUser) {
    if (!this.canDelete(currentUser)) throw new Error('Permission denied.');
    const c = this.getCustomerById(id);
    this.customers = this.customers.filter((c) => c.id !== id);
    this.sales = this.sales.filter((s) => s.customer_id !== id);
    this.payments = this.payments.filter((p) => p.customer_id !== id);
    this.logActivity(currentUser, 'DELETE', 'Customers', id, c?.name, `Deleted customer: ${c?.name}`);
    this.notify();
    supabase.from('customers').delete().eq('id', id).then().catch((e) => console.warn(e));
  }

  // ==============================================================================
  // SUPPLIERS
  // ==============================================================================
  getSuppliers() { return this.suppliers; }
  getSupplierById(id) { return this.suppliers.find((s) => s.id === id); }

  saveSupplier(suppData, currentUser) {
    const isNew = !suppData.id;
    const suppId = suppData.id || 'supp-' + Date.now();

    const dbRecord = {
      id: suppId,
      supplier_id: suppData.supplier_id || `SUPP-${100 + this.suppliers.length + 1}`,
      company_name: suppData.company_name,
      supplier_name: suppData.supplier_name || null,
      mobile: suppData.mobile || null,
      area: suppData.area || null,
      address: suppData.address || null,
      notes: suppData.notes || null,
      updated_at: new Date().toISOString()
    };

    let saved;
    if (isNew) {
      saved = { ...dbRecord, created_at: new Date().toISOString() };
      this.suppliers = [saved, ...this.suppliers];
      this.logActivity(currentUser, 'CREATE', 'Suppliers', suppId, suppData.company_name, `Created supplier: ${suppData.company_name}`);
    } else {
      saved = { ...this.getSupplierById(suppId), ...dbRecord };
      this.suppliers = this.suppliers.map((s) => (s.id === suppId ? saved : s));
      this.logActivity(currentUser, 'UPDATE', 'Suppliers', suppId, suppData.company_name, `Updated supplier: ${suppData.company_name}`);
    }
    this.notify();

    if (isNew) {
      supabase.from('suppliers').insert([dbRecord]).then().catch((e) => console.warn(e));
    } else {
      supabase.from('suppliers').update(dbRecord).eq('id', suppId).then().catch((e) => console.warn(e));
    }
    return saved;
  }

  deleteSupplier(id, currentUser) {
    if (!this.canDelete(currentUser)) throw new Error('Permission denied.');
    const s = this.getSupplierById(id);
    this.suppliers = this.suppliers.filter((s) => s.id !== id);
    this.purchases = this.purchases.filter((p) => p.supplier_id !== id);
    this.payments = this.payments.filter((p) => p.supplier_id !== id);
    this.logActivity(currentUser, 'DELETE', 'Suppliers', id, s?.company_name, `Deleted supplier: ${s?.company_name}`);
    this.notify();
    supabase.from('suppliers').delete().eq('id', id).then().catch((e) => console.warn(e));
  }

  // ==============================================================================
  // SALES (CUSTOMER BILLING)
  // ==============================================================================
  getSales() { return this.sales; }
  getSaleById(id) { return this.sales.find((s) => s.id === id); }
  getSalePayments(saleId) { return this.payments.filter((p) => p.sale_id === saleId && p.type === 'customer_payment'); }

  recordSale(saleData, currentUser) {
    // STRICT STOCK VALIDATION per godown per item
    for (const item of saleData.items) {
      const prod = this.getProductById(item.product_id);
      const reqQty = Number(item.quantity) || 0;
      if (!prod) throw new Error(`Product not found: ${item.product_name || item.product_id}`);

      if (item.godown_id) {
        const availInGodown = this.getProductStockInGodown(item.product_id, item.godown_id);
        if (reqQty > availInGodown) {
          const g = this.getGodownById(item.godown_id);
          throw new Error(
            `Insufficient stock in ${g?.name || 'selected godown'}. Available: ${availInGodown} ${prod.unit || 'units'} of "${prod.name}", Requested: ${reqQty}`
          );
        }
      } else {
        if (reqQty > prod.current_stock) {
          throw new Error(`Cannot complete sale: requested ${reqQty} of "${prod.name}", but only ${prod.current_stock} available.`);
        }
      }
    }

    const saleId = 'sale-' + Date.now();
    const invoiceNo = `INV-${Math.floor(100 + Math.random() * 900)}`;
    const initialPay = Math.max(0, Number(saleData.initial_payment) || 0);

    const totalAmount = saleData.items.reduce((acc, item) =>
      acc + (Number(item.quantity) || 0) * (Number(item.selling_price) || 0), 0);

    const pendingAmount = Math.max(0, totalAmount - initialPay);
    const paymentStatus = pendingAmount === 0 ? 'Paid' : initialPay > 0 ? 'Partially Paid' : 'Pending';

    const cleanItems = saleData.items.map((i, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      sale_id: saleId,
      product_id: i.product_id,
      product_name: i.product_name || this.getProductById(i.product_id)?.name || 'Product',
      quantity: Number(i.quantity) || 0,
      selling_price: Number(i.selling_price) || 0,
      total: (Number(i.quantity) || 0) * (Number(i.selling_price) || 0),
      godown_id: i.godown_id || null
    }));

    const newSale = {
      id: saleId,
      invoice_no: invoiceNo,
      customer_id: saleData.customer_id,
      date: saleData.date || getTodayDateString(),
      time: saleData.time || getCurrentTimeString(),
      items: cleanItems,
      total_amount: totalAmount,
      paid_amount: initialPay,
      pending_amount: pendingAmount,
      payment_status: paymentStatus,
      notes: saleData.notes || '',
      recorded_by: currentUser?.name || 'Admin',
      created_at: new Date().toISOString()
    };

    // Deduct godown stock per item
    for (const item of cleanItems) {
      if (item.godown_id) {
        this._updateGodownStock(item.godown_id, item.product_id, -item.quantity);
      } else {
        // Legacy: deduct from overall only
        const prod = this.getProductById(item.product_id);
        if (prod) prod.current_stock = Math.max(0, prod.current_stock - item.quantity);
      }
    }

    this.sales = [newSale, ...this.sales];

    let newPayment = null;
    if (initialPay > 0) {
      newPayment = {
        id: 'pay-' + Date.now(),
        receipt_no: `REC-${Math.floor(100 + Math.random() * 900)}`,
        type: 'customer_payment',
        customer_id: saleData.customer_id,
        sale_id: saleId,
        amount: initialPay,
        payment_mode: saleData.payment_mode || 'Cash',
        reference_no: saleData.reference_no || '',
        date: saleData.date || getTodayDateString(),
        time: saleData.time || getCurrentTimeString(),
        notes: `Initial down payment for ${invoiceNo}`,
        recorded_by: currentUser?.name || 'Admin',
        created_at: new Date().toISOString()
      };
      this.payments = [newPayment, ...this.payments];
    }

    const cust = this.getCustomerById(saleData.customer_id);
    const itemsSummary = cleanItems.map((i) => `${i.product_name}: ${i.quantity} × ₹${i.selling_price} = ₹${i.total}`).join(' | ');
    this.logActivity(currentUser, 'CREATE', 'Sales', saleId, invoiceNo,
      `Sale to ${cust?.name || 'Customer'} — ${itemsSummary} — Total: ₹${totalAmount}`
    );

    this.notify();

    // Background Supabase write
    supabase.from('customer_sales').insert([{
      id: newSale.id, invoice_no: newSale.invoice_no, customer_id: newSale.customer_id,
      date: newSale.date, time: newSale.time, total_amount: newSale.total_amount,
      paid_amount: newSale.paid_amount, pending_amount: newSale.pending_amount,
      payment_status: newSale.payment_status, notes: newSale.notes, recorded_by: newSale.recorded_by
    }]).then(() => {
      supabase.from('customer_sale_items').insert(
        cleanItems.map((i) => ({
          id: i.id, sale_id: i.sale_id, product_id: i.product_id, product_name: i.product_name,
          quantity: i.quantity, selling_price: i.selling_price, total: i.total, godown_id: i.godown_id
        }))
      ).then().catch((e) => console.warn(e));

      if (newPayment) {
        supabase.from('customer_payments').insert([{
          id: newPayment.id, receipt_no: newPayment.receipt_no, customer_id: newPayment.customer_id,
          sale_id: newPayment.sale_id, amount: newPayment.amount, payment_mode: newPayment.payment_mode,
          reference_no: newPayment.reference_no, date: newPayment.date, time: newPayment.time,
          notes: newPayment.notes, recorded_by: newPayment.recorded_by
        }]).then().catch((e) => console.warn(e));
      }
    }).catch((e) => console.warn('recordSale error:', e));

    return newSale;
  }

  updateSale(saleId, updatedData, currentUser, reason) {
    const existingSale = this.getSaleById(saleId);
    if (!existingSale) throw new Error('Sale invoice not found');

    const newItems = updatedData.items || existingSale.items;

    // Record audit trail before changes
    const changes = [];
    if (updatedData.items) {
      const oldTotal = existingSale.total_amount;
      const newTotal = newItems.reduce((acc, i) => acc + (Number(i.quantity) || 0) * (Number(i.selling_price) || 0), 0);
      if (oldTotal !== newTotal) changes.push({ field: 'total_amount', oldValue: oldTotal, newValue: newTotal });
    }
    if (updatedData.date && updatedData.date !== existingSale.date) {
      changes.push({ field: 'date', oldValue: existingSale.date, newValue: updatedData.date });
    }
    if (changes.length > 0) {
      this.recordAuditEntry('customer_sales', saleId, existingSale.invoice_no, changes, reason, currentUser?.name || 'Admin');
    }

    // Stock delta per godown
    const oldItemMap = {};
    existingSale.items.forEach((i) => {
      const key = `${i.product_id}::${i.godown_id || 'none'}`;
      oldItemMap[key] = (oldItemMap[key] || 0) + i.quantity;
    });

    const newItemMap = {};
    newItems.forEach((i) => {
      const key = `${i.product_id}::${i.godown_id || 'none'}`;
      newItemMap[key] = (newItemMap[key] || 0) + Number(i.quantity);
    });

    // Validate new quantities against godown stock (delta-based)
    for (const key of Object.keys(newItemMap)) {
      const [prodId, gId] = key.split('::');
      const oldQty = oldItemMap[key] || 0;
      const newQty = newItemMap[key];
      const delta = newQty - oldQty;
      if (delta > 0 && gId && gId !== 'none') {
        const available = this.getProductStockInGodown(prodId, gId);
        if (available < delta) {
          const prod = this.getProductById(prodId);
          const g = this.getGodownById(gId);
          throw new Error(`Insufficient stock in ${g?.name || 'godown'} for ${prod?.name}. Available: ${available}, Additional needed: ${delta}`);
        }
      }
    }

    // Apply delta to godown stock
    const allKeys = new Set([...Object.keys(oldItemMap), ...Object.keys(newItemMap)]);
    for (const key of allKeys) {
      const [prodId, gId] = key.split('::');
      const oldQty = oldItemMap[key] || 0;
      const newQty = newItemMap[key] || 0;
      const delta = newQty - oldQty;
      if (delta !== 0) {
        if (gId && gId !== 'none') {
          this._updateGodownStock(gId, prodId, -delta); // sales = negative
        } else {
          const prod = this.getProductById(prodId);
          if (prod) {
            prod.current_stock = Math.max(0, prod.current_stock - delta);
            supabase.from('products').update({ current_stock: prod.current_stock }).eq('id', prodId).then().catch(console.warn);
          }
        }
      }
    }

    const cleanItems = newItems.map((i, idx) => ({
      id: i.id || `item-${Date.now()}-${idx}`,
      sale_id: saleId,
      product_id: i.product_id,
      product_name: i.product_name || this.getProductById(i.product_id)?.name || 'Product',
      quantity: Number(i.quantity) || 0,
      selling_price: Number(i.selling_price) || 0,
      total: (Number(i.quantity) || 0) * (Number(i.selling_price) || 0),
      godown_id: i.godown_id || null
    }));

    const totalAmount = cleanItems.reduce((acc, i) => acc + i.total, 0);
    const linkedPayments = this.getSalePayments(saleId);
    const paidAmount = linkedPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const pendingAmount = Math.max(0, totalAmount - paidAmount);
    const paymentStatus = pendingAmount === 0 ? 'Paid' : paidAmount > 0 ? 'Partially Paid' : 'Pending';

    const updatedSale = {
      ...existingSale, ...updatedData, items: cleanItems,
      total_amount: totalAmount, paid_amount: paidAmount,
      pending_amount: pendingAmount, payment_status: paymentStatus,
      updated_at: new Date().toISOString()
    };

    this.sales = this.sales.map((s) => (s.id === saleId ? updatedSale : s));
    this.logActivity(currentUser, 'UPDATE', 'Sales', saleId, existingSale.invoice_no,
      `Corrected sale ${existingSale.invoice_no}. Reason: ${reason || 'N/A'}`
    );
    this.notify();

    supabase.from('customer_sales').update({
      total_amount: totalAmount, paid_amount: paidAmount, pending_amount: pendingAmount,
      payment_status: paymentStatus, date: updatedSale.date, time: updatedSale.time, notes: updatedSale.notes
    }).eq('id', saleId).then(async () => {
      await supabase.from('customer_sale_items').delete().eq('sale_id', saleId);
      await supabase.from('customer_sale_items').insert(
        cleanItems.map((i) => ({
          id: i.id, sale_id: saleId, product_id: i.product_id, product_name: i.product_name,
          quantity: i.quantity, selling_price: i.selling_price, total: i.total, godown_id: i.godown_id
        }))
      );
    }).catch((e) => console.warn('updateSale error:', e));

    return updatedSale;
  }

  deleteSale(id, currentUser) {
    if (!this.canDelete(currentUser)) throw new Error('Permission denied.');
    const sale = this.getSaleById(id);
    if (!sale) return;

    // Restore godown stock
    for (const item of sale.items) {
      if (item.godown_id) {
        this._updateGodownStock(item.godown_id, item.product_id, item.quantity);
      } else {
        const prod = this.getProductById(item.product_id);
        if (prod) {
          prod.current_stock += item.quantity;
          supabase.from('products').update({ current_stock: prod.current_stock }).eq('id', item.product_id).then().catch(console.warn);
        }
      }
    }

    this.logActivity(currentUser, 'DELETE', 'Sales', id, sale.invoice_no, `Deleted sale ${sale.invoice_no}`);
    this.sales = this.sales.filter((s) => s.id !== id);
    this.payments = this.payments.filter((p) => p.sale_id !== id);
    this.notify();

    supabase.from('customer_sales').delete().eq('id', id).then().catch(console.warn);
  }

  // ==============================================================================
  // PURCHASES (SUPPLIER INWARD)
  // ==============================================================================
  getPurchases() { return this.purchases; }
  getPurchaseById(id) { return this.purchases.find((p) => p.id === id); }
  getPurchasePayments(purchaseId) { return this.payments.filter((p) => p.purchase_id === purchaseId && p.type === 'supplier_payment'); }

  recordPurchase(purData, currentUser) {
    const purId = 'pur-' + Date.now();
    const purchaseNo = `PUR-${Math.floor(100 + Math.random() * 900)}`;
    const initialPay = Math.max(0, Number(purData.initial_payment) || 0);
    const godownId = purData.godown_id || this.getDefaultGodown()?.id || null;

    const totalAmount = purData.items.reduce((acc, item) =>
      acc + (Number(item.quantity) || 0) * (Number(item.purchase_price) || 0), 0);

    const pendingAmount = Math.max(0, totalAmount - initialPay);
    const paymentStatus = pendingAmount === 0 ? 'Paid' : initialPay > 0 ? 'Partially Paid' : 'Pending';

    const cleanItems = purData.items.map((i, idx) => ({
      id: `pitem-${Date.now()}-${idx}`,
      purchase_id: purId,
      product_id: i.product_id,
      product_name: i.product_name || this.getProductById(i.product_id)?.name || 'Product',
      quantity: Number(i.quantity) || 0,
      purchase_price: Number(i.purchase_price) || 0,
      total: (Number(i.quantity) || 0) * (Number(i.purchase_price) || 0),
      godown_id: godownId
    }));

    const newPur = {
      id: purId,
      purchase_no: purchaseNo,
      supplier_id: purData.supplier_id,
      date: purData.date || getTodayDateString(),
      time: purData.time || getCurrentTimeString(),
      items: cleanItems,
      total_amount: totalAmount,
      paid_amount: initialPay,
      pending_amount: pendingAmount,
      payment_status: paymentStatus,
      notes: purData.notes || '',
      recorded_by: currentUser?.name || 'Admin',
      godown_id: godownId,
      created_at: new Date().toISOString()
    };

    // Increase godown stock per item
    for (const item of cleanItems) {
      this._updateGodownStock(godownId, item.product_id, item.quantity);
    }

    this.purchases = [newPur, ...this.purchases];

    let newPayment = null;
    if (initialPay > 0) {
      newPayment = {
        id: 'pay-' + Date.now(),
        receipt_no: `VOUCH-${Math.floor(100 + Math.random() * 900)}`,
        type: 'supplier_payment',
        supplier_id: purData.supplier_id,
        purchase_id: purId,
        amount: initialPay,
        payment_mode: purData.payment_mode || 'Bank Transfer',
        reference_no: purData.reference_no || '',
        date: purData.date || getTodayDateString(),
        time: purData.time || getCurrentTimeString(),
        notes: `Initial advance payout for ${purchaseNo}`,
        recorded_by: currentUser?.name || 'Admin',
        created_at: new Date().toISOString()
      };
      this.payments = [newPayment, ...this.payments];
    }

    const supp = this.getSupplierById(purData.supplier_id);
    const godown = this.getGodownById(godownId);
    const itemsSummary = cleanItems.map((i) => `${i.product_name}: ${i.quantity} × ₹${i.purchase_price} = ₹${i.total}`).join(' | ');
    this.logActivity(currentUser, 'CREATE', 'Purchases', purId, purchaseNo,
      `Purchase from ${supp?.company_name || 'Supplier'} → ${godown?.name || 'Main Godown'} — ${itemsSummary} — Total: ₹${totalAmount}`
    );

    this.notify();

    supabase.from('supplier_purchases').insert([{
      id: newPur.id, purchase_no: newPur.purchase_no, supplier_id: newPur.supplier_id,
      date: newPur.date, time: newPur.time, total_amount: newPur.total_amount,
      paid_amount: newPur.paid_amount, pending_amount: newPur.pending_amount,
      payment_status: newPur.payment_status, notes: newPur.notes, recorded_by: newPur.recorded_by,
      godown_id: newPur.godown_id
    }]).then(() => {
      supabase.from('supplier_purchase_items').insert(
        cleanItems.map((i) => ({
          id: i.id, purchase_id: i.purchase_id, product_id: i.product_id, product_name: i.product_name,
          quantity: i.quantity, purchase_price: i.purchase_price, total: i.total, godown_id: i.godown_id
        }))
      ).then().catch((e) => console.warn(e));

      if (newPayment) {
        supabase.from('supplier_payments').insert([{
          id: newPayment.id, receipt_no: newPayment.receipt_no, supplier_id: newPayment.supplier_id,
          purchase_id: newPayment.purchase_id, amount: newPayment.amount, payment_mode: newPayment.payment_mode,
          reference_no: newPayment.reference_no, date: newPayment.date, time: newPayment.time,
          notes: newPayment.notes, recorded_by: newPayment.recorded_by
        }]).then().catch((e) => console.warn(e));
      }
    }).catch((e) => console.warn('recordPurchase error:', e));

    return newPur;
  }

  updatePurchase(purId, updatedData, currentUser, reason) {
    const existingPur = this.getPurchaseById(purId);
    if (!existingPur) throw new Error('Purchase record not found');

    const newItems = updatedData.items || existingPur.items;
    const newGodownId = updatedData.godown_id || existingPur.godown_id || this.getDefaultGodown()?.id;

    // Record audit trail before changes
    const changes = [];
    const oldTotal = existingPur.total_amount;
    const newTotal = newItems.reduce((acc, i) => acc + (Number(i.quantity) || 0) * (Number(i.purchase_price) || 0), 0);
    if (oldTotal !== newTotal) changes.push({ field: 'total_amount', oldValue: oldTotal, newValue: newTotal });
    if (updatedData.supplier_id && updatedData.supplier_id !== existingPur.supplier_id) {
      const oldS = this.getSupplierById(existingPur.supplier_id);
      const newS = this.getSupplierById(updatedData.supplier_id);
      changes.push({ field: 'supplier', oldValue: oldS?.company_name, newValue: newS?.company_name });
    }
    if (updatedData.godown_id && updatedData.godown_id !== existingPur.godown_id) {
      const oldG = this.getGodownById(existingPur.godown_id);
      const newG = this.getGodownById(updatedData.godown_id);
      changes.push({ field: 'godown', oldValue: oldG?.name, newValue: newG?.name });
    }
    if (updatedData.date && updatedData.date !== existingPur.date) {
      changes.push({ field: 'date', oldValue: existingPur.date, newValue: updatedData.date });
    }
    if (changes.length > 0) {
      this.recordAuditEntry('supplier_purchases', purId, existingPur.purchase_no, changes, reason, currentUser?.name || 'Admin');
    }

    // Old quantities per product (using old godown)
    const oldItemMap = {};
    existingPur.items.forEach((i) => {
      oldItemMap[i.product_id] = (oldItemMap[i.product_id] || 0) + i.quantity;
    });

    const newItemMap = {};
    newItems.forEach((i) => {
      newItemMap[i.product_id] = (newItemMap[i.product_id] || 0) + Number(i.quantity);
    });

    // Reverse old godown stock
    const oldGodownId = existingPur.godown_id || this.getDefaultGodown()?.id;
    for (const prodId of Object.keys(oldItemMap)) {
      if (oldGodownId) this._updateGodownStock(oldGodownId, prodId, -oldItemMap[prodId]);
    }

    // Apply new godown stock
    for (const prodId of Object.keys(newItemMap)) {
      if (newGodownId) this._updateGodownStock(newGodownId, prodId, newItemMap[prodId]);
    }

    const cleanItems = newItems.map((i, idx) => ({
      id: i.id || `pitem-${Date.now()}-${idx}`,
      purchase_id: purId,
      product_id: i.product_id,
      product_name: i.product_name || this.getProductById(i.product_id)?.name || 'Product',
      quantity: Number(i.quantity) || 0,
      purchase_price: Number(i.purchase_price) || 0,
      total: (Number(i.quantity) || 0) * (Number(i.purchase_price) || 0),
      godown_id: newGodownId
    }));

    const totalAmount = cleanItems.reduce((acc, i) => acc + i.total, 0);
    const linkedPayments = this.getPurchasePayments(purId);
    const paidAmount = linkedPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const pendingAmount = Math.max(0, totalAmount - paidAmount);
    const paymentStatus = pendingAmount === 0 ? 'Paid' : paidAmount > 0 ? 'Partially Paid' : 'Pending';

    const updatedPur = {
      ...existingPur, ...updatedData, items: cleanItems, godown_id: newGodownId,
      total_amount: totalAmount, paid_amount: paidAmount,
      pending_amount: pendingAmount, payment_status: paymentStatus,
      updated_at: new Date().toISOString()
    };

    this.purchases = this.purchases.map((p) => (p.id === purId ? updatedPur : p));
    this.logActivity(currentUser, 'UPDATE', 'Purchases', purId, existingPur.purchase_no,
      `Corrected purchase ${existingPur.purchase_no}. Reason: ${reason || 'N/A'}`
    );
    this.notify();

    supabase.from('supplier_purchases').update({
      total_amount: totalAmount, paid_amount: paidAmount, pending_amount: pendingAmount,
      payment_status: paymentStatus, date: updatedPur.date, time: updatedPur.time,
      notes: updatedPur.notes, godown_id: newGodownId
    }).eq('id', purId).then(async () => {
      await supabase.from('supplier_purchase_items').delete().eq('purchase_id', purId);
      await supabase.from('supplier_purchase_items').insert(
        cleanItems.map((i) => ({
          id: i.id, purchase_id: purId, product_id: i.product_id, product_name: i.product_name,
          quantity: i.quantity, purchase_price: i.purchase_price, total: i.total, godown_id: i.godown_id
        }))
      );
    }).catch((e) => console.warn('updatePurchase error:', e));

    return updatedPur;
  }

  deletePurchase(id, currentUser) {
    if (!this.canDelete(currentUser)) throw new Error('Permission denied.');
    const pur = this.getPurchaseById(id);
    if (!pur) return;

    const godownId = pur.godown_id || this.getDefaultGodown()?.id;
    for (const item of pur.items) {
      if (godownId) this._updateGodownStock(godownId, item.product_id, -item.quantity);
    }

    this.logActivity(currentUser, 'DELETE', 'Purchases', id, pur.purchase_no, `Deleted purchase ${pur.purchase_no}`);
    this.purchases = this.purchases.filter((p) => p.id !== id);
    this.payments = this.payments.filter((p) => p.purchase_id !== id);
    this.notify();

    supabase.from('supplier_purchases').delete().eq('id', id).then().catch(console.warn);
  }

  // ==============================================================================
  // PAYMENTS
  // ==============================================================================
  getPayments() { return this.payments; }
  getPaymentById(id) { return this.payments.find((p) => p.id === id); }

  recordCustomerPayment(payData, currentUser) {
    const payId = 'pay-' + Date.now();
    const receiptNo = `REC-${Math.floor(100 + Math.random() * 900)}`;
    const amt = Number(payData.amount) || 0;

    const newPayment = {
      id: payId, receipt_no: receiptNo, type: 'customer_payment',
      customer_id: payData.customer_id, sale_id: payData.sale_id || null,
      amount: amt, payment_mode: payData.payment_mode || 'Cash',
      reference_no: payData.reference_no || '',
      date: payData.date || getTodayDateString(), time: payData.time || getCurrentTimeString(),
      notes: payData.notes || '', recorded_by: currentUser?.name || 'Admin',
      created_at: new Date().toISOString()
    };

    this.payments = [newPayment, ...this.payments];
    if (newPayment.sale_id) this.syncSalePaymentTotals(newPayment.sale_id);

    const cust = this.getCustomerById(payData.customer_id);
    this.logActivity(currentUser, 'PAYMENT', 'Payments', payId, receiptNo,
      `Customer payment ₹${amt} from ${cust?.name || 'Customer'} via ${payData.payment_mode || 'Cash'}`
    );
    this.notify();

    supabase.from('customer_payments').insert([{
      id: newPayment.id, receipt_no: newPayment.receipt_no, customer_id: newPayment.customer_id,
      sale_id: newPayment.sale_id, amount: newPayment.amount, payment_mode: newPayment.payment_mode,
      reference_no: newPayment.reference_no, date: newPayment.date, time: newPayment.time,
      notes: newPayment.notes, recorded_by: newPayment.recorded_by
    }]).then().catch((e) => console.warn(e));

    return newPayment;
  }

  recordSupplierPayment(payData, currentUser) {
    const payId = 'pay-' + Date.now();
    const receiptNo = `VOUCH-${Math.floor(100 + Math.random() * 900)}`;
    const amt = Number(payData.amount) || 0;

    const newPayment = {
      id: payId, receipt_no: receiptNo, type: 'supplier_payment',
      supplier_id: payData.supplier_id, purchase_id: payData.purchase_id || null,
      amount: amt, payment_mode: payData.payment_mode || 'Bank Transfer',
      reference_no: payData.reference_no || '',
      date: payData.date || getTodayDateString(), time: payData.time || getCurrentTimeString(),
      notes: payData.notes || '', recorded_by: currentUser?.name || 'Admin',
      created_at: new Date().toISOString()
    };

    this.payments = [newPayment, ...this.payments];
    if (newPayment.purchase_id) this.syncPurchasePaymentTotals(newPayment.purchase_id);

    const supp = this.getSupplierById(payData.supplier_id);
    this.logActivity(currentUser, 'PAYMENT', 'Payments', payId, receiptNo,
      `Supplier payment ₹${amt} to ${supp?.company_name || 'Supplier'} via ${payData.payment_mode || 'Bank Transfer'}`
    );
    this.notify();

    supabase.from('supplier_payments').insert([{
      id: newPayment.id, receipt_no: newPayment.receipt_no, supplier_id: newPayment.supplier_id,
      purchase_id: newPayment.purchase_id, amount: newPayment.amount, payment_mode: newPayment.payment_mode,
      reference_no: newPayment.reference_no, date: newPayment.date, time: newPayment.time,
      notes: newPayment.notes, recorded_by: newPayment.recorded_by
    }]).then().catch((e) => console.warn(e));

    return newPayment;
  }

  syncSalePaymentTotals(saleId) {
    const sale = this.getSaleById(saleId);
    if (!sale) return;
    const linked = this.getSalePayments(saleId);
    const totalPaid = linked.reduce((acc, p) => acc + (p.amount || 0), 0);
    const pendingAmount = Math.max(0, sale.total_amount - totalPaid);
    const paymentStatus = pendingAmount === 0 ? 'Paid' : totalPaid > 0 ? 'Partially Paid' : 'Pending';
    sale.paid_amount = totalPaid; sale.pending_amount = pendingAmount; sale.payment_status = paymentStatus;
    try {
      supabase.from('customer_sales').update({ paid_amount: totalPaid, pending_amount: pendingAmount, payment_status: paymentStatus }).eq('id', saleId).then();
    } catch { }
  }

  syncPurchasePaymentTotals(purchaseId) {
    const pur = this.getPurchaseById(purchaseId);
    if (!pur) return;
    const linked = this.getPurchasePayments(purchaseId);
    const totalPaid = linked.reduce((acc, p) => acc + (p.amount || 0), 0);
    const pendingAmount = Math.max(0, pur.total_amount - totalPaid);
    const paymentStatus = pendingAmount === 0 ? 'Paid' : totalPaid > 0 ? 'Partially Paid' : 'Pending';
    pur.paid_amount = totalPaid; pur.pending_amount = pendingAmount; pur.payment_status = paymentStatus;
    try {
      supabase.from('supplier_purchases').update({ paid_amount: totalPaid, pending_amount: pendingAmount, payment_status: paymentStatus }).eq('id', purchaseId).then();
    } catch { }
  }

  deletePayment(id, currentUser) {
    if (!this.canDelete(currentUser)) throw new Error('Permission denied.');
    const payment = this.getPaymentById(id);
    if (!payment) return;
    this.payments = this.payments.filter((p) => p.id !== id);
    if (payment.sale_id) this.syncSalePaymentTotals(payment.sale_id);
    else if (payment.purchase_id) this.syncPurchasePaymentTotals(payment.purchase_id);
    this.logActivity(currentUser, 'DELETE', 'Payments', id, payment.receipt_no, `Deleted payment ${payment.receipt_no}`);
    this.notify();
    if (payment.type === 'customer_payment') {
      supabase.from('customer_payments').delete().eq('id', id).then().catch(console.warn);
    } else {
      supabase.from('supplier_payments').delete().eq('id', id).then().catch(console.warn);
    }
  }

  // ==============================================================================
  // MANUAL STOCK ADJUSTMENTS
  // ==============================================================================
  getAdjustments() { return this.adjustments; }

  recordAdjustment(adjData, currentUser) {
    const prod = this.getProductById(adjData.product_id);
    if (!prod) throw new Error('Product not found for adjustment');
    const qty = Number(adjData.quantity) || 0;
    if (qty <= 0) throw new Error('Quantity must be greater than 0');

    const godownId = adjData.godown_id || this.getDefaultGodown()?.id;

    if (adjData.adjustment_type === 'decrease') {
      const availInGodown = godownId ? this.getProductStockInGodown(adjData.product_id, godownId) : prod.current_stock;
      if (availInGodown < qty) throw new Error(`Cannot decrease by ${qty}. Only ${availInGodown} available.`);
    }

    const newAdj = {
      id: 'adj-' + Date.now(),
      product_id: adjData.product_id,
      adjustment_type: adjData.adjustment_type,
      quantity: qty,
      reason: adjData.reason,
      date: adjData.date || getTodayDateString(),
      time: adjData.time || getCurrentTimeString(),
      recorded_by: currentUser?.name || 'Admin',
      godown_id: godownId,
      created_at: new Date().toISOString()
    };

    // Update godown stock
    if (godownId) {
      this._updateGodownStock(godownId, adjData.product_id, adjData.adjustment_type === 'increase' ? qty : -qty);
    } else {
      if (adjData.adjustment_type === 'increase') {
        prod.current_stock += qty;
      } else {
        prod.current_stock = Math.max(0, prod.current_stock - qty);
      }
    }

    this.adjustments = [newAdj, ...this.adjustments];
    const godown = this.getGodownById(godownId);
    this.logActivity(currentUser, 'ADJUSTMENT', 'Stock', newAdj.id, 'ADJ',
      `${adjData.adjustment_type === 'increase' ? '+' : '-'}${qty} ${prod.unit || 'units'} of ${prod.name} in ${godown?.name || 'Main Godown'}. Reason: ${adjData.reason}`
    );
    this.notify();

    supabase.from('manual_stock_adjustments').insert([newAdj]).then().catch(console.warn);
    return newAdj;
  }

  // ==============================================================================
  // WALLET MANAGEMENT
  // ==============================================================================
  getWalletTransactions(filters = {}) {
    let txns = this.walletTransactions;
    if (filters.type) txns = txns.filter((t) => t.type === filters.type);
    if (filters.fromDate) txns = txns.filter((t) => t.date >= filters.fromDate);
    if (filters.toDate) txns = txns.filter((t) => t.date <= filters.toDate);
    return txns;
  }

  getWalletSummary() {
    const totalBudget = this.walletTransactions
      .filter((t) => t.type === 'budget')
      .reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = this.walletTransactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
    return { totalBudget, totalExpense, balance: Math.max(0, totalBudget - totalExpense) };
  }

  addWalletBudget(data, currentUser) {
    return this._recordWalletTxn({ ...data, type: 'budget' }, currentUser);
  }

  recordWalletExpense(data, currentUser) {
    return this._recordWalletTxn({ ...data, type: 'expense' }, currentUser);
  }

  _recordWalletTxn(data, currentUser) {
    const txnId = 'w-' + Date.now();
    const txnNo = `WLT-${Math.floor(10000 + Math.random() * 90000)}`;
    const newTxn = {
      id: txnId,
      txn_no: txnNo,
      type: data.type,
      category: data.category || (data.type === 'budget' ? 'Fund' : 'Other'),
      reason: data.reason || '',
      amount: Number(data.amount) || 0,
      date: data.date || getTodayDateString(),
      time: data.time || getCurrentTimeString(),
      notes: data.notes || '',
      recorded_by: currentUser?.name || 'Admin',
      created_at: new Date().toISOString()
    };

    this.walletTransactions = [newTxn, ...this.walletTransactions];
    this.logActivity(currentUser, data.type === 'budget' ? 'WALLET_BUDGET' : 'WALLET_EXPENSE', 'Wallet', txnId, txnNo,
      `${data.type === 'budget' ? 'Added budget' : 'Recorded expense'}: ₹${newTxn.amount} — ${newTxn.reason}`
    );
    this.notify();

    supabase.from('wallet_transactions').insert([newTxn]).then().catch(console.warn);
    return newTxn;
  }

  // ==============================================================================
  // CRM USERS (MULTI-USER)
  // ==============================================================================
  getCrmUsers() { return this.crmUsers; }

  saveCrmUser(userData, currentUser) {
    const isNew = !userData.id;
    const userId = userData.id || 'usr-' + Date.now();

    const dbRecord = {
      id: userId,
      name: userData.name,
      email: userData.email || null,
      phone: userData.phone || null,
      password_hash: userData.password ? simpleHash(userData.password) : (this.crmUsers.find((u) => u.id === userId)?.password_hash || ''),
      role: userData.role || 'partial_access',
      is_active: userData.is_active !== false,
      created_by: currentUser?.name || 'Admin',
      updated_at: new Date().toISOString()
    };

    let saved;
    if (isNew) {
      saved = { ...dbRecord, created_at: new Date().toISOString() };
      this.crmUsers = [saved, ...this.crmUsers];
      this.logActivity(currentUser, 'CREATE', 'Users', userId, userData.name,
        `Created staff account: ${userData.name} (${userData.role})`
      );
    } else {
      saved = { ...this.crmUsers.find((u) => u.id === userId), ...dbRecord };
      this.crmUsers = this.crmUsers.map((u) => (u.id === userId ? saved : u));
      this.logActivity(currentUser, 'UPDATE', 'Users', userId, userData.name,
        `Updated staff account: ${userData.name}`
      );
    }
    this.notify();

    if (isNew) {
      supabase.from('crm_users').insert([dbRecord]).then().catch(console.warn);
    } else {
      supabase.from('crm_users').update(dbRecord).eq('id', userId).then().catch(console.warn);
    }
    return saved;
  }

  deactivateCrmUser(id, currentUser) {
    const user = this.crmUsers.find((u) => u.id === id);
    if (!user) return;
    this.crmUsers = this.crmUsers.map((u) => (u.id === id ? { ...u, is_active: false } : u));
    this.logActivity(currentUser, 'DEACTIVATE', 'Users', id, user.name, `Deactivated staff account: ${user.name}`);
    this.notify();
    supabase.from('crm_users').update({ is_active: false }).eq('id', id).then().catch(console.warn);
  }

  deleteCrmUser(id, currentUser) {
    const isOwner = !currentUser || currentUser.role === 'owner' || currentUser.email === 'shivat9640@gmail.com';
    if (!isOwner) {
      throw new Error('Permission denied: Only the Root Administrator can delete staff accounts.');
    }

    const user = this.crmUsers.find((u) => u.id === id);
    if (!user) throw new Error('Staff account not found.');

    this.crmUsers = this.crmUsers.filter((u) => u.id !== id);
    this.logActivity(currentUser, 'DELETE', 'Users', id, user.name, `Permanently deleted staff account: ${user.name} (${user.email || user.phone || 'No contact'})`);
    this.notify();

    if (isSupabaseConfigured) {
      supabase.from('crm_users').delete().eq('id', id).then().catch((e) => console.warn('deleteCrmUser error:', e));
    }
  }

  authenticateUser(identifier, password) {
    // Check hardcoded admin first
    const normalizeText = (str) => (str || '').toLowerCase().replace(/\s+/g, '').trim();
    const cleanId = normalizeText(identifier).replace(/^\+91/, '');
    const validEmails = ['shivat9640@gmail.com'];
    const validPhones = ['9640912521'];
    const validPasswords = ['96409 12521', '9640912521'];

    const isEmailMatch = validEmails.some((e) => normalizeText(e) === cleanId);
    const isPhoneMatch = validPhones.some((p) => normalizeText(p) === cleanId);
    const isPasswordMatch = validPasswords.some((pwd) => normalizeText(pwd) === normalizeText(password));

    if ((isEmailMatch || isPhoneMatch) && isPasswordMatch) {
      return {
        email: 'shivat9640@gmail.com',
        phone: '96409 12521',
        name: 'Shiva',
        role: 'owner',
        loginTime: new Date().toISOString()
      };
    }

    // Check CRM users table
    const hash = simpleHash(password);
    const user = this.crmUsers.find((u) => {
      if (!u.is_active) return false;
      const matchId = (u.email && normalizeText(u.email) === cleanId) ||
        (u.phone && normalizeText(u.phone) === cleanId);
      return matchId && u.password_hash === hash;
    });

    if (user) {
      // Update last login
      this.crmUsers = this.crmUsers.map((u) => u.id === user.id ? { ...u, last_login_at: new Date().toISOString() } : u);
      supabase.from('crm_users').update({ last_login_at: new Date().toISOString() }).eq('id', user.id).then().catch(console.warn);

      return {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
        loginTime: new Date().toISOString()
      };
    }

    return null;
  }

  // ==============================================================================
  // LEDGER (ENHANCED WITH ITEM DETAIL)
  // ==============================================================================
  getCustomerLedger(customerId) {
    const custSales = this.sales.filter((s) => s.customer_id === customerId);
    const custPayments = this.payments.filter((p) => p.customer_id === customerId && p.type === 'customer_payment');

    const totalSales = custSales.reduce((acc, s) => acc + (s.total_amount || 0), 0);
    const totalPaid = custPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const pendingBalance = Math.max(0, totalSales - totalPaid);

    const entries = [];

    custSales.forEach((s) => {
      const itemsDetail = s.items.map((i) => {
        const g = this.getGodownById(i.godown_id);
        return {
          product_name: i.product_name,
          quantity: i.quantity,
          selling_price: i.selling_price,
          total: i.total,
          godown: g ? g.name : null
        };
      });
      const summary = itemsDetail.map((i) => `${i.product_name}: ${i.quantity} × ₹${i.selling_price} = ₹${i.total}`).join(', ');
      entries.push({
        id: s.id, date: s.date, time: s.time, type: 'SALE',
        reference: s.invoice_no, particulars: `Sales Invoice — ${summary}`,
        items_detail: itemsDetail, debit: s.total_amount, credit: 0
      });
    });

    custPayments.forEach((p) => {
      const linkedSale = p.sale_id ? this.getSaleById(p.sale_id) : null;
      const refDetail = linkedSale ? `for ${linkedSale.invoice_no}` : (p.reference_no ? `Ref: ${p.reference_no}` : '');
      entries.push({
        id: p.id, date: p.date, time: p.time, type: 'PAYMENT',
        reference: p.receipt_no, particulars: `Payment Received (${p.payment_mode}) ${refDetail}`,
        items_detail: [], debit: 0, credit: p.amount
      });
    });

    entries.sort((a, b) => new Date(`${a.date}T${a.time || '00:00'}`) - new Date(`${b.date}T${b.time || '00:00'}`));

    let running = 0;
    const computedEntries = entries.map((entry) => {
      running = running + (entry.debit || 0) - (entry.credit || 0);
      return { ...entry, balance: Math.max(0, running) };
    });

    return { totalSales, totalPaid, pendingBalance, entries: computedEntries };
  }

  getSupplierLedger(supplierId) {
    const suppPurchases = this.purchases.filter((p) => p.supplier_id === supplierId);
    const suppPayments = this.payments.filter((p) => p.supplier_id === supplierId && p.type === 'supplier_payment');

    const totalPurchases = suppPurchases.reduce((acc, p) => acc + (p.total_amount || 0), 0);
    const totalPaid = suppPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const pendingBalance = Math.max(0, totalPurchases - totalPaid);

    const entries = [];

    suppPurchases.forEach((p) => {
      const godown = this.getGodownById(p.godown_id);
      const itemsDetail = p.items.map((i) => ({
        product_name: i.product_name,
        quantity: i.quantity,
        purchase_price: i.purchase_price,
        total: i.total,
        godown: godown ? godown.name : null
      }));
      const summary = itemsDetail.map((i) => `${i.product_name}: ${i.quantity} × ₹${i.purchase_price} = ₹${i.total}`).join(', ');
      entries.push({
        id: p.id, date: p.date, time: p.time, type: 'PURCHASE',
        reference: p.purchase_no, particulars: `Inward Purchase — ${summary}`,
        items_detail: itemsDetail, godown: godown?.name, credit: p.total_amount, debit: 0
      });
    });

    suppPayments.forEach((p) => {
      const linkedPur = p.purchase_id ? this.getPurchaseById(p.purchase_id) : null;
      const refDetail = linkedPur ? `for ${linkedPur.purchase_no}` : (p.reference_no ? `Ref: ${p.reference_no}` : '');
      entries.push({
        id: p.id, date: p.date, time: p.time, type: 'PAYMENT',
        reference: p.receipt_no, particulars: `Payment Made (${p.payment_mode}) ${refDetail}`,
        items_detail: [], credit: 0, debit: p.amount
      });
    });

    entries.sort((a, b) => new Date(`${a.date}T${a.time || '00:00'}`) - new Date(`${b.date}T${b.time || '00:00'}`));

    let running = 0;
    const computedEntries = entries.map((entry) => {
      running = running + (entry.credit || 0) - (entry.debit || 0);
      return { ...entry, balance: Math.max(0, running) };
    });

    return { totalPurchases, totalPaid, pendingBalance, entries: computedEntries };
  }

  // ==============================================================================
  // DAY BOOK (ENHANCED WITH qty × price = total FORMAT)
  // ==============================================================================
  getDayBook(filterDate = getTodayDateString()) {
    const daySales = this.sales.filter((s) => s.date === filterDate);
    const dayPurchases = this.purchases.filter((p) => p.date === filterDate);
    const dayPayments = this.payments.filter((p) => p.date === filterDate);
    const dayAdjustments = this.adjustments.filter((a) => a.date === filterDate);
    const dayTransfers = this.stockTransfers.filter((t) => t.date === filterDate);

    const events = [];
    let totalSalesAmount = 0, totalPurchasesAmount = 0, cashInflow = 0, cashOutflow = 0;

    daySales.forEach((s) => {
      totalSalesAmount += s.total_amount || 0;
      const cust = this.getCustomerById(s.customer_id);
      const itemLines = s.items.map((i) => {
        const g = this.getGodownById(i.godown_id);
        return `${i.product_name}: ${i.quantity} × ₹${Number(i.selling_price).toLocaleString('en-IN')} = ₹${Number(i.total).toLocaleString('en-IN')}${g ? ` [${g.name}]` : ''}`;
      });
      events.push({
        id: s.id, time: s.time, type: 'Customer Sale', badgeClass: 'badge-active',
        party: cust ? cust.name : 'Customer',
        details: itemLines.join('\n'),
        items_detail: s.items,
        amount: s.total_amount, amountType: 'neutral',
        reference: s.invoice_no, status: s.payment_status
      });
    });

    dayPurchases.forEach((p) => {
      totalPurchasesAmount += p.total_amount || 0;
      const supp = this.getSupplierById(p.supplier_id);
      const godown = this.getGodownById(p.godown_id);
      const itemLines = p.items.map((i) =>
        `${i.product_name}: ${i.quantity} × ₹${Number(i.purchase_price).toLocaleString('en-IN')} = ₹${Number(i.total).toLocaleString('en-IN')}`
      );
      events.push({
        id: p.id, time: p.time, type: 'Supplier Purchase', badgeClass: 'badge-warning',
        party: supp ? supp.company_name : 'Supplier',
        details: itemLines.join('\n'),
        items_detail: p.items,
        godown: godown?.name,
        amount: p.total_amount, amountType: 'neutral',
        reference: p.purchase_no, status: p.payment_status
      });
    });

    dayPayments.forEach((pay) => {
      if (pay.type === 'customer_payment') {
        cashInflow += pay.amount || 0;
        const cust = this.getCustomerById(pay.customer_id);
        events.push({
          id: pay.id, time: pay.time, type: 'Customer Payment Inward', badgeClass: 'badge-paid',
          party: cust ? cust.name : 'Customer',
          details: `Via ${pay.payment_mode}${pay.notes ? ` — ${pay.notes}` : ''}`,
          amount: pay.amount, amountType: 'inflow',
          reference: pay.receipt_no, status: 'Settled'
        });
      } else {
        cashOutflow += pay.amount || 0;
        const supp = this.getSupplierById(pay.supplier_id);
        events.push({
          id: pay.id, time: pay.time, type: 'Supplier Payment Outward', badgeClass: 'badge-danger',
          party: supp ? supp.company_name : 'Supplier',
          details: `Via ${pay.payment_mode}${pay.notes ? ` — ${pay.notes}` : ''}`,
          amount: pay.amount, amountType: 'outflow',
          reference: pay.receipt_no, status: 'Settled'
        });
      }
    });

    dayAdjustments.forEach((adj) => {
      const prod = this.getProductById(adj.product_id);
      const godown = this.getGodownById(adj.godown_id);
      events.push({
        id: adj.id, time: adj.time,
        type: `Stock ${adj.adjustment_type === 'increase' ? 'Addition' : 'Reduction'}`,
        badgeClass: 'badge-neutral',
        party: prod ? prod.name : 'Product',
        details: `${adj.adjustment_type.toUpperCase()}: ${adj.quantity} ${prod?.unit || 'units'}${godown ? ` in ${godown.name}` : ''} — ${adj.reason}`,
        amount: null, amountType: 'none', reference: 'ADJ', status: 'Audit Log'
      });
    });

    dayTransfers.forEach((t) => {
      const prod = this.getProductById(t.product_id);
      const fromG = this.getGodownById(t.from_godown_id);
      const toG = this.getGodownById(t.to_godown_id);
      events.push({
        id: t.id, time: t.time, type: 'Stock Transfer', badgeClass: 'badge-info',
        party: prod ? prod.name : 'Product',
        details: `${t.quantity} ${prod?.unit || 'units'} from ${fromG?.name || '?'} → ${toG?.name || '?'}${t.reason ? ` — ${t.reason}` : ''}`,
        amount: null, amountType: 'none', reference: t.transfer_no, status: 'Completed'
      });
    });

    events.sort((a, b) => (b.time || '').localeCompare(a.time || ''));

    return {
      date: filterDate, totalSalesAmount, totalPurchasesAmount, cashInflow, cashOutflow,
      netCashMovement: cashInflow - cashOutflow, events, transactions: events
    };
  }

  getDailyTransactions(filterDate) { return this.getDayBook(filterDate); }
  getProfitReport() { return this.getRevenueProfitReport(); }

  getRevenueProfitReport() {
    let totalRevenue = 0, totalEstimatedCost = 0, totalUnitsSold = 0;
    const productSalesMap = {}, customerSalesMap = {};

    this.sales.forEach((sale) => {
      totalRevenue += sale.total_amount || 0;
      const cust = this.getCustomerById(sale.customer_id);
      const custKey = sale.customer_id;
      if (!customerSalesMap[custKey]) {
        customerSalesMap[custKey] = { name: cust ? cust.name : 'Unknown Customer', totalRevenue: 0, invoicesCount: 0 };
      }
      customerSalesMap[custKey].totalRevenue += sale.total_amount || 0;
      customerSalesMap[custKey].invoicesCount += 1;

      sale.items.forEach((item) => {
        totalUnitsSold += item.quantity || 0;
        const prod = this.getProductById(item.product_id);
        const purchaseCost = prod ? prod.purchase_price : 0;
        const costOfGoods = (item.quantity || 0) * purchaseCost;
        totalEstimatedCost += costOfGoods;
        const prodKey = item.product_id;
        if (!productSalesMap[prodKey]) {
          productSalesMap[prodKey] = { name: item.product_name, quantity: 0, revenue: 0, cost: 0 };
        }
        productSalesMap[prodKey].quantity += item.quantity || 0;
        productSalesMap[prodKey].revenue += item.total || 0;
        productSalesMap[prodKey].cost += costOfGoods;
      });
    });

    const grossProfit = totalRevenue - totalEstimatedCost;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const totalCustomerPaymentsReceived = this.payments.filter((p) => p.type === 'customer_payment').reduce((acc, p) => acc + (p.amount || 0), 0);
    const pendingCustomerReceivables = Math.max(0, totalRevenue - totalCustomerPaymentsReceived);
    const totalPurchasesAmount = this.purchases.reduce((acc, p) => acc + (p.total_amount || 0), 0);
    const totalSupplierPaymentsMade = this.payments.filter((p) => p.type === 'supplier_payment').reduce((acc, p) => acc + (p.amount || 0), 0);
    const pendingSupplierPayables = Math.max(0, totalPurchasesAmount - totalSupplierPaymentsMade);

    return {
      totalRevenue, totalEstimatedCost, grossProfit, profitMargin: profitMargin.toFixed(1),
      totalUnitsSold, totalCustomerPaymentsReceived, pendingCustomerReceivables,
      totalPurchasesAmount, totalSupplierPaymentsMade, pendingSupplierPayables,
      productSales: Object.values(productSalesMap).sort((a, b) => b.revenue - a.revenue),
      customerSales: Object.values(customerSalesMap).sort((a, b) => b.totalRevenue - a.totalRevenue)
    };
  }

  // Seed initial data to Supabase
  async seedInitialDataToSupabase() {
    try {
      const cleanProducts = initialProducts.map((p) => ({
        id: p.id, sku: p.sku, name: p.name, current_stock: p.current_stock, unit: p.unit,
        purchase_price: p.purchase_price, selling_price: p.selling_price,
        min_stock_alert: p.low_stock_threshold || 20, image_url: p.image_url || null,
        is_active: p.is_active !== undefined ? p.is_active : true, description: p.description || null
      }));
      await supabase.from('products').upsert(cleanProducts);

      const cleanCustomers = initialCustomers.map((c) => ({
        id: c.id, customer_id: c.customer_id, name: c.name, mobile: c.mobile,
        area: c.area, address: c.address || null, status: c.status || 'active', notes: c.notes || null
      }));
      await supabase.from('customers').upsert(cleanCustomers);

      const cleanSuppliers = initialSuppliers.map((s) => ({
        id: s.id, supplier_id: s.supplier_id, company_name: s.company_name, supplier_name: s.supplier_name,
        mobile: s.mobile, area: s.area, address: s.address || null, notes: s.notes || null
      }));
      await supabase.from('suppliers').upsert(cleanSuppliers);

      await this.fetchAll();
    } catch (e) {
      console.warn('Seed error:', e);
    }
  }

  resetToInitialData() {
    this.products = JSON.parse(JSON.stringify(initialProducts));
    this.customers = JSON.parse(JSON.stringify(initialCustomers));
    this.suppliers = JSON.parse(JSON.stringify(initialSuppliers));
    this.sales = JSON.parse(JSON.stringify(initialSales));
    this.purchases = JSON.parse(JSON.stringify(initialPurchases));
    this.payments = JSON.parse(JSON.stringify(initialPayments));
    this.adjustments = JSON.parse(JSON.stringify(initialAdjustments));
    this._ensureDefaultGodownDemo();
    this.notify();
  }

  resetToDemo() { this.resetToInitialData(); }
}

export const dataService = new DataService();
