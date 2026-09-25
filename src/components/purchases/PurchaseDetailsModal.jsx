import React from 'react';
import { Modal } from '../common/Modal';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { PlusCircle, Edit, Trash2, FileText } from 'lucide-react';

export const PurchaseDetailsModal = ({
  isOpen,
  onClose,
  purchase,
  dataService,
  onAddPayment,
  onEditPurchase,
  onViewInvoice
}) => {
  if (!purchase) return null;

  const supplier = dataService.getSupplierById(purchase.supplier_id);
  const payments = dataService.getPurchasePayments(purchase.id);

  const totalAmount = purchase.total_amount || 0;
  const totalPaid = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const pendingAmount = Math.max(0, totalAmount - totalPaid);
  const isPaid = pendingAmount === 0;

  const handleDeletePayment = (pay) => {
    if (window.confirm(`Delete payment voucher of ${formatCurrency(pay.amount)} (${pay.receipt_no})?\n\nThis will restore ₹${pay.amount.toLocaleString()} to our pending payable for this purchase.`)) {
      dataService.deletePayment(pay.id);
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
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary btn-sm"
              style={{ color: '#0284c7', borderColor: '#bae6fd', background: '#f0f9ff', fontWeight: 600 }}
              onClick={() => {
                if (onViewInvoice) onViewInvoice(purchase);
              }}
              title="View and Print Official Supplier Inward Invoice"
            >
              <FileText size={14} /> View Invoice
            </button>
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
                      className="btn btn-danger btn-sm"
                      style={{ padding: '4px 8px', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' }}
                      onClick={() => handleDeletePayment(pay)}
                      title="Delete this payment voucher"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
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
