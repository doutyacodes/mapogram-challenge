import React, { useState, useEffect } from 'react';
import { X, Upload, MapPin, Clock, Building2, User, Crown, Shield } from 'lucide-react';
import { getUserFromToken } from '@/utils/auth';
import MapLocationPicker from './MapLocationPicker';
import { ImageUploadService } from '@/utils/imageUploadService';

const PostCreationModal = ({ isOpen, onClose, onPostCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    communityId: '',
    categoryId: '',
    latitude: null,
    longitude: null,
    deleteAfterHours: 24,
    isPermanent: false,
    postedAs: 'user'
  });

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
    if (formData.communityId) {
      fetchCategoriesForCommunity(formData.communityId);
    } else {
      setCategories([]);
    }
  }, [formData.communityId]);

  const fetchCategoriesForCommunity = async (communityId) => {
    try {
      const res = await fetch(`/api/communities/post/categories?communityId=${communityId}`);
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

      const communitiesRes = await fetch('/api/user/community/followed-communities');
      const communitiesData = await communitiesRes.json();
      setCommunities(communitiesData.communities || []);

      const companiesRes = await fetch('/api/user/companies');
      const companiesData = await companiesRes.json();
      setUserCompanies(companiesData.companies || []);

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

  const handleSubmit = async () => {
    if (!formData.title || !formData.communityId || !formData.categoryId || !formData.latitude || !formData.longitude) {
      alert('Please fill in all required fields');
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
        imageFileName,
        postedByCompanyId: formData.postedAs === 'user' ? null : parseInt(formData.postedAs)
      };

      const response = await fetch('/api/communities/post/create', {
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
      communityId: '',
      categoryId: '',
      latitude: null,
      longitude: null,
      deleteAfterHours: 24,
      isPermanent: false,
      postedAs: 'user'
    });
    setSelectedImage(null);
    setImagePreview(null);
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
        <div className="bg-red-800 text-white p-4 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isAdmin && <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300" />}
            {isModerator && <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-300" />}
            <h2 className="text-lg sm:text-xl font-bold">Create New Post</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-red-700 rounded-full transition-colors"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-80px)] sm:max-h-[calc(95vh-100px)]">
          <div className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <User className="w-4 h-4" />
                Posting As
              </label>
              <select
                value={formData.postedAs}
                onChange={(e) => setFormData(prev => ({ ...prev, postedAs: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
              >
                <option value="user">{userData?.name || 'User'}</option>
                {userCompanies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Community *
              </label>
              <select
                value={formData.communityId}
                onChange={(e) => setFormData(prev => ({ ...prev, communityId: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
              >
                <option value="">Select a community</option>
                {communities.map(community => (
                  <option key={community.id} value={community.id}>
                    {community.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter post title"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors resize-vertical"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Image
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center hover:border-red-500 transition-colors">
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
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Remove Image
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto" />
                    <div>
                      <label className="cursor-pointer">
                        <span className="text-red-600 hover:text-red-800 font-medium">
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

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Category *
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
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
              {/* <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location *
              </label> */}
              {/* {formData.latitude && formData.longitude ? (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <span className="text-sm text-green-700">
                    Location selected
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowLocationPicker(true)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowLocationPicker(true)}
                  className="w-full p-3 border border-gray-300 rounded-lg hover:border-red-500 transition-colors text-left text-gray-500"
                >
                  Click to select location on map
                </button>
              )} */}

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
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                >
                  <option value={24}>24 hours</option>
                  <option value={36}>36 hours</option>
                  <option value={48}>48 hours</option>
                </select>
              </div>
            )}

            {canMakePermanent && (
              <div className="flex items-center gap-3 p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <input
                  type="checkbox"
                  id="permanent"
                  checked={formData.isPermanent}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    isPermanent: e.target.checked 
                  }))}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <label htmlFor="permanent" className="text-sm font-medium text-yellow-800 flex items-center gap-2">
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
                className="flex-1 py-3 px-4 bg-red-800 text-white rounded-lg hover:bg-red-900 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
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