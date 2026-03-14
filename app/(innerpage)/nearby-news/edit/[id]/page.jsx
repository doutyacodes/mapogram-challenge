'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Upload, Loader2, AlertCircle, MapPin, X, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import useAuthRedirect from '../../_component/useAuthRedirect';
import RestrictedMapLocationPicker from '../../_component/RestrictedMapLocationPicker';

export default function CreateNewsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id;
  const type = searchParams.get('type');

  const [selectedMainCategory, setSelectedMainCategory] = useState('');
  const [editId, setEditId] = useState(null);
  const [existingImages, setExistingImages] = useState([]); // For existing images
  const [imagesToDelete, setImagesToDelete] = useState([]); // Track images to delete
  const [imageOperationLoading, setImageOperationLoading] = useState(false);

  // Common form data
  const [commonData, setCommonData] = useState({
    latitude: '',
    longitude: '',
    delete_after_hours: 24,
  });


  // News article specific data
  const [newsData, setNewsData] = useState({
    title: '',
    image_url: '',
    content: '',
    category_id: '',
  });

  // Classified ads specific data
  const [classifiedData, setClassifiedData] = useState({
    title: '',
    description: '',
    ad_type: 'sell',
    price: '',
    category: '',
    contact_info: '',
    images: [], // Array of image URLs
  });

  // Obituary specific data
  const [obituaryData, setObituaryData] = useState({
    person_name: '',
    age: '',
    date_of_death: '',
    image_url: '',
  });
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // File handling states
  const [files, setFiles] = useState([]); // For classified (multiple images)
  const [singleFile, setSingleFile] = useState(null); // For news and obituary
  const [filePreviews, setFilePreviews] = useState([]);
  const [singleFilePreview, setSingleFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  
  const [showLocationPrompt, setShowLocationPrompt] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);

  useAuthRedirect();

  // Classified categories
  const classifiedCategories = [
    'Vehicle', 'Electronics', 'Furniture', 'Real Estate', 'Jobs', 
    'Services', 'Fashion', 'Books', 'Sports', 'Others'
  ];

  useEffect(() => {
    fetchCategories();
    checkLocationPermission();
  }, []);

  useEffect(() => {
    if (id && type) {
      setEditId(id);
      fetchExistingData(id, type);
    } else if (id && !type) {
      // Handle error - type is required
      console.error('Type parameter is required for editing');
      // You might want to redirect or show an error message
    }
  }, [id, type]);

  useEffect(() => {
  const handleBeforeUnload = (e) => {
    if (files.length > 0 || singleFile || imagesToDelete.length > 0) {
      e.preventDefault();
      e.returnValue = '';
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [files.length, singleFile, imagesToDelete.length]);

useEffect(() => {
  return () => {
    // Cleanup object URLs
    filePreviews.forEach(preview => {
      if (preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    });
    if (singleFilePreview && singleFilePreview.startsWith('blob:')) {
      URL.revokeObjectURL(singleFilePreview);
    }
  };
}, [filePreviews, singleFilePreview]);


  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/nearby-news/categories');
      if (!res.ok) {
        throw new Error('Failed to fetch categories');
      }
      const data = await res.json();
      
      // Filter categories to separate main categories and news categories
      const mainCategories = data.categories.filter(cat => 
        ['news', 'classifieds', 'obituary'].includes(cat.name.toLowerCase())
      );
      
      const newsCategories = data.categories.filter(cat => 
        !['news', 'classifieds', 'obituary'].includes(cat.name.toLowerCase())
      );
      
      setCategories({ main: mainCategories, news: newsCategories });
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchExistingData = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/nearby-news/edit/${id}?type=${type}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('user_token')}`,
        },
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch existing data');
      }
      
      const data = await res.json();
      
      // Populate form based on content type
      setSelectedMainCategory(data.content_type);
      setCommonData({
        latitude: data.latitude.toString(),
        longitude: data.longitude.toString(),
        delete_after_hours: data.delete_after_hours || 24,
      });
      
      if (data.content_type === 'news') {
        setNewsData({
          title: data.title,
          image_url: data.image_url,
          content: data.content,
          category_id: data.category_id?.toString() || '',
        });
        if (data.image_url) {
          setExistingImages([data.image_url]);
        }
      } else if (data.content_type === 'classified') {
        setClassifiedData({
          title: data.title,
          description: data.description,
          ad_type: data.ad_type,
          price: data.price?.toString() || '',
          category: data.type,
          contact_info: data.contact_info,
          images: [],
        });
        if (data.images && data.images.length > 0) {
          setExistingImages(data.images);
        }
      } else if (data.content_type === 'obituary') {
        setObituaryData({
          person_name: data.person_name,
          age: data.age?.toString() || '',
          date_of_death: data.date_of_death,
          image_url: data.image_url,
        });
        if (data.image_url) {
          setExistingImages([data.image_url]);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Function to calculate distance between two points in kilometers
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; // Distance in km
    return d;
  };
  
  const deg2rad = (deg) => {
    return deg * (Math.PI/180);
  };

  const checkLocationPermission = async () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    try {
      // Check if permission is already granted
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({name: 'geolocation'});
        
        if (permission.state === 'granted') {
          // Permission is granted, get current position
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              setUserLocation({ latitude, longitude });
              setCommonData(prev => ({
                ...prev,
                latitude: latitude.toString(),
                longitude: longitude.toString()
              }));
              setShowLocationPrompt(false);
            },
            (error) => {
              setLocationError("Unable to get your current location");
              setShowLocationPrompt(true);
            }
          );
        } else {
          setShowLocationPrompt(true);
        }
      } else {
        // Fallback for browsers that don't support permissions API
        setShowLocationPrompt(true);
      }
    } catch (error) {
      setShowLocationPrompt(true);
    }
  };

    // Function to request location access
  const requestLocationAccess = () => {
    setLocationLoading(true);
    setLocationError(null);
    
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setLocationLoading(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        setCommonData(prev => ({
          ...prev,
          latitude: latitude.toString(),
          longitude: longitude.toString()
        }));
        setShowLocationPrompt(false);
        setLocationLoading(false);
      },
      (error) => {
        let errorMessage = "Unable to retrieve your location";
        if (error.code === 1) {
          errorMessage = "You denied the request for geolocation";
        } else if (error.code === 2) {
          errorMessage = "Location information is unavailable";
        } else if (error.code === 3) {
          errorMessage = "The request to get your location timed out";
        }
        setLocationError(errorMessage);
        setLocationLoading(false);
        // Show location prompt if permission was denied
        if (error.code === 1) {
          setShowLocationPrompt(true);
        }
      },
      { enableHighAccuracy: true }
    );
  };

  // Location permission popup
  const LocationPrompt = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-fadeIn">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-gray-800">Location Permission Required</h3>
          <button 
            onClick={() => router.push('/nearby-news/home')}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="mb-6">
          <div className="flex justify-center mb-4">
            <MapPin className="h-12 w-12 text-red-600" />
          </div>
          <p className="text-gray-700 mb-2">
            To post hyperlocal news, we need your current location. You can only post news within 10km of your location.
          </p>
          {locationError && (
            <div className="mt-2 p-3 bg-red-50 border border-red-100 rounded text-red-700 text-sm">
              {locationError}
            </div>
          )}
        </div>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={requestLocationAccess}
            disabled={locationLoading}
            className="w-full px-4 py-2 bg-red-800 text-white rounded-md hover:bg-red-700 transition focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {locationLoading ? (
              <span className="flex items-center justify-center">
                <Loader2 className="animate-spin mr-2 h-5 w-5" />
                Getting Location...
              </span>
            ) : (
              'Allow Location Access'
            )}
          </button>
          <button
            onClick={() => router.push('/nearby-news/home')}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );

  const handleLocationChange = (lat, lng) => {
    setCommonData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng
    }));
  };

  const handleNewsInputChange = (e) => {
    const { name, value } = e.target;
    setNewsData(prev => ({ ...prev, [name]: value }));
  };

  const handleClassifiedInputChange = (e) => {
    const { name, value } = e.target;
    setClassifiedData(prev => ({ ...prev, [name]: value }));
  };

  const handleObituaryInputChange = (e) => {
    const { name, value } = e.target;
    setObituaryData(prev => ({ ...prev, [name]: value }));
  };

  const handleTextareaChange = (e) => {
    const { name, value } = e.target;
    
    if (selectedMainCategory === 'news') {
      setNewsData(prev => ({ ...prev, [name]: value }));
    } else if (selectedMainCategory === 'classified') {
      setClassifiedData(prev => ({ ...prev, [name]: value }));
    }
    
    // Auto-resize logic
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  // Single file handling (for news and obituary)
  const handleSingleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setSingleFile(selectedFile);
      const previewUrl = URL.createObjectURL(selectedFile);
      setSingleFilePreview(previewUrl);
    }
  };

  // Multiple file handling (for classified)
  const handleMultipleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const totalImages = existingImages.length + files.length + selectedFiles.length;
    
    if (totalImages > 10) {
      setError('Maximum 10 images allowed in total');
      return;
    }
    
    const newFiles = [...files, ...selectedFiles];
    const newPreviews = [...filePreviews];
    
    selectedFiles.forEach(file => {
      const previewUrl = URL.createObjectURL(file);
      newPreviews.push(previewUrl);
    });
    
    setFiles(newFiles);
    setFilePreviews(newPreviews);
    setError(null); // Clear any previous error
  };

  const removeImage = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = filePreviews.filter((_, i) => i !== index);
    setFiles(newFiles);
    setFilePreviews(newPreviews);
  };

  const removeExistingImage = async (imageUrl, index) => {
    setImageOperationLoading(true);
    try {
      const newExistingImages = existingImages.filter((_, i) => i !== index);
      setExistingImages(newExistingImages);
      
      const filename = imageUrl.split('/').pop();
      setImagesToDelete(prev => [...prev, filename]);
    } finally {
      setImageOperationLoading(false);
    }
  };

  const uploadImageToCPanel = async (file) => {
    const formData = new FormData();
    formData.append('coverImage', file);
    
    try {
      setUploading(true);
      const response = await fetch('https://wowfy.in/testusr/upload.php', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      
      return data.filePath; // This should be the filename returned from PHP
    } catch (error) {
      throw new Error(`Image upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setError(null);
    
    // Validate that user has allowed location access
    if (!userLocation) {
      setError("Location permission is required to post news");
      setFormSubmitting(false);
      setShowLocationPrompt(true);
      return;
    }
    
    // In handleSubmit, modify the required image validation:
    if (selectedMainCategory === 'classified') {
      if (existingImages.length === 0 && files.length === 0) {
        setError('At least one image is required for classified ads');
        setFormSubmitting(false);
        return;
      }
    } else if (selectedMainCategory === 'news') {
      if (!existingImages[0] && !singleFile) {
        setError('An image is required for news articles');
        setFormSubmitting(false);
        return;
      }
    }

    // Check if news location is within 10km of user's location
    if (commonData.latitude && commonData.longitude) {
      const newsLat = parseFloat(commonData.latitude);
      const newsLng = parseFloat(commonData.longitude);
      const userLat = userLocation.latitude;
      const userLng = userLocation.longitude;
      
      const distance = calculateDistance(userLat, userLng, newsLat, newsLng);
      
      if (distance > 10) {
        setError("News location must be within 10km of your current location");
        setFormSubmitting(false);
        return;
      }
    }
    
    try {
      let endpoint = '';
      let dataToSubmit = {};
      
      // Handle image uploads based on category
      if (selectedMainCategory === 'classified') {
        // Upload new images for classified
        const newImageUrls = [];
        for (const file of files) {
          const uploadedFileName = await uploadImageToCPanel(file);
          newImageUrls.push(`https://wowfy.in/testusr/images/${uploadedFileName}`);
        }
        
        // Combine existing and new images
        const allImages = [...existingImages, ...newImageUrls];
        
        endpoint = `/api/nearby-news/classified/${editId}`;
        dataToSubmit = {
          ...classifiedData,
          images: allImages,
          images_to_delete: imagesToDelete,
          ...commonData,
          latitude: parseFloat(commonData.latitude),
          longitude: parseFloat(commonData.longitude),
        };
      } else if (selectedMainCategory === 'obituary') {
        // Handle single image for obituary
        let imageUrl = existingImages[0] || '';
        if (singleFile) {
          const uploadedFileName = await uploadImageToCPanel(singleFile);
          imageUrl = `https://wowfy.in/testusr/images/${uploadedFileName}`;
        }
        
        endpoint = `/api/nearby-news/obituary/${editId}`;
        dataToSubmit = {
          ...obituaryData,
          image_url: imageUrl,
          images_to_delete: imagesToDelete,
          ...commonData,
          latitude: parseFloat(commonData.latitude),
          longitude: parseFloat(commonData.longitude),
        };
      } else {
        // Handle single image for news
        let imageUrl = existingImages[0] || newsData.image_url;
        if (singleFile) {
          const uploadedFileName = await uploadImageToCPanel(singleFile);
          imageUrl = `https://wowfy.in/testusr/images/${uploadedFileName}`;
        }
        
        endpoint = `/api/nearby-news/${editId}`;
        dataToSubmit = {
          ...newsData,
          image_url: imageUrl,
          // images_to_delete: imagesToDelete,
          original_image_url: imagesToDelete || null,
          ...commonData,
          latitude: parseFloat(commonData.latitude),
          longitude: parseFloat(commonData.longitude),
          category_id: newsData.category_id ? parseInt(newsData.category_id) : null,
        };
      }

      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('user_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSubmit),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Failed to update post`);
      }
      
      router.push('/nearby-news/home');
      
    } catch (err) {
      setError(err.message);
      setFormSubmitting(false);
    }
  };

  const renderCategorySpecificFields = () => {
    switch (selectedMainCategory) {
      case 'news':
        return (
          <>
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={newsData.title}
                onChange={handleNewsInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                placeholder="Enter news title"
              />
            </div>
            
            {/* Single Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image <span className="text-red-500">*</span>
              </label>
              
              {/* Existing Image Preview */}
              {existingImages.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Current Image:</p>
                  <div className="relative inline-block">
                    <img 
                      src={existingImages[0]} 
                      alt="Current" 
                      className="h-32 w-32 object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(existingImages[0], 0)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-center w-full">
                <label htmlFor="single-file-upload" className="w-full flex flex-col items-center px-4 py-6 bg-white text-gray-500 rounded-lg shadow-lg tracking-wide border border-dashed border-gray-400 cursor-pointer hover:bg-gray-50">
                  {singleFilePreview ? (
                    <div className="relative w-full h-48">
                      <img 
                        src={singleFilePreview} 
                        alt="Preview" 
                        className="h-full mx-auto object-contain"
                      />
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-red-800" />
                      <span className="mt-2 text-base">{existingImages.length > 0 ? 'Replace image' : 'Select an image file'}</span>
                    </>
                  )}
                  <input 
                    id="single-file-upload" 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleSingleFileChange}
                    required={existingImages.length === 0}
                  />
                </label>
              </div>
            </div>
            
            {/* Article Content */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                Article Content <span className="text-red-500">*</span>
              </label>
              <textarea
                id="content"
                name="content"
                value={newsData.content}
                onChange={handleTextareaChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 min-h-[120px]"
                placeholder="Enter the full article content here..."
                style={{ resize: 'none', overflow: 'hidden' }}
              />
            </div>
            
            {/* News Category */}
            <div>
              <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-1">
                News Category
              </label>
              <select
                id="category_id"
                name="category_id"
                value={newsData.category_id}
                onChange={handleNewsInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
              >
                <option value="">Select a category</option>
                {categories.news && categories.news.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name
                      .split(" ")
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(" ")}
                  </option>
                ))}
              </select>
            </div>
          </>
        );

      case 'classified':
        return (
          <>
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Item Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={classifiedData.title}
                onChange={handleClassifiedInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                placeholder="e.g., Honda Activa 2022"
              />
            </div>

            {/* Ad Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ad Type <span className="text-red-500">*</span>
              </label>
              <div className="flex space-x-6">
                <div className="flex items-center">
                  <input
                    id="ad-sell"
                    name="ad_type"
                    type="radio"
                    value="sell"
                    checked={classifiedData.ad_type === 'sell'}
                    onChange={handleClassifiedInputChange}
                    className="h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"
                  />
                  <label htmlFor="ad-sell" className="ml-2 block text-sm text-gray-700">
                    For Sale
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="ad-rent"
                    name="ad_type"
                    type="radio"
                    value="rent"
                    checked={classifiedData.ad_type === 'rent'}
                    onChange={handleClassifiedInputChange}
                    className="h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"
                  />
                  <label htmlFor="ad-rent" className="ml-2 block text-sm text-gray-700">
                    For Rent
                  </label>
                </div>
              </div>
            </div>

            {/* Price */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                Price
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={classifiedData.price}
                onChange={handleClassifiedInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                placeholder="Enter price"
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                name="category"
                value={classifiedData.category}
                onChange={handleClassifiedInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
              >
                <option value="">Select a category</option>
                {classifiedCategories.map(category => (
                  <option key={category} value={category.toLowerCase()}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

          {/* Multiple Images Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Images (Max 10) <span className="text-red-500">*</span>
            </label>
            
            {/* Existing Images Preview */}
            {existingImages.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Current Images:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                  {existingImages.map((imageUrl, index) => (
                    <div key={`existing-${index}`} className="relative">
                      <img 
                        src={imageUrl} 
                        alt={`Existing ${index + 1}`} 
                        className="w-full h-24 object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(imageUrl, index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-center w-full">
              <label htmlFor="multiple-file-upload" className="w-full flex flex-col items-center px-4 py-6 bg-white text-gray-500 rounded-lg shadow-lg tracking-wide border border-dashed border-gray-400 cursor-pointer hover:bg-gray-50">
                <Upload className="w-8 h-8 text-red-800" />
                <span className="mt-2 text-base">Add more images (Max 10 total)</span>
                <input 
                  id="multiple-file-upload" 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  multiple
                  onChange={handleMultipleFileChange}
                  disabled={existingImages.length + files.length >= 10}
                />
              </label>
            </div>
            
            {/* New Images Preview */}
            {filePreviews.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">New Images to Add:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filePreviews.map((preview, index) => (
                    <div key={`new-${index}`} className="relative">
                      <img 
                        src={preview} 
                        alt={`New ${index + 1}`} 
                        className="w-full h-24 object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* Image Count Display */}
          <div className="text-sm text-gray-600 mt-2">
            Total Images: {existingImages.length + files.length} / 10
          </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={classifiedData.description}
                onChange={handleTextareaChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 min-h-[100px]"
                placeholder="Describe your item in detail..."
                style={{ resize: 'none', overflow: 'hidden' }}
              />
            </div>

            {/* Contact Info */}
            <div>
              <label htmlFor="contact_info" className="block text-sm font-medium text-gray-700 mb-1">
                Contact Information <span className="text-red-500">*</span>
              </label>
              <textarea
                id="contact_info"
                name="contact_info"
                value={classifiedData.contact_info}
                onChange={handleClassifiedInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                placeholder="Phone number, email, or other contact details"
                rows="2"
              />
            </div>
          </>
        );

      case 'obituary':
        return (
          <>
            {/* Person Name */}
            <div>
              <label htmlFor="person_name" className="block text-sm font-medium text-gray-700 mb-1">
                Person&apos;s Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="person_name"
                name="person_name"
                value={obituaryData.person_name}
                onChange={handleObituaryInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                placeholder="Enter person's full name"
              />
            </div>

            {/* Age */}
            <div>
              <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
                Age
              </label>
              <input
                type="number"
                id="age"
                name="age"
                value={obituaryData.age}
                onChange={handleObituaryInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                placeholder="Enter age"
              />
            </div>

            {/* Date of Death */}
            <div>
              <label htmlFor="date_of_death" className="block text-sm font-medium text-gray-700 mb-1">
                Date of Death <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="date_of_death"
                name="date_of_death"
                value={obituaryData.date_of_death}
                onChange={handleObituaryInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
              />
            </div>

            {/* Single Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Photo (Optional)
              </label>
              <div className="flex items-center justify-center w-full">
                <label htmlFor="obituary-file-upload" className="w-full flex flex-col items-center px-4 py-6 bg-white text-gray-500 rounded-lg shadow-lg tracking-wide border border-dashed border-gray-400 cursor-pointer hover:bg-gray-50">
                  {singleFilePreview ? (
                    <div className="relative w-full h-48">
                      <img 
                        src={singleFilePreview} 
                        alt="Preview" 
                        className="h-full mx-auto object-contain"
                      />
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-red-800" />
                      <span className="mt-2 text-base">Select a photo</span>
                    </>
                  )}
                  <input 
                    id="obituary-file-upload" 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleSingleFileChange}
                  />
                </label>
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-20">
      {showLocationPrompt && <LocationPrompt />}
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link 
            href="/nearby-news/home" 
            className="flex items-center text-red-800 hover:text-red-700 transition mb-6"
          >
            <ArrowLeft className="h-5 w-5 mr-2" /> Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Create Post</h1>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
              <div>
                <p className="text-red-800 font-medium">Error</p>
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Main Category Selection */}
              <div>
                <label htmlFor="main_category" className="block text-sm font-medium text-gray-700 mb-1">
                  Content Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="main_category"
                  value={selectedMainCategory}
                  onChange={(e) => setSelectedMainCategory(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">Select content type</option>
                  <option value="news">News Article</option>
                  <option value="classified">Classified Ad</option>
                  <option value="obituary">Obituary</option>
                </select>
              </div>

              {/* Category Specific Fields */}
              {selectedMainCategory && renderCategorySpecificFields()}

              {/* Common Fields - Location */}
              {selectedMainCategory && (
                <>
                  <RestrictedMapLocationPicker
                    latitude={commonData.latitude}
                    longitude={commonData.longitude}
                    onLocationChange={handleLocationChange}
                    radiusKm={10}
                    isReadOnly={true}
                  />

                  {/* Delete After Hours */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delete After Hours <span className="text-red-500">*</span>
                    </label>
                    <div className="flex space-x-6">
                      <div className="flex items-center">
                        <input
                          id="delete-24"
                          name="delete_after_hours"
                          type="radio"
                          value="24"
                          checked={commonData.delete_after_hours === 24}
                          onChange={(e) => setCommonData({...commonData, delete_after_hours: parseInt(e.target.value)})}
                          className="h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"
                        />
                        <label htmlFor="delete-24" className="ml-2 block text-sm text-gray-700">
                          24 hours
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="delete-36"
                          name="delete_after_hours"
                          type="radio"
                          value="36"
                          checked={commonData.delete_after_hours === 36}
                          onChange={(e) => setCommonData({...commonData, delete_after_hours: parseInt(e.target.value)})}
                          className="h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"
                        />
                        <label htmlFor="delete-36" className="ml-2 block text-sm text-gray-700">
                          36 hours
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="delete-48"
                          name="delete_after_hours"
                          type="radio"
                          value="48"
                          checked={commonData.delete_after_hours === 48}
                          onChange={(e) => setCommonData({...commonData, delete_after_hours: parseInt(e.target.value)})}
                          className="h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"
                        />
                        <label htmlFor="delete-48" className="ml-2 block text-sm text-gray-700">
                          48 hours
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      disabled={formSubmitting || uploading || !userLocation || !selectedMainCategory}
                      className="px-6 py-2 bg-red-800 text-white rounded-md hover:bg-red-700 transition focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {(formSubmitting || uploading) ? (
                        <span className="flex items-center">
                          <Loader2 className="animate-spin mr-2 h-5 w-5" />
                          {uploading ? 'Uploading...' : 'Creating...'}
                        </span>
                      ) : (
                        `Update ${selectedMainCategory === 'news' ? 'News' : selectedMainCategory === 'classified' ? 'Ad' : 'Obituary'}`
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}