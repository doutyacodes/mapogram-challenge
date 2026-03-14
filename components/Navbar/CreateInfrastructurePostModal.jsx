import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowLeft, MapPin, AlertTriangle, Camera, Upload, Loader2, CheckCircle, AlertCircle, Navigation, Building, Home, UserPlus, Megaphone } from 'lucide-react';
import { ImageUploadService } from '@/utils/imageUploadService';
import toast from 'react-hot-toast';
import { useSearchParams } from 'next/navigation';
import BoundaryRestrictedLocationPicker from '@/app/_components/BoundaryRestrictedLocationPicker';

const CreateInfrastructurePostModal = ({ isOpen, onClose, onBack, preSelectedCategory, preSelectedPostType, initialLatitude, initialLongitude }) => {
  const searchParams = useSearchParams();
  const communityId = searchParams.get("communityId");

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  
  // Form data states
  const [formData, setFormData] = useState({
    categoryId: '',
    title: '',
    description: '',
    latitude: initialLatitude || 0,
    longitude: initialLongitude || 0,
  });

  const [issueDetails, setIssueDetails] = useState({
    priority: 'medium',
    buildingName: '',
    blockName: '',
    floorNumber: '',
    additionalInfo: ''
  });

  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);
  const categoriesFetchedRef = useRef(false);

  // Determine if this is an issue post
  const isIssuePost = preSelectedPostType === 'issue';

  // Add this function to get modal title based on post type
  const getModalTitle = () => {
    if (isIssuePost) {
      return {
        title: 'Report an Issue',
        subtitle: 'Tell us about the issue'
      };
    }
    
    // Check if we have a pre-selected category for specific post types
    if (preSelectedCategory) {
      switch (preSelectedCategory.name) {
        case 'Event':
          return {
            title: 'Create Event',
            subtitle: 'Share your event details'
          };
        case 'Posts':
          return {
            title: 'Create Post',
            subtitle: 'Share your post'
          };
        default:
          return {
            title: 'Create Post',
            subtitle: 'Share your post'
          };
      }
    }
    
    // Default fallback
    return {
      title: 'Create Post',
      subtitle: 'Share your post'
    };
  };

  // Use the function
  const modalTitle = getModalTitle();

  // Reset form function
  const resetForm = () => {
    setFormData({
      categoryId: preSelectedCategory ? preSelectedCategory.id.toString() : '',
      title: '',
      description: '',
      latitude: initialLatitude || 0,
      longitude: initialLongitude || 0,
    });
    setIssueDetails({
      priority: 'medium',
      buildingName: '',
      blockName: '',
      floorNumber: '',
      additionalInfo: ''
    });
    setSelectedImages([]);
    setImageFiles([]);
    setErrors({});
    
    // Revoke object URLs to prevent memory leaks
    selectedImages.forEach(image => {
      if (image.preview) {
        URL.revokeObjectURL(image.preview);
      }
    });
  };

  // Get current post type based on selected category
  const currentPostType = isIssuePost ? 'issue' : 
    categories.find(cat => cat.id.toString() === formData.categoryId)?.post_type || 'general';

  useEffect(() => {
    if (isOpen && communityId && !categoriesFetchedRef.current) {
      categoriesFetchedRef.current = true;
      fetchCategories();
      
      // Only get user location if no initial location provided OR if initial location is (0,0)
      if (!initialLatitude || !initialLongitude || initialLatitude === 0 || initialLongitude === 0) {
        getUserLocation();
      } else {
        // Use the provided initial location
        setUserLocation({
          lat: initialLatitude,
          lng: initialLongitude
        });
        setFormData(prev => ({
          ...prev,
          latitude: initialLatitude,
          longitude: initialLongitude
        }));
      }
      
      // Set preselected category if provided
      if (preSelectedCategory) {
        setFormData(prev => ({
          ...prev,
          categoryId: preSelectedCategory.id.toString()
        }));
      }
    }
    
    // Reset the ref when modal closes
    if (!isOpen) {
      categoriesFetchedRef.current = false;
    }
  }, [isOpen, communityId, preSelectedCategory, initialLatitude, initialLongitude]);

  // Add this useEffect to handle location updates when modal is already open
  useEffect(() => {
    if (isOpen && initialLatitude && initialLongitude && initialLatitude !== 0 && initialLongitude !== 0) {
      setUserLocation({
        lat: initialLatitude,
        lng: initialLongitude
      });
      setFormData(prev => ({
        ...prev,
        latitude: initialLatitude,
        longitude: initialLongitude
      }));
    }
  }, [isOpen, initialLatitude, initialLongitude]);

  const getUserLocation = () => {
    setLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }));
          setLocationLoading(false);
        },
        (error) => {
          console.log('Location access denied or failed:', error);
          setLocationLoading(false);
          toast.error('Location access denied. Please select location manually.');
        }
      );
    } else {
      setLocationLoading(false);
      toast.error('Geolocation is not supported by this browser.');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`/api/communities/post/categories?communityId=${communityId}`);
      const data = await response.json();
      if (data.categories) {
        setCategories(data.categories);
      } else {
        throw new Error(data.message || 'Failed to load categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    }
  };

  // Handle image upload
  const handleImageUpload = async (files) => {
    if (!files || files.length === 0) return;
    
    const newFiles = Array.from(files);
    const totalImages = selectedImages.length + newFiles.length;
    
    if (totalImages > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    try {
      setUploading(true);
      
      const newPreviews = newFiles.map(file => ({
        id: Date.now() + Math.random(),
        file,
        preview: URL.createObjectURL(file),
        uploaded: false
      }));
      
      setSelectedImages(prev => [...prev, ...newPreviews]);
      setImageFiles(prev => [...prev, ...newFiles]);
      
    } catch (error) {
      console.error('Error handling images:', error);
      toast.error('Failed to process images');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (imageId) => {
    setSelectedImages(prev => {
      const imageToRemove = prev.find(img => img.id === imageId);
      if (imageToRemove?.preview) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prev.filter(img => img.id !== imageId);
    });
    
    setImageFiles(prev => prev.filter((_, index) => {
      const imageIndex = selectedImages.findIndex(img => img.id === imageId);
      return index !== imageIndex;
    }));
  };

  const handleLocationChange = (lat, lng) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (isIssuePost && !formData.categoryId) {
      newErrors.categoryId = 'Please select an issue type';
    }
    
    if (!formData.title.trim()) {
      newErrors.title = isIssuePost 
        ? 'Please describe the issue briefly' 
        : 'Please enter a title';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = isIssuePost
        ? 'Please provide detailed explanation of the issue'
        : 'Please provide description';
    }
    
    if (formData.latitude === 0 && formData.longitude === 0) {
      newErrors.location = 'Please select your location';
    }
    
    if (selectedImages.length === 0) {
      newErrors.images = 'Please upload at least one image';
    }

    // Additional validation for issue type posts
    if (isIssuePost) {
      if (!issueDetails.buildingName.trim()) {
        newErrors.buildingName = 'Please enter building name';
      }
      if (!issueDetails.blockName.trim()) {
        newErrors.blockName = 'Please enter block name';
      }
      if (!issueDetails.floorNumber.trim()) {
        newErrors.floorNumber = 'Please enter floor number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Upload images first
      const uploadedImages = [];
      for (const file of imageFiles) {
        const result = await ImageUploadService.uploadToCPanel(file);
        if (result.success) {
          uploadedImages.push(result.filePath);
        }
      }

      // Prepare data for community post creation
      const submitData = {
        communityId: parseInt(communityId),
        title: formData.title,
        description: formData.description,
        latitude: formData.latitude,
        longitude: formData.longitude,
        categoryId: parseInt(formData.categoryId),
        postType: currentPostType,
        // For issue posts, include issue details
        ...(isIssuePost && {
          issueDetails: {
            priority: issueDetails.priority,
            buildingName: issueDetails.buildingName,
            blockName: issueDetails.blockName,
            floorNumber: issueDetails.floorNumber,
            additionalInfo: issueDetails.additionalInfo,
            status: 'pending',
            userConfirmationStatus: 'pending'
          }
        })
      };

      const response = await fetch('/api/communities/post/create-infrastructure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });

      const result = await response.json();
      if (result.success) {
        toast.success(
          isIssuePost 
            ? 'Issue reported successfully!' 
            : 'Post created successfully!'
        );
        resetForm();
        onClose();
      } else {
        throw new Error(result.message || 'Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error(
        isIssuePost 
          ? 'Failed to report issue' 
          : 'Failed to create post'
      );
    } finally {
      setLoading(false);
    }
  };

  // Filter categories for issue dropdown
  const issueCategories = categories.filter(cat => cat.post_type === 'issue');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4 sm:p-6 flex items-center justify-between rounded-t-2xl flex-shrink-0">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="text-white hover:text-gray-200 transition-colors p-1"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">
                {modalTitle.title}
              </h2>
              <p className="opacity-90 mt-1 text-sm">
                {modalTitle.subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 space-y-6">
            {/* Issue Type Selection (Only for issue posts) */}
            {isIssuePost && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Issue Type *
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.categoryId ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select issue type</option>
                  {issueCategories.map(category => (
                    <option key={category.id} value={category.id.toString()}>
                      {category.label || category.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && <p className="text-red-500 text-sm mt-1">{errors.categoryId}</p>}
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isIssuePost ? (
                  <>
                    <AlertTriangle size={16} className="inline mr-2 text-orange-500" />
                    What&apos;s the issue? *
                  </>
                ) : (
                  'Title *'
                )}
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={
                  isIssuePost 
                    ? "Briefly describe the issue (e.g., 'Leaking pipe in bathroom', 'Broken elevator')"
                    : "Enter post title..."
                }
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isIssuePost ? 'Detailed Explanation *' : 'Description *'}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={
                  isIssuePost
                    ? "Please provide detailed information about the issue, when it started, and any other relevant details..."
                    : "Provide more details about your post..."
                }
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>

            {/* Issue Specific Fields */}
            {isIssuePost && (
              <>
                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority Level *
                  </label>
                  <select
                    value={issueDetails.priority}
                    onChange={(e) => setIssueDetails(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>

                {/* Building Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Building Name *
                  </label>
                  <input
                    type="text"
                    value={issueDetails.buildingName}
                    onChange={(e) => setIssueDetails(prev => ({ ...prev, buildingName: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.buildingName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter building name (e.g., 'Tower A', 'Main Building')"
                  />
                  {errors.buildingName && <p className="text-red-500 text-sm mt-1">{errors.buildingName}</p>}
                </div>

                {/* Block Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Block/Section Name *
                  </label>
                  <input
                    type="text"
                    value={issueDetails.blockName}
                    onChange={(e) => setIssueDetails(prev => ({ ...prev, blockName: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.blockName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter block or section name (e.g., 'North Wing', 'Block B')"
                  />
                  {errors.blockName && <p className="text-red-500 text-sm mt-1">{errors.blockName}</p>}
                </div>

                {/* Floor Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Floor Number/Location *
                  </label>
                  <input
                    type="text"
                    value={issueDetails.floorNumber}
                    onChange={(e) => setIssueDetails(prev => ({ ...prev, floorNumber: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.floorNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter floor number or location (e.g., '5th Floor', 'Ground Floor', 'Roof Top', 'Basement')"
                  />
                  {errors.floorNumber && <p className="text-red-500 text-sm mt-1">{errors.floorNumber}</p>}
                </div>

                {/* Additional Info */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Information (Optional)
                  </label>
                  <textarea
                    value={issueDetails.additionalInfo}
                    onChange={(e) => setIssueDetails(prev => ({ ...prev, additionalInfo: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Any additional information that might help resolve the issue..."
                  />
                </div>
              </>
            )}

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Camera size={16} className="inline mr-2" />
                Upload Images * (Up to 5 images)
              </label>
              
              <div className={`border-2 border-dashed rounded-lg p-6 text-center hover:border-gray-400 transition-colors ${
                errors.images ? 'border-red-300' : 'border-gray-300'
              }`}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleImageUpload(e.target.files)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || selectedImages.length >= 5}
                  className="flex flex-col items-center justify-center w-full"
                >
                  {uploading ? (
                    <Loader2 size={32} className="mx-auto text-gray-400 animate-spin mb-2" />
                  ) : (
                    <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                  )}
                  <p className="text-sm text-gray-600">
                    Click to upload images ({selectedImages.length}/5)
                  </p>
                </button>
              </div>

              {selectedImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                  {selectedImages.map((image) => (
                    <div key={image.id} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                        <img
                          src={image.preview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(image.id)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {errors.images && <p className="text-red-500 text-sm mt-1">{errors.images}</p>}
            </div>

            {/* Location Picker */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  <MapPin size={16} className="inline mr-2" />
                  Location *
                </label>
                <button
                  type="button"
                  onClick={getUserLocation}
                  disabled={locationLoading}
                  className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50"
                >
                  {locationLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Navigation size={14} />
                  )}
                  <span>{locationLoading ? 'Getting location...' : 'Use current location'}</span>
                </button>
              </div>
              <div className="border border-gray-300 rounded-lg overflow-hidden ">
                <BoundaryRestrictedLocationPicker
                  latitude={formData.latitude}
                  longitude={formData.longitude}
                  communityId={communityId}
                  onLocationChange={handleLocationChange}
                />
              </div>
              {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 sm:px-6 py-4 border-t flex justify-between items-center rounded-b-2xl flex-shrink-0">
          {errors.submit && (
            <p className="text-red-500 text-sm flex items-center">
              <AlertCircle size={16} className="mr-1" />
              {errors.submit}
            </p>
          )}
          <div className="flex space-x-3 w-full justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  <span>
                    {isIssuePost 
                      ? 'Submit Issue' 
                      : preSelectedCategory?.name === 'Event' 
                        ? 'Create Event' 
                        : 'Create Post'
                    }
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateInfrastructurePostModal;