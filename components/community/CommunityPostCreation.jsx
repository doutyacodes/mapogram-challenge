import React, { useState, useEffect } from 'react';
import { X, Upload, MapPin, Calendar, Link, DollarSign, Clock, Users, AlertCircle, CheckCircle, Loader2, ChevronDown, Search, Briefcase, Package } from 'lucide-react';
import { ImageUploadService } from '@/utils/imageUploadService';
import MapLocationPicker from '@/app/_components/MapLocationPicker';
import BoundaryRestrictedLocationPicker from '@/app/_components/BoundaryRestrictedLocationPicker';

const CommunityPostCreation = ({ isOpen, onClose, communityId, communityName = 'Startup' }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [skills, setSkills] = useState([]);
  const [educationQualifications, setEducationQualifications] = useState([]);
  const [userEntities, setUserEntities] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [communityType, setCommunityType] = useState(''); // Add this to track community type
  const [complaintData, setComplaintData] = useState({
    selectedDepartments: [],
    locationDescription: '',
    severity: 'low'
  });
  
  const [communityTypeLoading, setCommunityTypeLoading] = useState(true);


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
    selectedLayers: [],
    postedByEntityId: null // Will be set based on user selection
  });

  // Post type specific data
  const [jobData, setJobData] = useState({
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

  const [eventData, setEventData] = useState({
    event_type: '',
    event_date: '',
    link: '',
    additional_info: ''
  });

  const [productLaunchData, setProductLaunchData] = useState({
    product_name: '',
    launch_date: '',
    link: '',
    additional_info: ''
  });

  const [errors, setErrors] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Load initial data
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      fetchSkills();
      fetchEducationQualifications();
      fetchUserEntities();
      fetchCommunityType();
    }
  }, [isOpen, communityId]);

  // useEffect to fetch community type and departments
  // useEffect(() => {
  //   if (isOpen && communityId) {
  //     fetchCommunityType();
  //     if (communityType === 'district') {
  //       fetchDepartments();
  //     }
  //   }
  // }, [isOpen, communityId, communityType]);

  const fetchCommunityType = async () => {
    try {
      setCommunityTypeLoading(true);
      const response = await fetch(`/api/communities/${communityId}/type`);
      const data = await response.json();
      setCommunityType(data.community_type);
      
      if (data.community_type === 'district') {
        await fetchDepartments();
      }
    } catch (error) {
      console.error('Error fetching community type:', error);
      setCommunityType('general'); // Default to general on error
    } finally {
      setCommunityTypeLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch(`/api/communities/departments?communityId=${communityId}`);
      const data = await response.json();
      setDepartments(data.departments || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

// Add this helper function to determine if we need the details step
const needsDetailsStep = (category, communityType) => {
  if (!category) return false;
  
  if (communityType === 'district') {
    return category.name !== 'Official Notice / Public Announcement';
  }
  
  return !(category.post_type === 'general' || category.name === 'Collaboration');
};

// Modify the next step handler
const handleNextStep = () => {
  if (currentStep === 1 && !needsDetailsStep(selectedCategory)) {
    // If no details needed, skip to submit
    handleSubmit();
  } else {
    setCurrentStep(prev => prev + 1);
  }
};

  const fetchCategories = async () => {
    try {
      const response = await fetch(`/api/communities/post/categories?communityId=${communityId}`);
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
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

  const fetchUserEntities = async () => {
    try {
      // Build the URL with optional community_id parameter
      const url = communityId 
        ? `/api/user/entities?community_id=${communityId}`
        : `/api/user/entities`;
      
      const response = await fetch(url);
      const data = await response.json();
      setUserEntities(data.entities || []);
      
      // Set default postedByEntityId to user's own entity if available
      if (data.entities.length > 0) {
        const userEntity = data.entities.find(e => e.type === 'user');
        if (userEntity) {
          setFormData(prev => ({ ...prev, postedByEntityId: userEntity.id }));
        }
      }
    } catch (error) {
      console.error('Error fetching user entities:', error);
    }
  };

// // Show loading state in UI if needed
// if (communityTypeLoading) {
//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//       <div className="bg-white rounded-2xl p-6">
//         <div className="flex items-center space-x-2">
//           <Loader2 size={20} className="animate-spin" />
//           <span>Loading community details...</span>
//         </div>
//       </div>
//     </div>
//   );
// }

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
  };

  const setDeleteAfterHours = (category) => {
    if (!category) return;
    
    const { post_type, name } = category;
    let options = [];
    
    if (post_type === 'general') {
      options = [
        { value: 24, label: '24 hours' },
        { value: 48, label: '48 hours' },
        { value: 72, label: '72 hours' }
      ];
    } else if (post_type === 'job' || name === 'Internship') {
      options = [
        { value: 168, label: '1 week' },
        { value: 336, label: '2 weeks' },
        { value: 720, label: '1 month' }
      ];
    } else if (post_type === 'event') {
      options = [
        { value: 24, label: '1 day' },
        { value: 48, label: '2 days' },
        { value: 72, label: '3 days' }
      ];
    } else if (post_type === 'announcement') {
      options = [
        { value: 720, label: '1 month' },
        { value: 1440, label: '2 months' },
        { value: 2160, label: '3 months' }
      ];
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
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.categoryId) newErrors.categoryId = 'Category is required';
    if (!formData.latitude || !formData.longitude) newErrors.location = 'Location is required';
    if (!formData.postedByEntityId) newErrors.postedByEntityId = 'Please select who is posting';
    
    // Post type specific validation
    if (selectedCategory?.post_type === 'job') {
      if (!jobData.link.trim()) newErrors.jobLink = 'Application link is required';
      if (!jobData.salaryOrStipend.trim()) newErrors.salaryOrStipend = 'Salary/Stipend is required';
      if (jobData.selectedSkills.length === 0) newErrors.selectedSkills = 'At least one skill is required';
      if (jobData.selectedEducation.length === 0) newErrors.selectedEducation = 'At least one education qualification is required';
      if (jobData.minExperience < 0) newErrors.minExperience = 'Minimum experience cannot be negative';
      if (jobData.maxExperience < jobData.minExperience) newErrors.maxExperience = 'Maximum experience must be greater than or equal to minimum';
      if (!jobData.applicationDeadline) newErrors.applicationDeadline = 'Application deadline is required';
    }

    if (selectedCategory?.post_type === 'event') {
      if (!eventData.event_type) newErrors.event_type = 'Event type is required';
      if (!eventData.event_date) newErrors.event_date = 'Event date is required';
    }

    if (selectedCategory?.post_type === 'announcement' && selectedCategory.name == 'Product Launch') {
      if (!productLaunchData.product_name) newErrors.product_name = 'Product name is required';
      if (!productLaunchData.launch_date) newErrors.launch_date = 'Launch date is required';
    }

      // District community validations
      if (communityType === 'district') {
        if (selectedCategory?.name !== 'Official Notice / Public Announcement') {
          if (complaintData.selectedDepartments.length === 0) {
            newErrors.selectedDepartments = 'Please select at least one department';
          }
          if (complaintData.selectedDepartments.length > 3) {
            newErrors.selectedDepartments = 'Maximum 3 departments allowed';
          }
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
        communityId,
        title: formData.title,
        description: formData.description,
        imageUrl: formData.imageUrl,
        imageFileName: formData.imageFileName,
        latitude: formData.latitude,
        longitude: formData.longitude,
        categoryId: formData.categoryId,
        deleteAfterHours: formData.deleteAfterHours,
        selectedLayers: formData.showOnLayers ? formData.selectedLayers : [],
        postedByEntityId: formData.postedByEntityId,
        postType: selectedCategory?.post_type || 'general',
        communityType: communityType,
        complaintData: communityType === 'district' ? complaintData : null,
        categoryName: selectedCategory?.name
      };
      
      // Add post type specific data
      if (selectedCategory?.post_type === 'job') {
        postData.jobData = jobData;
      } else if (selectedCategory?.post_type === 'event') {
        postData.eventData = eventData;
      } else if (selectedCategory?.post_type === 'announcement') {
        postData.productLaunchData = productLaunchData;
      }
      
      const response = await fetch('/api/communities/post/create', {
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
          selectedLayers: [],
          postedByEntityId: null
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
        setEventData({
          event_type: '',
          event_date: '',
          link: '',
          additional_info: ''
        });
        setProductLaunchData({
          product_name: '',
          launch_date: '',
          link: '',
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Create New Post</h2>
            <p className="text-amber-100 mt-1">Posting to {communityName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Progress Steps - Only show when we have a details step */}
        {needsDetailsStep(selectedCategory, communityType) && (
          <div className="bg-gray-50 px-6 py-4 border-b">
            <div className="flex items-center space-x-4">
              {[1, 2].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step ? 'bg-amber-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step}
                  </div>
                  {step < 2 && (
                    <div className={`w-12 h-1 mx-2 ${
                      currentStep > step ? 'bg-amber-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-600">
              <span>Basic Info</span>
              <span>Details</span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {currentStep === 1 && (
            <BasicInfoStep
              formData={formData}
              communityId={communityId}
              setFormData={setFormData}
              categories={categories}
              selectedCategory={selectedCategory}
              handleCategoryChange={handleCategoryChange}
              handleImageUpload={handleImageUpload}
              handleLocationChange={handleLocationChange}
              uploading={uploading}
              errors={errors}
              userEntities={userEntities}
              needsDetailsStep={needsDetailsStep(selectedCategory, communityType)}
              onSubmit={handleSubmit}
              communityType={communityType} // Add this
              departments={departments} // Add this
              complaintData={complaintData} // Add this
              setComplaintData={setComplaintData} // Add this
            />
          )}
          
          {currentStep === 2 && needsDetailsStep(selectedCategory, communityType) && (
            communityType === 'district' ? (
              <DistrictDetailsStep
                complaintData={complaintData}
                setComplaintData={setComplaintData}
                selectedCategory={selectedCategory}
                errors={errors}
              />
            ) : (
            <DetailsStep
              selectedCategory={selectedCategory}
              formData={formData}
              setFormData={setFormData}
              jobData={jobData}
              setJobData={setJobData}
              eventData={eventData}
              setEventData={setEventData}
              productLaunchData={productLaunchData}
              setProductLaunchData={setProductLaunchData}
              skills={skills}
              educationQualifications={educationQualifications}
              errors={errors}
            />
            )
          )}

          {currentStep === 3 && (
            <ReviewStep
              formData={formData}
              selectedCategory={selectedCategory}
              jobData={jobData}
              eventData={eventData}
              productLaunchData={productLaunchData}
              userEntities={userEntities}
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
          {currentStep < (needsDetailsStep(selectedCategory, communityType) ? 2 : 1) ? (
            <button
              onClick={handleNextStep}
              disabled={currentStep === 1 && (!formData.title || !formData.categoryId || !formData.postedByEntityId)}
              className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {needsDetailsStep(selectedCategory, communityType) ? 'Next' : 'Create Post'}
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
  communityId,
  setFormData, 
  categories, 
  selectedCategory, 
  handleCategoryChange,
  handleImageUpload,
  handleLocationChange,
  uploading,
  errors,
  userEntities,
  needsDetailsStep,
  onSubmit,
  communityType,
  departments,
  complaintData,
  setComplaintData,
}) => {
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [imageInputType, setImageInputType] = useState('url');

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

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
      {/* Posted As Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Posting As *
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {userEntities.map(entity => (
            <button
              key={entity.id}
              onClick={() => setFormData(prev => ({ ...prev, postedByEntityId: entity.id }))}
              className={`p-3 rounded-lg border-2 transition-all flex items-center space-x-2 ${
                formData.postedByEntityId === entity.id
                  ? 'border-amber-500 bg-amber-50 text-amber-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-amber-400" />
              <span>{entity.name}</span>
            </button>
          ))}
        </div>
        {errors.postedByEntityId && <p className="text-red-500 text-sm mt-1">{errors.postedByEntityId}</p>}
      </div>

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
              ? 'border-amber-500 bg-amber-50' 
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
          </button>
          
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
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
                        formData.categoryId === category.id.toString() ? 'bg-amber-50 text-amber-700' : ''
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

    {communityType === 'district' && departments && departments.length > 0 && (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Departments (Max 3) *
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
          {departments.map((department) => (
            <label key={department.id} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={complaintData.selectedDepartments.includes(department.id)}
                onChange={(e) => {
                  if (e.target.checked && complaintData.selectedDepartments.length >= 3) {
                    return; // Limit to 3
                  }
                  setComplaintData(prev => ({
                    ...prev,
                    selectedDepartments: e.target.checked
                      ? [...prev.selectedDepartments, department.id]
                      : prev.selectedDepartments.filter(id => id !== department.id)
                  }));
                }}
                disabled={complaintData.selectedDepartments.length >= 3 && 
                        !complaintData.selectedDepartments.includes(department.id)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{department.name}</span>
            </label>
          ))}
        </div>
        {complaintData.selectedDepartments.length >= 3 && (
          <p className="text-sm text-gray-500 mt-1">Maximum 3 departments selected</p>
        )}
        {errors.selectedDepartments && <p className="text-red-500 text-sm mt-1">{errors.selectedDepartments}</p>}
      </div>
    )}

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {selectedCategory?.post_type === 'event' ? 'Event Name *' : 'Post Title *'}
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
            errors.title ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder={
            communityType === 'district' 
              ? selectedCategory?.name === 'Official Notice / Public Announcement'
                ? "Enter announcement title"
                : "Describe the issue briefly"
              : selectedCategory?.post_type === 'event' 
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
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder={
            communityType === 'district'
              ? selectedCategory?.name === 'Official Notice / Public Announcement'
                ? "Provide detailed announcement information..."
                : "Describe the issue in detail with specific location details..."
              : "Describe your post in detail..."
          }

        />
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
      </div>

      {/* Image Upload/URL */}
      {selectedCategory?.post_type !== 'job' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Image
          </label>
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
          {errors.image && <p className="text-red-500 text-sm mt-1">{errors.image}</p>}
        </div>
      )}

      {/* Location Picker */}

    {communityType == 'district' ? (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Location *
        </label>
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <BoundaryRestrictedLocationPicker
            latitude={formData.latitude}
            longitude={formData.longitude}
            communityId={communityId}
            onLocationChange={handleLocationChange}
          />
        </div>
        {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
      </div>
    ) : (
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
    )}

      {/* Delete After Hours */}
      {communityType !== 'district' && formData.deleteOptions && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Auto Delete After
          </label>
          <select
            value={formData.deleteAfterHours}
            onChange={(e) => setFormData(prev => ({ ...prev, deleteAfterHours: parseInt(e.target.value) }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            {formData.deleteOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Show submit button if no details step needed */}
      {!needsDetailsStep && (
        <div className="pt-4">
          <button
            onClick={onSubmit} // You'll need to pass this from parent
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
          >
            <CheckCircle size={18} />
            <span>Create Post</span>
          </button>
        </div>
      )}
    </div>
  );
};

// Details Step Component
const DetailsStep = ({ 
  selectedCategory, 
  jobData,
  eventData,
  productLaunchData,
  setJobData, 
  setEventData,
  setProductLaunchData,
  skills,
  educationQualifications,
  errors 
}) => {

  if (!selectedCategory) return null;

  // Only show details for specific post types
  if (selectedCategory.post_type === 'general' || selectedCategory.name === 'Collaboration') {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Job Specific Fields */}
      {selectedCategory.post_type === 'job' && selectedCategory.name !== 'Collaboration' && (
        <JobDetailsForm 
          jobData={jobData}
          setJobData={setJobData}
          selectedCategory={selectedCategory}
          errors={errors}
          skills={skills}
          educationQualifications={educationQualifications}
        />
      )}

      {selectedCategory.post_type === 'event' && (
        <EventDetailsForm
          eventData={eventData}
          setEventData={setEventData}
          errors={errors}
        />
      )}

      {selectedCategory.post_type === 'announcement' && selectedCategory.name !== 'Collaboration' && (
        <ProductLaunchDetailsForm 
          productLaunchData={productLaunchData}
          setProductLaunchData={setProductLaunchData}
          errors={errors}
        />
      )}
    </div>
  );
};

const EventDetailsForm = ({ eventData, setEventData, errors }) => {
  const eventTypes = ["Job Fair", "Hackathon", "Walk-in", "Challenge"];
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
        <Calendar size={20} className="text-blue-600" />
        <span>Event Details</span>
      </h3>

      {/* Event Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Event Type *
        </label>
        <div className="grid grid-cols-2 gap-3">
          {eventTypes.map((type) => (
            <button
              key={type}
              onClick={() => setEventData(prev => ({ ...prev, event_type: type }))}
              className={`p-3 rounded-lg border-2 transition-all ${
                eventData.event_type === type
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
        {errors.event_type && <p className="text-red-500 text-sm mt-1">{errors.event_type}</p>}
      </div>

      {/* Event Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Event Date *
        </label>
        <input
          type="date"
          value={eventData.event_date}
          onChange={(e) => setEventData(prev => ({ ...prev, event_date: e.target.value }))}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.event_date ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.event_date && <p className="text-red-500 text-sm mt-1">{errors.event_date}</p>}
      </div>

      {/* Event Link */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Event Link
        </label>
        <input
          type="url"
          value={eventData.link}
          onChange={(e) => setEventData(prev => ({ ...prev, link: e.target.value }))}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="https://example.com/event"
        />
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
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Any additional details about the event..."
        />
      </div>
    </div>
  );
};

const ProductLaunchDetailsForm = ({ productLaunchData, setProductLaunchData, errors }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
        <Package size={20} className="text-amber-600" />
        <span>Product Launch Details</span>
      </h3>

      {/* Product Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product Name *
        </label>
        <input
          type="text"
          value={productLaunchData.product_name}
          onChange={(e) => setProductLaunchData(prev => ({ ...prev, product_name: e.target.value }))}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
            errors.product_name ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter the product name"
        />
        {errors.product_name && <p className="text-red-500 text-sm mt-1">{errors.product_name}</p>}
      </div>

      {/* Launch Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Launch Date *
        </label>
        <input
          type="date"
          value={productLaunchData.launch_date}
          onChange={(e) => setProductLaunchData(prev => ({ ...prev, launch_date: e.target.value }))}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
            errors.launch_date ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.launch_date && <p className="text-red-500 text-sm mt-1">{errors.launch_date}</p>}
      </div>

      {/* Product Link */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product Link
        </label>
        <input
          type="url"
          value={productLaunchData.link}
          onChange={(e) => setProductLaunchData(prev => ({ ...prev, link: e.target.value }))}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          placeholder="https://example.com/product"
        />
      </div>

      {/* Additional Info */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Information
        </label>
        <textarea
          value={productLaunchData.additional_info}
          onChange={(e) => setProductLaunchData(prev => ({ ...prev, additional_info: e.target.value }))}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          placeholder="Any additional details about the product..."
        />
      </div>
    </div>
  );
};

// Job Details Form Component
const JobDetailsForm = ({ jobData, setJobData, selectedCategory, errors, skills, educationQualifications }) => {
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
        <Briefcase size={20} className="text-amber-600" />
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
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
            errors.jobLink ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="https://example.com/apply"
        />
        {errors.jobLink && <p className="text-red-500 text-sm mt-1">{errors.jobLink}</p>}
      </div>

      {/* Compensation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Is Paid
          </label>
          <select
            value={jobData.isPaid}
            onChange={(e) => setJobData(prev => ({ ...prev, isPaid: e.target.value === 'true' }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
              errors.salaryOrStipend ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder={isJob ? "e.g., 3-5" : "e.g., ₹10,000"}
          />
          {errors.salaryOrStipend && <p className="text-red-500 text-sm mt-1">{errors.salaryOrStipend}</p>}
        </div>
      </div>

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
                  ? 'border-amber-500 bg-amber-50 text-amber-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Duration - Not for Jobs */}
      {!isJob && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duration
          </label>
          <input
            type="text"
            value={jobData.duration}
            onChange={(e) => setJobData(prev => ({ ...prev, duration: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="e.g., 6 months, 3-6 months"
          />
        </div>
      )}

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
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
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
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
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
                  className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
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
                  className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm text-gray-700">{skill.name}</span>
              </label>
            ))}
          </div>
          {errors.selectedSkills && <p className="text-red-500 text-sm mt-1">{errors.selectedSkills}</p>}
        </div>
      </div>

      {/* Application Deadline */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Application Deadline *
        </label>
        <input
          type="date"
          value={jobData.applicationDeadline}
          onChange={(e) => setJobData(prev => ({ ...prev, applicationDeadline: e.target.value }))}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
            errors.applicationDeadline ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.applicationDeadline && <p className="text-red-500 text-sm mt-1">{errors.applicationDeadline}</p>}
      </div>
    </div>
  );
};

// Add this new component for district complaint details
const DistrictDetailsStep = ({ complaintData, setComplaintData, selectedCategory, errors }) => {
  if (!selectedCategory || selectedCategory.name === 'Official Notice / Public Announcement') {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
        <AlertCircle size={20} className="text-blue-600" />
        <span>Complaint Details</span>
      </h3>

      {/* Location Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Location Details (optional)
        </label>
        <textarea
          value={complaintData.locationDescription}
          onChange={(e) => setComplaintData(prev => ({ ...prev, locationDescription: e.target.value }))}
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Provide specific location details, landmarks, or additional information to help locate the issue..."
        />
      </div>

      {/* Severity */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Severity Level *
        </label>
        <div className="grid grid-cols-3 gap-3">
          {['low', 'medium', 'high'].map((level) => (
            <button
              key={level}
              onClick={() => setComplaintData(prev => ({ ...prev, severity: level }))}
              className={`p-3 rounded-lg border-2 transition-all capitalize ${
                complaintData.severity === level
                  ? level === 'low' ? 'border-green-500 bg-green-50 text-green-700'
                  : level === 'medium' ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                  : 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
        {errors.severity && <p className="text-red-500 text-sm mt-1">{errors.severity}</p>}
      </div>
    </div>
  );
};

// Review Step Component
const ReviewStep = ({ 
  formData, 
  selectedCategory, 
  jobData, 
  eventData, 
  productLaunchData,
  userEntities 
}) => {
  const postedByEntity = userEntities.find(e => e.id === formData.postedByEntityId);
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800">Review Your Post</h3>
      
      {/* Basic Info Review */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-800 mb-3">Basic Information</h4>
        <div className="space-y-2 text-sm">
          <div><strong>Posted As:</strong> {postedByEntity?.name || 'Not selected'}</div>
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

      {/* Job Details Review */}
      {selectedCategory?.post_type === 'job' && selectedCategory.name !== 'Collaboration' &&  (
        <div className="bg-green-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-3">Job Details</h4>
          <div className="space-y-2 text-sm">
            <div><strong>Job Type:</strong> {jobData.jobType}</div>
            <div><strong>Application Link:</strong> {jobData.link}</div>
            <div><strong>Location Type:</strong> {jobData.locationType}</div>
            <div><strong>Is Paid:</strong> {jobData.isPaid ? 'Yes' : 'No'}</div>
            <div><strong>Salary/Stipend:</strong> {jobData.salaryOrStipend}</div>
            <div><strong>Experience:</strong> {jobData.minExperience} - {jobData.maxExperience} years</div>
            <div><strong>Application Deadline:</strong> {jobData.applicationDeadline}</div>
          </div>
        </div>
      )}

      {selectedCategory?.post_type === 'event' && (
        <div className="bg-purple-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-3">Event Details</h4>
          <div className="space-y-2 text-sm">
            <div><strong>Event Type:</strong> {eventData.event_type}</div>
            <div><strong>Event Date:</strong> {eventData.event_date}</div>
            <div><strong>Event Link:</strong> {eventData.link || 'Not provided'}</div>
            <div><strong>Additional Info:</strong> {eventData.additional_info || 'Not provided'}</div>
          </div>
        </div>
      )}

      {selectedCategory?.post_type === 'announcement' && selectedCategory.name !== 'Collaboration' && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-3">Product Launch Details</h4>
          <div className="space-y-2 text-sm">
            <div><strong>Product Name:</strong> {productLaunchData.product_name}</div>
            <div><strong>Launch Date:</strong> {productLaunchData.launch_date}</div>
            <div><strong>Product Link:</strong> {productLaunchData.link || 'Not provided'}</div>
            <div><strong>Additional Info:</strong> {productLaunchData.additional_info || 'Not provided'}</div>
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

export default CommunityPostCreation;