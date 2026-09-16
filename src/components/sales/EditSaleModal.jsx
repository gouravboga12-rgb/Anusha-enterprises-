import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const EditSaleModal = ({
  isOpen,
  onClose,
  sale,
  dataService,
  onSaleUpdated
}) => {
  const customers = dataService.getCustomers();
  const products = dataService.getProducts().filter((p) => p.is_active);

  const [customerId, setCustomerId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (sale && isOpen) {
      setCustomerId(sale.customer_id || '');
      setDate(sale.date || '');
      setTime(sale.time || '');
      setItems(
        sale.items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          selling_price: i.selling_price
        }))
      );
      setNotes(sale.notes || '');
      setError('');
    }
  }, [sale, isOpen]);

  if (!sale) return null;

  const handleProductChange = (index, prodId) => {
    const prod = products.find((p) => p.id === prodId);
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      product_id: prodId,
      selling_price: prod ? prod.selling_price : 0
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
      { product_id: products[0].id, quantity: 1, selling_price: products[0].selling_price || 0 }
    ]);
  };

  const removeItemRow = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const totalBillAmount = items.reduce((acc, item) => {
    return acc + (Number(item.quantity) || 0) * (Number(item.selling_price) || 0);
  }, 0);

  // Map old quantities for reference & stock delta calculation
  const oldQtyMap = {};
  sale.items.forEach((item) => {
    oldQtyMap[item.product_id] = (oldQtyMap[item.product_id] || 0) + Number(item.quantity);
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!customerId) {
      setError('Please select a customer');
      return;
    }

    if (items.length === 0) {
      setError('Please add at least one product item');
      return;
    }

    // Build new quantities map
    const newQtyMap = {};
    for (const item of items) {
      const qty = Number(item.quantity) || 0;
      if (qty <= 0) {
        const prod = products.find((p) => p.id === item.product_id);
        setError(`Quantity for ${prod ? prod.name : 'product'} must be at least 1`);
        return;
      }
      newQtyMap[item.product_id] = (newQtyMap[item.product_id] || 0) + qty;
    }

    // STRICT DELTA STOCK VALIDATION
    for (const [prodId, newQty] of Object.entries(newQtyMap)) {
      const oldQty = oldQtyMap[prodId] || 0;
      const delta = newQty - oldQty;
      if (delta > 0) {
        const prod = products.find((p) => p.id === prodId);
        const availableStock = prod ? (prod.current_stock || 0) : 0;
        if (availableStock < delta) {
          setError(`Only ${availableStock} additional units of "${prod?.name || 'product'}" are available. You cannot increase quantity by ${delta} units.`);
          return;
        }
      }
    }

    try {
      const updated = dataService.updateSale(sale.id, {
        customer_id: customerId,
        items,
        date,
        time,
        notes
      });

      if (onSaleUpdated) onSaleUpdated(updated);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update sale invoice');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Sale Invoice — ${sale.invoice_no}`}
      maxWidth="750px"
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        {/* Informative Note: Payments are NOT touched here */}
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '12px', color: '#166534' }}>
          <strong>Note:</strong> Editing this bill adjusts only products, quantities, and line prices. Existing customer payments remain completely safe and are never overwritten.
        </div>

        {/* Customer & Date Selector */}
        <div className="form-row">
          <div className="form-group" style={{ flex: 2 }}>
            <label className="form-label">Customer</label>
            <select
              className="form-select"
              required
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.customer_id}) - {c.area || 'Nandipet'}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Sale Date</label>
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

        {/* Multi-item Product Table */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label className="form-label" style={{ margin: 0 }}>Product Items Billed</label>
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
                  <th style={{ width: '22%' }}>Price (₹)</th>
                  <th style={{ width: '15%', textAlign: 'right' }}>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const prod = products.find((p) => p.id === item.product_id);
                  const lineTotal = (Number(item.quantity) || 0) * (Number(item.selling_price) || 0);
                  const oldQty = oldQtyMap[item.product_id] || 0;
                  const delta = (Number(item.quantity) || 0) - oldQty;
                  const isExceeding = delta > 0 && prod && delta > (prod.current_stock || 0);

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
                              {p.name} (Stock: {p.current_stock} {p.unit})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-input"
                          min="1"
                          style={{
                            borderColor: isExceeding ? '#ef4444' : undefined,
                            background: isExceeding ? '#fef2f2' : undefined
                          }}
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        />
                        {oldQty > 0 && (
                          <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px' }}>
                            Original: {oldQty} {delta !== 0 && `(${delta > 0 ? '+' : ''}${delta})`}
                          </div>
                        )}
                        {isExceeding && (
                          <div style={{ color: '#ef4444', fontSize: '10.5px', fontWeight: 600 }}>
                            Short by {delta - (prod?.current_stock || 0)} units
                          </div>
                        )}
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-input"
                          min="0"
                          step="0.01"
                          value={item.selling_price}
                          onChange={(e) => handleItemChange(idx, 'selling_price', e.target.value)}
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
            <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Already Paid on this Bill:</span>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#10b981' }}>{formatCurrency(sale.paid_amount || 0)}</span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>New Bill Amount:</span>
            <span style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>{formatCurrency(totalBillAmount)}</span>
            <div style={{ fontSize: '11.5px', color: totalBillAmount - (sale.paid_amount || 0) > 0 ? '#e11d48' : '#10b981', fontWeight: 600 }}>
              New Pending Due: {formatCurrency(Math.max(0, totalBillAmount - (sale.paid_amount || 0)))}
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
            placeholder="e.g. Revised order after customer call..."
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Save Updated Bill
          </button>
        </div>
      </form>
    </Modal>
  );
};
