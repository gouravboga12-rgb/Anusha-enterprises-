import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { Package, Search, CheckSquare, Square, Info } from 'lucide-react';

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

  const allProducts = useMemo(() => {
    if (!dataService) return [];
    return dataService.getProducts().filter((p) => p.is_active !== false);
  }, [dataService]);

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
              <Package size={15} color="#0284c7" /> Products Supplied by this Vendor ({selectedProductIds.length} selected)
            </label>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Used to suggest this supplier during inward purchase
            </span>
          </div>

          <div style={{ position: 'relative', marginBottom: '8px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '32px', fontSize: '12px' }}
              placeholder="Filter catalog products..."
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
