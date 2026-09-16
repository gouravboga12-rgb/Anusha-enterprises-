import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';

export const SupplierFormModal = ({ isOpen, onClose, supplier, onSave }) => {
  const [formData, setFormData] = useState({
    supplier_id: '',
    company_name: '',
    supplier_name: '',
    mobile: '',
    area: '',
    address: '',
    notes: ''
  });

  useEffect(() => {
    if (supplier) {
      setFormData(supplier);
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
    }
  }, [supplier, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.company_name.trim()) {
      alert('Please enter supplier company name');
      return;
    }
    onSave(formData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={supplier ? 'Edit Supplier Details' : 'Add New Supplier'}
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

        <div className="modal-footer" style={{ margin: '0 -24px -24px', padding: '16px 24px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {supplier ? 'Update Supplier' : 'Save Supplier'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
