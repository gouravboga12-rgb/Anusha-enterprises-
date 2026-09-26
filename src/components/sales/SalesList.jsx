import React, { useState } from 'react';
import { PlusCircle, Search, ShoppingCart, Receipt, Eye, FileText, Edit2 } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const SalesList = ({
  sales,
  dataService,
  onOpenNewSale,
  onOpenPayment,
  onSelectCustomer,
  onViewBillDetails,
  onViewInvoice,
  onEditSale
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredSales = sales.filter((sale) => {
    const cust = dataService.getCustomerById(sale.customer_id);
    const custName = cust ? cust.name.toLowerCase() : '';
    const matchesSearch =
      sale.invoice_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      custName.includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter !== 'all' && sale.payment_status !== statusFilter) return false;
    return true;
  });

  return (
    <div>
      <div className="card-header" style={{ marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '20px' }}>Sales Management (Customer Bills)</h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            Every sale automatically reduces inventory and tracks customer ledger receivables.
          </p>
        </div>
        <button className="btn btn-primary" onClick={onOpenNewSale}>
          <PlusCircle size={15} /> New Customer Sale
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
              placeholder="Search by invoice # or customer name..."
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
              <option value="all">All Invoices</option>
              <option value="Paid">Paid</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="card desktop-table-view">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date & Time</th>
                <th>Customer</th>
                <th>Products Sold</th>
                <th style={{ textAlign: 'right' }}>Total Bill</th>
                <th style={{ textAlign: 'right' }}>Amount Paid</th>
                <th style={{ textAlign: 'right' }}>Pending Due</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                    No sales invoices found matching your query.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const cust = dataService.getCustomerById(sale.customer_id);

                  return (
                    <tr key={sale.id}>
                      <td style={{ fontWeight: 700, color: '#0284c7', fontSize: '13px' }}>
                        <div>{sale.invoice_no}</div>
                        {sale.vehicle_no && (
                          <div style={{ fontSize: '11px', color: '#0f172a', fontWeight: 700, background: '#f8fafc', padding: '1px 5px', borderRadius: '4px', border: '1px solid #0f172a', display: 'inline-block', marginTop: '2px' }}>
                            🚗 {sale.vehicle_no}
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 600 }}>{formatDate(sale.date)}</div>
                        <div style={{ color: '#64748b', fontSize: '11px' }}>{sale.time}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>
                          {cust ? cust.name : 'Unknown Customer'}
                        </div>
                        {cust?.area && (
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{cust.area}</div>
                        )}
                        {sale.notes && (
                          <div style={{ fontSize: '11px', color: '#475569', fontStyle: 'italic', marginTop: '2px' }}>
                            📝 {sale.notes}
                          </div>
                        )}
                      </td>
                      <td>
                        {sale.items.map((i, idx) => (
                          <div key={idx} style={{ fontSize: '12px' }}>
                            {i.product_name} <span style={{ color: '#64748b' }}>({i.quantity} {i.unit || 'Units'} × {formatCurrency(i.selling_price)})</span>
                          </div>
                        ))}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800 }}>
                        {formatCurrency(sale.total_amount)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: '#10b981' }}>
                        {formatCurrency(sale.paid_amount)}
                      </td>
                      <td style={{
                        textAlign: 'right',
                        fontWeight: 800,
                        color: sale.pending_amount > 0 ? '#e11d48' : '#10b981'
                      }}>
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
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px', fontSize: '11px', color: '#0284c7', borderColor: '#bae6fd', background: '#f0f9ff' }}
                            onClick={() => onViewInvoice && onViewInvoice(sale)}
                            title="View / Print Tax Invoice"
                          >
                            <FileText size={13} /> Invoice
                          </button>
                          {onEditSale && (
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '4px 8px', fontSize: '11px', color: '#d97706', borderColor: '#fde68a', background: '#fffbeb' }}
                              onClick={() => onEditSale(sale)}
                              title="Edit Sale / Vehicle No / Details"
                            >
                              <Edit2 size={13} /> Edit
                            </button>
                          )}
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                            onClick={() => onViewBillDetails && onViewBillDetails(sale)}
                            title="View Bill & Payments"
                          >
                            <Receipt size={13} /> Bill
                          </button>
                          {sale.pending_amount > 0 && (
                            <button
                              className="btn btn-primary btn-sm"
                              style={{ padding: '4px 8px', fontSize: '11px' }}
                              onClick={() => onOpenPayment(sale.customer_id, 'customer', sale.id)}
                              title="Record Installment Payment"
                            >
                              Collect
                            </button>
                          )}
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px' }}
                            onClick={() => onSelectCustomer(sale.customer_id)}
                            title="View Customer Profile"
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
        {filteredSales.length === 0 ? (
          <div className="card" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
            No sales invoices found matching your query.
          </div>
        ) : (
          filteredSales.map((sale) => {
            const cust = dataService.getCustomerById(sale.customer_id);
            const isDue = sale.pending_amount > 0;

            return (
              <div key={sale.id} className="mobile-record-card">
                <div className="card-top-row">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, color: '#0284c7', fontSize: '14px' }}>
                        {sale.invoice_no}
                      </span>
                      <span className={`badge ${
                        sale.payment_status === 'Paid' ? 'badge-paid' :
                        sale.payment_status === 'Partially Paid' ? 'badge-partial' : 'badge-pending'
                      }`} style={{ fontSize: '10px' }}>
                        {sale.payment_status}
                      </span>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginTop: '3px' }}>
                      {cust ? cust.name : 'Unknown Customer'}
                    </div>
                    {sale.vehicle_no && (
                      <div style={{ fontSize: '11px', color: '#0f172a', fontWeight: 700, background: '#f8fafc', padding: '1px 6px', borderRadius: '4px', border: '1px solid #0f172a', display: 'inline-block', marginTop: '3px' }}>
                        🚗 {sale.vehicle_no}
                      </div>
                    )}
                    {sale.notes && (
                      <div style={{ fontSize: '11px', color: '#475569', fontStyle: 'italic', marginTop: '2px' }}>
                        📝 {sale.notes}
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ fontSize: '10px', color: isDue ? '#be123c' : '#047857', fontWeight: 700, textTransform: 'uppercase' }}>
                      {isDue ? 'Balance Due' : 'Paid in Full'}
                    </span>
                    <div style={{
                      fontSize: '17px',
                      fontWeight: 800,
                      color: isDue ? '#e11d48' : '#10b981'
                    }}>
                      {formatCurrency(sale.pending_amount)}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      Total: {formatCurrency(sale.total_amount)}
                    </div>
                  </div>
                </div>

                <div className="card-meta-grid">
                  <div>
                    <span style={{ color: '#64748b', fontSize: '10.5px' }}>Date & Time:</span>
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '12px' }}>
                      {formatDate(sale.date)} • {sale.time}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '10.5px' }}>Amount Paid:</span>
                    <div style={{ fontWeight: 700, color: '#10b981', fontSize: '12px' }}>
                      {formatCurrency(sale.paid_amount)}
                    </div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <span style={{ color: '#64748b', fontSize: '10.5px' }}>Items Sold:</span>
                    <div style={{ fontSize: '12px', color: '#334155', fontWeight: 500 }}>
                      {sale.items.map((i) => `${i.product_name} (${i.quantity} ${i.unit || 'Units'})`).join(', ')}
                    </div>
                  </div>
                </div>

                <div className="card-actions-row" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', paddingTop: '4px' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, minWidth: '70px', padding: '6px 8px', color: '#0284c7', borderColor: '#bae6fd', background: '#f0f9ff', fontWeight: 700 }}
                    onClick={() => onViewInvoice && onViewInvoice(sale)}
                  >
                    <FileText size={13} /> Invoice
                  </button>
                  {onEditSale && (
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1, minWidth: '60px', padding: '6px 8px', color: '#d97706', borderColor: '#fde68a', background: '#fffbeb', fontWeight: 700 }}
                      onClick={() => onEditSale(sale)}
                    >
                      <Edit2 size={13} /> Edit
                    </button>
                  )}
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, minWidth: '60px', padding: '6px 8px', fontWeight: 600 }}
                    onClick={() => onViewBillDetails && onViewBillDetails(sale)}
                  >
                    <Receipt size={13} /> Bill
                  </button>
                  {sale.pending_amount > 0 && (
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1, minWidth: '70px', padding: '6px 8px', fontWeight: 700 }}
                      onClick={() => onOpenPayment(sale.customer_id, 'customer', sale.id)}
                    >
                      Collect
                    </button>
                  )}
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '6px 10px' }}
                    onClick={() => onSelectCustomer(sale.customer_id)}
                    title="View Customer Profile"
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
