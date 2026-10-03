import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { PlusCircle, Edit, Trash2, Calendar, Receipt, CreditCard, Clock, User, FileText, Check, X } from 'lucide-react';

export const BillDetailsModal = ({
  isOpen,
  onClose,
  sale,
  dataService,
  currentUser,
  onAddPayment,
  onEditBill,
  onViewInvoice
}) => {
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editMode, setEditMode] = useState('Cash');
  const [editNotes, setEditNotes] = useState('');
  const [editError, setEditError] = useState('');

  if (!sale) return null;

  const customer = dataService.getCustomerById(sale.customer_id);
  const payments = dataService.getSalePayments(sale.id);

  // Recalculate live to be 100% accurate
  const totalAmount = sale.total_amount || 0;
  const totalPaid = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const pendingAmount = Math.max(0, totalAmount - totalPaid);
  const isPaid = pendingAmount === 0;

  const handleStartEdit = (pay) => {
    setEditingPaymentId(pay.id);
    setEditAmount(String(pay.amount));
    setEditMode(pay.payment_mode || 'Cash');
    setEditNotes(pay.notes || '');
    setEditError('');
  };

  const handleCancelEdit = () => {
    setEditingPaymentId(null);
    setEditError('');
  };

  const handleSavePaymentEdit = (payId) => {
    const num = Number(editAmount);
    if (!num || num <= 0) {
      setEditError('Amount must be greater than 0');
      return;
    }
    try {
      dataService.updatePayment(payId, {
        amount: num,
        payment_mode: editMode,
        notes: editNotes
      }, currentUser);
      setEditingPaymentId(null);
      setEditError('');
    } catch (err) {
      setEditError(err.message || 'Failed to update payment');
    }
  };

  const handleDeletePayment = (pay) => {
    if (window.confirm(`Delete payment of ${formatCurrency(pay.amount)} (${pay.receipt_no})?\n\nThis will automatically restore ₹${pay.amount.toLocaleString()} to the bill's pending balance.`)) {
      try {
        dataService.deletePayment(pay.id, currentUser);
      } catch (err) {
        alert(err.message || 'Failed to delete payment');
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Customer Bill — ${sale.invoice_no}`}
      maxWidth="780px"
    >
      <div>
        {/* Top Summary Banner */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '12px',
          background: '#f8fafc',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          marginBottom: '20px'
        }}>
          <div>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>ORIGINAL BILL AMOUNT</span>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
              {formatCurrency(totalAmount)}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              {formatDate(sale.date)} • {sale.time}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>TOTAL PAID SO FAR</span>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>
              {formatCurrency(totalPaid)}
            </div>
            <div style={{ fontSize: '11px', color: '#10b981', marginTop: '2px' }}>
              {payments.length} payment {payments.length === 1 ? 'record' : 'records'}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>PENDING BALANCE</span>
            <div style={{
              fontSize: '18px',
              fontWeight: 800,
              color: isPaid ? '#10b981' : '#e11d48',
              marginTop: '2px'
            }}>
              {formatCurrency(pendingAmount)}
            </div>
            <div>
              <span className={`badge ${
                isPaid ? 'badge-paid' : totalPaid > 0 ? 'badge-partial' : 'badge-pending'
              }`} style={{ marginTop: '2px', fontSize: '10px' }}>
                {isPaid ? 'Paid in Full' : totalPaid > 0 ? 'Partially Paid' : 'Pending Payment'}
              </span>
            </div>
          </div>
        </div>

        {/* Customer & Bill Meta */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Billed To:</span>
            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '15px' }}>
              {customer ? customer.name : 'Unknown Customer'}
              {customer?.customer_id && (
                <span className="badge badge-active" style={{ marginLeft: '8px', fontSize: '11px' }}>
                  {customer.customer_id}
                </span>
              )}
            </div>
            {customer?.mobile && (
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Mobile: {customer.mobile} {customer.area ? `• Area: ${customer.area}` : ''}
              </div>
            )}
            {sale?.vehicle_no && (
              <div style={{ fontSize: '12px', color: '#0f172a', fontWeight: 700, marginTop: '3px' }}>
                🚗 Vehicle: {sale.vehicle_no}
              </div>
            )}
            {sale?.notes && (
              <div style={{ fontSize: '12px', color: '#334155', fontStyle: 'italic', marginTop: '2px' }}>
                📝 Note: {sale.notes}
              </div>
            )}
          </div>

          {/* Dedicated Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary btn-sm"
              style={{ color: '#0284c7', borderColor: '#bae6fd', background: '#f0f9ff', fontWeight: 600 }}
              onClick={() => {
                if (onViewInvoice) onViewInvoice(sale);
              }}
              title="View and Print Official GST/Sales Invoice"
            >
              <FileText size={14} /> View Invoice
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                onClose();
                if (onEditBill) onEditBill(sale);
              }}
            >
              <Edit size={14} /> Edit Bill Details
            </button>
            {!isPaid && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  onClose();
                  if (onAddPayment) onAddPayment(sale);
                }}
              >
                <PlusCircle size={14} /> Add Payment
              </button>
            )}
          </div>
        </div>

        {/* Section 1: Items Billed */}
        <div style={{ marginBottom: '22px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Billed Products
          </h4>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th style={{ textAlign: 'right' }}>Quantity & Unit</th>
                  <th style={{ textAlign: 'right' }}>Rate (₹)</th>
                  <th style={{ textAlign: 'right' }}>Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{item.product_name}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{item.quantity} {item.unit || 'Units'}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(item.selling_price)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(item.total || (item.quantity * item.selling_price))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {sale.notes && (
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', fontStyle: 'italic' }}>
              Note: {sale.notes}
            </div>
          )}

          {/* GST Financial Breakdown Box (Clarifying 18% GST math) */}
          {(() => {
            const subtotal = sale.items && sale.items.length > 0
              ? sale.items.reduce((acc, i) => acc + (Number(i.quantity) || 0) * (Number(i.selling_price) || 0), 0)
              : (Number(sale.subtotal) || Math.round((totalAmount / 1.18) * 100) / 100);
            const cgst = sale.cgst_amount !== undefined && sale.cgst_amount !== null
              ? Number(sale.cgst_amount)
              : Math.round(subtotal * 0.09 * 100) / 100;
            const sgst = sale.sgst_amount !== undefined && sale.sgst_amount !== null
              ? Number(sale.sgst_amount)
              : Math.round(subtotal * 0.09 * 100) / 100;
            const billTotal = totalAmount || Math.round((subtotal + cgst + sgst) * 100) / 100;

            return (
              <div style={{
                background: '#f8fafc',
                border: '1.5px solid #cbd5e1',
                borderRadius: '8px',
                padding: '12px 16px',
                marginTop: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: '#475569' }}>
                  <span>Subtotal (Taxable Amount):</span>
                  <strong style={{ color: '#0f172a' }}>{formatCurrency(subtotal)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: '#475569' }}>
                  <span>Central GST (CGST 9%):</span>
                  <strong style={{ color: '#0284c7' }}>+{formatCurrency(cgst)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: '#475569' }}>
                  <span>State GST (SGST 9%):</span>
                  <strong style={{ color: '#0284c7' }}>+{formatCurrency(sgst)}</strong>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '14px',
                  fontWeight: 800,
                  color: '#0f172a',
                  borderTop: '1.5px dashed #cbd5e1',
                  paddingTop: '6px',
                  marginTop: '2px'
                }}>
                  <span>Total Bill Amount (Incl. 18% GST):</span>
                  <span style={{ color: '#0284c7' }}>{formatCurrency(billTotal)}</span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Section 2: Non-Destructive Payment History */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#475569', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Payment History ({payments.length})
            </h4>
            {!isPaid && (
              <button
                className="btn btn-secondary btn-sm"
                style={{ padding: '4px 10px', fontSize: '12px' }}
                onClick={() => {
                  onClose();
                  if (onAddPayment) onAddPayment(sale);
                }}
              >
                <PlusCircle size={13} /> Add Another Payment
              </button>
            )}
          </div>

          {payments.length === 0 ? (
            <div style={{
              background: '#fffbeb',
              border: '1px solid #fef3c7',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center',
              color: '#b45309',
              fontSize: '13px'
            }}>
              No payments have been recorded for this bill yet. Full balance of {formatCurrency(totalAmount)} is pending.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {payments.map((pay, pIdx) => {
                const isThisEditing = editingPaymentId === pay.id;

                if (isThisEditing) {
                  return (
                    <div
                      key={pay.id}
                      style={{
                        background: '#f0f9ff',
                        border: '1.5px solid #0284c7',
                        borderRadius: '8px',
                        padding: '12px 14px'
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a', marginBottom: '8px' }}>
                        Edit Payment — {pay.receipt_no}
                      </div>
                      {editError && (
                        <div style={{ color: '#dc2626', fontSize: '12px', marginBottom: '8px' }}>
                          {editError}
                        </div>
                      )}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginBottom: '8px' }}>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>Amount (₹)</label>
                          <input
                            type="number"
                            min="0.01"
                            step="any"
                            className="form-input"
                            style={{ fontSize: '13px', padding: '6px' }}
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>Payment Mode</label>
                          <select
                            className="form-select"
                            style={{ fontSize: '13px', padding: '6px' }}
                            value={editMode}
                            onChange={(e) => setEditMode(e.target.value)}
                          >
                            <option value="Cash">Cash</option>
                            <option value="UPI">UPI</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Cheque">Cheque</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>Notes</label>
                          <input
                            type="text"
                            className="form-input"
                            style={{ fontSize: '13px', padding: '6px' }}
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            placeholder="Optional note"
                          />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 10px' }}
                          onClick={handleCancelEdit}
                        >
                          <X size={12} /> Cancel
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          style={{ padding: '4px 12px' }}
                          onClick={() => handleSavePaymentEdit(pay.id)}
                        >
                          <Check size={12} /> Save
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={pay.id}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: '#ecfdf5',
                        color: '#059669',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '12px'
                      }}>
                        #{pIdx + 1}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <strong style={{ fontSize: '13px', color: '#0f172a' }}>{pay.receipt_no}</strong>
                          <span className="badge badge-paid" style={{ fontSize: '10px' }}>
                            {pay.payment_mode}
                          </span>
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                          {formatDate(pay.date)} at {pay.time}
                          {pay.reference_no && ` • Ref: ${pay.reference_no}`}
                          {pay.notes && ` • ${pay.notes}`}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#10b981' }}>
                          +{formatCurrency(pay.amount)}
                        </div>
                        <span style={{ fontSize: '10px', color: '#64748b' }}>Received</span>
                      </div>

                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 6px', color: '#0284c7', borderColor: '#bae6fd' }}
                          onClick={() => handleStartEdit(pay)}
                          title="Edit this payment record"
                        >
                          <Edit size={13} />
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          style={{ padding: '4px 6px', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' }}
                          onClick={() => handleDeletePayment(pay)}
                          title="Delete this payment record"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '14px', borderTop: '1px solid #e2e8f0' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
