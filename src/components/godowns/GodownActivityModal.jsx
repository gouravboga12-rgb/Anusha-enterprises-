import React, { useState, useMemo } from 'react';
import {
  X, Activity, Search, Calendar, Filter, ArrowLeftRight,
  TrendingDown, TrendingUp, Warehouse, Package, Sliders,
  Clock, User, Download, Printer, ChevronRight, CheckCircle2,
  PackagePlus, ShoppingCart, Truck, AlertCircle
} from 'lucide-react';
import { formatDate, formatCurrency } from '../../utils/formatters';

export const GodownActivityModal = ({ isOpen, onClose, dataService }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [quickDate, setQuickDate] = useState('all'); // 'all' | 'today' | 'yesterday' | 'week'
  const [specificDate, setSpecificDate] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'purchases' | 'sales' | 'transfers' | 'adjustments' | 'godowns_products'

  if (!isOpen) return null;

  const activities = useMemo(() => {
    if (!dataService?.getGodownActivities) return [];
    return dataService.getGodownActivities({
      date: specificDate || null,
      quickDate: specificDate ? null : quickDate,
      type: typeFilter,
      search: searchTerm
    });
  }, [dataService, quickDate, specificDate, typeFilter, searchTerm]);

  // Quick stats from filtered results
  const stats = useMemo(() => {
    let purchasesCount = 0;
    let salesCount = 0;
    let transfersCount = 0;

    activities.forEach((act) => {
      if (act.module === 'Purchases') purchasesCount++;
      else if (act.module === 'Sales') salesCount++;
      else if (act.module === 'Stock' && act.action === 'TRANSFER') transfersCount++;
    });

    return { total: activities.length, purchasesCount, salesCount, transfersCount };
  }, [activities]);

  const handlePrint = () => {
    const rows = activities.map((a) => {
      const ts = a.created_at ? new Date(a.created_at) : null;
      const isValidDate = ts && !isNaN(ts.getTime());
      const timeStr = isValidDate ? ts.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : (a.time || '');
      const dateStr = isValidDate ? formatDate(ts.toISOString().split('T')[0]) : (a.date ? formatDate(a.date) : '');
      return `[${a.record_ref || a.module}] ${dateStr} ${timeStr} | ${a.module} (${a.action}) | ${a.details || ''} | by ${a.user_name || 'Admin'}`;
    }).join('\n');

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`<pre style="font-family:monospace;padding:24px;font-size:12px;white-space:pre-wrap;">
ANUSHA ENTERPRISES — STOCK & GODOWN ACTIVITY REPORT
Generated: ${new Date().toLocaleString('en-IN')}
Filters: Type=${typeFilter} | Date=${specificDate || quickDate} | Search=${searchTerm || 'None'}
Total Activities: ${activities.length}
${'='.repeat(90)}
${rows}
${'='.repeat(90)}
</pre>`);
      win.print();
      win.close();
    }
  };

  const getModuleConfig = (act) => {
    if (act.module === 'Purchases') {
      return {
        bg: '#ecfdf5',
        border: '#a7f3d0',
        dot: '#059669',
        text: '#047857',
        label: 'Stock In / Purchase',
        icon: <PackagePlus size={13} color="#059669" />
      };
    }
    if (act.module === 'Sales') {
      return {
        bg: '#f5f3ff',
        border: '#ddd6fe',
        dot: '#7c3aed',
        text: '#6d28d9',
        label: 'Stock Out / Sale',
        icon: <ShoppingCart size={13} color="#7c3aed" />
      };
    }
    if (act.module === 'Stock' && act.action === 'TRANSFER') {
      return {
        bg: '#eff6ff',
        border: '#bfdbfe',
        dot: '#0284c7',
        text: '#0369a1',
        label: 'Stock Transfer',
        icon: <ArrowLeftRight size={13} color="#0284c7" />
      };
    }
    if (act.module === 'Stock') {
      return {
        bg: '#fffbeb',
        border: '#fde68a',
        dot: '#d97706',
        text: '#b45309',
        label: 'Stock Adjustment',
        icon: <Sliders size={13} color="#d97706" />
      };
    }
    if (act.module === 'Godowns') {
      return {
        bg: '#ecfeff',
        border: '#a5f3fc',
        dot: '#0891b2',
        text: '#0e7490',
        label: 'Godown',
        icon: <Warehouse size={13} color="#0891b2" />
      };
    }
    return {
      bg: '#f8fafc',
      border: '#e2e8f0',
      dot: '#64748b',
      text: '#475569',
      label: 'Product',
      icon: <Package size={13} color="#64748b" />
    };
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '18px',
          width: '100%',
          maxWidth: '920px',
          height: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            background: 'linear-gradient(to right, #fafafa, #ffffff)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(99, 102, 241, 0.3)'
              }}
            >
              <Activity size={20} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>
                Stock & Godown Activity Log
              </h2>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>
                Complete audit trail of inward purchases, outward sales, transfers & stock movements
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handlePrint}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#334155',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              <Printer size={14} /> Print / Export
            </button>
            <button
              onClick={onClose}
              style={{
                background: '#f1f5f9',
                border: 'none',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div
          style={{
            padding: '10px 24px',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#475569' }}>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>{stats.total}</span> total events
          </div>
          <div style={{ width: '1px', height: '14px', background: '#cbd5e1' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#047857' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
            <span style={{ fontWeight: 700 }}>{stats.purchasesCount}</span> Inward Purchases
          </div>
          <div style={{ width: '1px', height: '14px', background: '#cbd5e1' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6d28d9' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8b5cf6' }} />
            <span style={{ fontWeight: 700 }}>{stats.salesCount}</span> Outward Sales
          </div>
          <div style={{ width: '1px', height: '14px', background: '#cbd5e1' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#0284c7' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0284c7' }} />
            <span style={{ fontWeight: 700 }}>{stats.transfersCount}</span> Transfers
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div
          style={{
            padding: '14px 24px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            flexShrink: 0,
            background: '#ffffff'
          }}
        >
          {/* Row 1: Search & Date picker */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search Box */}
            <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
              <Search
                size={14}
                style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
              />
              <input
                type="text"
                placeholder="Search supplier, customer, product, godown, invoice #..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px 7px 32px',
                  fontSize: '13px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  style={{
                    position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Specific Date Picker */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', padding: '4px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <Calendar size={14} color="#64748b" />
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Date:</span>
              <input
                type="date"
                value={specificDate}
                onChange={(e) => {
                  setSpecificDate(e.target.value);
                  if (e.target.value) setQuickDate('all');
                }}
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontSize: '12px',
                  color: '#0f172a',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              />
              {specificDate && (
                <button
                  onClick={() => setSpecificDate('')}
                  title="Clear specific date"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0 2px', display: 'flex' }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Row 2: Filter chips */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            {/* Type selector */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'All Activities' },
                { id: 'purchases', label: '📥 Stock In (Purchases)' },
                { id: 'sales', label: '📤 Stock Out (Sales)' },
                { id: 'transfers', label: '🔄 Transfers' },
                { id: 'adjustments', label: '⚖️ Adjustments' },
                { id: 'godowns_products', label: '🏭 Godowns & Products' }
              ].map((t) => {
                const active = typeFilter === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTypeFilter(t.id)}
                    style={{
                      padding: '5px 10px',
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

            {/* Quick date chips (active when no specific date is picked) */}
            {!specificDate && (
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                {[
                  { id: 'all', label: 'All Time' },
                  { id: 'today', label: 'Today' },
                  { id: 'yesterday', label: 'Yesterday' },
                  { id: 'week', label: 'Last 7 Days' }
                ].map((d) => {
                  const active = quickDate === d.id;
                  return (
                    <button
                      key={d.id}
                      onClick={() => setQuickDate(d.id)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        fontWeight: active ? 700 : 500,
                        borderRadius: '4px',
                        border: 'none',
                        background: active ? '#0f172a' : '#f1f5f9',
                        color: active ? '#ffffff' : '#64748b',
                        cursor: 'pointer'
                      }}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Timeline List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', background: '#fafafa' }}>
          {activities.length === 0 ? (
            <div
              style={{
                padding: '60px 20px',
                textAlign: 'center',
                background: '#ffffff',
                borderRadius: '12px',
                border: '1px dashed #cbd5e1'
              }}
            >
              <AlertCircle size={36} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#334155', margin: '0 0 6px' }}>
                No activities found
              </h4>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px' }}>
                No stock or godown activities match your selected filters.
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSpecificDate('');
                  setQuickDate('all');
                  setTypeFilter('all');
                }}
                style={{
                  padding: '7px 16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: '#6366f1',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {activities.map((act, idx) => {
                const cfg = getModuleConfig(act);
                const ts = act.created_at ? new Date(act.created_at) : null;
                const isValidDate = ts && !isNaN(ts.getTime());
                const timeStr = isValidDate
                  ? ts.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
                  : (act.time || '');
                const dateStr = isValidDate
                  ? formatDate(ts.toISOString().split('T')[0])
                  : (act.date ? formatDate(act.date) : '');

                return (
                  <div
                    key={act.id || idx}
                    style={{
                      background: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      padding: '14px 16px',
                      display: 'flex',
                      gap: '14px',
                      alignItems: 'flex-start',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                      transition: 'border-color 0.15s ease'
                    }}
                  >
                    {/* Left Icon */}
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: cfg.bg,
                        border: `1.5px solid ${cfg.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px'
                      }}
                    >
                      {cfg.icon}
                    </div>

                    {/* Main Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Top Row: Badges & Timestamp */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '999px',
                              background: cfg.bg,
                              border: `1px solid ${cfg.border}`,
                              color: cfg.text
                            }}
                          >
                            {cfg.label}
                          </span>

                          {act.record_ref && (
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                color: '#0f172a',
                                background: '#f1f5f9',
                                border: '1px solid #e2e8f0',
                                padding: '2px 7px',
                                borderRadius: '4px'
                              }}
                            >
                              {act.record_ref}
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#64748b' }}>
                            <Clock size={11} /> {timeStr} &bull; {dateStr}
                          </span>
                          {act.user_name && (
                            <span
                              style={{
                                fontSize: '11px',
                                color: '#0284c7',
                                fontWeight: 600,
                                background: '#f0f9ff',
                                padding: '1px 6px',
                                borderRadius: '4px'
                              }}
                            >
                              by {act.user_name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Detail Text */}
                      {act.details && (
                        <div
                          style={{
                            margin: '8px 0 0',
                            fontSize: '13px',
                            color: '#1e293b',
                            lineHeight: 1.5,
                            fontWeight: 500
                          }}
                        >
                          {act.details}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '12px 24px',
            borderTop: '1px solid #f1f5f9',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}
        >
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Showing <strong>{activities.length}</strong> events
          </span>
          <button
            onClick={onClose}
            style={{
              padding: '7px 20px',
              fontSize: '12px',
              fontWeight: 700,
              background: '#0f172a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
