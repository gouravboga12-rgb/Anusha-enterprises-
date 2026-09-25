import React, { useState, useMemo } from 'react';
import {
  Calendar, Printer, Filter, ArrowDownLeft, ArrowUpRight,
  CheckCircle2, TrendingUp, BookOpen, Package, Users, Warehouse, Download
} from 'lucide-react';
import { formatCurrency, formatDate, getTodayDateString } from '../../utils/formatters';
import { exportElementToPdf } from '../../utils/pdfExport';
import { RevenueProfitReport } from '../reports/RevenueProfitReport';

export const DailyTransactions = ({ dataService }) => {
  const [dateMode, setDateMode] = useState('all'); // 'single' | 'range' | 'all' (default All as requested)
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState(getTodayDateString());
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'sales' | 'purchases'
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

  const periodLabel = dateMode === 'single'
    ? formatDate(selectedDate)
    : (dateMode === 'all' ? 'All Records (Complete Statement)' : `${formatDate(fromDate || 'Start')} to ${formatDate(toDate)}`);

  const handleSavePdf = async () => {
    if (isSavingPdf) return;
    setIsSavingPdf(true);
    try {
      const periodStr = dateMode === 'single'
        ? selectedDate
        : (dateMode === 'all' ? 'All_Records' : `${fromDate || 'Start'}_to_${toDate || 'Latest'}`);
      const typeStr = typeFilter === 'sales' ? '_Only_Sales' : (typeFilter === 'purchases' ? '_Only_Purchases' : '');
      const filterTitleText = typeFilter === 'sales' ? ' (Only Sales)' : (typeFilter === 'purchases' ? ' (Only Purchases)' : '');

      await exportElementToPdf({
        element: '#daybook-document',
        filename: `DayBook_Statement_${periodStr}${typeStr}.pdf`,
        title: `Day Book Statement - ${periodLabel}${filterTitleText}`
      });
    } finally {
      setIsSavingPdf(false);
    }
  };

  // Compile transactions based on date mode - strictly Sales & Purchases (excluding internal transfers & manual adjustments)
  const { events, totalSalesAmount, totalPurchasesAmount, cashInflow, cashOutflow, netCashMovement } = useMemo(() => {
    if (!dataService?.sales || !dataService?.purchases) {
      return { events: [], totalSalesAmount: 0, totalPurchasesAmount: 0, cashInflow: 0, cashOutflow: 0, netCashMovement: 0 };
    }

    const start = dateMode === 'single' ? selectedDate : (dateMode === 'all' ? '2000-01-01' : (fromDate || '2000-01-01'));
    const end = dateMode === 'single' ? selectedDate : (dateMode === 'all' ? '2099-12-31' : (toDate || '2099-12-31'));

    const salesInRange = (dataService.sales || []).filter((s) => s.date >= start && s.date <= end);
    const purchasesInRange = (dataService.purchases || []).filter((p) => p.date >= start && p.date <= end);
    const paymentsInRange = (dataService.payments || []).filter((p) => p.date >= start && p.date <= end);

    let totSales = 0;
    let totPurchases = 0;
    let totInflow = 0;
    let totOutflow = 0;
    const allEvents = [];

    // 1. Sales Records (Dispatched Goods)
    salesInRange.forEach((s) => {
      totSales += Number(s.total_amount) || 0;
      const cust = dataService.getCustomerById(s.customer_id);
      const itemLines = (s.items || []).map((i) => {
        const prod = dataService.getProductById(i.product_id);
        const unit = (i.unit && String(i.unit).trim()) || prod?.unit || 'Units';
        const g = dataService.getGodownById(i.godown_id);
        return `${i.product_name}: ${i.quantity} ${unit} × ₹${Number(i.selling_price).toLocaleString('en-IN')} = ₹${Number(i.total).toLocaleString('en-IN')}${g ? ` [${g.name}]` : ''}`;
      });
      allEvents.push({
        id: s.id,
        date: s.date,
        time: s.time,
        type: 'Customer Sale',
        rawType: 'sale',
        badgeClass: 'badge-active',
        party: cust ? cust.name : 'Customer',
        details: itemLines.join('\n'),
        items_detail: s.items,
        amount: s.total_amount,
        amountType: 'sale',
        reference: s.invoice_no,
        status: s.payment_status
      });
    });

    // 2. Purchases Records (Received Goods)
    purchasesInRange.forEach((p) => {
      totPurchases += Number(p.total_amount) || 0;
      const supp = dataService.getSupplierById(p.supplier_id);
      const godown = dataService.getGodownById(p.godown_id);
      const itemLines = (p.items || []).map((i) => {
        const prod = dataService.getProductById(i.product_id);
        const unit = (i.unit && String(i.unit).trim()) || prod?.unit || 'Units';
        return `${i.product_name}: ${i.quantity} ${unit} × ₹${Number(i.purchase_price).toLocaleString('en-IN')} = ₹${Number(i.total).toLocaleString('en-IN')}`;
      });
      allEvents.push({
        id: p.id,
        date: p.date,
        time: p.time,
        type: 'Supplier Purchase',
        rawType: 'purchase',
        badgeClass: 'badge-warning',
        party: supp ? supp.company_name : 'Supplier',
        details: itemLines.join('\n'),
        items_detail: p.items,
        godown: godown?.name,
        amount: p.total_amount,
        amountType: 'purchase',
        reference: p.purchase_no,
        status: p.payment_status
      });
    });

    // 3. Financial Inflow & Outflow Totals (from payments in the same period)
    paymentsInRange.forEach((pay) => {
      if (pay.type === 'customer_payment') {
        totInflow += Number(pay.amount) || 0;
      } else {
        totOutflow += Number(pay.amount) || 0;
      }
    });

    // Sort chronologically newest first
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

  // Dynamic filter for display and export
  const salesCount = useMemo(() => events.filter((e) => e.rawType === 'sale').length, [events]);
  const purchasesCount = useMemo(() => events.filter((e) => e.rawType === 'purchase').length, [events]);

  const filteredEvents = useMemo(() => {
    if (typeFilter === 'sales') return events.filter((e) => e.rawType === 'sale');
    if (typeFilter === 'purchases') return events.filter((e) => e.rawType === 'purchase');
    return events;
  }, [events, typeFilter]);

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
          {/* Action Header */}
          <div className="card-header no-print" style={{ marginBottom: '16px' }}>
            <div>
              <h1 style={{ fontSize: '20px' }}>Daily Transactions Register & Statement</h1>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                Complete register of sales & purchases with financial inflows, outflows, and net liquid flow.
              </p>
            </div>
            <div className="header-actions-group" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleSavePdf}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  if (!isSavingPdf) handleSavePdf();
                }}
                disabled={isSavingPdf}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#f0fdf4',
                  color: '#16a34a',
                  border: '1px solid #bbf7d0',
                  cursor: isSavingPdf ? 'wait' : 'pointer',
                  touchAction: 'manipulation',
                  minHeight: '38px'
                }}
                title="Download Day Book Statement as PDF File"
              >
                <Download size={15} /> {isSavingPdf ? 'Generating PDF...' : 'Download PDF'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => window.print()}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  window.print();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  touchAction: 'manipulation',
                  minHeight: '38px'
                }}
              >
                <Printer size={15} /> Print Statement
              </button>
            </div>
          </div>

          {/* Date Selector & Segmented Filter Banner */}
          <div className="card no-print" style={{ padding: '14px 16px', marginBottom: '16px' }}>
            {/* Period label + date chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                <Calendar size={16} color="#0284c7" />
                <span style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>Period:</span>
              </div>
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${dateMode === 'single' && selectedDate === getTodayDateString() ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={handleSetToday}
                  style={{ fontSize: '11px', padding: '4px 8px' }}
                >
                  Today
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleSetYesterday}
                  style={{ fontSize: '11px', padding: '4px 8px' }}
                >
                  Yesterday
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleSetThisWeek}
                  style={{ fontSize: '11px', padding: '4px 8px' }}
                >
                  This Week
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleSetThisMonth}
                  style={{ fontSize: '11px', padding: '4px 8px' }}
                >
                  This Month
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${dateMode === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={handleSetAll}
                  style={{ fontSize: '11px', padding: '4px 8px' }}
                >
                  All
                </button>
              </div>
            </div>

            {/* Date input(s) */}
            <div style={{ marginBottom: '14px' }}>
              {dateMode === 'single' ? (
                <input
                  type="date"
                  className="form-input"
                  style={{ fontWeight: 600, fontSize: '12px', padding: '5px 10px', width: '100%', maxWidth: '200px' }}
                  value={selectedDate}
                  onChange={(e) => { setDateMode('single'); setSelectedDate(e.target.value); }}
                />
              ) : dateMode === 'range' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <input
                    type="date"
                    className="form-input"
                    style={{ fontSize: '12px', padding: '5px 10px', flex: 1, minWidth: '130px' }}
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                  <span style={{ fontSize: '12px', color: '#64748b' }}>to</span>
                  <input
                    type="date"
                    className="form-input"
                    style={{ fontSize: '12px', padding: '5px 10px', flex: 1, minWidth: '130px' }}
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
              ) : (
                <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600, background: '#ecfdf5', padding: '4px 10px', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
                  All Records Included
                </span>
              )}
            </div>

            {/* Dedicated Segmented Toggle Filter: [All] | [Only Sales] | [Only Purchases] */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155', whiteSpace: 'nowrap' }}>
                Activity Filter:
              </span>
              <div style={{
                display: 'inline-flex',
                background: '#f1f5f9',
                padding: '3px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                gap: '4px',
                flexWrap: 'wrap'
              }}>
                <button
                  type="button"
                  onClick={() => setTypeFilter('all')}
                  style={{
                    padding: '5px 14px',
                    fontSize: '12px',
                    fontWeight: typeFilter === 'all' ? 700 : 500,
                    borderRadius: '6px',
                    background: typeFilter === 'all' ? '#0f172a' : 'transparent',
                    color: typeFilter === 'all' ? '#ffffff' : '#64748b',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  All ({events.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('sales')}
                  style={{
                    padding: '5px 14px',
                    fontSize: '12px',
                    fontWeight: typeFilter === 'sales' ? 700 : 500,
                    borderRadius: '6px',
                    background: typeFilter === 'sales' ? '#0284c7' : 'transparent',
                    color: typeFilter === 'sales' ? '#ffffff' : '#64748b',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Only Sales ({salesCount})
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('purchases')}
                  style={{
                    padding: '5px 14px',
                    fontSize: '12px',
                    fontWeight: typeFilter === 'purchases' ? 700 : 500,
                    borderRadius: '6px',
                    background: typeFilter === 'purchases' ? '#f59e0b' : 'transparent',
                    color: typeFilter === 'purchases' ? '#ffffff' : '#64748b',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Only Purchases ({purchasesCount})
                </button>
              </div>
            </div>
          </div>

          {/* Printable Statement Document (Target for PDF & Print) */}
          <div id="daybook-document" className="card print-document" style={{ padding: '16px' }}>
            {/* Print Header (rendered in PDF and window.print) */}
            <div className="print-header" style={{ display: 'none', borderBottom: '2px solid #0f172a', paddingBottom: '14px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#0f172a' }}>ANUSHA ENTERPRISES</h2>
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#475569' }}>
                    Main Road, Nandipet, Nizamabad Dist. • Telangana • Ph: 96409 12521
                  </p>
                  <div style={{ marginTop: '6px', fontSize: '13px', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase' }}>
                    BUSINESS DAY BOOK & ACTIVITY STATEMENT
                    {typeFilter === 'sales' ? ' — ONLY SALES' : typeFilter === 'purchases' ? ' — ONLY PURCHASES' : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '11px', color: '#334155', lineHeight: 1.5 }}>
                  <div><strong>Period:</strong> {periodLabel}</div>
                  <div><strong>Generated:</strong> {formatDate(getTodayDateString())}</div>
                  <div><strong>Filter:</strong> {typeFilter === 'sales' ? 'Only Sales Records' : typeFilter === 'purchases' ? 'Only Purchase Records' : 'All Transactions'}</div>
                  <div><strong>Total Records:</strong> {filteredEvents.length}</div>
                </div>
              </div>
            </div>

            {/* Prominent 5 Financial Summary Totals Strip (Always at top of on-screen card AND inside PDF/Print) */}
            <div className="daybook-metrics-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: '10px',
              marginBottom: '18px'
            }}>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '12px 14px', borderRadius: '10px' }}>
                <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>TOTAL SALES BILLED</span>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginTop: '3px' }}>
                  {formatCurrency(totalSalesAmount)}
                </div>
                <p style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px', margin: 0 }}>Goods dispatched</p>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '12px 14px', borderRadius: '10px' }}>
                <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>TOTAL PURCHASES</span>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginTop: '3px' }}>
                  {formatCurrency(totalPurchasesAmount)}
                </div>
                <p style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px', margin: 0 }}>Supplier goods received</p>
              </div>

              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '12px 14px', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#047857' }}>
                  <span style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase' }}>CASH INFLOW</span>
                  <ArrowDownLeft size={15} />
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#065f46', marginTop: '3px' }}>
                  +{formatCurrency(cashInflow)}
                </div>
                <p style={{ fontSize: '10.5px', color: '#059669', marginTop: '2px', margin: 0 }}>Customer receipts</p>
              </div>

              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '12px 14px', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#be123c' }}>
                  <span style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase' }}>CASH OUTFLOW</span>
                  <ArrowUpRight size={15} />
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#9f1239', marginTop: '3px' }}>
                  -{formatCurrency(cashOutflow)}
                </div>
                <p style={{ fontSize: '10.5px', color: '#e11d48', marginTop: '2px', margin: 0 }}>Supplier payouts</p>
              </div>

              <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', padding: '12px 14px', borderRadius: '10px' }}>
                <span style={{ fontSize: '10.5px', color: '#0284c7', fontWeight: 700, textTransform: 'uppercase' }}>NET LIQUID FLOW</span>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 800,
                  color: netCashMovement >= 0 ? '#10b981' : '#e11d48',
                  marginTop: '3px'
                }}>
                  {formatCurrency(netCashMovement)}
                </div>
                <p style={{ fontSize: '10.5px', color: '#0284c7', marginTop: '2px', margin: 0 }}>Period net movement</p>
              </div>
            </div>

            {/* Transactions Section */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
                <strong style={{ fontSize: '14px', color: '#0f172a' }}>
                  {typeFilter === 'sales' ? 'Customer Sales Bills' : typeFilter === 'purchases' ? 'Inward Supplier Purchases' : 'All Recorded Transactions'}
                </strong>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  Showing {filteredEvents.length} {filteredEvents.length === 1 ? 'record' : 'records'}
                </span>
              </div>

              {filteredEvents.length === 0 ? (
                <div style={{ padding: '48px 20px', textAlign: 'center', color: '#64748b' }}>
                  <BookOpen size={40} color="#cbd5e1" style={{ marginBottom: '10px' }} />
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>
                    No {typeFilter === 'sales' ? 'sales' : typeFilter === 'purchases' ? 'purchases' : 'transactions'} found for this period.
                  </div>
                  <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                    Try selecting a wider date range or switching the activity filter.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {filteredEvents.map((evt, idx) => {
                    const isSale = evt.rawType === 'sale';
                    const amountColor = isSale ? '#0284c7' : '#d97706';

                    return (
                      <div
                        key={evt.id || idx}
                        style={{
                          padding: '12px 14px',
                          borderBottom: idx < filteredEvents.length - 1 ? '1px solid #f1f5f9' : 'none',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '5px'
                        }}
                      >
                        {/* Row 1: Type Badge + Date + Amount */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span className={`badge ${evt.badgeClass}`} style={{ fontSize: '10.5px' }}>
                              {evt.type}
                            </span>
                            {evt.date && (
                              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                                {formatDate(evt.date)}
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '15px', fontWeight: 800, color: amountColor, whiteSpace: 'nowrap' }}>
                            {formatCurrency(evt.amount)}
                          </span>
                        </div>

                        {/* Row 2: Party + Godown */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                            {evt.party}
                          </span>
                          {evt.godown && (
                            <span style={{ fontSize: '11px', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Warehouse size={11} /> {evt.godown}
                            </span>
                          )}
                        </div>

                        {/* Row 3: Product Details */}
                        {evt.details && (
                          <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.45, whiteSpace: 'pre-line', wordBreak: 'break-word' }}>
                            {evt.details}
                          </div>
                        )}

                        {/* Row 4: Time + Ref + Status */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginTop: '2px' }}>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                            {evt.time || '—'}
                          </span>
                          {evt.reference && (
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#0284c7', background: '#eff6ff', padding: '1px 6px', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
                              {evt.reference}
                            </span>
                          )}
                          {evt.status && (
                            <span className={`badge ${evt.status === 'Paid' || evt.status === 'Settled' ? 'badge-paid' : 'badge-warning'}`} style={{ fontSize: '10px' }}>
                              {evt.status}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
