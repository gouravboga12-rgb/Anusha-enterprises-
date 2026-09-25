import React, { useState } from 'react';
import { PlusCircle, Search, ShoppingBag, Receipt, Eye, FileText } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const PurchasesList = ({
  purchases,
  dataService,
  onOpenNewPurchase,
  onOpenPayment,
  onSelectSupplier,
  onViewPurchaseDetails,
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

      {/* Table */}
      <div className="card">
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
                        {pur.purchase_no}
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
    </div>
  );
};
