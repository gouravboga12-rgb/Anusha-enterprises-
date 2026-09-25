import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Plus, Trash2, AlertCircle, Warehouse, History, ShieldAlert } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';

const UNIT_OPTIONS = ['Units', 'Boxes', 'Packets', 'Meters', 'Pieces', 'Kg', 'Custom'];

export const EditSaleModal = ({
  isOpen,
  onClose,
  sale,
  dataService,
  currentUser,
  onSaleUpdated
}) => {
  const customers = dataService.getCustomers();
  const products = dataService.getProducts().filter((p) => p.is_active);
  const godowns = dataService.getGodowns();

  const [customerId, setCustomerId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [items, setItems] = useState([]);
  const [vehicleNo, setVehicleNo] = useState('');
  const [reason, setReason] = useState('');
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
          godown_id: i.godown_id || godowns[0]?.id || '',
          quantity: i.quantity,
          unit: i.unit || 'Units',
          selling_price: i.selling_price
        }))
      );
      setVehicleNo(sale.vehicle_no || sale.transport_no || '');
      setReason('');
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
      godown_id: updated[index].godown_id || godowns[0]?.id || '',
      unit: prod?.unit || updated[index].unit || 'Units',
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
    const defProd = products[0];
    setItems([
      ...items,
      {
        product_id: defProd.id,
        godown_id: godowns[0]?.id || '',
        quantity: 1,
        unit: defProd.unit || 'Units',
        selling_price: defProd.selling_price || 0
      }
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

    if (!reason.trim()) {
      setError('Please provide a mandatory reason for this sale invoice correction (required for audit trail)');
      return;
    }

    try {
      const updated = dataService.updateSale(sale.id, {
        customer_id: customerId,
        items,
        date,
        time,
        vehicle_no: vehicleNo,
        notes
      }, reason.trim(), currentUser);

      if (onSaleUpdated) onSaleUpdated(updated);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update sale invoice');
    }
  };

  const auditTrail = dataService?.getAuditTrail ? dataService.getAuditTrail('customer_sales', sale.id) : [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Sale Invoice — ${sale.invoice_no}`}
      maxWidth="880px"
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        {/* Informative Note */}
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '12px', color: '#166534' }}>
          <strong>Note:</strong> Editing this bill adjusts products, quantities, godown stock, and line prices. Existing customer payments remain completely safe and are never overwritten.
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
                  <th style={{ width: '30%' }}>Product</th>
                  <th style={{ width: '22%' }}>Source Godown</th>
                  <th style={{ width: '22%' }}>Quantity & Unit</th>
                  <th style={{ width: '13%' }}>Price (₹)</th>
                  <th style={{ width: '13%', textAlign: 'right' }}>Total</th>
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
                        <select
                          className="form-select"
                          value={item.godown_id}
                          onChange={(e) => handleItemChange(idx, 'godown_id', e.target.value)}
                          style={{ fontSize: '12px' }}
                        >
                          {godowns.map((g) => {
                            const gStock = dataService.getProductStockInGodown(item.product_id, g.id);
                            return (
                              <option key={g.id} value={g.id}>
                                {g.name} ({gStock} available)
                              </option>
                            );
                          })}
                        </select>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <input
                            type="number"
                            className="form-input"
                            min="1"
                            style={{
                              width: '65px',
                              borderColor: isExceeding ? '#ef4444' : undefined,
                              background: isExceeding ? '#fef2f2' : undefined
                            }}
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          />
                          <select
                            className="form-select"
                            value={UNIT_OPTIONS.includes(item.unit) ? item.unit : 'Custom'}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === 'Custom') {
                                const customVal = prompt('Enter custom quantity unit type (e.g. Rolls, Bags, Bundles):', item.unit || '');
                                handleItemChange(idx, 'unit', customVal?.trim() || 'Units');
                              } else {
                                handleItemChange(idx, 'unit', val);
                              }
                            }}
                            style={{ width: '85px', fontSize: '11px', padding: '4px 6px' }}
                          >
                            {UNIT_OPTIONS.map((u) => (
                              <option key={u} value={u}>{u}</option>
                            ))}
                          </select>
                        </div>
                        {item.unit && !UNIT_OPTIONS.includes(item.unit) && (
                          <div style={{ fontSize: '10.5px', color: '#0284c7', marginTop: '2px', fontWeight: 600 }}>
                            Custom: {item.unit}
                          </div>
                        )}
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

        {/* Reason for Correction */}
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label className="form-label" style={{ fontWeight: 700, color: '#b45309', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ShieldAlert size={14} /> Reason for Correction * (Mandatory for Audit Trail)
          </label>
          <input
            type="text"
            className="form-input"
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Corrected quantity billed / customer return..."
            style={{ borderColor: '#fde68a', backgroundColor: '#fffbeb' }}
          />
        </div>

        <div className="form-row">
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label" style={{ fontWeight: 600 }}>Vehicle Number / Transport (Optional)</label>
            <input
              type="text"
              className="form-input"
              value={vehicleNo}
              onChange={(e) => setVehicleNo(e.target.value)}
              placeholder="e.g. TS 08 AB 1234 / Auto / Lorry"
            />
          </div>
          <div className="form-group" style={{ flex: 2 }}>
            <label className="form-label" style={{ fontWeight: 600 }}>Notes / Remarks</label>
            <input
              type="text"
              className="form-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Revised order after customer call..."
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Save Updated Bill
          </button>
        </div>

        {/* Audit Trail Section */}
        {auditTrail && auditTrail.length > 0 && (
          <div style={{ marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <History size={14} color="#64748b" /> Modification History & Audit Trail ({auditTrail.length})
            </h4>
            <div style={{ maxHeight: '140px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px' }}>
              <table className="data-table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Field Changed</th>
                    <th>Correction Detail</th>
                    <th>Reason</th>
                    <th>Changed By</th>
                  </tr>
                </thead>
                <tbody>
                  {auditTrail.map((a, i) => (
                    <tr key={a.id || i}>
                      <td>{formatDate(a.changed_at)} {new Date(a.changed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td><strong>{a.field_name}</strong></td>
                      <td>{String(a.old_value)} → {String(a.new_value)}</td>
                      <td style={{ color: '#b45309' }}>{a.reason || '—'}</td>
                      <td>{a.changed_by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};
