import React, { useState, useEffect } from 'react';
import { X, IndianRupee, Calendar, CreditCard, FileText, CheckCircle2, AlertCircle, ArrowDownRight, Clock } from 'lucide-react';
import { formatCurrency, getTodayDateString, getCurrentTimeString } from '../../utils/formatters';

export const SalarySettlementModal = ({
  isOpen,
  onClose,
  onSave,
  employee,
  monthYear, // e.g. "2026-10"
  existingSettlement
}) => {
  const [baseSalary, setBaseSalary] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('0');
  const [advanceDate, setAdvanceDate] = useState('');
  const [advanceNotes, setAdvanceNotes] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(getTodayDateString());
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (existingSettlement) {
      setBaseSalary(String(existingSettlement.base_salary || employee?.base_salary || 0));
      setAdvanceAmount(String(existingSettlement.advance_amount || 0));
      setAdvanceDate(existingSettlement.advance_date || '');
      setAdvanceNotes(existingSettlement.advance_notes || '');
      setPaidAmount(String(existingSettlement.paid_amount || 0));
      setPaymentDate(existingSettlement.payment_date || getTodayDateString());
      setPaymentMode(existingSettlement.payment_mode || employee?.payment_mode_preference || 'Cash');
      setReferenceNo(existingSettlement.reference_no || '');
      setNotes(existingSettlement.notes || '');
    } else if (employee) {
      const defaultSalary = employee.base_salary || 0;
      setBaseSalary(String(defaultSalary));
      setAdvanceAmount('0');
      setAdvanceDate('');
      setAdvanceNotes('');
      setPaidAmount(String(defaultSalary)); // by default set to full base salary
      setPaymentDate(getTodayDateString());
      setPaymentMode(employee.payment_mode_preference || 'Cash');
      setReferenceNo('');
      setNotes('');
    }
    setError('');
  }, [isOpen, existingSettlement, employee]);

  if (!isOpen || !employee) return null;

  const numBaseSalary = Math.max(0, Number(baseSalary) || 0);
  const numAdvance = Math.max(0, Number(advanceAmount) || 0);
  const netPayable = Math.max(0, numBaseSalary - numAdvance);
  const numPaid = Math.max(0, Number(paidAmount) || 0);
  const pendingBalance = Math.max(0, netPayable - numPaid);

  const getStatus = () => {
    if (pendingBalance === 0 && (numPaid > 0 || (numAdvance >= numBaseSalary && numAdvance > 0))) {
      return { label: 'Paid in Full', color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0' };
    }
    if (numPaid > 0 || numAdvance > 0) {
      return { label: `Partially Paid (₹${formatCurrency(pendingBalance)} Due)`, color: '#d97706', bg: '#fffbeb', border: '#fde68a' };
    }
    return { label: `Pending (₹${formatCurrency(numBaseSalary)} Due)`, color: '#dc2626', bg: '#fef2f2', border: '#fecaca' };
  };

  const statusObj = getStatus();

  // Helper to format month header (e.g. "2026-10" -> "October 2026")
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

  const handleSetFullNet = () => {
    setPaidAmount(String(netPayable));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (numBaseSalary <= 0) {
      setError('Base monthly salary must be greater than 0.');
      return;
    }
    if (numAdvance > numBaseSalary) {
      if (!window.confirm(`Advance amount (₹${formatCurrency(numAdvance)}) is greater than the base monthly salary (₹${formatCurrency(numBaseSalary)}). Do you wish to continue?`)) {
        return;
      }
    }

    try {
      setIsSubmitting(true);
      await onSave({
        ...(existingSettlement ? { id: existingSettlement.id } : {}),
        employee_id: employee.id,
        employee_name: employee.name,
        month_year: monthYear,
        base_salary: numBaseSalary,
        advance_amount: numAdvance,
        advance_date: numAdvance > 0 ? (advanceDate || paymentDate) : null,
        advance_notes: advanceNotes.trim(),
        paid_amount: numPaid,
        net_payable: netPayable,
        pending_balance: pendingBalance,
        payment_date: paymentDate,
        payment_mode: paymentMode,
        reference_no: referenceNo.trim(),
        notes: notes.trim()
      });
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      setIsSubmitting(false);
      setError(err.message || 'Failed to save salary settlement.');
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '580px', width: '95%' }}>
        <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
              {existingSettlement ? 'Update Monthly Salary Settlement' : 'Monthly Salary Settlement'}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0284c7' }}>{employee.name}</span>
              <span style={{ color: '#94a3b8' }}>•</span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>{employee.designation}</span>
              <span style={{ color: '#94a3b8' }}>•</span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', background: '#f1f5f9', padding: '1px 8px', borderRadius: '4px' }}>
                {formatMonthTitle(monthYear)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ padding: '20px', maxHeight: '75vh', overflowY: 'auto' }}>
            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            {/* Live Calculation Summary Banner */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '14px 16px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Calculation Breakdown</span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: statusObj.color,
                  background: statusObj.bg,
                  border: `1px solid ${statusObj.border}`,
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}>
                  {statusObj.label}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', textAlign: 'center' }}>
                <div style={{ background: '#ffffff', padding: '8px 4px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Base Salary</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>₹{formatCurrency(numBaseSalary)}</div>
                </div>
                <div style={{ background: '#ffffff', padding: '8px 4px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#d97706' }}>- Advance</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#d97706', marginTop: '2px' }}>₹{formatCurrency(numAdvance)}</div>
                </div>
                <div style={{ background: '#eff6ff', padding: '8px 4px', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                  <div style={{ fontSize: '11px', color: '#0284c7' }}>= Net Due</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#0284c7', marginTop: '2px' }}>₹{formatCurrency(netPayable)}</div>
                </div>
                <div style={{ background: '#ecfdf5', padding: '8px 4px', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
                  <div style={{ fontSize: '11px', color: '#059669' }}>Disbursed</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#059669', marginTop: '2px' }}>₹{formatCurrency(numPaid)}</div>
                </div>
              </div>
            </div>

            {/* Base Salary Field */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                Monthly Base Salary (₹)
              </label>
              <div style={{ position: 'relative' }}>
                <IndianRupee size={16} color="#0284c7" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  value={baseSalary}
                  onChange={(e) => setBaseSalary(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}
                />
              </div>
              <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px', display: 'block' }}>
                Defaults to employee profile base salary (₹{formatCurrency(employee.base_salary)})
              </span>
            </div>

            {/* Advance Amount & Advance Details Section */}
            <div style={{
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '8px',
              padding: '14px',
              marginBottom: '18px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#92400e' }}>
                  Advance Amount Taken in Advance (₹)
                </label>
                {numAdvance > 0 && (
                  <button
                    type="button"
                    onClick={() => { setAdvanceAmount('0'); setAdvanceDate(''); setAdvanceNotes(''); }}
                    style={{ background: 'none', border: 'none', color: '#b45309', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Clear Advance
                  </button>
                )}
              </div>

              <div style={{ position: 'relative', marginBottom: '10px' }}>
                <IndianRupee size={16} color="#d97706" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: '8px', border: '1px solid #fcd34d', fontSize: '14px', fontWeight: 700, color: '#92400e', background: '#ffffff' }}
                />
              </div>

              {numAdvance > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#92400e', marginBottom: '4px' }}>
                      Advance Given Date
                    </label>
                    <input
                      type="date"
                      value={advanceDate}
                      onChange={(e) => setAdvanceDate(e.target.value)}
                      style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #fcd34d', fontSize: '12px', background: '#ffffff' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#92400e', marginBottom: '4px' }}>
                      Advance Reason / Purpose
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Festival advance, Medical"
                      value={advanceNotes}
                      onChange={(e) => setAdvanceNotes(e.target.value)}
                      style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #fcd34d', fontSize: '12px', background: '#ffffff' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Salary Payment Amount */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                  Amount Disbursed / Paying Today (₹) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                {numPaid !== netPayable && (
                  <button
                    type="button"
                    onClick={handleSetFullNet}
                    style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '11px', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Pay Full Net Due (₹{formatCurrency(netPayable)})
                  </button>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <IndianRupee size={16} color="#16a34a" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: '8px', border: '1px solid #86efac', fontSize: '15px', fontWeight: 800, color: '#15803d', background: '#f0fdf4' }}
                />
              </div>
            </div>

            {/* Settlement Date & Mode */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Disbursement Date
                </label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Payment Mode
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff' }}
                >
                  <option value="Cash">Cash</option>
                  <option value="PhonePe / UPI">PhonePe / GPay (UPI)</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
            </div>

            {/* Reference No / UTR */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                Transaction Ref / UTR / Cheque No (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. UPI/20261014/9912 or Bank UTR Ref"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>

            {/* Remarks / Notes */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                Settlement Notes / Remarks
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Cleared salary in full. Advance adjusted."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', resize: 'vertical' }}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', padding: '16px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
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
              disabled={isSubmitting}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <CheckCircle2 size={16} />
              {isSubmitting ? 'Saving...' : 'Save & Record Salary'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
