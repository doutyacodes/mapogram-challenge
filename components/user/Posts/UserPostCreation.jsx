import React, { useState, useEffect } from 'react';
import { X, Upload, MapPin, Calendar, Clock, Users, AlertCircle, CheckCircle, Loader2, ChevronDown, Search, ImageIcon } from 'lucide-react';
import { ImageUploadService } from '@/utils/imageUploadService';
import MapLocationPicker from '@/app/_components/MapLocationPicker';

const UserPostCreation = ({ isOpen, onClose, userId }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [availableLayers, setAvailableLayers] = useState([]);
  
  // Main form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: null,
    imageFileName: '',
    latitude: 0,
    longitude: 0,
    categoryId: '',
    categoryName: '', // 'Posts' or 'Event'
    contentType: '', // 'story' or 'post' (for Posts category)
    isPermanent: false, // only for 'post' type
    deleteAfterHours: null,
    showOnLayers: false,
    selectedLayers: []
  });

  // Event specific data
  const [eventData, setEventData] = useState({
    event_date: '',
    contact_info: '',
    additional_info: ''
  });

  const [errors, setErrors] = useState({});
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  // Available categories for user posts
//   const categories = [
//     { name: 'Posts', description: 'Share your thoughts, experiences, or updates' },
//     { name: 'Event', description: 'Create and share events with the community' }
//   ];

// Load initial data
useEffect(() => {
    if (isOpen) {
    fetchCategories();
    }
}, [isOpen]);

const fetchCategories = async () => {
    try {
    const response = await fetch(`/api/profile/posts/categories`);
    const data = await response.json();
    setCategories(data.categories || []);
    } catch (error) {
    console.error('Error fetching categories:', error);
    }
};

const fetchAvailableLayers = async (categoryId) => {
    try {
    const response = await fetch(`/api/profile/posts/layers?categoryId=${categoryId}`);
    const data = await response.json();
    setAvailableLayers(data.layers || []);
    } catch (error) {
    console.error('Error fetching layers:', error);
    }
};

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isCategoryOpen && !event.target.closest('.category-dropdown')) {
        setIsCategoryOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCategoryOpen]);


  const handleCategoryChange = (categoryId, categoryName) => {
    setFormData(prev => ({ 
      ...prev, 
      categoryId,
      categoryName,
      contentType: '',
      isPermanent: false,
      deleteAfterHours: null,
      showOnLayers: false,
      selectedLayers: []
    }));
    setIsCategoryOpen(false);

    // Fetch available layers for this category
    fetchAvailableLayers(categoryId);
  };

  const handleContentTypeChange = (contentType) => {
    setFormData(prev => ({ 
      ...prev, 
      contentType,
      deleteAfterHours: contentType === 'story' ? 24 : null,
      isPermanent: false
    }));
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    
    try {
      setUploading(true);
      const result = await ImageUploadService.uploadToCPanel(file);
      
      if (result.success) {
        setFormData(prev => ({
          ...prev,
          image: file,
          imageFileName: result.filePath
        }));
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Image upload error:', error);
      setErrors(prev => ({ ...prev, image: 'Failed to upload image' }));
    } finally {
      setUploading(false);
    }
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
    
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.categoryName) newErrors.categoryName = 'Category is required';
    if (!formData.latitude || !formData.longitude) newErrors.location = 'Location is required';
    if (!formData.imageFileName) newErrors.image = 'Image is required';
    
    // Content type validation for Posts
    if (formData.categoryName === 'Posts' && !formData.contentType) {
      newErrors.contentType = 'Please select if this is a story or post';
    }
    
    // Event specific validation
    if (formData.categoryName === 'Event') {
      if (!eventData.event_date) newErrors.event_date = 'Event date is required';
      if (!eventData.contact_info.trim()) newErrors.contact_info = 'Contact information is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const postData = {
        userId,
        title: formData.title,
        description: formData.description,
        imageFileName: formData.imageFileName,
        latitude: formData.latitude,
        longitude: formData.longitude,
        categoryId: formData.categoryId,
        categoryName: formData.categoryName,
        deleteAfterHours: formData.deleteAfterHours,
        isPermanent: formData.isPermanent,
        selectedLayers: formData.showOnLayers ? formData.selectedLayers : []
      };
      
      // Add event specific data
      if (formData.categoryName === 'Event') {
        postData.eventData = eventData;
      }
      
      const response = await fetch('/api/profile/posts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      });
      
      if (response.ok) {
        onClose();
        // Reset form
        setFormData({
          title: '',
          description: '',
          image: null,
          imageFileName: '',
          latitude: 0,
          longitude: 0,
          categoryId: '',
          categoryName: '',
          contentType: '',
          isPermanent: false,
          deleteAfterHours: null,
          showOnLayers: false,
          selectedLayers: []
        });
        setEventData({
          event_date: '',
          contact_info: '',
          additional_info: ''
        });
        setCurrentStep(1);
      } else {
        throw new Error('Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      setErrors(prev => ({ ...prev, submit: 'Failed to create post' }));
    } finally {
      setLoading(false);
    }
  };

  const showSteps = formData.categoryName === 'Event';
  const canProceedToNext = formData.title && formData.categoryName && formData.imageFileName && 
    (formData.categoryName === 'Posts' ? formData.contentType : true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Create New Post</h2>
            <p className="text-purple-100 mt-1">Share your story with the community</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Progress Steps - Only show for Events */}
        {showSteps && (
          <div className="bg-gray-50 px-6 py-4 border-b">
            <div className="flex items-center space-x-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step}
                  </div>
                  {step < 3 && (
                    <div className={`w-12 h-1 mx-2 ${
                      currentStep > step ? 'bg-purple-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-600">
              <span>Basic Info</span>
              <span>Event Details</span>
              <span>Review</span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {currentStep === 1 && (
            <BasicInfoStep
              formData={formData}
              setFormData={setFormData}
              categories={categories}
              handleCategoryChange={handleCategoryChange}
              handleContentTypeChange={handleContentTypeChange}
              handleImageUpload={handleImageUpload}
              handleLocationChange={handleLocationChange}
              uploading={uploading}
              errors={errors}
              isCategoryOpen={isCategoryOpen}
              setIsCategoryOpen={setIsCategoryOpen}
              availableLayers={availableLayers}
            />
          )}
          
          {currentStep === 2 && formData.categoryName === 'Event' && (
            <EventDetailsStep
              eventData={eventData}
              setEventData={setEventData}
              errors={errors}
            />
          )}
          
          {currentStep === 3 && formData.categoryName === 'Event' && (
            <ReviewStep
              formData={formData}
              eventData={eventData}
            />
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t">
          <div>
            {showSteps && currentStep > 1 && (
              <button
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Back
              </button>
            )}
          </div>
          <div className="flex space-x-3">
            {!showSteps || currentStep === 3 ? (
              <button
                onClick={handleSubmit}
                disabled={loading || !canProceedToNext}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    <span>Create Post</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
                disabled={!canProceedToNext}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Basic Info Step Component
const BasicInfoStep = ({ 
  formData, 
  setFormData, 
  categories, 
  handleCategoryChange,
  handleContentTypeChange,
  handleImageUpload,
  handleLocationChange,
  uploading,
  errors,
  isCategoryOpen,
  setIsCategoryOpen,
  availableLayers
}) => {
  return (
    <div className="space-y-6">
      {/* Category Selection */}
      <div className="category-dropdown relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category *
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsCategoryOpen(!isCategoryOpen)}
            className={`w-full p-4 border-2 rounded-lg text-left flex items-center justify-between transition-all ${
              formData.categoryName 
                ? 'border-purple-500 bg-purple-50' 
                : 'border-gray-200 hover:border-gray-300'
            } ${errors.categoryName ? 'border-red-500' : ''}`}
          >
            <div className="flex items-center space-x-3">
              {formData.categoryName ? (
                <>
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <div>
                    <span className="text-sm font-medium">{formData.categoryName}</span>
                    <p className="text-xs text-gray-500">
                      {categories.find(c => c.name === formData.categoryName)?.description}
                    </p>
                  </div>
                </>
              ) : (
                <span className="text-gray-500 text-sm">Select a category</span>
              )}
            </div>
            <ChevronDown size={16} className={`text-gray-400 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isCategoryOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <div className="py-2">
                {categories.map((category) => (
                  <button
                    key={category.name}
                    onClick={() => handleCategoryChange(category.id, category.name)}
                    className={`w-full p-4 text-left hover:bg-purple-50 transition-colors flex items-center space-x-3 ${
                      formData.categoryName === category.name ? 'bg-purple-50 text-purple-700' : ''
                    }`}
                  >
                    <div className="w-3 h-3 rounded-full bg-purple-500" />
                    <div>
                      <span className="text-sm font-medium">{category.name}</span>
                      <p className="text-xs text-gray-500">{category.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        {errors.categoryName && <p className="text-red-500 text-sm mt-1">{errors.categoryName}</p>}
      </div>

      {/* Content Type Selection - Only for Posts */}
      {formData.categoryName === 'Posts' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            What type of content is this? *
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleContentTypeChange('story')}
              className={`p-4 rounded-lg border-2 transition-all ${
                formData.contentType === 'story'
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2 mb-2">
                <Clock size={20} />
                <span className="font-medium">Story</span>
              </div>
              <p className="text-sm text-gray-600">
                Share a moment that will be automatically deleted after 24 hours
              </p>
            </button>
            
            <button
              type="button"
              onClick={() => handleContentTypeChange('post')}
              className={`p-4 rounded-lg border-2 transition-all ${
                formData.contentType === 'post'
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2 mb-2">
                <Users size={20} />
                <span className="font-medium">Post</span>
              </div>
              <p className="text-sm text-gray-600">
                Create a lasting post that stays in your profile
              </p>
            </button>
          </div>
          {errors.contentType && <p className="text-red-500 text-sm mt-1">{errors.contentType}</p>}
          
          {/* Story Info */}
          {formData.contentType === 'story' && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle size={16} className="text-amber-600" />
                <p className="text-sm text-amber-800">
                  <strong>Story:</strong> This content will be automatically deleted after 24 hours to keep your feed fresh and engaging.
                </p>
              </div>
            </div>
          )}
          
          {/* Permanent Post Option */}
          {formData.contentType === 'post' && (
            <div className="mt-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isPermanent}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPermanent: e.target.checked }))}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">Make this a permanent post (won&apos;t be deleted)</span>
              </label>
            </div>
          )}
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {formData.categoryName === 'Event' ? 'Event Name *' : 'Title *'}
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
            errors.title ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder={
            formData.categoryName === 'Event' 
              ? "Enter the event name" 
              : "Enter an engaging title for your post"
          }
        />
        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description *
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={4}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Describe your post in detail..."
        />
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Image *
        </label>
        <div className={`border-2 border-dashed rounded-lg p-6 text-center hover:border-gray-400 transition-colors ${
          errors.image ? 'border-red-300' : 'border-gray-300'
        }`}>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e.target.files[0])}
            className="hidden"
            id="image-upload"
          />
          <label htmlFor="image-upload" className="cursor-pointer">
            {uploading ? (
              <Loader2 size={48} className="mx-auto text-gray-400 animate-spin" />
            ) : (
              <div className="flex flex-col items-center">
                <ImageIcon size={48} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  {uploading ? 'Uploading...' : 'Click to upload image'}
                </p>
              </div>
            )}
          </label>
          {formData.imageFileName && (
            <p className="text-purple-600 text-sm mt-2 flex items-center justify-center space-x-1">
              <CheckCircle size={16} />
              <span>Image uploaded successfully</span>
            </p>
          )}
        </div>
        {errors.image && <p className="text-red-500 text-sm mt-1">{errors.image}</p>}
      </div>

      {/* Location Picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Location *
        </label>
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <MapLocationPicker
            latitude={formData.latitude}
            longitude={formData.longitude}
            onLocationChange={handleLocationChange}
          />
        </div>
        {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
      </div>

      {/* Layer Selection */}
      <div>
        <div className="flex items-center space-x-3 mb-4">
          <input
            type="checkbox"
            id="show-on-layers"
            checked={formData.showOnLayers}
            onChange={(e) => setFormData(prev => ({ ...prev, showOnLayers: e.target.checked }))}
            className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
          />
          <label htmlFor="show-on-layers" className="text-sm font-medium text-gray-700">
            Add this post to layers
          </label>
        </div>
        
        {formData.showOnLayers && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-3">
              Select which Friends layers should display this post:
            </p>
            
            {availableLayers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                {availableLayers.map((layer) => (
                  <label 
                    key={layer.id} 
                    className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.selectedLayers.includes(layer.id)
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.selectedLayers.includes(layer.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({ 
                            ...prev, 
                            selectedLayers: [...prev.selectedLayers, layer.id] 
                          }));
                        } else {
                          setFormData(prev => ({ 
                            ...prev, 
                            selectedLayers: prev.selectedLayers.filter(id => id !== layer.id) 
                          }));
                        }
                      }}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-800">{layer.name}</span>
                      {layer.description && (
                        <p className="text-xs text-gray-500 mt-1">{layer.description}</p>
                      )}
                    </div>
                    {layer.member_count && (
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                        {layer.member_count} members
                      </span>
                    )}
                  </label>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Users size={24} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No friends layers available</p>
              </div>
            )}
            
            {formData.selectedLayers.length > 0 && (
              <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm text-purple-800">
                  <strong>Selected layers:</strong> {formData.selectedLayers.length} layer{formData.selectedLayers.length !== 1 ? 's' : ''}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.selectedLayers.map(layerId => {
                    const layer = availableLayers.find(l => l.id === layerId);
                    return layer ? (
                      <span 
                        key={layerId}
                        className="inline-flex items-center space-x-1 bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full"
                      >
                        <span>{layer.name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ 
                              ...prev, 
                              selectedLayers: prev.selectedLayers.filter(id => id !== layerId) 
                            }));
                          }}
                          className="hover:bg-purple-200 rounded-full p-0.5"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Event Details Step Component
const EventDetailsStep = ({ eventData, setEventData, errors }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
        <Calendar size={20} className="text-purple-600" />
        <span>Event Details</span>
      </h3>

      {/* Event Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Event Date *
        </label>
        <input
          type="datetime-local"
          value={eventData.event_date}
          onChange={(e) => setEventData(prev => ({ ...prev, event_date: e.target.value }))}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
            errors.event_date ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.event_date && <p className="text-red-500 text-sm mt-1">{errors.event_date}</p>}
      </div>

      {/* Contact Info */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Contact Information *
        </label>
        <input
          type="text"
          value={eventData.contact_info}
          onChange={(e) => setEventData(prev => ({ ...prev, contact_info: e.target.value }))}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
            errors.contact_info ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Phone number, email, or other contact details"
        />
        {errors.contact_info && <p className="text-red-500 text-sm mt-1">{errors.contact_info}</p>}
      </div>

      {/* Additional Info */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Information
        </label>
        <textarea
          value={eventData.additional_info}
          onChange={(e) => setEventData(prev => ({ ...prev, additional_info: e.target.value }))}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="Any additional details about the event..."
        />
      </div>
    </div>
  );
};

// Review Step Component
const ReviewStep = ({ formData, eventData }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800">Review Your Post</h3>
      
      {/* Basic Info Review */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-800 mb-3">Basic Information</h4>
        <div className="space-y-2 text-sm">
          <div><strong>Title:</strong> {formData.title}</div>
          <div><strong>Description:</strong> {formData.description}</div>
          <div><strong>Category:</strong> {formData.categoryName}</div>
          <div><strong>Location:</strong> {formData.latitude}, {formData.longitude}</div>
          {formData.contentType && (
            <div><strong>Content Type:</strong> {formData.contentType}</div>
          )}
          {formData.contentType === 'story' && (
            <div><strong>Auto Delete:</strong> After 24 hours</div>
          )}
          {formData.contentType === 'post' && formData.isPermanent && (
            <div><strong>Permanent Post:</strong> Yes</div>
          )}
          {formData.showOnLayers && (
            <div><strong>Friends Layers:</strong> {formData.selectedLayers.length} selected</div>
          )}
        </div>
      </div>

      {/* Event Details Review */}
      {formData.categoryName === 'Event' && (
        <div className="bg-purple-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-3">Event Details</h4>
          <div className="space-y-2 text-sm">
            <div><strong>Event Date:</strong> {new Date(eventData.event_date).toLocaleString()}</div>
            <div><strong>Contact Info:</strong> {eventData.contact_info}</div>
            <div><strong>Additional Info:</strong> {eventData.additional_info || 'Not provided'}</div>
          </div>
        </div>
      )}
              
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <AlertCircle size={16} className="text-yellow-600" />
          <p className="text-sm text-yellow-800">
            Please review all information carefully before creating the post. Once created, some details cannot be easily modified.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserPostCreation;