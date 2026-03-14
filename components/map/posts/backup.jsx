import React, { useState, useEffect } from 'react';
import { X, Upload, MapPin, Calendar, Link, DollarSign, Clock, Users, AlertCircle, CheckCircle, Loader2, ChevronDown, Search } from 'lucide-react';
import { ImageUploadService } from '@/utils/imageUploadService';
import MapLocationPicker from '@/app/_components/MapLocationPicker';

const PagePostCreation = ({ isOpen, onClose, pageId }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [availableLayers, setAvailableLayers] = useState([]);
  const [skills, setSkills] = useState([]);
  const [educationQualifications, setEducationQualifications] = useState([]);
  
  // Main form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: null,
    imageUrl: '',
    imageFileName: '',
    latitude: 0,
    longitude: 0,
    categoryId: '',
    deleteAfterHours: 24,
    showOnLayers: false,
    selectedLayers: []
  });

  // Post type specific data
  const [newsData, setNewsData] = useState({
    articleUrl: '',
    articleText: '',
    languageId: '',
    isHighPriority: false
  });

  const [jobData, setJobData] = useState({
    jobType: '',
    link: '',
    isPaid: true,
    salaryOrStipend: '',
    locationType: 'onsite',
    duration: '',
    minExperience: 0,
    maxExperience: 0,
    selectedSkills: [], // Array of skill IDs
    selectedEducation: [], // Array of education IDs
    applicationDeadline: '',
    eventName: '',
    eventDate: '',
    additionalInfo: ''
  });

  const [errors, setErrors] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);

  console.log("selectedCategory", selectedCategory)

  // Load initial data
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      fetchLanguages();
      fetchSkills();
      fetchEducationQualifications();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`/api/page/posts/categories`);
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchLanguages = async () => {
    try {
      const response = await fetch('/api/page/posts/languages');
      const data = await response.json();
      setLanguages(data.languages || []);
    } catch (error) {
      console.error('Error fetching languages:', error);
    }
  };

  const fetchAvailableLayers = async (categoryId) => {
    try {
      const response = await fetch(`/api/page/posts/layers?categoryId=${categoryId}`);
      const data = await response.json();
      setAvailableLayers(data.layers || []);
    } catch (error) {
      console.error('Error fetching layers:', error);
    }
  };

  const fetchSkills = async () => {
    try {
      const response = await fetch(`/api/skills`);
      const data = await response.json();
      setSkills(data.skills || []);
    } catch (error) {
      console.error('Error fetching skills:', error);
    }
  };

  const fetchEducationQualifications = async () => {
    try {
      const response = await fetch(`/api/education-qualifications`);
      const data = await response.json();
      setEducationQualifications(data.qualifications || []);
    } catch (error) {
      console.error('Error fetching education qualifications:', error);
    }
  };

  const handleCategoryChange = (categoryId) => {
    const category = categories.find(c => c.id === parseInt(categoryId));
    setSelectedCategory(category);
    setFormData(prev => ({ ...prev, categoryId }));
    
    // Set job type based on category
    if (category?.post_type === 'job') {
      setJobData(prev => ({ ...prev, jobType: category.name }));
    }
    
    // Set delete after hours based on post type and category
    setDeleteAfterHours(category);
    
    // Fetch available layers for this category
    fetchAvailableLayers(categoryId);
  };

  const setDeleteAfterHours = (category) => {
    if (!category) return;
    
    const { post_type, name } = category;
    let options = [];
    
    if (post_type === 'job') {
      if (name === 'Jobs' || name === 'Internship') {
        options = [
          { value: 168, label: '1 week' },
          { value: 336, label: '2 weeks' },
          { value: 720, label: '1 month' }
        ];
      } else if (name === 'Gigs' || name === 'Job Fair' || name === 'Hackathon' || name === 'Walk-in' || name === 'Challenge') {
        options = [
          { value: 24, label: '1 day' },
          { value: 48, label: '2 days' },
          { value: 72, label: '3 days' }
        ];
      }
    } else {
      options = [
        { value: 24, label: '24 hours' },
        { value: 36, label: '36 hours' },
        { value: 48, label: '48 hours' }
      ];
    }
    
    setFormData(prev => ({ 
      ...prev, 
      deleteAfterHours: options[0]?.value || 24,
      deleteOptions: options 
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
     // ✅ Only require description for non-news posts
    if (selectedCategory?.post_type !== 'news' && !formData.description.trim()) {
        newErrors.description = 'Description is required';
    }
    if (!formData.categoryId) newErrors.categoryId = 'Category is required';
    if (!formData.latitude || !formData.longitude) newErrors.location = 'Location is required';
    
    // Post type specific validation
    if (selectedCategory?.post_type === 'news') {
      if (!newsData.articleUrl.trim()) newErrors.articleUrl = 'Article URL is required';
      if (!newsData.articleText.trim()) newErrors.articleText = 'Article text is required';
      if (!newsData.languageId) newErrors.languageId = 'Language is required';
      if (!formData.imageUrl && !formData.imageFileName) {
        newErrors.image = 'Image is required for news posts';
        }
    }

    if (selectedCategory?.post_type === 'job') {
      if (!jobData.link.trim()) newErrors.jobLink = 'Application link is required';
      if (!['Others', 'Job Fair', 'Hackathon', 'Walk-in', 'Challenge'].includes(jobData.jobType)) {
        if (!jobData.salaryOrStipend.trim()) newErrors.salaryOrStipend = 'Salary/Stipend is required';
        if (jobData.selectedSkills.length === 0) newErrors.selectedSkills = 'At least one skill is required';
        if (jobData.selectedEducation.length === 0) newErrors.selectedEducation = 'At least one education qualification is required';
        if (jobData.minExperience < 0) newErrors.minExperience = 'Minimum experience cannot be negative';
        if (jobData.maxExperience < jobData.minExperience) newErrors.maxExperience = 'Maximum experience must be greater than or equal to minimum';
      }
      if (!jobData.applicationDeadline) newErrors.applicationDeadline = 'Application deadline is required';
      
      if (jobData.jobType === 'Others' || jobData.jobType === 'Job Fair' || jobData.jobType === 'Hackathon' || jobData.jobType === 'Walk-in' || jobData.jobType === 'Challenge') {
        if (!jobData.eventName.trim()) newErrors.eventName = 'Event name is required';
        if (!jobData.eventDate) newErrors.eventDate = 'Event date is required';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const postData = {
        pageId,
        title: formData.title,
        description: formData.description,
        imageUrl: selectedCategory?.post_type === 'news' ? formData.imageUrl : null,
        imageFileName: selectedCategory?.post_type !== 'news' ? formData.imageFileName : null,
        latitude: formData.latitude,
        longitude: formData.longitude,
        categoryId: formData.categoryId,
        deleteAfterHours: formData.deleteAfterHours,
        selectedLayers: formData.showOnLayers ? formData.selectedLayers : [],
        postType: selectedCategory?.post_type || 'general'
      };
      
      // Add post type specific data
      if (selectedCategory?.post_type === 'news') {
        postData.newsData = newsData;
      } else if (selectedCategory?.post_type === 'job') {
        postData.jobData = jobData;
      }
      
      const response = await fetch('/api/page/posts/create', {
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
          imageUrl: '',
          imageFileName: '',
          latitude: 0,
          longitude: 0,
          categoryId: '',
          deleteAfterHours: 24,
          showOnLayers: false,
          selectedLayers: []
        });
        setNewsData({
          articleUrl: '',
          articleText: '',
          languageId: '',
          isHighPriority: false
        });
        setJobData({
          jobType: '',
          link: '',
          isPaid: true,
          salaryOrStipend: '',
          locationType: 'onsite',
          duration: '',
          minExperience: 0,
          maxExperience: 0,
          selectedSkills: [],
          selectedEducation: [],
          applicationDeadline: '',
          eventName: '',
          eventDate: '',
          additionalInfo: ''
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Create New Post</h2>
            <p className="text-blue-100 mt-1">Share your content with the community</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="bg-gray-50 px-6 py-4 border-b">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`w-12 h-1 mx-2 ${
                    currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Basic Info</span>
            <span>Details</span>
            <span>Review</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {currentStep === 1 && (
            <BasicInfoStep
              formData={formData}
              setFormData={setFormData}
              categories={categories}
              selectedCategory={selectedCategory}
              handleCategoryChange={handleCategoryChange}
              handleImageUpload={handleImageUpload}
              handleLocationChange={handleLocationChange}
              uploading={uploading}
              errors={errors}
            />
          )}
          
          {currentStep === 2 && (
            <DetailsStep
              selectedCategory={selectedCategory}
              formData={formData}
              setFormData={setFormData}
              newsData={newsData}
              setNewsData={setNewsData}
              jobData={jobData}
              setJobData={setJobData}
              languages={languages}
              availableLayers={availableLayers}
              skills={skills}
              educationQualifications={educationQualifications}
              errors={errors}
            />
          )}
          
          {currentStep === 3 && (
            <ReviewStep
              formData={formData}
              selectedCategory={selectedCategory}
              newsData={newsData}
              jobData={jobData}
              languages={languages}
            />
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t">
          <div>
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Back
              </button>
            )}
          </div>
          <div className="flex space-x-3">
            {currentStep < 3 ? (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
                disabled={currentStep === 1 && (!formData.title || !formData.categoryId)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
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
  selectedCategory, 
  handleCategoryChange,
  handleImageUpload,
  handleLocationChange,
  uploading,
  errors 
}) => {

const [isCategoryOpen, setIsCategoryOpen] = useState(false);
const [categorySearch, setCategorySearch] = useState('');

const [imageInputType, setImageInputType] = useState('url'); // 'url' or 'upload'


const filteredCategories = categories.filter(category =>
  category.name.toLowerCase().includes(categorySearch.toLowerCase())
);

// Add this useEffect to close dropdown when clicking outside
useEffect(() => {
  const handleClickOutside = (event) => {
    if (isCategoryOpen && !event.target.closest('.relative')) {
      setIsCategoryOpen(false);
    }
  };
  
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, [isCategoryOpen]);

  return (
    <div className="space-y-6">

    {/* Category Selection */}
    <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">
            Category *
        </label>
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                className={`w-full p-3 border-2 rounded-lg text-left flex items-center justify-between transition-all ${
                    formData.categoryId 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                } ${errors.categoryId ? 'border-red-500' : ''}`}
            >
            <div className="flex items-center space-x-2">
                {selectedCategory ? (
                <>
                    <div className={`w-4 h-4 rounded-full ${selectedCategory.class_name || 'bg-gray-400'}`} />
                    <span className="text-sm font-medium">{selectedCategory.name}</span>
                </>
                ) : (
                <span className="text-gray-500 text-sm">Select a category</span>
                )}
            </div>
            <ChevronDown size={16} className={`text-gray-400 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
            +</button>
            
            {isCategoryOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60">
                {/* Search Input */}
                <div className="p-3 border-b border-gray-100">
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                    type="text"
                    placeholder="Search categories..."
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                </div>
                
                {/* Category List */}
                <div className="max-h-40 overflow-y-auto">
                {filteredCategories.length > 0 ? (
                    filteredCategories.map((category) => (
                    <button
                        key={category.id}
                        onClick={() => {
                        handleCategoryChange(category.id);
                        setIsCategoryOpen(false);
                        setCategorySearch('');
                        }}
                        className={`w-full p-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-2 ${
                        formData.categoryId === category.id.toString() ? 'bg-blue-50 text-blue-700' : ''
                        }`}
                    >
                        <div className={`w-4 h-4 rounded-full ${category.class_name || 'bg-gray-400'}`} />
                        <span className="text-sm">{category.name}</span>
                    </button>
                    ))
                ) : (
                    <div className="p-3 text-sm text-gray-500 text-center">No categories found</div>
                )}
                </div>
            </div>
            )}
        </div>
        {errors.categoryId && <p className="text-red-500 text-sm mt-1">{errors.categoryId}</p>}
    </div>

    {/* Title */}
    <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
        Post Title *
    </label>
    <input
        type="text"
        value={formData.title}
        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
        errors.title ? 'border-red-500' : 'border-gray-300'
        }`}
        placeholder="Enter an engaging title for your post"
    />
    {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
    </div>

    {/* Description */}
    {
      selectedCategory && selectedCategory.post_type !== 'news' && (
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
              </label>
              <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Describe your post in detail..."
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </div>
      )
    }

    {/* Image Upload/URL */}
    <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
        {selectedCategory?.post_type === 'news' ? 'Image *' : 'Upload Image'}
    </label>
    
    {selectedCategory?.post_type === 'news' ? (
        <div className="space-y-4">
        {/* Tab Selection for News */}
        <div className="flex border-b border-gray-200">
            <button
            type="button"
            onClick={() => setImageInputType('url')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
                imageInputType === 'url'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            >
            Paste URL
            </button>
            <button
            type="button"
            onClick={() => setImageInputType('upload')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
                imageInputType === 'upload'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            >
            Upload Image
            </button>
        </div>
        
        {/* URL Input */}
        {imageInputType === 'url' && (
            <div>
            <input
                type="url"
                value={formData.imageUrl || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value, imageFileName: '' }))}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.image ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="https://example.com/image.jpg"
            />
            </div>
        )}
        
        {/* Upload for News */}
        {imageInputType === 'upload' && (
            <div className={`border-2 border-dashed rounded-lg p-6 text-center hover:border-gray-400 transition-colors ${
            errors.image ? 'border-red-300' : 'border-gray-300'
            }`}>
            <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                handleImageUpload(e.target.files[0]);
                setFormData(prev => ({ ...prev, imageUrl: '' }));
                }}
                className="hidden"
                id="news-image-upload"
            />
            <label htmlFor="news-image-upload" className="cursor-pointer">
                {uploading ? (
                <Loader2 size={48} className="mx-auto text-gray-400 animate-spin" />
                ) : (
                <Upload size={48} className="mx-auto text-gray-400" />
                )}
                <p className="mt-2 text-sm text-gray-600">
                {uploading ? 'Uploading...' : 'Click to upload image'}
                </p>
            </label>
            {formData.imageFileName && (
                <p className="text-green-600 text-sm mt-2">Image uploaded successfully</p>
            )}
            </div>
        )}
        </div>
    ) : (
        /* Upload for Other Categories */
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
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
            <Upload size={48} className="mx-auto text-gray-400" />
            )}
            <p className="mt-2 text-sm text-gray-600">
            {uploading ? 'Uploading...' : 'Click to upload image'}
            </p>
        </label>
        {formData.imageFileName && (
            <p className="text-green-600 text-sm mt-2">Image uploaded successfully</p>
        )}
        </div>
    )}
    
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

      {/* Delete After Hours */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Auto Delete After
        </label>
        <select
          value={formData.deleteAfterHours}
          onChange={(e) => setFormData(prev => ({ ...prev, deleteAfterHours: parseInt(e.target.value) }))}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {formData.deleteOptions?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

// Details Step Component
const DetailsStep = ({ 
  selectedCategory, 
  formData, 
  setFormData, 
  newsData, 
  setNewsData, 
  jobData, 
  setJobData, 
  languages,
  availableLayers,
  skills,
  educationQualifications,
  errors 
}) => {
  if (!selectedCategory) return null;

  return (
    <div className="space-y-6">
      {/* News Specific Fields */}
      {selectedCategory.post_type === 'news' && (
        <NewsDetailsForm 
          newsData={newsData}
          setNewsData={setNewsData}
          languages={languages}
          errors={errors}
        />
      )}

      {/* Job Specific Fields */}
      {selectedCategory.post_type === 'job' && (
        <JobDetailsForm 
          jobData={jobData}
          setJobData={setJobData}
          selectedCategory={selectedCategory}
          errors={errors}
          skills={skills}
          educationQualifications={educationQualifications}
        />
      )}

      {/* Layer Selection */}
      <div>
        <div className="flex items-center space-x-2 mb-3">
          <input
            type="checkbox"
            id="show-on-layers"
            checked={formData.showOnLayers}
            onChange={(e) => setFormData(prev => ({ ...prev, showOnLayers: e.target.checked }))}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="show-on-layers" className="text-sm font-medium text-gray-700">
            Show this post on layers
          </label>
        </div>
        
        {formData.showOnLayers && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Select layers to display this post:</p>
            <div className="space-y-2">
              {availableLayers.map((layer) => (
                <label key={layer.id} className="flex items-center space-x-2">
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
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{layer.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// News Details Form Component
const NewsDetailsForm = ({ newsData, setNewsData, languages, errors }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
        <AlertCircle size={20} className="text-blue-600" />
        <span>News Details</span>
      </h3>

      {/* Article URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Article URL *
        </label>
        <input
          type="url"
          value={newsData.articleUrl}
          onChange={(e) => setNewsData(prev => ({ ...prev, articleUrl: e.target.value }))}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.articleUrl ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="https://example.com/article"
        />
        {errors.articleUrl && <p className="text-red-500 text-sm mt-1">{errors.articleUrl}</p>}
      </div>

      {/* Article Text */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Article Text *
        </label>
        <textarea
          value={newsData.articleText}
          onChange={(e) => setNewsData(prev => ({ ...prev, articleText: e.target.value }))}
          rows={6}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.articleText ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter the full article text..."
        />
        {errors.articleText && <p className="text-red-500 text-sm mt-1">{errors.articleText}</p>}
      </div>

      {/* Language */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Language *
        </label>
        <select
          value={newsData.languageId}
          onChange={(e) => setNewsData(prev => ({ ...prev, languageId: e.target.value }))}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.languageId ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">Select Language</option>
          {languages.map((lang) => (
            <option key={lang.id} value={lang.id}>
              {lang.name}
            </option>
          ))}
        </select>
        {errors.languageId && <p className="text-red-500 text-sm mt-1">{errors.languageId}</p>}
      </div>

      {/* High Priority */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="high-priority"
          checked={newsData.isHighPriority}
          onChange={(e) => setNewsData(prev => ({ ...prev, isHighPriority: e.target.checked }))}
          className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
        />
        <label htmlFor="high-priority" className="text-sm font-medium text-gray-700">
          Mark as high priority news
        </label>
      </div>
    </div>
  );
};

// Job Details Form Component
const JobDetailsForm = ({ jobData, setJobData, selectedCategory, errors, skills, educationQualifications }) => {
  const isOthers = jobData.jobType === 'Others' 
  || jobData.jobType === 'Job Fair' 
  || jobData.jobType === 'Hackathon' 
  || jobData.jobType === 'Walk-in' 
  || jobData.jobType === 'Challenge';

  console.log("isOthers", isOthers)
  const isJob = selectedCategory.name === 'Jobs';
  
  const handleSkillToggle = (skillId) => {
    setJobData(prev => ({
      ...prev,
      selectedSkills: prev.selectedSkills.includes(skillId)
        ? prev.selectedSkills.filter(id => id !== skillId)
        : [...prev.selectedSkills, skillId]
    }));
  };

  const handleEducationToggle = (educationId) => {
    setJobData(prev => ({
      ...prev,
      selectedEducation: prev.selectedEducation.includes(educationId)
        ? prev.selectedEducation.filter(id => id !== educationId)
        : [...prev.selectedEducation, educationId]
    }));
  };
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
        <Users size={20} className="text-blue-600" />
        <span>Job Details</span>
      </h3>

      {/* Application Link */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Application Link *
        </label>
        <input
          type="url"
          value={jobData.link}
          onChange={(e) => setJobData(prev => ({ ...prev, link: e.target.value }))}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.jobLink ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="https://example.com/apply"
        />
        {errors.jobLink && <p className="text-red-500 text-sm mt-1">{errors.jobLink}</p>}
      </div>

      {/* Compensation - Only for non-Others */}
      {!isOthers && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Is Paid
            </label>
            <select
              value={jobData.isPaid}
              onChange={(e) => setJobData(prev => ({ ...prev, isPaid: e.target.value === 'true' }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isJob ? 'Salary (LPA)' : 'Stipend/Payment'} *
            </label>
            <input
              type="text"
              value={jobData.salaryOrStipend}
              onChange={(e) => setJobData(prev => ({ ...prev, salaryOrStipend: e.target.value }))}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.salaryOrStipend ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={isJob ? "e.g., 3-5" : "e.g., ₹10,000"}
            />
            {errors.salaryOrStipend && <p className="text-red-500 text-sm mt-1">{errors.salaryOrStipend}</p>}
          </div>
        </div>
      )}

      {/* Location Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Work Location
        </label>
        <div className="grid grid-cols-3 gap-3">
          {['remote', 'onsite', 'hybrid'].map((type) => (
            <button
              key={type}
              onClick={() => setJobData(prev => ({ ...prev, locationType: type }))}
              className={`p-3 rounded-lg border-2 transition-all capitalize ${
                jobData.locationType === type
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Duration - Not for Jobs */}
      {!isJob && !isOthers && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duration
          </label>
          <input
            type="text"
            value={jobData.duration}
            onChange={(e) => setJobData(prev => ({ ...prev, duration: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., 6 months, 3-6 months"
          />
        </div>
      )}

      {/* Requirements - Not for Others */}
      {!isOthers && (
        <div className="space-y-4">
          {/* Experience Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Experience Required (Years) *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Minimum</label>
                <input
                  type="number"
                  min="0"
                  value={jobData.minExperience}
                  onChange={(e) => setJobData(prev => ({ ...prev, minExperience: parseInt(e.target.value) || 0 }))}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.minExperience ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0"
                />
                {errors.minExperience && <p className="text-red-500 text-xs mt-1">{errors.minExperience}</p>}
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Maximum</label>
                <input
                  type="number"
                  min="0"
                  value={jobData.maxExperience}
                  onChange={(e) => setJobData(prev => ({ ...prev, maxExperience: parseInt(e.target.value) || 0 }))}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.maxExperience ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="5"
                />
                {errors.maxExperience && <p className="text-red-500 text-xs mt-1">{errors.maxExperience}</p>}
              </div>
            </div>
          </div>

          {/* Education Qualifications */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Education Required *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {educationQualifications.map((education) => (
                <label key={education.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={jobData.selectedEducation.includes(education.id)}
                    onChange={() => handleEducationToggle(education.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{education.name}</span>
                </label>
              ))}
            </div>
            {errors.selectedEducation && <p className="text-red-500 text-sm mt-1">{errors.selectedEducation}</p>}
          </div>

          {/* Skills Required */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Skills Required *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {skills.map((skill) => (
                <label key={skill.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={jobData.selectedSkills.includes(skill.id)}
                    onChange={() => handleSkillToggle(skill.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{skill.name}</span>
                </label>
              ))}
            </div>
            {errors.selectedSkills && <p className="text-red-500 text-sm mt-1">{errors.selectedSkills}</p>}
          </div>
        </div>
      )}

      {/* Application Deadline */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Application Deadline *
        </label>
        <input
          type="date"
          value={jobData.applicationDeadline}
          onChange={(e) => setJobData(prev => ({ ...prev, applicationDeadline: e.target.value }))}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.applicationDeadline ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.applicationDeadline && <p className="text-red-500 text-sm mt-1">{errors.applicationDeadline}</p>}
      </div>

      {/* Event Details - Only for Others */}
      {isOthers && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Name *
            </label>
            <input
              type="text"
              value={jobData.eventName}
              onChange={(e) => setJobData(prev => ({ ...prev, eventName: e.target.value }))}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.eventName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Job Fair 2024, Career Expo"
            />
            {errors.eventName && <p className="text-red-500 text-sm mt-1">{errors.eventName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Date *
            </label>
            <input
              type="date"
              value={jobData.eventDate}
              onChange={(e) => setJobData(prev => ({ ...prev, eventDate: e.target.value }))}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.eventDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.eventDate && <p className="text-red-500 text-sm mt-1">{errors.eventDate}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Information
            </label>
            <textarea
              value={jobData.additionalInfo}
              onChange={(e) => setJobData(prev => ({ ...prev, additionalInfo: e.target.value }))}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Any additional details about the event..."
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Review Step Component
const ReviewStep = ({ formData, selectedCategory, newsData, jobData, languages }) => {
  const selectedLanguage = languages.find(lang => lang.id === parseInt(newsData.languageId));
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800">Review Your Post</h3>
      
      {/* Basic Info Review */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-800 mb-3">Basic Information</h4>
        <div className="space-y-2 text-sm">
          <div><strong>Title:</strong> {formData.title}</div>
          <div><strong>Description:</strong> {formData.description}</div>
          <div><strong>Category:</strong> {selectedCategory?.name}</div>
          <div><strong>Location:</strong> {formData.latitude}, {formData.longitude}</div>
          <div><strong>Auto Delete After:</strong> {formData.deleteAfterHours} hours</div>
          {formData.showOnLayers && (
            <div><strong>Will appear on layers:</strong> {formData.selectedLayers.length} selected</div>
          )}
        </div>
      </div>

      {/* News Details Review */}
      {selectedCategory?.post_type === 'news' && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-3">News Details</h4>
          <div className="space-y-2 text-sm">
            <div><strong>Article URL:</strong> {newsData.articleUrl}</div>
            <div><strong>Language:</strong> {selectedLanguage?.name}</div>
            <div><strong>High Priority:</strong> {newsData.isHighPriority ? 'Yes' : 'No'}</div>
            <div><strong>Article Text:</strong> {newsData.articleText.substring(0, 100)}...</div>
          </div>
        </div>
      )}

      {/* Job Details Review */}
      {selectedCategory?.post_type === 'job' && (
        <div className="bg-green-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-3">Job Details</h4>
          <div className="space-y-2 text-sm">
            <div><strong>Job Type:</strong> {jobData.jobType}</div>
            <div><strong>Application Link:</strong> {jobData.link}</div>
            <div><strong>Location Type:</strong> {jobData.locationType}</div>
            {!['Others', 'Job Fair', 'Hackathon', 'Walk-in', 'Challenge'].includes(jobData.jobType) && (
              <>
                <div><strong>Is Paid:</strong> {jobData.isPaid ? 'Yes' : 'No'}</div>
                <div><strong>Salary/Stipend:</strong> {jobData.salaryOrStipend}</div>
                <div><strong>Experience:</strong> {jobData.experienceRequired}</div>
                <div><strong>Education:</strong> {jobData.educationRequired}</div>
                <div><strong>Skills:</strong> {jobData.skillsRequired}</div>
              </>
            )}
            <div><strong>Application Deadline:</strong> {jobData.applicationDeadline}</div>
            {['Others', 'Job Fair', 'Hackathon', 'Walk-in', 'Challenge'].includes(jobData.jobType) && (
              <>
                <div><strong>Event Name:</strong> {jobData.eventName}</div>
                <div><strong>Event Date:</strong> {jobData.eventDate}</div>
              </>
            )}
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

export default PagePostCreation;