import React, { useState } from 'react';
import { PlusCircle, Search, ShoppingBag, Receipt, Eye, FileText, Edit2 } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const PurchasesList = ({
  purchases,
  dataService,
  onOpenNewPurchase,
  onOpenPayment,
  onSelectSupplier,
  onViewPurchaseDetails,
  onEditPurchase,
  onViewInvoice
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredPurchases = purchases.filter((pur) => {
    const supp = dataService.getSupplierById(pur.supplier_id);
    const suppName = supp ? supp.company_name.toLowerCase() : '';
    const matchesSearch =
      pur.purchase_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      suppName.includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter !== 'all' && pur.payment_status !== statusFilter) return false;
    return true;
  });

  return (
    <div>
      <div className="card-header" style={{ marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '20px' }}>Purchases Management (Supplier Inward)</h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            Every supplier purchase automatically increases stock and updates supplier balance payables.
          </p>
        </div>
        <button className="btn btn-primary" onClick={onOpenNewPurchase}>
          <PlusCircle size={15} /> New Supplier Purchase
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '14px 18px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px' }}>
            <Search size={18} color="#64748b" />
            <input
              type="text"
              className="form-input"
              style={{ border: 'none', background: 'transparent', padding: '6px' }}
              placeholder="Search by purchase # or supplier company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Status:</span>
            <select
              className="form-select"
              style={{ width: 'auto', padding: '6px 12px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Purchases</option>
              <option value="Paid">Paid</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table (Desktop) */}
      <div className="card desktop-table-view">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Purchase #</th>
                <th>Date & Time</th>
                <th>Supplier Company</th>
                <th>Products Received</th>
                <th style={{ textAlign: 'right' }}>Total Amount</th>
                <th style={{ textAlign: 'right' }}>Amount Paid</th>
                <th style={{ textAlign: 'right' }}>Balance Due</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                    No purchases found matching your query.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((pur) => {
                  const supp = dataService.getSupplierById(pur.supplier_id);

                  return (
                    <tr key={pur.id}>
                      <td style={{ fontWeight: 700, color: '#0284c7', fontSize: '13px' }}>
                        <div>{pur.purchase_no}</div>
                        {pur.vehicle_no && (
                          <div style={{ fontSize: '10px', color: '#0f172a', fontWeight: 700, background: '#f1f5f9', padding: '1px 5px', borderRadius: '3px', marginTop: '2px', display: 'inline-block' }}>
                            🚗 {pur.vehicle_no}
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 600 }}>{formatDate(pur.date)}</div>
                        <div style={{ color: '#64748b', fontSize: '11px' }}>{pur.time}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>
                          {supp ? supp.company_name : 'Unknown Supplier'}
                        </div>
                        {supp?.area && (
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{supp.area}</div>
                        )}
                      </td>
                      <td>
                        {pur.items.map((i, idx) => (
                          <div key={idx} style={{ fontSize: '12px' }}>
                            {i.product_name} <span style={{ color: '#64748b' }}>({i.quantity} {i.unit || 'Units'} × {formatCurrency(i.purchase_price)})</span>
                          </div>
                        ))}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800 }}>
                        {formatCurrency(pur.total_amount)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: '#10b981' }}>
                        {formatCurrency(pur.paid_amount)}
                      </td>
                      <td style={{
                        textAlign: 'right',
                        fontWeight: 800,
                        color: pur.pending_amount > 0 ? '#d97706' : '#10b981'
                      }}>
                        {pur.advance_amount > 0 ? (
                          <span style={{ color: '#059669', fontSize: '12px' }} title={`₹${pur.advance_amount} excess advance paid`}>
                            +{formatCurrency(pur.advance_amount)} Adv
                          </span>
                        ) : (
                          formatCurrency(pur.pending_amount)
                        )}
                      </td>
                      <td>
                        <span className={`badge ${
                          pur.payment_status === 'Paid' ? 'badge-paid' :
                          pur.payment_status === 'Partially Paid' ? 'badge-partial' : 'badge-pending'
                        }`}>
                          {pur.payment_status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px', fontSize: '11px', color: '#0284c7', borderColor: '#bae6fd', background: '#f0f9ff' }}
                            onClick={() => onViewInvoice && onViewInvoice(pur)}
                            title="View / Print Inward Purchase Invoice"
                          >
                            <FileText size={13} /> Invoice
                          </button>
                          {onEditPurchase && (
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '4px 8px', fontSize: '11px', color: '#d97706', borderColor: '#fde68a', background: '#fffbeb' }}
                              onClick={() => onEditPurchase(pur)}
                              title="Edit Purchase / Vehicle No / Details"
                            >
                              <Edit2 size={13} /> Edit
                            </button>
                          )}
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                            onClick={() => onViewPurchaseDetails && onViewPurchaseDetails(pur)}
                            title="View Purchase & Payments"
                          >
                            <Receipt size={13} color="#0284c7" /> View
                          </button>
                          {pur.pending_amount > 0 && (
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '4px 8px', fontSize: '11px' }}
                              onClick={() => onOpenPayment(pur.supplier_id, 'supplier', pur.id)}
                              title="Pay Supplier Installment"
                            >
                              Pay
                            </button>
                          )}
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px' }}
                            onClick={() => onSelectSupplier(pur.supplier_id)}
                            title="View Supplier Profile"
                          >
                            <Eye size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile & Tablet Card View */}
      <div className="mobile-cards-view">
        {filteredPurchases.length === 0 ? (
          <div className="card" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
            No supplier purchases found matching your query.
          </div>
        ) : (
          filteredPurchases.map((pur) => {
            const supp = dataService.getSupplierById(pur.supplier_id);
            const isDue = pur.pending_amount > 0;

            return (
              <div key={pur.id} className="mobile-record-card">
                <div className="card-top-row">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, color: '#0284c7', fontSize: '14px' }}>
                        {pur.purchase_no}
                      </span>
                      <span className={`badge ${
                        pur.payment_status === 'Paid' ? 'badge-paid' :
                        pur.payment_status === 'Partially Paid' ? 'badge-partial' : 'badge-pending'
                      }`} style={{ fontSize: '10px' }}>
                        {pur.payment_status}
                      </span>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginTop: '3px' }}>
                      {supp ? supp.company_name : 'Unknown Supplier'}
                    </div>
                    {pur.vehicle_no && (
                      <div style={{ fontSize: '11px', color: '#0f172a', fontWeight: 700, background: '#f8fafc', padding: '1px 6px', borderRadius: '4px', border: '1px solid #0f172a', display: 'inline-block', marginTop: '3px' }}>
                        🚗 {pur.vehicle_no}
                      </div>
                    )}
                    {pur.notes && (
                      <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic', marginTop: '2px' }}>
                        Note: {pur.notes}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{formatDate(pur.date)}</div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>{pur.time}</div>
                  </div>
                </div>

                {/* Items summary */}
                <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', margin: '8px 0', fontSize: '12px' }}>
                  <div style={{ fontWeight: 600, color: '#475569', marginBottom: '3px', fontSize: '11px', textTransform: 'uppercase' }}>Items Received:</div>
                  {pur.items.map((i, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', color: '#334155', marginTop: '2px' }}>
                      <span>{i.product_name}</span>
                      <span style={{ fontWeight: 600 }}>{i.quantity} {i.unit || 'Units'} × {formatCurrency(i.purchase_price)}</span>
                    </div>
                  ))}
                </div>

                <div className="card-amounts-grid">
                  <div className="amount-col">
                    <span className="label">Total Billed</span>
                    <span className="val" style={{ color: '#0f172a' }}>{formatCurrency(pur.total_amount)}</span>
                  </div>
                  <div className="amount-col">
                    <span className="label">Paid</span>
                    <span className="val" style={{ color: '#10b981' }}>{formatCurrency(pur.paid_amount)}</span>
                  </div>
                  <div className="amount-col">
                    <span className="label">{pur.advance_amount > 0 ? 'Advance Paid' : 'Balance Due'}</span>
                    <span className="val" style={{ color: isDue ? '#d97706' : '#10b981' }}>
                      {pur.advance_amount > 0 ? `+${formatCurrency(pur.advance_amount)} Adv` : formatCurrency(pur.pending_amount)}
                    </span>
                  </div>
                </div>

                <div className="card-actions-bar">
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, padding: '6px 8px', fontSize: '12px', color: '#0284c7', borderColor: '#bae6fd', background: '#f0f9ff' }}
                    onClick={() => onViewInvoice && onViewInvoice(pur)}
                  >
                    <FileText size={13} /> Invoice
                  </button>
                  {onEditPurchase && (
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1, padding: '6px 8px', fontSize: '12px', color: '#d97706', borderColor: '#fde68a', background: '#fffbeb' }}
                      onClick={() => onEditPurchase(pur)}
                    >
                      <Edit2 size={13} /> Edit
                    </button>
                  )}
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, padding: '6px 8px', fontSize: '12px' }}
                    onClick={() => onViewPurchaseDetails && onViewPurchaseDetails(pur)}
                  >
                    <Receipt size={13} color="#0284c7" /> Bill
                  </button>
                  {isDue && (
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1, padding: '6px 8px', fontSize: '12px', background: '#0284c7' }}
                      onClick={() => onOpenPayment(pur.supplier_id, 'supplier', pur.id)}
                    >
                      Pay
                    </button>
                  )}
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '6px 10px', fontSize: '12px' }}
                    onClick={() => onSelectSupplier(pur.supplier_id)}
                    title="View Supplier Profile"
                  >
                    <Eye size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
