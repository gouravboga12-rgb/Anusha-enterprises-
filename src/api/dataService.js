// Centralized Live Supabase Data Engine & Business Logic for Anusha Enterprises CRM
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

class DataService {
  constructor() {
    // Initialize in-memory records so UI is immediately fully interactive and never blank
    this.products = JSON.parse(JSON.stringify(initialProducts));
    this.customers = JSON.parse(JSON.stringify(initialCustomers));
    this.suppliers = JSON.parse(JSON.stringify(initialSuppliers));
    this.sales = JSON.parse(JSON.stringify(initialSales));
    this.purchases = JSON.parse(JSON.stringify(initialPurchases));
    this.payments = JSON.parse(JSON.stringify(initialPayments));
    this.adjustments = JSON.parse(JSON.stringify(initialAdjustments));

    this.isLiveConnected = false;
    this.isLoading = false;
    this.connectionError = null;
    this.listeners = new Set();
    this.realtimeChannel = null;

    // Automatically initialize on startup
    this.init();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach((fn) => fn());
  }

  /**
   * Initializes data from live Supabase tables and establishes realtime listeners
   */
  async init() {
    try {
      if (!isSupabaseConfigured) {
        this.isLiveConnected = false;
        this.connectionError = 'Configure Supabase environment variables in Vercel settings';
        this.notify();
        return;
      }

      this.isLoading = true;
      this.notify();

      await this.fetchAll();
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

  /**
   * Fetches all records from Supabase tables
   */
  async fetchAll() {
    try {
      // 1. Fetch Products
      const { data: prods, error: pErr } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (pErr) throw pErr;

      // 2. Fetch Customers
      const { data: custs, error: cErr } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
      if (cErr) throw cErr;

      // 3. Fetch Suppliers
      const { data: supps, error: sErr } = await supabase.from('suppliers').select('*').order('created_at', { ascending: false });
      if (sErr) throw sErr;

      // 4. Fetch Sales with line items
      const { data: salesData, error: saleErr } = await supabase
        .from('customer_sales')
        .select('*, items:customer_sale_items(*)')
        .order('date', { ascending: false });
      if (saleErr) throw saleErr;

      // 5. Fetch Purchases with line items
      const { data: purData, error: purErr } = await supabase
        .from('supplier_purchases')
        .select('*, items:supplier_purchase_items(*)')
        .order('date', { ascending: false });
      if (purErr) throw purErr;

      // 6. Fetch Customer Payments
      const { data: custPayments, error: cpErr } = await supabase
        .from('customer_payments')
        .select('*')
        .order('created_at', { ascending: false });
      if (cpErr) throw cpErr;

      // 7. Fetch Supplier Payments
      const { data: suppPayments, error: spErr } = await supabase
        .from('supplier_payments')
        .select('*')
        .order('created_at', { ascending: false });
      if (spErr) throw spErr;

      // 8. Fetch Adjustments
      const { data: adjs, error: adjErr } = await supabase
        .from('manual_stock_adjustments')
        .select('*')
        .order('created_at', { ascending: false });
      if (adjErr) throw adjErr;

      // Normalize format to match CRM UI
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

      const unifiedCustomerPayments = (custPayments || []).map((p) => ({
        ...p,
        type: 'customer_payment',
        amount: Number(p.amount) || 0
      }));

      const unifiedSupplierPayments = (suppPayments || []).map((p) => ({
        ...p,
        type: 'supplier_payment',
        amount: Number(p.amount) || 0
      }));

      this.payments = [...unifiedCustomerPayments, ...unifiedSupplierPayments].sort((a, b) => {
        return new Date(b.created_at || b.date) - new Date(a.created_at || a.date);
      });

      this.adjustments = (adjs || []).map((a) => ({
        ...a,
        quantity: Number(a.quantity) || 0
      }));

      // If database is completely brand-new and empty, seed initial data to Supabase
      if (this.products.length === 0 && this.customers.length === 0) {
        await this.seedInitialDataToSupabase();
      }

      this.isLiveConnected = true;
      this.connectionError = null;
      this.notify();
    } catch (err) {
      throw err;
    }
  }

  /**
   * Seeds clean starter catalog directly into live Supabase
   */
  async seedInitialDataToSupabase() {
    try {
      console.log('Seeding initial business records to Supabase...');

      // Seed Products
      const cleanProducts = initialProducts.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        current_stock: p.current_stock,
        unit: p.unit,
        purchase_price: p.purchase_price,
        selling_price: p.selling_price,
        min_stock_alert: p.low_stock_threshold || 20,
        image_url: p.image_url || null,
        is_active: p.is_active !== undefined ? p.is_active : true,
        description: p.description || null
      }));
      await supabase.from('products').upsert(cleanProducts);

      // Seed Customers
      const cleanCustomers = initialCustomers.map((c) => ({
        id: c.id,
        customer_id: c.customer_id,
        name: c.name,
        mobile: c.mobile,
        area: c.area,
        address: c.address || null,
        status: c.status || 'active',
        notes: c.notes || null
      }));
      await supabase.from('customers').upsert(cleanCustomers);

      // Seed Suppliers
      const cleanSuppliers = initialSuppliers.map((s) => ({
        id: s.id,
        supplier_id: s.supplier_id,
        company_name: s.company_name,
        supplier_name: s.supplier_name,
        mobile: s.mobile,
        area: s.area,
        address: s.address || null,
        notes: s.notes || null
      }));
      await supabase.from('suppliers').upsert(cleanSuppliers);

      // Re-fetch now that seed data is inserted
      await this.fetchAll();
    } catch (e) {
      console.warn('Seed error (tables may need schema creation):', e);
    }
  }

  /**
   * Establishes real-time subscriptions for multi-device sync
   */
  setupRealtimeSubscription() {
    if (!isSupabaseConfigured) return;
    try {
      if (this.realtimeChannel) {
        supabase.removeChannel(this.realtimeChannel);
      }

      this.realtimeChannel = supabase
        .channel('anusha-crm-live')
        .on('postgres_changes', { event: '*', schema: 'public' }, () => {
          // Silently sync state from live database when another tab/user updates
          this.fetchAll().catch((e) => console.warn('Realtime refresh error:', e));
        })
        .subscribe();
    } catch (e) {
      console.warn('Realtime subscription error:', e);
    }
  }

  // --- PRODUCTS ---
  getProducts() {
    return this.products;
  }

  getProductById(id) {
    return this.products.find((p) => p.id === id);
  }

  saveProduct(productData) {
    const isNew = !productData.id;
    const prodId = productData.id || 'prod-' + Date.now();

    const dbRecord = {
      id: prodId,
      sku: productData.sku || `SKU-${Math.floor(100 + Math.random() * 900)}`,
      name: productData.name,
      current_stock: productData.current_stock !== undefined && productData.current_stock !== ''
        ? Number(productData.current_stock)
        : 0,
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
    } else {
      saved = { ...this.getProductById(prodId), ...dbRecord };
      this.products = this.products.map((p) => (p.id === prodId ? saved : p));
    }
    this.notify();

    // Async write to Supabase
    if (isNew) {
      supabase.from('products').insert([dbRecord]).then().catch((e) => console.warn('Live saveProduct error:', e));
    } else {
      supabase.from('products').update(dbRecord).eq('id', prodId).then().catch((e) => console.warn('Live saveProduct error:', e));
    }

    return saved;
  }

  async deleteProduct(id) {
    this.products = this.products.filter((p) => p.id !== id);
    this.notify();

    if (!isSupabaseConfigured) return;

    try {
      // Attempt clean deletion from Supabase
      const { error: delErr } = await supabase.from('products').delete().eq('id', id);

      // If foreign key constraint prevents deletion (product was used in past sales/purchases):
      if (delErr && delErr.code === '23503') {
        console.warn('Product has historical transactions; soft-deleting by setting is_active = false');
        await supabase.from('products').update({ is_active: false }).eq('id', id);
      } else if (delErr) {
        console.warn('Live deleteProduct error:', delErr);
      }
    } catch (e) {
      console.warn('Live deleteProduct exception:', e);
    }
  }

  toggleProductActive(id) {
    const prod = this.getProductById(id);
    if (!prod) return;
    const newStatus = !prod.is_active;

    this.products = this.products.map((p) => (p.id === id ? { ...p, is_active: newStatus } : p));
    this.notify();

    supabase.from('products').update({ is_active: newStatus }).eq('id', id).then().catch((e) => console.warn('Live toggleProductActive error:', e));
  }

  // --- CUSTOMERS ---
  getCustomers() {
    return this.customers;
  }

  getCustomerById(id) {
    return this.customers.find((c) => c.id === id);
  }

  saveCustomer(custData) {
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
    } else {
      saved = { ...this.getCustomerById(custId), ...dbRecord };
      this.customers = this.customers.map((c) => (c.id === custId ? saved : c));
    }
    this.notify();

    if (isNew) {
      supabase.from('customers').insert([dbRecord]).then().catch((e) => console.warn('Live saveCustomer error:', e));
    } else {
      supabase.from('customers').update(dbRecord).eq('id', custId).then().catch((e) => console.warn('Live saveCustomer error:', e));
    }

    return saved;
  }

  deleteCustomer(id) {
    this.customers = this.customers.filter((c) => c.id !== id);
    this.sales = this.sales.filter((s) => s.customer_id !== id);
    this.payments = this.payments.filter((p) => p.customer_id !== id);
    this.notify();

    supabase.from('customers').delete().eq('id', id).then().catch((e) => console.warn('Live deleteCustomer error:', e));
  }

  // --- SUPPLIERS ---
  getSuppliers() {
    return this.suppliers;
  }

  getSupplierById(id) {
    return this.suppliers.find((s) => s.id === id);
  }

  saveSupplier(suppData) {
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
    } else {
      saved = { ...this.getSupplierById(suppId), ...dbRecord };
      this.suppliers = this.suppliers.map((s) => (s.id === suppId ? saved : s));
    }
    this.notify();

    if (isNew) {
      supabase.from('suppliers').insert([dbRecord]).then().catch((e) => console.warn('Live saveSupplier error:', e));
    } else {
      supabase.from('suppliers').update(dbRecord).eq('id', suppId).then().catch((e) => console.warn('Live saveSupplier error:', e));
    }

    return saved;
  }

  deleteSupplier(id) {
    this.suppliers = this.suppliers.filter((s) => s.id !== id);
    this.purchases = this.purchases.filter((p) => p.supplier_id !== id);
    this.payments = this.payments.filter((p) => p.supplier_id !== id);
    this.notify();

    supabase.from('suppliers').delete().eq('id', id).then().catch((e) => console.warn('Live deleteSupplier error:', e));
  }

  // --- SALES (CUSTOMER BILLING) ---
  getSales() {
    return this.sales;
  }

  getSaleById(id) {
    return this.sales.find((s) => s.id === id);
  }

  getSalePayments(saleId) {
    return this.payments.filter((p) => p.sale_id === saleId && p.type === 'customer_payment');
  }

  recordSale(saleData) {
    // 1. STRICT STOCK VALIDATION: Block if requested quantity > current stock
    for (const item of saleData.items) {
      const prod = this.getProductById(item.product_id);
      const reqQty = Number(item.quantity) || 0;
      if (!prod) {
        throw new Error(`Product not found: ${item.product_name || item.product_id}`);
      }
      if (reqQty > prod.current_stock) {
        throw new Error(
          `Cannot complete sale: requested ${reqQty} ${prod.unit || 'units'} of "${prod.name}", but only ${prod.current_stock} ${prod.unit || 'units'} are available in stock.`
        );
      }
    }

    const saleId = 'sale-' + Date.now();
    const invoiceNo = `INV-${Math.floor(100 + Math.random() * 900)}`;
    const initialPay = Math.max(0, Number(saleData.initial_payment) || 0);

    const totalAmount = saleData.items.reduce((acc, item) => {
      return acc + (Number(item.quantity) || 0) * (Number(item.selling_price) || 0);
    }, 0);

    const pendingAmount = Math.max(0, totalAmount - initialPay);
    const paymentStatus = pendingAmount === 0 ? 'Paid' : initialPay > 0 ? 'Partially Paid' : 'Pending';

    const cleanItems = saleData.items.map((i, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      sale_id: saleId,
      product_id: i.product_id,
      product_name: i.product_name || this.getProductById(i.product_id)?.name || 'Product',
      quantity: Number(i.quantity) || 0,
      selling_price: Number(i.selling_price) || 0,
      total: (Number(i.quantity) || 0) * (Number(i.selling_price) || 0)
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
      recorded_by: 'Admin',
      created_at: new Date().toISOString()
    };

    // Deduct stock in memory
    for (const item of cleanItems) {
      const prod = this.getProductById(item.product_id);
      if (prod) {
        prod.current_stock = Math.max(0, prod.current_stock - item.quantity);
      }
    }

    this.sales = [newSale, ...this.sales];

    // Record initial payment as independent voucher
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
        recorded_by: 'Admin',
        created_at: new Date().toISOString()
      };
      this.payments = [newPayment, ...this.payments];
    }

    this.notify();

    // Background write to Supabase
    supabase.from('customer_sales').insert([{
      id: newSale.id,
      invoice_no: newSale.invoice_no,
      customer_id: newSale.customer_id,
      date: newSale.date,
      time: newSale.time,
      total_amount: newSale.total_amount,
      paid_amount: newSale.paid_amount,
      pending_amount: newSale.pending_amount,
      payment_status: newSale.payment_status,
      notes: newSale.notes,
      recorded_by: newSale.recorded_by
    }]).then(() => {
      supabase.from('customer_sale_items').insert(
        cleanItems.map((i) => ({
          id: i.id,
          sale_id: i.sale_id,
          product_id: i.product_id,
          product_name: i.product_name,
          quantity: i.quantity,
          selling_price: i.selling_price,
          total: i.total
        }))
      ).then().catch((e) => console.warn(e));

      for (const item of cleanItems) {
        const prod = this.getProductById(item.product_id);
        if (prod) {
          supabase.from('products').update({ current_stock: prod.current_stock }).eq('id', item.product_id).then().catch((e) => console.warn(e));
        }
      }

      if (newPayment) {
        supabase.from('customer_payments').insert([{
          id: newPayment.id,
          receipt_no: newPayment.receipt_no,
          customer_id: newPayment.customer_id,
          sale_id: newPayment.sale_id,
          amount: newPayment.amount,
          payment_mode: newPayment.payment_mode,
          reference_no: newPayment.reference_no,
          date: newPayment.date,
          time: newPayment.time,
          notes: newPayment.notes,
          recorded_by: newPayment.recorded_by
        }]).then().catch((e) => console.warn(e));
      }
    }).catch((e) => console.warn('Live recordSale error:', e));

    return newSale;
  }

  updateSale(saleId, updatedData) {
    const existingSale = this.getSaleById(saleId);
    if (!existingSale) throw new Error('Sale invoice not found');

    const newItems = updatedData.items || existingSale.items;

    // Validate stock delta
    const oldItemMap = {};
    existingSale.items.forEach((i) => {
      oldItemMap[i.product_id] = (oldItemMap[i.product_id] || 0) + i.quantity;
    });

    const newItemMap = {};
    newItems.forEach((i) => {
      newItemMap[i.product_id] = (newItemMap[i.product_id] || 0) + Number(i.quantity);
    });

    for (const prodId of Object.keys(newItemMap)) {
      const oldQty = oldItemMap[prodId] || 0;
      const newQty = newItemMap[prodId];
      const delta = newQty - oldQty;
      if (delta > 0) {
        const prod = this.getProductById(prodId);
        if (!prod || prod.current_stock < delta) {
          throw new Error(`Insufficient stock for ${prod?.name || prodId}. Needed additional: ${delta}, Available: ${prod?.current_stock || 0}`);
        }
      }
    }

    // Adjust stock by delta
    const allProdIds = new Set([...Object.keys(oldItemMap), ...Object.keys(newItemMap)]);
    for (const prodId of allProdIds) {
      const oldQty = oldItemMap[prodId] || 0;
      const newQty = newItemMap[prodId] || 0;
      const delta = newQty - oldQty;
      const prod = this.getProductById(prodId);
      if (prod && delta !== 0) {
        prod.current_stock = Math.max(0, prod.current_stock - delta);
        supabase.from('products').update({ current_stock: prod.current_stock }).eq('id', prodId).then().catch((e) => console.warn(e));
      }
    }

    const cleanItems = newItems.map((i, idx) => ({
      id: i.id || `item-${Date.now()}-${idx}`,
      sale_id: saleId,
      product_id: i.product_id,
      product_name: i.product_name || this.getProductById(i.product_id)?.name || 'Product',
      quantity: Number(i.quantity) || 0,
      selling_price: Number(i.selling_price) || 0,
      total: (Number(i.quantity) || 0) * (Number(i.selling_price) || 0)
    }));

    const totalAmount = cleanItems.reduce((acc, i) => acc + i.total, 0);
    const linkedPayments = this.getSalePayments(saleId);
    const paidAmount = linkedPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const pendingAmount = Math.max(0, totalAmount - paidAmount);
    const paymentStatus = pendingAmount === 0 ? 'Paid' : paidAmount > 0 ? 'Partially Paid' : 'Pending';

    const updatedSale = {
      ...existingSale,
      ...updatedData,
      items: cleanItems,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      pending_amount: pendingAmount,
      payment_status: paymentStatus,
      updated_at: new Date().toISOString()
    };

    this.sales = this.sales.map((s) => (s.id === saleId ? updatedSale : s));
    this.notify();

    // Background write to Supabase
    supabase.from('customer_sales').update({
      total_amount: totalAmount,
      paid_amount: paidAmount,
      pending_amount: pendingAmount,
      payment_status: paymentStatus,
      date: updatedSale.date,
      time: updatedSale.time,
      notes: updatedSale.notes
    }).eq('id', saleId).then(async () => {
      await supabase.from('customer_sale_items').delete().eq('sale_id', saleId);
      await supabase.from('customer_sale_items').insert(
        cleanItems.map((i) => ({
          id: i.id,
          sale_id: saleId,
          product_id: i.product_id,
          product_name: i.product_name,
          quantity: i.quantity,
          selling_price: i.selling_price,
          total: i.total
        }))
      );
    }).catch((e) => console.warn('Live updateSale error:', e));

    return updatedSale;
  }

  deleteSale(id) {
    const sale = this.getSaleById(id);
    if (!sale) return;

    // Restore stock
    for (const item of sale.items) {
      const prod = this.getProductById(item.product_id);
      if (prod) {
        prod.current_stock += item.quantity;
        supabase.from('products').update({ current_stock: prod.current_stock }).eq('id', item.product_id).then().catch((e) => console.warn(e));
      }
    }

    this.sales = this.sales.filter((s) => s.id !== id);
    this.payments = this.payments.filter((p) => p.sale_id !== id);
    this.notify();

    supabase.from('customer_sales').delete().eq('id', id).then().catch((e) => console.warn('Live deleteSale error:', e));
  }

  // --- PURCHASES (SUPPLIER INWARD) ---
  getPurchases() {
    return this.purchases;
  }

  getPurchaseById(id) {
    return this.purchases.find((p) => p.id === id);
  }

  getPurchasePayments(purchaseId) {
    return this.payments.filter((p) => p.purchase_id === purchaseId && p.type === 'supplier_payment');
  }

  recordPurchase(purData) {
    const purId = 'pur-' + Date.now();
    const purchaseNo = `PUR-${Math.floor(100 + Math.random() * 900)}`;
    const initialPay = Math.max(0, Number(purData.initial_payment) || 0);

    const totalAmount = purData.items.reduce((acc, item) => {
      return acc + (Number(item.quantity) || 0) * (Number(item.purchase_price) || 0);
    }, 0);

    const pendingAmount = Math.max(0, totalAmount - initialPay);
    const paymentStatus = pendingAmount === 0 ? 'Paid' : initialPay > 0 ? 'Partially Paid' : 'Pending';

    const cleanItems = purData.items.map((i, idx) => ({
      id: `pitem-${Date.now()}-${idx}`,
      purchase_id: purId,
      product_id: i.product_id,
      product_name: i.product_name || this.getProductById(i.product_id)?.name || 'Product',
      quantity: Number(i.quantity) || 0,
      purchase_price: Number(i.purchase_price) || 0,
      total: (Number(i.quantity) || 0) * (Number(i.purchase_price) || 0)
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
      recorded_by: 'Admin',
      created_at: new Date().toISOString()
    };

    // Increase stock in memory
    for (const item of cleanItems) {
      const prod = this.getProductById(item.product_id);
      if (prod) {
        prod.current_stock += item.quantity;
      }
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
        recorded_by: 'Admin',
        created_at: new Date().toISOString()
      };
      this.payments = [newPayment, ...this.payments];
    }

    this.notify();

    // Background write to Supabase
    supabase.from('supplier_purchases').insert([{
      id: newPur.id,
      purchase_no: newPur.purchase_no,
      supplier_id: newPur.supplier_id,
      date: newPur.date,
      time: newPur.time,
      total_amount: newPur.total_amount,
      paid_amount: newPur.paid_amount,
      pending_amount: newPur.pending_amount,
      payment_status: newPur.payment_status,
      notes: newPur.notes,
      recorded_by: newPur.recorded_by
    }]).then(() => {
      supabase.from('supplier_purchase_items').insert(
        cleanItems.map((i) => ({
          id: i.id,
          purchase_id: i.purchase_id,
          product_id: i.product_id,
          product_name: i.product_name,
          quantity: i.quantity,
          purchase_price: i.purchase_price,
          total: i.total
        }))
      ).then().catch((e) => console.warn(e));

      for (const item of cleanItems) {
        const prod = this.getProductById(item.product_id);
        if (prod) {
          supabase.from('products').update({ current_stock: prod.current_stock }).eq('id', item.product_id).then().catch((e) => console.warn(e));
        }
      }

      if (newPayment) {
        supabase.from('supplier_payments').insert([{
          id: newPayment.id,
          receipt_no: newPayment.receipt_no,
          supplier_id: newPayment.supplier_id,
          purchase_id: newPayment.purchase_id,
          amount: newPayment.amount,
          payment_mode: newPayment.payment_mode,
          reference_no: newPayment.reference_no,
          date: newPayment.date,
          time: newPayment.time,
          notes: newPayment.notes,
          recorded_by: newPayment.recorded_by
        }]).then().catch((e) => console.warn(e));
      }
    }).catch((e) => console.warn('Live recordPurchase error:', e));

    return newPur;
  }

  updatePurchase(purId, updatedData) {
    const existingPur = this.getPurchaseById(purId);
    if (!existingPur) throw new Error('Purchase record not found');

    const newItems = updatedData.items || existingPur.items;

    const oldItemMap = {};
    existingPur.items.forEach((i) => {
      oldItemMap[i.product_id] = (oldItemMap[i.product_id] || 0) + i.quantity;
    });

    const newItemMap = {};
    newItems.forEach((i) => {
      newItemMap[i.product_id] = (newItemMap[i.product_id] || 0) + Number(i.quantity);
    });

    // Adjust stock by delta
    const allProdIds = new Set([...Object.keys(oldItemMap), ...Object.keys(newItemMap)]);
    for (const prodId of allProdIds) {
      const oldQty = oldItemMap[prodId] || 0;
      const newQty = newItemMap[prodId] || 0;
      const delta = newQty - oldQty;
      const prod = this.getProductById(prodId);
      if (prod && delta !== 0) {
        prod.current_stock = Math.max(0, prod.current_stock + delta);
        supabase.from('products').update({ current_stock: prod.current_stock }).eq('id', prodId).then().catch((e) => console.warn(e));
      }
    }

    const cleanItems = newItems.map((i, idx) => ({
      id: i.id || `pitem-${Date.now()}-${idx}`,
      purchase_id: purId,
      product_id: i.product_id,
      product_name: i.product_name || this.getProductById(i.product_id)?.name || 'Product',
      quantity: Number(i.quantity) || 0,
      purchase_price: Number(i.purchase_price) || 0,
      total: (Number(i.quantity) || 0) * (Number(i.purchase_price) || 0)
    }));

    const totalAmount = cleanItems.reduce((acc, i) => acc + i.total, 0);
    const linkedPayments = this.getPurchasePayments(purId);
    const paidAmount = linkedPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const pendingAmount = Math.max(0, totalAmount - paidAmount);
    const paymentStatus = pendingAmount === 0 ? 'Paid' : paidAmount > 0 ? 'Partially Paid' : 'Pending';

    const updatedPur = {
      ...existingPur,
      ...updatedData,
      items: cleanItems,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      pending_amount: pendingAmount,
      payment_status: paymentStatus,
      updated_at: new Date().toISOString()
    };

    this.purchases = this.purchases.map((p) => (p.id === purId ? updatedPur : p));
    this.notify();

    supabase.from('supplier_purchases').update({
      total_amount: totalAmount,
      paid_amount: paidAmount,
      pending_amount: pendingAmount,
      payment_status: paymentStatus,
      date: updatedPur.date,
      time: updatedPur.time,
      notes: updatedPur.notes
    }).eq('id', purId).then(async () => {
      await supabase.from('supplier_purchase_items').delete().eq('purchase_id', purId);
      await supabase.from('supplier_purchase_items').insert(
        cleanItems.map((i) => ({
          id: i.id,
          purchase_id: purId,
          product_id: i.product_id,
          product_name: i.product_name,
          quantity: i.quantity,
          purchase_price: i.purchase_price,
          total: i.total
        }))
      );
    }).catch((e) => console.warn('Live updatePurchase error:', e));

    return updatedPur;
  }

  deletePurchase(id) {
    const pur = this.getPurchaseById(id);
    if (!pur) return;

    // Deduct inward stock
    for (const item of pur.items) {
      const prod = this.getProductById(item.product_id);
      if (prod) {
        prod.current_stock = Math.max(0, prod.current_stock - item.quantity);
        supabase.from('products').update({ current_stock: prod.current_stock }).eq('id', item.product_id).then().catch((e) => console.warn(e));
      }
    }

    this.purchases = this.purchases.filter((p) => p.id !== id);
    this.payments = this.payments.filter((p) => p.purchase_id !== id);
    this.notify();

    supabase.from('supplier_purchases').delete().eq('id', id).then().catch((e) => console.warn('Live deletePurchase error:', e));
  }

  // --- PAYMENTS (INDEPENDENT FINANCIAL TRANSACTIONS) ---
  getPayments() {
    return this.payments;
  }

  getPaymentById(id) {
    return this.payments.find((p) => p.id === id);
  }

  recordCustomerPayment(payData) {
    const payId = 'pay-' + Date.now();
    const receiptNo = `REC-${Math.floor(100 + Math.random() * 900)}`;
    const amt = Number(payData.amount) || 0;

    const newPayment = {
      id: payId,
      receipt_no: receiptNo,
      type: 'customer_payment',
      customer_id: payData.customer_id,
      sale_id: payData.sale_id || null,
      amount: amt,
      payment_mode: payData.payment_mode || 'Cash',
      reference_no: payData.reference_no || '',
      date: payData.date || getTodayDateString(),
      time: payData.time || getCurrentTimeString(),
      notes: payData.notes || '',
      recorded_by: 'Admin',
      created_at: new Date().toISOString()
    };

    this.payments = [newPayment, ...this.payments];

    // If linked to sale_id, recalculate and sync bill
    if (newPayment.sale_id) {
      this.syncSalePaymentTotals(newPayment.sale_id);
    }

    this.notify();

    supabase.from('customer_payments').insert([{
      id: newPayment.id,
      receipt_no: newPayment.receipt_no,
      customer_id: newPayment.customer_id,
      sale_id: newPayment.sale_id,
      amount: newPayment.amount,
      payment_mode: newPayment.payment_mode,
      reference_no: newPayment.reference_no,
      date: newPayment.date,
      time: newPayment.time,
      notes: newPayment.notes,
      recorded_by: newPayment.recorded_by
    }]).then().catch((e) => console.warn('Live recordCustomerPayment error:', e));

    return newPayment;
  }

  recordSupplierPayment(payData) {
    const payId = 'pay-' + Date.now();
    const receiptNo = `VOUCH-${Math.floor(100 + Math.random() * 900)}`;
    const amt = Number(payData.amount) || 0;

    const newPayment = {
      id: payId,
      receipt_no: receiptNo,
      type: 'supplier_payment',
      supplier_id: payData.supplier_id,
      purchase_id: payData.purchase_id || null,
      amount: amt,
      payment_mode: payData.payment_mode || 'Bank Transfer',
      reference_no: payData.reference_no || '',
      date: payData.date || getTodayDateString(),
      time: payData.time || getCurrentTimeString(),
      notes: payData.notes || '',
      recorded_by: 'Admin',
      created_at: new Date().toISOString()
    };

    this.payments = [newPayment, ...this.payments];

    if (newPayment.purchase_id) {
      this.syncPurchasePaymentTotals(newPayment.purchase_id);
    }

    this.notify();

    supabase.from('supplier_payments').insert([{
      id: newPayment.id,
      receipt_no: newPayment.receipt_no,
      supplier_id: newPayment.supplier_id,
      purchase_id: newPayment.purchase_id,
      amount: newPayment.amount,
      payment_mode: newPayment.payment_mode,
      reference_no: newPayment.reference_no,
      date: newPayment.date,
      time: newPayment.time,
      notes: newPayment.notes,
      recorded_by: newPayment.recorded_by
    }]).then().catch((e) => console.warn('Live recordSupplierPayment error:', e));

    return newPayment;
  }

  syncSalePaymentTotals(saleId) {
    const sale = this.getSaleById(saleId);
    if (!sale) return;

    const linkedPayments = this.getSalePayments(saleId);
    const totalPaid = linkedPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const pendingAmount = Math.max(0, sale.total_amount - totalPaid);
    const paymentStatus = pendingAmount === 0 ? 'Paid' : totalPaid > 0 ? 'Partially Paid' : 'Pending';

    sale.paid_amount = totalPaid;
    sale.pending_amount = pendingAmount;
    sale.payment_status = paymentStatus;

    try {
      supabase.from('customer_sales').update({
        paid_amount: totalPaid,
        pending_amount: pendingAmount,
        payment_status: paymentStatus
      }).eq('id', saleId).then();
    } catch (e) {}
  }

  syncPurchasePaymentTotals(purchaseId) {
    const pur = this.getPurchaseById(purchaseId);
    if (!pur) return;

    const linkedPayments = this.getPurchasePayments(purchaseId);
    const totalPaid = linkedPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const pendingAmount = Math.max(0, pur.total_amount - totalPaid);
    const paymentStatus = pendingAmount === 0 ? 'Paid' : totalPaid > 0 ? 'Partially Paid' : 'Pending';

    pur.paid_amount = totalPaid;
    pur.pending_amount = pendingAmount;
    pur.payment_status = paymentStatus;

    try {
      supabase.from('supplier_purchases').update({
        paid_amount: totalPaid,
        pending_amount: pendingAmount,
        payment_status: paymentStatus
      }).eq('id', purchaseId).then();
    } catch (e) {}
  }

  deletePayment(id) {
    const payment = this.getPaymentById(id);
    if (!payment) return;

    this.payments = this.payments.filter((p) => p.id !== id);

    if (payment.sale_id) {
      this.syncSalePaymentTotals(payment.sale_id);
    } else if (payment.purchase_id) {
      this.syncPurchasePaymentTotals(payment.purchase_id);
    }

    this.notify();

    if (payment.type === 'customer_payment') {
      supabase.from('customer_payments').delete().eq('id', id).then().catch((e) => console.warn('Live deletePayment error:', e));
    } else {
      supabase.from('supplier_payments').delete().eq('id', id).then().catch((e) => console.warn('Live deletePayment error:', e));
    }
  }

  // --- MANUAL STOCK ADJUSTMENTS ---
  getAdjustments() {
    return this.adjustments;
  }

  recordAdjustment(adjData) {
    const prod = this.getProductById(adjData.product_id);
    if (!prod) throw new Error('Product not found for adjustment');

    const qty = Number(adjData.quantity) || 0;
    if (qty <= 0) throw new Error('Quantity must be greater than 0');

    if (adjData.adjustment_type === 'decrease' && prod.current_stock < qty) {
      throw new Error(`Cannot decrease stock by ${qty}. Only ${prod.current_stock} currently in stock.`);
    }

    if (adjData.adjustment_type === 'increase') {
      prod.current_stock += qty;
    } else {
      prod.current_stock = Math.max(0, prod.current_stock - qty);
    }

    const newAdj = {
      id: 'adj-' + Date.now(),
      product_id: adjData.product_id,
      adjustment_type: adjData.adjustment_type,
      quantity: qty,
      reason: adjData.reason,
      date: adjData.date || getTodayDateString(),
      time: adjData.time || getCurrentTimeString(),
      recorded_by: 'Admin',
      created_at: new Date().toISOString()
    };

    this.adjustments = [newAdj, ...this.adjustments];
    this.notify();

    supabase.from('products').update({ current_stock: prod.current_stock }).eq('id', prod.id).then().catch((e) => console.warn(e));
    supabase.from('manual_stock_adjustments').insert([newAdj]).then().catch((e) => console.warn(e));

    return newAdj;
  }

  // --- DERIVED REPORTS & DIGITAL LEDGER ---
  getCustomerLedger(customerId) {
    const custSales = this.sales.filter((s) => s.customer_id === customerId);
    const custPayments = this.payments.filter((p) => p.customer_id === customerId && p.type === 'customer_payment');

    const totalSales = custSales.reduce((acc, s) => acc + (s.total_amount || 0), 0);
    const totalPaid = custPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const pendingBalance = Math.max(0, totalSales - totalPaid);

    // Combine into chronological passbook
    const entries = [];

    custSales.forEach((s) => {
      const summary = s.items.map((i) => `${i.product_name} (${i.quantity})`).join(', ');
      entries.push({
        id: s.id,
        date: s.date,
        time: s.time,
        type: 'SALE',
        reference: s.invoice_no,
        particulars: `Sales Invoice - ${summary}`,
        debit: s.total_amount,
        credit: 0
      });
    });

    custPayments.forEach((p) => {
      const linkedSale = p.sale_id ? this.getSaleById(p.sale_id) : null;
      const refDetail = linkedSale ? `for ${linkedSale.invoice_no}` : (p.reference_no ? `Ref: ${p.reference_no}` : '');
      entries.push({
        id: p.id,
        date: p.date,
        time: p.time,
        type: 'PAYMENT',
        reference: p.receipt_no,
        particulars: `Payment Received (${p.payment_mode}) ${refDetail}`,
        debit: 0,
        credit: p.amount
      });
    });

    // Chronological order (oldest to newest for running balance)
    entries.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
      const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
      return dateA - dateB;
    });

    let running = 0;
    const computedEntries = entries.map((entry) => {
      running = running + (entry.debit || 0) - (entry.credit || 0);
      return {
        ...entry,
        balance: Math.max(0, running)
      };
    });

    return {
      totalSales,
      totalPaid,
      pendingBalance,
      entries: computedEntries
    };
  }

  getSupplierLedger(supplierId) {
    const suppPurchases = this.purchases.filter((p) => p.supplier_id === supplierId);
    const suppPayments = this.payments.filter((p) => p.supplier_id === supplierId && p.type === 'supplier_payment');

    const totalPurchases = suppPurchases.reduce((acc, p) => acc + (p.total_amount || 0), 0);
    const totalPaid = suppPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const pendingBalance = Math.max(0, totalPurchases - totalPaid);

    const entries = [];

    suppPurchases.forEach((p) => {
      const summary = p.items.map((i) => `${i.product_name} (${i.quantity})`).join(', ');
      entries.push({
        id: p.id,
        date: p.date,
        time: p.time,
        type: 'PURCHASE',
        reference: p.purchase_no,
        particulars: `Inward Purchase - ${summary}`,
        credit: p.total_amount,
        debit: 0
      });
    });

    suppPayments.forEach((p) => {
      const linkedPur = p.purchase_id ? this.getPurchaseById(p.purchase_id) : null;
      const refDetail = linkedPur ? `for ${linkedPur.purchase_no}` : (p.reference_no ? `Ref: ${p.reference_no}` : '');
      entries.push({
        id: p.id,
        date: p.date,
        time: p.time,
        type: 'PAYMENT',
        reference: p.receipt_no,
        particulars: `Payment Made (${p.payment_mode}) ${refDetail}`,
        credit: 0,
        debit: p.amount
      });
    });

    entries.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
      const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
      return dateA - dateB;
    });

    let running = 0;
    const computedEntries = entries.map((entry) => {
      running = running + (entry.credit || 0) - (entry.debit || 0);
      return {
        ...entry,
        balance: Math.max(0, running)
      };
    });

    return {
      totalPurchases,
      totalPaid,
      pendingBalance,
      entries: computedEntries
    };
  }

  getDayBook(filterDate = getTodayDateString()) {
    const daySales = this.sales.filter((s) => s.date === filterDate);
    const dayPurchases = this.purchases.filter((p) => p.date === filterDate);
    const dayPayments = this.payments.filter((p) => p.date === filterDate);
    const dayAdjustments = this.adjustments.filter((a) => a.date === filterDate);

    const events = [];

    let totalSalesAmount = 0;
    let totalPurchasesAmount = 0;
    let cashInflow = 0;
    let cashOutflow = 0;

    daySales.forEach((s) => {
      totalSalesAmount += s.total_amount || 0;
      const cust = this.getCustomerById(s.customer_id);
      const itemsStr = s.items.map((i) => `${i.product_name} (${i.quantity})`).join(', ');
      events.push({
        id: s.id,
        time: s.time,
        type: 'Customer Sale',
        badgeClass: 'badge-active',
        party: cust ? cust.name : 'Customer',
        details: itemsStr || `${s.items.length} items`,
        amount: s.total_amount,
        amountType: 'neutral',
        reference: s.invoice_no,
        status: s.payment_status
      });
    });

    dayPurchases.forEach((p) => {
      totalPurchasesAmount += p.total_amount || 0;
      const supp = this.getSupplierById(p.supplier_id);
      const itemsStr = p.items.map((i) => `${i.product_name} (${i.quantity})`).join(', ');
      events.push({
        id: p.id,
        time: p.time,
        type: 'Supplier Purchase',
        badgeClass: 'badge-warning',
        party: supp ? supp.company_name : 'Supplier',
        details: itemsStr || `${p.items.length} items`,
        amount: p.total_amount,
        amountType: 'neutral',
        reference: p.purchase_no,
        status: p.payment_status
      });
    });

    dayPayments.forEach((pay) => {
      if (pay.type === 'customer_payment') {
        cashInflow += pay.amount || 0;
        const cust = this.getCustomerById(pay.customer_id);
        events.push({
          id: pay.id,
          time: pay.time,
          type: 'Customer Payment Inward',
          badgeClass: 'badge-paid',
          party: cust ? cust.name : 'Customer',
          details: `Via ${pay.payment_mode}${pay.notes ? ` - ${pay.notes}` : ''}`,
          amount: pay.amount,
          amountType: 'inflow',
          reference: pay.receipt_no,
          status: 'Settled'
        });
      } else {
        cashOutflow += pay.amount || 0;
        const supp = this.getSupplierById(pay.supplier_id);
        events.push({
          id: pay.id,
          time: pay.time,
          type: 'Supplier Payment Outward',
          badgeClass: 'badge-danger',
          party: supp ? supp.company_name : 'Supplier',
          details: `Via ${pay.payment_mode}${pay.notes ? ` - ${pay.notes}` : ''}`,
          amount: pay.amount,
          amountType: 'outflow',
          reference: pay.receipt_no,
          status: 'Settled'
        });
      }
    });

    dayAdjustments.forEach((adj) => {
      const prod = this.getProductById(adj.product_id);
      events.push({
        id: adj.id,
        time: adj.time,
        type: `Stock ${adj.adjustment_type === 'increase' ? 'Addition' : 'Reduction'}`,
        badgeClass: 'badge-neutral',
        party: prod ? prod.name : 'Product',
        details: `${adj.adjustment_type.toUpperCase()}: ${adj.quantity} ${prod?.unit || 'units'} (${adj.reason})`,
        amount: null,
        amountType: 'none',
        reference: 'ADJ',
        status: 'Audit Log'
      });
    });

    events.sort((a, b) => (b.time || '').localeCompare(a.time || ''));

    const netCashMovement = cashInflow - cashOutflow;

    return {
      date: filterDate,
      totalSalesAmount,
      totalPurchasesAmount,
      cashInflow,
      cashOutflow,
      netCashMovement,
      events,
      transactions: events
    };
  }

  getDailyTransactions(filterDate) {
    return this.getDayBook(filterDate);
  }

  getProfitReport() {
    return this.getRevenueProfitReport();
  }

  getRevenueProfitReport() {
    let totalRevenue = 0;
    let totalEstimatedCost = 0;
    let totalUnitsSold = 0;

    const productSalesMap = {};
    const customerSalesMap = {};

    this.sales.forEach((sale) => {
      totalRevenue += sale.total_amount || 0;

      const cust = this.getCustomerById(sale.customer_id);
      const custKey = sale.customer_id;
      if (!customerSalesMap[custKey]) {
        customerSalesMap[custKey] = {
          name: cust ? cust.name : 'Unknown Customer',
          totalRevenue: 0,
          invoicesCount: 0
        };
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
          productSalesMap[prodKey] = {
            name: item.product_name,
            quantity: 0,
            revenue: 0,
            cost: 0
          };
        }
        productSalesMap[prodKey].quantity += item.quantity || 0;
        productSalesMap[prodKey].revenue += item.total || 0;
        productSalesMap[prodKey].cost += costOfGoods;
      });
    });

    const grossProfit = totalRevenue - totalEstimatedCost;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    const totalCustomerPaymentsReceived = this.payments
      .filter((p) => p.type === 'customer_payment')
      .reduce((acc, p) => acc + (p.amount || 0), 0);

    const pendingCustomerReceivables = Math.max(0, totalRevenue - totalCustomerPaymentsReceived);

    const totalPurchasesAmount = this.purchases.reduce((acc, p) => acc + (p.total_amount || 0), 0);
    const totalSupplierPaymentsMade = this.payments
      .filter((p) => p.type === 'supplier_payment')
      .reduce((acc, p) => acc + (p.amount || 0), 0);

    const pendingSupplierPayables = Math.max(0, totalPurchasesAmount - totalSupplierPaymentsMade);

    return {
      totalRevenue,
      totalEstimatedCost,
      grossProfit,
      profitMargin: profitMargin.toFixed(1),
      totalUnitsSold,
      totalCustomerPaymentsReceived,
      pendingCustomerReceivables,
      totalPurchasesAmount,
      totalSupplierPaymentsMade,
      pendingSupplierPayables,
      productSales: Object.values(productSalesMap).sort((a, b) => b.revenue - a.revenue),
      customerSales: Object.values(customerSalesMap).sort((a, b) => b.totalRevenue - a.totalRevenue)
    };
  }

  resetToInitialData() {
    this.products = JSON.parse(JSON.stringify(initialProducts));
    this.customers = JSON.parse(JSON.stringify(initialCustomers));
    this.suppliers = JSON.parse(JSON.stringify(initialSuppliers));
    this.sales = JSON.parse(JSON.stringify(initialSales));
    this.purchases = JSON.parse(JSON.stringify(initialPurchases));
    this.payments = JSON.parse(JSON.stringify(initialPayments));
    this.adjustments = JSON.parse(JSON.stringify(initialAdjustments));
    this.notify();
  }
}

export const dataService = new DataService();
