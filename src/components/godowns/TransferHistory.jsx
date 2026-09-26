import React, { useState } from 'react';
import { X, History, Search, Filter, Download } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

export const TransferHistory = ({ isOpen, onClose, dataService, productIdFilter }) => {
  const [search, setSearch] = useState('');
  const [productFilter, setProductFilter] = useState(productIdFilter || '');
  const [godownFilter, setGodownFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  if (!isOpen) return null;

  const products = dataService.getProducts();
  const godowns = dataService.getGodowns(true);

  let transfers = dataService.getStockTransfers({
    product_id: productFilter || undefined,
    godown_id: godownFilter || undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined
  });

  if (search) {
    const q = search.toLowerCase();
    transfers = transfers.filter((t) => {
      const prod = dataService.getProductById(t.product_id);
      const fromG = dataService.getGodownById(t.from_godown_id);
      const toG = dataService.getGodownById(t.to_godown_id);
      return (
        t.transfer_no?.toLowerCase().includes(q) ||
        prod?.name?.toLowerCase().includes(q) ||
        fromG?.name?.toLowerCase().includes(q) ||
        toG?.name?.toLowerCase().includes(q) ||
        t.recorded_by?.toLowerCase().includes(q) ||
        t.reason?.toLowerCase().includes(q)
      );
    });
  }

  const handlePrint = () => {
    const content = transfers.map((t) => {
      const prod = dataService.getProductById(t.product_id);
      const fromG = dataService.getGodownById(t.from_godown_id);
      const toG = dataService.getGodownById(t.to_godown_id);
      return `${t.transfer_no} | ${formatDate(t.date)} ${t.time} | ${prod?.name} | ${t.quantity} ${prod?.unit || 'units'} | From: ${fromG?.name} → To: ${toG?.name} | By: ${t.recorded_by} | Reason: ${t.reason || 'N/A'}`;
    }).join('\n');
    const win = window.open('', '_blank');
    win.document.write(`<pre style="font-family:monospace;padding:24px;font-size:12px;">
ANUSHA ENTERPRISES — STOCK TRANSFER HISTORY
Generated: ${new Date().toLocaleString('en-IN')}
${'='.repeat(80)}
${content}
${'='.repeat(80)}
Total Transfers: ${transfers.length}
</pre>`);
    win.print();
    win.close();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '900px', height: '90vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <History size={20} color="#7c3aed" />
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>Stock Transfer History</h2>
              <p style={{ fontSize: '11px', color: '#64748b' }}>{transfers.length} transfers found</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={handlePrint}><Download size={14} /> Export</button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ padding: '12px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '10px', flexWrap: 'wrap', flexShrink: 0 }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '160px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input className="form-input" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: '32px', margin: 0 }} />
          </div>
          <select className="form-input" style={{ width: 'auto', margin: 0 }} value={productFilter} onChange={(e) => setProductFilter(e.target.value)}>
            <option value="">All Products</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select className="form-input" style={{ width: 'auto', margin: 0 }} value={godownFilter} onChange={(e) => setGodownFilter(e.target.value)}>
            <option value="">All Godowns</option>
            {godowns.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <input type="date" className="form-input" style={{ width: 'auto', margin: 0 }} value={fromDate} onChange={(e) => setFromDate(e.target.value)} title="From date" />
          <input type="date" className="form-input" style={{ width: 'auto', margin: 0 }} value={toDate} onChange={(e) => setToDate(e.target.value)} title="To date" />
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
              <tr style={{ background: '#f8fafc' }}>
                {['Transfer No', 'Date & Time', 'Product', 'Quantity', 'From', 'To', 'Reason', 'By'].map((h) => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transfers.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                    No transfers found matching your filters.
                  </td>
                </tr>
              ) : (
                transfers.map((t) => {
                  const prod = dataService.getProductById(t.product_id);
                  const fromG = dataService.getGodownById(t.from_godown_id);
                  const toG = dataService.getGodownById(t.to_godown_id);
                  return (
                    <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#fafafa'}
                      onMouseLeave={(e) => e.currentTarget.style.background = ''}>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: '#7c3aed', background: '#f5f3ff', padding: '2px 8px', borderRadius: '4px' }}>
                          {t.transfer_no}
                        </span>
                        {t.vehicle_no && (
                          <div style={{ fontSize: '11px', color: '#0f172a', fontWeight: 700, background: '#f8fafc', padding: '2px 6px', borderRadius: '4px', border: '1px solid #0f172a', display: 'inline-block', marginTop: '3px' }}>
                            🚗 {t.vehicle_no}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '12px', color: '#64748b' }}>
                        <div>{formatDate(t.date)}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{t.time}</div>
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0f172a', fontSize: '13px' }}>{prod?.name || '—'}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#7c3aed', fontSize: '14px' }}>
                        {t.quantity} <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 400 }}>{prod?.unit || 'units'}</span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ background: '#fef2f2', color: '#dc2626', padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
                          {fromG?.name || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
                          {toG?.name || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '12px', color: '#64748b', maxWidth: '200px' }}>{t.reason || '—'}</td>
                      <td style={{ padding: '12px 14px', fontSize: '12px', color: '#0f172a', fontWeight: 600 }}>{t.recorded_by}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
