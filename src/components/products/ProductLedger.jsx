import React, { useState, useMemo } from 'react';
import {
  X, BookOpen, Warehouse, ShoppingCart, TrendingUp,
  ArrowLeftRight, RefreshCw, Filter, Search, Printer, Calendar
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const ProductLedger = ({ product, isOpen, onClose, dataService }) => {
  const [godownFilter, setGodownFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const ledgerData = useMemo(() => {
    if (!product || !dataService) return { godownBreakdown: [], entries: [] };
    return dataService.getProductLedger(product.id);
  }, [product, dataService]);

  const godowns = useMemo(() => {
    if (!dataService) return [];
    return dataService.getGodowns();
  }, [dataService]);

  // Filter entries
  const filteredEntries = useMemo(() => {
    let list = ledgerData.entries || [];

    if (godownFilter !== 'all') {
      list = list.filter((e) => e.godown_id === godownFilter);
    }

    if (typeFilter !== 'all') {
      if (typeFilter === 'PURCHASE') list = list.filter((e) => e.type === 'PURCHASE');
      else if (typeFilter === 'SALE') list = list.filter((e) => e.type === 'SALE');
      else if (typeFilter === 'TRANSFER') list = list.filter((e) => e.type.startsWith('TRANSFER'));
      else if (typeFilter === 'ADJUSTMENT') list = list.filter((e) => e.type.startsWith('ADJUSTMENT'));
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter((e) =>
        (e.party && e.party.toLowerCase().includes(q)) ||
        (e.reference && e.reference.toLowerCase().includes(q)) ||
        (e.notes && e.notes.toLowerCase().includes(q))
      );
    }

    return list;
  }, [ledgerData.entries, godownFilter, typeFilter, searchTerm]);

  if (!isOpen || !product) return null;

  const getTypeBadge = (type) => {
    switch (type) {
      case 'PURCHASE':
        return <span className="badge badge-warning flex items-center gap-1"><ShoppingCart size={11} /> Purchase</span>;
      case 'SALE':
        return <span className="badge badge-active flex items-center gap-1"><TrendingUp size={11} /> Sale</span>;
      case 'TRANSFER_IN':
        return <span className="badge badge-info flex items-center gap-1"><ArrowLeftRight size={11} /> Transfer In</span>;
      case 'TRANSFER_OUT':
        return <span className="badge badge-neutral flex items-center gap-1"><ArrowLeftRight size={11} /> Transfer Out</span>;
      case 'ADJUSTMENT_ADD':
        return <span className="badge badge-success flex items-center gap-1"><RefreshCw size={11} /> Stock +</span>;
      case 'ADJUSTMENT_SUB':
        return <span className="badge badge-danger flex items-center gap-1"><RefreshCw size={11} /> Stock -</span>;
      default:
        return <span className="badge badge-neutral">{type}</span>;
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content product-ledger-modal"
        style={{ maxWidth: '1000px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '10px',
              backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <BookOpen size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {product.name}
                </h2>
                <span className="badge badge-neutral" style={{ fontSize: '11px' }}>{product.sku}</span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                Unified Chronological Stock Ledger & Movement History
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Stock Breakdown Banner */}
        <div style={{
          padding: '16px',
          backgroundColor: 'var(--bg-card-subtle, rgba(255,255,255,0.03))',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Authoritative Stock
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#10b981', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              {product.current_stock ?? 0}
              <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>{product.unit || 'units'}</span>
            </div>
          </div>

          {/* Godown Breakdown Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginRight: '4px' }}>Godown Breakdown:</span>
            {ledgerData.godownBreakdown && ledgerData.godownBreakdown.length > 0 ? (
              ledgerData.godownBreakdown.map((gb) => (
                <div
                  key={gb.godown_id}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(59, 130, 246, 0.08)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Warehouse size={12} style={{ color: '#3b82f6' }} />
                  <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{gb.godown_name}:</span>
                  <span style={{ color: gb.quantity > 0 ? '#10b981' : '#ef4444', fontWeight: '700' }}>
                    {gb.quantity} {product.unit || 'units'}
                  </span>
                </div>
              ))
            ) : (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No godown records found</span>
            )}
          </div>
        </div>

        {/* Filters Bar */}
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ position: 'relative', width: '200px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search party, ref..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px 6px 30px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-input, rgba(255,255,255,0.05))',
                  color: 'var(--text-primary)',
                  fontSize: '12px'
                }}
              />
            </div>

            {/* Godown Filter */}
            <select
              value={godownFilter}
              onChange={(e) => setGodownFilter(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-input, rgba(255,255,255,0.05))',
                color: 'var(--text-primary)',
                fontSize: '12px'
              }}
            >
              <option value="all">All Godowns</option>
              {godowns.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-input, rgba(255,255,255,0.05))',
                color: 'var(--text-primary)',
                fontSize: '12px'
              }}
            >
              <option value="all">All Activity Types</option>
              <option value="PURCHASE">Purchases (Inward)</option>
              <option value="SALE">Sales (Outward)</option>
              <option value="TRANSFER">Stock Transfers</option>
              <option value="ADJUSTMENT">Stock Adjustments</option>
            </select>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => window.print()}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
          >
            <Printer size={13} /> Print Ledger
          </button>
        </div>

        {/* Ledger Table */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
          {filteredEntries.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <BookOpen size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <p style={{ margin: 0, fontWeight: '500' }}>No transactions recorded for this product</p>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                Any purchases, sales, transfers or adjustments will show up here chronologically.
              </p>
            </div>
          ) : (
            <table className="data-table" style={{ width: '100%', fontSize: '13px' }}>
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Type</th>
                  <th>Party / Details</th>
                  <th>Godown</th>
                  <th style={{ textAlign: 'right' }}>Qty Change</th>
                  <th style={{ textAlign: 'right' }}>Unit Price</th>
                  <th style={{ textAlign: 'right' }}>Total Amount</th>
                  <th style={{ textAlign: 'right' }}>Running Bal</th>
                  <th>Reference</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry, idx) => {
                  const isPositive = entry.quantity_change > 0;
                  const isNegative = entry.quantity_change < 0;
                  return (
                    <tr key={entry.id || idx}>
                      <td>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{formatDate(entry.date)}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{entry.time || '—'}</div>
                      </td>
                      <td>{getTypeBadge(entry.type)}</td>
                      <td>
                        <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{entry.party}</div>
                        {entry.notes && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            {entry.notes}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                          <Warehouse size={12} />
                          {entry.godown || '—'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '700' }}>
                        <span style={{
                          color: isPositive ? '#10b981' : isNegative ? '#ef4444' : 'var(--text-primary)'
                        }}>
                          {isPositive ? `+${entry.quantity_change}` : entry.quantity_change} {product.unit || 'units'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                        {entry.unit_price ? formatCurrency(entry.unit_price) : '—'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {entry.total ? formatCurrency(entry.total) : '—'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '700', color: '#3b82f6' }}>
                        {entry.running_balance !== undefined ? `${entry.running_balance} ${product.unit || 'units'}` : '—'}
                      </td>
                      <td>
                        <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
                          {entry.reference || '—'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '12px 16px', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};
