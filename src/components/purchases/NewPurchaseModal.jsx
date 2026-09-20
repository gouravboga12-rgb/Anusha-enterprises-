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

  const [supplierId, setSupplierId] = useState(initialSupplierId);
  const [godownId, setGodownId] = useState(godowns[0]?.id || '');
  const [date, setDate] = useState(getTodayDateString());
  const [time, setTime] = useState(getCurrentTimeString());
  const [items, setItems] = useState([
    { product_id: products[0]?.id || '', quantity: 10, purchase_price: products[0]?.purchase_price || 0 }
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
      setSupplierId(initialSupplierId || '');
      setGodownId(godowns[0]?.id || '');
      setDate(getTodayDateString());
      setTime(getCurrentTimeString());
      setItems(
        products.length > 0
          ? [{ product_id: products[0].id, quantity: 10, purchase_price: products[0].purchase_price || 0 }]
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

  const supplierLedger = supplierId ? dataService.getSupplierLedger(supplierId) : null;
  const previousPayable = supplierLedger ? (supplierLedger.pendingBalance || 0) : 0;
  const thisBillPending = Math.max(0, totalBillAmount - (Number(initialPayment) || 0));
  const totalSupplierPayableAfterPurchase = previousPayable + thisBillPending;

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
          </div>

          <div className="form-group" style={{ flex: 1.2 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Warehouse size={13} color="#0284c7" /> Destination Godown *
            </label>
            <select
              className="form-select"
              required
              value={godownId}
              onChange={(e) => setGodownId(e.target.value)}
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

          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
            <table className="data-table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ width: '45%' }}>Product</th>
                  <th style={{ width: '18%' }}>Quantity</th>
                  <th style={{ width: '22%' }}>Purchase Price (₹)</th>
                  <th style={{ width: '15%', textAlign: 'right' }}>Total</th>
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
                          {products.map((p) => {
                            const inG = dataService.getProductStockInGodown(p.id, godownId);
                            return (
                              <option key={p.id} value={p.id}>
                                {p.name} (Godown Stock: {inG} | Total: {p.current_stock} {p.unit})
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
                max={totalBillAmount}
                placeholder="0 if credit purchase"
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
                {formatCurrency(thisBillPending)}
              </span>
            </div>

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
                  Total Payable to Supplier (After this Bill):
                </span>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  {previousPayable > 0
                    ? `Previous (${formatCurrency(previousPayable)}) + This Bill (${formatCurrency(thisBillPending)})`
                    : 'Net liability on supplier khata'}
                </div>
              </div>
              <span style={{ fontSize: '18px', fontWeight: 800, color: totalSupplierPayableAfterPurchase > 0 ? '#d97706' : '#10b981' }}>
                {formatCurrency(totalSupplierPayableAfterPurchase)}
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
