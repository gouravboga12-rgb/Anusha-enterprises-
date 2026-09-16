import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const EditPurchaseModal = ({
  isOpen,
  onClose,
  purchase,
  dataService,
  onPurchaseUpdated
}) => {
  const suppliers = dataService.getSuppliers();
  const products = dataService.getProducts();

  const [supplierId, setSupplierId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (purchase && isOpen) {
      setSupplierId(purchase.supplier_id || '');
      setDate(purchase.date || '');
      setTime(purchase.time || '');
      setItems(
        purchase.items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          purchase_price: i.purchase_price
        }))
      );
      setNotes(purchase.notes || '');
      setError('');
    }
  }, [purchase, isOpen]);

  if (!purchase) return null;

  const handleProductChange = (index, prodId) => {
    const prod = products.find((p) => p.id === prodId);
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      product_id: prodId,
      purchase_price: prod ? prod.purchase_price : 0
    };
    setItems(updated);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const addItemRow = () => {
    if (products.length === 0) return;
    setItems([
      ...items,
      { product_id: products[0].id, quantity: 10, purchase_price: products[0].purchase_price || 0 }
    ]);
  };

  const removeItemRow = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const totalBillAmount = items.reduce((acc, item) => {
    return acc + (Number(item.quantity) || 0) * (Number(item.purchase_price) || 0);
  }, 0);

  const oldQtyMap = {};
  purchase.items.forEach((item) => {
    oldQtyMap[item.product_id] = (oldQtyMap[item.product_id] || 0) + Number(item.quantity);
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!supplierId) {
      setError('Please select a supplier');
      return;
    }

    if (items.length === 0) {
      setError('Please add at least one product item');
      return;
    }

    const newQtyMap = {};
    for (const item of items) {
      const qty = Number(item.quantity) || 0;
      if (qty <= 0) {
        setError('Quantity must be at least 1');
        return;
      }
      newQtyMap[item.product_id] = (newQtyMap[item.product_id] || 0) + qty;
    }

    // If decreasing purchase quantity, ensure physical stock has enough to deduct
    for (const [prodId, oldQty] of Object.entries(oldQtyMap)) {
      const newQty = newQtyMap[prodId] || 0;
      if (newQty < oldQty) {
        const diff = oldQty - newQty;
        const prod = products.find((p) => p.id === prodId);
        if (prod && (prod.current_stock || 0) < diff) {
          setError(`Cannot decrease purchase quantity of "${prod.name}" by ${diff} units because current physical stock is only ${prod.current_stock}.`);
          return;
        }
      }
    }

    try {
      const updated = dataService.updatePurchase(purchase.id, {
        supplier_id: supplierId,
        items,
        date,
        time,
        notes
      });

      if (onPurchaseUpdated) onPurchaseUpdated(updated);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update supplier purchase');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Supplier Purchase — ${purchase.purchase_no}`}
      maxWidth="750px"
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '12px', color: '#166534' }}>
          <strong>Note:</strong> Modifying this purchase updates goods received and adjusts inventory deltas. Payments already made to the supplier remain intact.
        </div>

        <div className="form-row">
          <div className="form-group" style={{ flex: 2 }}>
            <label className="form-label">Supplier / Vendor</label>
            <select
              className="form-select"
              required
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.company_name} ({s.supplier_id})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Purchase Date</label>
            <input
              type="date"
              className="form-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Time</label>
            <input
              type="text"
              className="form-input"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </div>

        {/* Product Items Table */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label className="form-label" style={{ margin: 0 }}>Products Inward</label>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={addItemRow}
            >
              <Plus size={14} /> Add Product Line
            </button>
          </div>

          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
            <table className="data-table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ width: '45%' }}>Product</th>
                  <th style={{ width: '18%' }}>Quantity</th>
                  <th style={{ width: '22%' }}>Cost (₹)</th>
                  <th style={{ width: '15%', textAlign: 'right' }}>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const prod = products.find((p) => p.id === item.product_id);
                  const lineTotal = (Number(item.quantity) || 0) * (Number(item.purchase_price) || 0);
                  const oldQty = oldQtyMap[item.product_id] || 0;
                  const delta = (Number(item.quantity) || 0) - oldQty;

                  return (
                    <tr key={idx}>
                      <td>
                        <select
                          className="form-select"
                          value={item.product_id}
                          onChange={(e) => handleProductChange(idx, e.target.value)}
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.sku})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-input"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        />
                        {oldQty > 0 && (
                          <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px' }}>
                            Original: {oldQty} {delta !== 0 && `(${delta > 0 ? '+' : ''}${delta})`}
                          </div>
                        )}
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-input"
                          min="0"
                          step="0.01"
                          value={item.purchase_price}
                          onChange={(e) => handleItemChange(idx, 'purchase_price', e.target.value)}
                        />
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>
                        {formatCurrency(lineTotal)}
                      </td>
                      <td>
                        {items.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '6px', color: '#ef4444' }}
                            onClick={() => removeItemRow(idx)}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bill Total & Live Calculation */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '14px 18px',
          marginBottom: '18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Already Paid to Supplier:</span>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#10b981' }}>{formatCurrency(purchase.paid_amount || 0)}</span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>New Purchase Total:</span>
            <span style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>{formatCurrency(totalBillAmount)}</span>
            <div style={{ fontSize: '11.5px', color: totalBillAmount - (purchase.paid_amount || 0) > 0 ? '#d97706' : '#10b981', fontWeight: 600 }}>
              New Pending Payable: {formatCurrency(Math.max(0, totalBillAmount - (purchase.paid_amount || 0)))}
            </div>
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label className="form-label">Notes / Remarks</label>
          <input
            type="text"
            className="form-input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Revised invoice from vendor..."
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Save Updated Purchase
          </button>
        </div>
      </form>
    </Modal>
  );
};
