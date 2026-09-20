import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet, PlusCircle, ArrowUpRight, ArrowDownLeft,
  TrendingDown, TrendingUp, Calendar, Filter, Search, Tag, FileText, CheckCircle2,
  Edit2, Trash2
} from 'lucide-react';
import { formatCurrency, formatDate, getTodayDateString, getCurrentTimeString } from '../../utils/formatters';

export const WalletPage = ({ dataService, currentUser }) => {
  const [activeModal, setActiveModal] = useState(null); // 'budget' | 'expense' | null
  const [editingTxn, setEditingTxn] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Diesel');
  const [reason, setReason] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [time, setTime] = useState(getCurrentTimeString());
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const [, setTick] = useState(0);
  useEffect(() => {
    if (!dataService) return;
    return dataService.subscribe(() => setTick((t) => t + 1));
  }, [dataService]);

  const summary = dataService?.getWalletSummary
    ? dataService.getWalletSummary()
    : { balance: 0, totalBudget: 0, totalExpenses: 0 };

  const transactions = dataService?.getWalletTransactions
    ? dataService.getWalletTransactions()
    : [];

  const filteredTransactions = useMemo(() => {
    let list = transactions;

    if (filterType !== 'all') {
      list = list.filter((t) => t.type === filterType);
    }

    if (filterCategory !== 'all') {
      list = list.filter((t) => t.category === filterCategory);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter((t) =>
        (t.reason && t.reason.toLowerCase().includes(q)) ||
        (t.txn_no && t.txn_no.toLowerCase().includes(q)) ||
        (t.category && t.category.toLowerCase().includes(q)) ||
        (t.notes && t.notes.toLowerCase().includes(q))
      );
    }

    return list;
  }, [transactions, filterType, filterCategory, searchTerm]);

  const handleOpenBudgetModal = () => {
    setEditingTxn(null);
    setAmount('');
    setReason('');
    setDate(getTodayDateString());
    setTime(getCurrentTimeString());
    setNotes('');
    setError('');
    setActiveModal('budget');
  };

  const handleOpenExpenseModal = () => {
    setEditingTxn(null);
    setAmount('');
    setCategory('Diesel');
    setReason('');
    setDate(getTodayDateString());
    setTime(getCurrentTimeString());
    setNotes('');
    setError('');
    setActiveModal('expense');
  };

  const handleOpenEdit = (txn) => {
    setEditingTxn(txn);
    setAmount(String(txn.amount));
    setCategory(txn.category || 'Diesel');
    setReason(txn.reason || '');
    setDate(txn.date || getTodayDateString());
    setTime(txn.time || getCurrentTimeString());
    setNotes(txn.notes || '');
    setError('');
    setActiveModal(txn.type);
  };

  const handleDelete = (txn) => {
    if (!dataService.canDelete(currentUser)) {
      alert('Permission denied: You do not have authority to delete transactions.');
      return;
    }

    if (window.confirm(`Are you sure you want to delete this wallet transaction?\n\nVoucher: ${txn.txn_no}\nReason: ${txn.reason}\nAmount: ₹${txn.amount}\n\nThis will immediately adjust your Available Wallet Balance.`)) {
      try {
        dataService.deleteWalletTransaction(txn.id, currentUser);
      } catch (err) {
        alert(err.message || 'Failed to delete wallet transaction');
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason / description');
      return;
    }

    try {
      if (editingTxn) {
        dataService.updateWalletTransaction(
          editingTxn.id,
          {
            amount: numAmount,
            category: activeModal === 'expense' ? category : 'Fund',
            reason: reason.trim(),
            date,
            time,
            notes: notes.trim()
          },
          currentUser
        );
        setEditingTxn(null);
        setActiveModal(null);
        return;
      }

      if (activeModal === 'budget') {
        dataService.addWalletBudget(
          { amount: numAmount, reason: reason.trim(), date, time, notes: notes.trim() },
          currentUser
        );
      } else {
        // Check if balance is sufficient
        if (numAmount > summary.balance) {
          if (!window.confirm(`Warning: Expense (₹${numAmount}) exceeds current wallet balance (₹${summary.balance}). Proceed anyway?`)) {
            return;
          }
        }
        dataService.recordWalletExpense(
          { amount: numAmount, category, reason: reason.trim(), date, time, notes: notes.trim() },
          currentUser
        );
      }

      setActiveModal(null);
    } catch (err) {
      setError(err.message || 'Failed to save wallet transaction');
    }
  };

  const expenseCategories = [
    'Diesel / Fuel',
    'Vehicle Maintenance',
    'Office Expenses',
    'Labour / Loading',
    'Travel / Transport',
    'Refreshment / Meals',
    'Godown Maintenance',
    'Utilities / Electricity',
    'Other Expenses'
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="card-header" style={{ marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wallet size={22} color="#0284c7" /> Petty Cash & Operations Wallet
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            Track daily operating cash, fuel expenses, vehicle maintenance, and miscellaneous business spending.
          </p>
        </div>

        <div className="header-actions-group" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={handleOpenBudgetModal}>
            <ArrowDownLeft size={15} color="#16a34a" /> Add Funds / Budget
          </button>
          <button className="btn btn-primary" onClick={handleOpenExpenseModal}>
            <ArrowUpRight size={15} /> Record Expense
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="stats-grid" style={{ marginBottom: '18px' }}>
        {/* Balance Card */}
        <div className="stat-card">
          <div className="stat-top">
            <span className="stat-label">Available Wallet Balance</span>
            <div className="stat-icon-wrap" style={{ backgroundColor: 'rgba(2, 132, 199, 0.1)', color: '#0284c7' }}>
              <Wallet size={18} />
            </div>
          </div>
          <div className="stat-value" style={{ color: summary.balance >= 0 ? '#0284c7' : '#ef4444' }}>
            {formatCurrency(summary.balance)}
          </div>
          <div className="stat-subtext" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b' }}>
            Ready for day-to-day operations
          </div>
        </div>

        {/* Total Budget Added */}
        <div className="stat-card">
          <div className="stat-top">
            <span className="stat-label">Total Funds Added</span>
            <div className="stat-icon-wrap" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="stat-value" style={{ color: '#10b981' }}>
            {formatCurrency(summary.totalBudget)}
          </div>
          <div className="stat-subtext" style={{ color: '#64748b' }}>
            Inflow from business capital
          </div>
        </div>

        {/* Total Expenses */}
        <div className="stat-card">
          <div className="stat-top">
            <span className="stat-label">Total Expenses Paid</span>
            <div className="stat-icon-wrap" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
              <TrendingDown size={18} />
            </div>
          </div>
          <div className="stat-value" style={{ color: '#ef4444' }}>
            {formatCurrency(summary.totalExpenses)}
          </div>
          <div className="stat-subtext" style={{ color: '#64748b' }}>
            Fuel, office, repairs, labor
          </div>
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
              placeholder="Search expenses by reason, voucher no..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <select
              className="form-select"
              style={{ width: 'auto', fontSize: '13px', padding: '6px 12px' }}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Flow Types</option>
              <option value="budget">Funds Inward (+)</option>
              <option value="expense">Expenses Outward (-)</option>
            </select>

            <select
              className="form-select"
              style={{ width: 'auto', fontSize: '13px', padding: '6px 12px' }}
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {expenseCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card" style={{ padding: '16px' }}>
        <div className="table-responsive" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Voucher No</th>
                <th>Date & Time</th>
                <th>Type</th>
                <th>Category</th>
                <th>Reason / Description</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th>Recorded By</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    No wallet transactions recorded yet. Click "Add Funds" or "Record Expense" to begin.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((txn) => {
                  const isBudget = txn.type === 'budget';
                  return (
                    <tr key={txn.id}>
                      <td style={{ fontWeight: 600, color: '#0284c7', fontSize: '12px' }}>
                        {txn.txn_no}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{formatDate(txn.date)}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{txn.time || '—'}</div>
                      </td>
                      <td>
                        {isBudget ? (
                          <span className="badge badge-paid" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <ArrowDownLeft size={11} /> Fund Inflow
                          </span>
                        ) : (
                          <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <ArrowUpRight size={11} /> Expense
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
                          {txn.category || 'General'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500, color: '#0f172a' }}>{txn.reason}</div>
                        {txn.notes && (
                          <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
                            {txn.notes}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>
                        <span style={{ color: isBudget ? '#10b981' : '#ef4444' }}>
                          {isBudget ? '+' : '-'}{formatCurrency(txn.amount)}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>{txn.recorded_by || 'Admin'}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '11px', padding: '3px 8px' }}
                            onClick={() => handleOpenEdit(txn)}
                            title="Edit Transaction"
                          >
                            <Edit2 size={12} /> Edit
                          </button>
                          {dataService?.canDelete && dataService.canDelete(currentUser) && (
                            <button
                              className="btn btn-danger btn-sm"
                              style={{
                                fontSize: '11px',
                                padding: '3px 8px',
                                backgroundColor: '#ef4444',
                                color: '#ffffff',
                                border: '1px solid #dc2626'
                              }}
                              onClick={() => handleDelete(txn)}
                              title="Delete Transaction"
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          )}
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

      {/* Add Funds / Record Expense Modal */}
      {activeModal && (
        <div className="modal-backdrop" onClick={() => setActiveModal(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: '480px', width: '92%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                {editingTxn ? (
                  <><Edit2 size={18} color="#0284c7" /> Edit Wallet Transaction — {editingTxn.txn_no}</>
                ) : activeModal === 'budget' ? (
                  <><ArrowDownLeft size={18} color="#16a34a" /> Add Operating Funds to Wallet</>
                ) : (
                  <><ArrowUpRight size={18} color="#ef4444" /> Record Operations Expense</>
                )}
              </h2>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '16px' }}>
              {error && (
                <div style={{
                  background: '#fef2f2', border: '1px solid #fecaca',
                  color: '#b91c1c', padding: '8px 12px', borderRadius: '6px',
                  marginBottom: '14px', fontSize: '12px'
                }}>
                  {error}
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Amount (₹) *</label>
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  step="0.01"
                  required
                  autoFocus
                  placeholder="e.g. 5000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              {activeModal === 'expense' && (
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label">Expense Category *</label>
                  <select
                    className="form-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {expenseCategories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">
                  {activeModal === 'budget' ? 'Source / Fund Reason *' : 'Expense Purpose / Description *'}
                </label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder={activeModal === 'budget' ? 'e.g. Weekly petty cash fund from Shiva' : 'e.g. Diesel for delivery truck TS 08 AB 1234'}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Time</label>
                  <input
                    type="text"
                    className="form-input"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Additional Notes / Bill Reference</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Petrol pump receipt #8812"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActiveModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={activeModal === 'budget' ? 'btn btn-primary' : 'btn btn-danger'}
                >
                  {editingTxn ? 'Save Changes' : activeModal === 'budget' ? 'Add Funds to Wallet' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
