import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity, Search, Filter, Calendar, ShieldCheck,
  User, CheckCircle2, AlertTriangle, ArrowLeftRight,
  ShoppingCart, TrendingUp, RefreshCw, Key, Wallet, Database,
  Trash2, CalendarX, X, AlertCircle, Clock, Check
} from 'lucide-react';
import { formatDate, getTodayDateString } from '../../utils/formatters';

export const ActivityLogPage = ({ dataService, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [staffFilter, setStaffFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [quickDate, setQuickDate] = useState('all');

  const [activeClearModal, setActiveClearModal] = useState(null);
  const [targetClearDate, setTargetClearDate] = useState(getTodayDateString());
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  const [, setTick] = useState(0);
  useEffect(() => {
    if (!dataService) return;
    return dataService.subscribe(() => setTick((t) => t + 1));
  }, [dataService]);

  const logs = useMemo(() => {
    if (!dataService?.getActivityLog) return [];
    return dataService.getActivityLog();
  }, [dataService]);

  // Dynamically populated staff list from registered CRM users, currentUser, and logs
  const staffList = useMemo(() => {
    const names = new Set();
    if (dataService?.getCrmUsers) {
      dataService.getCrmUsers().forEach((u) => {
        if (u.name && u.name.trim()) names.add(u.name.trim());
      });
    }
    if (currentUser?.name) {
      names.add(currentUser.name.trim());
    }
    logs.forEach((l) => {
      if (l.user_name && l.user_name.trim()) names.add(l.user_name.trim());
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [dataService, currentUser, logs]);

  const filteredLogs = useMemo(() => {
    let list = logs;
    if (staffFilter !== 'all') {
      const sf = staffFilter.toLowerCase();
      list = list.filter((l) => l.user_name && l.user_name.toLowerCase() === sf);
    }
    if (moduleFilter !== 'all') list = list.filter((l) => l.module === moduleFilter);
    if (actionFilter !== 'all') list = list.filter((l) => l.action === actionFilter);
    if (dateFilter) {
      list = list.filter((l) => l.created_at && l.created_at.startsWith(dateFilter));
    } else if (quickDate === 'today') {
      const todayStr = getTodayDateString();
      list = list.filter((l) => l.created_at && l.created_at.startsWith(todayStr));
    } else if (quickDate === 'yesterday') {
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
      list = list.filter((l) => l.created_at && l.created_at.startsWith(yesterday.toISOString().slice(0, 10)));
    } else if (quickDate === 'week') {
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
      list = list.filter((l) => l.created_at && l.created_at.slice(0, 10) >= weekAgo.toISOString().slice(0, 10));
    } else if (quickDate === 'month') {
      const monthStr = getTodayDateString().slice(0, 7);
      list = list.filter((l) => l.created_at && l.created_at.startsWith(monthStr));
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter((l) =>
        (l.user_name && l.user_name.toLowerCase().includes(q)) ||
        (l.record_ref && l.record_ref.toLowerCase().includes(q)) ||
        (l.details && l.details.toLowerCase().includes(q)) ||
        (l.action && l.action.toLowerCase().includes(q)) ||
        (l.module && l.module.toLowerCase().includes(q))
      );
    }
    return list;
  }, [logs, staffFilter, moduleFilter, actionFilter, dateFilter, quickDate, searchTerm]);

  const targetDateLogsCount = useMemo(() => {
    if (!targetClearDate) return 0;
    return logs.filter((l) => l.created_at && l.created_at.startsWith(targetClearDate)).length;
  }, [logs, targetClearDate]);

  const canManage = dataService?.canDelete ? dataService.canDelete(currentUser) : true;

  const handleClearAll = async () => {
    if (!canManage) { alert('Permission denied: Only administrators can clear activity logs.'); return; }
    setIsProcessing(true);
    try {
      await dataService.clearAllActivityLogs(currentUser);
      setActionMessage({ text: 'All activity logs successfully cleared.', type: 'success' });
      setActiveClearModal(null);
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err) { alert(err.message || 'Failed to clear activity logs.'); }
    finally { setIsProcessing(false); }
  };

  const handleClearByDate = async () => {
    if (!canManage) { alert('Permission denied: Only administrators can clear activity logs.'); return; }
    if (!targetClearDate) { alert('Please select a valid date.'); return; }
    setIsProcessing(true);
    try {
      await dataService.clearActivityLogsByDate(targetClearDate, currentUser);
      setActionMessage({ text: `Activity logs for ${formatDate(targetClearDate)} successfully cleared.`, type: 'success' });
      setActiveClearModal(null);
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err) { alert(err.message || 'Failed to clear activity logs.'); }
    finally { setIsProcessing(false); }
  };

  const getActionBadge = (action) => {
    const map = {
      CREATE: <span className="badge badge-paid">Create</span>,
      UPDATE: <span className="badge badge-warning">Correction</span>,
      DELETE: <span className="badge badge-danger">Delete</span>,
      TRANSFER: <span className="badge badge-info">Transfer</span>,
      PAYMENT: <span className="badge badge-active">Payment</span>,
      WALLET_BUDGET: <span className="badge badge-paid">Wallet Fund</span>,
      WALLET_EXPENSE: <span className="badge badge-danger">Wallet Expense</span>,
      LOGIN: <span className="badge badge-active">Login</span>,
      LOGIN_FAILED: <span className="badge badge-danger">Failed Login</span>,
      ADJUST: <span className="badge badge-neutral">Adjustment</span>,
      ARCHIVE: <span className="badge badge-warning">Archived</span>,
    };
    return map[action] || <span className="badge badge-neutral">{action}</span>;
  };

  const getModuleIcon = (module) => {
    const map = {
      Sales: <TrendingUp size={13} color="#10b981" />,
      Purchases: <ShoppingCart size={13} color="#f59e0b" />,
      Stock: <ArrowLeftRight size={13} color="#0284c7" />,
      Payments: <CheckCircle2 size={13} color="#10b981" />,
      Wallet: <Wallet size={13} color="#8b5cf6" />,
      Users: <Key size={13} color="#ec4899" />,
      Auth: <Key size={13} color="#ec4899" />,
    };
    return map[module] || <Database size={13} color="#64748b" />;
  };

  const moduleBadgeColor = (module) => {
    const map = { Sales: '#10b981', Purchases: '#f59e0b', Stock: '#0284c7', Payments: '#10b981', Wallet: '#8b5cf6', Users: '#ec4899', Auth: '#ec4899' };
    return map[module] || '#64748b';
  };

  return (
    <div>
      {/* Toast message */}
      {actionMessage && (
        <div style={{ padding: '12px 16px', marginBottom: '14px', borderRadius: '10px', background: actionMessage.type === 'success' ? '#ecfdf5' : '#fff1f2', border: `1px solid ${actionMessage.type === 'success' ? '#a7f3d0' : '#fecdd3'}`, color: actionMessage.type === 'success' ? '#065f46' : '#9f1239', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} /><span>{actionMessage.text}</span></div>
          <button onClick={() => setActionMessage(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}><X size={16} /></button>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Activity size={20} color="#0284c7" /> Activity Log &amp; Audit Trail
            </h1>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '3px', margin: '3px 0 0' }}>
              Permanent record of all financial, stock &amp; auth events.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span className="badge badge-active" style={{ fontSize: '11px', padding: '5px 10px' }}>{logs.length} Events</span>
            <button onClick={() => { setTargetClearDate(dateFilter || getTodayDateString()); setActiveClearModal('date'); }}
              disabled={logs.length === 0}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 10px', fontSize: '11px', fontWeight: 600, color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', cursor: logs.length === 0 ? 'not-allowed' : 'pointer', opacity: logs.length === 0 ? 0.6 : 1 }}>
              <CalendarX size={13} /> Clear Day
            </button>
            <button onClick={() => setActiveClearModal('all')} disabled={logs.length === 0}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 10px', fontSize: '11px', fontWeight: 600, color: '#be123c', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '8px', cursor: logs.length === 0 ? 'not-allowed' : 'pointer', opacity: logs.length === 0 ? 0.6 : 1 }}>
              <Trash2 size={13} /> Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Filter Card */}
      <div className="card" style={{ padding: '12px 14px', marginBottom: '16px' }}>
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 10px', marginBottom: '10px' }}>
          <Search size={14} color="#94a3b8" />
          <input type="text" style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', flex: 1, color: '#0f172a' }}
            placeholder="Search by staff, ref, details..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          {searchTerm && <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}><X size={14} /></button>}
        </div>

        {/* Dropdowns */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
          <select
            className="form-select"
            style={{ flex: 1, minWidth: '150px', fontSize: '12px', padding: '6px 8px' }}
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
          >
            <option value="all">All Staff Members ({staffList.length})</option>
            {staffList.map((name) => (
              <option key={name} value={name}>
                👤 {name}
              </option>
            ))}
          </select>
          <select className="form-select" style={{ flex: 1, minWidth: '130px', fontSize: '12px', padding: '6px 8px' }}
            value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}>
            <option value="all">All Modules</option>
            <option value="Sales">Sales</option>
            <option value="Purchases">Purchases</option>
            <option value="Stock">Stock &amp; Godowns</option>
            <option value="Payments">Payments</option>
            <option value="Wallet">Wallet</option>
            <option value="Products">Products</option>
            <option value="Suppliers">Suppliers</option>
            <option value="Customers">Customers</option>
            <option value="Users">Staff Users</option>
            <option value="Auth">Security &amp; Login</option>
          </select>
          <select className="form-select" style={{ flex: 1, minWidth: '130px', fontSize: '12px', padding: '6px 8px' }}
            value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
            <option value="all">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Correction / Edit</option>
            <option value="DELETE">Delete</option>
            <option value="TRANSFER">Transfer</option>
            <option value="PAYMENT">Payment</option>
            <option value="WALLET_BUDGET">Wallet Budget</option>
            <option value="WALLET_EXPENSE">Wallet Expense</option>
            <option value="LOGIN">Staff Login</option>
            <option value="LOGIN_FAILED">Failed Login</option>
          </select>
        </div>

        {/* Date filter row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b' }}>DATE:</span>
            {[{ id: 'all', label: 'All' }, { id: 'today', label: 'Today' }, { id: 'yesterday', label: 'Yesterday' }, { id: 'week', label: '7 Days' }, { id: 'month', label: 'Month' }].map((d) => {
              const active = !dateFilter && quickDate === d.id;
              return (
                <button key={d.id} onClick={() => { setDateFilter(''); setQuickDate(d.id); }}
                  style={{ padding: '3px 8px', fontSize: '11px', fontWeight: active ? 700 : 500, borderRadius: '6px', border: 'none', background: active ? '#0f172a' : '#f1f5f9', color: active ? '#fff' : '#64748b', cursor: 'pointer' }}>
                  {d.label}
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#f8fafc', padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
            <Calendar size={12} color="#64748b" />
            <input type="date" value={dateFilter}
              onChange={(e) => { setDateFilter(e.target.value); if (e.target.value) setQuickDate('all'); }}
              style={{ border: 'none', background: 'transparent', fontSize: '11px', color: '#0f172a', fontWeight: 700, outline: 'none', cursor: 'pointer', maxWidth: '120px' }} />
            {dateFilter && <button onClick={() => setDateFilter('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex' }}><X size={11} /></button>}
          </div>
        </div>
      </div>

      {/* Count + Reset */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', fontSize: '12px', color: '#64748b' }}>
        <span>Showing <strong>{filteredLogs.length}</strong> of {logs.length} records{dateFilter && <span style={{ color: '#0284c7', fontWeight: 600 }}> on {formatDate(dateFilter)}</span>}</span>
        {(dateFilter || quickDate !== 'all' || moduleFilter !== 'all' || actionFilter !== 'all' || searchTerm) && (
          <button onClick={() => { setDateFilter(''); setQuickDate('all'); setModuleFilter('all'); setActionFilter('all'); setSearchTerm(''); }}
            style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '11px', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
            Reset Filters
          </button>
        )}
      </div>

      {/* Log — Mobile Card List */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {filteredLogs.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <AlertCircle size={36} color="#94a3b8" style={{ marginBottom: '10px' }} />
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>No activity log events match your filters.</div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
              {dateFilter ? `No events logged on ${formatDate(dateFilter)}.` : 'Try clearing your search or date filter.'}
            </div>
          </div>
        ) : filteredLogs.map((log, idx) => {
          const dateObj = new Date(log.created_at);
          const timeStr = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const dateStr = formatDate(log.created_at.split('T')[0]);
          const mColor = moduleBadgeColor(log.module);

          return (
            <div key={log.id || idx} style={{ padding: '12px 14px', borderBottom: idx < filteredLogs.length - 1 ? '1px solid #f1f5f9' : 'none', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {/* Row 1: Module + Action + Timestamp */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: mColor, background: `${mColor}18`, padding: '2px 8px', borderRadius: '999px', border: `1px solid ${mColor}30` }}>
                    {getModuleIcon(log.module)} {log.module}
                  </span>
                  {getActionBadge(log.action)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#64748b' }}>
                  <Clock size={10} /> {timeStr} · {dateStr}
                </div>
              </div>
              {/* Row 2: Reference + Details */}
              {log.record_ref && (
                <span className="badge badge-neutral" style={{ fontSize: '10px', alignSelf: 'flex-start' }}>{log.record_ref}</span>
              )}
              {log.details && (
                <div style={{ fontSize: '12.5px', color: '#334155', lineHeight: 1.45 }}>{log.details}</div>
              )}
              {/* Row 3: Staff user */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, flexShrink: 0 }}>
                  {(log.user_name || 'A')[0].toUpperCase()}
                </div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#0284c7' }}>{log.user_name || 'Admin'}</span>
                {log.user_email && <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>{log.user_email}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Clear All Modal */}
      {activeClearModal === 'all' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(3px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '460px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}><Trash2 size={22} /></div>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Clear All Activity Logs?</h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>Permanent, irreversible action</p>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.5, margin: '0 0 20px' }}>
              Are you sure you want to permanently delete all <strong>{logs.length}</strong> activity logs? Past transactions, customers, suppliers, and stocks will remain unaffected, but the audit history will be wiped.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setActiveClearModal(null)} disabled={isProcessing}
                style={{ padding: '8px 16px', fontSize: '12px', fontWeight: 600, background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleClearAll} disabled={isProcessing}
                style={{ padding: '8px 18px', fontSize: '12px', fontWeight: 700, background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', cursor: isProcessing ? 'wait' : 'pointer' }}>
                {isProcessing ? 'Clearing...' : 'Yes, Clear All Logs'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Date Modal */}
      {activeClearModal === 'date' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(3px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '460px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}><CalendarX size={22} /></div>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Clear Logs by Date / Day</h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>Delete activity logs for a specific calendar day</p>
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Select Day to Clear:</label>
              <input type="date" className="form-input" value={targetClearDate} onChange={(e) => setTargetClearDate(e.target.value)} style={{ width: '100%', fontSize: '13px', padding: '8px 12px' }} />
            </div>
            <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px', fontSize: '12.5px', color: '#475569' }}>
              Found <strong>{targetDateLogsCount}</strong> event(s) on <strong>{formatDate(targetClearDate)}</strong>.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setActiveClearModal(null)} disabled={isProcessing}
                style={{ padding: '8px 16px', fontSize: '12px', fontWeight: 600, background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleClearByDate} disabled={isProcessing || targetDateLogsCount === 0}
                style={{ padding: '8px 18px', fontSize: '12px', fontWeight: 700, background: '#d97706', color: '#fff', border: 'none', borderRadius: '8px', cursor: isProcessing || targetDateLogsCount === 0 ? 'not-allowed' : 'pointer', opacity: targetDateLogsCount === 0 ? 0.6 : 1 }}>
                {isProcessing ? 'Clearing...' : `Clear ${targetDateLogsCount} Log(s)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
