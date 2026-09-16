import React from 'react';
import { Modal } from '../common/Modal';
import { formatDate } from '../../utils/formatters';

export const StockMovementModal = ({ isOpen, onClose, product, dataService }) => {
  if (!product) return null;

  const sales = dataService.getSales();
  const purchases = dataService.getPurchases();
  const adjustments = dataService.getAdjustments();

  const movements = [];

  // Inward from purchases
  purchases.forEach((p) => {
    p.items.forEach((item) => {
      if (item.product_id === product.id) {
        movements.push({
          id: p.id + '-' + item.product_id,
          date: p.date,
          time: p.time,
          type: 'Supplier Purchase',
          badgeClass: 'badge-paid',
          quantity: `+${item.quantity}`,
          isPositive: true,
          reference: p.purchase_no,
          details: `Purchased at ₹${item.purchase_price} / ${product.unit}`,
          recorded_by: p.recorded_by
        });
      }
    });
  });

  // Outward from sales
  sales.forEach((s) => {
    s.items.forEach((item) => {
      if (item.product_id === product.id) {
        movements.push({
          id: s.id + '-' + item.product_id,
          date: s.date,
          time: s.time,
          type: 'Customer Sale',
          badgeClass: 'badge-credit',
          quantity: `-${item.quantity}`,
          isPositive: false,
          reference: s.invoice_no,
          details: `Sold at ₹${item.selling_price} / ${product.unit}`,
          recorded_by: s.recorded_by
        });
      }
    });
  });

  // Adjustments
  adjustments.forEach((adj) => {
    if (adj.product_id === product.id) {
      movements.push({
        id: adj.id,
        date: adj.date,
        time: adj.time,
        type: `Manual Adjustment (${adj.adjustment_type})`,
        badgeClass: 'badge-partial',
        quantity: adj.adjustment_type === 'increase' ? `+${adj.quantity}` : `-${adj.quantity}`,
        isPositive: adj.adjustment_type === 'increase',
        reference: 'Stock Audit',
        details: adj.reason,
        recorded_by: adj.recorded_by
      });
    }
  });

  movements.sort((a, b) => new Date(`${b.date} ${b.time}`).getTime() - new Date(`${a.date} ${a.time}`).getTime());

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Stock Movement History: ${product.name}`}
      maxWidth="750px"
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        background: '#f0f9ff',
        borderRadius: '10px',
        border: '1px solid #bae6fd',
        marginBottom: '16px'
      }}>
        <div>
          <span style={{ fontSize: '12px', color: '#0284c7', fontWeight: 600 }}>CURRENT AVAILABLE STOCK</span>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
            {product.current_stock} <span style={{ fontSize: '13px', fontWeight: 500 }}>{product.unit}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>SKU Code</span>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#0284c7' }}>{product.sku}</div>
        </div>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Movement Type</th>
              <th>Change</th>
              <th>Reference #</th>
              <th>Transaction Details / Reason</th>
              <th>Recorded By</th>
            </tr>
          </thead>
          <tbody>
            {movements.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                  No movement records found for this product yet.
                </td>
              </tr>
            ) : (
              movements.map((m) => (
                <tr key={m.id}>
                  <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                    <div style={{ fontWeight: 600 }}>{formatDate(m.date)}</div>
                    <div style={{ color: '#64748b', fontSize: '11px' }}>{m.time}</div>
                  </td>
                  <td>
                    <span className={`badge ${m.badgeClass}`}>{m.type}</span>
                  </td>
                  <td style={{
                    fontWeight: 800,
                    fontSize: '14px',
                    color: m.isPositive ? '#15803d' : '#b91c1c'
                  }}>
                    {m.quantity} {product.unit}
                  </td>
                  <td style={{ fontWeight: 600, fontSize: '12px' }}>{m.reference}</td>
                  <td style={{ fontSize: '13px' }}>{m.details}</td>
                  <td style={{ fontSize: '12px', color: '#64748b' }}>{m.recorded_by}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="modal-footer" style={{ margin: '16px -24px -24px', padding: '16px 24px' }}>
        <button className="btn btn-secondary" onClick={onClose}>
          Close
        </button>
      </div>
    </Modal>
  );
};
