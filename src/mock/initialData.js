// Initial Seed Data for Anusha Enterprises (Nandipet, Nizamabad)

export const initialProducts = [
  {
    id: 'prod-1',
    sku: 'MIN-IB-01',
    name: 'Ideal Boost',
    current_stock: 0,
    unit: 'units',
    purchase_price: 450,
    selling_price: 650,
    min_stock_alert: 20,
    is_active: true,
    image_url: '/products/ideal_boost.jpg',
    description: 'High-density cast pentolite booster for quarry rock blasting and opencast mining'
  },
  {
    id: 'prod-2',
    sku: 'MIN-IP90-02',
    name: 'Ideal Power90',
    current_stock: 0,
    unit: 'boxes',
    purchase_price: 820,
    selling_price: 1150,
    min_stock_alert: 15,
    is_active: true,
    image_url: '/products/ideal_power90.jpg',
    description: 'Cap-sensitive packaged emulsion explosive cartridges for rock fragmentation and quarrying'
  },
  {
    id: 'prod-3',
    sku: 'MIN-IC-03',
    name: 'Ideal Cord',
    current_stock: 0,
    unit: 'reels',
    purchase_price: 1250,
    selling_price: 1750,
    min_stock_alert: 10,
    is_active: true,
    image_url: '/products/ideal_cord.jpg',
    description: 'High-velocity flexible detonating cord reel (10g/m) with PETN core for mining blasts'
  },
  {
    id: 'prod-4',
    sku: 'MIN-SEP-04',
    name: 'Solar EcoPrime',
    current_stock: 0,
    unit: 'boxes',
    purchase_price: 2100,
    selling_price: 2900,
    min_stock_alert: 10,
    is_active: true,
    image_url: '/products/solar_ecoprime.png',
    description: 'High-strength bulk/packaged emulsion booster explosive from Solar Industries India Ltd'
  },
  {
    id: 'prod-5',
    sku: 'MIN-STB-05',
    name: 'Salvo Thunderbolt',
    current_stock: 0,
    unit: 'boxes',
    purchase_price: 620,
    selling_price: 890,
    min_stock_alert: 25,
    is_active: true,
    image_url: '/products/salvo_thunderbolt.png',
    description: 'High-velocity quarrying booster explosive cartridge from Salvo Explosives & Chemicals'
  },
  {
    id: 'prod-6',
    sku: 'MIN-SRI-06',
    name: 'Sridet',
    current_stock: 0,
    unit: 'pieces',
    purchase_price: 85,
    selling_price: 125,
    min_stock_alert: 30,
    is_active: true,
    image_url: '/products/sridet.jpg',
    description: 'Non-electric shock tube delay detonator system by Ideal Detonators Pvt Ltd for precision blast timing'
  }
];

export const initialCustomers = [
  {
    id: 'cust-1',
    customer_id: 'CUST-101',
    name: 'Sri Sai Electricals & Hardware',
    mobile: '9848012345',
    area: 'Nandipet Main Road',
    address: 'Shop #4, Near Bus Stand, Nandipet, Nizamabad',
    status: 'active',
    notes: 'Regular dealer, usually pays within 15 days via PhonePe/UPI'
  },
  {
    id: 'cust-2',
    customer_id: 'CUST-102',
    name: 'Ramesh Agro & Power',
    mobile: '9440567890',
    area: 'Armoor',
    address: 'Near Old Market Yard, Armoor, Nizamabad Dist.',
    status: 'active',
    notes: 'Bulk purchaser of Solar Eco Prime and Ideal Core units'
  },
  {
    id: 'cust-3',
    customer_id: 'CUST-103',
    name: 'Venkateshwara Enterprises',
    mobile: '9989011223',
    area: 'Nizamabad Town',
    address: 'Khaleelwadi, Nizamabad',
    status: 'active',
    notes: 'Wholesale buyer, partial payments recorded on delivery'
  },
  {
    id: 'cust-4',
    customer_id: 'CUST-104',
    name: 'Balaji Hardware & Electricals',
    mobile: '9849198765',
    area: 'Bodhan Road',
    address: 'Shop 12, Main Bazaar, Bodhan',
    status: 'active',
    notes: 'Prompt payer'
  }
];

export const initialSuppliers = [
  {
    id: 'supp-1',
    supplier_id: 'SUPP-001',
    company_name: 'Ideal Tech Industries Ltd',
    supplier_name: 'Srinivas Rao (Account Mgr)',
    mobile: '9866123456',
    area: 'Hyderabad Industrial Estate',
    address: 'Plot 45, Jeedimetla Phase 2, Hyderabad',
    notes: 'Primary supplier for Ideal Boost Box and Ideal Power 90'
  },
  {
    id: 'supp-2',
    supplier_id: 'SUPP-002',
    company_name: 'Solar Eco Prime Distributorship',
    supplier_name: 'Amit Agarwal',
    mobile: '9701234890',
    area: 'Secunderabad',
    address: 'MG Road, Secunderabad',
    notes: 'Delivers in bulk every 3 weeks'
  },
  {
    id: 'supp-3',
    supplier_id: 'SUPP-003',
    company_name: 'Salvo Power Components Ltd',
    supplier_name: 'Rajesh Sharma',
    mobile: '9490123789',
    area: 'Mumbai Hub',
    address: 'Andheri East, MIDC, Mumbai',
    notes: 'Supplies Salvo Thunderbolt and 3D Junction Boxes'
  }
];

export const initialSales = [
  {
    id: 'sale-1',
    invoice_no: 'INV-2026-001',
    customer_id: 'cust-1',
    date: '2026-09-14',
    time: '11:15 AM',
    items: [
      { product_id: 'prod-1', product_name: 'Ideal Boost Box', quantity: 50, selling_price: 650, total: 32500 },
      { product_id: 'prod-2', product_name: 'Ideal Power 90', quantity: 15, selling_price: 1150, total: 17250 }
    ],
    total_amount: 49750,
    paid_amount: 35000,
    pending_amount: 14750,
    payment_status: 'Partially Paid',
    recorded_by: 'Admin',
    notes: 'Delivered via auto freight to Nandipet shop'
  },
  {
    id: 'sale-2',
    invoice_no: 'INV-2026-002',
    customer_id: 'cust-2',
    date: '2026-09-15',
    time: '03:45 PM',
    items: [
      { product_id: 'prod-4', product_name: 'Solar Eco Prime', quantity: 10, selling_price: 2900, total: 29000 },
      { product_id: 'prod-5', product_name: 'Salvo Thunderbolt', quantity: 20, selling_price: 890, total: 17800 }
    ],
    total_amount: 46800,
    paid_amount: 46800,
    pending_amount: 0,
    payment_status: 'Paid',
    recorded_by: 'Admin',
    notes: 'Full payment cleared by UPI'
  },
  {
    id: 'sale-3',
    invoice_no: 'INV-2026-003',
    customer_id: 'cust-3',
    date: '2026-09-16',
    time: '10:30 AM',
    items: [
      { product_id: 'prod-6', product_name: '3D', quantity: 40, selling_price: 460, total: 18400 }
    ],
    total_amount: 18400,
    paid_amount: 10000,
    pending_amount: 8400,
    payment_status: 'Partially Paid',
    recorded_by: 'Admin',
    notes: 'Today sale - advance received'
  }
];

export const initialPurchases = [
  {
    id: 'pur-1',
    purchase_no: 'PUR-2026-001',
    supplier_id: 'supp-1',
    date: '2026-09-12',
    time: '09:30 AM',
    items: [
      { product_id: 'prod-1', product_name: 'Ideal Boost Box', quantity: 100, purchase_price: 450, total: 45000 },
      { product_id: 'prod-2', product_name: 'Ideal Power 90', quantity: 50, purchase_price: 820, total: 41000 }
    ],
    total_amount: 86000,
    paid_amount: 86000,
    pending_amount: 0,
    payment_status: 'Paid',
    recorded_by: 'Admin',
    notes: 'Received in good condition via VRL Logistics'
  },
  {
    id: 'pur-2',
    purchase_no: 'PUR-2026-002',
    supplier_id: 'supp-2',
    date: '2026-09-15',
    time: '01:20 PM',
    items: [
      { product_id: 'prod-4', product_name: 'Solar Eco Prime', quantity: 25, purchase_price: 2100, total: 52500 }
    ],
    total_amount: 52500,
    paid_amount: 30000,
    pending_amount: 22500,
    payment_status: 'Partially Paid',
    recorded_by: 'Admin',
    notes: 'First installment paid on truck arrival'
  }
];

export const initialPayments = [
  {
    id: 'pay-1',
    receipt_no: 'RCPT-1001',
    type: 'customer_payment',
    customer_id: 'cust-1',
    sale_id: 'sale-1',
    amount: 20000,
    payment_mode: 'UPI',
    reference_no: 'UPI/260914/89123',
    date: '2026-09-14',
    time: '11:20 AM',
    notes: '1st Installment received at time of billing',
    recorded_by: 'Admin'
  },
  {
    id: 'pay-2',
    receipt_no: 'RCPT-1002',
    type: 'customer_payment',
    customer_id: 'cust-1',
    sale_id: 'sale-1',
    amount: 15000,
    payment_mode: 'Cash',
    reference_no: '',
    date: '2026-09-15',
    time: '04:10 PM',
    notes: '2nd Installment paid at Nandipet office',
    recorded_by: 'Admin'
  },
  {
    id: 'pay-3',
    receipt_no: 'RCPT-1003',
    type: 'customer_payment',
    customer_id: 'cust-2',
    sale_id: 'sale-2',
    amount: 46800,
    payment_mode: 'Bank Transfer',
    reference_no: 'NEFT/HDFC/99120',
    date: '2026-09-15',
    time: '03:50 PM',
    notes: 'Full bill clearance',
    recorded_by: 'Admin'
  },
  {
    id: 'pay-4',
    receipt_no: 'RCPT-1004',
    type: 'customer_payment',
    customer_id: 'cust-3',
    sale_id: 'sale-3',
    amount: 10000,
    payment_mode: 'UPI',
    reference_no: 'UPI/260916/11094',
    date: '2026-09-16',
    time: '10:35 AM',
    notes: 'Advance installment for 3D boxes',
    recorded_by: 'Admin'
  },
  {
    id: 'pay-5',
    receipt_no: 'VCHR-2001',
    type: 'supplier_payment',
    supplier_id: 'supp-1',
    purchase_id: 'pur-1',
    amount: 50000,
    payment_mode: 'Bank Transfer',
    reference_no: 'RTGS/SBI/55123',
    date: '2026-09-12',
    time: '10:00 AM',
    notes: 'Payment 1 of 2 against PUR-001',
    recorded_by: 'Admin'
  },
  {
    id: 'pay-6',
    receipt_no: 'VCHR-2002',
    type: 'supplier_payment',
    supplier_id: 'supp-1',
    purchase_id: 'pur-1',
    amount: 36000,
    payment_mode: 'Bank Transfer',
    reference_no: 'RTGS/SBI/55890',
    date: '2026-09-13',
    time: '02:30 PM',
    notes: 'Balance cleared for PUR-001',
    recorded_by: 'Admin'
  },
  {
    id: 'pay-7',
    receipt_no: 'VCHR-2003',
    type: 'supplier_payment',
    supplier_id: 'supp-2',
    purchase_id: 'pur-2',
    amount: 30000,
    payment_mode: 'UPI',
    reference_no: 'UPI/260915/77889',
    date: '2026-09-15',
    time: '01:30 PM',
    notes: 'Advance for Solar Eco Prime batch',
    recorded_by: 'Admin'
  }
];

export const initialAdjustments = [
  {
    id: 'adj-1',
    product_id: 'prod-5',
    product_name: 'Salvo Thunderbolt',
    adjustment_type: 'decrease',
    quantity: 2,
    reason: 'Damaged products (Transit dent during monsoon)',
    date: '2026-09-14',
    time: '05:00 PM',
    recorded_by: 'Admin'
  },
  {
    id: 'adj-2',
    product_id: 'prod-1',
    product_name: 'Ideal Boost Box',
    adjustment_type: 'increase',
    quantity: 5,
    reason: 'Physical stock correction (Recount discovered extra unopened box)',
    date: '2026-09-16',
    time: '09:00 AM',
    recorded_by: 'Admin'
  }
];
