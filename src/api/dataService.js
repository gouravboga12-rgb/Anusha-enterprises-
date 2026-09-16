// Centralized Data Engine & Business Logic for Anusha Enterprises CRM

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

const STORAGE_KEYS = {
  PRODUCTS: 'anusha_products_v1',
  CUSTOMERS: 'anusha_customers_v1',
  SUPPLIERS: 'anusha_suppliers_v1',
  SALES: 'anusha_sales_v1',
  PURCHASES: 'anusha_purchases_v1',
  PAYMENTS: 'anusha_payments_v1',
  ADJUSTMENTS: 'anusha_adjustments_v1'
};

const getStored = (key, defaultVal) => {
  try {
    if (typeof localStorage === 'undefined') return defaultVal;
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultVal;
  } catch (e) {
    console.warn('Storage read failed for', key, e);
    return defaultVal;
  }
};

const setStored = (key, val) => {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.warn('Storage write failed for', key, e);
  }
};

class DataService {
  constructor() {
    this.products = getStored(STORAGE_KEYS.PRODUCTS, initialProducts);
    this.customers = getStored(STORAGE_KEYS.CUSTOMERS, initialCustomers);
    this.suppliers = getStored(STORAGE_KEYS.SUPPLIERS, initialSuppliers);
    this.sales = getStored(STORAGE_KEYS.SALES, initialSales);
    this.purchases = getStored(STORAGE_KEYS.PURCHASES, initialPurchases);
    this.payments = getStored(STORAGE_KEYS.PAYMENTS, initialPayments);
    this.adjustments = getStored(STORAGE_KEYS.ADJUSTMENTS, initialAdjustments);
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach((fn) => fn());
  }

  saveAll() {
    setStored(STORAGE_KEYS.PRODUCTS, this.products);
    setStored(STORAGE_KEYS.CUSTOMERS, this.customers);
    setStored(STORAGE_KEYS.SUPPLIERS, this.suppliers);
    setStored(STORAGE_KEYS.SALES, this.sales);
    setStored(STORAGE_KEYS.PURCHASES, this.purchases);
    setStored(STORAGE_KEYS.PAYMENTS, this.payments);
    setStored(STORAGE_KEYS.ADJUSTMENTS, this.adjustments);
    this.notify();
  }

  resetToDemo() {
    this.products = [...initialProducts];
    this.customers = [...initialCustomers];
    this.suppliers = [...initialSuppliers];
    this.sales = [...initialSales];
    this.purchases = [...initialPurchases];
    this.payments = [...initialPayments];
    this.adjustments = [...initialAdjustments];
    this.saveAll();
  }

  // --- PRODUCTS ---
  getProducts() {
    return this.products;
  }

  getProductById(id) {
    return this.products.find((p) => p.id === id);
  }

  saveProduct(productData) {
    let saved;
    if (productData.id) {
      this.products = this.products.map((p) => {
        if (p.id === productData.id) {
          saved = { ...p, ...productData, updated_at: new Date().toISOString() };
          return saved;
        }
        return p;
      });
    } else {
      const newProduct = {
        ...productData,
        id: 'prod-' + Date.now(),
        sku: productData.sku || `SKU-${Math.floor(100 + Math.random() * 900)}`,
        current_stock: Number(productData.current_stock) || 0,
        purchase_price: Number(productData.purchase_price) || 0,
        selling_price: Number(productData.selling_price) || 0,
        is_active: productData.is_active !== undefined ? productData.is_active : true,
        created_at: new Date().toISOString()
      };
      this.products = [newProduct, ...this.products];
      saved = newProduct;
    }
    this.saveAll();
    return saved;
  }

  deleteProduct(id) {
    this.products = this.products.filter((p) => p.id !== id);
    this.saveAll();
  }

  toggleProductActive(id) {
    this.products = this.products.map((p) =>
      p.id === id ? { ...p, is_active: !p.is_active } : p
    );
    this.saveAll();
  }

  // --- CUSTOMERS ---
  getCustomers() {
    return this.customers;
  }

  getCustomerById(id) {
    return this.customers.find((c) => c.id === id);
  }

  saveCustomer(custData) {
    let saved;
    if (custData.id) {
      this.customers = this.customers.map((c) => {
        if (c.id === custData.id) {
          saved = { ...c, ...custData, updated_at: new Date().toISOString() };
          return saved;
        }
        return c;
      });
    } else {
      const newCust = {
        ...custData,
        id: 'cust-' + Date.now(),
        customer_id: custData.customer_id || `CUST-${100 + this.customers.length + 1}`,
        status: custData.status || 'active',
        created_at: new Date().toISOString()
      };
      this.customers = [newCust, ...this.customers];
      saved = newCust;
    }
    this.saveAll();
    return saved;
  }

  deleteCustomer(id) {
    // Remove customer
    this.customers = this.customers.filter((c) => c.id !== id);
    // Also remove associated sales and payments
    this.sales = this.sales.filter((s) => s.customer_id !== id);
    this.payments = this.payments.filter((p) => p.customer_id !== id);
    this.saveAll();
  }

  // --- SUPPLIERS ---
  getSuppliers() {
    return this.suppliers;
  }

  getSupplierById(id) {
    return this.suppliers.find((s) => s.id === id);
  }

  saveSupplier(suppData) {
    let saved;
    if (suppData.id) {
      this.suppliers = this.suppliers.map((s) => {
        if (s.id === suppData.id) {
          saved = { ...s, ...suppData, updated_at: new Date().toISOString() };
          return saved;
        }
        return s;
      });
    } else {
      const newSupp = {
        ...suppData,
        id: 'supp-' + Date.now(),
        supplier_id: suppData.supplier_id || `SUPP-${100 + this.suppliers.length + 1}`,
        created_at: new Date().toISOString()
      };
      this.suppliers = [newSupp, ...this.suppliers];
      saved = newSupp;
    }
    this.saveAll();
    return saved;
  }

  deleteSupplier(id) {
    this.suppliers = this.suppliers.filter((s) => s.id !== id);
    this.purchases = this.purchases.filter((p) => p.supplier_id !== id);
    this.payments = this.payments.filter((p) => p.supplier_id !== id);
    this.saveAll();
  }

  // --- SALES (Customer Invoicing) ---
  getSales() {
    return this.sales;
  }

  getSaleById(id) {
    const sale = this.sales.find((s) => s.id === id);
    if (!sale) return null;
    const payments = this.payments.filter((p) => p.sale_id === id && p.type === 'customer_payment');
    return { ...sale, payments };
  }

  getSalePayments(saleId) {
    return this.payments.filter((p) => p.sale_id === saleId && p.type === 'customer_payment');
  }

  recordSale({ customer_id, items, date, time, initial_payment, payment_mode, reference_no, notes }) {
    if (!customer_id) throw new Error('Please select a customer');
    if (!items || items.length === 0) throw new Error('At least one product item is required');

    // 1. STRICT STOCK VALIDATION BEFORE ANY TRANSACTION IS PROCESSED
    for (const item of items) {
      const prod = this.getProductById(item.product_id);
      const reqQty = Number(item.quantity) || 0;
      if (reqQty <= 0) {
        throw new Error(`Quantity for ${prod ? prod.name : 'product'} must be at least 1`);
      }
      if (!prod) {
        throw new Error(`Product not found for item`);
      }
      const availableStock = prod.current_stock || 0;
      if (reqQty > availableStock) {
        throw new Error(`Only ${availableStock} units of "${prod.name}" are currently available. You cannot sell ${reqQty} units.`);
      }
    }

    // 2. AUTOMATIC INVENTORY DECREASE & LINE CALCULATION
    let totalAmount = 0;
    const processedItems = items.map((item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.selling_price) || 0;
      const lineTotal = qty * price;
      totalAmount += lineTotal;

      const prod = this.getProductById(item.product_id);
      prod.current_stock = Math.max(0, (prod.current_stock || 0) - qty);

      return {
        product_id: item.product_id,
        product_name: prod ? prod.name : item.product_name,
        quantity: qty,
        selling_price: price,
        total: lineTotal
      };
    });

    const saleId = 'sale-' + Date.now();
    const invoiceNo = `INV-2026-${String(this.sales.length + 1).padStart(3, '0')}`;
    const saleDate = date || getTodayDateString();
    const saleTime = time || getCurrentTimeString();

    const initPaid = Math.min(totalAmount, Math.max(0, Number(initial_payment) || 0));
    const pendingAmount = Math.max(0, totalAmount - initPaid);
    const paymentStatus = pendingAmount === 0 ? 'Paid' : (initPaid > 0 ? 'Partially Paid' : 'Pending');

    const newSale = {
      id: saleId,
      invoice_no: invoiceNo,
      customer_id,
      date: saleDate,
      time: saleTime,
      items: processedItems,
      total_amount: totalAmount,
      paid_amount: initPaid,
      pending_amount: pendingAmount,
      payment_status: paymentStatus,
      recorded_by: 'Admin',
      notes: notes || ''
    };

    this.sales = [newSale, ...this.sales];

    // If initial payment was entered, record as a separate customer payment record
    if (initPaid > 0) {
      const newPay = {
        id: 'pay-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        receipt_no: `RCPT-${1000 + this.payments.length + 1}`,
        type: 'customer_payment',
        customer_id,
        sale_id: saleId,
        amount: initPaid,
        payment_mode: payment_mode || 'Cash',
        reference_no: reference_no || '',
        date: saleDate,
        time: saleTime,
        notes: notes ? `Initial payment for ${invoiceNo} - ${notes}` : `Initial payment for ${invoiceNo}`,
        recorded_by: 'Admin'
      };
      this.payments = [newPay, ...this.payments];
    }

    this.saveAll();
    return newSale;
  }

  updateSale(saleId, { customer_id, items, date, time, notes }) {
    const saleIndex = this.sales.findIndex((s) => s.id === saleId);
    if (saleIndex === -1) throw new Error('Sale invoice not found');
    const oldSale = this.sales[saleIndex];

    if (!items || items.length === 0) {
      throw new Error('At least one product item is required');
    }

    // Map old quantities: product_id -> oldQty
    const oldQtyMap = {};
    oldSale.items.forEach((item) => {
      oldQtyMap[item.product_id] = (oldQtyMap[item.product_id] || 0) + (Number(item.quantity) || 0);
    });

    // Map new quantities: product_id -> newQty
    const newQtyMap = {};
    items.forEach((item) => {
      const qty = Number(item.quantity) || 0;
      if (qty <= 0) {
        const prod = this.getProductById(item.product_id);
        throw new Error(`Quantity for ${prod ? prod.name : 'product'} must be at least 1`);
      }
      newQtyMap[item.product_id] = (newQtyMap[item.product_id] || 0) + qty;
    });

    // Validate available stock for all positive deltas (newQty > oldQty)
    for (const [prodId, newQty] of Object.entries(newQtyMap)) {
      const oldQty = oldQtyMap[prodId] || 0;
      const delta = newQty - oldQty;
      if (delta > 0) {
        const prod = this.getProductById(prodId);
        if (!prod) throw new Error('Product not found');
        const availableStock = prod.current_stock || 0;
        if (availableStock < delta) {
          throw new Error(`Only ${availableStock} additional units of "${prod.name}" are currently available. You cannot increase quantity by ${delta} units.`);
        }
      }
    }

    // Apply exact inventory adjustments:
    // 1. Existing or changed items: adjust by delta (newQty - oldQty)
    for (const [prodId, newQty] of Object.entries(newQtyMap)) {
      const oldQty = oldQtyMap[prodId] || 0;
      const delta = newQty - oldQty;
      const prod = this.getProductById(prodId);
      if (prod) {
        prod.current_stock = Math.max(0, (prod.current_stock || 0) - delta);
      }
    }
    // 2. Completely removed items: return oldQty to stock
    for (const [prodId, oldQty] of Object.entries(oldQtyMap)) {
      if (!newQtyMap[prodId]) {
        const prod = this.getProductById(prodId);
        if (prod) {
          prod.current_stock = (prod.current_stock || 0) + oldQty;
        }
      }
    }

    // Recalculate bill total
    let totalAmount = 0;
    const processedItems = items.map((item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.selling_price) || 0;
      const lineTotal = qty * price;
      totalAmount += lineTotal;
      const prod = this.getProductById(item.product_id);
      return {
        product_id: item.product_id,
        product_name: prod ? prod.name : item.product_name,
        quantity: qty,
        selling_price: price,
        total: lineTotal
      };
    });

    // Synchronize payments: recalculate total paid for this sale from independent payment records
    const salePayments = this.payments.filter((p) => p.sale_id === saleId && p.type === 'customer_payment');
    const paidAmount = salePayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    const pendingAmount = Math.max(0, totalAmount - paidAmount);
    const paymentStatus = pendingAmount === 0 ? 'Paid' : (paidAmount > 0 ? 'Partially Paid' : 'Pending');

    const updatedSale = {
      ...oldSale,
      customer_id: customer_id || oldSale.customer_id,
      date: date || oldSale.date,
      time: time || oldSale.time,
      items: processedItems,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      pending_amount: pendingAmount,
      payment_status: paymentStatus,
      notes: notes !== undefined ? notes : oldSale.notes,
      updated_at: new Date().toISOString()
    };

    this.sales[saleIndex] = updatedSale;
    this.saveAll();
    return updatedSale;
  }

  // --- PURCHASES (Supplier Inward) ---
  getPurchases() {
    return this.purchases;
  }

  getPurchaseById(id) {
    const pur = this.purchases.find((p) => p.id === id);
    if (!pur) return null;
    const payments = this.payments.filter((p) => p.purchase_id === id && p.type === 'supplier_payment');
    return { ...pur, payments };
  }

  getPurchasePayments(purchaseId) {
    return this.payments.filter((p) => p.purchase_id === purchaseId && p.type === 'supplier_payment');
  }

  recordPurchase({ supplier_id, items, date, time, initial_payment, payment_mode, reference_no, notes }) {
    if (!supplier_id) throw new Error('Please select a supplier');
    if (!items || items.length === 0) throw new Error('At least one product item is required');

    let totalAmount = 0;
    const processedItems = items.map((item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.purchase_price) || 0;
      const lineTotal = qty * price;
      totalAmount += lineTotal;

      // AUTOMATIC INVENTORY INCREASE
      const prod = this.getProductById(item.product_id);
      if (prod) {
        prod.current_stock = (prod.current_stock || 0) + qty;
      }

      return {
        product_id: item.product_id,
        product_name: prod ? prod.name : item.product_name,
        quantity: qty,
        purchase_price: price,
        total: lineTotal
      };
    });

    const purchaseId = 'pur-' + Date.now();
    const purchaseNo = `PUR-2026-${String(this.purchases.length + 1).padStart(3, '0')}`;
    const purDate = date || getTodayDateString();
    const purTime = time || getCurrentTimeString();

    const initPaid = Math.min(totalAmount, Math.max(0, Number(initial_payment) || 0));
    const pendingAmount = Math.max(0, totalAmount - initPaid);
    const paymentStatus = pendingAmount === 0 ? 'Paid' : (initPaid > 0 ? 'Partially Paid' : 'Pending');

    const newPur = {
      id: purchaseId,
      purchase_no: purchaseNo,
      supplier_id,
      date: purDate,
      time: purTime,
      items: processedItems,
      total_amount: totalAmount,
      paid_amount: initPaid,
      pending_amount: pendingAmount,
      payment_status: paymentStatus,
      recorded_by: 'Admin',
      notes: notes || ''
    };

    this.purchases = [newPur, ...this.purchases];

    // If initial payment was made to supplier, record individual payment voucher
    if (initPaid > 0) {
      const newPay = {
        id: 'pay-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        receipt_no: `VCHR-${2000 + this.payments.length + 1}`,
        type: 'supplier_payment',
        supplier_id,
        purchase_id: purchaseId,
        amount: initPaid,
        payment_mode: payment_mode || 'Bank Transfer',
        reference_no: reference_no || '',
        date: purDate,
        time: purTime,
        notes: notes ? `Initial payment for ${purchaseNo} - ${notes}` : `Initial payment for ${purchaseNo}`,
        recorded_by: 'Admin'
      };
      this.payments = [newPay, ...this.payments];
    }

    this.saveAll();
    return newPur;
  }

  updatePurchase(purchaseId, { supplier_id, items, date, time, notes }) {
    const purIndex = this.purchases.findIndex((p) => p.id === purchaseId);
    if (purIndex === -1) throw new Error('Purchase record not found');
    const oldPur = this.purchases[purIndex];

    if (!items || items.length === 0) {
      throw new Error('At least one product item is required');
    }

    const oldQtyMap = {};
    oldPur.items.forEach((item) => {
      oldQtyMap[item.product_id] = (oldQtyMap[item.product_id] || 0) + (Number(item.quantity) || 0);
    });

    const newQtyMap = {};
    items.forEach((item) => {
      const qty = Number(item.quantity) || 0;
      if (qty <= 0) {
        const prod = this.getProductById(item.product_id);
        throw new Error(`Quantity for ${prod ? prod.name : 'product'} must be at least 1`);
      }
      newQtyMap[item.product_id] = (newQtyMap[item.product_id] || 0) + qty;
    });

    // Check if decreasing purchase causes stock to go negative
    for (const [prodId, oldQty] of Object.entries(oldQtyMap)) {
      const newQty = newQtyMap[prodId] || 0;
      if (newQty < oldQty) {
        const diff = oldQty - newQty;
        const prod = this.getProductById(prodId);
        if (prod && (prod.current_stock || 0) < diff) {
          throw new Error(`Cannot decrease purchase quantity of "${prod.name}" by ${diff} units. Current stock is only ${prod.current_stock}.`);
        }
      }
    }

    // Apply delta stock adjustments:
    for (const [prodId, newQty] of Object.entries(newQtyMap)) {
      const oldQty = oldQtyMap[prodId] || 0;
      const delta = newQty - oldQty;
      const prod = this.getProductById(prodId);
      if (prod) {
        prod.current_stock = Math.max(0, (prod.current_stock || 0) + delta);
      }
    }
    for (const [prodId, oldQty] of Object.entries(oldQtyMap)) {
      if (!newQtyMap[prodId]) {
        const prod = this.getProductById(prodId);
        if (prod) {
          prod.current_stock = Math.max(0, (prod.current_stock || 0) - oldQty);
        }
      }
    }

    let totalAmount = 0;
    const processedItems = items.map((item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.purchase_price) || 0;
      const lineTotal = qty * price;
      totalAmount += lineTotal;
      const prod = this.getProductById(item.product_id);
      return {
        product_id: item.product_id,
        product_name: prod ? prod.name : item.product_name,
        quantity: qty,
        purchase_price: price,
        total: lineTotal
      };
    });

    const purPayments = this.payments.filter((p) => p.purchase_id === purchaseId && p.type === 'supplier_payment');
    const paidAmount = purPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    const pendingAmount = Math.max(0, totalAmount - paidAmount);
    const paymentStatus = pendingAmount === 0 ? 'Paid' : (paidAmount > 0 ? 'Partially Paid' : 'Pending');

    const updatedPur = {
      ...oldPur,
      supplier_id: supplier_id || oldPur.supplier_id,
      date: date || oldPur.date,
      time: time || oldPur.time,
      items: processedItems,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      pending_amount: pendingAmount,
      payment_status: paymentStatus,
      notes: notes !== undefined ? notes : oldPur.notes,
      updated_at: new Date().toISOString()
    };

    this.purchases[purIndex] = updatedPur;
    this.saveAll();
    return updatedPur;
  }

  // --- SYNCHRONIZATION HELPERS ---
  syncSalePaymentTotals(saleId) {
    const sale = this.sales.find((s) => s.id === saleId);
    if (!sale) return;
    const salePayments = this.payments.filter((p) => p.sale_id === saleId && p.type === 'customer_payment');
    const totalPaid = salePayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    sale.paid_amount = totalPaid;
    sale.pending_amount = Math.max(0, (sale.total_amount || 0) - totalPaid);
    sale.payment_status = sale.pending_amount === 0 ? 'Paid' : (sale.paid_amount > 0 ? 'Partially Paid' : 'Pending');
  }

  syncPurchasePaymentTotals(purchaseId) {
    const pur = this.purchases.find((p) => p.id === purchaseId);
    if (!pur) return;
    const purPayments = this.payments.filter((p) => p.purchase_id === purchaseId && p.type === 'supplier_payment');
    const totalPaid = purPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    pur.paid_amount = totalPaid;
    pur.pending_amount = Math.max(0, (pur.total_amount || 0) - totalPaid);
    pur.payment_status = pur.pending_amount === 0 ? 'Paid' : (pur.paid_amount > 0 ? 'Partially Paid' : 'Pending');
  }

  // --- PAYMENTS (Non-destructive Individual Receipts & Vouchers) ---
  getPayments() {
    return this.payments;
  }

  recordCustomerPayment({ customer_id, sale_id, amount, payment_mode, reference_no, date, time, notes }) {
    const payAmount = Number(amount) || 0;
    if (payAmount <= 0) throw new Error('Payment amount must be greater than 0');
    if (!customer_id) throw new Error('Please select a customer');

    const payDate = date || getTodayDateString();
    const payTime = time || getCurrentTimeString();

    const newPayment = {
      id: 'pay-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      receipt_no: `RCPT-${1000 + this.payments.length + 1}`,
      type: 'customer_payment',
      customer_id,
      sale_id: sale_id || null,
      amount: payAmount,
      payment_mode: payment_mode || 'Cash',
      reference_no: reference_no || '',
      date: payDate,
      time: payTime,
      notes: notes || '',
      recorded_by: 'Admin'
    };

    this.payments = [newPayment, ...this.payments];

    // Recalculate linked sale's totals without mutating other sales
    if (sale_id) {
      this.syncSalePaymentTotals(sale_id);
    }

    this.saveAll();
    return newPayment;
  }

  recordSupplierPayment({ supplier_id, purchase_id, amount, payment_mode, reference_no, date, time, notes }) {
    const payAmount = Number(amount) || 0;
    if (payAmount <= 0) throw new Error('Payment amount must be greater than 0');
    if (!supplier_id) throw new Error('Please select a supplier');

    const payDate = date || getTodayDateString();
    const payTime = time || getCurrentTimeString();

    const newPayment = {
      id: 'pay-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      receipt_no: `VCHR-${2000 + this.payments.length + 1}`,
      type: 'supplier_payment',
      supplier_id,
      purchase_id: purchase_id || null,
      amount: payAmount,
      payment_mode: payment_mode || 'Bank Transfer',
      reference_no: reference_no || '',
      date: payDate,
      time: payTime,
      notes: notes || '',
      recorded_by: 'Admin'
    };

    this.payments = [newPayment, ...this.payments];

    if (purchase_id) {
      this.syncPurchasePaymentTotals(purchase_id);
    }

    this.saveAll();
    return newPayment;
  }

  updatePayment(paymentId, { amount, payment_mode, reference_no, date, time, notes }) {
    const pay = this.payments.find((p) => p.id === paymentId);
    if (!pay) throw new Error('Payment record not found');
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) throw new Error('Payment amount must be greater than 0');

    pay.amount = numAmount;
    if (payment_mode) pay.payment_mode = payment_mode;
    if (reference_no !== undefined) pay.reference_no = reference_no;
    if (date) pay.date = date;
    if (time) pay.time = time;
    if (notes !== undefined) pay.notes = notes;

    if (pay.sale_id) {
      this.syncSalePaymentTotals(pay.sale_id);
    }
    if (pay.purchase_id) {
      this.syncPurchasePaymentTotals(pay.purchase_id);
    }

    this.saveAll();
    return pay;
  }

  deleteSale(id) {
    const sale = this.sales.find((s) => s.id === id);
    if (sale) {
      // 1. AUTOMATIC STOCK RESTORATION: Return sold items back to inventory
      sale.items.forEach((item) => {
        const prod = this.getProductById(item.product_id);
        if (prod) {
          prod.current_stock = (prod.current_stock || 0) + (Number(item.quantity) || 0);
        }
      });
      // 2. Remove associated payments
      this.payments = this.payments.filter((p) => p.sale_id !== id);
      // 3. Remove sale
      this.sales = this.sales.filter((s) => s.id !== id);
      this.saveAll();
    }
  }

  deletePurchase(id) {
    const pur = this.purchases.find((p) => p.id === id);
    if (pur) {
      // 1. AUTOMATIC STOCK DEDUCTION: Remove purchased items from inventory
      pur.items.forEach((item) => {
        const prod = this.getProductById(item.product_id);
        if (prod) {
          prod.current_stock = Math.max(0, (prod.current_stock || 0) - (Number(item.quantity) || 0));
        }
      });
      // 2. Remove associated payments
      this.payments = this.payments.filter((p) => p.purchase_id !== id);
      // 3. Remove purchase
      this.purchases = this.purchases.filter((p) => p.id !== id);
      this.saveAll();
    }
  }

  deletePayment(id) {
    const pay = this.payments.find((p) => p.id === id);
    if (pay) {
      const saleId = pay.sale_id;
      const purchaseId = pay.purchase_id;

      this.payments = this.payments.filter((p) => p.id !== id);

      // Automatically recalculate balance and status on linked bill
      if (saleId) {
        this.syncSalePaymentTotals(saleId);
      }
      if (purchaseId) {
        this.syncPurchasePaymentTotals(purchaseId);
      }

      this.saveAll();
    }
  }

  deleteAdjustment(id) {
    const adj = this.adjustments.find((a) => a.id === id);
    if (adj) {
      const prod = this.getProductById(adj.product_id);
      if (prod) {
        if (adj.adjustment_type === 'increase') {
          prod.current_stock = Math.max(0, (prod.current_stock || 0) - adj.quantity);
        } else {
          prod.current_stock = (prod.current_stock || 0) + adj.quantity;
        }
      }
      this.adjustments = this.adjustments.filter((a) => a.id !== id);
      this.saveAll();
    }
  }

  // --- MANUAL STOCK ADJUSTMENTS ---
  getAdjustments() {
    return this.adjustments;
  }

  recordStockAdjustment({ product_id, adjustment_type, quantity, reason, date, time }) {
    const qty = Number(quantity) || 0;
    if (qty <= 0) throw new Error('Adjustment quantity must be greater than 0');

    const prod = this.getProductById(product_id);
    if (!prod) throw new Error('Product not found');

    if (adjustment_type === 'decrease') {
      prod.current_stock = Math.max(0, (prod.current_stock || 0) - qty);
    } else {
      prod.current_stock = (prod.current_stock || 0) + qty;
    }

    const newAdj = {
      id: 'adj-' + Date.now(),
      product_id,
      product_name: prod.name,
      adjustment_type,
      quantity: qty,
      reason: reason || 'Physical stock correction',
      date: date || getTodayDateString(),
      time: time || getCurrentTimeString(),
      recorded_by: 'Admin'
    };

    this.adjustments = [newAdj, ...this.adjustments];
    this.saveAll();
    return newAdj;
  }

  // --- CUSTOMER LEDGER ---
  getCustomerLedger(customerId) {
    const custSales = this.sales.filter((s) => s.customer_id === customerId);
    const custPayments = this.payments.filter((p) => p.customer_id === customerId && p.type === 'customer_payment');

    const entries = [];

    custSales.forEach((s) => {
      entries.push({
        id: s.id,
        date: s.date,
        time: s.time,
        type: 'SALE',
        reference: s.invoice_no,
        particulars: `Sale Invoice (${s.items.map((i) => `${i.product_name} x${i.quantity}`).join(', ')})`,
        debit: s.total_amount, // Customer owes us (Debit)
        credit: 0,
        rawTimestamp: new Date(`${s.date} ${s.time}`).getTime() || 0
      });
    });

    custPayments.forEach((p) => {
      entries.push({
        id: p.id,
        date: p.date,
        time: p.time,
        type: 'PAYMENT',
        reference: p.receipt_no,
        particulars: `Payment Received via ${p.payment_mode} ${p.reference_no ? '(' + p.reference_no + ')' : ''} ${p.notes ? '- ' + p.notes : ''}`,
        debit: 0,
        credit: p.amount, // Payment reduces balance (Credit)
        rawTimestamp: new Date(`${p.date} ${p.time}`).getTime() || 0
      });
    });

    // Chronological sort
    entries.sort((a, b) => a.rawTimestamp - b.rawTimestamp);

    // Compute running balance
    let runningBalance = 0;
    const ledger = entries.map((entry) => {
      runningBalance = runningBalance + entry.debit - entry.credit;
      return {
        ...entry,
        balance: runningBalance
      };
    });

    const totalSales = custSales.reduce((acc, s) => acc + (s.total_amount || 0), 0);
    const totalPaid = custPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const pendingBalance = totalSales - totalPaid;

    return {
      entries: ledger,
      totalSales,
      totalPaid,
      pendingBalance
    };
  }

  // --- SUPPLIER LEDGER ---
  getSupplierLedger(supplierId) {
    const suppPurchases = this.purchases.filter((p) => p.supplier_id === supplierId);
    const suppPayments = this.payments.filter((p) => p.supplier_id === supplierId && p.type === 'supplier_payment');

    const entries = [];

    suppPurchases.forEach((p) => {
      entries.push({
        id: p.id,
        date: p.date,
        time: p.time,
        type: 'PURCHASE',
        reference: p.purchase_no,
        particulars: `Purchase Inward (${p.items.map((i) => `${i.product_name} x${i.quantity}`).join(', ')})`,
        credit: p.total_amount, // We owe supplier (Credit)
        debit: 0,
        rawTimestamp: new Date(`${p.date} ${p.time}`).getTime() || 0
      });
    });

    suppPayments.forEach((pay) => {
      entries.push({
        id: pay.id,
        date: pay.date,
        time: pay.time,
        type: 'PAYMENT',
        reference: pay.receipt_no,
        particulars: `Payment Made via ${pay.payment_mode} ${pay.reference_no ? '(' + pay.reference_no + ')' : ''}`,
        credit: 0,
        debit: pay.amount, // Payment reduces our debt (Debit)
        rawTimestamp: new Date(`${pay.date} ${pay.time}`).getTime() || 0
      });
    });

    entries.sort((a, b) => a.rawTimestamp - b.rawTimestamp);

    let runningBalance = 0;
    const ledger = entries.map((entry) => {
      runningBalance = runningBalance + entry.credit - entry.debit;
      return {
        ...entry,
        balance: runningBalance
      };
    });

    const totalPurchases = suppPurchases.reduce((acc, p) => acc + (p.total_amount || 0), 0);
    const totalPaid = suppPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const pendingBalance = totalPurchases - totalPaid;

    return {
      entries: ledger,
      totalPurchases,
      totalPaid,
      pendingBalance
    };
  }

  // --- DAILY TRANSACTIONS / DAY BOOK (Roznamcha) ---
  getDayBook(dateStr) {
    const targetDate = dateStr || getTodayDateString();

    const salesToday = this.sales.filter((s) => s.date === targetDate);
    const purchasesToday = this.purchases.filter((p) => p.date === targetDate);
    const paymentsReceivedToday = this.payments.filter((p) => p.date === targetDate && p.type === 'customer_payment');
    const paymentsMadeToday = this.payments.filter((p) => p.date === targetDate && p.type === 'supplier_payment');
    const adjustmentsToday = this.adjustments.filter((a) => a.date === targetDate);

    const totalSalesAmount = salesToday.reduce((acc, s) => acc + (s.total_amount || 0), 0);
    const totalPurchasesAmount = purchasesToday.reduce((acc, p) => acc + (p.total_amount || 0), 0);
    const cashInflow = paymentsReceivedToday.reduce((acc, p) => acc + (p.amount || 0), 0);
    const cashOutflow = paymentsMadeToday.reduce((acc, p) => acc + (p.amount || 0), 0);
    const netCashMovement = cashInflow - cashOutflow;

    const allEvents = [
      ...salesToday.map((s) => {
        const cust = this.getCustomerById(s.customer_id);
        return {
          id: s.id,
          time: s.time,
          type: 'Customer Sale',
          badgeClass: 'badge-active',
          party: cust ? cust.name : 'Customer',
          details: s.items.map((i) => `${i.product_name} (${i.quantity})`).join(', '),
          amount: s.total_amount,
          amountType: 'receivable',
          reference: s.invoice_no,
          status: s.payment_status
        };
      }),
      ...purchasesToday.map((p) => {
        const supp = this.getSupplierById(p.supplier_id);
        return {
          id: p.id,
          time: p.time,
          type: 'Supplier Purchase',
          badgeClass: 'badge-partial',
          party: supp ? supp.company_name : 'Supplier',
          details: p.items.map((i) => `${i.product_name} (${i.quantity})`).join(', '),
          amount: p.total_amount,
          amountType: 'payable',
          reference: p.purchase_no,
          status: p.payment_status
        };
      }),
      ...paymentsReceivedToday.map((p) => {
        const cust = this.getCustomerById(p.customer_id);
        return {
          id: p.id,
          time: p.time,
          type: 'Customer Payment Inward',
          badgeClass: 'badge-paid',
          party: cust ? cust.name : 'Customer',
          details: `Mode: ${p.payment_mode} ${p.notes ? '• ' + p.notes : ''}`,
          amount: p.amount,
          amountType: 'inflow',
          reference: p.receipt_no,
          status: 'Received'
        };
      }),
      ...paymentsMadeToday.map((p) => {
        const supp = this.getSupplierById(p.supplier_id);
        return {
          id: p.id,
          time: p.time,
          type: 'Supplier Payment Outward',
          badgeClass: 'badge-pending',
          party: supp ? supp.company_name : 'Supplier',
          details: `Mode: ${p.payment_mode} ${p.notes ? '• ' + p.notes : ''}`,
          amount: p.amount,
          amountType: 'outflow',
          reference: p.receipt_no,
          status: 'Paid Out'
        };
      }),
      ...adjustmentsToday.map((a) => ({
        id: a.id,
        time: a.time,
        type: `Stock ${a.adjustment_type === 'increase' ? 'Addition' : 'Deduction'}`,
        badgeClass: 'badge-partial',
        party: 'Inventory Audit',
        details: `${a.product_name} (${a.adjustment_type === 'increase' ? '+' : '-'}${a.quantity}) - ${a.reason}`,
        amount: null,
        amountType: 'stock',
        reference: 'Stock Adj',
        status: 'Audited'
      }))
    ];

    allEvents.sort((a, b) => (b.time || '').localeCompare(a.time || ''));

    return {
      date: targetDate,
      totalSalesAmount,
      totalPurchasesAmount,
      cashInflow,
      cashOutflow,
      netCashMovement,
      events: allEvents
    };
  }

  // --- REVENUE & PROFIT REPORT ---
  getProfitReport() {
    let totalRevenue = 0;
    let totalEstimatedCost = 0;
    let totalUnitsSold = 0;

    const productSalesMap = {};
    const customerSalesMap = {};

    this.sales.forEach((s) => {
      totalRevenue += s.total_amount || 0;

      s.items.forEach((item) => {
        totalUnitsSold += item.quantity;
        const prod = this.getProductById(item.product_id);
        const costPrice = prod ? prod.purchase_price : 0;
        const itemCost = costPrice * item.quantity;
        totalEstimatedCost += itemCost;

        if (!productSalesMap[item.product_id]) {
          productSalesMap[item.product_id] = {
            id: item.product_id,
            name: item.product_name,
            units: 0,
            revenue: 0,
            cost: 0,
            profit: 0
          };
        }
        productSalesMap[item.product_id].units += item.quantity;
        productSalesMap[item.product_id].revenue += item.total;
        productSalesMap[item.product_id].cost += itemCost;
        productSalesMap[item.product_id].profit += (item.total - itemCost);
      });

      if (!customerSalesMap[s.customer_id]) {
        const cust = this.getCustomerById(s.customer_id);
        customerSalesMap[s.customer_id] = {
          id: s.customer_id,
          name: cust ? cust.name : 'Unknown',
          area: cust ? cust.area : '',
          totalRevenue: 0,
          ordersCount: 0
        };
      }
      customerSalesMap[s.customer_id].totalRevenue += s.total_amount;
      customerSalesMap[s.customer_id].ordersCount += 1;
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

    setStored(STORAGE_KEYS.PRODUCTS, this.products);
    setStored(STORAGE_KEYS.CUSTOMERS, this.customers);
    setStored(STORAGE_KEYS.SUPPLIERS, this.suppliers);
    setStored(STORAGE_KEYS.SALES, this.sales);
    setStored(STORAGE_KEYS.PURCHASES, this.purchases);
    setStored(STORAGE_KEYS.PAYMENTS, this.payments);
    setStored(STORAGE_KEYS.ADJUSTMENTS, this.adjustments);

    this.notify();
  }
}

export const dataService = new DataService();
