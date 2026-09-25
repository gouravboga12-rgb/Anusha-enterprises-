import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Plus, Trash2, AlertCircle, CheckCircle2, Warehouse } from 'lucide-react';
import { formatCurrency, getTodayDateString, getCurrentTimeString } from '../../utils/formatters';

export const NewSaleModal = ({
  isOpen,
  onClose,
  dataService,
  currentUser,
  initialCustomerId = '',
  onSaleCreated,
  onOpenPayment
}) => {
  const customers = dataService.getCustomers();
  const products = dataService.getProducts().filter((p) => p.is_active);
  const godowns = dataService.getGodowns();

  const getDefaultGodownForProduct = (prodId) => {
    if (!prodId) return godowns[0]?.id || '';
    const gWithStock = godowns.find((g) => dataService.getProductStockInGodown(prodId, g.id) > 0);
    return gWithStock ? gWithStock.id : (godowns[0]?.id || '');
  };

  const [customerId, setCustomerId] = useState(initialCustomerId);
  const [date, setDate] = useState(getTodayDateString());
  const [time, setTime] = useState(getCurrentTimeString());
  const [items, setItems] = useState([
    {
      product_id: products[0]?.id || '',
      godown_id: getDefaultGodownForProduct(products[0]?.id),
      quantity: 1,
      selling_price: products[0]?.selling_price || 0
    }
  ]);
  const [initialPayment, setInitialPayment] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCustomerId(initialCustomerId || '');
      setDate(getTodayDateString());
      setTime(getCurrentTimeString());
      setItems(
        products.length > 0
          ? [{
              product_id: products[0].id,
              godown_id: getDefaultGodownForProduct(products[0].id),
              quantity: 1,
              selling_price: products[0].selling_price || 0
            }]
          : []
      );
      setInitialPayment('');
      setPaymentMode('Cash');
      setReferenceNo('');
      setNotes('');
      setError('');
    }
  }, [isOpen, initialCustomerId]);

  const handleProductChange = (index, prodId) => {
    const prod = products.find((p) => p.id === prodId);
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      product_id: prodId,
      godown_id: getDefaultGodownForProduct(prodId),
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
        godown_id: getDefaultGodownForProduct(defProd.id),
        quantity: 1,
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

  const customerLedger = customerId ? dataService.getCustomerLedger(customerId) : null;
  const previousBalance = customerLedger ? (customerLedger.pendingBalance || 0) : 0;
  const existingAdvance = customerLedger ? (customerLedger.advanceBalance || 0) : 0;

  const numPayment = Number(initialPayment) || 0;
  const thisBillPending = Math.max(0, totalBillAmount - numPayment);
  const thisBillAdvance = Math.max(0, numPayment - totalBillAmount);

  // Net calculation accounting for existing advance and current payment
  const netBalanceAfter = (previousBalance - existingAdvance) + (totalBillAmount - numPayment);
  const finalDueAfter = Math.max(0, netBalanceAfter);
  const finalAdvanceAfter = Math.max(0, -netBalanceAfter);

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

    // STRICT GODOWN-LEVEL STOCK VALIDATION: Block transaction if stock is insufficient in selected godown
    for (const item of items) {
      const prod = products.find((p) => p.id === item.product_id);
      const reqQty = Number(item.quantity) || 0;
      if (!prod) {
        setError('Please select a valid product');
        return;
      }
      if (reqQty <= 0) {
        setError(`Quantity for ${prod.name} must be at least 1`);
        return;
      }
      if (!item.godown_id) {
        setError(`Please select a godown location for "${prod.name}"`);
        return;
      }
      const availableInGodown = dataService.getProductStockInGodown(item.product_id, item.godown_id);
      const godown = dataService.getGodownById(item.godown_id);
      if (reqQty > availableInGodown) {
        setError(`Only ${availableInGodown} units of "${prod.name}" available in ${godown?.name || 'selected godown'}. You cannot sell ${reqQty} units from this location.`);
        return;
      }
    }

    try {
      const sale = dataService.recordSale({
        customer_id: customerId,
        items,
        date,
        time,
        initial_payment: initialPayment,
        payment_mode: paymentMode,
        reference_no: referenceNo,
        notes
      }, currentUser);

      if (onSaleCreated) onSaleCreated(sale);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save customer sale');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Customer Sale (Invoice)"
      maxWidth="880px"
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        {/* Customer & Date Selector */}
        <div className="form-row">
          <div className="form-group" style={{ flex: 2 }}>
            <label className="form-label">Select Customer *</label>
            <select
              className="form-select"
              required
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              <option value="">-- Choose Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.customer_id}) - {c.area || 'Nandipet'}
                </option>
              ))}
            </select>
            {previousBalance > 0 && (
              <div style={{ marginTop: '5px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#64748b' }}>Current Pending Khata:</span>
                  <span style={{ fontWeight: 700, color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', padding: '1px 8px', borderRadius: '4px' }}>
                    {formatCurrency(previousBalance)}
                  </span>
                </div>
                {onOpenPayment && (
                  <button
                    type="button"
                    className="btn btn-sm"
                    style={{
                      background: '#ecfdf5',
                      color: '#047857',
                      border: '1px solid #a7f3d0',
                      fontWeight: 700,
                      fontSize: '11px',
                      padding: '2px 8px'
                    }}
                    onClick={() => {
                      onClose();
                      onOpenPayment(customerId, 'customer');
                    }}
                    title="Switch to collect payment for previous pending balance"
                  >
                    Collect Previous Due
                  </button>
                )}
              </div>
            )}
            {existingAdvance > 0 && (
              <div style={{
                marginTop: '6px',
                padding: '6px 12px',
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '6px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '6px'
              }}>
                <span style={{ color: '#047857', fontWeight: 600 }}>
                  ✨ Customer has Advance Credit Balance: <strong>{formatCurrency(existingAdvance)}</strong>
                </span>
                <span style={{ fontSize: '11px', color: '#065f46' }}>
                  (This sale will auto-deduct from advance credit if not paid)
                </span>
              </div>
            )}
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

          {/* Desktop Table View (>= 640px) */}
          <div className="desktop-table-view" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
            <table className="data-table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ width: '32%' }}>Product</th>
                  <th style={{ width: '26%' }}>Source Godown</th>
                  <th style={{ width: '13%' }}>Quantity</th>
                  <th style={{ width: '15%' }}>Price (₹)</th>
                  <th style={{ width: '14%', textAlign: 'right' }}>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const prod = products.find((p) => p.id === item.product_id);
                  const lineTotal = (Number(item.quantity) || 0) * (Number(item.selling_price) || 0);
                  const stockInGodown = dataService.getProductStockInGodown(item.product_id, item.godown_id);
                  const isExceeding = Number(item.quantity) > stockInGodown;

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
                              {p.name} (Total: {p.current_stock} {p.unit})
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
                              <option key={g.id} value={g.id} disabled={gStock <= 0}>
                                {g.name} ({gStock} available) {gStock <= 0 ? '— Empty' : ''}
                              </option>
                            );
                          })}
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
                        {isExceeding && (
                          <div style={{ color: '#ef4444', fontSize: '10.5px', marginTop: '2px', fontWeight: 600 }}>
                            Max: {stockInGodown}
                          </div>
                        )}
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-input"
                          min="0"
                          value={item.selling_price}
                          onChange={(e) => handleItemChange(idx, 'selling_price', e.target.value)}
                        />
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>
                        {formatCurrency(lineTotal)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItemRow(idx)}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                            title="Remove row"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Touch-Friendly Item Cards (< 640px) */}
          <div className="mobile-cards-view" style={{ flexDirection: 'column', gap: '10px' }}>
            {items.map((item, idx) => {
              const lineTotal = (Number(item.quantity) || 0) * (Number(item.selling_price) || 0);
              const stockInGodown = dataService.getProductStockInGodown(item.product_id, item.godown_id);
              const isExceeding = Number(item.quantity) > stockInGodown;

              return (
                <div key={idx} style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>ITEM #{idx + 1}</span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px 6px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600 }}
                      >
                        <Trash2 size={13} /> Remove
                      </button>
                    )}
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '3px' }}>Product</label>
                    <select
                      className="form-select"
                      value={item.product_id}
                      onChange={(e) => handleProductChange(idx, e.target.value)}
                      style={{ width: '100%', fontSize: '12px' }}
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Total: {p.current_stock} {p.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '3px' }}>Source Godown</label>
                    <select
                      className="form-select"
                      value={item.godown_id}
                      onChange={(e) => handleItemChange(idx, 'godown_id', e.target.value)}
                      style={{ width: '100%', fontSize: '12px' }}
                    >
                      {godowns.map((g) => {
                        const gStock = dataService.getProductStockInGodown(item.product_id, g.id);
                        return (
                          <option key={g.id} value={g.id} disabled={gStock <= 0}>
                            {g.name} ({gStock} available) {gStock <= 0 ? '— Empty' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '3px' }}>Quantity</label>
                      <input
                        type="number"
                        className="form-input"
                        min="1"
                        style={{
                          width: '100%',
                          borderColor: isExceeding ? '#ef4444' : undefined,
                          background: isExceeding ? '#fef2f2' : undefined
                        }}
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      />
                      {isExceeding && (
                        <div style={{ color: '#ef4444', fontSize: '10.5px', marginTop: '2px', fontWeight: 600 }}>
                          Max: {stockInGodown}
                        </div>
                      )}
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '3px' }}>Price (₹)</label>
                      <input
                        type="number"
                        className="form-input"
                        min="0"
                        style={{ width: '100%' }}
                        value={item.selling_price}
                        onChange={(e) => handleItemChange(idx, 'selling_price', e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px dashed #cbd5e1' }}>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Item Total:</span>
                    <strong style={{ fontSize: '15px', color: '#0284c7' }}>{formatCurrency(lineTotal)}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bill Total and Payment Section */}
        <div style={{
          background: '#f8fafc',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid #e2e8f0',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>Total Bill Amount:</span>
            <span style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
              {formatCurrency(totalBillAmount)}
            </span>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Immediate Payment Received (₹)</label>
              <input
                type="number"
                className="form-input"
                min="0"
                placeholder="0 if credit or enter amount (supports advance)"
                value={initialPayment}
                onChange={(e) => setInitialPayment(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '11px', padding: '2px 8px' }}
                  onClick={() => setInitialPayment(totalBillAmount)}
                >
                  Full Payment
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '11px', padding: '2px 8px' }}
                  onClick={() => setInitialPayment('')}
                >
                  Credit (₹0)
                </button>
              </div>
              {thisBillAdvance > 0 && (
                <div style={{
                  marginTop: '8px',
                  padding: '6px 10px',
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#065f46',
                  fontWeight: 600
                }}>
                  ✓ Bill fully covered! Surplus <strong>+{formatCurrency(thisBillAdvance)}</strong> will be credited as Customer Advance.
                </div>
              )}
            </div>

            {Number(initialPayment) > 0 && (
              <>
                <div className="form-group">
                  <label className="form-label">Payment Mode</label>
                  <select
                    className="form-select"
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI (PhonePe / GPay)</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Transaction / UPI Ref #</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. UPI/260916/9921"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          <div style={{
            borderTop: '1px dashed #cbd5e1',
            paddingTop: '12px',
            marginTop: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: '#475569', fontWeight: 500 }}>This Bill Pending Due:</span>
              <span style={{ fontSize: '15px', fontWeight: 700, color: thisBillPending > 0 ? '#e11d48' : '#10b981' }}>
                {thisBillPending > 0 ? formatCurrency(thisBillPending) : '₹0 (Settled)'}
              </span>
            </div>

            {thisBillAdvance > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#047857', fontWeight: 600 }}>Advance Received on This Bill:</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#059669' }}>
                  +{formatCurrency(thisBillAdvance)}
                </span>
              </div>
            )}

            {existingAdvance > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#047857' }}>Previous Advance Credit Available:</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#059669' }}>
                  {formatCurrency(existingAdvance)}
                </span>
              </div>
            )}

            {previousBalance > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#64748b' }}>Previous Khata Balance:</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#b45309' }}>
                  +{formatCurrency(previousBalance)}
                </span>
              </div>
            )}

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '8px',
              borderTop: '1px solid #e2e8f0'
            }}>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                  {finalAdvanceAfter > 0 ? 'Net Advance Credit (After this Bill):' : 'Total Customer Due (After this Bill):'}
                </span>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  {finalAdvanceAfter > 0
                    ? 'Customer has surplus credit balance with us for future purchases'
                    : (finalDueAfter > 0 ? 'Net receivable balance on customer khata' : 'Account fully balanced')}
                </div>
              </div>
              <span style={{
                fontSize: '18px',
                fontWeight: 800,
                color: finalAdvanceAfter > 0 ? '#059669' : (finalDueAfter > 0 ? '#e11d48' : '#10b981')
              }}>
                {finalAdvanceAfter > 0 ? `${formatCurrency(finalAdvanceAfter)} Advance` : formatCurrency(finalDueAfter)}
              </span>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Notes / Delivery Reference</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Auto freight transport, driver receipt #12"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="modal-footer" style={{ margin: '16px -24px -24px', padding: '16px 24px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Save Sale & Update Stock
          </button>
        </div>
      </form>
    </Modal>
  );
};
