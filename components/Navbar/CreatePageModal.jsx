import React, { useState, useEffect } from 'react';
import { X, Check, AlertCircle, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import ImageCropper from '@/app/_components/ImageCropper';
import BrandProductSelector from './BrandProductSelector';
import MapLocationPicker from '@/app/_components/MapLocationPicker';

const CreatePageModal = ({ isOpen, onClose, onPageCreated }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    bio: '',
    websiteUrl: '',
    page_type_id: '',
    category: 'general',
    latitude: null,
    longitude: null, 
  });
  
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [pageTypes, setPageTypes] = useState([]);
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingPageTypes, setLoadingPageTypes] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState({
    checking: false,
    available: null,
    message: ''
  });
  const [brandProductSelection, setBrandProductSelection] = useState({
    brands: [],
    products: []
  });

  const isServiceCenter = formData.category === 'service_center';
  const totalSteps = isServiceCenter ? 2 : 1;

  useEffect(() => {
    if (isOpen) {
      fetchPageTypes('general');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setFormData({
        name: '',
        username: '',
        bio: '',
        websiteUrl: '',
        page_type_id: '',
        category: 'general',
        latitude: null,
        longitude: null,
      });
      setSelectedImageFile(null);
      setProfileImageUrl('');
      setErrors({});
      setUsernameStatus({
        checking: false,
        available: null,
        message: ''
      });
      setBrandProductSelection({
        brands: [],
        products: []
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.username.length >= 3) {
      const timeoutId = setTimeout(() => {
        checkUsernameAvailability(formData.username);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else if (formData.username.length > 0) {
      setUsernameStatus({
        checking: false,
        available: false,
        message: 'Username must be at least 3 characters'
      });
    } else {
      setUsernameStatus({
        checking: false,
        available: null,
        message: ''
      });
    }
  }, [formData.username]);

  useEffect(() => {
    if (formData.category && isOpen) {
      const categoryMap = {
        'general': 'general',
        'government_official': 'government_official',
        'service_center': 'brand_center'
      };
      fetchPageTypes(categoryMap[formData.category] || 'general');
      setFormData(prev => ({ ...prev, page_type_id: '' }));
    }
  }, [formData.category, isOpen]);

  const fetchPageTypes = async (category) => {
    setLoadingPageTypes(true);
    try {
      const url = category ? `/api/page-types?category=${category}` : '/api/page-types';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setPageTypes(data.pageTypes);
      } else {
        console.error('Failed to fetch page types');
      }
    } catch (error) {
      console.error('Error fetching page types:', error);
    } finally {
      setLoadingPageTypes(false);
    }
  };

  const checkUsernameAvailability = async (username) => {
    setUsernameStatus({ checking: true, available: null, message: '' });
    
    try {
      const res = await fetch(`/api/username/check?username=${username}`);
      const data = await res.json();
      
      setUsernameStatus({
        checking: false,
        available: data.available,
        message: data.available ? 'Username is available!' : 'Username is already taken'
      });
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameStatus({
        checking: false,
        available: false,
        message: 'Error checking username availability'
      });
    }
  };

  const handleLocationChange = (lat, lng) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng
    }));
    
    if (errors.location) {
      setErrors(prev => ({ ...prev, location: '' }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageSelected = (file, previewUrl) => {
    setSelectedImageFile(file);
    if (errors.profileImage) {
      setErrors(prev => ({ ...prev, profileImage: '' }));
    }
  };

  const handleImageUploaded = (filePath, url) => {
    setProfileImageUrl(filePath);
  };

  const handleBrandProductChange = (selection) => {
    setBrandProductSelection(selection);
  };

  const validateStep1 = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Page name is required';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!usernameStatus.available) {
      newErrors.username = 'Please choose an available username';
    }

    if (!profileImageUrl) {
      newErrors.profileImage = 'Profile image is required';
    }

    if (!formData.page_type_id) {
      newErrors.page_type_id = 'Please select a page type';
    }

    if (formData.websiteUrl && !isValidUrl(formData.websiteUrl)) {
      newErrors.websiteUrl = 'Please enter a valid URL';
    }

    if (isServiceCenter) {
      if (!formData.latitude || !formData.longitude) {
        newErrors.location = 'Location is required for service centers';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};

    if (brandProductSelection.brands.length === 0) {
      newErrors.brands = 'Please select at least one brand';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      if (isServiceCenter) {
        setCurrentStep(2);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (currentStep === 1 && !validateStep1()) {
      return;
    }

    if (currentStep === 2 && !validateStep2()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const requestBody = {
        name: formData.name.trim(),
        username: formData.username.trim(),
        bio: formData.bio.trim() || null,
        page_type_id: formData.page_type_id || null,
        websiteUrl: formData.websiteUrl.trim() || null,
        profileImageUrl: profileImageUrl,
        category: formData.category,
        latitude: formData.latitude,
        longitude: formData.longitude
      };

      if (isServiceCenter) {
        requestBody.selectedBrands = brandProductSelection.brands;
        requestBody.selectedProducts = brandProductSelection.products;
      }

      const response = await fetch('/api/page/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create page');
      }

      if (onPageCreated) {
        onPageCreated(data.page);
      }

      onClose();
    } catch (error) {
      console.error('Error creating page:', error);
      setErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const getCategoryLabel = () => {
    switch(formData.category) {
      case 'general':
        return 'For personal, business, or organizational use';
      case 'government_official':
        return 'For government officials and public servants';
      case 'service_center':
        return 'For authorized service centers';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Create New Page</h2>
            {isServiceCenter && (
              <p className="text-sm text-gray-600 mt-1">
                Step {currentStep} of {totalSteps}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <>
              {/* Profile Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Picture *
                </label>
                <ImageCropper
                  onImageSelected={handleImageSelected}
                  onImageUploaded={handleImageUploaded}
                  title="Profile Picture"
                  description="Upload a profile picture for your page (required)"
                  autoUpload={true}
                  cropperSize={200}
                  required={true}
                />
                {errors.profileImage && (
                  <p className="mt-2 text-sm text-red-600">{errors.profileImage}</p>
                )}
              </div>

              {/* Page Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Page Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter page name (e.g., My Company, My Brand)"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Username *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Enter unique username"
                    className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.username ? 'border-red-500' : 
                      usernameStatus.available === true ? 'border-green-500' : 
                      usernameStatus.available === false ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={isSubmitting}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {usernameStatus.checking && (
                      <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                    )}
                    {!usernameStatus.checking && usernameStatus.available === true && (
                      <Check className="w-4 h-4 text-green-500" />
                    )}
                    {!usernameStatus.checking && usernameStatus.available === false && (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
                {usernameStatus.message && (
                  <p className={`mt-1 text-sm ${
                    usernameStatus.available ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {usernameStatus.message}
                  </p>
                )}
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                )}
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Who is this page for? <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none bg-white"
                    disabled={isSubmitting}
                  >
                    <option value="general">General</option>
                    <option value="government_official">Government Official</option>
                    <option value="service_center">Service Center</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-600">
                  {getCategoryLabel()}
                </p>
              </div>

              {/* Page Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Page Type <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="page_type_id"
                    value={formData.page_type_id}
                    onChange={handleInputChange}
                    className={`w-full pl-4 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none bg-white ${
                      errors.page_type_id ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={loadingPageTypes || isSubmitting}
                  >
                    <option value="">Select page type</option>
                    {pageTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {loadingPageTypes && (
                  <p className="mt-1 text-sm text-gray-600">Loading page types...</p>
                )}
                {errors.page_type_id && <p className="mt-1 text-sm text-red-600">{errors.page_type_id}</p>}
                {formData.page_type_id && pageTypes.length > 0 && (
                  <p className="mt-1 text-xs text-gray-600">
                    {pageTypes.find(type => type.id == formData.page_type_id)?.description}
                  </p>
                )}
                {pageTypes.length === 0 && !loadingPageTypes && (
                  <p className="mt-1 text-xs text-gray-600">
                    No page types available for this category
                  </p>
                )}
              </div>

              {/* Bio */}
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                  Bio (Optional)
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell people about your page..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  disabled={isSubmitting}
                />
              </div>

              {/* Website URL */}
              <div>
                <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  Website URL (Optional)
                </label>
                <input
                  type="url"
                  id="websiteUrl"
                  name="websiteUrl"
                  value={formData.websiteUrl}
                  onChange={handleInputChange}
                  placeholder="https://example.com"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.websiteUrl ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={isSubmitting}
                />
                {errors.websiteUrl && (
                  <p className="mt-1 text-sm text-red-600">{errors.websiteUrl}</p>
                )}
              </div>

              {/* Location Picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location {isServiceCenter ? '*' : '(Optional)'}
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  {isServiceCenter 
                    ? 'Set your service center location so customers can find you' 
                    : 'Set your location to help people find your page'
                  }
                </p>
                
                <MapLocationPicker
                  latitude={formData.latitude}
                  longitude={formData.longitude}
                  onLocationChange={handleLocationChange}
                />
                
                {errors.location && (
                  <p className="mt-2 text-sm text-red-600">{errors.location}</p>
                )}
              
              </div>
            </>
          )}

          {/* Step 2: Brand and Product Selection (only for service centers) */}
          {currentStep === 2 && isServiceCenter && (
            <>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Select Brands & Products
                </h3>
                <p className="text-sm text-gray-600">
                  Choose the brands and products your service center handles. This helps customers find you when they need service.
                </p>
              </div>

              <BrandProductSelector onSelectionChange={handleBrandProductChange} />

              {errors.brands && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{errors.brands}</p>
                </div>
              )}
            </>
          )}

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            {currentStep === 2 ? (
              <>
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={isSubmitting || brandProductSelection.brands.length === 0}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Page'
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isSubmitting || !usernameStatus.available || !profileImageUrl || !formData.page_type_id || (isServiceCenter && (!formData.latitude || !formData.longitude))}                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {isServiceCenter ? (
                    <>
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  ) : isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Page'
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePageModal;