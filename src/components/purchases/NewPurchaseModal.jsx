import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Plus, Trash2, AlertCircle, Warehouse, Sparkles, Building2, FileText, UserPlus } from 'lucide-react';
import { formatCurrency, getTodayDateString, getCurrentTimeString } from '../../utils/formatters';
import { SupplierFormModal } from '../suppliers/SupplierFormModal';

export const NewPurchaseModal = ({
  isOpen,
  onClose,
  dataService,
  currentUser,
  initialSupplierId = '',
  onPurchaseCreated,
  onOpenPayment,
  onViewInvoice
}) => {
  const suppliers = dataService.getSuppliers();
  const products = dataService.getProducts();
  const godowns = dataService.getGodowns();

  // Helper to filter products for the selected supplier
  const getSupplierFilteredProducts = (sId) => {
    if (!sId) return products;
    const mapped = dataService.getSupplierProducts(sId);
    if (!mapped || mapped.length === 0) return products;
    return products.filter((p) => mapped.some((m) => m.product_id === p.id));
  };

  const [supplierId, setSupplierId] = useState(initialSupplierId);
  const [godownId, setGodownId] = useState(godowns[0]?.id || '');
  const [date, setDate] = useState(getTodayDateString());
  const [time, setTime] = useState(getCurrentTimeString());
  const [items, setItems] = useState([
    {
      product_id: products[0]?.id || '',
      godown_id: godowns[0]?.id || '',
      quantity: 10,
      unit: products[0]?.unit || 'Units',
      purchase_price: products[0]?.purchase_price || 0
    }
  ]);
  const [initialPayment, setInitialPayment] = useState('');
  const [paymentMode, setPaymentMode] = useState('Bank Transfer');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isQuickSupplierOpen, setIsQuickSupplierOpen] = useState(false);

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
          ? [{
              product_id: availableProds[0].id,
              godown_id: godowns[0]?.id || '',
              quantity: 10,
              unit: availableProds[0].unit || 'Units',
              purchase_price: availableProds[0].purchase_price || 0
            }]
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
      unit: updated[index].unit || prod?.unit || 'Units',
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
    const defProd = availableProds[0];
    setItems([
      ...items,
      {
        product_id: defProd.id,
        godown_id: godownId || godowns[0]?.id || '',
        quantity: 10,
        unit: defProd.unit || 'Units',
        purchase_price: defProd.purchase_price || 0
      }
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
  const netPayableAfter = (previousPayable - existingAdvance) + (totalBillAmount - numPayment);
  const finalPayableAfter = Math.max(0, netPayableAfter);
  const finalAdvanceAfter = Math.max(0, -netPayableAfter);

  const handleSubmit = (e, generateInvoice = false) => {
    if (e) e.preventDefault();
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

      if (generateInvoice && onViewInvoice) {
        onViewInvoice(pur);
      }
    } catch (err) {
      setError(err.message || 'Failed to record supplier purchase');
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Record Supplier Inward Purchase (Stock In)"
        maxWidth="840px"
      >
        <form onSubmit={(e) => handleSubmit(e, false)}>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
              {error}
            </div>
          )}

          {/* Row 1: Supplier & Destination Godown */}
          <div className="form-row">
            <div className="form-group" style={{ flex: 1.8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label className="form-label" style={{ margin: 0, fontWeight: 700 }}>Select Supplier *</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {suggestedSupplierIds.size > 0 && (
                    <span style={{ fontSize: '11px', color: '#0284c7', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Sparkles size={12} /> {suggestedSupplierIds.size} mapped
                    </span>
                  )}
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      color: '#0284c7',
                      borderColor: '#bae6fd',
                      background: '#f0f9ff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: 700
                    }}
                    onClick={() => setIsQuickSupplierOpen(true)}
                    title="Directly add a new supplier without leaving this purchase"
                  >
                    <UserPlus size={12} /> + Add New Supplier
                  </button>
                </div>
              </div>
              <select
                className="form-select"
                required
                value={supplierId}
                onChange={(e) => {
                  if (e.target.value === '__CREATE_NEW__') {
                    setIsQuickSupplierOpen(true);
                  } else {
                    setSupplierId(e.target.value);
                  }
                }}
              >
                <option value="">-- Choose Supplier --</option>
                <option value="__CREATE_NEW__" style={{ fontWeight: 700, color: '#0284c7', background: '#f0f9ff' }}>
                  ➕ + Add New Supplier...
                </option>
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
                    ✨ Surplus Advance with Supplier: <strong>{formatCurrency(existingAdvance)}</strong>
                  </span>
                  <span style={{ fontSize: '11px', color: '#065f46' }}>
                    Will be adjusted against this purchase
                  </span>
                </div>
              )}
            </div>

            <div className="form-group" style={{ flex: 1.2 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700 }}>
                <Warehouse size={14} color="#0284c7" />
                <span>Destination Godown *</span>
              </label>
              <select
                className="form-select"
                required
                value={godownId}
                onChange={(e) => setGodownId(e.target.value)}
              >
                {godowns.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.code || 'GD'}) — {g.location || 'Hub'}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', display: 'block' }}>
                Stock will be received into this godown
              </span>
            </div>
          </div>

          {/* Row 2: Date & Time */}
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

          {/* Products Inward Line Items */}
          <div style={{ marginTop: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ margin: 0, fontWeight: 700 }}>Products Inward</label>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={addItemRow}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
              >
                <Plus size={14} /> Add Product Line
              </button>
            </div>

            {/* Desktop Table View (>= 640px) */}
            <div className="table-responsive desktop-table-view" style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '30%' }}>PRODUCT</th>
                    <th style={{ width: '25%' }}>DESTINATION GODOWN</th>
                    <th style={{ width: '22%' }}>QUANTITY & TYPE</th>
                    <th style={{ width: '13%' }}>PURCHASE PRICE (₹)</th>
                    <th style={{ width: '10%', textAlign: 'right' }}>TOTAL</th>
                    <th style={{ width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const lineTotal = (Number(item.quantity) || 0) * (Number(item.purchase_price) || 0);
                    const isCustomUnit = !['Units', 'Boxes', 'Packets', 'Meters', 'Pieces', 'Kg'].includes(item.unit);

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
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <input
                              type="number"
                              className="form-input"
                              min="1"
                              style={{ width: '65px' }}
                              value={item.quantity}
                              onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                            />
                            <select
                              className="form-select"
                              style={{ flex: 1, minWidth: '85px', fontSize: '12px', padding: '6px 4px' }}
                              value={isCustomUnit ? 'Custom' : item.unit}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === 'Custom') {
                                  handleItemChange(idx, 'unit', '');
                                } else {
                                  handleItemChange(idx, 'unit', val);
                                }
                              }}
                            >
                              <option value="Units">Units</option>
                              <option value="Boxes">Boxes</option>
                              <option value="Packets">Packets</option>
                              <option value="Meters">Meters</option>
                              <option value="Pieces">Pieces</option>
                              <option value="Kg">Kg</option>
                              <option value="Custom">Custom...</option>
                            </select>
                          </div>
                          {isCustomUnit && (
                            <input
                              type="text"
                              className="form-input"
                              style={{ fontSize: '11px', marginTop: '4px', padding: '3px 6px' }}
                              placeholder="Type unit (e.g. Rolls, Bags)"
                              value={item.unit || ''}
                              onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                              autoFocus
                            />
                          )}
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
                const isCustomUnit = !['Units', 'Boxes', 'Packets', 'Meters', 'Pieces', 'Kg'].includes(item.unit);

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

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '3px' }}>
                          Quantity & Unit Type
                        </label>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <input
                            type="number"
                            className="form-input"
                            min="1"
                            style={{ width: '60px' }}
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          />
                          <select
                            className="form-select"
                            style={{ flex: 1, fontSize: '11.5px', padding: '4px' }}
                            value={isCustomUnit ? 'Custom' : item.unit}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === 'Custom') {
                                handleItemChange(idx, 'unit', '');
                              } else {
                                handleItemChange(idx, 'unit', val);
                              }
                            }}
                          >
                            <option value="Units">Units</option>
                            <option value="Boxes">Boxes</option>
                            <option value="Packets">Packets</option>
                            <option value="Meters">Meters</option>
                            <option value="Pieces">Pieces</option>
                            <option value="Kg">Kg</option>
                            <option value="Custom">Custom...</option>
                          </select>
                        </div>
                        {isCustomUnit && (
                          <input
                            type="text"
                            className="form-input"
                            style={{ fontSize: '11px', marginTop: '4px', padding: '3px 6px' }}
                            placeholder="Type unit (e.g. Rolls)"
                            value={item.unit || ''}
                            onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                          />
                        )}
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
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        Item Total ({item.quantity} {item.unit || 'Units'}):
                      </span>
                      <strong style={{ fontSize: '15px', color: '#0284c7' }}>{formatCurrency(lineTotal)}</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Inward Bill Total and Payment Section */}
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

            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label" style={{ fontWeight: 600 }}>
                Immediate Payment Made to Supplier (₹)
              </label>
              <input
                type="number"
                className="form-input"
                min="0"
                placeholder="0 if credit purchase or exceeding for advance"
                value={initialPayment}
                onChange={(e) => setInitialPayment(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '11px', padding: '2px 8px' }}
                  onClick={() => setInitialPayment(String(totalBillAmount))}
                >
                  Full Paid
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '11px', padding: '2px 8px' }}
                  onClick={() => setInitialPayment('0')}
                >
                  Full Credit (₹0)
                </button>
              </div>
            </div>

            {numPayment > 0 && (
              <div className="form-row" style={{ marginBottom: '12px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Payment Mode</label>
                  <select
                    className="form-select"
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                  >
                    <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                    <option value="UPI">UPI / PhonePe / GPay</option>
                    <option value="Cash">Cash (Hand-to-Hand)</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Ref / Transaction / Cheque #</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. UTR-98491..."
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div style={{
              borderTop: '1px dashed #cbd5e1',
              paddingTop: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '13px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                <span>This Inward Bill Due:</span>
                <span style={{ fontWeight: 700, color: thisBillPending > 0 ? '#e11d48' : '#10b981' }}>
                  {formatCurrency(thisBillPending)}
                </span>
              </div>

              {thisBillAdvance > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#047857' }}>
                  <span>Excess Advance Paid with this Purchase:</span>
                  <span style={{ fontWeight: 700 }}>+{formatCurrency(thisBillAdvance)}</span>
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

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Notes / Transport Lorry Receipt #</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Received via VRL Logistics, LR #5541"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="modal-footer" style={{ margin: '16px -24px -24px', padding: '16px 24px', display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={(e) => handleSubmit(e, true)}
              style={{
                background: '#f0f9ff',
                color: '#0284c7',
                borderColor: '#bae6fd',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Save purchase and immediately open printable invoice"
            >
              <FileText size={16} /> Save & Generate Invoice
            </button>
            <button type="submit" className="btn btn-primary" style={{ fontWeight: 700 }}>
              Save Purchase & Add to Stock
            </button>
          </div>
        </form>
      </Modal>

      {/* Embedded Quick Add Supplier Modal */}
      <SupplierFormModal
        isOpen={isQuickSupplierOpen}
        onClose={() => setIsQuickSupplierOpen(false)}
        supplier={null}
        dataService={dataService}
        currentUser={currentUser}
        onSave={async (sData, prodIds) => {
          const newS = await dataService.saveSupplier(sData, currentUser);
          if (prodIds && newS?.id) {
            await dataService.saveSupplierProducts(newS.id, prodIds, currentUser);
          }
          if (newS?.id) {
            setSupplierId(newS.id);
            setIsQuickSupplierOpen(false);
          }
        }}
      />
    </>
  );
};
