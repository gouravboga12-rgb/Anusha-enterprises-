import React, { useState } from 'react';
import { X, PlusCircle, Calendar, IndianRupee, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { formatCurrency, formatDate, getTodayDateString } from '../../utils/formatters';

export const AdvanceModal = ({
  isOpen,
  onClose,
  employee,
  currentMonthYear,
  onSave
}) => {
  // Compute next month "YYYY-MM"
  const getNextMonth = (my) => {
    try {
      const [year, month] = my.split('-').map(Number);
      const d = new Date(year, month, 1);
      return d.toISOString().slice(0, 7);
    } catch {
      return my;
    }
  };

  const nextMonthYear = getNextMonth(currentMonthYear || getTodayDateString().slice(0, 7));

  const [targetMonth, setTargetMonth] = useState(currentMonthYear || getTodayDateString().slice(0, 7));
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [paymentMode, setPaymentMode] = useState(employee?.payment_mode_preference || 'Cash');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !employee) return null;

  const baseSalary = Number(employee.base_salary) || 0;
  const numAmount = Number(amount) || 0;

  const formatMonthTitle = (my) => {
    if (!my) return '';
    try {
      const [year, month] = my.split('-');
      const d = new Date(Number(year), Number(month) - 1, 1);
      return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    } catch {
      return my;
    }
  };

  const isNextMonth = targetMonth === nextMonthYear;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (numAmount <= 0) {
      setError('Please enter an advance amount greater than ₹0');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        amount: numAmount,
        date: date,
        payment_mode: paymentMode,
        notes: notes.trim()
      }, targetMonth);
      onClose();
    } catch (err) {
      setError(err?.message || 'Failed to record advance');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div
        className="modal-content"
        style={{
          maxWidth: '520px',
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div
          className="modal-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0'
          }}
        >
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
              Give Salary Advance
            </h3>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              {employee.name} • Base: {formatCurrency(baseSalary)}/mo
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: 0,
            overflow: 'hidden'
          }}
        >
          <div
            className="modal-body"
            style={{
              padding: '20px',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  color: '#dc2626',
                  fontSize: '12px'
                }}
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Target Month Selector (This Month vs Next Month) */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                Deduct This Advance From Which Month's Salary? *
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <button
                  type="button"
                  onClick={() => setTargetMonth(currentMonthYear)}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: targetMonth === currentMonthYear ? '2px solid #0284c7' : '1px solid #cbd5e1',
                    background: targetMonth === currentMonthYear ? '#f0f9ff' : '#ffffff',
                    color: targetMonth === currentMonthYear ? '#0284c7' : '#334155',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Current Month</div>
                  <div style={{ marginTop: '2px' }}>{formatMonthTitle(currentMonthYear)}</div>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetMonth(nextMonthYear)}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: targetMonth === nextMonthYear ? '2px solid #d97706' : '1px solid #cbd5e1',
                    background: targetMonth === nextMonthYear ? '#fffbeb' : '#ffffff',
                    color: targetMonth === nextMonthYear ? '#b45309' : '#334155',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Next Month (Advance)</div>
                  <div style={{ marginTop: '2px' }}>{formatMonthTitle(nextMonthYear)}</div>
                </button>
              </div>

              {/* Or custom month input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Or specific month:</span>
                <input
                  type="month"
                  value={targetMonth}
                  onChange={(e) => setTargetMonth(e.target.value)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                />
              </div>
            </div>

            {/* Advance Amount */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                Advance Amount (₹) *
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter advance amount given"
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #d97706',
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#0f172a'
                }}
              />
            </div>

            {/* Date Given & Payment Mode */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Date Advance Given *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Disbursement Mode *
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    fontWeight: 600
                  }}
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI / PhonePe / GPay">UPI / PhonePe / GPay</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
            </div>

            {/* Reason / Notes */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                Reason / Remarks (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Festival advance, emergency medical loan, personal advance"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px'
                }}
              />
            </div>

            {/* Automatic Deduction Explanation Box */}
            <div
              style={{
                background: isNextMonth ? '#fffbeb' : '#f0fdf4',
                border: isNextMonth ? '1.5px solid #fde68a' : '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '12px 14px',
                fontSize: '12px',
                color: isNextMonth ? '#92400e' : '#166534',
                lineHeight: '1.5'
              }}
            >
              <div style={{ fontWeight: 800, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>💡 Automatic Deduction Rule:</span>
              </div>
              <div>
                {numAmount > 0 ? (
                  <>
                    This <strong>{formatCurrency(numAmount)}</strong> advance will be deducted from <strong>{employee.name}</strong>'s salary for <strong>{formatMonthTitle(targetMonth)}</strong>.
                    When you settle <strong>{formatMonthTitle(targetMonth)}</strong>, their net payable salary will automatically be calculated as:
                    <div style={{ marginTop: '4px', fontWeight: 700, color: '#0f172a' }}>
                      Base {formatCurrency(baseSalary)} - Advance {formatCurrency(numAmount)} = {formatCurrency(Math.max(0, baseSalary - numAmount))} Net Due
                    </div>
                  </>
                ) : (
                  <>
                    Select the target month and enter an advance amount. It will automatically be deducted when settling that month's salary.
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div
            className="modal-footer"
            style={{
              padding: '14px 20px',
              borderTop: '1px solid #e2e8f0',
              background: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
              flexShrink: 0
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || numAmount <= 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: '#d97706',
                borderColor: '#d97706'
              }}
            >
              <PlusCircle size={16} />
              {isSubmitting ? 'Recording Advance...' : `Record Advance (${formatCurrency(numAmount)})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
