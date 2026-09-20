import React, { useState } from 'react';
import { X, ArrowLeftRight, AlertCircle, CheckCircle2, Warehouse } from 'lucide-react';
import { getTodayDateString, getCurrentTimeString } from '../../utils/formatters';

export const StockTransferModal = ({ isOpen, onClose, dataService, currentUser, defaultFromGodownId }) => {
  const godowns = dataService.getGodowns(false);
  const products = dataService.getProducts();

  const [form, setForm] = useState({
    from_godown_id: defaultFromGodownId || '',
    to_godown_id: '',
    product_id: '',
    quantity: '',
    date: getTodayDateString(),
    time: getCurrentTimeString(),
    reason: '',
    notes: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setError('');
    setSuccess('');
  };

  const availableQty = form.from_godown_id && form.product_id
    ? dataService.getProductStockInGodown(form.product_id, form.from_godown_id)
    : null;

  const fromGodown = dataService.getGodownById(form.from_godown_id);
  const toGodown = dataService.getGodownById(form.to_godown_id);
  const selectedProduct = products.find((p) => p.id === form.product_id);

  const handleTransfer = async () => {
    setError('');
    if (!form.from_godown_id) { setError('Please select the source godown.'); return; }
    if (!form.to_godown_id) { setError('Please select the destination godown.'); return; }
    if (!form.product_id) { setError('Please select a product.'); return; }
    if (!form.quantity || Number(form.quantity) <= 0) { setError('Enter a valid transfer quantity.'); return; }

    setSaving(true);
    try {
      const result = dataService.transferStock({
        from_godown_id: form.from_godown_id,
        to_godown_id: form.to_godown_id,
        product_id: form.product_id,
        quantity: Number(form.quantity),
        date: form.date,
        time: form.time,
        reason: form.reason,
        notes: form.notes
      }, currentUser);

      setSuccess(`✅ Transfer ${result.transfer_no} completed! ${form.quantity} ${selectedProduct?.unit || 'units'} transferred from ${fromGodown?.name} to ${toGodown?.name}.`);
      setForm({
        from_godown_id: defaultFromGodownId || '',
        to_godown_id: '',
        product_id: '',
        quantity: '',
        date: getTodayDateString(),
        time: getCurrentTimeString(),
        reason: '',
        notes: ''
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  // Products available in from-godown
  const availableProductsInGodown = form.from_godown_id
    ? dataService.getGodownStock(form.from_godown_id).filter((gs) => gs.quantity > 0)
    : [];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowLeftRight size={18} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>Transfer Stock</h2>
              <p style={{ fontSize: '11px', color: '#64748b' }}>Move stock between godowns without changing overall inventory</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', display: 'flex', gap: '8px', alignItems: 'flex-start', color: '#dc2626', fontSize: '13px' }}>
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '1px' }} /> {error}
            </div>
          )}
          {success && (
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '10px 14px', display: 'flex', gap: '8px', color: '#16a34a', fontSize: '13px' }}>
              <CheckCircle2 size={14} style={{ flexShrink: 0, marginTop: '1px' }} /> {success}
            </div>
          )}

          {/* From / To Godowns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '8px', alignItems: 'end' }}>
            <div>
              <label className="form-label">From Godown *</label>
              <select className="form-input" value={form.from_godown_id} onChange={(e) => handleChange('from_godown_id', e.target.value)}>
                <option value="">Select Source</option>
                {godowns.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div style={{ paddingBottom: '10px', color: '#7c3aed', fontWeight: 800 }}>
              <ArrowLeftRight size={20} />
            </div>
            <div>
              <label className="form-label">To Godown *</label>
              <select className="form-input" value={form.to_godown_id} onChange={(e) => handleChange('to_godown_id', e.target.value)}>
                <option value="">Select Destination</option>
                {godowns.filter((g) => g.id !== form.from_godown_id).map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
          </div>

          {/* Product */}
          <div>
            <label className="form-label">Product *</label>
            <select className="form-input" value={form.product_id} onChange={(e) => handleChange('product_id', e.target.value)}>
              <option value="">
                {form.from_godown_id ? `Select product (${availableProductsInGodown.length} available in ${fromGodown?.name})` : 'Select source godown first'}
              </option>
              {(form.from_godown_id ? availableProductsInGodown : products.map(p => ({ product_id: p.id, product: p }))).map((gs) => {
                const prod = gs.product || dataService.getProductById(gs.product_id);
                if (!prod) return null;
                return (
                  <option key={prod.id} value={prod.id}>
                    {prod.name} {form.from_godown_id ? `(${gs.quantity} ${prod.unit || 'units'} available)` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Available stock display */}
          {availableQty !== null && (
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Warehouse size={14} color="#0284c7" />
              <span style={{ fontSize: '13px', color: '#1d4ed8', fontWeight: 600 }}>
                Available in {fromGodown?.name}: <strong>{availableQty} {selectedProduct?.unit || 'units'}</strong>
              </span>
            </div>
          )}

          {/* Quantity */}
          <div>
            <label className="form-label">Transfer Quantity *</label>
            <input
              type="number" className="form-input" min="1"
              max={availableQty || undefined}
              placeholder={availableQty !== null ? `Max: ${availableQty}` : 'Enter quantity'}
              value={form.quantity}
              onChange={(e) => handleChange('quantity', e.target.value)}
            />
          </div>

          {/* Date & Time */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="form-label">Date *</label>
              <input type="date" className="form-input" value={form.date} onChange={(e) => handleChange('date', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Time</label>
              <input type="text" className="form-input" value={form.time} onChange={(e) => handleChange('time', e.target.value)} placeholder="HH:MM AM/PM" />
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="form-label">Reason / Purpose *</label>
            <input type="text" className="form-input" placeholder="e.g. Godown 2 replenishment" value={form.reason}
              onChange={(e) => handleChange('reason', e.target.value)} />
          </div>

          <div>
            <label className="form-label">Notes (optional)</label>
            <textarea className="form-input" rows={2} placeholder="Additional notes..." value={form.notes}
              onChange={(e) => handleChange('notes', e.target.value)} />
          </div>

          {/* Summary Preview */}
          {form.from_godown_id && form.to_godown_id && form.product_id && form.quantity && (
            <div style={{ background: '#f5f3ff', border: '1px solid #c4b5fd', borderRadius: '10px', padding: '14px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#7c3aed', marginBottom: '8px' }}>TRANSFER PREVIEW</div>
              <div style={{ fontSize: '13px', color: '#1e1b4b' }}>
                <strong>{selectedProduct?.name}</strong>: {form.quantity} {selectedProduct?.unit || 'units'}
                <br />
                <span style={{ color: '#dc2626' }}>{fromGodown?.name}: {availableQty} → {Math.max(0, (availableQty || 0) - Number(form.quantity))}</span>
                <br />
                <span style={{ color: '#059669' }}>{toGodown?.name}: +{form.quantity}</span>
                <br />
                <span style={{ color: '#64748b', fontSize: '11px' }}>Overall stock: unchanged</span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-primary" onClick={handleTransfer} disabled={saving} style={{ flex: 1, background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
              {saving ? 'Transferring...' : <><ArrowLeftRight size={14} /> Execute Transfer</>}
            </button>
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};
