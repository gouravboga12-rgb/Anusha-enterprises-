import React, { useState, useMemo } from 'react';
import { BookOpen, Printer, Download, User, Calendar, Filter, Warehouse, CheckCircle2 } from 'lucide-react';
import { formatCurrency, formatDate, getTodayDateString } from '../../utils/formatters';
import { exportElementToPdf } from '../../utils/pdfExport';

export const CustomerLedgerView = ({ dataService, onSelectCustomer, onOpenPayment }) => {
  const customers = dataService.getCustomers();
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [dateRangeFilter, setDateRangeFilter] = useState('all'); // 'all' | 'this_month' | 'custom'
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState(getTodayDateString());
  const [isSavingPdf, setIsSavingPdf] = useState(false);

  const selectedCustomer = dataService.getCustomerById(selectedCustomerId);
  const rawLedgerData = selectedCustomerId ? dataService.getCustomerLedger(selectedCustomerId) : null;

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

  const handleSavePdf = async () => {
    setIsSavingPdf(true);
    try {
      await exportElementToPdf({
        element: '#customer-ledger-document',
        filename: `Customer_Ledger_${selectedCustomer?.name || 'Account'}_${getTodayDateString()}.pdf`,
        title: `Customer Ledger - ${selectedCustomer?.name}`
      });
    } finally {
      setIsSavingPdf(false);
    }
  };

  return (
    <div>
      {/* Non-Printable Header Actions */}
      <div className="card-header no-print" style={{ marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '20px' }}>Customer Ledger (Statement of Accounts)</h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            Complete chronological record of sales bills, installment payments, and live running balance.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handlePrint}
            onTouchEnd={(e) => { e.preventDefault(); handlePrint(); }}
            style={{ touchAction: 'manipulation' }}
            title="Print ledger statement"
          >
            <Printer size={15} /> Print
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSavePdf}
            onTouchEnd={(e) => { e.preventDefault(); if (!isSavingPdf) handleSavePdf(); }}
            disabled={isSavingPdf}
            style={{ touchAction: 'manipulation' }}
            title="Download Statement PDF"
          >
            <Download size={15} /> {isSavingPdf ? 'Saving PDF...' : 'Save PDF'}
          </button>
        </div>
      </div>

      {/* Customer Selector Card */}
      <div className="card no-print" style={{ padding: '16px 20px', marginBottom: '16px' }}>
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
                const cLedger = dataService.getCustomerLedger(c.id);
                const bal = cLedger.pendingBalance;
                const adv = cLedger.advanceBalance;
                const tag = adv > 0 ? `Advance: ${formatCurrency(adv)}` : `Balance: ${formatCurrency(bal)}`;
                return (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.customer_id}) — {tag}
                  </option>
                );
              })}
            </select>
          </div>

          {selectedCustomer && (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ background: '#f8fafc', padding: '8px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>TOTAL BILLED</span>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                  {formatCurrency(rawLedgerData?.totalSales || 0)}
                </div>
              </div>
              <div style={{ background: '#ecfdf5', padding: '8px 14px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                <span style={{ fontSize: '11px', color: '#047857', fontWeight: 600 }}>TOTAL PAID</span>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#065f46' }}>
                  {formatCurrency(rawLedgerData?.totalPaid || 0)}
                </div>
              </div>
              <div style={{
                background: (rawLedgerData?.pendingBalance || 0) > 0 ? '#fff1f2' : '#f8fafc',
                padding: '8px 14px',
                borderRadius: '8px',
                border: `1px solid ${(rawLedgerData?.pendingBalance || 0) > 0 ? '#fecdd3' : '#e2e8f0'}`
              }}>
                <span style={{ fontSize: '11px', color: (rawLedgerData?.pendingBalance || 0) > 0 ? '#be123c' : '#64748b', fontWeight: 600 }}>
                  CURRENT PENDING
                </span>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 800,
                  color: (rawLedgerData?.pendingBalance || 0) > 0 ? '#e11d48' : '#10b981'
                }}>
                  {formatCurrency(rawLedgerData?.pendingBalance || 0)}
                </div>
                {(rawLedgerData?.pendingBalance || 0) > 0 && onOpenPayment && (
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

              {/* ADVANCE PAYMENT SECTION */}
              <div style={{
                background: (rawLedgerData?.advanceBalance || 0) > 0 ? '#ecfdf5' : '#f8fafc',
                padding: '8px 14px',
                borderRadius: '8px',
                border: `1px solid ${(rawLedgerData?.advanceBalance || 0) > 0 ? '#6ee7b7' : '#e2e8f0'}`
              }}>
                <span style={{ fontSize: '11px', color: (rawLedgerData?.advanceBalance || 0) > 0 ? '#047857' : '#64748b', fontWeight: 600 }}>
                  ADVANCE CREDIT
                </span>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 800,
                  color: (rawLedgerData?.advanceBalance || 0) > 0 ? '#059669' : '#94a3b8'
                }}>
                  {formatCurrency(rawLedgerData?.advanceBalance || 0)}
                </div>
                {(rawLedgerData?.advanceBalance || 0) > 0 && (
                  <div style={{ fontSize: '10px', color: '#065f46', fontWeight: 600, marginTop: '2px' }}>
                    Customer surplus credit
                  </div>
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

      {/* Printable Statement Document Header (visible on print & in statement card) */}
      {/* Printable Statement Document Header (visible on print & in statement card) */}
      <div className="card print-document" id="customer-ledger-document">
        <div className="print-header" style={{ display: 'none', borderBottom: '2px solid #0f172a', paddingBottom: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: '#0f172a' }}>ANUSHA ENTERPRISES</h2>
              <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#475569' }}>
                Main Road, Nandipet, Nizamabad Dist. • Ph: 96409 12521
              </p>
              <div style={{ marginTop: '8px', fontSize: '14px', fontWeight: 700, color: '#0284c7' }}>
                CUSTOMER ACCOUNT LEDGER STATEMENT
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '12px', color: '#334155' }}>
              <div><strong>Customer:</strong> {selectedCustomer?.name}</div>
              <div><strong>Code:</strong> {selectedCustomer?.customer_id}</div>
              <div><strong>Area:</strong> {selectedCustomer?.area || 'Nandipet'}</div>
              <div><strong>Statement Date:</strong> {formatDate(getTodayDateString())}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #e2e8f0', textAlign: 'center', fontSize: '11px' }}>
            <div style={{ background: '#f8fafc', padding: '6px', borderRadius: '4px' }}>
              <span style={{ color: '#64748b' }}>Total Billed:</span><br />
              <strong style={{ color: '#0f172a' }}>{formatCurrency(rawLedgerData?.totalSales || 0)}</strong>
            </div>
            <div style={{ background: '#f8fafc', padding: '6px', borderRadius: '4px' }}>
              <span style={{ color: '#64748b' }}>Total Paid:</span><br />
              <strong style={{ color: '#065f46' }}>{formatCurrency(rawLedgerData?.totalPaid || 0)}</strong>
            </div>
            <div style={{ background: '#f8fafc', padding: '6px', borderRadius: '4px' }}>
              <span style={{ color: '#64748b' }}>Current Pending:</span><br />
              <strong style={{ color: (rawLedgerData?.pendingBalance || 0) > 0 ? '#e11d48' : '#10b981' }}>{formatCurrency(rawLedgerData?.pendingBalance || 0)}</strong>
            </div>
            <div style={{ background: (rawLedgerData?.advanceBalance || 0) > 0 ? '#ecfdf5' : '#f8fafc', padding: '6px', borderRadius: '4px' }}>
              <span style={{ color: '#047857' }}>Advance Credit:</span><br />
              <strong style={{ color: (rawLedgerData?.advanceBalance || 0) > 0 ? '#059669' : '#94a3b8' }}>{formatCurrency(rawLedgerData?.advanceBalance || 0)}</strong>
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Type</th>
                <th>Voucher / Bill #</th>
                <th>Particulars & Line Items</th>
                <th style={{ textAlign: 'right', color: '#b91c1c' }}>Debit (Billed ₹)</th>
                <th style={{ textAlign: 'right', color: '#15803d' }}>Credit (Paid ₹)</th>
                <th style={{ textAlign: 'right', color: '#0284c7' }}>Running Balance / Status</th>
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
                      <span className={`badge ${entry.type === 'SALE' ? 'badge-credit' : 'badge-debit'}`}>
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
                              <span>• {itm.product_name}: <strong>{itm.quantity}</strong> × ₹{itm.selling_price} = <strong>₹{itm.total}</strong></span>
                              {itm.godown && (
                                <span style={{ color: '#0284c7', fontSize: '10.5px' }}>[{itm.godown}]</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
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
                      fontSize: '13.5px'
                    }}>
                      {entry.balanceStatus === 'ADVANCE' ? (
                        <span style={{ color: '#059669', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          +{formatCurrency(entry.advance)}
                          <span style={{ fontSize: '10px', background: '#dcfce7', color: '#15803d', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                            Advance
                          </span>
                        </span>
                      ) : entry.balanceStatus === 'DUE' ? (
                        <span style={{ color: '#e11d48' }}>
                          {formatCurrency(entry.balance)}
                        </span>
                      ) : (
                        <span style={{ color: '#10b981' }}>
                          ₹0 (Settled)
                        </span>
                      )}
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
