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
  const [moduleFilter, setModuleFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [quickDate, setQuickDate] = useState('all'); // 'all' | 'today' | 'yesterday' | 'week' | 'month'

  // Clear modal states
  const [activeClearModal, setActiveClearModal] = useState(null); // 'all' | 'date' | null
  const [targetClearDate, setTargetClearDate] = useState(getTodayDateString());
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionMessage, setActionMessage] = useState(null); // { text, type: 'success' | 'error' }

  // Subscribe to live data changes
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!dataService) return;
    return dataService.subscribe(() => setTick((t) => t + 1));
  }, [dataService]);

  const logs = useMemo(() => {
    if (!dataService?.getActivityLog) return [];
    return dataService.getActivityLog();
  }, [dataService]);

  const filteredLogs = useMemo(() => {
    let list = logs;

    if (moduleFilter !== 'all') {
      list = list.filter((l) => l.module === moduleFilter);
    }

    if (actionFilter !== 'all') {
      list = list.filter((l) => l.action === actionFilter);
    }

    // Date-wise filtering
    if (dateFilter) {
      list = list.filter((l) => l.created_at && l.created_at.startsWith(dateFilter));
    } else if (quickDate === 'today') {
      const todayStr = getTodayDateString();
      list = list.filter((l) => l.created_at && l.created_at.startsWith(todayStr));
    } else if (quickDate === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toISOString().slice(0, 10);
      list = list.filter((l) => l.created_at && l.created_at.startsWith(yStr));
    } else if (quickDate === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const wStr = weekAgo.toISOString().slice(0, 10);
      list = list.filter((l) => l.created_at && l.created_at.slice(0, 10) >= wStr);
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
  }, [logs, moduleFilter, actionFilter, dateFilter, quickDate, searchTerm]);

  // Count logs on the target clear date
  const targetDateLogsCount = useMemo(() => {
    if (!targetClearDate) return 0;
    return logs.filter((l) => l.created_at && l.created_at.startsWith(targetClearDate)).length;
  }, [logs, targetClearDate]);

  const canManage = dataService?.canDelete ? dataService.canDelete(currentUser) : true;

  const handleClearAll = async () => {
    if (!canManage) {
      alert('Permission denied: Only administrators can clear activity logs.');
      return;
    }
    setIsProcessing(true);
    try {
      await dataService.clearAllActivityLogs(currentUser);
      setActionMessage({ text: 'All activity logs successfully cleared.', type: 'success' });
      setActiveClearModal(null);
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err) {
      alert(err.message || 'Failed to clear activity logs.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearByDate = async () => {
    if (!canManage) {
      alert('Permission denied: Only administrators can clear activity logs.');
      return;
    }
    if (!targetClearDate) {
      alert('Please select a valid date.');
      return;
    }
    setIsProcessing(true);
    try {
      await dataService.clearActivityLogsByDate(targetClearDate, currentUser);
      setActionMessage({ text: `Activity logs for ${formatDate(targetClearDate)} successfully cleared.`, type: 'success' });
      setActiveClearModal(null);
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err) {
      alert(err.message || 'Failed to clear activity logs.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getActionBadge = (action) => {
    switch (action) {
      case 'CREATE':
        return <span className="badge badge-paid">Create</span>;
      case 'UPDATE':
        return <span className="badge badge-warning">Correction</span>;
      case 'DELETE':
        return <span className="badge badge-danger">Delete</span>;
      case 'TRANSFER':
        return <span className="badge badge-info">Transfer</span>;
      case 'PAYMENT':
        return <span className="badge badge-active">Payment</span>;
      case 'WALLET_BUDGET':
        return <span className="badge badge-paid">Wallet Fund</span>;
      case 'WALLET_EXPENSE':
        return <span className="badge badge-danger">Wallet Expense</span>;
      case 'LOGIN':
        return <span className="badge badge-active">Login</span>;
      case 'LOGIN_FAILED':
        return <span className="badge badge-danger">Failed Login</span>;
      case 'ADJUST':
        return <span className="badge badge-neutral">Adjustment</span>;
      default:
        return <span className="badge badge-neutral">{action}</span>;
    }
  };

  const getModuleIcon = (module) => {
    switch (module) {
      case 'Sales':
        return <TrendingUp size={14} color="#10b981" />;
      case 'Purchases':
        return <ShoppingCart size={14} color="#f59e0b" />;
      case 'Stock':
        return <ArrowLeftRight size={14} color="#0284c7" />;
      case 'Payments':
        return <CheckCircle2 size={14} color="#10b981" />;
      case 'Wallet':
        return <Wallet size={14} color="#8b5cf6" />;
      case 'Users':
      case 'Auth':
        return <Key size={14} color="#ec4899" />;
      default:
        return <Database size={14} color="#64748b" />;
    }
  };

  return (
    <div>
      {/* Action Notification Message */}
      {actionMessage && (
        <div
          style={{
            padding: '12px 18px',
            marginBottom: '16px',
            borderRadius: '10px',
            background: actionMessage.type === 'success' ? '#ecfdf5' : '#fff1f2',
            border: `1px solid ${actionMessage.type === 'success' ? '#a7f3d0' : '#fecdd3'}`,
            color: actionMessage.type === 'success' ? '#065f46' : '#9f1239',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '13px',
            fontWeight: 600
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Check size={16} />
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="card-header" style={{ marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Activity size={22} color="#0284c7" /> Enterprise Activity Log & Audit Trail
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '3px', margin: 0 }}>
            Permanent record of financial, stock, wallet, and authentication events across all staff members.
          </p>
        </div>

        {/* Header Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div className="badge badge-active" style={{ fontSize: '12px', padding: '6px 12px' }}>
            Total Events: {logs.length}
          </div>

          {/* Clear by Date Button */}
          <button
            onClick={() => {
              if (dateFilter) {
                setTargetClearDate(dateFilter);
              } else {
                setTargetClearDate(getTodayDateString());
              }
              setActiveClearModal('date');
            }}
            disabled={logs.length === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#b45309',
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '8px',
              cursor: logs.length === 0 ? 'not-allowed' : 'pointer',
              opacity: logs.length === 0 ? 0.6 : 1
            }}
            title="Clear logs for a specific day"
          >
            <CalendarX size={14} /> Clear Day-wise
          </button>

          {/* Clear All Button */}
          <button
            onClick={() => setActiveClearModal('all')}
            disabled={logs.length === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#be123c',
              background: '#fff1f2',
              border: '1px solid #fecdd3',
              borderRadius: '8px',
              cursor: logs.length === 0 ? 'not-allowed' : 'pointer',
              opacity: logs.length === 0 ? 0.6 : 1
            }}
            title="Permanently clear all activity logs"
          >
            <Trash2 size={14} /> Clear All
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '14px 18px', marginBottom: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Row 1: Search & Module/Action dropdowns */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
            <Search size={16} color="#64748b" />
            <input
              type="text"
              className="form-input"
              style={{ border: 'none', background: 'transparent', padding: '6px' }}
              placeholder="Search by staff name, voucher ref, details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <select
              className="form-select"
              style={{ width: 'auto', fontSize: '13px', padding: '6px 12px' }}
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
            >
              <option value="all">All Modules</option>
              <option value="Sales">Sales</option>
              <option value="Purchases">Purchases</option>
              <option value="Stock">Stock & Godowns</option>
              <option value="Payments">Payments</option>
              <option value="Wallet">Wallet</option>
              <option value="Products">Products</option>
              <option value="Suppliers">Suppliers</option>
              <option value="Customers">Customers</option>
              <option value="Users">Staff Users</option>
              <option value="Auth">Security & Login</option>
            </select>

            <select
              className="form-select"
              style={{ width: 'auto', fontSize: '13px', padding: '6px 12px' }}
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <option value="all">All Action Types</option>
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
        </div>

        {/* Row 2: Date-wise Filter Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
          {/* Quick Timeframe Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>Timeframe:</span>
            {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'week', label: 'Last 7 Days' },
              { id: 'month', label: 'This Month' }
            ].map((d) => {
              const active = !dateFilter && quickDate === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => {
                    setDateFilter('');
                    setQuickDate(d.id);
                  }}
                  style={{
                    padding: '3px 10px',
                    fontSize: '11px',
                    fontWeight: active ? 700 : 500,
                    borderRadius: '6px',
                    border: 'none',
                    background: active ? '#0f172a' : '#f1f5f9',
                    color: active ? '#ffffff' : '#64748b',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {d.label}
                </button>
              );
            })}
          </div>

          {/* Date Picker Input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', padding: '4px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
            <Calendar size={13} color="#64748b" />
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Filter by Date:</span>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                if (e.target.value) setQuickDate('all');
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
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                title="Clear date filter"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0 2px', display: 'flex' }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Log Table */}
      <div className="card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', fontSize: '12px', color: '#64748b' }}>
          <span>
            Showing <strong>{filteredLogs.length}</strong> of {logs.length} activity records
            {dateFilter && (
              <span style={{ marginLeft: '8px', color: '#0284c7', fontWeight: 600 }}>
                • on {formatDate(dateFilter)}
              </span>
            )}
          </span>
          {(dateFilter || quickDate !== 'all' || moduleFilter !== 'all' || actionFilter !== 'all' || searchTerm) && (
            <button
              onClick={() => {
                setDateFilter('');
                setQuickDate('all');
                setModuleFilter('all');
                setActionFilter('all');
                setSearchTerm('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#0284c7',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="table-responsive" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Staff User</th>
                <th>Module</th>
                <th>Action</th>
                <th>Reference</th>
                <th>Event Details & Description</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b' }}>
                    <AlertCircle size={32} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>
                      No activity log events match your filters.
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                      {dateFilter ? `No events logged on ${formatDate(dateFilter)}.` : 'Try clearing your search or date filter.'}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => {
                  const dateObj = new Date(log.created_at);
                  const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                  const dateStr = formatDate(log.created_at.split('T')[0]);

                  return (
                    <tr key={log.id || idx}>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '12.5px' }}>{dateStr}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{timeStr}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '26px', height: '26px', borderRadius: '50%',
                            backgroundColor: '#e0f2fe', color: '#0284c7',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '11px', fontWeight: 700
                          }}>
                            {(log.user_name || 'A')[0].toUpperCase()}
                          </div>
                          <div>
                            <strong style={{ color: '#0f172a', fontSize: '12.5px' }}>{log.user_name || 'Admin'}</strong>
                            {log.user_email && (
                              <div style={{ fontSize: '10.5px', color: '#64748b' }}>{log.user_email}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 500 }}>
                          {getModuleIcon(log.module)}
                          <span>{log.module}</span>
                        </div>
                      </td>
                      <td>{getActionBadge(log.action)}</td>
                      <td>
                        <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
                          {log.record_ref || '—'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '12.5px', color: '#334155', maxWidth: '420px', lineHeight: 1.4 }}>
                          {log.details}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal: Clear All Logs */}
      {activeClearModal === 'all' && (
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
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '460px',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#dc2626'
                }}
              >
                <Trash2 size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Clear All Activity Logs?
                </h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>
                  Permanent, irreversible action
                </p>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.5, margin: '0 0 20px' }}>
              Are you sure you want to permanently delete all <strong>{logs.length}</strong> activity logs from the system? Past transactions, customers, suppliers, and stocks will remain unaffected, but the audit history will be wiped.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setActiveClearModal(null)}
                disabled={isProcessing}
                style={{
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                disabled={isProcessing}
                style={{
                  padding: '8px 18px',
                  fontSize: '12px',
                  fontWeight: 700,
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isProcessing ? 'wait' : 'pointer'
                }}
              >
                {isProcessing ? 'Clearing...' : 'Yes, Clear All Logs'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Clear Date-wise Logs */}
      {activeClearModal === 'date' && (
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
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '460px',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#d97706'
                }}
              >
                <CalendarX size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Clear Logs by Date / Day
                </h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>
                  Delete activity logs for a specific calendar day
                </p>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Select Day to Clear:
              </label>
              <input
                type="date"
                className="form-input"
                value={targetClearDate}
                onChange={(e) => setTargetClearDate(e.target.value)}
                style={{ width: '100%', fontSize: '13px', padding: '8px 12px' }}
              />
            </div>

            <div
              style={{
                padding: '10px 14px',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                marginBottom: '20px',
                fontSize: '12.5px',
                color: '#475569'
              }}
            >
              Found <strong>{targetDateLogsCount}</strong> activity event(s) on <strong>{formatDate(targetClearDate)}</strong>.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setActiveClearModal(null)}
                disabled={isProcessing}
                style={{
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleClearByDate}
                disabled={isProcessing || targetDateLogsCount === 0}
                style={{
                  padding: '8px 18px',
                  fontSize: '12px',
                  fontWeight: 700,
                  background: '#d97706',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isProcessing || targetDateLogsCount === 0 ? 'not-allowed' : 'pointer',
                  opacity: targetDateLogsCount === 0 ? 0.6 : 1
                }}
              >
                {isProcessing ? 'Clearing...' : `Clear ${targetDateLogsCount} Log(s)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
