import React, { useState } from 'react';
import { X, Warehouse, Save, Archive, AlertCircle } from 'lucide-react';

export const GodownFormModal = ({ isOpen, onClose, godown, dataService, currentUser, onArchive }) => {
  const isEdit = !!godown;
  const [form, setForm] = useState({
    name: godown?.name || '',
    code: godown?.code || '',
    location: godown?.location || '',
    contact_person: godown?.contact_person || '',
    notes: godown?.notes || '',
    is_active: godown?.is_active !== false
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleChange = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Godown name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      dataService.saveGodown({ ...godown, ...form }, currentUser);
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = () => {
    if (!godown) return;
    if (window.confirm(`Archive "${godown.name}"? It will be deactivated if it has no stock or history.`)) {
      try {
        onArchive(godown);
        onClose();
      } catch (e) {
        setError(e.message);
      }
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Warehouse size={20} color="#0284c7" />
            <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
              {isEdit ? `Edit Godown — ${godown.name}` : 'Create New Godown'}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'flex-start', color: '#dc2626', fontSize: '13px' }}>
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '1px' }} /> {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Godown Name *</label>
              <input className="form-input" placeholder="e.g. Main Godown, Godown 2" value={form.name}
                onChange={(e) => handleChange('name', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Godown Code</label>
              <input className="form-input" placeholder="e.g. GD-01" value={form.code}
                onChange={(e) => handleChange('code', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Contact Person</label>
              <input className="form-input" placeholder="Person in charge" value={form.contact_person}
                onChange={(e) => handleChange('contact_person', e.target.value)} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Location / Address</label>
              <input className="form-input" placeholder="Nandipet, Nizamabad" value={form.location}
                onChange={(e) => handleChange('location', e.target.value)} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Notes</label>
              <textarea className="form-input" rows={2} placeholder="Any additional notes..." value={form.notes}
                onChange={(e) => handleChange('notes', e.target.value)} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                <input type="checkbox" checked={form.is_active} onChange={(e) => handleChange('is_active', e.target.checked)}
                  style={{ width: '16px', height: '16px' }} />
                Active (deselect to deactivate)
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '24px', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ flex: 1 }}>
              {saving ? 'Saving...' : <><Save size={14} /> {isEdit ? 'Save Changes' : 'Create Godown'}</>}
            </button>
            {isEdit && !godown.is_default && (
              <button className="btn btn-secondary" onClick={handleArchive} style={{ color: '#d97706', borderColor: '#fde68a' }}>
                <Archive size={14} /> Archive
              </button>
            )}
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};
