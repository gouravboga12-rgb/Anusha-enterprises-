import React, { useState } from 'react';
import { ArrowLeft, Phone, MapPin, ShoppingBag, Receipt, BookMarked, Trash2, Edit, PlusCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const SupplierProfile = ({
  supplierId,
  dataService,
  onBack,
  onOpenNewPurchase,
  onOpenPayment,
  onEditSupplier,
  onViewPurchaseDetails,
  onEditPurchase
}) => {
  const [activeTab, setActiveTab] = useState('ledger');

  const supplier = dataService.getSupplierById(supplierId);
  if (!supplier) {
    return (
      <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
        <p>Supplier account not found or was deleted.</p>
        <button className="btn btn-secondary" onClick={onBack} style={{ marginTop: '12px' }}>
          <ArrowLeft size={16} /> Back to Supplier List
        </button>
      </div>
    );
  }

  const ledgerData = dataService.getSupplierLedger(supplierId);
  const purchases = dataService.getPurchases().filter((p) => p.supplier_id === supplierId);
  const payments = dataService.getPayments().filter((p) => p.supplier_id === supplierId && p.type === 'supplier_payment');
  const pendingPurchases = purchases.filter((p) => p.pending_amount > 0);
  const firstPurchaseId = pendingPurchases.length > 0 ? pendingPurchases[0].id : '';

  const handleDeleteSupplier = () => {
    const warning = ledgerData.pendingBalance > 0
      ? `\n\nWarning: We still owe ₹${ledgerData.pendingBalance.toLocaleString()} to this supplier!`
      : '';
    if (window.confirm(`Delete supplier account "${supplier.company_name}"?${warning}\n\nThis will remove their profile and purchase records.`)) {
      dataService.deleteSupplier(supplierId);
      onBack();
    }
  };

  const handleDeletePurchase = (pur) => {
    if (window.confirm(`Delete Inward Purchase ${pur.purchase_no} (${formatCurrency(pur.total_amount)})?\n\nThis will automatically remove the inward items from your product inventory and clear the payable on the supplier ledger.`)) {
      dataService.deletePurchase(pur.id);
    }
  };

  const handleDeletePayment = (payment) => {
    if (window.confirm(`Delete Payment Voucher ${payment.receipt_no} (${formatCurrency(payment.amount)})?\n\nThis will recalculate the supplier's balance.`)) {
      dataService.deletePayment(payment.id);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={onBack}
        >
          <ArrowLeft size={15} /> Back to Suppliers
        </button>

        <div style={{ display: 'flex', gap: '8px' }}>
          {onEditSupplier && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onEditSupplier(supplier)}
              title="Edit supplier details"
            >
              <Edit size={14} /> Edit Supplier
            </button>
          )}
          <button
            className="btn btn-danger btn-sm"
            style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' }}
            onClick={handleDeleteSupplier}
            title="Delete this supplier account"
          >
            <Trash2 size={14} /> Delete Supplier
          </button>
        </div>
      </div>

      {/* Supplier Header */}
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
              <span className="badge badge-active">{supplier.supplier_id}</span>
              <h1 style={{ fontSize: '22px' }}>{supplier.company_name}</h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px', flexWrap: 'wrap', color: '#64748b', fontSize: '13px' }}>
              {supplier.supplier_name && (
                <span>Contact: <strong style={{ color: '#0f172a' }}>{supplier.supplier_name}</strong></span>
              )}
              {supplier.mobile && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Phone size={14} color="#0284c7" /> {supplier.mobile}
                </span>
              )}
              {supplier.area && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={14} color="#0284c7" /> {supplier.area}
                </span>
              )}
            </div>
            {supplier.notes && (
              <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                Note: {supplier.notes}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => onOpenNewPurchase(supplier.id)}
            >
              <ShoppingBag size={15} /> New Purchase Entry
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onOpenPayment(supplier.id, 'supplier', firstPurchaseId)}
            >
              <Receipt size={15} color="#0284c7" /> Pay Supplier
            </button>
          </div>
        </div>

        {/* Financial Summary */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px'
        }}>
          <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>TOTAL PURCHASES</span>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
              {formatCurrency(ledgerData.totalPurchases)}
            </div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Across {purchases.length} invoices</span>
          </div>

          <div style={{ background: '#ecfdf5', padding: '12px 16px', borderRadius: '10px', border: '1px solid #a7f3d0' }}>
            <span style={{ fontSize: '11px', color: '#047857', fontWeight: 600 }}>TOTAL PAID OUT</span>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#065f46', marginTop: '2px' }}>
              {formatCurrency(ledgerData.totalPaid)}
            </div>
            <span style={{ fontSize: '11px', color: '#047857' }}>{payments.length} payment vouchers</span>
          </div>

          <div style={{
            background: ledgerData.pendingBalance > 0 ? '#fffbeb' : '#f8fafc',
            padding: '12px 16px',
            borderRadius: '10px',
            border: `1px solid ${ledgerData.pendingBalance > 0 ? '#fde68a' : '#e2e8f0'}`
          }}>
            <span style={{ fontSize: '11px', color: ledgerData.pendingBalance > 0 ? '#b45309' : '#64748b', fontWeight: 600 }}>
              BALANCE TO PAY
            </span>
            <div style={{
              fontSize: '18px',
              fontWeight: 800,
              color: ledgerData.pendingBalance > 0 ? '#d97706' : '#10b981',
              marginTop: '2px'
            }}>
              {formatCurrency(ledgerData.pendingBalance)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
              <span style={{ fontSize: '11px', color: ledgerData.pendingBalance > 0 ? '#b45309' : '#10b981' }}>
                {ledgerData.pendingBalance > 0 ? 'Payable outstanding' : 'All accounts settled'}
              </span>
              {ledgerData.pendingBalance > 0 && (
                <button
                  className="btn btn-sm"
                  style={{
                    background: '#d97706',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                    padding: '2px 8px',
                    fontSize: '11px'
                  }}
                  onClick={() => onOpenPayment && onOpenPayment(supplier.id, 'supplier', firstPurchaseId)}
                >
                  <Receipt size={12} /> Pay Balance
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
        <button
          className={`btn btn-sm ${activeTab === 'ledger' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('ledger')}
        >
          <BookMarked size={15} /> Supplier Ledger
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'purchases' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('purchases')}
        >
          <ShoppingBag size={15} /> Purchase Invoices ({purchases.length})
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'payments' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('payments')}
        >
          <Receipt size={15} /> Payments Made ({payments.length})
        </button>
      </div>

      {/* TAB 1: SUPPLIER LEDGER */}
      {activeTab === 'ledger' && (
        <>
          {/* Desktop Supplier Ledger Table */}
          <div className="card desktop-table-view" style={{ padding: '16px' }}>
            <div className="card-header" style={{ marginBottom: '12px' }}>
              <div>
                <h3 className="card-title">Supplier Ledger (Khata)</h3>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  Chronological purchases (credit) and payment vouchers (debit) with automatic running balance.
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
                    <th style={{ textAlign: 'right', color: '#d97706' }}>Credit (Purchase ₹)</th>
                    <th style={{ textAlign: 'right', color: '#15803d' }}>Debit (Paid ₹)</th>
                    <th style={{ textAlign: 'right', color: '#0284c7' }}>Running Payable</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerData.entries.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                        No ledger entries recorded for this supplier.
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
                          <span className={`badge ${entry.type === 'PURCHASE' ? 'badge-partial' : 'badge-debit'}`}>
                            {entry.type}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, fontSize: '12px' }}>{entry.reference}</td>
                        <td style={{ fontSize: '13px', maxWidth: '300px' }}>{entry.particulars}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: '#d97706' }}>
                          {entry.credit > 0 ? formatCurrency(entry.credit) : '—'}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: '#15803d' }}>
                          {entry.debit > 0 ? formatCurrency(entry.debit) : '—'}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '14px', color: entry.balance > 0 ? '#d97706' : '#15803d' }}>
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
                No ledger entries recorded for this supplier.
              </div>
            ) : (
              ledgerData.entries.map((entry) => (
                <div key={entry.id} className="mobile-record-card">
                  <div className="card-top-row">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className={`badge ${entry.type === 'PURCHASE' ? 'badge-partial' : 'badge-debit'}`}>
                          {entry.type}
                        </span>
                        <strong style={{ fontSize: '13px', color: '#0f172a' }}>{entry.reference}</strong>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        {formatDate(entry.date)} • {entry.time}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>Payable Due</span>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: entry.balance > 0 ? '#d97706' : '#10b981' }}>
                        {formatCurrency(entry.balance)}
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: '12px', color: '#334155', background: '#f8fafc', padding: '8px 10px', borderRadius: '6px' }}>
                    {entry.particulars}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', paddingTop: '4px', borderTop: '1px solid #f1f5f9' }}>
                    {entry.credit > 0 && (
                      <span style={{ color: '#d97706', fontWeight: 600 }}>
                        Inward Purchase: +{formatCurrency(entry.credit)}
                      </span>
                    )}
                    {entry.debit > 0 && (
                      <span style={{ color: '#15803d', fontWeight: 600 }}>
                        Paid to Vendor: -{formatCurrency(entry.debit)}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* TAB 2: PURCHASES */}
      {activeTab === 'purchases' && (
        <>
          {/* Desktop Purchases Table */}
          <div className="card desktop-table-view" style={{ padding: '16px' }}>
            <div className="table-responsive" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Purchase #</th>
                    <th>Date & Time</th>
                    <th>Products Purchased</th>
                    <th>Total Amount</th>
                    <th>Paid</th>
                    <th>Pending</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                        No purchases recorded for this supplier.
                      </td>
                    </tr>
                  ) : (
                    purchases.map((pur) => (
                      <tr key={pur.id}>
                        <td style={{ fontWeight: 700, color: '#0284c7' }}>{pur.purchase_no}</td>
                        <td style={{ fontSize: '12px' }}>
                          {formatDate(pur.date)} <span style={{ color: '#64748b' }}>{pur.time}</span>
                        </td>
                        <td>
                          {pur.items.map((i, idx) => (
                            <div key={idx} style={{ fontSize: '12px' }}>
                              {i.product_name} <span style={{ color: '#64748b' }}>({i.quantity} × {formatCurrency(i.purchase_price)})</span>
                            </div>
                          ))}
                        </td>
                        <td style={{ fontWeight: 700 }}>{formatCurrency(pur.total_amount)}</td>
                        <td style={{ color: '#10b981', fontWeight: 600 }}>{formatCurrency(pur.paid_amount)}</td>
                        <td style={{ color: pur.pending_amount > 0 ? '#d97706' : '#64748b', fontWeight: 600 }}>
                          {formatCurrency(pur.pending_amount)}
                        </td>
                        <td>
                          <span className={`badge ${
                            pur.payment_status === 'Paid' ? 'badge-paid' :
                            pur.payment_status === 'Partially Paid' ? 'badge-partial' : 'badge-pending'
                          }`}>
                            {pur.payment_status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '3px 8px' }}
                              onClick={() => onViewPurchaseDetails && onViewPurchaseDetails(pur)}
                              title="View Purchase & Payment History"
                            >
                              <Receipt size={13} /> View
                            </button>
                            {pur.pending_amount > 0 && (
                              <button
                                className="btn btn-primary btn-sm"
                                style={{ padding: '3px 8px' }}
                                onClick={() => onOpenPayment && onOpenPayment(supplier.id, 'supplier', pur.id)}
                                title="Add Payment for this Purchase"
                              >
                                <PlusCircle size={13} /> Pay
                              </button>
                            )}
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '3px 7px' }}
                              onClick={() => onEditPurchase && onEditPurchase(pur)}
                              title="Edit Purchase Details"
                            >
                              <Edit size={13} />
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              style={{ padding: '3px 7px', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' }}
                              onClick={() => handleDeletePurchase(pur)}
                              title="Delete Purchase (Deducts items from stock)"
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

          {/* Mobile Purchases Cards (Zero-scroll) */}
          <div className="mobile-cards-view">
            {purchases.length === 0 ? (
              <div className="card" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                No purchases recorded for this supplier.
              </div>
            ) : (
              purchases.map((pur) => (
                <div key={pur.id} className="mobile-record-card">
                  <div className="card-top-row">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="badge badge-active" style={{ fontSize: '10px', padding: '1px 6px' }}>
                          {pur.purchase_no}
                        </span>
                        <span className={`badge ${
                          pur.payment_status === 'Paid' ? 'badge-paid' :
                          pur.payment_status === 'Partially Paid' ? 'badge-partial' : 'badge-pending'
                        }`}>
                          {pur.payment_status}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                        {formatDate(pur.date)} • {pur.time}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>Invoice Total</span>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                        {formatCurrency(pur.total_amount)}
                      </div>
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', fontSize: '12px', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontWeight: 600, color: '#475569', marginBottom: '4px', fontSize: '11px' }}>PURCHASED ITEMS:</div>
                    {pur.items.map((i, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', color: '#1e293b', marginBottom: '2px' }}>
                        <span>{i.product_name}</span>
                        <span style={{ color: '#64748b' }}>{i.quantity} × {formatCurrency(i.purchase_price)}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid #f1f5f9', fontSize: '12px' }}>
                    <div>
                      <span style={{ color: '#10b981', fontWeight: 600, marginRight: '10px' }}>Paid: {formatCurrency(pur.paid_amount)}</span>
                      {pur.pending_amount > 0 && (
                        <span style={{ color: '#d97706', fontWeight: 700 }}>Due: {formatCurrency(pur.pending_amount)}</span>
                      )}
                    </div>
                  </div>

                  <div className="card-action-bar">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => onViewPurchaseDetails && onViewPurchaseDetails(pur)}
                    >
                      <Receipt size={13} /> Purchase & Payments
                    </button>
                    {pur.pending_amount > 0 && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => onOpenPayment && onOpenPayment(supplier.id, 'supplier', pur.id)}
                      >
                        <PlusCircle size={13} /> Pay
                      </button>
                    )}
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 0.6 }}
                      onClick={() => onEditPurchase && onEditPurchase(pur)}
                      title="Edit Purchase"
                    >
                      <Edit size={13} />
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      style={{ flex: 0.6, background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' }}
                      onClick={() => handleDeletePurchase(pur)}
                      title="Delete Purchase"
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

      {/* TAB 3: PAYMENTS MADE */}
      {activeTab === 'payments' && (
        <>
          {/* Desktop Payments Table */}
          <div className="card desktop-table-view" style={{ padding: '16px' }}>
            <div className="table-responsive" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Voucher #</th>
                    <th>Date & Time</th>
                    <th>Amount Paid</th>
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
                        No payments recorded.
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
                            title="Delete Payment Voucher"
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
                No payments recorded.
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
                      <span style={{ fontSize: '10px', color: '#b91c1c', fontWeight: 600 }}>PAID OUT</span>
                      <div style={{ fontSize: '17px', fontWeight: 800, color: '#e11d48' }}>
                        -{formatCurrency(p.amount)}
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
