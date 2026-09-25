import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Plus, Trash2, Warehouse, Sparkles } from 'lucide-react';
import { formatCurrency, getTodayDateString, getCurrentTimeString } from '../../utils/formatters';

export const NewPurchaseModal = ({
  isOpen,
  onClose,
  dataService,
  currentUser,
  initialSupplierId = '',
  onPurchaseCreated,
  onOpenPayment
}) => {
  const suppliers = dataService.getSuppliers();
  const products = dataService.getProducts();
  const godowns = dataService.getGodowns();

  // Get products assigned to the currently selected supplier, or fall back to all products
  const getSupplierFilteredProducts = (sId) => {
    if (!sId) return products;
    const supplierProds = dataService.getSupplierProducts(sId);
    return supplierProds.length > 0 ? supplierProds : products;
  };

  const [supplierId, setSupplierId] = useState(initialSupplierId);
  const [godownId, setGodownId] = useState(godowns[0]?.id || '');
  const [date, setDate] = useState(getTodayDateString());
  const [time, setTime] = useState(getCurrentTimeString());
  const [items, setItems] = useState([
    { product_id: products[0]?.id || '', godown_id: godowns[0]?.id || '', quantity: 10, purchase_price: products[0]?.purchase_price || 0 }
  ]);
  const [initialPayment, setInitialPayment] = useState('');
  const [paymentMode, setPaymentMode] = useState('Bank Transfer');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Suppliers mapped to currently selected products
  const selectedProductIds = items.map((i) => i.product_id).filter(Boolean);
  const suggestedSupplierIds = new Set();
  selectedProductIds.forEach((pid) => {
    const supps = dataService.getProductSuppliers(pid);
    supps.forEach((s) => suggestedSupplierIds.add(s.id));
  });

  useEffect(() => {
    if (isOpen) {
      const sid = initialSupplierId || '';
      setSupplierId(sid);
      setGodownId(godowns[0]?.id || '');
      setDate(getTodayDateString());
      setTime(getCurrentTimeString());
      const availableProds = getSupplierFilteredProducts(sid);
      setItems(
        availableProds.length > 0
          ? [{ product_id: availableProds[0].id, godown_id: godowns[0]?.id || '', quantity: 10, purchase_price: availableProds[0].purchase_price || 0 }]
          : []
      );
      setInitialPayment('');
      setPaymentMode('Bank Transfer');
      setReferenceNo('');
      setNotes('');
      setError('');
    }
  }, [isOpen, initialSupplierId]);

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
    const availableProds = getSupplierFilteredProducts(supplierId);
    if (availableProds.length === 0) return;
    setItems([
      ...items,
      { product_id: availableProds[0].id, godown_id: godownId || godowns[0]?.id || '', quantity: 10, purchase_price: availableProds[0].purchase_price || 0 }
    ]);
  };

  const removeItemRow = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const totalBillAmount = items.reduce((acc, item) => {
    return acc + (Number(item.quantity) || 0) * (Number(item.purchase_price) || 0);
  }, 0);

  const supplierLedger = supplierId ? dataService.getSupplierLedger(supplierId) : null;
  const previousPayable = supplierLedger ? (supplierLedger.pendingBalance || 0) : 0;
  const existingAdvance = supplierLedger ? (supplierLedger.advanceBalance || 0) : 0;

  const numPayment = Number(initialPayment) || 0;
  const thisBillPending = Math.max(0, totalBillAmount - numPayment);
  const thisBillAdvance = Math.max(0, numPayment - totalBillAmount);

  // Net calculation accounting for existing advance and current payment
  const netBalanceAfter = (previousPayable - existingAdvance) + (totalBillAmount - numPayment);
  const finalPayableAfter = Math.max(0, netBalanceAfter);
  const finalAdvanceAfter = Math.max(0, -netBalanceAfter);

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

    for (const item of items) {
      const reqQty = Number(item.quantity) || 0;
      if (reqQty <= 0) {
        setError('Quantity must be greater than 0');
        return;
      }
    }

    try {
      const pur = dataService.recordPurchase({
        supplier_id: supplierId,
        godown_id: godownId,
        items,
        date,
        time,
        initial_payment: initialPayment,
        payment_mode: paymentMode,
        reference_no: referenceNo,
        notes
      }, currentUser);

      if (onPurchaseCreated) onPurchaseCreated(pur);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to record supplier purchase');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Supplier Inward Purchase (Stock In)"
      maxWidth="780px"
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        {/* Row 1: Supplier & Destination Godown */}
        <div className="form-row">
          <div className="form-group" style={{ flex: 1.8 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Select Supplier *</span>
              {suggestedSupplierIds.size > 0 && (
                <span style={{ fontSize: '11px', color: '#0284c7', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Sparkles size={12} /> {suggestedSupplierIds.size} mapped supplier(s)
                </span>
              )}
            </label>
            <select
              className="form-select"
              required
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
            >
              <option value="">-- Choose Supplier --</option>
              {suggestedSupplierIds.size > 0 && (
                <optgroup label="✨ Mapped Suppliers (Supplies Selected Product)">
                  {suppliers.filter((s) => suggestedSupplierIds.has(s.id)).map((s) => (
                    <option key={s.id} value={s.id}>
                      ★ {s.company_name} ({s.supplier_id}) - {s.area || 'Hub'}
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label={suggestedSupplierIds.size > 0 ? "All Other Suppliers" : "All Suppliers"}>
                {suppliers.filter((s) => !suggestedSupplierIds.has(s.id)).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.company_name} ({s.supplier_id}) - {s.area || 'Hub'}
                  </option>
                ))}
              </optgroup>
            </select>
            {previousPayable > 0 && (
              <div style={{ marginTop: '5px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#64748b' }}>Current Outstanding Payable:</span>
                  <span style={{ fontWeight: 700, color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', padding: '1px 8px', borderRadius: '4px' }}>
                    {formatCurrency(previousPayable)}
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
                      onOpenPayment(supplierId, 'supplier');
                    }}
                    title="Switch to pay previous pending supplier balance"
                  >
                    Pay Previous Due
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
                  ✨ Existing Advance Paid with Supplier: <strong>{formatCurrency(existingAdvance)}</strong>
                </span>
                <span style={{ fontSize: '11px', color: '#065f46' }}>
                  (This purchase will auto-deduct from advance if not paid)
                </span>
              </div>
            )}
          </div>

          <div className="form-group" style={{ flex: 1.2 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Warehouse size={13} color="#0284c7" /> Destination Godown *
            </label>
            <select
              className="form-select"
              required
              value={godownId}
              onChange={(e) => {
                const newGId = e.target.value;
                setGodownId(newGId);
                setItems((prev) => prev.map((item) => ({ ...item, godown_id: newGId })));
              }}
            >
              {godowns.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.code || 'Main'}) {g.location ? `— ${g.location}` : ''}
                </option>
              ))}
            </select>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              Stock will be received into this godown
            </div>
          </div>
        </div>

        {/* Row 2: Date and Time */}
        <div className="form-row">
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

          {/* Desktop Table View (>= 640px) */}
          <div className="desktop-table-view" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
            <table className="data-table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ width: '32%' }}>Product</th>
                  <th style={{ width: '26%' }}>Destination Godown</th>
                  <th style={{ width: '13%' }}>Quantity</th>
                  <th style={{ width: '15%' }}>Purchase Price (₹)</th>
                  <th style={{ width: '14%', textAlign: 'right' }}>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const lineTotal = (Number(item.quantity) || 0) * (Number(item.purchase_price) || 0);

                  return (
                    <tr key={idx}>
                      <td>
                        <select
                          className="form-select"
                          value={item.product_id}
                          onChange={(e) => handleProductChange(idx, e.target.value)}
                        >
                          {getSupplierFilteredProducts(supplierId).map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (Total: {p.current_stock} {p.unit})
                            </option>
                          ))}
                          {supplierId && dataService.getSupplierProducts(supplierId).length === 0 && (
                            <option disabled value="">── All products (none mapped to this supplier) ──</option>
                          )}
                        </select>
                      </td>
                      <td>
                        <select
                          className="form-select"
                          value={item.godown_id || godownId}
                          onChange={(e) => handleItemChange(idx, 'godown_id', e.target.value)}
                          style={{ fontSize: '12px' }}
                        >
                          {godowns.map((g) => {
                            const inG = dataService.getProductStockInGodown(item.product_id, g.id);
                            return (
                              <option key={g.id} value={g.id}>
                                {g.name} ({inG} in stock)
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
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-input"
                          min="0"
                          value={item.purchase_price}
                          onChange={(e) => handleItemChange(idx, 'purchase_price', e.target.value)}
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
              const lineTotal = (Number(item.quantity) || 0) * (Number(item.purchase_price) || 0);

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
                      {getSupplierFilteredProducts(supplierId).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Total: {p.current_stock} {p.unit})
                        </option>
                      ))}
                      {supplierId && dataService.getSupplierProducts(supplierId).length === 0 && (
                        <option disabled value="">── All products (none mapped to this supplier) ──</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '3px' }}>Destination Godown</label>
                    <select
                      className="form-select"
                      value={item.godown_id || godownId}
                      onChange={(e) => handleItemChange(idx, 'godown_id', e.target.value)}
                      style={{ width: '100%', fontSize: '12px' }}
                    >
                      {godowns.map((g) => {
                        const inG = dataService.getProductStockInGodown(item.product_id, g.id);
                        return (
                          <option key={g.id} value={g.id}>
                            {g.name} ({inG} in stock)
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
                        style={{ width: '100%' }}
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '3px' }}>Purchase Price (₹)</label>
                      <input
                        type="number"
                        className="form-input"
                        min="0"
                        style={{ width: '100%' }}
                        value={item.purchase_price}
                        onChange={(e) => handleItemChange(idx, 'purchase_price', e.target.value)}
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

        {/* Total & Payment Outward */}
        <div style={{
          background: '#f8fafc',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid #e2e8f0',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>Total Inward Amount:</span>
            <span style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
              {formatCurrency(totalBillAmount)}
            </span>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Immediate Payment Made to Supplier (₹)</label>
              <input
                type="number"
                className="form-input"
                min="0"
                placeholder="0 if credit purchase or exceeding for advance"
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
                  Full Paid
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '11px', padding: '2px 8px' }}
                  onClick={() => setInitialPayment('')}
                >
                  Full Credit (₹0)
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
                  ✓ Bill fully covered! Surplus <strong>+{formatCurrency(thisBillAdvance)}</strong> will be credited as Advance Paid to Supplier.
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
                    <option value="Bank Transfer">Bank Transfer (RTGS/NEFT)</option>
                    <option value="UPI">UPI (PhonePe / GPay)</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Bank Ref / Voucher #</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. RTGS/SBI/1209"
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
              <span style={{ color: '#475569', fontWeight: 500 }}>This Inward Bill Due:</span>
              <span style={{ fontSize: '15px', fontWeight: 700, color: thisBillPending > 0 ? '#d97706' : '#10b981' }}>
                {thisBillPending > 0 ? formatCurrency(thisBillPending) : '₹0 (Settled)'}
              </span>
            </div>

            {thisBillAdvance > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#047857', fontWeight: 600 }}>Advance Paid on This Bill:</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#059669' }}>
                  +{formatCurrency(thisBillAdvance)}
                </span>
              </div>
            )}

            {existingAdvance > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#047857' }}>Previous Advance Available:</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#059669' }}>
                  {formatCurrency(existingAdvance)}
                </span>
              </div>
            )}

            {previousPayable > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#64748b' }}>Previous Payable to Supplier:</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#b45309' }}>
                  +{formatCurrency(previousPayable)}
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
                  {finalAdvanceAfter > 0 ? 'Net Advance with Supplier (After this Bill):' : 'Total Payable to Supplier (After this Bill):'}
                </span>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  {finalAdvanceAfter > 0
                    ? 'Surplus advance balance with vendor for future orders'
                    : (finalPayableAfter > 0 ? 'Net liability remaining on supplier khata' : 'Account fully balanced')}
                </div>
              </div>
              <span style={{
                fontSize: '18px',
                fontWeight: 800,
                color: finalAdvanceAfter > 0 ? '#059669' : (finalPayableAfter > 0 ? '#d97706' : '#10b981')
              }}>
                {finalAdvanceAfter > 0 ? `${formatCurrency(finalAdvanceAfter)} Advance` : formatCurrency(finalPayableAfter)}
              </span>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Notes / Transport Lorry Receipt #</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Received via VRL Logistics, LR #5541"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="modal-footer" style={{ margin: '16px -24px -24px', padding: '16px 24px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Save Purchase & Add to Stock
          </button>
        </div>
      </form>
    </Modal>
  );
};
