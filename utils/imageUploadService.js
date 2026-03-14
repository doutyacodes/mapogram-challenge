import axios from 'axios';

export class ImageUploadService {
  static async uploadToCPanel(file, type = 'photo') {
    if (!file) return null;
    
    const formData = new FormData();
    formData.append('coverImage', file);
    formData.append('type', type);
    
    try {
      const response = await axios.post(
        'https://wowfy.in/newsonmap/upload.php',
        formData,
        { 
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 30000 // 30 second timeout
        }
      );
      
      if (response.data.success) {
        return {
          success: true,
          filePath: response.data.filePath,
          url: response.data.filePath
        };
      }
      
      throw new Error(response.data.error || 'Upload failed');
    } catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to upload image'
      };
    }
  }

  static validateImageFile(file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Please select a valid image file (JPEG, PNG, or WebP)' };
    }

    if (file.size > maxSize) {
      return { valid: false, error: 'Image size should be less than 5MB' };
    }

    return { valid: true };
  }

  static createImagePreview(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}