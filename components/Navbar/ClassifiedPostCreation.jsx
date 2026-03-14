import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowLeft, MapPin, Phone, Mail, Clock, Camera, Trash2, Image as ImageIcon, Upload, CheckCircle, Loader2, AlertCircle, Users } from 'lucide-react';
import { ImageUploadService } from '@/utils/imageUploadService';
import MapLocationPicker from '@/app/_components/MapLocationPicker';
import toast from 'react-hot-toast';
import ModernToggle from '../shared/ModernToggle';

const ClassifiedPostCreation = ({ isOpen, onClose, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [availableLayers, setAvailableLayers] = useState([]);
  
  // Form data states
  const [formData, setFormData] = useState({
    categoryId: '',
    subCategoryId: '',
    listingType: 'sell',
    price: '',
    priceType: 'negotiable',
    condition: 'good',
    contactPhone: '',
    contactEmail: '',
    preferredContact: 'both',
    description: '',
    latitude: 0,
    longitude: 0,
    deleteAfterWeeks: 4,
    showOnLayers: false,
    selectedLayers: [],
  });

  // Category specific data
  const [vehicleData, setVehicleData] = useState({
    brandId: '',
    modelId: '',
    year: new Date().getFullYear(),
    mileageKm: '',
    fuelType: 'petrol',
    transmission: 'manual',
    engineCapacity: '',
    registrationYear: '',
    insuranceValidUntil: '',
    pollutionCertificateValid: false,
    color: '',
    numberOfOwners: 1
  });

  const [electronicsData, setElectronicsData] = useState({
    brandId: '',
    model: '',
    warrantyMonthsLeft: '',
    billAvailable: false,
    boxAvailable: false,
    storageCapacity: '',
    ram: '',
    processor: '',
    screenSize: '',
    energyRating: ''
  });

  const [furnitureData, setFurnitureData] = useState({
    material: '',
    color: '',
    dimensions: '',
    weightKg: '',
    seatingCapacity: '',
    numberOfPieces: 1,
    assemblyRequired: false,
    brand: ''
  });

  const [realEstateData, setRealEstateData] = useState({
    propertyType: 'apartment',
    areaSqft: '',
    areaUnit: 'sqft',
    bedrooms: '',
    bathrooms: '',
    floorNumber: '',
    totalFloors: '',
    parking: false,
    furnished: 'unfurnished',
    monthlyRent: '',
    securityDeposit: '',
    maintenanceCharges: '',
    constructionYear: '',
    readyToMove: true,
    clearTitle: true
  });

  const [vehicleBrands, setVehicleBrands] = useState([]);
  const [vehicleModels, setVehicleModels] = useState([]);
  const [electronicsBrands, setElectronicsBrands] = useState([]);
  const [errors, setErrors] = useState({});

  const fileInputRef = useRef(null);

  // Fetch categories on component mount
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  // Fetch subcategories when category changes
  useEffect(() => {
    if (formData.categoryId) {
      fetchSubCategories(formData.categoryId);
    }
  }, [formData.categoryId]);

  // Fetch brands when subcategory changes for vehicles/electronics
  useEffect(() => {
    const selectedCategory = categories.find(cat => cat.id == formData.categoryId);
    const selectedSubCategory = subCategories.find(sub => sub.id == formData.subCategoryId);
    
    if (selectedCategory && selectedSubCategory) {
      if (selectedCategory.name === 'Vehicle') {
        fetchVehicleBrands(selectedSubCategory.name);
      } else if (selectedCategory.name === 'Electronics') {
        fetchElectronicsBrands(selectedSubCategory.name);
      }
    }
  }, [formData.subCategoryId, categories, subCategories]);

  // Fetch vehicle models when brand changes
  useEffect(() => {
    if (vehicleData.brandId) {
      fetchVehicleModels(vehicleData.brandId);
    }
  }, [vehicleData.brandId]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/classifieds/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const fetchSubCategories = async (categoryId) => {
    try {
      const response = await fetch(`/api/classifieds/subcategories?categoryId=${categoryId}`);
      const data = await response.json();
      if (data.success) {
        setSubCategories(data.subCategories);
        setFormData(prev => ({ ...prev, subCategoryId: '' }));
      }
    } catch (error) {
      console.error('Error fetching subcategories:', error);
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

  const fetchVehicleBrands = async (vehicleType) => {
    try {
      let type = 'car';
      if (vehicleType.toLowerCase().includes('bike') || vehicleType.toLowerCase().includes('scooter')) {
        type = 'bike';
      } else if (vehicleType.toLowerCase().includes('bicycle')) {
        type = 'bicycle';
      } else if (vehicleType.toLowerCase().includes('commercial')) {
        type = 'commercial';
      }
      
      const response = await fetch(`/api/classifieds/vehicle-brands?type=${type}`);
      const data = await response.json();
      if (data.success) {
        setVehicleBrands(data.brands);
      }
    } catch (error) {
      console.error('Error fetching vehicle brands:', error);
    }
  };

  const fetchVehicleModels = async (brandId) => {
    try {
      const response = await fetch(`/api/classifieds/vehicle-models?brandId=${brandId}`);
      const data = await response.json();
      if (data.success) {
        setVehicleModels(data.models);
      }
    } catch (error) {
      console.error('Error fetching vehicle models:', error);
    }
  };

  const fetchElectronicsBrands = async (category) => {
    try {
      let type = 'other';
      if (category.toLowerCase().includes('mobile')) type = 'mobile';
      else if (category.toLowerCase().includes('laptop')) type = 'laptop';
      else if (category.toLowerCase().includes('tv')) type = 'tv';
      else if (category.toLowerCase().includes('camera')) type = 'camera';
      
      const response = await fetch(`/api/classifieds/electronics-brands?category=${type}`);
      const data = await response.json();
      if (data.success) {
        setElectronicsBrands(data.brands);
      }
    } catch (error) {
      console.error('Error fetching electronics brands:', error);
    }
  };

  const handleImageUpload = async (files) => {
    if (!files || files.length === 0) return;
    
    const newFiles = Array.from(files);
    const totalImages = selectedImages.length + newFiles.length;
    
    if (totalImages > 8) {
      toast.error('Maximum 8 images allowed');
      return;
    }

    try {
      setUploading(true);
      
      // Create preview URLs immediately
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
    
    if (!formData.categoryId) newErrors.categoryId = 'Please select a category';
    if (!formData.subCategoryId) newErrors.subCategoryId = 'Please select a subcategory';
    if (!formData.price) newErrors.price = 'Price is required';
    if (!formData.description) newErrors.description = 'Description is required';
    if (!formData.contactPhone && !formData.contactEmail) {
      newErrors.contact = 'At least one contact method is required';
    }
    if (formData.latitude === 0 && formData.longitude === 0) {
      newErrors.location = 'Please select a location';
    }
    if (selectedImages.length === 0) {
      newErrors.images = 'At least one image is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateTitle = () => {
    const selectedCategory = categories.find(cat => cat.id == formData.categoryId);
    const selectedSubCategory = subCategories.find(sub => sub.id == formData.subCategoryId);
    
    if (!selectedCategory || !selectedSubCategory) return 'Classified Listing';
    
    let title = '';
    
    if (selectedCategory.name === 'Vehicle') {
      const brand = vehicleBrands.find(b => b.id == vehicleData.brandId);
      const model = vehicleModels.find(m => m.id == vehicleData.modelId);
      if (brand && model) {
        title = `${brand.name} ${model.name}`;
        if (vehicleData.year) title += ` (${vehicleData.year})`;
      } else {
        title = selectedSubCategory.name;
      }
    } else if (selectedCategory.name === 'Electronics') {
      const brand = electronicsBrands.find(b => b.id == electronicsData.brandId);
      if (brand && electronicsData.model) {
        title = `${brand.name} ${electronicsData.model}`;
      } else {
        title = selectedSubCategory.name;
      }
    } else if (selectedCategory.name === 'Furniture') {
      title = furnitureData.brand ? `${furnitureData.brand} ${selectedSubCategory.name}` : selectedSubCategory.name;
    } else if (selectedCategory.name === 'Real Estate') {
      title = `${realEstateData.bedrooms ? realEstateData.bedrooms + 'BHK ' : ''}${realEstateData.propertyType}`;
    } else {
      title = selectedSubCategory.name;
    }
    
    return title;
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

      const submitData = {
        ...formData,
        title: generateTitle(),
        images: uploadedImages,
        deleteAfterHours: formData.deleteAfterWeeks * 7 * 24, // Convert weeks to hours
        vehicleData: formData.categoryId && categories.find(cat => cat.id == formData.categoryId)?.name === 'Vehicle' ? vehicleData : null,
        electronicsData: formData.categoryId && categories.find(cat => cat.id == formData.categoryId)?.name === 'Electronics' ? electronicsData : null,
        furnitureData: formData.categoryId && categories.find(cat => cat.id == formData.categoryId)?.name === 'Furniture' ? furnitureData : null,
        realEstateData: formData.categoryId && categories.find(cat => cat.id == formData.categoryId)?.name === 'Real Estate' ? realEstateData : null
      };

      const response = await fetch('/api/classifieds/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Classified posted successfully!');
        onClose();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error creating classified:', error);
      toast.error('Failed to create classified');
    } finally {
      setLoading(false);
    }
  };

  const renderCategorySpecificFields = () => {
    const selectedCategory = categories.find(cat => cat.id == formData.categoryId);
    const selectedSubCategory = subCategories.find(sub => sub.id == formData.subCategoryId);
    
    if (!selectedCategory || !selectedSubCategory) return null;

    if (selectedCategory.name === 'Vehicle') {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Vehicle Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Brand *</label>
              <select
                value={vehicleData.brandId}
                onChange={(e) => setVehicleData(prev => ({ ...prev, brandId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Brand</option>
                {vehicleBrands.map(brand => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Model *</label>
              <select
                value={vehicleData.modelId}
                onChange={(e) => setVehicleData(prev => ({ ...prev, modelId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!vehicleData.brandId}
              >
                <option value="">Select Model</option>
                {vehicleModels.map(model => (
                  <option key={model.id} value={model.id}>{model.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
              <input
                type="number"
                value={vehicleData.year}
                onChange={(e) => setVehicleData(prev => ({ ...prev, year: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1900"
                max={new Date().getFullYear() + 1}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Registration Year</label>
              <input
                type="number"
                value={vehicleData.registrationYear}
                onChange={(e) => setVehicleData(prev => ({ ...prev, registrationYear: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1900"
                max={new Date().getFullYear()}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mileage (KM)</label>
              <input
                type="number"
                value={vehicleData.mileageKm}
                onChange={(e) => setVehicleData(prev => ({ ...prev, mileageKm: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter mileage"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Engine Capacity (CC)</label>
              <input
                type="number"
                value={vehicleData.engineCapacity}
                onChange={(e) => setVehicleData(prev => ({ ...prev, engineCapacity: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 1200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fuel Type</label>
              <select
                value={vehicleData.fuelType}
                onChange={(e) => setVehicleData(prev => ({ ...prev, fuelType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="petrol">Petrol</option>
                <option value="diesel">Diesel</option>
                <option value="electric">Electric</option>
                <option value="hybrid">Hybrid</option>
                <option value="cng">CNG</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Transmission</label>
              <select
                value={vehicleData.transmission}
                onChange={(e) => setVehicleData(prev => ({ ...prev, transmission: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="manual">Manual</option>
                <option value="automatic">Automatic</option>
                <option value="semi_automatic">Semi Automatic</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Number of Owners</label>
              <input
                type="number"
                value={vehicleData.numberOfOwners}
                onChange={(e) => setVehicleData(prev => ({ ...prev, numberOfOwners: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
              <input
                type="text"
                value={vehicleData.color}
                onChange={(e) => setVehicleData(prev => ({ ...prev, color: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Vehicle color"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Insurance Valid Until</label>
              <input
                type="date"
                value={vehicleData.insuranceValidUntil}
                onChange={(e) => setVehicleData(prev => ({ ...prev, insuranceValidUntil: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={vehicleData.pollutionCertificateValid}
                onChange={(e) => setVehicleData(prev => ({ ...prev, pollutionCertificateValid: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label className="text-sm font-medium text-gray-700">Pollution Certificate Valid</label>
            </div>
          </div>
        </div>
      );
    }

    if (selectedCategory.name === 'Electronics') {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Electronics Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
              <select
                value={electronicsData.brandId}
                onChange={(e) => setElectronicsData(prev => ({ ...prev, brandId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Brand</option>
                {electronicsBrands.map(brand => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
              <input
                type="text"
                value={electronicsData.model}
                onChange={(e) => setElectronicsData(prev => ({ ...prev, model: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Model name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Warranty (Months Left)</label>
              <input
                type="number"
                value={electronicsData.warrantyMonthsLeft}
                onChange={(e) => setElectronicsData(prev => ({ ...prev, warrantyMonthsLeft: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Storage Capacity</label>
              <input
                type="text"
                value={electronicsData.storageCapacity}
                onChange={(e) => setElectronicsData(prev => ({ ...prev, storageCapacity: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 64GB, 1TB"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">RAM</label>
              <input
                type="text"
                value={electronicsData.ram}
                onChange={(e) => setElectronicsData(prev => ({ ...prev, ram: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 8GB, 16GB"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Processor</label>
              <input
                type="text"
                value={electronicsData.processor}
                onChange={(e) => setElectronicsData(prev => ({ ...prev, processor: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Intel i5, Snapdragon 888"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Screen Size</label>
              <input
                type="text"
                value={electronicsData.screenSize}
                onChange={(e) => setElectronicsData(prev => ({ ...prev, screenSize: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 15.6 inches, 6.1 inches"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Energy Rating</label>
              <select
                value={electronicsData.energyRating}
                onChange={(e) => setElectronicsData(prev => ({ ...prev, energyRating: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Energy Rating</option>
                <option value="1_star">1 Star</option>
                <option value="2_star">2 Star</option>
                <option value="3_star">3 Star</option>
                <option value="4_star">4 Star</option>
                <option value="5_star">5 Star</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <div className="flex space-x-6">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={electronicsData.billAvailable}
                    onChange={(e) => setElectronicsData(prev => ({ ...prev, billAvailable: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Bill Available</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={electronicsData.boxAvailable}
                    onChange={(e) => setElectronicsData(prev => ({ ...prev, boxAvailable: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Original Box Available</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (selectedCategory.name === 'Furniture') {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Furniture Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Material</label>
              <input
                type="text"
                value={furnitureData.material}
                onChange={(e) => setFurnitureData(prev => ({ ...prev, material: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Wood, Metal, Plastic"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
              <input
                type="text"
                value={furnitureData.color}
                onChange={(e) => setFurnitureData(prev => ({ ...prev, color: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Furniture color"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Dimensions</label>
              <input
                type="text"
                value={furnitureData.dimensions}
                onChange={(e) => setFurnitureData(prev => ({ ...prev, dimensions: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="L x W x H"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Weight (KG)</label>
              <input
                type="number"
                value={furnitureData.weightKg}
                onChange={(e) => setFurnitureData(prev => ({ ...prev, weightKg: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Weight in kilograms"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
              <input
                type="text"
                value={furnitureData.brand}
                onChange={(e) => setFurnitureData(prev => ({ ...prev, brand: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brand name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Seating Capacity</label>
              <input
                type="number"
                value={furnitureData.seatingCapacity}
                onChange={(e) => setFurnitureData(prev => ({ ...prev, seatingCapacity: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Number of people"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Number of Pieces</label>
              <input
                type="number"
                value={furnitureData.numberOfPieces}
                onChange={(e) => setFurnitureData(prev => ({ ...prev, numberOfPieces: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={furnitureData.assemblyRequired}
                onChange={(e) => setFurnitureData(prev => ({ ...prev, assemblyRequired: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label className="text-sm font-medium text-gray-700">Assembly Required</label>
            </div>
          </div>
        </div>
      );
    }

    if (selectedCategory.name === 'Real Estate') {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Property Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
              <select
                value={realEstateData.propertyType}
                onChange={(e) => setRealEstateData(prev => ({ ...prev, propertyType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="villa">Villa</option>
                <option value="plot">Plot</option>
                <option value="commercial">Commercial</option>
                <option value="office">Office</option>
                <option value="shop">Shop</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Area ({realEstateData.areaUnit})</label>
              <input
                type="number"
                value={realEstateData.areaSqft}
                onChange={(e) => setRealEstateData(prev => ({ ...prev, areaSqft: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Area Unit</label>
              <select
                value={realEstateData.areaUnit}
                onChange={(e) => setRealEstateData(prev => ({ ...prev, areaUnit: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="sqft">Square Feet</option>
                <option value="sqm">Square Meters</option>
                <option value="acre">Acre</option>
                <option value="bigha">Bigha</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
              <input
                type="number"
                value={realEstateData.bedrooms}
                onChange={(e) => setRealEstateData(prev => ({ ...prev, bedrooms: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms</label>
              <input
                type="number"
                value={realEstateData.bathrooms}
                onChange={(e) => setRealEstateData(prev => ({ ...prev, bathrooms: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Floor Number</label>
              <input
                type="number"
                value={realEstateData.floorNumber}
                onChange={(e) => setRealEstateData(prev => ({ ...prev, floorNumber: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Total Floors</label>
              <input
                type="number"
                value={realEstateData.totalFloors}
                onChange={(e) => setRealEstateData(prev => ({ ...prev, totalFloors: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Furnished Status</label>
              <select
                value={realEstateData.furnished}
                onChange={(e) => setRealEstateData(prev => ({ ...prev, furnished: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="unfurnished">Unfurnished</option>
                <option value="semi_furnished">Semi Furnished</option>
                <option value="fully_furnished">Fully Furnished</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Rent (₹)</label>
              <input
                type="number"
                value={realEstateData.monthlyRent}
                onChange={(e) => setRealEstateData(prev => ({ ...prev, monthlyRent: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Rent amount"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Security Deposit (₹)</label>
              <input
                type="number"
                value={realEstateData.securityDeposit}
                onChange={(e) => setRealEstateData(prev => ({ ...prev, securityDeposit: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Deposit amount"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Maintenance Charges (₹)</label>
              <input
                type="number"
                value={realEstateData.maintenanceCharges}
                onChange={(e) => setRealEstateData(prev => ({ ...prev, maintenanceCharges: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Monthly maintenance"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Construction Year</label>
              <input
                type="number"
                value={realEstateData.constructionYear}
                onChange={(e) => setRealEstateData(prev => ({ ...prev, constructionYear: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1900"
                max={new Date().getFullYear()}
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex space-x-6 flex-wrap">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={realEstateData.parking}
                    onChange={(e) => setRealEstateData(prev => ({ ...prev, parking: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Parking Available</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={realEstateData.readyToMove}
                    onChange={(e) => setRealEstateData(prev => ({ ...prev, readyToMove: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Ready to Move</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={realEstateData.clearTitle}
                    onChange={(e) => setRealEstateData(prev => ({ ...prev, clearTitle: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Clear Title</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 sm:p-6 flex items-center justify-between rounded-t-2xl flex-shrink-0">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="text-white hover:text-gray-200 transition-colors p-1"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Create Classified</h2>
              <p className="opacity-90 mt-1 text-sm">List your item for sale</p>
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
            
            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => {
                  const selectedCategoryId = e.target.value;

                  setFormData(prev => ({
                    ...prev,
                    categoryId: selectedCategoryId,
                    subCategoryId: ''
                  }));

                  fetchAvailableLayers(selectedCategoryId);
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.categoryId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              {errors.categoryId && <p className="text-red-500 text-sm mt-1">{errors.categoryId}</p>}
            </div>

            {/* Subcategory Selection */}
            {formData.categoryId && subCategories.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subcategory *
                </label>
                <select
                  value={formData.subCategoryId}
                  onChange={(e) => setFormData(prev => ({ ...prev, subCategoryId: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.subCategoryId ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a subcategory</option>
                  {subCategories.map(subCategory => (
                    <option key={subCategory.id} value={subCategory.id}>{subCategory.name}</option>
                  ))}
                </select>
                {errors.subCategoryId && <p className="text-red-500 text-sm mt-1">{errors.subCategoryId}</p>}
              </div>
            )}

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Images * (Up to 8 images)
              </label>
              
              {/* Upload Area */}
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
                  disabled={uploading || selectedImages.length >= 8}
                  className="flex flex-col items-center justify-center w-full"
                >
                  {uploading ? (
                    <Loader2 size={32} className="mx-auto text-gray-400 animate-spin mb-2" />
                  ) : (
                    <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                  )}
                  <p className="text-sm text-gray-600">
                    Click to upload images ({selectedImages.length}/8)
                  </p>
                </button>
              </div>

              {/* Image Preview Grid */}
              {selectedImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
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

            {/* Basic Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.price ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter price"
                />
                {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Type
                </label>
                <select
                  value={formData.priceType}
                  onChange={(e) => setFormData(prev => ({ ...prev, priceType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="negotiable">Negotiable</option>
                  <option value="fixed">Fixed</option>
                </select>
              </div>
            </div>

            {/* Condition - Show for all categories except Real Estate */}
            {categories.find(cat => cat.id == formData.categoryId)?.name !== 'Real Estate' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condition
                </label>
                <select
                  value={formData.condition}
                  onChange={(e) => setFormData(prev => ({ ...prev, condition: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="new">New</option>
                  <option value="like_new">Like New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="needs_repair">Needs Repair</option>
                </select>
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Describe your item in detail..."
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Your phone number"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>
              </div>
              {errors.contact && <p className="text-red-500 text-sm mt-1">{errors.contact}</p>}

              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Contact Method
                </label>
                <select
                  value={formData.preferredContact}
                  onChange={(e) => setFormData(prev => ({ ...prev, preferredContact: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="both">Phone & Email</option>
                  <option value="phone">Phone Only</option>
                  <option value="email">Email Only</option>
                </select>
              </div>
            </div>

            {/* Auto Delete Option */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock size={16} className="inline mr-2" />
                Auto Delete After
              </label>
              <select
                value={formData.deleteAfterWeeks}
                onChange={(e) => setFormData(prev => ({ ...prev, deleteAfterWeeks: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value={1}>1 Week</option>
                <option value={2}>2 Weeks</option>
                <option value={4}>4 Weeks</option>
              </select>
            </div>

            {/* Location Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin size={16} className="inline mr-2" />
                Location *
              </label>
              <div className="border border-gray-300 rounded-lg overflow-hidden h-64">
                <MapLocationPicker
                  latitude={formData.latitude}
                  longitude={formData.longitude}
                  onLocationChange={handleLocationChange}
                />
              </div>
              {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
            </div>

            {/* Category Specific Fields */}
            {renderCategorySpecificFields()}
          </div>

          {/* Layer Selection */}
          <div>
            <ModernToggle
              enabled={formData.showOnLayers}
              onChange={(value) => setFormData(prev => ({ ...prev, showOnLayers: value }))}
              label="Add to Layers"
              description="Make this post visible on selected layers"
            />
            
            {formData.showOnLayers && (
              <div className="mt-4 space-y-3">
                {availableLayers.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {availableLayers.map((layer) => (
                      <label 
                        key={layer.id} 
                        className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          formData.selectedLayers.includes(layer.id)
                            ? `border-purple-500 bg-purple-50`
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
                          className={`w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500`}
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-800">{layer.name}</span>
                          {layer.description && (
                            <p className="text-xs text-gray-500 mt-1">{layer.description}</p>
                          )}
                        </div>
                        {layer.member_count && (
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                            {layer.member_count}
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users size={24} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No friends layers available</p>
                  </div>
                )}
              </div>
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
          <div className="flex space-x-3 ml-auto">
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
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Classified</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassifiedPostCreation;