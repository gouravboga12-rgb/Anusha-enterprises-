// Cloudinary unsigned upload service for Anusha Enterprises CRM

export const CLOUDINARY_CONFIG = {
  cloudName: 'df7cgufv',
  uploadPreset: 'anusha_products',
  apiUrl: 'https://api.cloudinary.com/v1_1/df7cgufv/image/upload'
};

/**
 * Uploads a file directly to Cloudinary using unsigned upload preset
 * Works on any device (Mobile camera, gallery, or desktop)
 */
export const uploadImageToCloudinary = async (file) => {
  if (!file) throw new Error('No file provided');

  // Try direct Cloudinary upload
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);

    const response = await fetch(CLOUDINARY_CONFIG.apiUrl, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.warn('Cloudinary upload warning:', errData);
      // Fallback to local DataURL for uninterrupted testing
      return await fileToDataUrl(file);
    }

    const data = await response.json();
    return {
      url: data.secure_url,
      public_id: data.public_id,
      format: data.format,
      width: data.width,
      height: data.height
    };
  } catch (err) {
    console.warn('Network issue reaching Cloudinary, using offline preview fallback:', err);
    return await fileToDataUrl(file);
  }
};

/**
 * Helper to convert browser File to local Base64 Data URL
 */
export const fileToDataUrl = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ url: reader.result, public_id: 'local-' + Date.now() });
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};
