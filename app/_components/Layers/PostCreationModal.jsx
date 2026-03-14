import React, { useState, useEffect } from 'react';
import { X, Upload, MapPin, Clock, Building2, User, Crown, Shield } from 'lucide-react';
import { getUserFromToken } from '@/utils/auth';
import { ImageUploadService } from '@/utils/imageUploadService';
import MapLocationPicker from '../MapLocationPicker';

const PostCreationModal = ({ isOpen, onClose, layer, onPostCreated }) => {

  const getDefaultDeleteHours = () => {
    if (layer.name === 'Jobs') {
      return 168; // 1 week default for Jobs layer
    }
    return 24; // 24 hours default for City layer
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    latitude: null,
    longitude: null,
    deleteAfterHours: getDefaultDeleteHours(),
    isPermanent: false,
    postedAs: 'admin'
  });

  const [jobLink, setJobLink] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [communities, setCommunities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [userCompanies, setUserCompanies] = useState([]);
  const [userData, setUserData] = useState(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchInitialData();
    }
  }, [isOpen]);

  useEffect(() => {
    fetchCategoriesForLayer(layer.id);
  }, [layer]);

  useEffect(() => {
    if (layer.name === 'Jobs' && formData.categoryId) {
      const selectedCategory = categories.find(cat => cat.id === formData.categoryId);
      const categoryName = selectedCategory?.name?.toLowerCase();
      
      if (categoryName === 'gigs') {
        setFormData(prev => ({ ...prev, deleteAfterHours: 24 })); // 1 day for gigs
      } else {
        setFormData(prev => ({ ...prev, deleteAfterHours: 168 })); // 1 week for jobs/internships
      }
    }
  }, [formData.categoryId, categories, layer.name]);

  const fetchCategoriesForLayer = async (layerId) => {
    try {
      const res = await fetch(`/api/layers/post/categories?layerId=${layerId}`);
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchInitialData = async () => {
    try {
      const user = getUserFromToken();
      setUserData(user);

      await fetchCategoriesForLayer(layer.id);

      if (layer.name === 'Jobs'){
        const companiesRes = await fetch('/api/user/companies');
        const companiesData = await companiesRes.json();
        setUserCompanies(companiesData.companies || []);
      }

    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };


  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleLocationChange = (lat, lng) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng
    }));
    setShowLocationPicker(false);
  };

  const getDeleteOptions = () => {
    if (layer.name === 'Jobs') {
      // Get selected category to determine if it's Jobs/Internship or Gigs
      const selectedCategory = categories.find(cat => cat.id === formData.categoryId);
      const categoryName = selectedCategory?.name?.toLowerCase();
      
      if (categoryName === 'gigs') {
        return [
          { value: 24, label: '1 day' },
          { value: 48, label: '2 days' },
          { value: 72, label: '3 days' }
        ];
      } else {
        // For Jobs and Internships
        return [
          { value: 168, label: '1 week' }, // 7 days * 24 hours
          { value: 336, label: '2 weeks' }, // 14 days * 24 hours
          { value: 720, label: '1 month' } // 30 days * 24 hours
        ];
      }
    } else {
      // Default for City layer
      return [
        { value: 24, label: '24 hours' },
        { value: 36, label: '36 hours' },
        { value: 48, label: '48 hours' }
      ];
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.categoryId || !formData.latitude || !formData.longitude) {
      alert('Please fill in all required fields');
      return;
    }

    if (layer.name === 'Jobs' && !jobLink) {
      alert('Job link is required for Jobs layer');
      return;
    }

    setLoading(true);

    try {
      let imageFileName = null;

      if (selectedImage) {
        setUploading(true);
        const result = await ImageUploadService.uploadToCPanel(selectedImage);
        if (result.success) {
          imageFileName = result.filePath;
        } else {
          throw new Error(result.error);
        }
        setUploading(false);
      }

      const postData = {
        ...formData,
        layerId: layer.id,
        layerName: layer.name,
        imageFileName,
        jobLink: layer.name === 'Jobs' ? jobLink : null,
        postedByCompanyId: formData.postedAs === 'user' ? null : parseInt(formData.postedAs)
      };

      const response = await fetch('/api/layers/post/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });


      if (!response.ok) {
        throw new Error('Failed to create post');
      }

      const result = await response.json();
      
      if (onPostCreated) {
        onPostCreated(result);
      }
      
      handleClose();
      
    } catch (error) {
      console.log("error",error)
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      categoryId: '',
      latitude: null,
      longitude: null,
      deleteAfterHours: getDefaultDeleteHours(),
      isPermanent: false,
      postedAs: 'admin'
    });
    setSelectedImage(null);
    setImagePreview(null);
    setJobLink(''); // Add this line
    setShowLocationPicker(false);
    onClose();
  };

  const isAdmin = userData?.role === 'admin';
  const isModerator = userData?.role === 'moderator';
  const canMakePermanent = isAdmin || isModerator;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      <div className="relative w-full max-w-2xl max-h-[95vh] bg-white rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-blue-600 text-white p-4 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isAdmin && <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300" />}
            {isModerator && <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-300" />}
            <h2 className="text-lg sm:text-xl font-bold">Create New Post</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-blue-500 rounded-full transition-colors"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-80px)] sm:max-h-[calc(95vh-100px)]">
          <div className="space-y-4 sm:space-y-6">

            {layer.name === 'Jobs' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Posting As
                </label>
                <select
                  value={formData.postedAs}
                  onChange={(e) => setFormData(prev => ({ ...prev, postedAs: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="admin">{userData?.name || 'Admin'}</option>
                  {userCompanies.map(company => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter post title"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter post description (optional)"
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Image
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center hover:border-blue-500 transition-colors">
                {imagePreview ? (
                  <div className="space-y-3">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-32 sm:h-48 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview(null);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Remove Image
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto" />
                    <div>
                      <label className="cursor-pointer">
                        <span className="text-blue-600 hover:text-blue-800 font-medium">
                          Click to upload
                        </span>
                        <span className="text-gray-500 hidden sm:inline"> or drag and drop</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {layer.name === 'Jobs' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Job Link *
                </label>
                <input
                  type="url"
                  value={jobLink}
                  onChange={(e) => setJobLink(e.target.value)}
                  placeholder="Enter job portal link or company hiring page"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Category *
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
                <MapLocationPicker
                    latitude={formData.latitude}
                    longitude={formData.longitude}
                    onLocationChange={handleLocationChange}
                />
            </div>

            {!formData.isPermanent && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Auto-delete after
                </label>
                <select
                  value={formData.deleteAfterHours}
                  onChange={(e) => setFormData(prev => ({ ...prev, deleteAfterHours: parseInt(e.target.value) }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  {getDeleteOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {canMakePermanent && (
              <div className="flex items-center gap-3 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <input
                  type="checkbox"
                  id="permanent"
                  checked={formData.isPermanent}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    isPermanent: e.target.checked 
                  }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="permanent" className="text-sm font-medium text-blue-800 flex items-center gap-2">
                  <Crown className="w-4 h-4" />
                  Make this post permanent
                </label>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || uploading}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {uploading ? 'Uploading...' : 'Creating...'}
                  </>
                ) : (
                  'Create Post'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showLocationPicker && (
        <div className="absolute inset-0 z-10 bg-black/50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-lg p-4 w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Select Location</h3>
              <button
                onClick={() => setShowLocationPicker(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="h-96">
              <MapLocationPicker
                latitude={formData.latitude}
                longitude={formData.longitude}
                onLocationChange={handleLocationChange}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCreationModal;