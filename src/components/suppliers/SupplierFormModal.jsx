import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { Package, Search, CheckSquare, Square, Info, Plus, X } from 'lucide-react';

export const SupplierFormModal = ({ isOpen, onClose, supplier, onSave, dataService, currentUser }) => {
  const [formData, setFormData] = useState({
    supplier_id: '',
    company_name: '',
    supplier_name: '',
    mobile: '',
    area: '',
    address: '',
    notes: ''
  });

  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [dropdownSelectedId, setDropdownSelectedId] = useState('');

  const [, setTick] = useState(0);

  useEffect(() => {
    if (!dataService) return;
    return dataService.subscribe(() => setTick((t) => t + 1));
  }, [dataService]);

  const allProducts = (dataService ? dataService.getProducts() : []).filter((p) => p && p.is_active !== false);

  useEffect(() => {
    if (supplier) {
      setFormData(supplier);
      if (dataService && supplier.id) {
        const mapped = dataService.getSupplierProducts(supplier.id);
        setSelectedProductIds(mapped.map((p) => p.id));
      } else {
        setSelectedProductIds([]);
      }
    } else {
      setFormData({
        supplier_id: '',
        company_name: '',
        supplier_name: '',
        mobile: '',
        area: '',
        address: '',
        notes: ''
      });
      setSelectedProductIds([]);
    }
    setProductSearch('');
  }, [supplier, isOpen, dataService]);

  const toggleProduct = (productId) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleAddFromDropdown = (prodId) => {
    if (!prodId) return;
    if (!selectedProductIds.includes(prodId)) {
      setSelectedProductIds((prev) => [...prev, prodId]);
    }
    setDropdownSelectedId('');
  };

  const removeSelectedProduct = (prodId) => {
    setSelectedProductIds((prev) => prev.filter((id) => id !== prodId));
  };

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return allProducts;
    const q = productSearch.toLowerCase();
    return allProducts.filter((p) =>
      p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q))
    );
  }, [allProducts, productSearch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.company_name.trim()) {
      alert('Please enter supplier company name');
      return;
    }
    onSave(formData, selectedProductIds);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={supplier ? 'Edit Supplier Details' : 'Add New Supplier'}
      maxWidth="680px"
    >
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Supplier Code (Optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. SUPP-104"
              value={formData.supplier_id || ''}
              onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Contact Person Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Srinivas Rao"
              value={formData.supplier_name}
              onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Supplier Company / Firm Name *</label>
          <input
            type="text"
            className="form-input"
            required
            placeholder="e.g. Ideal Tech Industries Ltd"
            value={formData.company_name}
            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Mobile Number</label>
            <input
              type="tel"
              className="form-input"
              placeholder="e.g. 9866123456"
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Area / City Hub</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Hyderabad / Secunderabad"
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: e.target.value })}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Office / Warehouse Address</label>
          <textarea
            className="form-textarea"
            rows="2"
            placeholder="Complete address for inward dispatch"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Notes & Bank/Payment Terms</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Bank RTGS / Immediate 30% advance"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>

        {/* Products Supplied Multi-Select Section */}
        <div style={{ marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Package size={16} color="#0284c7" /> Products Supplied by this Vendor ({selectedProductIds.length} selected)
            </label>
            {selectedProductIds.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedProductIds([])}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  fontSize: '11.5px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Clear All ({selectedProductIds.length})
              </button>
            )}
          </div>

          {/* 1. Dropdown option to add products one after another */}
          <div style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                className="form-select"
                value={dropdownSelectedId}
                onChange={(e) => {
                  setDropdownSelectedId(e.target.value);
                  handleAddFromDropdown(e.target.value);
                }}
                style={{ flex: 1, fontSize: '13px' }}
              >
                <option value="">-- Choose product from dropdown to add --</option>
                {allProducts.map((p) => {
                  const alreadyAdded = selectedProductIds.includes(p.id);
                  return (
                    <option key={p.id} value={p.id} disabled={alreadyAdded}>
                      {alreadyAdded ? '✓ ' : '+ '} {p.name} ({p.sku || 'SKU'}) • Stock: {p.current_stock} {p.unit}
                    </option>
                  );
                })}
              </select>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
              Select a product from the list above to link it to this supplier one after another.
            </div>
          </div>

          {/* 2. Selected Products Badges / Chips */}
          {selectedProductIds.length > 0 && (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              marginBottom: '12px',
              padding: '8px 10px',
              background: '#f0f9ff',
              borderRadius: '8px',
              border: '1px solid #bae6fd'
            }}>
              {selectedProductIds.map((pid) => {
                const prod = allProducts.find((p) => p.id === pid);
                if (!prod) return null;
                return (
                  <span
                    key={pid}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#0284c7',
                      color: '#ffffff',
                      padding: '3px 9px',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: 500
                    }}
                  >
                    <span>{prod.name}</span>
                    <button
                      type="button"
                      onClick={() => removeSelectedProduct(pid)}
                      style={{
                        background: 'rgba(255,255,255,0.25)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '15px',
                        height: '15px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#fff',
                        padding: 0
                      }}
                      title="Remove product"
                    >
                      <X size={10} />
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          {/* 3. Search Filter */}
          <div style={{ position: 'relative', marginBottom: '8px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '32px', fontSize: '12px' }}
              placeholder="Or type to search & check from catalog list below..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
            />
          </div>

          <div style={{
            maxHeight: '160px',
            overflowY: 'auto',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '6px',
            backgroundColor: '#f8fafc'
          }}>
            {filteredProducts.length === 0 ? (
              <div style={{ padding: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                No products found
              </div>
            ) : (
              filteredProducts.map((p) => {
                const isSelected = selectedProductIds.includes(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => toggleProduct(p.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      marginBottom: '2px',
                      backgroundColor: isSelected ? '#e0f2fe' : 'transparent',
                      transition: 'background-color 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isSelected ? (
                        <CheckSquare size={16} color="#0284c7" />
                      ) : (
                        <Square size={16} color="#94a3b8" />
                      )}
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: isSelected ? 600 : 500, color: '#0f172a' }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          {p.sku} • Stock: {p.current_stock} {p.unit}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '11.5px', color: '#64748b' }}>
            <Info size={13} color="#0284c7" />
            <span>Note: Removing or updating products here will NOT affect or delete past purchase history.</span>
          </div>
        </div>

        <div className="modal-footer" style={{ margin: '16px -24px -24px', padding: '16px 24px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {supplier ? 'Update Supplier & Products' : 'Save Supplier & Products'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
