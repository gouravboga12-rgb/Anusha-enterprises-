import React, { useState } from 'react';
import {
  ArrowLeft, Warehouse, Package, AlertTriangle, ArrowLeftRight,
  ShoppingCart, TrendingUp, RefreshCw, Clock, MapPin, User, Trash2
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { StockTransferModal } from './StockTransferModal';

export const GodownDetail = ({ godownId, dataService, currentUser, onBack, onOpenTransfer, embedded }) => {
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('all');

  const godown = dataService.getGodownById(godownId);
  const stockRows = dataService.getGodownStock(godownId);
  const products = dataService.getProducts();
  const canManage = dataService?.canDelete ? (dataService.canDelete(currentUser) || currentUser?.role === 'full_access') : true;

  if (!godown) return (
    <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
      <Warehouse size={48} color="#cbd5e1" style={{ marginBottom: '12px' }} />
      <p style={{ color: '#64748b' }}>Godown not found</p>
      {onBack && <button className="btn btn-secondary" style={{ marginTop: '12px' }} onClick={onBack}><ArrowLeft size={14}/> Back</button>}
    </div>
  );

  const handleDelete = () => {
    if (!godown) return;
    if (godown.is_default) {
      alert('Cannot delete the default Main Godown.');
      return;
    }
    const activeUnits = stockRows.reduce((sum, gs) => sum + (Number(gs.quantity) || 0), 0);
    if (activeUnits > 0) {
      alert(`Cannot delete "${godown.name}" because it still contains ${activeUnits.toLocaleString('en-IN')} units of stock. Please transfer or adjust the stock to zero first.`);
      return;
    }

    if (window.confirm(`Are you sure you want to permanently delete "${godown.name}" (${godown.code || 'No Code'})? This will remove the godown and its records.`)) {
      try {
        dataService.deleteGodown(godown.id, currentUser);
        if (onBack) onBack();
      } catch (e) {
        alert(e.message);
      }
    }
  };

  // Build per-godown transaction history
  const purchases = dataService.getPurchases().filter((p) => p.godown_id === godownId);
  const sales = dataService.getSales().filter((s) => s.items?.some((i) => i.godown_id === godownId));
  const transfers = dataService.getStockTransfers({ godown_id: godownId });

  const totalUnits = stockRows.reduce((acc, gs) => acc + gs.quantity, 0);
  const lowStockItems = stockRows.filter((gs) => {
    const prod = dataService.getProductById(gs.product_id);
    return gs.quantity > 0 && gs.quantity <= (prod?.min_stock_alert || 20);
  });
  const outOfStockItems = stockRows.filter((gs) => gs.quantity === 0);

  return (
    <div>
      {/* Header */}
      {!embedded && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={onBack} style={{ padding: '8px' }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Warehouse size={20} color="#0284c7" /> {godown.name}
            </h1>
            {godown.location && (
              <p style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={12} /> {godown.location}
              </p>
            )}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={() => setIsTransferOpen(true)}>
              <ArrowLeftRight size={14} /> Transfer Stock
            </button>
            {!godown.is_default && canManage && (
              <button
                className="btn btn-secondary"
                style={{ color: '#ef4444', borderColor: '#fecaca', background: '#fef2f2' }}
                onClick={handleDelete}
              >
                <Trash2 size={14} /> Delete Godown
              </button>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Total Units', value: totalUnits.toLocaleString('en-IN'), color: '#059669', bg: '#f0fdf4' },
          { label: 'Products', value: stockRows.filter(gs => gs.quantity > 0).length, color: '#0284c7', bg: '#eff6ff' },
          { label: 'Low Stock', value: lowStockItems.length, color: '#d97706', bg: '#fffbeb' },
          { label: 'Out of Stock', value: outOfStockItems.length, color: '#dc2626', bg: '#fef2f2' },
        ].map((stat) => (
          <div key={stat.label} className="card" style={{ padding: '14px', textAlign: 'center', background: stat.bg }}>
            <div style={{ fontSize: '22px', fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Stock Table */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
          📦 Products in {godown.name}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Product', 'SKU', 'Qty in Godown', 'Unit', 'Purchase Cost', 'Selling Price', 'Status'].map((h) => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stockRows.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                    No stock in this godown
                  </td>
                </tr>
              ) : (
                stockRows.map((gs) => {
                  const prod = gs.product || dataService.getProductById(gs.product_id);
                  if (!prod) return null;
                  const isLow = gs.quantity > 0 && gs.quantity <= (prod.min_stock_alert || 20);
                  const isOut = gs.quantity === 0;
                  return (
                    <tr key={gs.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.background = ''}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a' }}>{prod.name}</div>
                        {prod.description && <div style={{ fontSize: '11px', color: '#94a3b8' }}>{prod.description.slice(0, 50)}</div>}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '12px', color: '#64748b', fontFamily: 'monospace' }}>{prod.sku}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          fontWeight: 700, fontSize: '16px',
                          color: isOut ? '#dc2626' : isLow ? '#d97706' : '#16a34a'
                        }}>
                          {gs.quantity}
                        </span>
                        {isOut && <div style={{ fontSize: '10px', color: '#dc2626', fontWeight: 600 }}>⚠ Out of Stock</div>}
                        {isLow && !isOut && <div style={{ fontSize: '10px', color: '#d97706', fontWeight: 600 }}>⚠ Low Stock</div>}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '12px', color: '#64748b' }}>{prod.unit}</td>
                      <td style={{ padding: '12px 14px', fontSize: '13px', color: '#0f172a', fontWeight: 600 }}>{formatCurrency(prod.purchase_price)}</td>
                      <td style={{ padding: '12px 14px', fontSize: '13px', color: '#059669', fontWeight: 600 }}>{formatCurrency(prod.selling_price)}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700,
                          background: isOut ? '#fef2f2' : isLow ? '#fffbeb' : '#dcfce7',
                          color: isOut ? '#dc2626' : isLow ? '#d97706' : '#16a34a'
                        }}>
                          {isOut ? 'Out' : isLow ? 'Low' : 'OK'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction History */}
      <div className="card">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>📋 Transaction History for {godown.name}</div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['all', 'purchases', 'sales', 'transfers'].map((f) => (
              <button key={f} onClick={() => setHistoryFilter(f)}
                style={{
                  padding: '4px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 600,
                  background: historyFilter === f ? '#0284c7' : '#f1f5f9',
                  color: historyFilter === f ? '#fff' : '#475569'
                }}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div style={{ padding: '12px' }}>
          {(() => {
            const historyItems = [];

            if (historyFilter === 'all' || historyFilter === 'purchases') {
              purchases.forEach((p) => {
                const supp = dataService.getSupplierById(p.supplier_id);
                historyItems.push({
                  id: p.id, date: p.date, time: p.time, type: 'PURCHASE',
                  color: '#059669', bg: '#f0fdf4',
                  title: `Purchase from ${supp?.company_name || 'Supplier'}`,
                  ref: p.purchase_no,
                  detail: p.items.filter(i => i.godown_id === godownId || !i.godown_id)
                    .map(i => `${i.product_name}: +${i.quantity} × ₹${i.purchase_price} = ₹${i.total}`).join('\n')
                });
              });
            }

            if (historyFilter === 'all' || historyFilter === 'sales') {
              sales.forEach((s) => {
                const cust = dataService.getCustomerById(s.customer_id);
                const relevantItems = s.items.filter(i => i.godown_id === godownId);
                historyItems.push({
                  id: s.id, date: s.date, time: s.time, type: 'SALE',
                  color: '#dc2626', bg: '#fef2f2',
                  title: `Sale to ${cust?.name || 'Customer'}`,
                  ref: s.invoice_no,
                  detail: relevantItems.map(i => `${i.product_name}: -${i.quantity} × ₹${i.selling_price} = ₹${i.total}`).join('\n')
                });
              });
            }

            if (historyFilter === 'all' || historyFilter === 'transfers') {
              transfers.forEach((t) => {
                const prod = dataService.getProductById(t.product_id);
                const fromG = dataService.getGodownById(t.from_godown_id);
                const toG = dataService.getGodownById(t.to_godown_id);
                const isOut = t.from_godown_id === godownId;
                historyItems.push({
                  id: t.id, date: t.date, time: t.time, type: isOut ? 'TRANSFER_OUT' : 'TRANSFER_IN',
                  color: isOut ? '#d97706' : '#0284c7', bg: isOut ? '#fffbeb' : '#eff6ff',
                  title: isOut ? `Transfer Out → ${toG?.name}` : `Transfer In ← ${fromG?.name}`,
                  ref: t.transfer_no,
                  detail: `${prod?.name}: ${isOut ? '-' : '+'}${t.quantity} ${prod?.unit || 'units'}${t.vehicle_no ? ` • 🚗 ${t.vehicle_no}` : ''}${t.reason ? ` — ${t.reason}` : ''}`
                });
              });
            }

            historyItems.sort((a, b) => {
              const tA = `${a.date || ''} ${a.time || ''}`;
              const tB = `${b.date || ''} ${b.time || ''}`;
              return tB.localeCompare(tA);
            });

            if (historyItems.length === 0) {
              return <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>No transactions yet for this godown.</div>;
            }

            return historyItems.map((item) => (
              <div key={item.id + item.type} style={{ display: 'flex', gap: '12px', padding: '12px', borderRadius: '8px', marginBottom: '8px', background: item.bg }}>
                <div style={{ width: '80px', flexShrink: 0, textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: item.color, padding: '2px 6px', borderRadius: '4px', background: '#fff' }}>{item.type.replace('_', ' ')}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>{formatDate(item.date)}</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>{item.time}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>{item.title}</div>
                  <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px', whiteSpace: 'pre-line' }}>{item.detail}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Ref: {item.ref}</div>
                </div>
              </div>
            ));
          })()}
        </div>
      </div>

      {isTransferOpen && (
        <StockTransferModal
          isOpen={isTransferOpen}
          onClose={() => setIsTransferOpen(false)}
          dataService={dataService}
          currentUser={currentUser}
          defaultFromGodownId={godownId}
        />
      )}
    </div>
  );
};
