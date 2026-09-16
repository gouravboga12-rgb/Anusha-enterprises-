import React, { useState } from 'react';
import { BookMarked, Printer } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const SupplierLedgerView = ({ dataService, onSelectSupplier, onOpenPayment }) => {
  const suppliers = dataService.getSuppliers();
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');

  const selectedSupplier = dataService.getSupplierById(selectedSupplierId);
  const ledgerData = selectedSupplierId ? dataService.getSupplierLedger(selectedSupplierId) : null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <div className="card-header" style={{ marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '20px' }}>Supplier Ledger (Vendor Account Passbook)</h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            Inward purchase bills, payment vouchers dispatched, and running payable balances.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={handlePrint}>
            <Printer size={15} /> Print Ledger
          </button>
        </div>
      </div>

      {/* Supplier Selector */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '280px' }}>
            <label className="form-label" style={{ fontSize: '12px', color: '#64748b' }}>Select Supplier Account:</label>
            <select
              className="form-select"
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              style={{ fontWeight: 600, fontSize: '14px' }}
            >
              {suppliers.map((s) => {
                const bal = dataService.getSupplierLedger(s.id).pendingBalance;
                return (
                  <option key={s.id} value={s.id}>
                    {s.company_name} ({s.supplier_id}) — Payable: {formatCurrency(bal)}
                  </option>
                );
              })}
            </select>
          </div>

          {selectedSupplier && (
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ background: '#f8fafc', padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>TOTAL PURCHASES</span>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                  {formatCurrency(ledgerData?.totalPurchases || 0)}
                </div>
              </div>
              <div style={{ background: '#ecfdf5', padding: '8px 16px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                <span style={{ fontSize: '11px', color: '#047857', fontWeight: 600 }}>TOTAL PAID</span>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#065f46' }}>
                  {formatCurrency(ledgerData?.totalPaid || 0)}
                </div>
              </div>
              <div style={{
                background: (ledgerData?.pendingBalance || 0) > 0 ? '#fffbeb' : '#f8fafc',
                padding: '8px 16px',
                borderRadius: '8px',
                border: `1px solid ${(ledgerData?.pendingBalance || 0) > 0 ? '#fde68a' : '#e2e8f0'}`
              }}>
                <span style={{ fontSize: '11px', color: (ledgerData?.pendingBalance || 0) > 0 ? '#b45309' : '#64748b', fontWeight: 600 }}>
                  PAYABLE BALANCE
                </span>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 800,
                  color: (ledgerData?.pendingBalance || 0) > 0 ? '#d97706' : '#10b981'
                }}>
                  {formatCurrency(ledgerData?.pendingBalance || 0)}
                </div>
                {(ledgerData?.pendingBalance || 0) > 0 && onOpenPayment && (
                  <button
                    className="btn btn-sm"
                    style={{
                      background: '#d97706',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 700,
                      padding: '2px 8px',
                      fontSize: '11px',
                      marginTop: '4px'
                    }}
                    onClick={() => onOpenPayment(selectedSupplierId, 'supplier')}
                  >
                    Pay Balance
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
                <th>Purchase / Voucher #</th>
                <th>Particulars & Goods Received</th>
                <th style={{ textAlign: 'right', color: '#d97706' }}>Credit (Purchase ₹)</th>
                <th style={{ textAlign: 'right', color: '#15803d' }}>Debit (Paid Out ₹)</th>
                <th style={{ textAlign: 'right', color: '#0284c7' }}>Running Balance</th>
              </tr>
            </thead>
            <tbody>
              {!ledgerData || ledgerData.entries.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    No ledger transactions recorded yet for this supplier.
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
                    <td style={{ fontWeight: 700, fontSize: '12px', color: '#0284c7' }}>
                      {entry.reference}
                    </td>
                    <td style={{ fontSize: '13px', maxWidth: '320px' }}>
                      {entry.particulars}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#d97706' }}>
                      {entry.credit > 0 ? formatCurrency(entry.credit) : '—'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#15803d' }}>
                      {entry.debit > 0 ? formatCurrency(entry.debit) : '—'}
                    </td>
                    <td style={{
                      textAlign: 'right',
                      fontWeight: 800,
                      fontSize: '14px',
                      color: entry.balance > 0 ? '#d97706' : '#15803d'
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
