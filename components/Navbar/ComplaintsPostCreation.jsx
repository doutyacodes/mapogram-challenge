import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowLeft, MapPin, AlertTriangle, Wrench, Building, Home, Car, Smartphone, Camera, Upload, Loader2, CheckCircle, AlertCircle, Navigation, Refrigerator } from 'lucide-react';
import { ImageUploadService } from '@/utils/imageUploadService';
import MapLocationPicker from '@/app/_components/MapLocationPicker';
import toast from 'react-hot-toast';

const ComplaintsPostCreation = ({ isOpen, onClose, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [step, setStep] = useState(1);
  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]);
  const [serviceCenters, setServiceCenters] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  
  // Form data states
  const [formData, setFormData] = useState({
    productType: '', // 'vehicle' or 'appliance' - NEW FIELD
    categoryId: '', // This will be 72 (Home Service), 73 (Service Center), or 74 (Troubleshooting)
    brandId: '',
    productId: '',
    specificProductName: '',
    issueTitle: '',
    issueDescription: '',
    latitude: 0,
    longitude: 0,
  });

  const [complaintData, setComplaintData] = useState({
    serviceCenterPageId: '',
    additionalInfo: ''
  });

  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  // Fetch categories on component mount
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      getUserLocation();
    }
  }, [isOpen]);

  // Fetch brands when category changes
  useEffect(() => {
      if (formData.productType) {
        fetchBrands(formData.productType);
        setFormData(prev => ({ ...prev, brandId: '', productId: '', categoryId: '' }));
        setProducts([]);
      }
    }, [formData.productType]);

  // Fetch products when brand changes
  useEffect(() => {
      if (formData.brandId && formData.productType) {
        fetchProducts(formData.brandId, formData.productType);
        setFormData(prev => ({ ...prev, productId: '', categoryId: '' }));
      }
    }, [formData.brandId, formData.productType]);

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
          toast.error('Location access denied. Showing nearby centers without distance.');
        }
      );
    } else {
      setLocationLoading(false);
      toast.error('Geolocation is not supported by this browser.');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/complaints/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const fetchBrands = async (categoryType) => {
    try {
      const response = await fetch(`/api/complaints/brands?category=${categoryType}`);
      const data = await response.json();
      if (data.success) {
        setBrands(data.brands);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
      toast.error('Failed to load brands');
    }
  };

  const fetchProducts = async (brandId, categoryType) => {
    try {
      const response = await fetch(`/api/complaints/products?brandId=${brandId}&category=${categoryType}`);
      const data = await response.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    }
  };

  const fetchServiceCenters = async () => {
    if (!formData.brandId || !formData.productId) return;
    
    try {
      const params = new URLSearchParams({
        brandId: formData.brandId,
        productId: formData.productId
      });

      if (userLocation) {
        params.append('userLat', userLocation.lat);
        params.append('userLng', userLocation.lng);
      }

      const response = await fetch(`/api/complaints/service-centers?${params}`);
      const data = await response.json();
      if (data.success) {
        setServiceCenters(data.serviceCenters);
      }
    } catch (error) {
      console.error('Error fetching service centers:', error);
      toast.error('Failed to load service centers');
    }
  };

  // Handle image upload (same as before)
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

  const validateStep1 = () => {
    const newErrors = {};
    
    if (!formData.productType) newErrors.productType = 'Please select product type (Vehicle/Appliance)';
    if (!formData.brandId) newErrors.brandId = 'Please select a brand';
    if (!formData.productId) newErrors.productId = 'Please select a product';
    if (!formData.categoryId) newErrors.categoryId = 'Please select service type';
    if (!formData.issueTitle.trim()) newErrors.issueTitle = 'Please describe the issue briefly';
    if (!formData.issueDescription.trim()) newErrors.issueDescription = 'Please provide detailed explanation';
    if (formData.latitude === 0 && formData.longitude === 0) {
      newErrors.location = 'Please select your location';
    }
    if (selectedImages.length === 0) {
      newErrors.images = 'Please upload at least one image showing the issue';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    
    if (!complaintData.serviceCenterPageId) newErrors.serviceCenterPageId = 'Please select a service center';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (validateStep1()) {
      // Fetch service centers before moving to step 2
      await fetchServiceCenters();
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;

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

      const submitData = {
        ...formData,
        images: uploadedImages,
        ...complaintData,
        postType: 'complaints'
      };

      const response = await fetch('/api/complaints/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Complaint submitted successfully!');
        onClose();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error creating complaint:', error);
      toast.error('Failed to submit complaint');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (iconName, color) => {
      const iconMap = {
        'Wrench': Wrench,
        'MapPin': MapPin,
        'MessageCircleQuestion': AlertCircle, // Use AlertCircle as fallback for MessageCircleQuestion
      };
      const IconComponent = iconMap[iconName] || Wrench;
      return <IconComponent size={24} style={{ color: color?.replace(/`/g, '') }} />;
  };
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-4 sm:p-6 flex items-center justify-between rounded-t-2xl flex-shrink-0">
          <div className="flex items-center space-x-3">
            <button
              onClick={step === 1 ? onBack : handleBack}
              className="text-white hover:text-gray-200 transition-colors p-1"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">
                {step === 1 ? 'Report an Issue' : 'Select Service Center'}
              </h2>
              <p className="opacity-90 mt-1 text-sm">
                {step === 1 ? 'Tell us about your problem' : 'Choose service preferences'}
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

        {/* Progress Steps */}
        <div className="bg-orange-50 px-4 sm:px-6 py-3 border-b">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-orange-600' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                step >= 1 ? 'bg-orange-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                1
              </div>
              <span className="text-sm font-medium">Issue Details</span>
            </div>
            <div className={`w-8 h-0.5 ${step >= 2 ? 'bg-orange-600' : 'bg-gray-300'}`} />
            <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-orange-600' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                step >= 2 ? 'bg-orange-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                2
              </div>
              <span className="text-sm font-medium">Service Center</span>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 space-y-6">
            {step === 1 ? (
            /* Step 1: Complete Product & Issue Details */
              <>
                {/* Product Type Selection (Vehicle or Appliance) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Product Type *
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label 
                      className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.productType === 'appliance'
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="productType"
                        value="appliance"
                        checked={formData.productType === 'appliance'}
                        onChange={(e) => setFormData(prev => ({ ...prev, productType: e.target.value }))}
                        className="text-orange-600 border-gray-300 focus:ring-orange-500"
                      />
                      <Refrigerator size={24} className="text-green-500" />
                      <div>
                        <span className="text-sm font-medium text-gray-800">Appliance</span>
                        <p className="text-xs text-gray-600 mt-1">Home appliances, electronics</p>
                      </div>
                    </label>

                    <label 
                      className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.productType === 'vehicle'
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="productType"
                        value="vehicle"
                        checked={formData.productType === 'vehicle'}
                        onChange={(e) => setFormData(prev => ({ ...prev, productType: e.target.value }))}
                        className="text-orange-600 border-gray-300 focus:ring-orange-500"
                      />
                      <Car size={24} className="text-blue-500" />
                      <div>
                        <span className="text-sm font-medium text-gray-800">Vehicle</span>
                        <p className="text-xs text-gray-600 mt-1">Cars, bikes, scooters</p>
                      </div>
                    </label>
                  </div>
                  {errors.productType && <p className="text-red-500 text-sm mt-1">{errors.productType}</p>}
                </div>

                {/* Brand Selection */}
                {formData.productType && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Brand *
                    </label>
                    <select
                      value={formData.brandId}
                      onChange={(e) => setFormData(prev => ({ ...prev, brandId: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                        errors.brandId ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select Brand</option>
                      {brands.map(brand => (
                        <option key={brand.id} value={brand.id}>{brand.name}</option>
                      ))}
                    </select>
                    {errors.brandId && <p className="text-red-500 text-sm mt-1">{errors.brandId}</p>}
                  </div>
                )}

                {/* Product Selection */}
                {formData.brandId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product/Model *
                    </label>
                    <select
                      value={formData.productId}
                      onChange={(e) => setFormData(prev => ({ ...prev, productId: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                        errors.productId ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select Product</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name} ({product.category})
                        </option>
                      ))}
                    </select>
                    {errors.productId && <p className="text-red-500 text-sm mt-1">{errors.productId}</p>}
                  </div>
                )}

                {/* Service Category Selection - NEW */}
                {formData.productId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Select Service Type *
                    </label>
                    <div className="space-y-3">
                      {categories.map(category => (
                        <label 
                          key={category.id}
                          className={`flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            formData.categoryId === category.id.toString()
                              ? `border-orange-500 bg-orange-50`
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="categoryType"
                            value={category.id}
                            checked={formData.categoryId === category.id.toString()}
                            onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                            className="mt-1 text-orange-600 border-gray-300 focus:ring-orange-500"
                          />
                          <div className="flex-shrink-0 mt-0.5">
                            {getCategoryIcon(category.icon_name, category.color)}
                          </div>
                          <div className="flex-1">
                            <span className="text-sm font-semibold text-gray-800 block">{category.name}</span>
                            <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                              {category.description}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                    {errors.categoryId && <p className="text-red-500 text-sm mt-1">{errors.categoryId}</p>}
                  </div>
                )}

                {/* Specific Product Name */}
                {formData.categoryId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Specific Model Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.specificProductName}
                      onChange={(e) => setFormData(prev => ({ ...prev, specificProductName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="e.g., 'iPhone 14 Pro Max', 'Samsung Galaxy S23 Ultra'"
                    />
                  </div>
                )}

                {/* Issue Summary */}
                {formData.categoryId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <AlertTriangle size={16} className="inline mr-2 text-orange-500" />
                      What&apos;s the issue? *
                    </label>
                    <input
                      type="text"
                      value={formData.issueTitle}
                      onChange={(e) => setFormData(prev => ({ ...prev, issueTitle: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                        errors.issueTitle ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Briefly describe the problem (e.g., 'AC not cooling', 'Car engine making noise')"
                    />
                    {errors.issueTitle && <p className="text-red-500 text-sm mt-1">{errors.issueTitle}</p>}
                  </div>
                )}

                {/* Detailed Explanation */}
                {formData.categoryId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Detailed Explanation *
                    </label>
                    <textarea
                      value={formData.issueDescription}
                      onChange={(e) => setFormData(prev => ({ ...prev, issueDescription: e.target.value }))}
                      rows={4}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none ${
                        errors.issueDescription ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Please provide detailed information about the issue..."
                    />
                    {errors.issueDescription && <p className="text-red-500 text-sm mt-1">{errors.issueDescription}</p>}
                  </div>
                )}

                {/* Image Upload */}
                {formData.categoryId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Camera size={16} className="inline mr-2" />
                      Upload Images of the Issue * (Up to 5 images)
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
                          Click to upload images showing the issue ({selectedImages.length}/5)
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
                                alt="Issue preview"
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
                )}

                {/* Location Picker */}
                {formData.categoryId && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        <MapPin size={16} className="inline mr-2" />
                        Your Location *
                      </label>
                      <button
                        type="button"
                        onClick={getUserLocation}
                        disabled={locationLoading}
                        className="flex items-center space-x-1 text-xs text-orange-600 hover:text-orange-700 disabled:opacity-50"
                      >
                        {locationLoading ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Navigation size={14} />
                        )}
                        <span>{locationLoading ? 'Getting location...' : 'Use current location'}</span>
                      </button>
                    </div>
                    <div className="border border-gray-300 rounded-lg overflow-hidden h-64">
                      <MapLocationPicker
                        latitude={formData.latitude}
                        longitude={formData.longitude}
                        onLocationChange={handleLocationChange}
                      />
                    </div>
                    {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
                  </div>
                )}
              </>
            ) : (
              /* Step 2: Service Center Selection */
              <>
                {/* Location Status */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <MapPin size={20} className="text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">
                        {userLocation ? 'Showing service centers within 10km radius' : 'Showing nearby service centers'}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        {userLocation 
                          ? 'Based on your current location' 
                          : 'Location access denied. Showing matching centers without distance filter.'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Service Centers */}
                {serviceCenters.length > 0 ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Building size={16} className="inline mr-2" />
                      Select Service Center *
                    </label>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {serviceCenters.map(center => (
                        <label 
                          key={center.id} 
                          className={`flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            complaintData.serviceCenterPageId === center.id
                              ? 'border-orange-500 bg-orange-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="serviceCenter"
                            value={center.id}
                            checked={complaintData.serviceCenterPageId == center.id}
                            onChange={(e) => setComplaintData(prev => ({ ...prev, serviceCenterPageId: e.target.value }))}
                            className="mt-1 text-orange-600 border-gray-300 focus:ring-orange-500"
                          />
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <span className="text-sm font-medium text-gray-800">{center.name}</span>
                              {center.distance && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                  {center.distance} km away
                                </span>
                              )}
                            </div>
                            {center.bio && (
                              <p className="text-xs text-gray-600 mt-1">{center.bio}</p>
                            )}
                            {center.website_url && (
                              <p className="text-xs text-blue-600 mt-1 truncate">{center.website_url}</p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                    {errors.serviceCenterPageId && <p className="text-red-500 text-sm mt-1">{errors.serviceCenterPageId}</p>}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">No service centers found matching your criteria.</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Please check back later or try different product selection.
                    </p>
                  </div>
                )}

                {/* Additional Information */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    value={complaintData.additionalInfo}
                    onChange={(e) => setComplaintData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                    placeholder="Any additional information for the service center..."
                  />
                </div>
              </>
            )}
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
          <div className="flex space-x-3 w-full">
            {/* Back Button - Only show in step 2 */}
            {step === 2 && (
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
              >
                <ArrowLeft size={16} />
                <span>Back to Details</span>
              </button>
            )}
            
            <div className="flex space-x-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              
              {step === 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-colors flex items-center space-x-2"
                >
                  <span>Next: Service Center</span>
                  <ArrowLeft size={16} className="rotate-180" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || serviceCenters.length === 0}
                  className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      <span>Submit Complaint</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintsPostCreation;