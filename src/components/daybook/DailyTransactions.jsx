import React, { useState } from 'react';
import { Calendar, Printer, Filter, ArrowDownLeft, ArrowUpRight, CheckCircle2, TrendingUp, BookOpen, Package, Users } from 'lucide-react';
import { formatCurrency, formatDate, getTodayDateString } from '../../utils/formatters';
import { RevenueProfitReport } from '../reports/RevenueProfitReport';

export const DailyTransactions = ({ dataService }) => {
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [typeFilter, setTypeFilter] = useState('all');
  const [activeSubTab, setActiveSubTab] = useState('daybook'); // 'daybook' or 'profit'

  const dayBook = dataService.getDayBook(selectedDate);

  const handleSetYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const y = d.toISOString().split('T')[0];
    setSelectedDate(y);
  };

  const filteredEvents = dayBook.events.filter((evt) => {
    if (typeFilter === 'all') return true;
    if (typeFilter === 'sales') return evt.type === 'Customer Sale';
    if (typeFilter === 'purchases') return evt.type === 'Supplier Purchase';
    if (typeFilter === 'inflow') return evt.type === 'Customer Payment Inward';
    if (typeFilter === 'outflow') return evt.type === 'Supplier Payment Outward';
    if (typeFilter === 'stock') return evt.type.includes('Stock');
    return true;
  });

  return (
    <div>
      {/* Top Mode Toggle */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
        <button
          className={`btn ${activeSubTab === 'daybook' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveSubTab('daybook')}
        >
          <BookOpen size={16} /> Daily Register (Day Book)
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
          <div className="card-header" style={{ marginBottom: '16px' }}>
            <div>
              <h1 style={{ fontSize: '20px' }}>Daily Transactions / Day Book (Roznamcha)</h1>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                Instant single-page answer to: <strong>"What happened in my business today?"</strong>
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-secondary" onClick={() => window.print()}>
                <Printer size={15} /> Print Day Book
              </button>
            </div>
          </div>

      {/* Date Selector Banner */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="#0284c7" />
              <span style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>Select Date:</span>
            </div>
            <input
              type="date"
              className="form-input"
              style={{ width: 'auto', fontWeight: 600 }}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                className={`btn btn-sm ${selectedDate === getTodayDateString() ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedDate(getTodayDateString())}
              >
                Today
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleSetYesterday}
              >
                Yesterday
              </button>
            </div>
          </div>

          {/* Quick Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Filter By:</span>
            <select
              className="form-select"
              style={{ width: 'auto', padding: '6px 12px' }}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Events ({dayBook.events.length})</option>
              <option value="sales">Sales Only</option>
              <option value="purchases">Purchases Only</option>
              <option value="inflow">Cash Inward Receipts</option>
              <option value="outflow">Cash Outward Payments</option>
              <option value="stock">Stock Adjustments</option>
            </select>
          </div>
        </div>
      </div>

      {/* Daily Summary Cards Strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '14px 18px', borderRadius: '12px' }}>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>TOTAL SALES BILLED</span>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
            {formatCurrency(dayBook.totalSalesAmount)}
          </div>
          <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Goods sold on {formatDate(selectedDate)}</p>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '14px 18px', borderRadius: '12px' }}>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>TOTAL PURCHASES INWARD</span>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
            {formatCurrency(dayBook.totalPurchasesAmount)}
          </div>
          <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Supplier stock added</p>
        </div>

        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '14px 18px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#047857' }}>
            <span style={{ fontSize: '11px', fontWeight: 700 }}>CASH/UPI INFLOW</span>
            <ArrowDownLeft size={16} />
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#065f46', marginTop: '4px' }}>
            +{formatCurrency(dayBook.cashInflow)}
          </div>
          <p style={{ fontSize: '11px', color: '#059669', marginTop: '2px' }}>Collections from customers</p>
        </div>

        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '14px 18px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#be123c' }}>
            <span style={{ fontSize: '11px', fontWeight: 700 }}>CASH/UPI OUTFLOW</span>
            <ArrowUpRight size={16} />
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#9f1239', marginTop: '4px' }}>
            -{formatCurrency(dayBook.cashOutflow)}
          </div>
          <p style={{ fontSize: '11px', color: '#e11d48', marginTop: '2px' }}>Payments made to suppliers</p>
        </div>

        <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', padding: '14px 18px', borderRadius: '12px' }}>
          <span style={{ fontSize: '11px', color: '#0284c7', fontWeight: 700 }}>NET CASH MOVEMENT</span>
          <div style={{
            fontSize: '18px',
            fontWeight: 800,
            color: dayBook.netCashMovement >= 0 ? '#10b981' : '#e11d48',
            marginTop: '4px'
          }}>
            {formatCurrency(dayBook.netCashMovement)}
          </div>
          <p style={{ fontSize: '11px', color: '#0284c7', marginTop: '2px' }}>Daily net liquid balance</p>
        </div>
      </div>

      {/* Day Book Transactions Desktop Table (hidden on tablet/mobile) */}
      <div className="card desktop-table-view" style={{ padding: '16px' }}>
        <div className="card-header" style={{ marginBottom: '12px' }}>
          <h3 className="card-title">
            Chronological Daily Register — {formatDate(selectedDate)}
          </h3>
          <span className="badge badge-active">{filteredEvents.length} records</span>
        </div>

        <div className="table-responsive" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Transaction Type</th>
                <th>Party / Counterpart</th>
                <th>Items / Transaction Details</th>
                <th style={{ textAlign: 'right' }}>Amount (₹)</th>
                <th>Reference #</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    No transactions recorded on {formatDate(selectedDate)}.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((evt) => (
                  <tr key={evt.id}>
                    <td style={{ fontWeight: 600, color: '#64748b', fontSize: '12px', whiteSpace: 'nowrap' }}>
                      {evt.time}
                    </td>
                    <td>
                      <span className={`badge ${evt.badgeClass}`}>{evt.type}</span>
                    </td>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>
                      {evt.party}
                    </td>
                    <td style={{ fontSize: '13px', maxWidth: '320px' }}>
                      {evt.details}
                    </td>
                    <td style={{
                      textAlign: 'right',
                      fontWeight: 800,
                      fontSize: '14px',
                      color:
                        evt.amountType === 'inflow' ? '#10b981' :
                        evt.amountType === 'outflow' ? '#e11d48' : '#0f172a'
                    }}>
                      {evt.amount !== null ? (
                        `${evt.amountType === 'inflow' ? '+' : evt.amountType === 'outflow' ? '-' : ''}${formatCurrency(evt.amount)}`
                      ) : '—'}
                    </td>
                    <td style={{ fontWeight: 600, fontSize: '12px', color: '#0284c7' }}>
                      {evt.reference}
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

      {/* Zero-Scroll Mobile & Tablet Events List */}
      <div className="mobile-cards-view">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 2px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Daily Register ({filteredEvents.length})</span>
          <span style={{ fontSize: '11px', color: '#64748b' }}>{formatDate(selectedDate)}</span>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="card" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
            No transactions recorded on {formatDate(selectedDate)}.
          </div>
        ) : (
          filteredEvents.map((evt) => (
            <div key={evt.id} className="mobile-record-card">
              <div className="card-top-row">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className={`badge ${evt.badgeClass}`} style={{ fontSize: '10px', padding: '1px 6px' }}>
                      {evt.type}
                    </span>
                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>{evt.party}</strong>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    Time: {evt.time} • Ref: {evt.reference}
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: 800,
                    color:
                      evt.amountType === 'inflow' ? '#10b981' :
                      evt.amountType === 'outflow' ? '#e11d48' : '#0f172a'
                  }}>
                    {evt.amount !== null ? (
                      `${evt.amountType === 'inflow' ? '+' : evt.amountType === 'outflow' ? '-' : ''}${formatCurrency(evt.amount)}`
                    ) : '—'}
                  </div>
                  <span className="badge badge-paid" style={{ fontSize: '10px', padding: '1px 6px', marginTop: '2px' }}>
                    {evt.status}
                  </span>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', fontSize: '12px', color: '#334155', border: '1px solid #f1f5f9' }}>
                {evt.details}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  )}
</div>
  );
};
