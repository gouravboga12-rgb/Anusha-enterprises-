import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';

export const CustomerFormModal = ({ isOpen, onClose, customer, onSave, zIndex = 1100 }) => {
  const [formData, setFormData] = useState({
    customer_id: '',
    name: '',
    mobile: '',
    area: '',
    address: '',
    status: 'active',
    notes: ''
  });

  useEffect(() => {
    if (customer) {
      setFormData(customer);
    } else {
      setFormData({
        customer_id: '',
        name: '',
        mobile: '',
        area: '',
        address: '',
        status: 'active',
        notes: ''
      });
    }
  }, [customer, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter customer name');
      return;
    }
    if (onSave) {
      await onSave(formData);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={customer ? 'Edit Customer Account' : 'Add New Customer'}
      zIndex={zIndex}
    >
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Customer ID / Code (Optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. CUST-105"
              value={formData.customer_id || ''}
              onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Customer / Business Name *</label>
          <input
            type="text"
            className="form-input"
            required
            placeholder="e.g. Sri Sai Electricals"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Mobile Number</label>
            <input
              type="tel"
              className="form-input"
              placeholder="e.g. 9848012345"
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Area / Location</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Nandipet Main Road"
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: e.target.value })}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Address</label>
          <textarea
            className="form-textarea"
            rows="2"
            placeholder="Shop address or delivery landmark"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Notes / Credit Terms</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Pays via UPI within 15 days"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>

        <div className="modal-footer" style={{ margin: '0 -24px -24px', padding: '16px 24px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {customer ? 'Update Customer' : 'Save Customer Account'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
