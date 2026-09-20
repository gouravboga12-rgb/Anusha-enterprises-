import React, { useState, useMemo } from 'react';
import {
  Warehouse, Plus, MapPin, Package, AlertTriangle, ChevronRight,
  Edit2, Archive, ArrowLeftRight, History, BarChart2, Clock, Activity,
  TrendingDown, TrendingUp, RefreshCw, Calendar, X, ExternalLink,
  PackagePlus, ShoppingCart, Sliders, CheckCircle2, AlertCircle
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { GodownFormModal } from './GodownFormModal';
import { GodownDetail } from './GodownDetail';
import { StockTransferModal } from './StockTransferModal';
import { TransferHistory } from './TransferHistory';
import { GodownActivityModal } from './GodownActivityModal';

export const GodownList = ({ dataService, currentUser }) => {
  const [activeGodownId, setActiveGodownId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGodown, setEditingGodown] = useState(null);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isTransferHistoryOpen, setIsTransferHistoryOpen] = useState(false);
  const [activeView, setActiveView] = useState('all'); // 'all' | godown id

  // Activity filter state
  const [activityQuickDate, setActivityQuickDate] = useState('all'); // 'all' | 'today' | 'yesterday' | 'week'
  const [activitySpecificDate, setActivitySpecificDate] = useState('');
  const [activityType, setActivityType] = useState('all');
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);

  const godowns = dataService.getGodowns(false);
  const allGodowns = dataService.getGodowns(true);
  const products = dataService.getProducts();

  // Overall stats
  const totalStock = products.reduce((acc, p) => acc + (p.current_stock || 0), 0);
  const lowStockCount = products.filter((p) => p.current_stock <= (p.min_stock_alert || 20) && p.current_stock > 0).length;
  const outOfStockCount = products.filter((p) => p.current_stock === 0).length;

  // Real, accurate stock & godown activities (purchases, sales, transfers, adjustments, godowns)
  const allActivities = useMemo(() => {
    if (!dataService?.getGodownActivities) return [];
    return dataService.getGodownActivities({
      date: activitySpecificDate || null,
      quickDate: activitySpecificDate ? null : activityQuickDate,
      type: activityType
    });
  }, [dataService, activitySpecificDate, activityQuickDate, activityType]);

  const recentActivities = useMemo(() => {
    return allActivities.slice(0, 10);
  }, [allActivities]);

  const getGodownStats = (godownId) => {
    const stock = dataService.getGodownStock(godownId);
    const total = stock.reduce((acc, gs) => acc + gs.quantity, 0);
    const productsWithStock = stock.filter((gs) => gs.quantity > 0).length;
    return { total, productsWithStock };
  };

  const handleArchive = (godown) => {
    try {
      dataService.archiveGodown(godown.id, currentUser);
    } catch (e) {
      alert(e.message);
    }
  };

  const canManage = dataService.canDelete(currentUser) || currentUser?.role === 'full_access';

  if (activeGodownId) {
    return (
      <GodownDetail
        godownId={activeGodownId}
        dataService={dataService}
        currentUser={currentUser}
        onBack={() => setActiveGodownId(null)}
        onOpenTransfer={() => setIsTransferOpen(true)}
      />
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Warehouse size={22} color="#0284c7" /> Godown Management
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            Manage multiple godowns and track stock per location
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setIsTransferHistoryOpen(true)}
          >
            <History size={15} /> Transfer History
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setIsTransferOpen(true)}
          >
            <ArrowLeftRight size={15} /> Transfer Stock
          </button>
          {canManage && (
            <button
              className="btn btn-primary"
              onClick={() => { setEditingGodown(null); setIsFormOpen(true); }}
            >
              <Plus size={15} /> Create Godown
            </button>
          )}
        </div>
      </div>

      {/* Overall Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Total Godowns', value: godowns.length, color: '#0284c7', bg: '#eff6ff' },
          { label: 'Total Products', value: products.length, color: '#7c3aed', bg: '#f5f3ff' },
          { label: 'Total Stock Units', value: totalStock.toLocaleString('en-IN'), color: '#059669', bg: '#f0fdf4' },
          { label: 'Low Stock', value: lowStockCount, color: '#d97706', bg: '#fffbeb' },
          { label: 'Out of Stock', value: outOfStockCount, color: '#dc2626', bg: '#fef2f2' },
        ].map((stat) => (
          <div key={stat.label} className="card" style={{ padding: '16px', textAlign: 'center', background: stat.bg, border: `1px solid ${stat.color}22` }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', fontWeight: 600 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* View Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
        <button
          onClick={() => setActiveView('all')}
          style={{
            padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '13px',
            background: activeView === 'all' ? '#0284c7' : '#f1f5f9',
            color: activeView === 'all' ? '#fff' : '#475569'
          }}
        >
          <BarChart2 size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
          All Stock
        </button>
        {godowns.map((g) => (
          <button
            key={g.id}
            onClick={() => setActiveView(g.id)}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '13px',
              background: activeView === g.id ? '#0284c7' : '#f1f5f9',
              color: activeView === g.id ? '#fff' : '#475569'
            }}
          >
            <Warehouse size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            {g.name}
          </button>
        ))}
      </div>

      {/* Godown Cards */}
      {activeView === 'all' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {godowns.length === 0 ? (
            <div className="card" style={{ padding: '40px', textAlign: 'center', gridColumn: '1/-1' }}>
              <Warehouse size={48} color="#cbd5e1" style={{ marginBottom: '12px' }} />
              <h3 style={{ color: '#64748b', fontWeight: 600 }}>No godowns yet</h3>
              <p style={{ color: '#94a3b8', fontSize: '13px' }}>Create your first godown to start tracking stock per location.</p>
              {canManage && (
                <button className="btn btn-primary" style={{ marginTop: '16px' }}
                  onClick={() => { setEditingGodown(null); setIsFormOpen(true); }}>
                  <Plus size={15} /> Create Godown
                </button>
              )}
            </div>
          ) : (
            godowns.map((g) => {
              const stats = getGodownStats(g.id);
              return (
                <div key={g.id} className="card" style={{ padding: '20px', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                  onClick={() => setActiveGodownId(g.id)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'linear-gradient(135deg, #0284c7, #0369a1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Warehouse size={20} color="#fff" />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>{g.name}</h3>
                        {g.code && <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>{g.code}</span>}
                      </div>
                    </div>
                    <span style={{
                      padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700,
                      background: g.is_active ? '#dcfce7' : '#f1f5f9',
                      color: g.is_active ? '#16a34a' : '#94a3b8'
                    }}>
                      {g.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {g.location && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '12px', marginBottom: '8px' }}>
                      <MapPin size={12} /> {g.location}
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', margin: '12px 0' }}>
                    <div style={{ background: '#f0fdf4', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#16a34a' }}>{stats.total.toLocaleString('en-IN')}</div>
                      <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>Total Units</div>
                    </div>
                    <div style={{ background: '#eff6ff', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#0284c7' }}>{stats.productsWithStock}</div>
                      <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>Products</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button className="btn btn-primary" style={{ fontSize: '12px', padding: '6px 12px' }}
                      onClick={(e) => { e.stopPropagation(); setActiveGodownId(g.id); }}>
                      View Stock <ChevronRight size={13} />
                    </button>
                    {canManage && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="btn btn-secondary" style={{ fontSize: '11px', padding: '5px 8px' }}
                          onClick={(e) => { e.stopPropagation(); setEditingGodown(g); setIsFormOpen(true); }}>
                          <Edit2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        // Clicked a specific godown tab
        <GodownDetail
          godownId={activeView}
          dataService={dataService}
          currentUser={currentUser}
          onBack={() => setActiveView('all')}
          onOpenTransfer={() => setIsTransferOpen(true)}
          embedded
        />
      )}

      {/* Recent Stock & Godown Activity Panel */}
      <div className="card" style={{ marginTop: '28px', padding: '20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(99, 102, 241, 0.25)' }}>
              <Activity size={18} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>
                Recent Stock & Godown Activity
              </h3>
              <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0' }}>
                Live audit trail of purchases (stock-in), sales (stock-out), transfers & adjustments
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', background: '#eff6ff', color: '#0284c7', fontWeight: 700, padding: '4px 10px', borderRadius: '999px', border: '1px solid #bfdbfe' }}>
              {allActivities.length} {allActivities.length === 1 ? 'event' : 'events'}
            </span>
            <button
              onClick={() => setIsActivityModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 12px',
                fontSize: '11px',
                fontWeight: 700,
                color: '#4f46e5',
                background: '#ede9fe',
                border: '1px solid #c7d2fe',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              <ExternalLink size={12} /> View Full History
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Row 1: Date quick chips & Date picker */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>Timeframe:</span>
              {[
                { id: 'all', label: 'All' },
                { id: 'today', label: 'Today' },
                { id: 'yesterday', label: 'Yesterday' },
                { id: 'week', label: 'Last 7 Days' }
              ].map((d) => {
                const active = !activitySpecificDate && activityQuickDate === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => {
                      setActivitySpecificDate('');
                      setActivityQuickDate(d.id);
                    }}
                    style={{
                      padding: '3px 10px',
                      fontSize: '11px',
                      fontWeight: active ? 700 : 500,
                      borderRadius: '6px',
                      border: 'none',
                      background: active ? '#0f172a' : '#ffffff',
                      color: active ? '#ffffff' : '#64748b',
                      boxShadow: active ? 'none' : '0 1px 2px rgba(0,0,0,0.05)',
                      cursor: 'pointer'
                    }}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>

            {/* Date-wise Picker */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ffffff', padding: '4px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
              <Calendar size={13} color="#64748b" />
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Filter by Date:</span>
              <input
                type="date"
                value={activitySpecificDate}
                onChange={(e) => {
                  setActivitySpecificDate(e.target.value);
                  if (e.target.value) setActivityQuickDate('all');
                }}
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontSize: '11px',
                  color: '#0f172a',
                  fontWeight: 700,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              />
              {activitySpecificDate && (
                <button
                  onClick={() => setActivitySpecificDate('')}
                  title="Clear date"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0 2px', display: 'flex' }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Row 2: Type filter buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>Category:</span>
            {[
              { id: 'all', label: 'All Activities' },
              { id: 'purchases', label: '📥 Stock In (Purchases)' },
              { id: 'sales', label: '📤 Stock Out (Sales)' },
              { id: 'transfers', label: '🔄 Transfers' },
              { id: 'adjustments', label: '⚖️ Adjustments' },
              { id: 'godowns_products', label: '🏭 Godowns & Products' }
            ].map((t) => {
              const active = activityType === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActivityType(t.id)}
                  style={{
                    padding: '4px 9px',
                    fontSize: '11px',
                    fontWeight: active ? 700 : 500,
                    borderRadius: '6px',
                    border: active ? '1px solid #6366f1' : '1px solid #e2e8f0',
                    background: active ? '#ede9fe' : '#ffffff',
                    color: active ? '#4f46e5' : '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Timeline List */}
        {recentActivities.length === 0 ? (
          <div style={{ padding: '36px 20px', textAlign: 'center', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
            <AlertCircle size={32} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#475569', margin: '0 0 4px' }}>
              No activities found for the selected filter
            </p>
            <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 12px' }}>
              {activitySpecificDate
                ? `No stock or godown activities recorded on ${formatDate(activitySpecificDate)}.`
                : 'Try picking a different date or clearing the category filter.'}
            </p>
            <button
              onClick={() => {
                setActivitySpecificDate('');
                setActivityQuickDate('all');
                setActivityType('all');
              }}
              style={{
                padding: '6px 14px',
                fontSize: '11px',
                fontWeight: 600,
                background: '#0f172a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {recentActivities.map((log, idx) => {
              // Action styling
              let badgeBg = '#f8fafc';
              let badgeBorder = '#e2e8f0';
              let badgeDot = '#64748b';
              let badgeText = '#475569';
              let badgeLabel = log.action;
              let moduleIcon = <Warehouse size={13} />;

              if (log.module === 'Purchases') {
                badgeBg = '#ecfdf5';
                badgeBorder = '#a7f3d0';
                badgeDot = '#059669';
                badgeText = '#047857';
                badgeLabel = 'Stock In / Purchase';
                moduleIcon = <PackagePlus size={13} color="#059669" />;
              } else if (log.module === 'Sales') {
                badgeBg = '#f5f3ff';
                badgeBorder = '#ddd6fe';
                badgeDot = '#7c3aed';
                badgeText = '#6d28d9';
                badgeLabel = 'Stock Out / Sale';
                moduleIcon = <ShoppingCart size={13} color="#7c3aed" />;
              } else if (log.module === 'Stock' && log.action === 'TRANSFER') {
                badgeBg = '#eff6ff';
                badgeBorder = '#bfdbfe';
                badgeDot = '#0284c7';
                badgeText = '#0369a1';
                badgeLabel = 'Stock Transfer';
                moduleIcon = <ArrowLeftRight size={13} color="#0284c7" />;
              } else if (log.module === 'Stock') {
                badgeBg = '#fffbeb';
                badgeBorder = '#fde68a';
                badgeDot = '#d97706';
                badgeText = '#b45309';
                badgeLabel = 'Stock Adjustment';
                moduleIcon = <Sliders size={13} color="#d97706" />;
              } else if (log.module === 'Godowns') {
                badgeBg = '#ecfeff';
                badgeBorder = '#a5f3fc';
                badgeDot = '#0891b2';
                badgeText = '#0e7490';
                badgeLabel = log.action === 'CREATE' ? 'Godown Created' : log.action === 'ARCHIVE' ? 'Godown Archived' : 'Godown Updated';
                moduleIcon = <Warehouse size={13} color="#0891b2" />;
              } else if (log.module === 'Products') {
                badgeBg = '#f8fafc';
                badgeBorder = '#e2e8f0';
                badgeDot = '#64748b';
                badgeText = '#475569';
                badgeLabel = log.action === 'CREATE' ? 'Product Added' : 'Product Updated';
                moduleIcon = <Package size={13} color="#64748b" />;
              }

              const ts = log.created_at ? new Date(log.created_at) : null;
              const timeStr = ts
                ? ts.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
                : '';
              const dateStr = ts ? formatDate(ts.toISOString().split('T')[0]) : '';

              return (
                <div
                  key={log.id || idx}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                    padding: '12px 0',
                    borderBottom: idx < recentActivities.length - 1 ? '1px solid #f1f5f9' : 'none',
                  }}
                >
                  {/* Timeline dot */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingTop: '2px' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      background: badgeBg,
                      border: `1.5px solid ${badgeBorder}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: badgeDot, flexShrink: 0
                    }}>
                      {moduleIcon}
                    </div>
                    {idx < recentActivities.length - 1 && (
                      <div style={{ width: '1.5px', flex: 1, minHeight: '12px', background: '#e2e8f0', marginTop: '3px' }} />
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '10px', fontWeight: 700, padding: '1px 7px', borderRadius: '999px',
                        background: badgeBg, border: `1px solid ${badgeBorder}`, color: badgeText
                      }}>
                        {badgeLabel}
                      </span>
                      <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                        {log.module}
                      </span>
                      {log.record_ref && (
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a', background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                          {log.record_ref}
                        </span>
                      )}
                    </div>

                    {log.details && (
                      <p style={{ margin: '5px 0 0', fontSize: '12.5px', color: '#1e293b', lineHeight: 1.45, fontWeight: 500 }}>
                        {log.details}
                      </p>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#64748b' }}>
                        <Clock size={10} /> {timeStr} &bull; {dateStr}
                      </span>
                      {log.user_name && (
                        <span style={{ fontSize: '11px', color: '#0284c7', fontWeight: 600 }}>
                          by {log.user_name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* View More Button Footer */}
        {allActivities.length > 10 && (
          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
            <button
              onClick={() => setIsActivityModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 20px',
                fontSize: '12px',
                fontWeight: 700,
                color: '#4f46e5',
                background: '#ede9fe',
                border: '1px solid #c7d2fe',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              View More Activities (Showing 10 of {allActivities.length}) →
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {isFormOpen && (
        <GodownFormModal
          isOpen={isFormOpen}
          onClose={() => { setIsFormOpen(false); setEditingGodown(null); }}
          godown={editingGodown}
          dataService={dataService}
          currentUser={currentUser}
          onArchive={handleArchive}
        />
      )}

      {isTransferOpen && (
        <StockTransferModal
          isOpen={isTransferOpen}
          onClose={() => setIsTransferOpen(false)}
          dataService={dataService}
          currentUser={currentUser}
        />
      )}

      {isTransferHistoryOpen && (
        <TransferHistory
          isOpen={isTransferHistoryOpen}
          onClose={() => setIsTransferHistoryOpen(false)}
          dataService={dataService}
        />
      )}

      {/* Full Activity History Modal */}
      {isActivityModalOpen && (
        <GodownActivityModal
          isOpen={isActivityModalOpen}
          onClose={() => setIsActivityModalOpen(false)}
          dataService={dataService}
        />
      )}
    </div>
  );
};
