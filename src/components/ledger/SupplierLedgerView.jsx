import React, { useState, useMemo } from 'react';
import { BookMarked, Printer, Download, Warehouse, Calendar, Filter } from 'lucide-react';
import { formatCurrency, formatDate, getTodayDateString } from '../../utils/formatters';

export const SupplierLedgerView = ({ dataService, onSelectSupplier, onOpenPayment }) => {
  const suppliers = dataService.getSuppliers();
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [dateRangeFilter, setDateRangeFilter] = useState('all'); // 'all' | 'this_month' | 'custom'
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState(getTodayDateString());

  const selectedSupplier = dataService.getSupplierById(selectedSupplierId);
  const rawLedgerData = selectedSupplierId ? dataService.getSupplierLedger(selectedSupplierId) : null;

  // Filter entries by date range
  const filteredEntries = useMemo(() => {
    if (!rawLedgerData?.entries) return [];
    let list = rawLedgerData.entries;

    if (dateRangeFilter === 'this_month') {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      list = list.filter((e) => e.date >= firstDay);
    } else if (dateRangeFilter === 'custom') {
      if (fromDate) list = list.filter((e) => e.date >= fromDate);
      if (toDate) list = list.filter((e) => e.date <= toDate);
    }

    return list;
  }, [rawLedgerData, dateRangeFilter, fromDate, toDate]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      {/* Non-Printable Header */}
      <div className="card-header no-print" style={{ marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '20px' }}>Supplier Ledger (Vendor Account Passbook)</h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            Inward purchase bills, payment vouchers dispatched, and running payable balances.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={handlePrint}>
            <Printer size={15} /> Print / Save PDF Statement
          </button>
        </div>
      </div>

      {/* Supplier Selector */}
      <div className="card no-print" style={{ padding: '16px 20px', marginBottom: '16px' }}>
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
                  {formatCurrency(rawLedgerData?.totalPurchases || 0)}
                </div>
              </div>
              <div style={{ background: '#ecfdf5', padding: '8px 16px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                <span style={{ fontSize: '11px', color: '#047857', fontWeight: 600 }}>TOTAL PAID</span>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#065f46' }}>
                  {formatCurrency(rawLedgerData?.totalPaid || 0)}
                </div>
              </div>
              <div style={{
                background: (rawLedgerData?.pendingBalance || 0) > 0 ? '#fffbeb' : '#f8fafc',
                padding: '8px 16px',
                borderRadius: '8px',
                border: `1px solid ${(rawLedgerData?.pendingBalance || 0) > 0 ? '#fde68a' : '#e2e8f0'}`
              }}>
                <span style={{ fontSize: '11px', color: (rawLedgerData?.pendingBalance || 0) > 0 ? '#b45309' : '#64748b', fontWeight: 600 }}>
                  PAYABLE BALANCE
                </span>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 800,
                  color: (rawLedgerData?.pendingBalance || 0) > 0 ? '#d97706' : '#10b981'
                }}>
                  {formatCurrency(rawLedgerData?.pendingBalance || 0)}
                </div>
                {(rawLedgerData?.pendingBalance || 0) > 0 && onOpenPayment && (
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

        {/* Date Range Filter Controls */}
        <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Statement Period:</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className={`btn btn-sm ${dateRangeFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setDateRangeFilter('all')}
            >
              All Records
            </button>
            <button
              className={`btn btn-sm ${dateRangeFilter === 'this_month' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setDateRangeFilter('this_month')}
            >
              This Month
            </button>
            <button
              className={`btn btn-sm ${dateRangeFilter === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setDateRangeFilter('custom')}
            >
              Custom Range
            </button>
          </div>

          {dateRangeFilter === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="date"
                className="form-input"
                style={{ padding: '4px 8px', fontSize: '12px' }}
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
              <span style={{ fontSize: '12px', color: '#64748b' }}>to</span>
              <input
                type="date"
                className="form-input"
                style={{ padding: '4px 8px', fontSize: '12px' }}
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Printable Statement Document Header */}
      <div className="card print-document">
        <div className="print-header" style={{ display: 'none', borderBottom: '2px solid #0f172a', paddingBottom: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: '#0f172a' }}>ANUSHA ENTERPRISES</h2>
              <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#475569' }}>
                Main Road, Nandipet, Nizamabad Dist. • Ph: 96409 12521
              </p>
              <div style={{ marginTop: '8px', fontSize: '14px', fontWeight: 700, color: '#0284c7' }}>
                SUPPLIER ACCOUNT PASSBOOK STATEMENT
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '12px', color: '#334155' }}>
              <div><strong>Vendor:</strong> {selectedSupplier?.company_name}</div>
              <div><strong>Code:</strong> {selectedSupplier?.supplier_id}</div>
              <div><strong>Area:</strong> {selectedSupplier?.area || 'Hub'}</div>
              <div><strong>Statement Date:</strong> {formatDate(getTodayDateString())}</div>
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Type</th>
                <th>Purchase / Voucher #</th>
                <th>Particulars & Goods Received</th>
                <th style={{ textAlign: 'right', color: '#d97706' }}>Credit (Inward ₹)</th>
                <th style={{ textAlign: 'right', color: '#15803d' }}>Debit (Paid Out ₹)</th>
                <th style={{ textAlign: 'right', color: '#0284c7' }}>Running Balance</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    No ledger transactions recorded in this period.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
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
                    <td style={{ fontSize: '12.5px', maxWidth: '380px' }}>
                      <div style={{ fontWeight: 500, color: '#0f172a' }}>{entry.particulars}</div>
                      {entry.items_detail && entry.items_detail.length > 0 && (
                        <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {entry.items_detail.map((itm, idx) => (
                            <div key={idx} style={{ fontSize: '11px', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span>• {itm.product_name}: <strong>{itm.quantity}</strong> × ₹{itm.purchase_price} = <strong>₹{itm.total}</strong></span>
                              {itm.godown && (
                                <span style={{ color: '#0284c7', fontSize: '10.5px' }}>[{itm.godown}]</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
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
                      color: entry.balance > 0 ? '#d97706' : '#10b981'
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
