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

export const initialEmployees = [
  {
    "id": "emp-1",
    "name": "Ramesh Goud",
    "phone": "9848012345",
    "designation": "Delivery Van Driver",
    "base_salary": 20000,
    "payment_mode_preference": "Cash",
    "bank_details": "SBI A/C: 38291048291, IFSC: SBIN0001234",
    "joining_date": "2025-01-10",
    "status": "active",
    "notes": "Handles explosive delivery van AP-25-T-4590"
  },
  {
    "id": "emp-2",
    "name": "Suresh Kumar",
    "phone": "9849123456",
    "designation": "Godown In-Charge & Blaster Assistant",
    "base_salary": 25000,
    "payment_mode_preference": "PhonePe / UPI",
    "bank_details": "UPI: 9849123456@ybl (SBI Bank)",
    "joining_date": "2024-08-15",
    "status": "active",
    "notes": "Main Godown Nandipet operations & explosives loading"
  },
  {
    "id": "emp-3",
    "name": "Anil Reddy",
    "phone": "9440234567",
    "designation": "Senior Marketing & Sales Executive",
    "base_salary": 30000,
    "payment_mode_preference": "Bank Transfer (NEFT/IMPS)",
    "bank_details": "HDFC A/C: 501002349182, IFSC: HDFC0000123",
    "joining_date": "2024-02-01",
    "status": "active",
    "notes": "Quarry and stone crusher client relationship management"
  },
  {
    "id": "emp-4",
    "name": "Praveen Sharma",
    "phone": "9701834211",
    "designation": "Accountant & Billing Staff",
    "base_salary": 22000,
    "payment_mode_preference": "Bank Transfer",
    "bank_details": "ICICI A/C: 002301582910, IFSC: ICIC0000023",
    "joining_date": "2025-03-01",
    "status": "active",
    "notes": "Handles PESO records, daily sales billing, and GST compliance"
  },
  {
    "id": "emp-5",
    "name": "Mahesh Nayak",
    "phone": "9988776655",
    "designation": "Security Guard & Helper",
    "base_salary": 15000,
    "payment_mode_preference": "Cash",
    "bank_details": "Paid via Cash against signature voucher",
    "joining_date": "2025-02-15",
    "status": "active",
    "notes": "Night security shift and day packaging support"
  }
];

export const initialSalarySettlements = [
  {
    "id": "sal-101",
    "employee_id": "emp-1",
    "employee_name": "Ramesh Goud",
    "month_year": "2026-03",
    "base_salary": 20000,
    "advance_amount": 0,
    "advance_date": null,
    "advance_notes": "",
    "advance_history": [],
    "paid_amount": 20000,
    "payment_date": "2026-03-31",
    "payment_mode": "Cash",
    "reference_no": "VOUCHER-101",
    "payment_history": [
      {
        "id": "pay-101",
        "amount": 20000,
        "date": "2026-03-31",
        "payment_mode": "Cash",
        "reference_no": "VOUCHER-101",
        "notes": "Monthly salary cleared in full"
      }
    ],
    "net_payable": 20000,
    "pending_balance": 0,
    "status": "Paid",
    "notes": "Monthly salary cleared in full",
    "recorded_by": "Admin",
    "created_at": "2026-03-31T18:00:00.000Z",
    "updated_at": "2026-03-31T18:00:00.000Z"
  },
  {
    "id": "sal-102",
    "employee_id": "emp-1",
    "employee_name": "Ramesh Goud",
    "month_year": "2026-04",
    "base_salary": 20000,
    "advance_amount": 3000,
    "advance_date": "2026-04-12",
    "advance_notes": "Vehicle maintenance advance",
    "advance_history": [
      {
        "id": "adv-102",
        "amount": 3000,
        "date": "2026-04-12",
        "notes": "Vehicle maintenance advance",
        "payment_mode": "Cash"
      }
    ],
    "paid_amount": 17000,
    "payment_date": "2026-04-30",
    "payment_mode": "Cash",
    "reference_no": "VOUCHER-102",
    "payment_history": [
      {
        "id": "pay-102",
        "amount": 17000,
        "date": "2026-04-30",
        "payment_mode": "Cash",
        "reference_no": "VOUCHER-102",
        "notes": "Advance deducted, balance paid in cash"
      }
    ],
    "net_payable": 17000,
    "pending_balance": 0,
    "status": "Paid",
    "notes": "Advance deducted, balance paid in cash",
    "recorded_by": "Admin",
    "created_at": "2026-04-30T18:00:00.000Z",
    "updated_at": "2026-04-30T18:00:00.000Z"
  },
  {
    "id": "sal-103",
    "employee_id": "emp-1",
    "employee_name": "Ramesh Goud",
    "month_year": "2026-05",
    "base_salary": 20000,
    "advance_amount": 5000,
    "advance_date": "2026-05-10",
    "advance_notes": "Personal emergency loan",
    "advance_history": [
      {
        "id": "adv-103",
        "amount": 5000,
        "date": "2026-05-10",
        "notes": "Personal emergency loan",
        "payment_mode": "Cash"
      }
    ],
    "paid_amount": 15000,
    "payment_date": "2026-05-31",
    "payment_mode": "Cash",
    "reference_no": "VOUCHER-103",
    "payment_history": [
      {
        "id": "pay-103",
        "amount": 15000,
        "date": "2026-05-31",
        "payment_mode": "Cash",
        "reference_no": "VOUCHER-103",
        "notes": "Salary settled after advance deduction"
      }
    ],
    "net_payable": 15000,
    "pending_balance": 0,
    "status": "Paid",
    "notes": "Salary settled after advance deduction",
    "recorded_by": "Admin",
    "created_at": "2026-05-31T18:00:00.000Z",
    "updated_at": "2026-05-31T18:00:00.000Z"
  },
  {
    "id": "sal-104",
    "employee_id": "emp-1",
    "employee_name": "Ramesh Goud",
    "month_year": "2026-06",
    "base_salary": 20000,
    "advance_amount": 0,
    "advance_date": null,
    "advance_notes": "",
    "advance_history": [],
    "paid_amount": 20000,
    "payment_date": "2026-06-30",
    "payment_mode": "Cash",
    "reference_no": "VOUCHER-104",
    "payment_history": [
      {
        "id": "pay-104",
        "amount": 20000,
        "date": "2026-06-30",
        "payment_mode": "Cash",
        "reference_no": "VOUCHER-104",
        "notes": "Monthly salary cleared"
      }
    ],
    "net_payable": 20000,
    "pending_balance": 0,
    "status": "Paid",
    "notes": "Monthly salary cleared",
    "recorded_by": "Admin",
    "created_at": "2026-06-30T18:00:00.000Z",
    "updated_at": "2026-06-30T18:00:00.000Z"
  },
  {
    "id": "sal-105",
    "employee_id": "emp-1",
    "employee_name": "Ramesh Goud",
    "month_year": "2026-07",
    "base_salary": 20000,
    "advance_amount": 4000,
    "advance_date": "2026-07-15",
    "advance_notes": "Family medical expense advance",
    "advance_history": [
      {
        "id": "adv-105",
        "amount": 4000,
        "date": "2026-07-15",
        "notes": "Family medical expense advance",
        "payment_mode": "Cash"
      }
    ],
    "paid_amount": 16000,
    "payment_date": "2026-07-31",
    "payment_mode": "Cash",
    "reference_no": "VOUCHER-105",
    "payment_history": [
      {
        "id": "pay-105",
        "amount": 16000,
        "date": "2026-07-31",
        "payment_mode": "Cash",
        "reference_no": "VOUCHER-105",
        "notes": "Advance deducted"
      }
    ],
    "net_payable": 16000,
    "pending_balance": 0,
    "status": "Paid",
    "notes": "Advance deducted",
    "recorded_by": "Admin",
    "created_at": "2026-07-31T18:00:00.000Z",
    "updated_at": "2026-07-31T18:00:00.000Z"
  },
  {
    "id": "sal-106",
    "employee_id": "emp-1",
    "employee_name": "Ramesh Goud",
    "month_year": "2026-08",
    "base_salary": 20000,
    "advance_amount": 5000,
    "advance_date": "2026-08-18",
    "advance_notes": "School fees advance",
    "advance_history": [
      {
        "id": "adv-106",
        "amount": 5000,
        "date": "2026-08-18",
        "notes": "School fees advance",
        "payment_mode": "Cash"
      }
    ],
    "paid_amount": 15000,
    "payment_date": "2026-08-31",
    "payment_mode": "Cash",
    "reference_no": "VOUCHER-106",
    "payment_history": [
      {
        "id": "pay-106",
        "amount": 15000,
        "date": "2026-08-31",
        "payment_mode": "Cash",
        "reference_no": "VOUCHER-106",
        "notes": "Salary disbursed"
      }
    ],
    "net_payable": 15000,
    "pending_balance": 0,
    "status": "Paid",
    "notes": "Salary disbursed",
    "recorded_by": "Admin",
    "created_at": "2026-08-31T18:00:00.000Z",
    "updated_at": "2026-08-31T18:00:00.000Z"
  },
  {
    "id": "sal-107",
    "employee_id": "emp-1",
    "employee_name": "Ramesh Goud",
    "month_year": "2026-09",
    "base_salary": 20000,
    "advance_amount": 5000,
    "advance_date": "2026-09-08",
    "advance_notes": "Ganesh Chaturthi festival advance",
    "advance_history": [
      {
        "id": "adv-107",
        "amount": 5000,
        "date": "2026-09-08",
        "notes": "Ganesh Chaturthi festival advance",
        "payment_mode": "Cash"
      }
    ],
    "paid_amount": 15000,
    "payment_date": "2026-09-30",
    "payment_mode": "Cash",
    "reference_no": "VOUCHER-107",
    "payment_history": [
      {
        "id": "pay-107",
        "amount": 15000,
        "date": "2026-09-30",
        "payment_mode": "Cash",
        "reference_no": "VOUCHER-107",
        "notes": "Festival advance adjusted"
      }
    ],
    "net_payable": 15000,
    "pending_balance": 0,
    "status": "Paid",
    "notes": "Festival advance adjusted",
    "recorded_by": "Admin",
    "created_at": "2026-09-30T18:00:00.000Z",
    "updated_at": "2026-09-30T18:00:00.000Z"
  },
  {
    "id": "sal-108",
    "employee_id": "emp-1",
    "employee_name": "Ramesh Goud",
    "month_year": "2026-10",
    "base_salary": 20000,
    "advance_amount": 5000,
    "advance_date": "2026-10-05",
    "advance_notes": "Diwali advance taken",
    "advance_history": [
      {
        "id": "adv-108",
        "amount": 5000,
        "date": "2026-10-05",
        "notes": "Diwali advance taken",
        "payment_mode": "Cash"
      }
    ],
    "paid_amount": 10000,
    "payment_date": "2026-10-10",
    "payment_mode": "Cash",
    "reference_no": "VOUCHER-108",
    "payment_history": [
      {
        "id": "pay-108",
        "amount": 10000,
        "date": "2026-10-10",
        "payment_mode": "Cash",
        "reference_no": "VOUCHER-108",
        "notes": "Partial payment made, ₹5,000 pending due"
      }
    ],
    "net_payable": 15000,
    "pending_balance": 5000,
    "status": "Partially Paid",
    "notes": "Partial payment made, ₹5,000 pending due",
    "recorded_by": "Admin",
    "created_at": "2026-10-10T18:00:00.000Z",
    "updated_at": "2026-10-10T18:00:00.000Z"
  },
  {
    "id": "sal-109",
    "employee_id": "emp-2",
    "employee_name": "Suresh Kumar",
    "month_year": "2026-03",
    "base_salary": 25000,
    "advance_amount": 0,
    "advance_date": null,
    "advance_notes": "",
    "advance_history": [],
    "paid_amount": 25000,
    "payment_date": "2026-03-31",
    "payment_mode": "PhonePe / UPI",
    "reference_no": "UPI-REF-109",
    "payment_history": [
      {
        "id": "pay-109",
        "amount": 25000,
        "date": "2026-03-31",
        "payment_mode": "PhonePe / UPI",
        "reference_no": "UPI-REF-109",
        "notes": "Transferred via UPI to 9849123456@ybl"
      }
    ],
    "net_payable": 25000,
    "pending_balance": 0,
    "status": "Paid",
    "notes": "Transferred via UPI to 9849123456@ybl",
    "recorded_by": "Admin",
    "created_at": "2026-03-31T18:00:00.000Z",
    "updated_at": "2026-03-31T18:00:00.000Z"
  },
  {
    "id": "sal-110",
    "employee_id": "emp-2",
    "employee_name": "Suresh Kumar",
    "month_year": "2026-04",
    "base_salary": 25000,
    "advance_amount": 5000,
    "advance_date": "2026-04-10",
    "advance_notes": "Home repair advance",
    "advance_history": [
      {
        "id": "adv-110",
        "amount": 5000,
        "date": "2026-04-10",
        "notes": "Home repair advance",
        "payment_mode": "PhonePe / UPI"
      }
    ],
    "paid_amount": 20000,
    "payment_date": "2026-04-30",
    "payment_mode": "PhonePe / UPI",
    "reference_no": "UPI-REF-110",
    "payment_history": [
      {
        "id": "pay-110",
        "amount": 20000,
        "date": "2026-04-30",
        "payment_mode": "PhonePe / UPI",
        "reference_no": "UPI-REF-110",
        "notes": "UPI Ref: 610293847291"
      }
    ],
    "net_payable": 20000,
    "pending_balance": 0,
    "status": "Paid",
    "notes": "UPI Ref: 610293847291",
    "recorded_by": "Admin",
    "created_at": "2026-04-30T18:00:00.000Z",
    "updated_at": "2026-04-30T18:00:00.000Z"
  },
  {
    "id": "sal-111",
    "employee_id": "emp-2",
    "employee_name": "Suresh Kumar",
    "month_year": "2026-05",
    "base_salary": 25000,
    "advance_amount": 0,
    "advance_date": null,
    "advance_notes": "",
    "advance_history": [],
    "paid_amount": 25000,
    "payment_date": "2026-05-31",
    "payment_mode": "PhonePe / UPI",
    "reference_no": "UPI-REF-111",
    "payment_history": [
      {
        "id": "pay-111",
        "amount": 25000,
        "date": "2026-05-31",
        "payment_mode": "PhonePe / UPI",
        "reference_no": "UPI-REF-111",
        "notes": "Cleared via PhonePe"
      }
    ],
    "net_payable": 25000,
    "pending_balance": 0,
    "status": "Paid",
    "notes": "Cleared via PhonePe",
    "recorded_by": "Admin",
    "created_at": "2026-05-31T18:00:00.000Z",
    "updated_at": "2026-05-31T18:00:00.000Z"
  },
  {
    "id": "sal-112",
    "employee_id": "emp-2",
    "employee_name": "Suresh Kumar",
    "month_year": "2026-06",
    "base_salary": 25000,
    "advance_amount": 10000,
    "advance_date": "2026-06-08",
    "advance_notes": "Advance against agricultural equipment",
    "advance_history": [
      {
        "id": "adv-112",
        "amount": 10000,
        "date": "2026-06-08",
        "notes": "Advance against agricultural equipment",
        "payment_mode": "PhonePe / UPI"
      }
    ],
    "paid_amount": 15000,
    "payment_date": "2026-06-30",
    "payment_mode": "PhonePe / UPI",
    "reference_no": "UPI-REF-112",
    "payment_history": [
      {
        "id": "pay-112",
        "amount": 15000,
        "date": "2026-06-30",
        "payment_mode": "PhonePe / UPI",
        "reference_no": "UPI-REF-112",
        "notes": "Cleared"
      }
    ],
    "net_payable": 15000,
    "pending_balance": 0,
    "status": "Paid",
    "notes": "Cleared",
    "recorded_by": "Admin",
    "created_at": "2026-06-30T18:00:00.000Z",
    "updated_at": "2026-06-30T18:00:00.000Z"
  },
  {
    "id": "sal-113",
    "employee_id": "emp-2",
    "employee_name": "Suresh Kumar",
    "month_year": "2026-07",
    "base_salary": 25000,
    "advance_amount": 0,
    "advance_date": null,
    "advance_notes": "",
    "advance_history": [],
    "paid_amount": 25000,
    "payment_date": "2026-07-31",
    "payment_mode": "PhonePe / UPI",
    "reference_no": "UPI-REF-113",
    "payment_history": [
      {
        "id": "pay-113",
        "amount": 25000,
        "date": "2026-07-31",
        "payment_mode": "PhonePe / UPI",
        "reference_no": "UPI-REF-113",
        "notes": "Salary credited on time"
      }
    ],
    "net_payable": 25000,
    "pending_balance": 0,
    "status": "Paid",
    "notes": "Salary credited on time",
    "recorded_by": "Admin",
    "created_at": "2026-07-31T18:00:00.000Z",
    "updated_at": "2026-07-31T18:00:00.000Z"
  },
  {
    "id": "sal-114",
    "employee_id": "emp-2",
    "employee_name": "Suresh Kumar",
    "month_year": "2026-08",
    "base_salary": 25000,
    "advance_amount": 5000,
    "advance_date": "2026-08-12",
    "advance_notes": "Interim loan advance",
    "advance_history": [
      {
        "id": "adv-114",
        "amount": 5000,
        "date": "2026-08-12",
        "notes": "Interim loan advance",
        "payment_mode": "PhonePe / UPI"
      }
    ],
    "paid_amount": 20000,
    "payment_date": "2026-08-31",
    "payment_mode": "PhonePe / UPI",
    "reference_no": "UPI-REF-114",
    "payment_history": [
      {
        "id": "pay-114",
        "amount": 20000,
        "date": "2026-08-31",
        "payment_mode": "PhonePe / UPI",
        "reference_no": "UPI-REF-114",
        "notes": "Disbursed via UPI"
      }
    ],
    "net_payable": 20000,
    "pending_balance": 0,
    "status": "Paid",
    "notes": "Disbursed via UPI",
    "recorded_by": "Admin",
    "created_at": "2026-08-31T18:00:00.000Z",
    "updated_at": "2026-08-31T18:00:00.000Z"
  },
  {
    "id": "sal-115",
    "employee_id": "emp-2",
    "employee_name": "Suresh Kumar",
    "month_year": "2026-09",
    "base_salary": 25000,
    "advance_amount": 0,
    "advance_date": null,
    "advance_notes": "",
    "advance_history": [],
    "paid_amount": 25000,
    "payment_date": "2026-09-30",
    "payment_mode": "PhonePe / UPI",
    "reference_no": "UPI-REF-115",
    "payment_history": [
      {
        "id": "pay-115",
        "amount": 25000,
        "date": "2026-09-30",
        "payment_mode": "PhonePe / UPI",
        "reference_no": "UPI-REF-115",
        "notes": "September salary cleared"
      }
    ],
    "net_payable": 25000,
    "pending_balance": 0,
    "status": "Paid",
    "notes": "September salary cleared",
    "recorded_by": "Admin",
    "created_at": "2026-09-30T18:00:00.000Z",
    "updated_at": "2026-09-30T18:00:00.000Z"
  },
  {
    "id": "sal-116",
    "employee_id": "emp-2",
    "employee_name": "Suresh Kumar",
    "month_year": "2026-10",
    "base_salary": 25000,
    "advance_amount": 5000,
    "advance_date": "2026-10-02",
    "advance_notes": "Advance taken early for October",
    "advance_history": [
      {
        "id": "adv-116",
        "amount": 5000,
        "date": "2026-10-02",
        "notes": "Advance taken early for October",
        "payment_mode": "PhonePe / UPI"
      }
    ],
    "paid_amount": 20000,
    "payment_date": "2026-10-14",
    "payment_mode": "PhonePe / UPI",
    "reference_no": "UPI-REF-116",
    "payment_history": [
      {
        "id": "pay-116",
        "amount": 20000,
        "date": "2026-10-14",
        "payment_mode": "PhonePe / UPI",
        "reference_no": "UPI-REF-116",
        "notes": "Advance adjusted, balance fully settled"
      }
    ],
    "net_payable": 20000,
    "pending_balance": 0,
    "status": "Paid",
    "notes": "Advance adjusted, balance fully settled",
    "recorded_by": "Admin",
    "created_at": "2026-10-14T18:00:00.000Z",
    "updated_at": "2026-10-14T18:00:00.000Z"
  },
  {
    "id": "sal-117",
    "employee_id": "emp-3",
    "employee_name": "Anil Reddy",
    "month_year": "2026-03",
    "base_salary": 30000,
    "advance_amount": 0,
    "advance_date": null,
    "advance_notes": "",
    "advance_history": [],
    "paid_amount": 30000,
    "payment_date": "2026-03-31",
    "payment_mode": "Bank Transfer (NEFT/IMPS)",
    "reference_no": "NEFT-117",
    "payment_history": [
      {
        "id": "pay-117",
        "amount": 30000,
        "date": "2026-03-31",
        "payment_mode": "Bank Transfer (NEFT/IMPS)",
        "reference_no": "NEFT-117",
        "notes": "HDFC NEFT #N102948291"
      }
    ],
    "net_payable": 30000,
    "pending_balance": 0,
    "status": "Paid",
    "notes": "HDFC NEFT #N102948291",
    "recorded_by": "Admin",
    "created_at": "2026-03-31T18:00:00.000Z",
    "updated_at": "2026-03-31T18:00:00.000Z"
  },
  {
    "id": "sal-118",
    "employee_id": "emp-3",
    "employee_name": "Anil Reddy",
    "month_year": "2026-04",
    "base_salary": 30000,
    "advance_amount": 0,
    "advance_date": null,
    "advance_notes": "",
    "advance_history": [],
    "paid_amount": 30000,
    "payment_date": "2026-04-30",
    "payment_mode": "Bank Transfer (NEFT/IMPS)",
    "reference_no": "NEFT-118",
    "payment_history": [
      {
        "id": "pay-118",
        "amount": 30000,
        "date": "2026-04-30",
        "payment_mode": "Bank Transfer (NEFT/IMPS)",
        "reference_no": "NEFT-118",
        "notes": "NEFT Transfer cleared"
      }
    ],
    "net_payable": 30000,
    "pending_balance": 0,
    "status": "Paid",
    "notes": "NEFT Transfer cleared",
    "recorded_by": "Admin",
    "created_at": "2026-04-30T18:00:00.000Z",
    "updated_at": "2026-04-30T18:00:00.000Z"
  },
  {
    "id": "sal-119",
    "employee_id": "emp-3",
    "employee_name": "Anil Reddy",
    "month_year": "2026-05",
    "base_salary": 30000,
    "advance_amount": 5000,
    "advance_date": "2026-05-12",
    "advance_notes": "Field client tour advance",
    "advance_history": [
      {
        "id": "adv-119",
        "amount": 5000,
        "date": "2026-05-12",
        "notes": "Field client tour advance",
        "payment_mode": "Bank Transfer"
      }
    ],
    "paid_amount": 25000,
    "payment_date": "2026-05-31",
    "payment_mode": "Bank Transfer (NEFT/IMPS)",
    "reference_no": "NEFT-119",
    "payment_history": [
      {
        "id": "pay-119",
        "amount": 25000,
        "date": "2026-05-31",
        "payment_mode": "Bank Transfer (NEFT/IMPS)",
        "reference_no": "NEFT-119",
        "notes": "Advance deducted from salary"
      }
    ],
    "net_payable": 25000,
    "pending_balance": 0,
    "status": "Paid",
    "notes": "Advance deducted from salary",
    "recorded_by": "Admin",
    "created_at": "2026-05-31T18:00:00.000Z",
    "updated_at": "2026-05-31T18:00:00.000Z"
  },
  {
    "id": "sal-120",
    "employee_id": "emp-3",
    "employee_name": "Anil Reddy",
    "month_year": "2026-06",
    "base_salary": 30000,
    "advance_amount": 0,
    "advance_date": null,
    "advance_notes": "",
    "advance_history": [],
    "paid_amount": 30000,
    "payment_date": "2026-06-30",
    "payment_mode": "Bank Transfer (NEFT/IMPS)",
    "reference_no": "NEFT-120",
    "payment_history": [
      {
        "id": "pay-120",
        "amount": 30000,
        "date": "2026-06-30",
        "payment_mode": "Bank Transfer (NEFT/IMPS)",
        "reference_no": "NEFT-120",
        "notes": "IMPS Ref: 492019382190"
      }
    ],
    "net_payable": 30000,
    "pending_balance": 0,
    "status": "Paid",
    "notes": "IMPS Ref: 492019382190",
    "recorded_by": "Admin",
    "created_at": "2026-06-30T18:00:00.000Z",
    "updated_at": "2026-06-30T18:00:00.000Z"
  },
  {
    "id": "sal-121",
    "employee_id": "emp-3",
    "employee_name": "Anil Reddy",
    "month_year": "2026-07",
    "base_salary": 30000,
    "advance_amount": 0,
    "advance_date": null,
    "advance_notes": "",
    "advance_history": [],
    "paid_amount": 30000,
    "payment_date": "2026-07-31",
    "payment_mode": "Bank Transfer (NEFT/IMPS)",
    "reference_no": "NEFT-121",
    "payment_history": [
      {
        "id": "pay-121",
        "amount": 30000,
        "date": "2026-07-31",
        "payment_mode": "Bank Transfer (NEFT/IMPS)",
        "reference_no": "NEFT-121",
        "notes": "Salary credited"
      }
    ],
    "net_payable": 30000,
    "pending_balance": 0,
    "status": "Paid",
    "notes": "Salary credited",
    "recorded_by": "Admin",
    "created_at": "2026-07-31T18:00:00.000Z",
    "updated_at": "2026-07-31T18:00:00.000Z"
  },
  {
    "id": "sal-122",
    "employee_id": "emp-3",
    "employee_name": "Anil Reddy",
    "month_year": "2026-08",
    "base_salary": 30000,
    "advance_amount": 8000,
    "advance_date": "2026-08-10",
    "advance_notes": "Hospital medical emergency advance",
    "advance_history": [
      {
        "id": "adv-122",
        "amount": 8000,
        "date": "2026-08-10",
        "notes": "Hospital medical emergency advance",
        "payment_mode": "Bank Transfer"
      }
    ],
    "paid_amount": 22000,
    "payment_date": "2026-08-31",
    "payment_mode": "Bank Transfer (NEFT/IMPS)",
    "reference_no": "NEFT-122",
    "payment_history": [
      {
        "id": "pay-122",
        "amount": 22000,
        "date": "2026-08-31",
        "payment_mode": "Bank Transfer (NEFT/IMPS)",
        "reference_no": "NEFT-122",
        "notes": "Cleared via NEFT"
      }
    ],
    "net_payable": 22000,
    "pending_balance": 0,
    "status": "Paid",
    "notes": "Cleared via NEFT",
    "recorded_by": "Admin",
    "created_at": "2026-08-31T18:00:00.000Z",
    "updated_at": "2026-08-31T18:00:00.000Z"
  },
  {
    "id": "sal-123",
    "employee_id": "emp-3",
    "employee_name": "Anil Reddy",
    "month_year": "2026-09",
    "base_salary": 30000,
    "advance_amount": 0,
    "advance_date": null,
    "advance_notes": "",
    "advance_history": [],
    "paid_amount": 30000,
    "payment_date": "2026-09-30",
    "payment_mode": "Bank Transfer (NEFT/IMPS)",
    "reference_no": "NEFT-123",
    "payment_history": [
      {
        "id": "pay-123",
        "amount": 30000,
        "date": "2026-09-30",
        "payment_mode": "Bank Transfer (NEFT/IMPS)",
        "reference_no": "NEFT-123",
        "notes": "Cleared via NEFT"
      }
    ],
    "net_payable": 30000,
    "pending_balance": 0,
    "status": "Paid",
    "notes": "Cleared via NEFT",
    "recorded_by": "Admin",
    "created_at": "2026-09-30T18:00:00.000Z",
    "updated_at": "2026-09-30T18:00:00.000Z"
  },
  {
    "id": "sal-124",
    "employee_id": "emp-3",
    "employee_name": "Anil Reddy",
    "month_year": "2026-10",
    "base_salary": 30000,
    "advance_amount": 0,
    "advance_date": null,
    "advance_notes": "",
    "advance_history": [],
    "paid_amount": 25000,
    "payment_date": "2026-10-10",
    "payment_mode": "Bank Transfer (NEFT/IMPS)",
    "reference_no": "NEFT-124",
    "payment_history": [
      {
        "id": "pay-124",
        "amount": 25000,
        "date": "2026-10-10",
        "payment_mode": "Bank Transfer (NEFT/IMPS)",
        "reference_no": "NEFT-124",
        "notes": "₹25,000 paid via IMPS. Balance ₹5,000 due."
      }
    ],
    "net_payable": 30000,
    "pending_balance": 5000,
    "status": "Partially Paid",
    "notes": "₹25,000 paid via IMPS. Balance ₹5,000 due.",
    "recorded_by": "Admin",
    "created_at": "2026-10-10T18:00:00.000Z",
    "updated_at": "2026-10-10T18:00:00.000Z"
  },
  {
    "id": "sal-125",
    "employee_id": "emp-4",
    "employee_name": "Praveen Sharma",
    "month_year": "2026-03",
    "base_salary": 22000,
    "advance_amount": 0,
    "advance_date": null,
    "advance_notes": "",
    "advance_history": [],
    "paid_amount": 22000,
    "payment_date": "2026-03-31",
    "payment_mode": "Bank Transfer",
    "reference_no": "NEFT-125",
    "payment_history": [
      {
        "id": "pay-125",
        "amount": 22000,
        "date": "2026-03-31",
        "payment_mode": "Bank Transfer",
        "reference_no": "NEFT-125",
        "notes": "ICICI Bank Transfer cleared"
      }
    ],
    "net_payable": 22000,
    "pending_balance": 0,
    "status": "Paid",
    "notes": "ICICI Bank Transfer cleared",
    "recorded_by": "Admin",
    "created_at": "2026-03-31T18:00:00.000Z",
    "updated_at": "2026-03-31T18:00:00.000Z"
  },
  {
    "id": "sal-126",
    "employee_id": "emp-4",
    "employee_name": "Praveen Sharma",
    "month_year": "2026-04",
    "base_salary": 22000,
    "advance_amount": 0,
    "advance_date": null,
    "advance_notes": "",
    "advance_history": [],
    "paid_amount": 22000,
    "payment_date": "2026-04-30",
    "payment_mode": "Bank Transfer",
    "reference_no": "NEFT-126",
    "payment_history": [
      {
        "id": "pay-126",
        "amount": 22000,
        "date": "2026-04-30",
        "payment_mode": "Bank Transfer",
        "reference_no": "NEFT-126",
        "notes": "Direct bank deposit"
      }
    ],
    "net_payable": 22000,
    "pending_balance": 0,
    "status": "Paid",
    "notes": "Direct bank deposit",
    "recorded_by": "Admin",
    "created_at": "2026-04-30T18:00:00.000Z",
    "updated_at": "2026-04-30T18:00:00.000Z"
  },
  {
    "id": "sal-127",
    "employee_id": "emp-4",
    "employee_name": "Praveen Sharma",
    "month_year": "2026-05",
    "base_salary": 22000,
    "advance_amount": 0,
    "advance_date": null,
    "advance_notes": "",
    "advance_history": [],
    "paid_amount": 22000,
    "payment_date": "2026-05-31",
    "payment_mode": "Bank Transfer",
    "reference_no": "NEFT-127",
    "payment_history": [
      {
        "id": "pay-127",
        "amount": 22000,
        "date": "2026-05-31",
        "payment_mode": "Bank Transfer",
        "reference_no": "NEFT-127",
        "notes": "Direct bank deposit"
      }
    ],
    "net_payable": 22000,
    "pending_balance": 0,
    "status": "Paid",
    "notes": "Direct bank deposit",
    "recorded_by": "Admin",
    "created_at": "2026-05-31T18:00:00.000Z",
    "updated_at": "2026-05-31T18:00:00.000Z"
  },
  {
    "id": "sal-128",
    "employee_id": "emp-4",
    "employee_name": "Praveen Sharma",
    "month_year": "2026-06",
    "base_salary": 22000,
    "advance_amount": 0,
    "advance_date": null,
    "advance_notes": "",
    "advance_history": [],
    "paid_amount": 22000,
    "payment_date": "2026-06-30",
    "payment_mode": "Bank Transfer",
    "reference_no": "NEFT-128",
    "payment_history": [
      {
        "id": "pay-128",
        "amount": 22000,
        "date": "2026-06-30",
        "payment_mode": "Bank Transfer",
        "reference_no": "NEFT-128",
        "notes": "Direct bank deposit"
      }
    ],
    "net_payable": 22000,
    "pending_balance": 0,
    "status": "Paid",
    "notes": "Direct bank deposit",
    "recorded_by": "Admin",
    "created_at": "2026-06-30T18:00:00.000Z",
    "updated_at": "2026-06-30T18:00:00.000Z"
  },
  {
    "id": "sal-129",
    "employee_id": "emp-4",
    "employee_name": "Praveen Sharma",
    "month_year": "2026-07",
    "base_salary": 22000,
    "advance_amount": 0,
    "advance_date": null,
    "advance_notes": "",
    "advance_history": [],
    "paid_amount": 22000,
    "payment_date": "2026-07-31",
    "payment_mode": "Bank Transfer",
    "reference_no": "NEFT-129",
    "payment_history": [
      {
        "id": "pay-129",
        "amount": 22000,
        "date": "2026-07-31",
        "payment_mode": "Bank Transfer",
        "reference_no": "NEFT-129",
        "notes": "Direct bank deposit"
      }
    ],
    "net_payable": 22000,
    "pending_balance": 0,
    "status": "Paid",
    "notes": "Direct bank deposit",
    "recorded_by": "Admin",
    "created_at": "2026-07-31T18:00:00.000Z",
    "updated_at": "2026-07-31T18:00:00.000Z"
  },
  {
    "id": "sal-130",
    "employee_id": "emp-4",
    "employee_name": "Praveen Sharma",
    "month_year": "2026-08",
    "base_salary": 22000,
    "advance_amount": 0,
    "advance_date": null,
    "advance_notes": "",
    "advance_history": [],
    "paid_amount": 22000,
    "payment_date": "2026-08-31",
    "payment_mode": "Bank Transfer",
    "reference_no": "NEFT-130",
    "payment_history": [
      {
        "id": "pay-130",
        "amount": 22000,
        "date": "2026-08-31",
        "payment_mode": "Bank Transfer",
        "reference_no": "NEFT-130",
        "notes": "Direct bank deposit"
      }
    ],
    "net_payable": 22000,
    "pending_balance": 0,
    "status": "Paid",
    "notes": "Direct bank deposit",
    "recorded_by": "Admin",
    "created_at": "2026-08-31T18:00:00.000Z",
    "updated_at": "2026-08-31T18:00:00.000Z"
  },
  {
    "id": "sal-131",
    "employee_id": "emp-4",
    "employee_name": "Praveen Sharma",
    "month_year": "2026-09",
    "base_salary": 22000,
    "advance_amount": 0,
    "advance_date": null,
    "advance_notes": "",
    "advance_history": [],
    "paid_amount": 22000,
    "payment_date": "2026-09-30",
    "payment_mode": "Bank Transfer",
    "reference_no": "NEFT-131",
    "payment_history": [
      {
        "id": "pay-131",
        "amount": 22000,
        "date": "2026-09-30",
        "payment_mode": "Bank Transfer",
        "reference_no": "NEFT-131",
        "notes": "Direct bank deposit"
      }
    ],
    "net_payable": 22000,
    "pending_balance": 0,
    "status": "Paid",
    "notes": "Direct bank deposit",
    "recorded_by": "Admin",
    "created_at": "2026-09-30T18:00:00.000Z",
    "updated_at": "2026-09-30T18:00:00.000Z"
  },
  {
    "id": "sal-132",
    "employee_id": "emp-4",
    "employee_name": "Praveen Sharma",
    "month_year": "2026-10",
    "base_salary": 22000,
    "advance_amount": 0,
    "advance_date": null,
    "advance_notes": "",
    "advance_history": [],
    "paid_amount": 22000,
    "payment_date": "2026-10-10",
    "payment_mode": "Bank Transfer",
    "reference_no": "NEFT-132",
    "payment_history": [
      {
        "id": "pay-132",
        "amount": 22000,
        "date": "2026-10-10",
        "payment_mode": "Bank Transfer",
        "reference_no": "NEFT-132",
        "notes": "October salary cleared early"
      }
    ],
    "net_payable": 22000,
    "pending_balance": 0,
    "status": "Paid",
    "notes": "October salary cleared early",
    "recorded_by": "Admin",
    "created_at": "2026-10-10T18:00:00.000Z",
    "updated_at": "2026-10-10T18:00:00.000Z"
  },
  {
    "id": "sal-133",
    "employee_id": "emp-5",
    "employee_name": "Mahesh Nayak",
    "month_year": "2026-03",
    "base_salary": 15000,
    "advance_amount": 0,
    "advance_date": null,
    "advance_notes": "",
    "advance_history": [],
    "paid_amount": 15000,
    "payment_date": "2026-03-31",
    "payment_mode": "Cash",
    "reference_no": "VOUCHER-133",
    "payment_history": [
      {
        "id": "pay-133",
        "amount": 15000,
        "date": "2026-03-31",
        "payment_mode": "Cash",
        "reference_no": "VOUCHER-133",
        "notes": "Cash payment voucher signed"
      }
    ],
    "net_payable": 15000,
    "pending_balance": 0,
    "status": "Paid",
    "notes": "Cash payment voucher signed",
    "recorded_by": "Admin",
    "created_at": "2026-03-31T18:00:00.000Z",
    "updated_at": "2026-03-31T18:00:00.000Z"
  },
  {
    "id": "sal-134",
    "employee_id": "emp-5",
    "employee_name": "Mahesh Nayak",
    "month_year": "2026-04",
    "base_salary": 15000,
    "advance_amount": 2000,
    "advance_date": "2026-04-14",
    "advance_notes": "Ugadi festival advance",
    "advance_history": [
      {
        "id": "adv-134",
        "amount": 2000,
        "date": "2026-04-14",
        "notes": "Ugadi festival advance",
        "payment_mode": "Cash"
      }
    ],
    "paid_amount": 13000,
    "payment_date": "2026-04-30",
    "payment_mode": "Cash",
    "reference_no": "VOUCHER-134",
    "payment_history": [
      {
        "id": "pay-134",
        "amount": 13000,
        "date": "2026-04-30",
        "payment_mode": "Cash",
        "reference_no": "VOUCHER-134",
        "notes": "Cash settled"
      }
    ],
    "net_payable": 13000,
    "pending_balance": 0,
    "status": "Paid",
    "notes": "Cash settled",
    "recorded_by": "Admin",
    "created_at": "2026-04-30T18:00:00.000Z",
    "updated_at": "2026-04-30T18:00:00.000Z"
  },
  {
    "id": "sal-135",
    "employee_id": "emp-5",
    "employee_name": "Mahesh Nayak",
    "month_year": "2026-05",
    "base_salary": 15000,
    "advance_amount": 0,
    "advance_date": null,
    "advance_notes": "",
    "advance_history": [],
    "paid_amount": 15000,
    "payment_date": "2026-05-31",
    "payment_mode": "Cash",
    "reference_no": "VOUCHER-135",
    "payment_history": [
      {
        "id": "pay-135",
        "amount": 15000,
        "date": "2026-05-31",
        "payment_mode": "Cash",
        "reference_no": "VOUCHER-135",
        "notes": "Cash settled"
      }
    ],
    "net_payable": 15000,
    "pending_balance": 0,
    "status": "Paid",
    "notes": "Cash settled",
    "recorded_by": "Admin",
    "created_at": "2026-05-31T18:00:00.000Z",
    "updated_at": "2026-05-31T18:00:00.000Z"
  },
  {
    "id": "sal-136",
    "employee_id": "emp-5",
    "employee_name": "Mahesh Nayak",
    "month_year": "2026-06",
    "base_salary": 15000,
    "advance_amount": 3000,
    "advance_date": "2026-06-10",
    "advance_notes": "Personal advance",
    "advance_history": [
      {
        "id": "adv-136",
        "amount": 3000,
        "date": "2026-06-10",
        "notes": "Personal advance",
        "payment_mode": "Cash"
      }
    ],
    "paid_amount": 12000,
    "payment_date": "2026-06-30",
    "payment_mode": "Cash",
    "reference_no": "VOUCHER-136",
    "payment_history": [
      {
        "id": "pay-136",
        "amount": 12000,
        "date": "2026-06-30",
        "payment_mode": "Cash",
        "reference_no": "VOUCHER-136",
        "notes": "Cash settled"
      }
    ],
    "net_payable": 12000,
    "pending_balance": 0,
    "status": "Paid",
    "notes": "Cash settled",
    "recorded_by": "Admin",
    "created_at": "2026-06-30T18:00:00.000Z",
    "updated_at": "2026-06-30T18:00:00.000Z"
  },
  {
    "id": "sal-137",
    "employee_id": "emp-5",
    "employee_name": "Mahesh Nayak",
    "month_year": "2026-07",
    "base_salary": 15000,
    "advance_amount": 0,
    "advance_date": null,
    "advance_notes": "",
    "advance_history": [],
    "paid_amount": 15000,
    "payment_date": "2026-07-31",
    "payment_mode": "Cash",
    "reference_no": "VOUCHER-137",
    "payment_history": [
      {
        "id": "pay-137",
        "amount": 15000,
        "date": "2026-07-31",
        "payment_mode": "Cash",
        "reference_no": "VOUCHER-137",
        "notes": "Cash settled"
      }
    ],
    "net_payable": 15000,
    "pending_balance": 0,
    "status": "Paid",
    "notes": "Cash settled",
    "recorded_by": "Admin",
    "created_at": "2026-07-31T18:00:00.000Z",
    "updated_at": "2026-07-31T18:00:00.000Z"
  },
  {
    "id": "sal-138",
    "employee_id": "emp-5",
    "employee_name": "Mahesh Nayak",
    "month_year": "2026-08",
    "base_salary": 15000,
    "advance_amount": 3000,
    "advance_date": "2026-08-15",
    "advance_notes": "Rakhi festival advance",
    "advance_history": [
      {
        "id": "adv-138",
        "amount": 3000,
        "date": "2026-08-15",
        "notes": "Rakhi festival advance",
        "payment_mode": "Cash"
      }
    ],
    "paid_amount": 12000,
    "payment_date": "2026-08-31",
    "payment_mode": "Cash",
    "reference_no": "VOUCHER-138",
    "payment_history": [
      {
        "id": "pay-138",
        "amount": 12000,
        "date": "2026-08-31",
        "payment_mode": "Cash",
        "reference_no": "VOUCHER-138",
        "notes": "Cash settled"
      }
    ],
    "net_payable": 12000,
    "pending_balance": 0,
    "status": "Paid",
    "notes": "Cash settled",
    "recorded_by": "Admin",
    "created_at": "2026-08-31T18:00:00.000Z",
    "updated_at": "2026-08-31T18:00:00.000Z"
  },
  {
    "id": "sal-139",
    "employee_id": "emp-5",
    "employee_name": "Mahesh Nayak",
    "month_year": "2026-09",
    "base_salary": 15000,
    "advance_amount": 2000,
    "advance_date": "2026-09-05",
    "advance_notes": "Ganesh festival advance",
    "advance_history": [
      {
        "id": "adv-139",
        "amount": 2000,
        "date": "2026-09-05",
        "notes": "Ganesh festival advance",
        "payment_mode": "Cash"
      }
    ],
    "paid_amount": 13000,
    "payment_date": "2026-09-30",
    "payment_mode": "Cash",
    "reference_no": "VOUCHER-139",
    "payment_history": [
      {
        "id": "pay-139",
        "amount": 13000,
        "date": "2026-09-30",
        "payment_mode": "Cash",
        "reference_no": "VOUCHER-139",
        "notes": "Cash settled"
      }
    ],
    "net_payable": 13000,
    "pending_balance": 0,
    "status": "Paid",
    "notes": "Cash settled",
    "recorded_by": "Admin",
    "created_at": "2026-09-30T18:00:00.000Z",
    "updated_at": "2026-09-30T18:00:00.000Z"
  },
  {
    "id": "sal-140",
    "employee_id": "emp-5",
    "employee_name": "Mahesh Nayak",
    "month_year": "2026-10",
    "base_salary": 15000,
    "advance_amount": 0,
    "advance_date": null,
    "advance_notes": "",
    "advance_history": [],
    "paid_amount": 10000,
    "payment_date": "2026-10-10",
    "payment_mode": "Cash",
    "reference_no": "VOUCHER-140",
    "payment_history": [
      {
        "id": "pay-140",
        "amount": 10000,
        "date": "2026-10-10",
        "payment_mode": "Cash",
        "reference_no": "VOUCHER-140",
        "notes": "₹10,000 paid in cash. ₹5,000 due balance."
      }
    ],
    "net_payable": 15000,
    "pending_balance": 5000,
    "status": "Partially Paid",
    "notes": "₹10,000 paid in cash. ₹5,000 due balance.",
    "recorded_by": "Admin",
    "created_at": "2026-10-10T18:00:00.000Z",
    "updated_at": "2026-10-10T18:00:00.000Z"
  }
];
