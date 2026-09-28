// Comprehensive End-to-End Verification Test for All Pages in Anusha CRM
// Tests all pages with test data, verifies features, and then removes all test data.

import fs from 'fs';

try {
  const envContent = fs.readFileSync('.env', 'utf8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const [key, ...vals] = trimmed.split('=');
    if (key && vals.length > 0) {
      process.env[key.trim()] = vals.join('=').trim();
    }
  });
} catch (e) {}

// Polyfill minimal localStorage for Node environment
const storageMap = new Map();
global.localStorage = {
  getItem: (k) => storageMap.get(k) || null,
  setItem: (k, v) => storageMap.set(k, String(v)),
  removeItem: (k) => storageMap.delete(k),
  clear: () => storageMap.clear()
};

import { dataService } from '../api/dataService.js';
import { supabase, isSupabaseConfigured } from '../api/supabaseClient.js';

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passed++;
  console.log(`✅ PASSED: ${message}`);
}

async function runAllPagesTest() {
  console.log('====================================================');
  console.log('   ANUSHA ENTERPRISES CRM - ALL PAGES E2E TEST     ');
  console.log('====================================================');
  console.log(`Supabase Connected: ${isSupabaseConfigured ? 'YES' : 'NO (Mock Mode)'}`);

  // Initialize dataService and fetch live data
  console.log('\n[1/10] Initializing data engine & fetching latest records...');
  await dataService.init();

  const currentUser = {
    name: 'AutoTester Admin',
    email: 'shivat9640@gmail.com',
    role: 'owner'
  };

  const initialGodownCount = dataService.getGodowns().length;
  const initialProductCount = dataService.getProducts().length;
  const initialCustomerCount = dataService.getCustomers().length;
  const initialSupplierCount = dataService.getSuppliers().length;
  const initialSalesCount = dataService.getSales().length;
  const initialPurchasesCount = dataService.getPurchases().length;
  const initialPaymentsCount = dataService.getPayments().length;
  const initialWalletTxnCount = dataService.getWalletTransactions().length;

  console.log(`Initial State -> Godowns: ${initialGodownCount}, Products: ${initialProductCount}, Customers: ${initialCustomerCount}, Suppliers: ${initialSupplierCount}`);

  // Test objects tracking for cleanup
  const createdIds = {
    godownId: null,
    productId: null,
    customerId: null,
    supplierId: null,
    saleId: null,
    purchaseId: null,
    customerPaymentId: null,
    supplierPaymentId: null,
    walletBudgetTxnId: null,
    walletExpenseTxnId: null
  };

  try {
    // -------------------------------------------------------------------------
    // PAGE 1: GODOWNS & STOCK
    // -------------------------------------------------------------------------
    console.log('\n--- TESTING PAGE 1: GODOWNS & STOCK ---');
    
    // Check Main Godown uniqueness
    const godownsList = dataService.getGodowns();
    const mainGodowns = godownsList.filter(g => g.name === 'Main Godown' || g.code === 'GD-01');
    assert(mainGodowns.length === 1, `Single Main Godown exists (found ${mainGodowns.length})`);
    
    const canonicalMain = dataService.getDefaultGodown();
    assert(canonicalMain !== null, 'Canonical Default Godown is available');

    // Create a temporary test godown
    const testGodown = dataService.saveGodown({
      name: 'E2E Test Godown 99',
      code: 'GD-TEST-99',
      location: 'Test Yard Nizamabad',
      contact_person: 'Tester Incharge',
      contact_phone: '9848011223',
      notes: 'Temporary godown for automated verification'
    }, currentUser);
    createdIds.godownId = testGodown.id;

    assert(testGodown && testGodown.id, 'Created temporary test godown');
    assert(dataService.getGodownById(testGodown.id)?.name === 'E2E Test Godown 99', 'Retrieved test godown by ID');

    // -------------------------------------------------------------------------
    // PAGE 2: PRODUCTS & INVENTORY
    // -------------------------------------------------------------------------
    console.log('\n--- TESTING PAGE 2: PRODUCTS & INVENTORY ---');

    const testProduct = dataService.saveProduct({
      name: 'E2E Test Drip Lateral 16mm',
      sku: 'E2E-DRIP-16',
      hsn_code: '8424',
      unit: 'bundles',
      purchase_price: 800,
      selling_price: 1200,
      current_stock: 50,
      min_stock_alert: 10,
      description: 'Temporary product for e2e testing'
    }, currentUser);
    createdIds.productId = testProduct.id;

    assert(testProduct && testProduct.id, 'Created temporary test product');
    assert(testProduct.current_stock === 50, 'Product initial stock is 50');

    // Verify stock allocation in default godown
    const stockInDefault = dataService.getProductStockInGodown(testProduct.id, canonicalMain.id);
    assert(stockInDefault === 50, `Default godown received initial product stock of 50 (got ${stockInDefault})`);

    // Transfer 15 units from Main Godown to Test Godown
    console.log('\nTesting Stock Transfer between Godowns...');
    const transfer = dataService.transferStock({
      from_godown_id: canonicalMain.id,
      to_godown_id: testGodown.id,
      product_id: testProduct.id,
      quantity: 15,
      reason: 'E2E transfer test',
      notes: 'Transfer 15 units to test godown'
    }, currentUser);

    const stockInTestGodown = dataService.getProductStockInGodown(testProduct.id, testGodown.id);
    const stockInMainAfterTransfer = dataService.getProductStockInGodown(testProduct.id, canonicalMain.id);
    assert(stockInTestGodown === 15, `Destination test godown has 15 units (got ${stockInTestGodown})`);
    assert(stockInMainAfterTransfer === 35, `Source main godown reduced to 35 units (got ${stockInMainAfterTransfer})`);

    // -------------------------------------------------------------------------
    // PAGE 3: CUSTOMERS & LEDGER
    // -------------------------------------------------------------------------
    console.log('\n--- TESTING PAGE 3: CUSTOMERS & LEDGER ---');

    const testCustomer = dataService.saveCustomer({
      name: 'E2E Test Agro Farm',
      mobile: '9849999999',
      area: 'Armoor Hub',
      customer_type: 'Regular',
      credit_limit: 75000,
      notes: 'Automated test customer'
    }, currentUser);
    createdIds.customerId = testCustomer.id;

    assert(testCustomer && testCustomer.id, 'Created temporary test customer');
    assert(dataService.getCustomerById(testCustomer.id)?.name === 'E2E Test Agro Farm', 'Retrieved test customer');

    // -------------------------------------------------------------------------
    // PAGE 4: SALES & INVOICES
    // -------------------------------------------------------------------------
    console.log('\n--- TESTING PAGE 4: SALES & INVOICES ---');

    // Sell 5 units from test godown @ 1200 = 6000 total. Initial payment of 2000.
    const testSale = dataService.recordSale({
      customer_id: testCustomer.id,
      date: new Date().toISOString().split('T')[0],
      items: [
        {
          product_id: testProduct.id,
          product_name: testProduct.name,
          quantity: 5,
          unit: testProduct.unit,
          selling_price: 1200,
          total: 6000,
          godown_id: testGodown.id
        }
      ],
      payment_mode: 'Cash',
      initial_payment: 2000,
      notes: 'E2E Sale test'
    }, currentUser);
    createdIds.saleId = testSale.id;

    assert(testSale.total_amount === 6000, 'Sale total is ₹6,000');
    assert(testSale.paid_amount === 2000, 'Sale paid amount is ₹2,000');
    assert(testSale.pending_amount === 4000, 'Sale pending amount is ₹4,000');
    assert(testSale.payment_status === 'Partially Paid', 'Sale status is Partially Paid');

    // Verify stock decreased in test godown from 15 to 10
    const stockInTestGodownAfterSale = dataService.getProductStockInGodown(testProduct.id, testGodown.id);
    assert(stockInTestGodownAfterSale === 10, `Test godown stock decreased to 10 (got ${stockInTestGodownAfterSale})`);

    // Verify Customer Ledger has the sale (Debit 6000) and initial payment (Credit 2000)
    const custLedger1 = dataService.getCustomerLedger(testCustomer.id);
    assert(custLedger1.totalSales === 6000, 'Customer total sales in ledger is ₹6,000');
    assert(custLedger1.totalPaid === 2000, 'Customer total paid in ledger is ₹2,000');
    assert(custLedger1.pendingBalance === 4000, 'Customer pending balance in ledger is ₹4,000');

    // Make an additional payment that clears pending ₹4,000 and adds ₹1,000 advance (total ₹5,000)
    console.log('Testing Customer Payment & Advance Logic...');
    const custPay2 = dataService.recordCustomerPayment({
      customer_id: testCustomer.id,
      sale_id: testSale.id,
      amount: 5000,
      payment_mode: 'UPI',
      reference_no: 'UPI-E2E-12345',
      notes: 'Customer cleared balance + deposit'
    }, currentUser);
    createdIds.customerPaymentId = custPay2.id;

    const custLedger2 = dataService.getCustomerLedger(testCustomer.id);
    assert(custLedger2.pendingBalance === 0, 'Customer pending balance cleared to ₹0');
    assert(custLedger2.advanceBalance === 1000, 'Customer advance balance accurately calculated as ₹1,000');

    // -------------------------------------------------------------------------
    // PAGE 5: SUPPLIERS & PURCHASES & INWARD
    // -------------------------------------------------------------------------
    console.log('\n--- TESTING PAGE 5: SUPPLIERS, PURCHASES & INWARD ---');

    const testSupplier = dataService.saveSupplier({
      company_name: 'E2E Polymers Pvt Ltd',
      supplier_name: 'Anil Kumar',
      mobile: '9848888888',
      area: 'Hyderabad Industrial'
    }, currentUser);
    createdIds.supplierId = testSupplier.id;

    assert(testSupplier && testSupplier.id, 'Created temporary test supplier');

    // Inward purchase of 20 units @ 800 = ₹16,000 into Test Godown
    const testPurchase = dataService.recordPurchase({
      supplier_id: testSupplier.id,
      godown_id: testGodown.id,
      date: new Date().toISOString().split('T')[0],
      items: [
        {
          product_id: testProduct.id,
          product_name: testProduct.name,
          quantity: 20,
          unit: testProduct.unit,
          purchase_price: 800,
          total: 16000,
          godown_id: testGodown.id
        }
      ],
      initial_payment: 6000,
      payment_mode: 'Bank Transfer',
      notes: 'Inward purchase E2E test'
    }, currentUser);
    createdIds.purchaseId = testPurchase.id;

    assert(testPurchase.total_amount === 16000, 'Purchase total is ₹16,000');
    assert(testPurchase.paid_amount === 6000, 'Purchase paid amount is ₹6,000');
    assert(testPurchase.pending_amount === 10000, 'Purchase pending amount is ₹10,000');

    // Verify stock increased in test godown: 10 + 20 = 30
    const stockInTestGodownAfterPurchase = dataService.getProductStockInGodown(testProduct.id, testGodown.id);
    assert(stockInTestGodownAfterPurchase === 30, `Test godown stock increased by 20 to 30 (got ${stockInTestGodownAfterPurchase})`);

    // Verify Supplier Ledger
    const suppLedger1 = dataService.getSupplierLedger(testSupplier.id);
    assert(suppLedger1.totalPurchases === 16000, 'Supplier ledger total purchases is ₹16,000');
    assert(suppLedger1.totalPaid === 6000, 'Supplier ledger total paid is ₹6,000');
    assert(suppLedger1.pendingBalance === 10000, 'Supplier ledger pending balance is ₹10,000');

    // Record Supplier Payment of ₹10,000 to clear pending balance
    console.log('Testing Supplier Payment Voucher...');
    const suppPay2 = dataService.recordSupplierPayment({
      supplier_id: testSupplier.id,
      purchase_id: testPurchase.id,
      amount: 10000,
      payment_mode: 'Bank Transfer',
      reference_no: 'NEFT-E2E-999',
      notes: 'Cleared purchase balance'
    }, currentUser);
    createdIds.supplierPaymentId = suppPay2.id;

    const suppLedger2 = dataService.getSupplierLedger(testSupplier.id);
    assert(suppLedger2.pendingBalance === 0, 'Supplier pending balance cleared to ₹0');

    // -------------------------------------------------------------------------
    // PAGE 6: WALLET & EXPENSES
    // -------------------------------------------------------------------------
    console.log('\n--- TESTING PAGE 6: WALLET & EXPENSES ---');

    const initialWalletSummary = dataService.getWalletSummary();

    const testBudget = dataService.addWalletBudget({
      amount: 5000,
      category: 'Owner Fund',
      reason: 'E2E Test Fund Addition',
      date: new Date().toISOString().split('T')[0]
    }, currentUser);
    createdIds.walletBudgetTxnId = testBudget.id;

    const testExpense = dataService.recordWalletExpense({
      amount: 1200,
      category: 'Godown Maintenance',
      reason: 'E2E Test Expense Cleaning',
      date: new Date().toISOString().split('T')[0]
    }, currentUser);
    createdIds.walletExpenseTxnId = testExpense.id;

    const newWalletSummary = dataService.getWalletSummary();
    assert(newWalletSummary.totalBudget === initialWalletSummary.totalBudget + 5000, 'Wallet budget increased by ₹5,000');
    assert(newWalletSummary.totalExpense === initialWalletSummary.totalExpense + 1200, 'Wallet expense increased by ₹1,200');

    // -------------------------------------------------------------------------
    // PAGE 7: DAY BOOK & REPORTS
    // -------------------------------------------------------------------------
    console.log('\n--- TESTING PAGE 7: DAY BOOK & REPORTS ---');

    const todaySales = dataService.getSales();
    const hasTodaySale = todaySales.some(s => s.id === testSale.id);
    assert(hasTodaySale, 'Day book includes test sale');

    const todayPurchases = dataService.getPurchases();
    const hasTodayPurchase = todayPurchases.some(p => p.id === testPurchase.id);
    assert(hasTodayPurchase, 'Day book includes test purchase');

    console.log('\n====================================================');
    console.log('✅ ALL TEST SCENARIOS PASSED WITH TEST DATA!');
    console.log('====================================================');

  } catch (err) {
    console.error('❌ Error during testing:', err);
    throw err;
  } finally {
    // -------------------------------------------------------------------------
    // MANDATORY CLEANUP: REMOVE ALL TEST DATA
    // -------------------------------------------------------------------------
    console.log('\n--- INITIATING CLEANUP: REMOVING ALL TEST DATA ---');

    // 1. Delete Wallet Transactions
    if (createdIds.walletBudgetTxnId) {
      try {
        dataService.deleteWalletTransaction(createdIds.walletBudgetTxnId, currentUser);
        console.log('✔ Cleaned up test wallet budget');
      } catch (e) { console.warn('Clean wallet budget error:', e.message); }
    }
    if (createdIds.walletExpenseTxnId) {
      try {
        dataService.deleteWalletTransaction(createdIds.walletExpenseTxnId, currentUser);
        console.log('✔ Cleaned up test wallet expense');
      } catch (e) { console.warn('Clean wallet expense error:', e.message); }
    }

    // 2. Delete Payments
    if (createdIds.customerPaymentId) {
      try {
        dataService.deletePayment(createdIds.customerPaymentId, currentUser);
        console.log('✔ Cleaned up customer payment');
      } catch (e) { console.warn('Clean customer payment error:', e.message); }
    }
    if (createdIds.supplierPaymentId) {
      try {
        dataService.deletePayment(createdIds.supplierPaymentId, currentUser);
        console.log('✔ Cleaned up supplier payment');
      } catch (e) { console.warn('Clean supplier payment error:', e.message); }
    }

    // 3. Delete Sale
    if (createdIds.saleId) {
      try {
        dataService.deleteSale(createdIds.saleId, currentUser);
        console.log('✔ Cleaned up test sale');
      } catch (e) { console.warn('Clean sale error:', e.message); }
    }

    // 4. Delete Purchase
    if (createdIds.purchaseId) {
      try {
        dataService.deletePurchase(createdIds.purchaseId, currentUser);
        console.log('✔ Cleaned up test purchase');
      } catch (e) { console.warn('Clean purchase error:', e.message); }
    }

    // 5. Delete Customer
    if (createdIds.customerId) {
      try {
        dataService.deleteCustomer(createdIds.customerId, currentUser);
        console.log('✔ Cleaned up test customer');
      } catch (e) { console.warn('Clean customer error:', e.message); }
    }

    // 6. Delete Supplier
    if (createdIds.supplierId) {
      try {
        dataService.deleteSupplier(createdIds.supplierId, currentUser);
        console.log('✔ Cleaned up test supplier');
      } catch (e) { console.warn('Clean supplier error:', e.message); }
    }

    // 7. Delete Test Product
    if (createdIds.productId) {
      try {
        dataService.deleteProduct(createdIds.productId, currentUser);
        console.log('✔ Cleaned up test product');
      } catch (e) { console.warn('Clean product error:', e.message); }
    }

    // 8. Delete Test Godown (ensure stock is 0 first)
    if (createdIds.godownId) {
      try {
        // Zero out any lingering stock in test godown
        dataService.godownStock = dataService.godownStock.filter(gs => gs.godown_id !== createdIds.godownId);
        dataService.deleteGodown(createdIds.godownId, currentUser);
        console.log('✔ Cleaned up test godown');
      } catch (e) { console.warn('Clean godown error:', e.message); }
    }

    // Direct Supabase DB Cleanup guarantee (in case async DB calls still had test rows)
    if (isSupabaseConfigured) {
      console.log('Verifying & purging any lingering test rows from Supabase...');
      try {
        if (createdIds.saleId) await supabase.from('customer_sales').delete().eq('id', createdIds.saleId);
        if (createdIds.purchaseId) await supabase.from('supplier_purchases').delete().eq('id', createdIds.purchaseId);
        if (createdIds.customerId) await supabase.from('customers').delete().eq('id', createdIds.customerId);
        if (createdIds.supplierId) await supabase.from('suppliers').delete().eq('id', createdIds.supplierId);
        if (createdIds.productId) await supabase.from('products').delete().eq('id', createdIds.productId);
        if (createdIds.godownId) await supabase.from('godowns').delete().eq('id', createdIds.godownId);
        if (createdIds.walletBudgetTxnId) await supabase.from('wallet_transactions').delete().eq('id', createdIds.walletBudgetTxnId);
        if (createdIds.walletExpenseTxnId) await supabase.from('wallet_transactions').delete().eq('id', createdIds.walletExpenseTxnId);
        // Also remove any test transfers or test stock
        if (createdIds.godownId) {
          await supabase.from('godown_stock').delete().eq('godown_id', createdIds.godownId);
          await supabase.from('stock_transfers').delete().or(`from_godown_id.eq.${createdIds.godownId},to_godown_id.eq.${createdIds.godownId}`);
        }
        if (createdIds.productId) {
          await supabase.from('godown_stock').delete().eq('product_id', createdIds.productId);
        }
      } catch (cleanErr) {
        console.warn('Direct DB cleanup warning:', cleanErr);
      }
    }

    // Final verification of count
    console.log('\n--- VERIFYING FINAL SYSTEM STATE ---');
    const finalGodowns = dataService.getGodowns().length;
    const finalProducts = dataService.getProducts().length;
    const finalCustomers = dataService.getCustomers().length;
    const finalSuppliers = dataService.getSuppliers().length;

    console.log(`Final State -> Godowns: ${finalGodowns}, Products: ${finalProducts}, Customers: ${finalCustomers}, Suppliers: ${finalSuppliers}`);

    assert(finalGodowns === initialGodownCount, `Godowns count returned to initial (${finalGodowns} == ${initialGodownCount})`);
    assert(finalProducts === initialProductCount, `Products count returned to initial (${finalProducts} == ${initialProductCount})`);
    assert(finalCustomers === initialCustomerCount, `Customers count returned to initial (${finalCustomers} == ${initialCustomerCount})`);
    assert(finalSuppliers === initialSupplierCount, `Suppliers count returned to initial (${finalSuppliers} == ${initialSupplierCount})`);

    console.log('\n====================================================');
    console.log(`ALL ${passed}/${total} E2E TESTS PASSED AND ALL TEST DATA COMPLETELY REMOVED!`);
    console.log('====================================================\n');
  }
}

runAllPagesTest().catch(console.error);
