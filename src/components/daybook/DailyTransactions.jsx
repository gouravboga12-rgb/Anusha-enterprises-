import React, { useState, useMemo } from 'react';
import {
  Calendar, Printer, Filter, ArrowDownLeft, ArrowUpRight,
  CheckCircle2, TrendingUp, BookOpen, Package, Users, Warehouse, Download
} from 'lucide-react';
import { formatCurrency, formatDate, getTodayDateString } from '../../utils/formatters';
import { exportElementToPdf } from '../../utils/pdfExport';
import { RevenueProfitReport } from '../reports/RevenueProfitReport';

export const DailyTransactions = ({ dataService }) => {
  const [dateMode, setDateMode] = useState('single'); // 'single' | 'range' | 'all'
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState(getTodayDateString());
  const [typeFilter, setTypeFilter] = useState('all');
  const [activeSubTab, setActiveSubTab] = useState('daybook'); // 'daybook' or 'profit'
  const [isSavingPdf, setIsSavingPdf] = useState(false);

  const handleSetToday = () => {
    setDateMode('single');
    setSelectedDate(getTodayDateString());
  };

  const handleSetYesterday = () => {
    setDateMode('single');
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleSetThisWeek = () => {
    setDateMode('range');
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(d.setDate(diff)).toISOString().split('T')[0];
    setFromDate(monday);
    setToDate(getTodayDateString());
  };

  const handleSetThisMonth = () => {
    setDateMode('range');
    const d = new Date();
    const firstDay = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
    setFromDate(firstDay);
    setToDate(getTodayDateString());
  };

  const handleSetAll = () => {
    setDateMode('all');
  };

  const handleSavePdf = async () => {
    setIsSavingPdf(true);
    try {
      const periodStr = dateMode === 'single'
        ? selectedDate
        : (dateMode === 'all' ? 'All_Records' : `${fromDate || 'Start'}_to_${toDate || 'Latest'}`);
      await exportElementToPdf({
        element: document.getElementById('daybook-document'),
        filename: `DayBook_Statement_${periodStr}.pdf`,
        title: `Day Book Statement - ${periodLabel}`
      });
    } finally {
      setIsSavingPdf(false);
    }
  };

  // Compile transactions based on date mode
  const { events, totalSalesAmount, totalPurchasesAmount, cashInflow, cashOutflow, netCashMovement } = useMemo(() => {
    if (!dataService?.getDayBook) {
      return { events: [], totalSalesAmount: 0, totalPurchasesAmount: 0, cashInflow: 0, cashOutflow: 0, netCashMovement: 0 };
    }

    if (dateMode === 'single') {
      return dataService.getDayBook(selectedDate);
    }

    // Date range aggregation or all records
    const start = dateMode === 'all' ? '2000-01-01' : (fromDate || '2000-01-01');
    const end = dateMode === 'all' ? '2099-12-31' : (toDate || '2099-12-31');

    // Get all dates in range from sales, purchases, payments, adjustments, transfers
    const salesInRange = dataService.sales.filter((s) => s.date >= start && s.date <= end);
    const purchasesInRange = dataService.purchases.filter((p) => p.date >= start && p.date <= end);
    const paymentsInRange = dataService.payments.filter((p) => p.date >= start && p.date <= end);
    const adjInRange = (dataService.adjustments || []).filter((a) => a.date >= start && a.date <= end);
    const transfersInRange = (dataService.stockTransfers || []).filter((t) => t.date >= start && t.date <= end);

    let totSales = 0, totPurchases = 0, totInflow = 0, totOutflow = 0;
    const allEvents = [];

    salesInRange.forEach((s) => {
      totSales += s.total_amount || 0;
      const cust = dataService.getCustomerById(s.customer_id);
      const itemLines = (s.items || []).map((i) => {
        const g = dataService.getGodownById(i.godown_id);
        return `${i.product_name}: ${i.quantity} × ₹${Number(i.selling_price).toLocaleString('en-IN')} = ₹${Number(i.total).toLocaleString('en-IN')}${g ? ` [${g.name}]` : ''}`;
      });
      allEvents.push({
        id: s.id, date: s.date, time: s.time, type: 'Customer Sale', badgeClass: 'badge-active',
        party: cust ? cust.name : 'Customer',
        details: itemLines.join('\n'),
        items_detail: s.items,
        amount: s.total_amount, amountType: 'neutral',
        reference: s.invoice_no, status: s.payment_status
      });
    });

    purchasesInRange.forEach((p) => {
      totPurchases += p.total_amount || 0;
      const supp = dataService.getSupplierById(p.supplier_id);
      const godown = dataService.getGodownById(p.godown_id);
      const itemLines = (p.items || []).map((i) =>
        `${i.product_name}: ${i.quantity} × ₹${Number(i.purchase_price).toLocaleString('en-IN')} = ₹${Number(i.total).toLocaleString('en-IN')}`
      );
      allEvents.push({
        id: p.id, date: p.date, time: p.time, type: 'Supplier Purchase', badgeClass: 'badge-warning',
        party: supp ? supp.company_name : 'Supplier',
        details: itemLines.join('\n'),
        items_detail: p.items,
        godown: godown?.name,
        amount: p.total_amount, amountType: 'neutral',
        reference: p.purchase_no, status: p.payment_status
      });
    });

    paymentsInRange.forEach((pay) => {
      if (pay.type === 'customer_payment') {
        totInflow += pay.amount || 0;
        const cust = dataService.getCustomerById(pay.customer_id);
        allEvents.push({
          id: pay.id, date: pay.date, time: pay.time, type: 'Customer Payment Inward', badgeClass: 'badge-paid',
          party: cust ? cust.name : 'Customer',
          details: `Via ${pay.payment_mode}${pay.notes ? ` — ${pay.notes}` : ''}`,
          amount: pay.amount, amountType: 'inflow',
          reference: pay.receipt_no, status: 'Settled'
        });
      } else {
        totOutflow += pay.amount || 0;
        const supp = dataService.getSupplierById(pay.supplier_id);
        allEvents.push({
          id: pay.id, date: pay.date, time: pay.time, type: 'Supplier Payment Outward', badgeClass: 'badge-danger',
          party: supp ? supp.company_name : 'Supplier',
          details: `Via ${pay.payment_mode}${pay.notes ? ` — ${pay.notes}` : ''}`,
          amount: pay.amount, amountType: 'outflow',
          reference: pay.receipt_no, status: 'Settled'
        });
      }
    });

    adjInRange.forEach((adj) => {
      const prod = dataService.getProductById(adj.product_id);
      const godown = dataService.getGodownById(adj.godown_id);
      allEvents.push({
        id: adj.id, date: adj.date, time: adj.time,
        type: `Stock ${adj.adjustment_type === 'increase' ? 'Addition' : 'Reduction'}`,
        badgeClass: 'badge-neutral',
        party: prod ? prod.name : 'Product',
        details: `${adj.adjustment_type.toUpperCase()}: ${adj.quantity} ${prod?.unit || 'units'}${godown ? ` in ${godown.name}` : ''} — ${adj.reason}`,
        amount: null, amountType: 'none', reference: 'ADJ', status: 'Audit Log'
      });
    });

    transfersInRange.forEach((t) => {
      const prod = dataService.getProductById(t.product_id);
      const fromG = dataService.getGodownById(t.from_godown_id);
      const toG = dataService.getGodownById(t.to_godown_id);
      allEvents.push({
        id: t.id, date: t.date, time: t.time, type: 'Stock Transfer', badgeClass: 'badge-info',
        party: prod ? prod.name : 'Product',
        details: `${t.quantity} ${prod?.unit || 'units'} from ${fromG?.name || '?'} → ${toG?.name || '?'}${t.reason ? ` — ${t.reason}` : ''}`,
        amount: null, amountType: 'none', reference: t.transfer_no, status: 'Completed'
      });
    });

    allEvents.sort((a, b) => new Date(`${b.date}T${b.time || '00:00'}`) - new Date(`${a.date}T${a.time || '00:00'}`));

    return {
      events: allEvents,
      totalSalesAmount: totSales,
      totalPurchasesAmount: totPurchases,
      cashInflow: totInflow,
      cashOutflow: totOutflow,
      netCashMovement: totInflow - totOutflow
    };
  }, [dataService, dateMode, selectedDate, fromDate, toDate]);

  const filteredEvents = useMemo(() => {
    if (typeFilter === 'all') return events;
    if (typeFilter === 'sales') return events.filter((e) => e.type === 'Customer Sale');
    if (typeFilter === 'purchases') return events.filter((e) => e.type === 'Supplier Purchase');
    if (typeFilter === 'inflow') return events.filter((e) => e.type === 'Customer Payment Inward');
    if (typeFilter === 'outflow') return events.filter((e) => e.type === 'Supplier Payment Outward');
    if (typeFilter === 'stock') return events.filter((e) => e.type.includes('Stock'));
    return events;
  }, [events, typeFilter]);

  const periodLabel = dateMode === 'single'
    ? formatDate(selectedDate)
    : (dateMode === 'all' ? 'All Records (Complete Statement)' : `${formatDate(fromDate || 'Start')} to ${formatDate(toDate)}`);

  return (
    <div>
      {/* Top Mode Toggle */}
      <div className="subnav-tabs-bar no-print" style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
        <button
          className={`btn ${activeSubTab === 'daybook' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveSubTab('daybook')}
        >
          <BookOpen size={16} /> Daily Register & Day Book
        </button>
        <button
          className={`btn ${activeSubTab === 'profit' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveSubTab('profit')}
        >
          <TrendingUp size={16} /> Profit & Sales Reports
        </button>
      </div>

      {activeSubTab === 'profit' ? (
        <RevenueProfitReport dataService={dataService} />
      ) : (
        <>
          <div className="card-header no-print" style={{ marginBottom: '16px' }}>
            <div>
              <h1 style={{ fontSize: '20px' }}>Daily Transactions Register & Statement</h1>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                Complete audit register of all business movements — sales, purchases, payments, and godown transfers.
              </p>
            </div>
            <div className="header-actions-group" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                className="btn btn-secondary"
                onClick={handleSavePdf}
                disabled={isSavingPdf}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#f0fdf4',
                  color: '#16a34a',
                  border: '1px solid #bbf7d0',
                  cursor: isSavingPdf ? 'wait' : 'pointer'
                }}
                title="Download Day Book Statement as PDF File"
              >
                <Download size={15} /> {isSavingPdf ? 'Generating PDF...' : 'Download PDF'}
              </button>
              <button className="btn btn-secondary" onClick={() => window.print()}>
                <Printer size={15} /> Print Statement
              </button>
            </div>
          </div>

          {/* Date Selector Banner */}
          <div className="card no-print" style={{ padding: '16px 20px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={18} color="#0284c7" />
                  <span style={{ fontWeight: 700, fontSize: '13.5px', color: '#0f172a' }}>Period:</span>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    className={`btn btn-sm ${dateMode === 'single' && selectedDate === getTodayDateString() ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={handleSetToday}
                  >
                    Today
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={handleSetYesterday}
                  >
                    Yesterday
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={handleSetThisWeek}
                  >
                    This Week
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={handleSetThisMonth}
                  >
                    This Month
                  </button>
                  <button
                    className={`btn btn-sm ${dateMode === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={handleSetAll}
                  >
                    All Records
                  </button>
                </div>

                {dateMode === 'single' ? (
                  <input
                    type="date"
                    className="form-input"
                    style={{ width: 'auto', fontWeight: 600, fontSize: '12px', padding: '4px 8px' }}
                    value={selectedDate}
                    onChange={(e) => {
                      setDateMode('single');
                      setSelectedDate(e.target.value);
                    }}
                  />
                ) : dateMode === 'range' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="date"
                      className="form-input"
                      style={{ width: 'auto', fontSize: '12px', padding: '4px 8px' }}
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                    />
                    <span style={{ fontSize: '12px', color: '#64748b' }}>to</span>
                    <input
                      type="date"
                      className="form-input"
                      style={{ width: 'auto', fontSize: '12px', padding: '4px 8px' }}
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                    />
                  </div>
                ) : (
                  <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600, background: '#ecfdf5', padding: '3px 8px', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
                    All Records Included
                  </span>
                )}
              </div>

              {/* Quick Type Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Filter:</span>
                <select
                  className="form-select"
                  style={{ width: 'auto', padding: '5px 10px', fontSize: '12.5px' }}
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="all">All Events ({events.length})</option>
                  <option value="sales">Sales Only</option>
                  <option value="purchases">Purchases Only</option>
                  <option value="inflow">Cash Inward Receipts</option>
                  <option value="outflow">Cash Outward Payments</option>
                  <option value="stock">Stock Transfers & Adjustments</option>
                </select>
              </div>
            </div>
          </div>

          {/* Daily Summary Cards Strip */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginBottom: '18px'
          }}>
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '14px 16px', borderRadius: '10px' }}>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>TOTAL SALES BILLED</span>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                {formatCurrency(totalSalesAmount)}
              </div>
              <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', margin: 0 }}>Goods dispatched</p>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '14px 16px', borderRadius: '10px' }}>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>TOTAL PURCHASES</span>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                {formatCurrency(totalPurchasesAmount)}
              </div>
              <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', margin: 0 }}>Supplier goods received</p>
            </div>

            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '14px 16px', borderRadius: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#047857' }}>
                <span style={{ fontSize: '11px', fontWeight: 700 }}>CASH INFLOW</span>
                <ArrowDownLeft size={16} />
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#065f46', marginTop: '4px' }}>
                +{formatCurrency(cashInflow)}
              </div>
              <p style={{ fontSize: '11px', color: '#059669', marginTop: '2px', margin: 0 }}>Customer receipts</p>
            </div>

            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '14px 16px', borderRadius: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#be123c' }}>
                <span style={{ fontSize: '11px', fontWeight: 700 }}>CASH OUTFLOW</span>
                <ArrowUpRight size={16} />
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#9f1239', marginTop: '4px' }}>
                -{formatCurrency(cashOutflow)}
              </div>
              <p style={{ fontSize: '11px', color: '#e11d48', marginTop: '2px', margin: 0 }}>Supplier payouts</p>
            </div>

            <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', padding: '14px 16px', borderRadius: '10px' }}>
              <span style={{ fontSize: '11px', color: '#0284c7', fontWeight: 700 }}>NET LIQUID FLOW</span>
              <div style={{
                fontSize: '18px',
                fontWeight: 800,
                color: netCashMovement >= 0 ? '#10b981' : '#e11d48',
                marginTop: '4px'
              }}>
                {formatCurrency(netCashMovement)}
              </div>
              <p style={{ fontSize: '11px', color: '#0284c7', marginTop: '2px', margin: 0 }}>Period net movement</p>
            </div>
          </div>

          {/* Printable Statement Document */}
          <div id="daybook-document" className="card print-document" style={{ padding: '16px' }}>
            {/* Print Header */}
            <div className="print-header" style={{ display: 'none', borderBottom: '2px solid #0f172a', paddingBottom: '14px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#0f172a' }}>ANUSHA ENTERPRISES</h2>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#475569' }}>
                    Main Road, Nandipet, Nizamabad Dist. • Ph: 96409 12521
                  </p>
                  <div style={{ marginTop: '6px', fontSize: '13px', fontWeight: 700, color: '#0284c7' }}>
                    BUSINESS DAY BOOK & ACTIVITY STATEMENT
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '12px', color: '#334155' }}>
                  <div><strong>Period:</strong> {periodLabel}</div>
                  <div><strong>Generated:</strong> {formatDate(getTodayDateString())}</div>
                  <div><strong>Total Events:</strong> {filteredEvents.length}</div>
                </div>
              </div>
            </div>

            <div className="table-responsive" style={{ border: 'none' }}>
              <table className="data-table" style={{ width: '100%', tableLayout: 'fixed' }}>
                <colgroup>
                  {dateMode === 'range' && <col style={{ width: '7%' }} />}
                  <col style={{ width: '7%' }} />
                  <col style={{ width: '16%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: dateMode === 'range' ? '36%' : '40%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '8%' }} />
                  <col style={{ width: '8%' }} />
                </colgroup>
                <thead>
                  <tr>
                    {dateMode === 'range' && <th>Date</th>}
                    <th>Time</th>
                    <th>Transaction Type</th>
                    <th>Party / Counterpart</th>
                    <th>Items &amp; Transaction Breakdown</th>
                    <th style={{ textAlign: 'right' }}>Amount (₹)</th>
                    <th>Reference</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.length === 0 ? (
                    <tr>
                      <td colSpan={dateMode === 'range' ? 8 : 7} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                        No transactions recorded in this period.
                      </td>
                    </tr>
                  ) : (
                    filteredEvents.map((evt) => (
                      <tr key={evt.id}>
                        {dateMode === 'range' && (
                          <td style={{ fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {formatDate(evt.date)}
                          </td>
                        )}
                        <td style={{ fontWeight: 600, color: '#64748b', fontSize: '12px', whiteSpace: 'nowrap' }}>
                          {evt.time || '—'}
                        </td>
                        <td>
                          <span className={`badge ${evt.badgeClass}`}>{evt.type}</span>
                        </td>
                        <td style={{ fontWeight: 700, color: '#0f172a' }}>
                          {evt.party}
                          {evt.godown && (
                            <div style={{ fontSize: '11px', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Warehouse size={11} /> {evt.godown}
                            </div>
                          )}
                        </td>
                        <td style={{ fontSize: '12px', wordBreak: 'break-word' }}>
                          <div style={{ whiteSpace: 'pre-line', lineHeight: 1.4 }}>
                            {evt.details}
                          </div>
                        </td>
                        <td style={{
                          textAlign: 'right',
                          fontWeight: 800,
                          fontSize: '12.5px',
                          whiteSpace: 'nowrap',
                          color:
                            evt.amountType === 'inflow' ? '#10b981' :
                            evt.amountType === 'outflow' ? '#e11d48' : '#0f172a'
                        }}>
                          {evt.amount !== null && evt.amount !== undefined ? (
                            `${evt.amountType === 'inflow' ? '+' : evt.amountType === 'outflow' ? '-' : ''}${formatCurrency(evt.amount)}`
                          ) : '—'}
                        </td>
                        <td style={{ fontWeight: 600, fontSize: '12px', color: '#0284c7' }}>
                          {evt.reference || '—'}
                        </td>
                        <td>
                          <span className="badge badge-paid">{evt.status}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
