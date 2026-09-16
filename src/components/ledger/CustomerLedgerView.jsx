import React, { useState } from 'react';
import { BookOpen, Printer, Download, User } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const CustomerLedgerView = ({ dataService, onSelectCustomer, onOpenPayment }) => {
  const customers = dataService.getCustomers();
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');

  const selectedCustomer = dataService.getCustomerById(selectedCustomerId);
  const ledgerData = selectedCustomerId ? dataService.getCustomerLedger(selectedCustomerId) : null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <div className="card-header" style={{ marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '20px' }}>Customer Ledger (Digital Khata Book)</h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            Complete chronological record of sales bills, installment payments, and live running balance.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={handlePrint}>
            <Printer size={15} /> Print Passbook
          </button>
        </div>
      </div>

      {/* Customer Selector Card */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '280px' }}>
            <label className="form-label" style={{ fontSize: '12px', color: '#64748b' }}>Select Customer Account:</label>
            <select
              className="form-select"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              style={{ fontWeight: 600, fontSize: '14px' }}
            >
              {customers.map((c) => {
                const bal = dataService.getCustomerLedger(c.id).pendingBalance;
                return (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.customer_id}) — Balance: {formatCurrency(bal)}
                  </option>
                );
              })}
            </select>
          </div>

          {selectedCustomer && (
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ background: '#f8fafc', padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>TOTAL BILLED</span>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                  {formatCurrency(ledgerData?.totalSales || 0)}
                </div>
              </div>
              <div style={{ background: '#ecfdf5', padding: '8px 16px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                <span style={{ fontSize: '11px', color: '#047857', fontWeight: 600 }}>TOTAL PAID</span>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#065f46' }}>
                  {formatCurrency(ledgerData?.totalPaid || 0)}
                </div>
              </div>
              <div style={{
                background: (ledgerData?.pendingBalance || 0) > 0 ? '#fff1f2' : '#f8fafc',
                padding: '8px 16px',
                borderRadius: '8px',
                border: `1px solid ${(ledgerData?.pendingBalance || 0) > 0 ? '#fecdd3' : '#e2e8f0'}`
              }}>
                <span style={{ fontSize: '11px', color: (ledgerData?.pendingBalance || 0) > 0 ? '#be123c' : '#64748b', fontWeight: 600 }}>
                  CURRENT PENDING
                </span>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 800,
                  color: (ledgerData?.pendingBalance || 0) > 0 ? '#e11d48' : '#10b981'
                }}>
                  {formatCurrency(ledgerData?.pendingBalance || 0)}
                </div>
                {(ledgerData?.pendingBalance || 0) > 0 && onOpenPayment && (
                  <button
                    className="btn btn-sm"
                    style={{
                      background: '#e11d48',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 700,
                      padding: '2px 8px',
                      fontSize: '11px',
                      marginTop: '4px'
                    }}
                    onClick={() => onOpenPayment(selectedCustomerId, 'customer')}
                  >
                    Collect Due
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Transaction Type</th>
                <th>Invoice / Receipt #</th>
                <th>Particulars & Notes</th>
                <th style={{ textAlign: 'right', color: '#b91c1c' }}>Debit (Sale Amount ₹)</th>
                <th style={{ textAlign: 'right', color: '#15803d' }}>Credit (Payment Received ₹)</th>
                <th style={{ textAlign: 'right', color: '#0284c7' }}>Running Balance</th>
              </tr>
            </thead>
            <tbody>
              {!ledgerData || ledgerData.entries.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
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
                    <td style={{ fontWeight: 700, fontSize: '12px', color: '#0284c7' }}>
                      {entry.reference}
                    </td>
                    <td style={{ fontSize: '13px', maxWidth: '320px' }}>
                      {entry.particulars}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#b91c1c' }}>
                      {entry.debit > 0 ? formatCurrency(entry.debit) : '—'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#15803d' }}>
                      {entry.credit > 0 ? formatCurrency(entry.credit) : '—'}
                    </td>
                    <td style={{
                      textAlign: 'right',
                      fontWeight: 800,
                      fontSize: '14px',
                      color: entry.balance > 0 ? '#b91c1c' : '#15803d'
                    }}>
                      {formatCurrency(entry.balance)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
