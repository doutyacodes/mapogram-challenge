import React, { useState, useEffect } from 'react';
import { X, Upload, MapPin, Clock, Building2, User, Crown, Shield, DollarSign, Calendar, MapIcon } from 'lucide-react';
import { getUserFromToken } from '@/utils/auth';
import { ImageUploadService } from '@/utils/imageUploadService';
import MapLocationPicker from '../../MapLocationPicker';

const PostCreationModal = ({ isOpen, onClose, layer, onPostCreated }) => {
  console.log("layer", layer);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    latitude: null,
    longitude: null,
    deleteAfterHours: 168,
    isPermanent: false,
    postedAs: 'admin'
  });

  // New job-specific fields
  const [jobDetails, setJobDetails] = useState({
    link: '',
    isPaid: true,
    salaryAmount: '',
    locationType: 'onsite',
    duration: '',
    experienceRequired: '',
    educationRequired: '',
    skillsRequired: '',
    applicationDeadline: '',
    additionalInfo: ''
  });

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [categories, setCategories] = useState([]);
  const [userCompanies, setUserCompanies] = useState([]);
  const [userData, setUserData] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  console.log("categories", categories);

  console.log("selectedCategory", selectedCategory);
    console.log("formData.categoryId", formData.categoryId);


  useEffect(() => {
    if (isOpen) {
      fetchInitialData();
    }
  }, [isOpen]);

  useEffect(() => {
    fetchCategoriesForLayer(layer.id);
  }, [layer]);

  useEffect(() => {
    if (layer.name === 'Jobs' && formData.categoryId && categories.length > 0) {
      const category = categories.find(cat => cat.id === formData.categoryId);
      setSelectedCategory(category);

      const categoryName = category?.name?.toLowerCase();

      if (categoryName === 'gigs') {
        setFormData(prev => ({ ...prev, deleteAfterHours: 24 }));
      } else {
        setFormData(prev => ({ ...prev, deleteAfterHours: 168 }));
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

      if (layer.name === 'Jobs') {
        const companiesRes = await fetch('/api/user/companies');
        const companiesData = await companiesRes.json();
        setUserCompanies(companiesData.companies || []);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const handleLocationChange = (lat, lng) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng
    }));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const getDeleteOptions = () => {
    const categoryName = selectedCategory?.name?.toLowerCase();
    
    if (categoryName === 'gigs') {
      return [
        { value: 24, label: '1 day' },
        { value: 48, label: '2 days' },
        { value: 72, label: '3 days' }
      ];
    } else {
      return [
        { value: 168, label: '1 week' },
        { value: 336, label: '2 weeks' },
        { value: 720, label: '1 month' }
      ];
    }
  };

  const getSalaryLabel = () => {
    const categoryName = selectedCategory?.name?.toLowerCase();
    if (categoryName === 'jobs') return 'Salary (LPA)';
    if (categoryName === 'internship') return 'Stipend (per month)';
    if (categoryName === 'gigs') return 'Payment';
    return 'Compensation';
  };

  const getSalaryPlaceholder = () => {
    const categoryName = selectedCategory?.name?.toLowerCase();
    if (categoryName === 'jobs') return 'e.g., 3-5 or 6';
    if (categoryName === 'internship') return 'e.g., 10000 or 15000';
    if (categoryName === 'gigs') return 'e.g., 2000 or 500/day';
    return 'Enter amount';
  };

  const renderJobSpecificFields = () => {
    if (layer.name !== 'Jobs' || !selectedCategory) return null;

    const categoryName = selectedCategory.name.toLowerCase();

    return (
      <div className="space-y-4">
        {/* Job Link */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            {categoryName === 'others' ? 'Link (Optional)' : 'Job Link *'}
          </label>
          <input
            type="url"
            value={jobDetails.link}
            onChange={(e) => setJobDetails(prev => ({ ...prev, link: e.target.value }))}
            placeholder={categoryName === 'others' ? 'Enter relevant link' : 'Enter job portal link or company hiring page'}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Paid/Unpaid Toggle */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Compensation Type
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="isPaid"
                checked={jobDetails.isPaid}
                onChange={() => setJobDetails(prev => ({ ...prev, isPaid: true }))}
                className="text-blue-600"
              />
              <span className="text-sm">Paid</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="isPaid"
                checked={!jobDetails.isPaid}
                onChange={() => setJobDetails(prev => ({ ...prev, isPaid: false }))}
                className="text-blue-600"
              />
              <span className="text-sm">Unpaid</span>
            </label>
          </div>
        </div>

        {/* Salary/Stipend Amount */}
        {jobDetails.isPaid && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {getSalaryLabel()}
            </label>
            <input
              type="text"
              value={jobDetails.salaryAmount}
              onChange={(e) => setJobDetails(prev => ({ ...prev, salaryAmount: e.target.value }))}
              placeholder={getSalaryPlaceholder()}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        )}

        {/* Location Type */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <MapIcon className="w-4 h-4" />
            Work Location Type
          </label>
          <select
            value={jobDetails.locationType}
            onChange={(e) => setJobDetails(prev => ({ ...prev, locationType: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="onsite">On-site</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>

        {/* Duration (for internships and gigs) */}
        {(categoryName === 'internship' || categoryName === 'gigs') && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Duration
            </label>
            <input
              type="text"
              value={jobDetails.duration}
              onChange={(e) => setJobDetails(prev => ({ ...prev, duration: e.target.value }))}
              placeholder="e.g., 3 months, 2 weeks, 1 day"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        )}

        {/* Experience Required */}
        {categoryName !== 'others' && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Experience Required
            </label>
            <input
              type="text"
              value={jobDetails.experienceRequired}
              onChange={(e) => setJobDetails(prev => ({ ...prev, experienceRequired: e.target.value }))}
              placeholder="e.g., 0-2 years, Fresher, 3+ years"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        )}

        {/* Education Required */}
        {categoryName !== 'others' && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Education Required
            </label>
            <input
              type="text"
              value={jobDetails.educationRequired}
              onChange={(e) => setJobDetails(prev => ({ ...prev, educationRequired: e.target.value }))}
              placeholder="e.g., B.Tech, Any Graduate, MBA"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        )}

        {/* Skills Required */}
        {categoryName !== 'others' && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Skills Required
            </label>
            <textarea
              value={jobDetails.skillsRequired}
              onChange={(e) => setJobDetails(prev => ({ ...prev, skillsRequired: e.target.value }))}
              placeholder="e.g., JavaScript, React, Node.js, Communication Skills"
              rows={2}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical"
            />
          </div>
        )}

        {/* Application Deadline */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Application Deadline
          </label>
          <input
            type="date"
            value={jobDetails.applicationDeadline}
            onChange={(e) => setJobDetails(prev => ({ ...prev, applicationDeadline: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Additional Info (for others category) */}
        {categoryName === 'others' && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Additional Information
            </label>
            <textarea
              value={jobDetails.additionalInfo}
              onChange={(e) => setJobDetails(prev => ({ ...prev, additionalInfo: e.target.value }))}
              placeholder="Enter any additional details about the event/opportunity"
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical"
            />
          </div>
        )}
      </div>
    );
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.categoryId || !formData.latitude || !formData.longitude) {
      alert('Please fill in all required fields');
      return;
    }

    if (layer.name === 'Jobs' && selectedCategory?.name?.toLowerCase() !== 'others' && !jobDetails.link) {
      alert('Job link is required');
      return;
    }

    setLoading(true);

    try {
      let imageFileName = null;

      if (selectedImage) {
        setUploading(true);
        const result = await ImageUploadService.uploadToCPanel(selectedImage);
        console.log("result", result);
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
        categoryName: selectedCategory.name,
        imageFileName,
        jobDetails: layer.name === 'Jobs' ? jobDetails : null,
        postedByCompanyId: formData.postedAs === 'admin' ? null : parseInt(formData.postedAs)
      };

      const response = await fetch('/api/layers/jobs/post/create', {
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
      console.log("error", error);
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
      deleteAfterHours: 168,
      isPermanent: false,
      postedAs: 'admin'
    });
    setJobDetails({
      link: '',
      isPaid: true,
      salaryAmount: '',
      locationType: 'onsite',
      duration: '',
      experienceRequired: '',
      educationRequired: '',
      skillsRequired: '',
      applicationDeadline: '',
      additionalInfo: ''
    });
    setSelectedImage(null);
    setImagePreview(null);
    setSelectedCategory(null);
    onClose();
  };

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
            {/* Posting As */}
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

            {/* Title */}
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

            {/* Description */}
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

            {/* Image Upload */}
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

            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Category *
              </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      categoryId: Number(e.target.value), // ✅ Convert to number
                    }))
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>

            </div>

            {/* Job-specific fields */}
            {renderJobSpecificFields()}

            {/* Map Location */}
            <div className="space-y-2">
              <MapLocationPicker
                latitude={formData.latitude}
                longitude={formData.longitude}
                onLocationChange={handleLocationChange}
              />
            </div>

            {/* Auto-delete */}
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

            {/* Action Buttons */}
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
    </div>
  );
};

export default PostCreationModal;