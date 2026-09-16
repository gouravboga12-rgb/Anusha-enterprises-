import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, X, CheckCircle2, Loader2 } from 'lucide-react';
import { uploadImageToCloudinary } from '../../api/cloudinaryService';

export const ImageUploader = ({ currentImageUrl, onImageUploaded }) => {
  const [previewUrl, setPreviewUrl] = useState(currentImageUrl || '');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    setError('');
    setIsUploading(true);

    try {
      const res = await uploadImageToCloudinary(file);
      setPreviewUrl(res.url);
      if (onImageUploaded) {
        onImageUploaded(res.url, res.public_id);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setPreviewUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onImageUploaded) onImageUploaded('', '');
  };

  return (
    <div className="form-group">
      <label className="form-label">Product Image (Cloudinary Direct Upload)</label>
      
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
      />

      {previewUrl ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '12px',
          border: '1px solid #bae6fd',
          borderRadius: '10px',
          background: '#f0f9ff'
        }}>
          <img
            src={previewUrl}
            alt="Preview"
            style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #cbd5e1' }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0284c7', fontSize: '13px', fontWeight: 600 }}>
              <CheckCircle2 size={16} color="#10b981" /> Image Uploaded & Stored
            </div>
            <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              Cloudinary Ready: Preset `anusha_products`
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleClear}
            title="Remove image"
          >
            <X size={14} /> Remove
          </button>
        </div>
      ) : (
        <div
          className="upload-dropzone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
        >
          {isUploading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#0284c7' }}>
              <Loader2 size={28} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Uploading to Cloudinary...</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UploadCloud size={22} color="#0284c7" />
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                Click to browse or take photo (Drag & Drop)
              </div>
              <p style={{ fontSize: '11px', color: '#64748b' }}>
                Supports PNG, JPG, WebP from Mobile camera or PC
              </p>
            </div>
          )}
        </div>
      )}

      {error && (
        <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px' }}>{error}</p>
      )}
    </div>
  );
};
