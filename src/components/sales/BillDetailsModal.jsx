import React from 'react';
import { Modal } from '../common/Modal';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { PlusCircle, Edit, Trash2, Calendar, Receipt, CreditCard, Clock, User, FileText } from 'lucide-react';

export const BillDetailsModal = ({
  isOpen,
  onClose,
  sale,
  dataService,
  onAddPayment,
  onEditBill,
  onViewInvoice
}) => {
  if (!sale) return null;

  const customer = dataService.getCustomerById(sale.customer_id);
  const payments = dataService.getSalePayments(sale.id);

  // Recalculate live to be 100% accurate
  const totalAmount = sale.total_amount || 0;
  const totalPaid = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const pendingAmount = Math.max(0, totalAmount - totalPaid);
  const isPaid = pendingAmount === 0;

  const handleDeletePayment = (pay) => {
    if (window.confirm(`Delete payment of ${formatCurrency(pay.amount)} (${pay.receipt_no})?\n\nThis will automatically restore ₹${pay.amount.toLocaleString()} to the bill's pending balance.`)) {
      dataService.deletePayment(pay.id);
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
              {payments.map((pay, pIdx) => (
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

                    <button
                      className="btn btn-danger btn-sm"
                      style={{ padding: '4px 8px', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' }}
                      onClick={() => handleDeletePayment(pay)}
                      title="Delete this payment record"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
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
