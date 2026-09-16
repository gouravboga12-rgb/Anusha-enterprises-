import React from 'react';
import { TrendingUp, DollarSign, Package, Users, Truck, Printer, PieChart } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const RevenueProfitReport = ({ dataService }) => {
  const report = dataService.getProfitReport();

  return (
    <div>
      <div className="card-header" style={{ marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '20px' }}>Revenue & Gross Profit Intelligence</h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            Accurate profit tracking where <strong>Gross Profit = Selling Amount - Purchase Cost</strong>.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={() => window.print()}>
          <Printer size={15} /> Print P&L Report
        </button>
      </div>

      {/* Primary Financial Metric Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '14px',
        marginBottom: '24px'
      }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>TOTAL SALES REVENUE</span>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
            {formatCurrency(report.totalRevenue)}
          </div>
          <p style={{ fontSize: '11px', color: '#10b981', marginTop: '2px' }}>
            {report.totalUnitsSold} total units sold
          </p>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>ESTIMATED PURCHASE COST</span>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#475569', marginTop: '4px' }}>
            {formatCurrency(report.totalEstimatedCost)}
          </div>
          <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Cost of goods sold (COGS)</p>
        </div>

        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '11px', color: '#047857', fontWeight: 700 }}>ESTIMATED GROSS PROFIT</span>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#065f46', marginTop: '4px' }}>
            {formatCurrency(report.grossProfit)}
          </div>
          <p style={{ fontSize: '11px', color: '#059669', marginTop: '2px', fontWeight: 600 }}>
            {report.profitMargin}% Overall Profit Margin
          </p>
        </div>

        <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '11px', color: '#be123c', fontWeight: 700 }}>PENDING RECEIVABLES</span>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#e11d48', marginTop: '4px' }}>
            {formatCurrency(report.pendingCustomerReceivables)}
          </div>
          <p style={{ fontSize: '11px', color: '#be123c', marginTop: '2px' }}>
            Uncollected customer balances
          </p>
        </div>
      </div>

      {/* Separation Note */}
      <div style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h4 style={{ fontSize: '14px', color: '#0f172a' }}>Customer Receivables vs Supplier Payables Segregation</h4>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
            Clean bookkeeping ensures customer payments received never mix with supplier money owed.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <div>
            <span style={{ fontSize: '11px', color: '#047857', fontWeight: 700 }}>COLLECTED FROM CUSTOMERS:</span>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#065f46' }}>
              {formatCurrency(report.totalCustomerPaymentsReceived)}
            </div>
          </div>
          <div style={{ borderLeft: '1px solid #cbd5e1', paddingLeft: '20px' }}>
            <span style={{ fontSize: '11px', color: '#b45309', fontWeight: 700 }}>SUPPLIER PAYABLES REMAINING:</span>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#d97706' }}>
              {formatCurrency(report.pendingSupplierPayables)}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        {/* Sales by Product */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Package size={17} color="#0284c7" /> Sales & Profit By Product
            </h3>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th style={{ textAlign: 'right' }}>Qty Sold</th>
                  <th style={{ textAlign: 'right' }}>Revenue</th>
                  <th style={{ textAlign: 'right' }}>Gross Profit</th>
                </tr>
              </thead>
              <tbody>
                {report.productSales.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 700 }}>{p.name}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{p.units}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(p.revenue)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: '#10b981' }}>
                      {formatCurrency(p.profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sales by Customer */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Users size={17} color="#0284c7" /> Top Customers by Revenue
            </h3>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Area</th>
                  <th style={{ textAlign: 'right' }}>Orders</th>
                  <th style={{ textAlign: 'right' }}>Total Billed</th>
                </tr>
              </thead>
              <tbody>
                {report.customerSales.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 700 }}>{c.name}</td>
                    <td style={{ fontSize: '12px', color: '#64748b' }}>{c.area || '—'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{c.ordersCount}</td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: '#0284c7' }}>
                      {formatCurrency(c.totalRevenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
