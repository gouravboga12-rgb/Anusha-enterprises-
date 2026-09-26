import React, { useState } from 'react';
import { PlusCircle, Search, ArrowDownLeft, ArrowUpRight, Filter } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const PaymentList = ({
  payments,
  dataService,
  onOpenRecordPayment,
  onSelectCustomer,
  onSelectSupplier
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'customer_payment', 'supplier_payment'
  const [modeFilter, setModeFilter] = useState('all');

  const totalInward = payments
    .filter((p) => p.type === 'customer_payment')
    .reduce((acc, p) => acc + (p.amount || 0), 0);

  const totalOutward = payments
    .filter((p) => p.type === 'supplier_payment')
    .reduce((acc, p) => acc + (p.amount || 0), 0);

  const netCash = totalInward - totalOutward;

  const filteredPayments = payments.filter((p) => {
    if (typeFilter !== 'all' && p.type !== typeFilter) return false;
    if (modeFilter !== 'all' && p.payment_mode !== modeFilter) return false;

    let partyName = '';
    if (p.customer_id) {
      const c = dataService.getCustomerById(p.customer_id);
      if (c) partyName = c.name;
    } else if (p.supplier_id) {
      const s = dataService.getSupplierById(p.supplier_id);
      if (s) partyName = s.company_name;
    }

    const matches =
      p.receipt_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.reference_no && p.reference_no.toLowerCase().includes(searchTerm.toLowerCase()));

    return matches;
  });

  return (
    <div>
      <div className="card-header" style={{ marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '20px' }}>Payments & Installment Management</h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            Non-destructive installment vouchers for customer receivables and supplier payables.
          </p>
        </div>
        <button className="btn btn-primary" onClick={onOpenRecordPayment}>
          <PlusCircle size={15} /> Record Payment
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '14px',
        marginBottom: '20px'
      }}>
        <div style={{ background: '#ecfdf5', padding: '16px', borderRadius: '12px', border: '1px solid #a7f3d0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#047857', fontSize: '12px', fontWeight: 700 }}>
            <span>TOTAL CUSTOMER COLLECTIONS</span>
            <ArrowDownLeft size={18} />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#065f46', marginTop: '6px' }}>
            +{formatCurrency(totalInward)}
          </div>
          <p style={{ fontSize: '11px', color: '#059669', marginTop: '2px' }}>
            Cash, UPI & Bank Receipts Inward
          </p>
        </div>

        <div style={{ background: '#fef2f2', padding: '16px', borderRadius: '12px', border: '1px solid #fecaca' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#be123c', fontSize: '12px', fontWeight: 700 }}>
            <span>TOTAL SUPPLIER PAYMENTS</span>
            <ArrowUpRight size={18} />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#9f1239', marginTop: '6px' }}>
            -{formatCurrency(totalOutward)}
          </div>
          <p style={{ fontSize: '11px', color: '#e11d48', marginTop: '2px' }}>
            Payments Dispatched to Suppliers
          </p>
        </div>

        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#475569', fontSize: '12px', fontWeight: 700 }}>
            <span>NET CASH ACCUMULATION</span>
            <span>Inflow - Outflow</span>
          </div>
          <div style={{
            fontSize: '22px',
            fontWeight: 800,
            color: netCash >= 0 ? '#10b981' : '#e11d48',
            marginTop: '6px'
          }}>
            {formatCurrency(netCash)}
          </div>
          <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            Cumulative Cash Flow Balance
          </p>
        </div>
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
              placeholder="Search by receipt #, party name, or ref/UTR..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select
              className="form-select"
              style={{ width: 'auto', padding: '6px 12px' }}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Transactions</option>
              <option value="customer_payment">Customer Inflow (+)</option>
              <option value="supplier_payment">Supplier Outflow (-)</option>
            </select>

            <select
              className="form-select"
              style={{ width: 'auto', padding: '6px 12px' }}
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
            >
              <option value="all">All Modes</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Bank Transfer">Bank Transfer</option>
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
                <th>Receipt / Voucher #</th>
                <th>Date & Time</th>
                <th>Party Name</th>
                <th>Direction</th>
                <th style={{ textAlign: 'right' }}>Amount Paid</th>
                <th>Mode</th>
                <th>Ref / UTR #</th>
                <th>Notes</th>
                <th>Recorded By</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                    No payment records found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const isCust = p.type === 'customer_payment';
                  let partyName = 'Party';
                  if (isCust) {
                    const c = dataService.getCustomerById(p.customer_id);
                    if (c) partyName = c.name;
                  } else {
                    const s = dataService.getSupplierById(p.supplier_id);
                    if (s) partyName = s.company_name;
                  }

                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 700, color: '#0284c7', fontSize: '13px' }}>
                        {p.receipt_no}
                      </td>
                      <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 600 }}>{formatDate(p.date)}</div>
                        <div style={{ color: '#64748b', fontSize: '11px' }}>{p.time}</div>
                      </td>
                      <td>
                        <span
                          style={{ fontWeight: 700, color: '#0f172a', cursor: 'pointer', textDecoration: 'underline' }}
                          onClick={() => isCust ? onSelectCustomer(p.customer_id) : onSelectSupplier(p.supplier_id)}
                        >
                          {partyName}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${isCust ? 'badge-paid' : 'badge-pending'}`}>
                          {isCust ? 'Inward (Customer)' : 'Outward (Supplier)'}
                        </span>
                      </td>
                      <td style={{
                        textAlign: 'right',
                        fontWeight: 800,
                        fontSize: '14px',
                        color: isCust ? '#10b981' : '#e11d48'
                      }}>
                        {isCust ? '+' : '-'}{formatCurrency(p.amount)}
                      </td>
                      <td>
                        <span className="badge badge-paid">{p.payment_mode}</span>
                      </td>
                      <td style={{ fontSize: '12px', color: '#64748b' }}>{p.reference_no || '—'}</td>
                      <td style={{ fontSize: '12px' }}>{p.notes || '—'}</td>
                      <td style={{ fontSize: '12px', color: '#64748b' }}>{p.recorded_by}</td>
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
        {filteredPayments.length === 0 ? (
          <div className="card" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
            No payment records found.
          </div>
        ) : (
          filteredPayments.map((p) => {
            const isCust = p.type === 'customer_payment';
            let partyName = 'Party';
            if (isCust) {
              const c = dataService.getCustomerById(p.customer_id);
              if (c) partyName = c.name;
            } else {
              const s = dataService.getSupplierById(p.supplier_id);
              if (s) partyName = s.company_name;
            }

            return (
              <div key={p.id} className="mobile-record-card">
                <div className="card-top-row">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, color: '#0284c7', fontSize: '13px' }}>
                        {p.receipt_no}
                      </span>
                      <span className={`badge ${isCust ? 'badge-paid' : 'badge-pending'}`} style={{ fontSize: '10px' }}>
                        {isCust ? 'Inward (Customer)' : 'Outward (Supplier)'}
                      </span>
                      <span className="badge badge-paid" style={{ fontSize: '10px', background: '#f1f5f9', color: '#334155' }}>
                        {p.payment_mode}
                      </span>
                    </div>
                    <div
                      style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginTop: '4px', cursor: 'pointer' }}
                      onClick={() => isCust ? onSelectCustomer(p.customer_id) : onSelectSupplier(p.supplier_id)}
                    >
                      {partyName}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontWeight: 900,
                      fontSize: '16px',
                      color: isCust ? '#10b981' : '#e11d48'
                    }}>
                      {isCust ? '+' : '-'}{formatCurrency(p.amount)}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                      {formatDate(p.date)} {p.time}
                    </div>
                  </div>
                </div>

                {(p.reference_no || p.notes || p.recorded_by) && (
                  <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', margin: '8px 0', fontSize: '12px' }}>
                    {p.reference_no && (
                      <div style={{ color: '#475569', marginBottom: '2px' }}>
                        <span style={{ fontWeight: 600 }}>Ref / UTR:</span> {p.reference_no}
                      </div>
                    )}
                    {p.notes && (
                      <div style={{ color: '#64748b', fontStyle: 'italic', marginBottom: '2px' }}>
                        <span style={{ fontWeight: 600, fontStyle: 'normal' }}>Note:</span> {p.notes}
                      </div>
                    )}
                    {p.recorded_by && (
                      <div style={{ color: '#94a3b8', fontSize: '11px' }}>
                        Recorded by: {p.recorded_by}
                      </div>
                    )}
                  </div>
                )}

                <div className="card-actions-bar">
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, padding: '6px 8px', fontSize: '12px' }}
                    onClick={() => isCust ? onSelectCustomer(p.customer_id) : onSelectSupplier(p.supplier_id)}
                  >
                    View {isCust ? 'Customer' : 'Supplier'} Profile
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
