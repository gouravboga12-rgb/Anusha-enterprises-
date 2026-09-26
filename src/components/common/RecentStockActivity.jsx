import React, { useState, useMemo } from 'react';
import {
  Activity, ExternalLink, Calendar, X, AlertCircle,
  Warehouse, PackagePlus, ShoppingCart, ArrowLeftRight,
  Sliders, Package, Trash2
} from 'lucide-react';
import { formatDate, getTodayDateString } from '../../utils/formatters';
import { GodownActivityModal } from '../godowns/GodownActivityModal';

export const RecentStockActivity = ({ dataService, title = "Recent Stock & Godown Activity", subtitle = "Live audit trail of purchases (stock-in), sales (stock-out), transfers & adjustments", currentUser }) => {
  // Activity filter state
  const [activityQuickDate, setActivityQuickDate] = useState('all'); // 'all' | 'today' | 'yesterday' | 'week'
  const [activitySpecificDate, setActivitySpecificDate] = useState('');
  const [activityType, setActivityType] = useState('all');
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);

  // Clear activities modal state
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [clearMode, setClearMode] = useState('range'); // 'range' | 'all'
  const [clearFromDate, setClearFromDate] = useState(getTodayDateString());
  const [clearToDate, setClearToDate] = useState(getTodayDateString());
  const [isClearing, setIsClearing] = useState(false);

  const handleExecuteClear = async () => {
    if (clearMode === 'all') {
      if (!window.confirm('Are you sure you want to permanently delete ALL stock & activity logs? This action cannot be undone.')) {
        return;
      }
    } else {
      if (!clearFromDate) {
        alert('Please specify a From Date');
        return;
      }
      if (!window.confirm(`Delete activity logs from ${clearFromDate} to ${clearToDate || 'today'}?`)) {
        return;
      }
    }

    setIsClearing(true);
    try {
      if (clearMode === 'all') {
        await dataService.clearActivities({ all: true }, currentUser);
      } else {
        await dataService.clearActivities({
          fromDate: clearFromDate,
          toDate: clearToDate || clearFromDate
        }, currentUser);
      }
      setIsClearModalOpen(false);
      alert('Activities cleared successfully.');
    } catch (err) {
      alert(err.message || 'Failed to clear activities');
    } finally {
      setIsClearing(false);
    }
  };

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

  return (
    <>
      <div className="card" style={{ marginTop: '28px', padding: '20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(99, 102, 241, 0.25)', flexShrink: 0 }}>
              <Activity size={18} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>
                {title}
              </h3>
              <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0' }}>
                {subtitle}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', background: '#eff6ff', color: '#0284c7', fontWeight: 700, padding: '4px 10px', borderRadius: '999px', border: '1px solid #bfdbfe' }}>
              {allActivities.length} {allActivities.length === 1 ? 'event' : 'events'}
            </span>
            <button
              onClick={() => setIsActivityModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
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
            <button
              onClick={() => setIsClearModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 700,
                color: '#dc2626',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
              title="Clear old activities or logs by date"
            >
              <Trash2 size={12} /> Clear Activities
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
              const isValidDate = ts && !isNaN(ts.getTime());
              const timeStr = isValidDate
                ? ts.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
                : (log.time || '');
              const dateStr = isValidDate
                ? formatDate(ts.toISOString().split('T')[0])
                : (log.date ? formatDate(log.date) : '');

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
                      {log.record_ref && (
                        <span style={{ fontSize: '10px', fontWeight: 600, color: '#0284c7', background: '#eff6ff', padding: '1px 6px', borderRadius: '4px' }}>
                          {log.record_ref}
                        </span>
                      )}
                      <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: 'auto' }}>
                        {dateStr} {timeStr ? `• ${timeStr}` : ''}
                      </span>
                    </div>

                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', marginTop: '3px', wordBreak: 'break-word' }}>
                      {log.details}
                    </div>

                    {log.user_name && (
                      <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px' }}>
                        By <span style={{ fontWeight: 600, color: '#475569' }}>{log.user_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Clear Activities Modal */}
      {isClearModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(3px)',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isClearing) setIsClearModalOpen(false);
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '460px',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trash2 size={16} color="#dc2626" />
                </div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                  Clear Recent Activities
                </h3>
              </div>
              <button
                onClick={() => setIsClearModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}
                disabled={isClearing}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b' }}>
              Choose whether to clear all recent stock activities or purge activities within a specific date range.
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setClearMode('range')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: clearMode === 'range' ? '#dc2626' : '#e2e8f0',
                  background: clearMode === 'range' ? '#fef2f2' : '#ffffff',
                  color: clearMode === 'range' ? '#dc2626' : '#475569',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                📅 By Date Range
              </button>
              <button
                type="button"
                onClick={() => setClearMode('all')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: clearMode === 'all' ? '#dc2626' : '#e2e8f0',
                  background: clearMode === 'all' ? '#fef2f2' : '#ffffff',
                  color: clearMode === 'all' ? '#dc2626' : '#475569',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                🗑️ Clear All
              </button>
            </div>

            {clearMode === 'range' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>From Date</label>
                    <input
                      type="date"
                      value={clearFromDate}
                      onChange={(e) => setClearFromDate(e.target.value)}
                      className="form-input"
                      style={{ padding: '6px 8px', fontSize: '12px', width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>To Date</label>
                    <input
                      type="date"
                      value={clearToDate}
                      onChange={(e) => setClearToDate(e.target.value)}
                      className="form-input"
                      style={{ padding: '6px 8px', fontSize: '12px', width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Activities logged between these dates will be removed.
                </span>
              </div>
            ) : (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '12px', borderRadius: '10px', color: '#b91c1c', fontSize: '12px' }}>
                ⚠️ <strong>Warning:</strong> This will erase all recent stock and godown activity audit logs completely across the entire CRM.
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsClearModalOpen(false)}
                disabled={isClearing}
                style={{ fontSize: '12px', padding: '7px 14px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleExecuteClear}
                disabled={isClearing}
                style={{ fontSize: '12px', padding: '7px 14px', background: '#dc2626', color: '#fff' }}
              >
                {isClearing ? 'Clearing...' : 'Confirm & Clear'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Activity Modal */}
      {isActivityModalOpen && (
        <GodownActivityModal
          isOpen={isActivityModalOpen}
          onClose={() => setIsActivityModalOpen(false)}
          dataService={dataService}
          currentUser={currentUser}
        />
      )}
    </>
  );
};

