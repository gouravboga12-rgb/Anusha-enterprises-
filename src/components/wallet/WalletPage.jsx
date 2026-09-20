import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet, PlusCircle, ArrowUpRight, ArrowDownLeft,
  TrendingDown, TrendingUp, Calendar, Filter, Search, Tag, FileText, CheckCircle2,
  Edit2, Trash2, X
} from 'lucide-react';
import { formatCurrency, formatDate, getTodayDateString, getCurrentTimeString } from '../../utils/formatters';

export const WalletPage = ({ dataService, currentUser }) => {
  const [activeModal, setActiveModal] = useState(null);
  const [editingTxn, setEditingTxn] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [quickDate, setQuickDate] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

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
    : { balance: 0, totalBudget: 0, totalExpenses: 0, totalExpense: 0 };

  const transactions = dataService?.getWalletTransactions
    ? dataService.getWalletTransactions()
    : [];

  const filteredTransactions = useMemo(() => {
    let list = transactions;
    if (filterType !== 'all') list = list.filter((t) => t.type === filterType);
    if (filterCategory !== 'all') list = list.filter((t) => t.category === filterCategory);
    if (filterDate) {
      list = list.filter((t) => t.date === filterDate);
    } else if (quickDate === 'today') {
      const todayStr = getTodayDateString();
      list = list.filter((t) => t.date === todayStr);
    } else if (quickDate === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      list = list.filter((t) => t.date === yesterday.toISOString().slice(0, 10));
    } else if (quickDate === 'month') {
      const currentMonth = getTodayDateString().slice(0, 7);
      list = list.filter((t) => t.date && t.date.startsWith(currentMonth));
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
  }, [transactions, filterType, filterCategory, filterDate, quickDate, searchTerm]);

  const handleOpenBudgetModal = () => {
    setEditingTxn(null); setAmount(''); setReason('');
    setDate(getTodayDateString()); setTime(getCurrentTimeString());
    setNotes(''); setError(''); setActiveModal('budget');
  };

  const handleOpenExpenseModal = () => {
    setEditingTxn(null); setAmount(''); setCategory('Diesel'); setReason('');
    setDate(getTodayDateString()); setTime(getCurrentTimeString());
    setNotes(''); setError(''); setActiveModal('expense');
  };

  const handleOpenEdit = (txn) => {
    setEditingTxn(txn); setAmount(String(txn.amount));
    setCategory(txn.category || 'Diesel'); setReason(txn.reason || '');
    setDate(txn.date || getTodayDateString()); setTime(txn.time || getCurrentTimeString());
    setNotes(txn.notes || ''); setError(''); setActiveModal(txn.type);
  };

  const handleDelete = (txn) => {
    if (!dataService.canDelete(currentUser)) {
      alert('Permission denied: You do not have authority to delete transactions.');
      return;
    }
    if (window.confirm(`Delete wallet transaction?\n\nVoucher: ${txn.txn_no}\nReason: ${txn.reason}\nAmount: ₹${txn.amount}`)) {
      try { dataService.deleteWalletTransaction(txn.id, currentUser); }
      catch (err) { alert(err.message || 'Failed to delete wallet transaction'); }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) { setError('Please enter a valid amount greater than 0'); return; }
    if (!reason.trim()) { setError('Please provide a reason / description'); return; }
    try {
      if (editingTxn) {
        dataService.updateWalletTransaction(editingTxn.id,
          { amount: numAmount, category: activeModal === 'expense' ? category : 'Fund', reason: reason.trim(), date, time, notes: notes.trim() },
          currentUser
        );
        setEditingTxn(null); setActiveModal(null); return;
      }
      if (activeModal === 'budget') {
        dataService.addWalletBudget({ amount: numAmount, reason: reason.trim(), date, time, notes: notes.trim() }, currentUser);
      } else {
        if (numAmount > summary.balance) {
          if (!window.confirm(`Warning: Expense (₹${numAmount}) exceeds wallet balance (₹${summary.balance}). Proceed anyway?`)) return;
        }
        dataService.recordWalletExpense({ amount: numAmount, category, reason: reason.trim(), date, time, notes: notes.trim() }, currentUser);
      }
      setActiveModal(null);
    } catch (err) { setError(err.message || 'Failed to save wallet transaction'); }
  };

  const expenseCategories = [
    'Diesel / Fuel', 'Vehicle Maintenance', 'Office Expenses', 'Labour / Loading',
    'Travel / Transport', 'Refreshment / Meals', 'Godown Maintenance',
    'Utilities / Electricity', 'Other Expenses'
  ];

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Wallet size={20} color="#0284c7" /> Petty Cash &amp; Wallet
            </h1>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '3px', margin: '3px 0 0' }}>
              Track daily operating cash, fuel, vehicle maintenance &amp; misc. expenses.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={handleOpenBudgetModal} style={{ fontSize: '12px' }}>
              <ArrowDownLeft size={14} color="#16a34a" /> Add Funds
            </button>
            <button className="btn btn-primary" onClick={handleOpenExpenseModal} style={{ fontSize: '12px' }}>
              <ArrowUpRight size={14} /> Record Expense
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '16px' }}>
        {[
          { label: 'Available Balance', value: formatCurrency(summary.balance), color: summary.balance >= 0 ? '#0284c7' : '#ef4444', bg: '#eff6ff', icon: <Wallet size={16} color="#0284c7" /> },
          { label: 'Total Funds Added', value: formatCurrency(summary.totalBudget), color: '#10b981', bg: '#f0fdf4', icon: <TrendingUp size={16} color="#10b981" /> },
          { label: 'Total Expenses', value: formatCurrency(summary.totalExpenses ?? summary.totalExpense ?? 0), color: '#ef4444', bg: '#fef2f2', icon: <TrendingDown size={16} color="#ef4444" /> },
        ].map((s) => (
          <div key={s.label} className="card" style={{ padding: '14px', background: s.bg }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{s.label}</span>
              {s.icon}
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '12px 14px', marginBottom: '16px' }}>
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 10px', marginBottom: '10px' }}>
          <Search size={14} color="#94a3b8" />
          <input type="text" style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', flex: 1, color: '#0f172a' }}
            placeholder="Search by reason, voucher no..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          {searchTerm && <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}><X size={14} /></button>}
        </div>

        {/* Dropdowns */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
          <select className="form-select" style={{ flex: 1, minWidth: '130px', fontSize: '12px', padding: '6px 8px' }}
            value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">All Flow Types</option>
            <option value="budget">Funds Inward (+)</option>
            <option value="expense">Expenses Outward (-)</option>
          </select>
          <select className="form-select" style={{ flex: 1, minWidth: '130px', fontSize: '12px', padding: '6px 8px' }}
            value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="all">All Categories</option>
            {expenseCategories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Date quick chips */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b' }}>DATE:</span>
            {[{ id: 'all', label: 'All' }, { id: 'today', label: 'Today' }, { id: 'yesterday', label: 'Yesterday' }, { id: 'month', label: 'Month' }].map((d) => {
              const active = !filterDate && quickDate === d.id;
              return (
                <button key={d.id} onClick={() => { setFilterDate(''); setQuickDate(d.id); }}
                  style={{ padding: '3px 9px', fontSize: '11px', fontWeight: active ? 700 : 500, borderRadius: '6px', border: 'none', background: active ? '#0f172a' : '#f1f5f9', color: active ? '#fff' : '#64748b', cursor: 'pointer' }}>
                  {d.label}
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#f8fafc', padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
            <Calendar size={12} color="#64748b" />
            <input type="date" value={filterDate}
              onChange={(e) => { setFilterDate(e.target.value); if (e.target.value) setQuickDate('all'); }}
              style={{ border: 'none', background: 'transparent', fontSize: '11px', color: '#0f172a', fontWeight: 700, outline: 'none', cursor: 'pointer', maxWidth: '120px' }} />
            {filterDate && <button onClick={() => setFilterDate('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex' }}><X size={11} /></button>}
          </div>
        </div>
      </div>

      {/* Transactions — Mobile Cards + Desktop Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {filteredTransactions.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: '#64748b' }}>
            <Wallet size={40} color="#cbd5e1" style={{ marginBottom: '10px' }} />
            <div style={{ fontWeight: 600, fontSize: '14px' }}>No transactions found</div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Click "Add Funds" or "Record Expense" to begin.</div>
          </div>
        ) : (
          <>
            {/* Desktop Table — hidden on small screens */}
            <div className="table-responsive" style={{ border: 'none', display: 'none' }} id="wallet-table-desktop">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Voucher No</th>
                    <th>Date &amp; Time</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Reason</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th>Recorded By</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((txn) => {
                    const isBudget = txn.type === 'budget';
                    return (
                      <tr key={txn.id}>
                        <td style={{ fontWeight: 600, color: '#0284c7', fontSize: '12px' }}>{txn.txn_no}</td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{formatDate(txn.date)}</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{txn.time || '—'}</div>
                        </td>
                        <td>
                          {isBudget
                            ? <span className="badge badge-paid" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><ArrowDownLeft size={11} /> Fund Inflow</span>
                            : <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><ArrowUpRight size={11} /> Expense</span>}
                        </td>
                        <td><span className="badge badge-neutral" style={{ fontSize: '11px' }}>{txn.category || 'General'}</span></td>
                        <td>
                          <div style={{ fontWeight: 500, color: '#0f172a' }}>{txn.reason}</div>
                          {txn.notes && <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>{txn.notes}</div>}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>
                          <span style={{ color: isBudget ? '#10b981' : '#ef4444' }}>{isBudget ? '+' : '-'}{formatCurrency(txn.amount)}</span>
                        </td>
                        <td><span style={{ fontSize: '12px', color: '#64748b' }}>{txn.recorded_by || 'Admin'}</span></td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <button className="btn btn-secondary btn-sm" style={{ fontSize: '11px', padding: '3px 8px' }} onClick={() => handleOpenEdit(txn)}><Edit2 size={12} /> Edit</button>
                            {dataService?.canDelete && dataService.canDelete(currentUser) && (
                              <button className="btn btn-sm" style={{ fontSize: '11px', padding: '3px 8px', backgroundColor: '#ef4444', color: '#fff', border: '1px solid #dc2626', borderRadius: '6px', cursor: 'pointer' }} onClick={() => handleDelete(txn)}><Trash2 size={12} /></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredTransactions.map((txn, idx) => {
                const isBudget = txn.type === 'budget';
                return (
                  <div key={txn.id} style={{
                    padding: '14px 16px',
                    borderBottom: idx < filteredTransactions.length - 1 ? '1px solid #f1f5f9' : 'none',
                    display: 'flex', flexDirection: 'column', gap: '6px'
                  }}>
                    {/* Row 1: Type badge + Amount */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {isBudget
                          ? <span className="badge badge-paid" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}><ArrowDownLeft size={11} /> Fund Inflow</span>
                          : <span className="badge badge-danger" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}><ArrowUpRight size={11} /> Expense</span>}
                        <span className="badge badge-neutral" style={{ fontSize: '10px' }}>{txn.category || 'General'}</span>
                      </div>
                      <span style={{ fontSize: '16px', fontWeight: 800, color: isBudget ? '#10b981' : '#ef4444' }}>
                        {isBudget ? '+' : '-'}{formatCurrency(txn.amount)}
                      </span>
                    </div>
                    {/* Row 2: Reason */}
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{txn.reason}</div>
                    {txn.notes && <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>{txn.notes}</div>}
                    {/* Row 3: Meta + Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '11px', color: '#0284c7', fontWeight: 600 }}>{txn.txn_no}</span>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>{formatDate(txn.date)} {txn.time || ''}</span>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>by {txn.recorded_by || 'Admin'}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn btn-secondary btn-sm" style={{ fontSize: '11px', padding: '3px 8px' }} onClick={() => handleOpenEdit(txn)}><Edit2 size={11} /> Edit</button>
                        {dataService?.canDelete && dataService.canDelete(currentUser) && (
                          <button style={{ fontSize: '11px', padding: '3px 8px', backgroundColor: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer' }} onClick={() => handleDelete(txn)}><Trash2 size={11} /></button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {activeModal && (
        <div className="modal-backdrop">
          <div className="modal-card modal-content" style={{ maxWidth: '480px', width: '96%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                {editingTxn ? <><Edit2 size={17} color="#0284c7" /> Edit — {editingTxn.txn_no}</>
                  : activeModal === 'budget' ? <><ArrowDownLeft size={17} color="#16a34a" /> Add Operating Funds</>
                  : <><ArrowUpRight size={17} color="#ef4444" /> Record Expense</>}
              </h2>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '16px' }}>
              {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '8px 12px', borderRadius: '6px', marginBottom: '12px', fontSize: '12px' }}>{error}</div>}
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Amount (₹) *</label>
                <input type="number" className="form-input" min="1" step="0.01" required autoFocus placeholder="e.g. 5000"
                  value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              {activeModal === 'expense' && (
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label">Expense Category *</label>
                  <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                    {expenseCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">{activeModal === 'budget' ? 'Source / Fund Reason *' : 'Expense Purpose *'}</label>
                <input type="text" className="form-input" required
                  placeholder={activeModal === 'budget' ? 'e.g. Weekly petty cash from Shiva' : 'e.g. Diesel for delivery truck'}
                  value={reason} onChange={(e) => setReason(e.target.value)} />
              </div>
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Date</label>
                  <input type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Time</label>
                  <input type="text" className="form-input" value={time} onChange={(e) => setTime(e.target.value)} />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Notes / Bill Reference</label>
                <input type="text" className="form-input" placeholder="e.g. Petrol pump receipt #8812"
                  value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setActiveModal(null); setEditingTxn(null); setError(''); }}>Cancel</button>
                <button type="submit" className={activeModal === 'budget' ? 'btn btn-primary' : 'btn btn-danger'}>
                  {editingTxn ? 'Save Changes' : activeModal === 'budget' ? 'Add Funds' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
