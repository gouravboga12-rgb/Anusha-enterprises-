import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { ImageUploader } from '../common/ImageUploader';

const STANDARD_UNITS = [
  { value: 'Boxes', label: 'Boxes' },
  { value: 'Units', label: 'Units / Pieces' },
  { value: 'Packets', label: 'Packets' },
  { value: 'Meters', label: 'Meters' },
  { value: 'Pieces', label: 'Pieces' },
  { value: 'Kg', label: 'Kilograms (Kg)' },
  { value: 'Sets', label: 'Sets' },
  { value: 'Bags', label: 'Bags' },
  { value: 'Rolls', label: 'Rolls' },
  { value: 'Litres', label: 'Litres' }
];

export const ProductFormModal = ({ isOpen, onClose, product, onSave, zIndex = 1100 }) => {
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    current_stock: 0,
    unit: 'Boxes',
    purchase_price: '',
    selling_price: '',
    min_stock_alert: 20,
    is_active: true,
    image_url: '',
    description: ''
  });
  const [isCustomUnit, setIsCustomUnit] = useState(false);
  const [customUnitText, setCustomUnitText] = useState('');

  useEffect(() => {
    if (product) {
      setFormData(product);
      const isStd = STANDARD_UNITS.some(
        (u) => u.value.toLowerCase() === (product.unit || '').toLowerCase()
      );
      if (product.unit && !isStd) {
        setIsCustomUnit(true);
        setCustomUnitText(product.unit);
      } else {
        setIsCustomUnit(false);
        setCustomUnitText('');
      }
    } else {
      setFormData({
        sku: '',
        name: '',
        current_stock: 0,
        unit: 'Boxes',
        purchase_price: '',
        selling_price: '',
        min_stock_alert: 20,
        is_active: true,
        image_url: '',
        description: ''
      });
      setIsCustomUnit(false);
      setCustomUnitText('');
    }
  }, [product, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter product name');
      return;
    }
    const finalUnit = isCustomUnit
      ? (customUnitText.trim() || 'Units')
      : (formData.unit || 'Units');

    if (onSave) {
      await onSave({
        ...formData,
        unit: finalUnit,
        current_stock: formData.current_stock !== '' && formData.current_stock !== undefined ? Number(formData.current_stock) : 0,
        min_stock_alert: formData.min_stock_alert !== '' && formData.min_stock_alert !== undefined ? Number(formData.min_stock_alert) : 0,
        purchase_price: formData.purchase_price !== '' && formData.purchase_price !== undefined ? Number(formData.purchase_price) : 0,
        selling_price: formData.selling_price !== '' && formData.selling_price !== undefined ? Number(formData.selling_price) : 0
      });
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product ? 'Edit Product Details' : 'Add New Product to Catalog'}
      zIndex={zIndex}
    >
      <form onSubmit={handleSubmit}>
        {/* Cloudinary Direct Image Uploader */}
        <ImageUploader
          currentImageUrl={formData.image_url}
          onImageUploaded={(url, publicId) => {
            setFormData({
              ...formData,
              image_url: url,
              cloudinary_public_id: publicId
            });
          }}
        />

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Product SKU / ID</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. IBB-001"
              value={formData.sku || ''}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Packaging Unit</label>
            <select
              className="form-select"
              value={isCustomUnit ? 'custom' : (formData.unit || 'Boxes')}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'custom') {
                  setIsCustomUnit(true);
                  if (!customUnitText) setCustomUnitText('');
                } else {
                  setIsCustomUnit(false);
                  setFormData({ ...formData, unit: val });
                }
              }}
            >
              {STANDARD_UNITS.map((u) => (
                <option key={u.value} value={u.value}>{u.label}</option>
              ))}
              <option value="custom">+ Custom / Type Unit...</option>
            </select>

            {isCustomUnit && (
              <div style={{ marginTop: '6px' }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ borderColor: '#6366f1', background: '#fdf4ff' }}
                  placeholder="Type custom unit (e.g. Meters, Rolls, Bags, Bundles)"
                  value={customUnitText}
                  onChange={(e) => setCustomUnitText(e.target.value)}
                  autoFocus
                />
                <span style={{ fontSize: '11px', color: '#6366f1', fontWeight: 600 }}>
                  Enter custom measurement or packaging unit
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Product Name *</label>
          <input
            type="text"
            className="form-input"
            required
            placeholder="e.g. Ideal Boost Box"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Default Purchase Rate (₹)</label>
            <input
              type="number"
              className="form-input"
              min="0"
              placeholder="e.g. 450"
              value={formData.purchase_price}
              onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Default Selling Price (₹)</label>
            <input
              type="number"
              className="form-input"
              min="0"
              placeholder="e.g. 650"
              value={formData.selling_price}
              onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{product ? 'Current Stock Quantity' : 'Initial Opening Stock'}</label>
            <input
              type="number"
              className="form-input"
              min="0"
              placeholder="0"
              value={formData.current_stock === 0 ? '0' : (formData.current_stock ?? '')}
              onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Low Stock Alert Quantity</label>
            <input
              type="number"
              className="form-input"
              min="0"
              value={formData.min_stock_alert === 0 ? '0' : (formData.min_stock_alert ?? '')}
              onChange={(e) => setFormData({ ...formData, min_stock_alert: e.target.value })}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Product Description / Notes</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. 90W heavy duty surge protection model"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="modal-footer" style={{ margin: '0 -24px -24px', padding: '16px 24px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {product ? 'Update Product' : 'Save Product'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
