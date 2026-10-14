import React, { useState } from 'react';
import { X, CheckCircle2, IndianRupee, AlertCircle, Calendar, CreditCard, FileText } from 'lucide-react';
import { formatCurrency, formatDate, getTodayDateString } from '../../utils/formatters';

export const PayDueModal = ({
  isOpen,
  onClose,
  employee,
  settlement,
  monthYear,
  onSave
}) => {
  const pendingDue = Number(settlement?.pending_balance) || 0;
  const previousPaid = Number(settlement?.paid_amount) || 0;
  const baseSalary = Number(settlement?.base_salary) || Number(employee?.base_salary) || 0;
  const advanceAmount = Number(settlement?.advance_amount) || 0;
  const netPayable = Number(settlement?.net_payable) || Math.max(0, baseSalary - advanceAmount);

  const [payingAmount, setPayingAmount] = useState(pendingDue > 0 ? pendingDue : '');
  const [paymentDate, setPaymentDate] = useState(getTodayDateString());
  const [paymentMode, setPaymentMode] = useState(employee?.payment_mode_preference || 'Cash');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !employee) return null;

  const numPaying = Number(payingAmount) || 0;
  const newTotalPaid = previousPaid + numPaying;
  const remainingDue = Math.max(0, pendingDue - numPaying);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (numPaying <= 0) {
      setError('Please enter a valid payment amount greater than ₹0');
      return;
    }

    if (numPaying > pendingDue) {
      setError(`Payment amount cannot exceed remaining due of ${formatCurrency(pendingDue)}`);
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        amount: numPaying,
        date: paymentDate,
        payment_mode: paymentMode,
        reference_no: referenceNo.trim(),
        notes: notes.trim()
      });
      onClose();
    } catch (err) {
      setError(err?.message || 'Failed to record due payment');
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
              Clear Pending Salary Due
            </h3>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              {employee.name} • {formatMonthTitle(monthYear)}
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

            {/* Current Due Highlight Banner */}
            <div
              style={{
                background: '#fffbeb',
                border: '1.5px solid #fde68a',
                borderRadius: '10px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#92400e', textTransform: 'uppercase' }}>
                  Current Pending Due
                </div>
                <div style={{ fontSize: '22px', fontWeight: 900, color: '#b45309', marginTop: '2px' }}>
                  {formatCurrency(pendingDue)}
                </div>
              </div>

              <div style={{ textAlign: 'right', fontSize: '11px', color: '#78350f' }}>
                <div>Base: {formatCurrency(baseSalary)}</div>
                {advanceAmount > 0 && <div>Advance: -{formatCurrency(advanceAmount)}</div>}
                <div>Already Paid: {formatCurrency(previousPaid)}</div>
              </div>
            </div>

            {/* Quick Fill Buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setPayingAmount(pendingDue)}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: numPaying === pendingDue ? '1.5px solid #059669' : '1px solid #cbd5e1',
                  background: numPaying === pendingDue ? '#ecfdf5' : '#ffffff',
                  color: numPaying === pendingDue ? '#059669' : '#334155',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Full Due ({formatCurrency(pendingDue)})
              </button>
              {pendingDue > 1000 && (
                <button
                  type="button"
                  onClick={() => setPayingAmount(Math.round(pendingDue / 2))}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#334155',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Half Due ({formatCurrency(Math.round(pendingDue / 2))})
                </button>
              )}
            </div>

            {/* Paying Amount Input */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                Amount Paying Now (₹) *
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={payingAmount}
                onChange={(e) => setPayingAmount(e.target.value)}
                placeholder="Enter amount to pay"
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #0284c7',
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#0f172a'
                }}
              />
            </div>

            {/* Payment Date & Mode */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Payment Date *
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
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
                  Payment Mode *
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
                  <option value="Bank Transfer (NEFT/IMPS)">Bank Transfer (NEFT/IMPS)</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
            </div>

            {/* Reference & Notes */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                Transaction Ref / UTR / Note (Optional)
              </label>
              <input
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="e.g. UPI Ref # 123456789 or Cleared at office"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px'
                }}
              />
            </div>

            {/* Post-Payment Summary Box */}
            <div
              style={{
                background: remainingDue === 0 ? '#ecfdf5' : '#f8fafc',
                border: remainingDue === 0 ? '1.5px solid #a7f3d0' : '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px 14px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ color: '#64748b' }}>New Total Disbursed:</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{formatCurrency(newTotalPaid)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 800 }}>
                <span style={{ color: remainingDue === 0 ? '#059669' : '#dc2626' }}>
                  {remainingDue === 0 ? 'Status After Payment:' : 'Remaining Due After Payment:'}
                </span>
                <span style={{ color: remainingDue === 0 ? '#059669' : '#dc2626' }}>
                  {remainingDue === 0 ? 'Fully Settled (₹0 Due)' : formatCurrency(remainingDue)}
                </span>
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
              disabled={isSubmitting || numPaying <= 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: '#059669',
                borderColor: '#059669'
              }}
            >
              <CheckCircle2 size={16} />
              {isSubmitting ? 'Recording Payment...' : `Record Payment (${formatCurrency(numPaying)})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
