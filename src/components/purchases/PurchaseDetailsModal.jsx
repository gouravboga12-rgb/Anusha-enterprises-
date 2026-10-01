import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { PlusCircle, Edit, Edit2, Trash2, FileText, Check, X } from 'lucide-react';

export const PurchaseDetailsModal = ({
  isOpen,
  onClose,
  purchase,
  dataService,
  currentUser,
  onAddPayment,
  onEditPurchase,
  onViewInvoice
}) => {
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editMode, setEditMode] = useState('Cash');
  const [editNotes, setEditNotes] = useState('');
  const [editError, setEditError] = useState('');

  if (!purchase) return null;

  const supplier = dataService.getSupplierById(purchase.supplier_id);
  const payments = dataService.getPurchasePayments(purchase.id);

  const totalAmount = purchase.total_amount || 0;
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
    if (window.confirm(`Delete payment voucher of ${formatCurrency(pay.amount)} (${pay.receipt_no})?\n\nThis will restore ₹${pay.amount.toLocaleString()} to our pending payable for this purchase.`)) {
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
      title={`Supplier Purchase — ${purchase.purchase_no}`}
      maxWidth="780px"
    >
      <div>
        {/* Top Financial Summary Banner */}
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
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>PURCHASE INWARD TOTAL</span>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
              {formatCurrency(totalAmount)}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              {formatDate(purchase.date)} • {purchase.time}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>PAID TO VENDOR</span>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>
              {formatCurrency(totalPaid)}
            </div>
            <div style={{ fontSize: '11px', color: '#10b981', marginTop: '2px' }}>
              {payments.length} payment {payments.length === 1 ? 'record' : 'records'}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>PENDING PAYABLE</span>
            <div style={{
              fontSize: '18px',
              fontWeight: 800,
              color: isPaid ? '#10b981' : '#d97706',
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

        {/* Supplier & Header Meta */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Supplier / Vendor:</span>
            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '15px' }}>
              {supplier ? supplier.company_name : 'Unknown Supplier'}
              {supplier?.supplier_id && (
                <span className="badge badge-active" style={{ marginLeft: '8px', fontSize: '11px' }}>
                  {supplier.supplier_id}
                </span>
              )}
            </div>
            {supplier?.mobile && (
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Mobile: {supplier.mobile} {supplier.area ? `• Hub: ${supplier.area}` : ''}
              </div>
            )}
            {purchase?.vehicle_no && (
              <div style={{ fontSize: '12px', color: '#0284c7', fontWeight: 600, marginTop: '2px' }}>
                🚗 Vehicle / Inward Transport: {purchase.vehicle_no}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                onClose();
                if (onEditPurchase) onEditPurchase(purchase);
              }}
            >
              <Edit size={14} /> Edit Purchase
            </button>
            {!isPaid && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  onClose();
                  if (onAddPayment) onAddPayment(purchase);
                }}
              >
                <PlusCircle size={14} /> Add Payment
              </button>
            )}
          </div>
        </div>

        {/* Purchased Products Table */}
        <div style={{ marginBottom: '22px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Purchased Products
          </h4>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th style={{ textAlign: 'right' }}>Quantity & Unit</th>
                  <th style={{ textAlign: 'right' }}>Cost Price (₹)</th>
                  <th style={{ textAlign: 'right' }}>Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                {purchase.items.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{item.product_name}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{item.quantity} {item.unit || 'Units'}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(item.purchase_price)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(item.total || (item.quantity * item.purchase_price))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {purchase.notes && (
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', fontStyle: 'italic' }}>
              Note: {purchase.notes}
            </div>
          )}
          {/* GST Financial Breakdown Box (Clarifying 18% GST math) */}
          {(() => {
            const subtotal = purchase.items && purchase.items.length > 0
              ? purchase.items.reduce((acc, i) => acc + (Number(i.quantity) || 0) * (Number(i.purchase_price) || 0), 0)
              : (Number(purchase.subtotal) || Math.round((totalAmount / 1.18) * 100) / 100);
            const cgst = purchase.cgst_amount !== undefined && purchase.cgst_amount !== null
              ? Number(purchase.cgst_amount)
              : Math.round(subtotal * 0.09 * 100) / 100;
            const sgst = purchase.sgst_amount !== undefined && purchase.sgst_amount !== null
              ? Number(purchase.sgst_amount)
              : Math.round(subtotal * 0.09 * 100) / 100;
            const purchaseTotal = totalAmount || Math.round((subtotal + cgst + sgst) * 100) / 100;

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
                  <span style={{ fontWeight: 600, color: '#334155' }}>+{formatCurrency(cgst)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: '#475569' }}>
                  <span>State GST (SGST 9%):</span>
                  <span style={{ fontWeight: 600, color: '#334155' }}>+{formatCurrency(sgst)}</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '14px',
                  fontWeight: 800,
                  color: '#0f172a',
                  borderTop: '1px dashed #cbd5e1',
                  paddingTop: '6px',
                  marginTop: '2px'
                }}>
                  <span>Total Purchase Value (Inc. 18% GST):</span>
                  <span style={{ color: '#0284c7' }}>{formatCurrency(purchaseTotal)}</span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Payment History Section */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#475569', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Payments Made to Supplier ({payments.length})
            </h4>
            {!isPaid && (
              <button
                className="btn btn-secondary btn-sm"
                style={{ padding: '4px 10px', fontSize: '12px' }}
                onClick={() => {
                  onClose();
                  if (onAddPayment) onAddPayment(purchase);
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
              No payment vouchers recorded for this purchase yet. Full balance of {formatCurrency(totalAmount)} is payable.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {payments.map((pay, pIdx) => {
                const isEditingThis = editingPaymentId === pay.id;

                if (isEditingThis) {
                  return (
                    <div
                      key={pay.id}
                      style={{
                        background: '#f8fafc',
                        border: '2px solid #3b82f6',
                        borderRadius: '8px',
                        padding: '12px 14px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '13px', color: '#1e3a8a' }}>
                          Edit Payment Voucher {pay.receipt_no}
                        </span>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          {formatDate(pay.date)}
                        </span>
                      </div>

                      {editError && (
                        <div style={{ color: '#dc2626', fontSize: '12px', marginBottom: '8px', fontWeight: 600 }}>
                          {editError}
                        </div>
                      )}

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '3px' }}>
                            Amount (₹)
                          </label>
                          <input
                            type="number"
                            min="1"
                            step="any"
                            className="form-input"
                            style={{ padding: '6px 8px', fontSize: '13px' }}
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '3px' }}>
                            Payment Mode
                          </label>
                          <select
                            className="form-select"
                            style={{ padding: '6px 8px', fontSize: '13px' }}
                            value={editMode}
                            onChange={(e) => setEditMode(e.target.value)}
                          >
                            <option value="Cash">Cash</option>
                            <option value="UPI">UPI</option>
                            <option value="Bank Transfer">Bank Transfer / NEFT</option>
                            <option value="Cheque">Cheque</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ marginBottom: '8px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '3px' }}>
                          Notes / Reference
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          style={{ padding: '6px 8px', fontSize: '12px' }}
                          placeholder="Optional notes or transaction ref..."
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 10px' }}
                          onClick={handleCancelEdit}
                        >
                          <X size={13} /> Cancel
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          style={{ padding: '4px 12px' }}
                          onClick={() => handleSavePaymentEdit(pay.id)}
                        >
                          <Check size={13} /> Save
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
                        background: '#f0f9ff',
                        color: '#0284c7',
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
                          {formatCurrency(pay.amount)}
                        </div>
                        <span style={{ fontSize: '10px', color: '#64748b' }}>Paid Out</span>
                      </div>

                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '4px 8px', color: '#3b82f6', border: '1px solid #cbd5e1' }}
                        onClick={() => handleStartEdit(pay)}
                        title="Edit this payment voucher"
                      >
                        <Edit2 size={13} />
                      </button>

                      <button
                        className="btn btn-danger btn-sm"
                        style={{ padding: '4px 8px', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' }}
                        onClick={() => handleDeletePayment(pay)}
                        title="Delete this payment voucher"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '14px', borderTop: '1px solid #e2e8f0' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
