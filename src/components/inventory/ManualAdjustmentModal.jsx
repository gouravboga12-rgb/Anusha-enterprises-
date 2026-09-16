import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Sliders, AlertTriangle } from 'lucide-react';
import { getTodayDateString, getCurrentTimeString } from '../../utils/formatters';

export const ManualAdjustmentModal = ({ isOpen, onClose, dataService, onAdjustmentSaved }) => {
  const products = dataService.getProducts();

  const [productId, setProductId] = useState(products[0]?.id || '');
  const [adjustmentType, setAdjustmentType] = useState('increase'); // 'increase' or 'decrease'
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('Physical stock correction');
  const [customReason, setCustomReason] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [time, setTime] = useState(getCurrentTimeString());
  const [error, setError] = useState('');

  const selectedProduct = products.find((p) => p.id === productId);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      setError('Please enter an adjustment quantity greater than 0');
      return;
    }

    if (!productId) {
      setError('Please select a product');
      return;
    }

    const finalReason = reason === 'Other' ? customReason : reason;
    if (!finalReason) {
      setError('Please specify the reason for manual stock correction');
      return;
    }

    try {
      const adj = dataService.recordStockAdjustment({
        product_id: productId,
        adjustment_type: adjustmentType,
        quantity: qty,
        reason: finalReason,
        date,
        time
      });

      if (onAdjustmentSaved) onAdjustmentSaved(adj);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to adjust stock');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manual Stock Physical Adjustment"
      maxWidth="600px"
    >
      <form onSubmit={handleSubmit}>
        <div style={{
          background: '#fffbeb',
          border: '1px solid #fde68a',
          padding: '12px 14px',
          borderRadius: '8px',
          marginBottom: '16px',
          fontSize: '12.5px',
          color: '#92400e',
          display: 'flex',
          gap: '10px'
        }}>
          <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0 }} />
          <span>
            <strong>Important Rule:</strong> Manual adjustments are kept separate from sales and purchases to preserve accurate profit and ledger records.
          </span>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Select Product *</label>
          <select
            className="form-select"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.sku}) — Current Physical Stock: {p.current_stock} {p.unit}
              </option>
            ))}
          </select>
        </div>

        {selectedProduct && (
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            padding: '10px 14px',
            borderRadius: '8px',
            marginBottom: '14px',
            fontSize: '13px',
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <span>Current Recorded Stock:</span>
            <strong style={{ color: '#0284c7' }}>
              {selectedProduct.current_stock} {selectedProduct.unit}
            </strong>
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Adjustment Type *</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className={`btn btn-sm ${adjustmentType === 'increase' ? 'btn-success' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => setAdjustmentType('increase')}
              >
                + Increase Stock
              </button>
              <button
                type="button"
                className={`btn btn-sm ${adjustmentType === 'decrease' ? 'btn-danger' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => setAdjustmentType('decrease')}
              >
                - Decrease Stock
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Quantity to Adjust *</label>
            <input
              type="number"
              className="form-input"
              required
              min="1"
              placeholder="e.g. 10"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Reason for Physical Difference *</label>
          <select
            className="form-select"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            <option value="Physical stock correction">Physical stock correction (Recount discovered discrepancy)</option>
            <option value="Damaged products">Damaged products (Transit / Warehouse dent)</option>
            <option value="Missing products">Missing products / Shortage</option>
            <option value="Stock counting difference">Stock counting difference</option>
            <option value="Other">Other / Custom Reason</option>
          </select>
        </div>

        {reason === 'Other' && (
          <div className="form-group">
            <label className="form-label">Specify Custom Reason</label>
            <input
              type="text"
              className="form-input"
              placeholder="Describe why stock was changed..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
            />
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Audit Date</label>
            <input
              type="date"
              className="form-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Time</label>
            <input
              type="text"
              className="form-input"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-footer" style={{ margin: '16px -24px -24px', padding: '16px 24px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Confirm & Update Physical Stock
          </button>
        </div>
      </form>
    </Modal>
  );
};
