import React from 'react';
import {
  Users,
  Truck,
  Boxes,
  ShoppingCart,
  ShoppingBag,
  CreditCard,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  PlusCircle,
  Receipt,
  FileSpreadsheet,
  Sliders,
  Calendar
} from 'lucide-react';
import { formatCurrency, formatDate, getTodayDateString } from '../../utils/formatters';

export const Dashboard = ({
  dataService,
  onNavigate,
  onOpenNewSale,
  onOpenNewPurchase,
  onOpenPayment,
  onOpenAdjustment
}) => {
  const products = dataService.getProducts();
  const customers = dataService.getCustomers();
  const suppliers = dataService.getSuppliers();
  const dayBook = dataService.getDayBook(getTodayDateString());
  const profitReport = dataService.getProfitReport();

  const totalStockCount = products.reduce((acc, p) => acc + (Number(p.current_stock) || 0), 0);
  const lowStockItems = products.filter((p) => p.current_stock <= (p.min_stock_alert || 20));

  return (
    <div>
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
        borderRadius: '16px',
        padding: '24px 28px',
        color: '#ffffff',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 8px 24px -4px rgba(2, 132, 199, 0.25)'
      }}>
        <div>
          <span style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            background: 'rgba(255, 255, 255, 0.2)',
            padding: '3px 10px',
            borderRadius: '9999px',
            fontWeight: 700
          }}>
            Business Command Center
          </span>
          <h1 style={{ color: '#ffffff', fontSize: '24px', marginTop: '8px', fontWeight: 800 }}>
            Welcome, Anusha Enterprises
          </h1>
        </div>

        <div className="banner-action-btns" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="btn"
            style={{ background: '#ffffff', color: '#0284c7', fontWeight: 700 }}
            onClick={onOpenNewSale}
          >
            <PlusCircle size={16} /> + New Sale Bill
          </button>
          <button
            className="btn"
            style={{ background: '#0284c7', color: '#ffffff', border: '1px solid rgba(255,255,255,0.4)', fontWeight: 700, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            onClick={onOpenNewPurchase}
          >
            <ShoppingBag size={16} /> + New Purchase Bill
          </button>
          <button
            className="btn"
            style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)', fontWeight: 600 }}
            onClick={onOpenPayment}
          >
            <Receipt size={16} /> Record Payment
          </button>
        </div>
      </div>

      {/* Low Stock Warning if any */}
      {lowStockItems.length > 0 && (
        <div style={{
          background: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: '12px',
          padding: '14px 18px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={20} color="#d97706" />
            <div>
              <strong style={{ fontSize: '13px', color: '#92400e' }}>
                Stock Warning: {lowStockItems.length} Products Running Low
              </strong>
              <p style={{ fontSize: '12px', color: '#b45309' }}>
                {lowStockItems.map((i) => `${i.name} (${i.current_stock} left)`).join(', ')}
              </p>
            </div>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onNavigate('products')}
          >
            View Inventory
          </button>
        </div>
      )}

      {/* Primary KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card" onClick={() => onNavigate('customers')} style={{ cursor: 'pointer' }}>
          <div className="kpi-top">
            <span className="kpi-title">Customers</span>
            <div className="kpi-icon-wrap blue"><Users size={18} /></div>
          </div>
          <div className="kpi-value">{customers.length}</div>
          <div className="kpi-sub">
            <span style={{ color: '#e11d48', fontWeight: 600 }}>
              {formatCurrency(profitReport.pendingCustomerReceivables)}
            </span>
            <span>pending collection</span>
          </div>
        </div>

        <div className="kpi-card" onClick={() => onNavigate('suppliers')} style={{ cursor: 'pointer' }}>
          <div className="kpi-top">
            <span className="kpi-title">Suppliers</span>
            <div className="kpi-icon-wrap purple"><Truck size={18} /></div>
          </div>
          <div className="kpi-value">{suppliers.length}</div>
          <div className="kpi-sub">
            <span style={{ color: '#d97706', fontWeight: 600 }}>
              {formatCurrency(profitReport.pendingSupplierPayables)}
            </span>
            <span>to be paid</span>
          </div>
        </div>

        <div className="kpi-card" onClick={() => onNavigate('products')} style={{ cursor: 'pointer' }}>
          <div className="kpi-top">
            <span className="kpi-title">Inventory Stock</span>
            <div className="kpi-icon-wrap green"><Boxes size={18} /></div>
          </div>
          <div className="kpi-value">{totalStockCount} <span style={{ fontSize: '14px', fontWeight: 500 }}>units</span></div>
          <div className="kpi-sub">Across {products.length} products</div>
        </div>

        <div className="kpi-card" onClick={() => onNavigate('sales')} style={{ cursor: 'pointer' }}>
          <div className="kpi-top">
            <span className="kpi-title">Total Sales</span>
            <div className="kpi-icon-wrap blue"><ShoppingCart size={18} /></div>
          </div>
          <div className="kpi-value">{formatCurrency(profitReport.totalRevenue)}</div>
          <div className="kpi-sub" style={{ color: '#10b981' }}>
            <ArrowUpRight size={14} />
            <span>{formatCurrency(profitReport.totalCustomerPaymentsReceived)} collected</span>
          </div>
        </div>

        <div className="kpi-card" onClick={() => onNavigate('purchases')} style={{ cursor: 'pointer' }}>
          <div className="kpi-top">
            <span className="kpi-title">Total Purchases</span>
            <div className="kpi-icon-wrap amber"><ShoppingBag size={18} /></div>
          </div>
          <div className="kpi-value">{formatCurrency(profitReport.totalPurchasesAmount)}</div>
          <div className="kpi-sub">
            <span>{formatCurrency(profitReport.totalSupplierPaymentsMade)} paid</span>
          </div>
        </div>

        <div className="kpi-card" onClick={() => onNavigate('reports')} style={{ cursor: 'pointer' }}>
          <div className="kpi-top">
            <span className="kpi-title">Est. Gross Profit</span>
            <div className="kpi-icon-wrap green"><DollarSign size={18} /></div>
          </div>
          <div className="kpi-value" style={{ color: '#10b981' }}>
            {formatCurrency(profitReport.grossProfit)}
          </div>
          <div className="kpi-sub">
            <span style={{ fontWeight: 600, color: '#10b981' }}>{profitReport.profitMargin}%</span>
            <span>margin</span>
          </div>
        </div>
      </div>

      {/* Quick Actions Strip */}
      <div className="quick-actions">
        <button className="btn btn-secondary" onClick={onOpenAdjustment}>
          <Sliders size={16} color="#7c3aed" /> Manual Stock Adjustment
        </button>
        <button className="btn btn-secondary" onClick={() => onNavigate('day-book')}>
          <Calendar size={16} color="#0284c7" /> View Today's Day Book
        </button>
      </div>

      {/* Today's Day Book Snapshot */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">
              <Calendar size={18} color="#0284c7" />
              Today's Business Activity ({formatDate(dayBook.date)})
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              Instant answer to: "What transactions happened today?"
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('day-book')}>
            Full Day Book
          </button>
        </div>

        {/* Day's Financial Summary */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '12px',
          marginBottom: '16px',
          background: '#f8fafc',
          padding: '12px',
          borderRadius: '10px',
          border: '1px solid #e2e8f0'
        }}>
          <div>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>TODAY'S SALES</span>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
              {formatCurrency(dayBook.totalSalesAmount)}
            </div>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>TODAY'S PURCHASES</span>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
              {formatCurrency(dayBook.totalPurchasesAmount)}
            </div>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>CASH/UPI INFLOW</span>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#10b981' }}>
              +{formatCurrency(dayBook.cashInflow)}
            </div>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>CASH/UPI OUTFLOW</span>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#e11d48' }}>
              -{formatCurrency(dayBook.cashOutflow)}
            </div>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>NET CASH MOVEMENT</span>
            <div style={{
              fontSize: '16px',
              fontWeight: 800,
              color: dayBook.netCashMovement >= 0 ? '#10b981' : '#e11d48'
            }}>
              {formatCurrency(dayBook.netCashMovement)}
            </div>
          </div>
        </div>

        {/* Recent Events Desktop Table (hidden on tablet/mobile) */}
        <div className="table-responsive desktop-table-view" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Type</th>
                <th>Party</th>
                <th>Transaction Details</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {dayBook.events.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                    No transactions recorded for today yet. Use the action buttons above to record a sale or payment.
                  </td>
                </tr>
              ) : (
                dayBook.events.slice(0, 6).map((evt) => (
                  <tr key={evt.id}>
                    <td style={{ fontWeight: 600, color: '#64748b', fontSize: '12px' }}>{evt.time}</td>
                    <td>
                      <span className={`badge ${evt.badgeClass}`}>{evt.type}</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{evt.party}</td>
                    <td style={{ color: '#475569', fontSize: '13px' }}>{evt.details}</td>
                    <td style={{ fontWeight: 700 }}>
                      {evt.amount !== null ? formatCurrency(evt.amount) : '—'}
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

        {/* Recent Events Mobile Cards (Zero-scroll) */}
        <div className="mobile-cards-view">
          {dayBook.events.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '13px' }}>
              No transactions recorded for today yet.
            </div>
          ) : (
            dayBook.events.slice(0, 6).map((evt) => (
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
                      Time: {evt.time}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                      {evt.amount !== null ? formatCurrency(evt.amount) : '—'}
                    </div>
                    <span className="badge badge-paid" style={{ fontSize: '9.5px', padding: '1px 5px', marginTop: '2px' }}>
                      {evt.status}
                    </span>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', fontSize: '12px', color: '#475569', border: '1px solid #f1f5f9' }}>
                  {evt.details}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
