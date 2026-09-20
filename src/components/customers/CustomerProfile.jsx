import React, { useState } from 'react';
import {
  ArrowLeft,
  Phone,
  MapPin,
  FileText,
  PlusCircle,
  Receipt,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Trash2,
  Edit
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const CustomerProfile = ({
  customerId,
  dataService,
  currentUser,
  onBack,
  onOpenNewSale,
  onOpenPayment,
  onEditCustomer,
  onViewBillDetails,
  onEditSale
}) => {
  const [activeTab, setActiveTab] = useState('ledger');

  const customer = dataService.getCustomerById(customerId);
  if (!customer) {
    return (
      <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
        <p>Customer account not found or was deleted.</p>
        <button className="btn btn-secondary" onClick={onBack} style={{ marginTop: '12px' }}>
          <ArrowLeft size={16} /> Back to Customer List
        </button>
      </div>
    );
  }

  const ledgerData = dataService.getCustomerLedger(customerId);
  const sales = dataService.getSales().filter((s) => s.customer_id === customerId);
  const payments = dataService.getPayments().filter((p) => p.customer_id === customerId && p.type === 'customer_payment');

  const handleDeleteCustomer = async () => {
    const warning = ledgerData.pendingBalance > 0
      ? `\n\nWarning: This customer still has a pending balance of ₹${ledgerData.pendingBalance.toLocaleString()}!`
      : '';
    if (window.confirm(`Are you sure you want to delete customer "${customer.name}"?${warning}\n\nThis will remove their profile and all transactions.`)) {
      try {
        await dataService.deleteCustomer(customerId, currentUser);
        onBack();
      } catch (err) {
        alert(err.message || 'Failed to delete customer');
      }
    }
  };

  const handleDeleteSale = async (sale) => {
    if (window.confirm(`Delete Sale Bill ${sale.invoice_no} (${formatCurrency(sale.total_amount)})?\n\nThis will automatically return the sold items back to your product inventory and remove the bill from the customer ledger.`)) {
      try {
        await dataService.deleteSale(sale.id, currentUser);
      } catch (err) {
        alert(err.message || 'Failed to delete sale bill');
      }
    }
  };

  const handleDeletePayment = async (payment) => {
    if (window.confirm(`Delete Payment Receipt ${payment.receipt_no} (${formatCurrency(payment.amount)})?\n\nThis will recalculate the customer's pending balance.`)) {
      try {
        await dataService.deletePayment(payment.id, currentUser);
      } catch (err) {
        alert(err.message || 'Failed to delete payment receipt');
      }
    }
  };

  return (
    <div>
      {/* Top navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={onBack}
        >
          <ArrowLeft size={15} /> Back to Customers
        </button>

        <div style={{ display: 'flex', gap: '8px' }}>
          {onEditCustomer && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onEditCustomer(customer)}
              title="Edit customer details"
            >
              <Edit size={14} /> Edit Customer
            </button>
          )}
          <button
            className="btn btn-danger btn-sm"
            style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' }}
            onClick={handleDeleteCustomer}
            title="Delete this customer account"
          >
            <Trash2 size={14} /> Delete Customer
          </button>
        </div>
      </div>

      {/* Profile Header Card */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '16px',
          marginBottom: '16px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-active">{customer.customer_id}</span>
              <h1 style={{ fontSize: '22px' }}>{customer.name}</h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px', flexWrap: 'wrap', color: '#64748b', fontSize: '13px' }}>
              {customer.mobile && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Phone size={14} color="#0284c7" /> {customer.mobile}
                </span>
              )}
              {customer.area && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={14} color="#0284c7" /> {customer.area}
                </span>
              )}
            </div>
            {customer.address && (
              <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                {customer.address}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => onOpenNewSale(customer.id)}
            >
              <PlusCircle size={15} /> New Sale Bill
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                const pendingSales = sales.filter((s) => s.pending_amount > 0);
                const firstSaleId = pendingSales.length > 0 ? pendingSales[0].id : '';
                onOpenPayment(customer.id, 'customer', firstSaleId);
              }}
            >
              <Receipt size={15} color="#0284c7" /> Collect Payment
            </button>
          </div>
        </div>

        {/* Account Financial Balance Summary */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px'
        }}>
          <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>TOTAL BILLED</span>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
              {formatCurrency(ledgerData.totalSales)}
            </div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Across {sales.length} invoices</span>
          </div>

          <div style={{ background: '#ecfdf5', padding: '12px 16px', borderRadius: '10px', border: '1px solid #a7f3d0' }}>
            <span style={{ fontSize: '11px', color: '#047857', fontWeight: 600 }}>TOTAL RECEIVED</span>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#065f46', marginTop: '2px' }}>
              {formatCurrency(ledgerData.totalPaid)}
            </div>
            <span style={{ fontSize: '11px', color: '#047857' }}>{payments.length} payment installments</span>
          </div>

          <div style={{
            background: ledgerData.pendingBalance > 0 ? '#fff1f2' : '#f8fafc',
            padding: '12px 16px',
            borderRadius: '10px',
            border: `1px solid ${ledgerData.pendingBalance > 0 ? '#fecdd3' : '#e2e8f0'}`
          }}>
            <span style={{ fontSize: '11px', color: ledgerData.pendingBalance > 0 ? '#be123c' : '#64748b', fontWeight: 600 }}>
              PENDING BALANCE
            </span>
            <div style={{
              fontSize: '18px',
              fontWeight: 800,
              color: ledgerData.pendingBalance > 0 ? '#e11d48' : '#10b981',
              marginTop: '2px'
            }}>
              {formatCurrency(ledgerData.pendingBalance)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
              <span style={{ fontSize: '11px', color: ledgerData.pendingBalance > 0 ? '#be123c' : '#10b981' }}>
                {ledgerData.pendingBalance > 0 ? 'Due for collection' : 'All accounts settled'}
              </span>
              {ledgerData.pendingBalance > 0 && (
                <button
                  className="btn btn-sm"
                  style={{
                    background: '#e11d48',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                    padding: '2px 8px',
                    fontSize: '11px'
                  }}
                  onClick={() => {
                    const pendingSales = sales.filter((s) => s.pending_amount > 0);
                    const firstSaleId = pendingSales.length > 0 ? pendingSales[0].id : '';
                    onOpenPayment && onOpenPayment(customer.id, 'customer', firstSaleId);
                  }}
                >
                  <Receipt size={12} /> Collect Due
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="profile-tabs-nav" style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
        <button
          className={`btn btn-sm ${activeTab === 'ledger' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('ledger')}
        >
          <BookOpen size={15} /> Customer Digital Ledger
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'sales' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('sales')}
        >
          <FileText size={15} /> Sales History ({sales.length})
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'payments' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('payments')}
        >
          <Receipt size={15} /> Payment History ({payments.length})
        </button>
      </div>

      {/* TAB 1: LEDGER */}
      {activeTab === 'ledger' && (
        <>
          {/* Desktop Ledger Table */}
          <div className="card desktop-table-view" style={{ padding: '16px' }}>
            <div className="card-header" style={{ marginBottom: '12px' }}>
              <div>
                <h3 className="card-title">Digital Ledger (Khata / Passbook)</h3>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  Chronological debit (sales) and credit (payments) with automatic running balance.
                </p>
              </div>
            </div>

            <div className="table-responsive" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Type</th>
                    <th>Ref #</th>
                    <th>Particulars</th>
                    <th style={{ textAlign: 'right', color: '#b91c1c' }}>Debit (Sale ₹)</th>
                    <th style={{ textAlign: 'right', color: '#15803d' }}>Credit (Paid ₹)</th>
                    <th style={{ textAlign: 'right', color: '#0284c7' }}>Running Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerData.entries.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                        No ledger transactions recorded yet for this customer.
                      </td>
                    </tr>
                  ) : (
                    ledgerData.entries.map((entry) => (
                      <tr key={entry.id}>
                        <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 600 }}>{formatDate(entry.date)}</div>
                          <div style={{ color: '#64748b', fontSize: '11px' }}>{entry.time}</div>
                        </td>
                        <td>
                          <span className={`badge ${entry.type === 'SALE' ? 'badge-credit' : 'badge-debit'}`}>
                            {entry.type}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, fontSize: '12px' }}>{entry.reference}</td>
                        <td style={{ fontSize: '13px', maxWidth: '300px' }}>{entry.particulars}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: '#b91c1c' }}>
                          {entry.debit > 0 ? formatCurrency(entry.debit) : '—'}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: '#15803d' }}>
                          {entry.credit > 0 ? formatCurrency(entry.credit) : '—'}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '14px', color: entry.balance > 0 ? '#b91c1c' : '#15803d' }}>
                          {formatCurrency(entry.balance)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Ledger Cards (Zero-scroll) */}
          <div className="mobile-cards-view">
            {ledgerData.entries.length === 0 ? (
              <div className="card" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                No ledger transactions recorded yet for this customer.
              </div>
            ) : (
              ledgerData.entries.map((entry) => (
                <div key={entry.id} className="mobile-record-card">
                  <div className="card-top-row">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className={`badge ${entry.type === 'SALE' ? 'badge-credit' : 'badge-debit'}`}>
                          {entry.type}
                        </span>
                        <strong style={{ fontSize: '13px', color: '#0f172a' }}>{entry.reference}</strong>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        {formatDate(entry.date)} • {entry.time}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>Balance</span>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: entry.balance > 0 ? '#e11d48' : '#10b981' }}>
                        {formatCurrency(entry.balance)}
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: '12px', color: '#334155', background: '#f8fafc', padding: '8px 10px', borderRadius: '6px' }}>
                    {entry.particulars}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', paddingTop: '4px', borderTop: '1px solid #f1f5f9' }}>
                    {entry.debit > 0 && (
                      <span style={{ color: '#b91c1c', fontWeight: 600 }}>
                        Debit (Billed): +{formatCurrency(entry.debit)}
                      </span>
                    )}
                    {entry.credit > 0 && (
                      <span style={{ color: '#15803d', fontWeight: 600 }}>
                        Credit (Received): -{formatCurrency(entry.credit)}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* TAB 2: SALES */}
      {activeTab === 'sales' && (
        <>
          {/* Desktop Sales Table */}
          <div className="card desktop-table-view" style={{ padding: '16px' }}>
            <div className="table-responsive" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Date & Time</th>
                    <th>Items Sold</th>
                    <th>Total Amount</th>
                    <th>Paid</th>
                    <th>Pending</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                        No sales recorded for this customer.
                      </td>
                    </tr>
                  ) : (
                    sales.map((sale) => (
                      <tr key={sale.id}>
                        <td style={{ fontWeight: 700, color: '#0284c7' }}>{sale.invoice_no}</td>
                        <td style={{ fontSize: '12px' }}>
                          {formatDate(sale.date)} <span style={{ color: '#64748b' }}>{sale.time}</span>
                        </td>
                        <td>
                          {sale.items.map((i, idx) => (
                            <div key={idx} style={{ fontSize: '12px' }}>
                              {i.product_name} <span style={{ color: '#64748b' }}>({i.quantity} × {formatCurrency(i.selling_price)})</span>
                            </div>
                          ))}
                        </td>
                        <td style={{ fontWeight: 700 }}>{formatCurrency(sale.total_amount)}</td>
                        <td style={{ color: '#10b981', fontWeight: 600 }}>{formatCurrency(sale.paid_amount)}</td>
                        <td style={{ color: sale.pending_amount > 0 ? '#e11d48' : '#64748b', fontWeight: 600 }}>
                          {formatCurrency(sale.pending_amount)}
                        </td>
                        <td>
                          <span className={`badge ${
                            sale.payment_status === 'Paid' ? 'badge-paid' :
                            sale.payment_status === 'Partially Paid' ? 'badge-partial' : 'badge-pending'
                          }`}>
                            {sale.payment_status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '3px 8px' }}
                              onClick={() => onViewBillDetails && onViewBillDetails(sale)}
                              title="View Bill & Payment History"
                            >
                              <Receipt size={13} /> View
                            </button>
                            {sale.pending_amount > 0 && (
                              <button
                                className="btn btn-primary btn-sm"
                                style={{ padding: '3px 8px' }}
                                onClick={() => onOpenPayment && onOpenPayment(customer.id, 'customer', sale.id)}
                                title="Add Payment for this Bill"
                              >
                                <PlusCircle size={13} /> Pay
                              </button>
                            )}
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '3px 7px' }}
                              onClick={() => onEditSale && onEditSale(sale)}
                              title="Edit Bill Details"
                            >
                              <Edit size={13} />
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              style={{ padding: '3px 7px', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' }}
                              onClick={() => handleDeleteSale(sale)}
                              title="Delete Bill (Restores items to stock)"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Sales Cards (Zero-scroll) */}
          <div className="mobile-cards-view">
            {sales.length === 0 ? (
              <div className="card" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                No sales recorded for this customer.
              </div>
            ) : (
              sales.map((sale) => (
                <div key={sale.id} className="mobile-record-card">
                  <div className="card-top-row">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="badge badge-active" style={{ fontSize: '10px', padding: '1px 6px' }}>
                          {sale.invoice_no}
                        </span>
                        <span className={`badge ${
                          sale.payment_status === 'Paid' ? 'badge-paid' :
                          sale.payment_status === 'Partially Paid' ? 'badge-partial' : 'badge-pending'
                        }`}>
                          {sale.payment_status}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                        {formatDate(sale.date)} • {sale.time}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>Bill Amount</span>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                        {formatCurrency(sale.total_amount)}
                      </div>
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', fontSize: '12px', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontWeight: 600, color: '#475569', marginBottom: '4px', fontSize: '11px' }}>ITEMS BILLED:</div>
                    {sale.items.map((i, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', color: '#1e293b', marginBottom: '2px' }}>
                        <span>{i.product_name}</span>
                        <span style={{ color: '#64748b' }}>{i.quantity} × {formatCurrency(i.selling_price)}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid #f1f5f9', fontSize: '12px' }}>
                    <div>
                      <span style={{ color: '#10b981', fontWeight: 600, marginRight: '10px' }}>Paid: {formatCurrency(sale.paid_amount)}</span>
                      {sale.pending_amount > 0 && (
                        <span style={{ color: '#e11d48', fontWeight: 700 }}>Due: {formatCurrency(sale.pending_amount)}</span>
                      )}
                    </div>
                  </div>

                  <div className="card-action-bar">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => onViewBillDetails && onViewBillDetails(sale)}
                    >
                      <Receipt size={13} /> Bill & Payments
                    </button>
                    {sale.pending_amount > 0 && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => onOpenPayment && onOpenPayment(customer.id, 'customer', sale.id)}
                      >
                        <PlusCircle size={13} /> Pay
                      </button>
                    )}
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 0.6 }}
                      onClick={() => onEditSale && onEditSale(sale)}
                      title="Edit Bill"
                    >
                      <Edit size={13} />
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      style={{ flex: 0.6, background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' }}
                      onClick={() => handleDeleteSale(sale)}
                      title="Delete Bill"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* TAB 3: PAYMENTS */}
      {activeTab === 'payments' && (
        <>
          {/* Desktop Payments Table */}
          <div className="card desktop-table-view" style={{ padding: '16px' }}>
            <div className="table-responsive" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Receipt #</th>
                    <th>Date & Time</th>
                    <th>Amount Received</th>
                    <th>Payment Mode</th>
                    <th>Reference #</th>
                    <th>Notes</th>
                    <th>Recorded By</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                        No payment records found.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 700, color: '#0284c7' }}>{p.receipt_no}</td>
                        <td style={{ fontSize: '12px' }}>
                          {formatDate(p.date)} <span style={{ color: '#64748b' }}>{p.time}</span>
                        </td>
                        <td style={{ fontWeight: 800, color: '#10b981', fontSize: '14px' }}>
                          {formatCurrency(p.amount)}
                        </td>
                        <td>
                          <span className="badge badge-paid">{p.payment_mode}</span>
                        </td>
                        <td style={{ fontSize: '12px', color: '#64748b' }}>{p.reference_no || '—'}</td>
                        <td style={{ fontSize: '12px' }}>{p.notes || '—'}</td>
                        <td style={{ fontSize: '12px', color: '#64748b' }}>{p.recorded_by}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            className="btn btn-danger btn-sm"
                            style={{ padding: '3px 8px', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' }}
                            onClick={() => handleDeletePayment(p)}
                            title="Delete Payment (Recalculates balance)"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Payments Cards (Zero-scroll) */}
          <div className="mobile-cards-view">
            {payments.length === 0 ? (
              <div className="card" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                No payment records found.
              </div>
            ) : (
              payments.map((p) => (
                <div key={p.id} className="mobile-record-card">
                  <div className="card-top-row">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="badge badge-active" style={{ fontSize: '10px', padding: '1px 6px' }}>
                          {p.receipt_no}
                        </span>
                        <span className="badge badge-paid">{p.payment_mode}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                        {formatDate(p.date)} • {p.time}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '10px', color: '#047857', fontWeight: 600 }}>RECEIVED</span>
                      <div style={{ fontSize: '17px', fontWeight: 800, color: '#10b981' }}>
                        +{formatCurrency(p.amount)}
                      </div>
                    </div>
                  </div>

                  {(p.reference_no || p.notes) && (
                    <div style={{ fontSize: '12px', color: '#475569', background: '#f8fafc', padding: '6px 10px', borderRadius: '6px' }}>
                      {p.reference_no && <div>Ref: {p.reference_no}</div>}
                      {p.notes && <div>{p.notes}</div>}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px', borderTop: '1px solid #f1f5f9', fontSize: '11px', color: '#64748b' }}>
                    <span>By: {p.recorded_by}</span>
                    <button
                      className="btn btn-danger btn-sm"
                      style={{ padding: '3px 8px', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' }}
                      onClick={() => handleDeletePayment(p)}
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};
