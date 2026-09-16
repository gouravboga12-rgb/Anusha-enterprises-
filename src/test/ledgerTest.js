// Automated Verification Test for Anusha Enterprises CRM Data Engine & Ledger Logic

// Polyfill minimal localStorage for Node environment
const storageMap = new Map();
global.localStorage = {
  getItem: (k) => storageMap.get(k) || null,
  setItem: (k, v) => storageMap.set(k, String(v)),
  removeItem: (k) => storageMap.delete(k),
  clear: () => storageMap.clear()
};

import { dataService } from '../api/dataService.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passedTests++;
  console.log(`✅ PASSED: ${message}`);
}

console.log('--- STARTING ANUSHA CRM VERIFICATION TESTS ---');

// Reset to clean state for test
dataService.resetToInitialData();

// 1. Setup Test Entities
const testProduct = dataService.saveProduct({
  name: 'Ultra Poly Pipes 2.5 inch',
  sku: 'TEST-POLY-25',
  category: 'Pipes & Fittings',
  unit: 'pieces',
  purchase_price: 1000,
  selling_price: 1500,
  current_stock: 10,
  low_stock_threshold: 2
});

const testCustomer = dataService.saveCustomer({
  name: 'Kishan Reddy (Test Farm)',
  mobile: '9849012345',
  area: 'Nandipet South',
  customer_type: 'Regular',
  credit_limit: 50000
});

const testSupplier = dataService.saveSupplier({
  company_name: 'Deccan Pipe Industries (Test)',
  supplier_name: 'Ramesh Gupta',
  mobile: '9888800000',
  area: 'Nizamabad Industrial'
});

// Scenario 1: Sale of ₹15,000 (10 items @ 1500), initial payment of ₹5,000
console.log('\n--- TEST SCENARIO 1: Sale with initial partial payment ---');
const sale1 = dataService.recordSale({
  customer_id: testCustomer.id,
  items: [
    {
      product_id: testProduct.id,
      product_name: testProduct.name,
      quantity: 10,
      unit: testProduct.unit,
      selling_price: 1500,
      total: 15000
    }
  ],
  initial_payment: 5000,
  payment_mode: 'Cash',
  notes: 'First delivery to orchard'
});

assert(sale1.total_amount === 15000, 'Sale total_amount is ₹15,000');
assert(sale1.paid_amount === 5000, 'Sale paid_amount is ₹5,000');
assert(sale1.pending_amount === 10000, 'Sale pending_amount is ₹10,000');
assert(sale1.payment_status === 'Partially Paid', 'Sale status is Partially Paid');

// Check stock decreased by 10 (from 10 to 0)
const prodAfterSale = dataService.getProductById(testProduct.id);
assert(prodAfterSale.current_stock === 0, 'Inventory stock decreased from 10 to 0');

// Verify exactly one payment voucher created
const salePayments1 = dataService.getSalePayments(sale1.id);
assert(salePayments1.length === 1, 'Exactly 1 payment voucher created for initial payment');
assert(salePayments1[0].amount === 5000, 'First payment amount is ₹5,000');

// Scenario 2: Subsequent payment of ₹3,000 against this sale
console.log('\n--- TEST SCENARIO 2: Subsequent partial payment of ₹3,000 ---');
const pay2 = dataService.recordCustomerPayment({
  customer_id: testCustomer.id,
  amount: 3000,
  payment_mode: 'UPI / PhonePe',
  reference_no: 'UPI987654321',
  notes: 'Second installment via PhonePe',
  bill_reference: sale1.invoice_no,
  sale_id: sale1.id
});

const saleAfterPay2 = dataService.getSaleById(sale1.id);
assert(saleAfterPay2.paid_amount === 8000, 'Sale total paid updated to ₹8,000 (5000 + 3000)');
assert(saleAfterPay2.pending_amount === 7000, 'Sale pending updated to ₹7,000');
assert(saleAfterPay2.payment_status === 'Partially Paid', 'Sale status remains Partially Paid');

const salePayments2 = dataService.getSalePayments(sale1.id);
const amounts = salePayments2.map((p) => p.amount).sort((a, b) => a - b);
assert(amounts[0] === 3000 && amounts[1] === 5000, 'Payments include ₹3,000 and ₹5,000');

// Scenario 3: Delete second payment of ₹3,000 -> recalculates back to ₹5,000 paid & ₹10,000 pending
console.log('\n--- TEST SCENARIO 3: Delete payment voucher and verify recalculation ---');
dataService.deletePayment(pay2.id);

const saleAfterPay2Delete = dataService.getSaleById(sale1.id);
assert(saleAfterPay2Delete.paid_amount === 5000, 'Sale paid_amount returned to ₹5,000');
assert(saleAfterPay2Delete.pending_amount === 10000, 'Sale pending_amount returned to ₹10,000');
const salePaymentsAfterDelete = dataService.getSalePayments(sale1.id);
assert(salePaymentsAfterDelete.length === 1, 'Only 1 payment record remains');

// Scenario 4: Edit Bill items with delta stock management
// Stock is currently 0. Attempting to increase qty to 12 when stock is 0 would require 2 more items.
// Let's first test strict stock block on edit!
console.log('\n--- TEST SCENARIO 4: Strict stock validation on bill editing ---');
let editStockBlocked = false;
try {
  dataService.updateSale(sale1.id, {
    items: [
      {
        product_id: testProduct.id,
        product_name: testProduct.name,
        quantity: 12, // Needs 2 more, but stock is 0
        unit: testProduct.unit,
        selling_price: 1500,
        total: 18000
      }
    ]
  });
} catch (e) {
  editStockBlocked = true;
}
assert(editStockBlocked === true, 'Editing bill to exceed available stock was strictly blocked');

// Now let's add stock via purchase or adjustment and do a successful delta edit
console.log('\n--- TEST SCENARIO 5: Inward Purchase increases stock ---');
const pur1 = dataService.recordPurchase({
  supplier_id: testSupplier.id,
  items: [
    {
      product_id: testProduct.id,
      product_name: testProduct.name,
      quantity: 20,
      unit: testProduct.unit,
      purchase_price: 1000,
      total: 20000
    }
  ],
  initial_payment: 5000,
  payment_mode: 'Bank Transfer',
  notes: 'Bulk stock arrival'
});

assert(pur1.total_amount === 20000, 'Purchase total is ₹20,000');
assert(pur1.paid_amount === 5000, 'Purchase paid is ₹5,000');
assert(pur1.pending_amount === 15000, 'Purchase pending is ₹15,000');

const prodAfterPur = dataService.getProductById(testProduct.id);
assert(prodAfterPur.current_stock === 20, 'Stock increased by 20 (from 0 to 20)');

// Now edit sale1 to quantity 12 (needs +2 pieces). Available is 20, so 20 - 2 = 18.
console.log('\n--- TEST SCENARIO 6: Successful Sale Edit with delta stock adjustment ---');
const updatedSale = dataService.updateSale(sale1.id, {
  items: [
    {
      product_id: testProduct.id,
      product_name: testProduct.name,
      quantity: 12,
      unit: testProduct.unit,
      selling_price: 1500,
      total: 18000
    }
  ]
});

assert(updatedSale.total_amount === 18000, 'Updated sale total is ₹18,000');
assert(updatedSale.paid_amount === 5000, 'Sale paid_amount remained ₹5,000 (payments untouched)');
assert(updatedSale.pending_amount === 13000, 'Sale pending_amount updated to ₹13,000');

const prodAfterSaleEdit = dataService.getProductById(testProduct.id);
assert(prodAfterSaleEdit.current_stock === 18, 'Stock adjusted by delta (20 - 2 = 18)');

// Scenario 7: Edit Purchase items with delta stock management
// Decrease purchase quantity from 20 to 15 (delta is -5 pieces). Current stock is 18, should become 13.
console.log('\n--- TEST SCENARIO 7: Purchase Edit with delta stock reduction ---');
const updatedPur = dataService.updatePurchase(pur1.id, {
  items: [
    {
      product_id: testProduct.id,
      product_name: testProduct.name,
      quantity: 15,
      unit: testProduct.unit,
      purchase_price: 1000,
      total: 15000
    }
  ]
});

assert(updatedPur.total_amount === 15000, 'Updated purchase total is ₹15,000');
assert(updatedPur.paid_amount === 5000, 'Purchase paid remained ₹5,000');
assert(updatedPur.pending_amount === 10000, 'Purchase pending updated to ₹10,000');

const prodAfterPurEdit = dataService.getProductById(testProduct.id);
assert(prodAfterPurEdit.current_stock === 13, 'Stock adjusted by purchase delta (18 - 5 = 13)');

// Scenario 8: Strict stock validation on new sale (requesting 100 when 13 available)
console.log('\n--- TEST SCENARIO 8: Strict stock validation on new sale ---');
let saleOverstockBlocked = false;
try {
  dataService.recordSale({
    customer_id: testCustomer.id,
    items: [
      {
        product_id: testProduct.id,
        product_name: testProduct.name,
        quantity: 100, // 100 > 13 available
        unit: testProduct.unit,
        selling_price: 1500,
        total: 150000
      }
    ]
  });
} catch (e) {
  saleOverstockBlocked = true;
}
assert(saleOverstockBlocked === true, 'Sale exceeding available stock threw strict error');
const prodStockUntouched = dataService.getProductById(testProduct.id);
assert(prodStockUntouched.current_stock === 13, 'Stock remained untouched at 13');

// Scenario 9: Customer Ledger Verification
console.log('\n--- TEST SCENARIO 9: Customer Ledger Debit/Credit & Balance ---');
const custLedger = dataService.getCustomerLedger(testCustomer.id);
assert(custLedger.totalSales === 18000, 'Customer totalSales is ₹18,000');
assert(custLedger.totalPaid === 5000, 'Customer totalPaid is ₹5,000');
assert(custLedger.pendingBalance === 13000, 'Customer pendingBalance is ₹13,000');
// Verify entries: Sale (Debit ₹18,000), Payment (Credit ₹5,000)
const saleEntry = custLedger.entries.find((e) => e.type === 'SALE');
const payEntry = custLedger.entries.find((e) => e.type === 'PAYMENT');
assert(saleEntry && saleEntry.debit === 18000, 'Ledger sale entry has Debit = ₹18,000');
assert(payEntry && payEntry.credit === 5000, 'Ledger payment entry has Credit = ₹5,000');

// Scenario 10: Supplier Ledger Verification
console.log('\n--- TEST SCENARIO 10: Supplier Ledger Credit/Debit & Balance ---');
const suppLedger = dataService.getSupplierLedger(testSupplier.id);
assert(suppLedger.totalPurchases === 15000, 'Supplier totalPurchases is ₹15,000');
assert(suppLedger.totalPaid === 5000, 'Supplier totalPaid is ₹5,000');
assert(suppLedger.pendingBalance === 10000, 'Supplier pendingBalance is ₹10,000');
// Verify entries: Purchase (Credit ₹15,000), Payment (Debit ₹5,000)
const purEntry = suppLedger.entries.find((e) => e.type === 'PURCHASE');
const suppPayEntry = suppLedger.entries.find((e) => e.type === 'PAYMENT');
assert(purEntry && purEntry.credit === 15000, 'Supplier ledger purchase entry has Credit = ₹15,000');
assert(suppPayEntry && suppPayEntry.debit === 5000, 'Supplier ledger payment entry has Debit = ₹5,000');

console.log(`\n========================================`);
console.log(`ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
console.log(`========================================`);
