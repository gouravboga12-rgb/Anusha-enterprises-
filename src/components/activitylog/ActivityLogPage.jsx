import React, { useState, useMemo } from 'react';
import {
  Activity, Search, Filter, Calendar, ShieldCheck,
  User, CheckCircle2, AlertTriangle, ArrowLeftRight,
  ShoppingCart, TrendingUp, RefreshCw, Key, Wallet, Database
} from 'lucide-react';
import { formatDate } from '../../utils/formatters';

export const ActivityLogPage = ({ dataService }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');

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
  }, [logs, moduleFilter, actionFilter, searchTerm]);

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
      {/* Header */}
      <div className="card-header" style={{ marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={22} color="#0284c7" /> Enterprise Activity Log & Audit Trail
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            Permanent, tamper-proof record of every financial, stock, wallet, and authentication event across all staff members.
          </p>
        </div>
        <div className="badge badge-active" style={{ fontSize: '12px', padding: '6px 12px' }}>
          Total Events: {logs.length}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '14px 18px', marginBottom: '18px' }}>
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
      </div>

      {/* Log Table */}
      <div className="card" style={{ padding: '16px' }}>
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
                  <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    No activity log events match your filters.
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
    </div>
  );
};
