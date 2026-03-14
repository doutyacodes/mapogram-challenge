import React, { useState, useEffect } from 'react';
import { X, Users, Image, Type, FileText, MapPin } from 'lucide-react';
import ImageCropper from '@/app/_components/ImageCropper';
import CommunitySuccessModal from './CommunitySuccessModal';
import DistrictGeofenceSelector from './DistrictGeofenceSelector';

const CreateCommunityModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    communityTypeId: null,
    selectedDepartments: [],
    geofenceData: null, // New field for geofence
  });
  const [communityTypes, setCommunityTypes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdCommunity, setCreatedCommunity] = useState(null);
  const [inviteLink, setInviteLink] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchCommunityTypes();
      fetchDepartments();
    }
  }, [isOpen]);

  const fetchCommunityTypes = async () => {
    try {
      const response = await fetch('/api/community-types');
      if (response.ok) {
        const data = await response.json();
        setCommunityTypes(data.communityTypes);
        if (data.communityTypes.length === 1 && data.communityTypes[0].name === 'Private Group') {
          setFormData(prev => ({ ...prev, communityTypeId: data.communityTypes[0].id }));
        }
      }
    } catch (error) {
      console.error('Error fetching community types:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments || []);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleImageSelected = (file, previewUrl) => {
    setSelectedImageFile(file);
  };

  const handleImageUploaded = (filePath, url) => {
    setFormData(prev => ({ ...prev, imageUrl: filePath }));
  };

  const handleGeofenceSelect = (geofenceData) => {
    setFormData(prev => ({ ...prev, geofenceData }));
    if (errors.geofence) {
      setErrors(prev => ({ ...prev, geofence: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Community name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }
    
    if (!formData.communityTypeId) {
      newErrors.communityTypeId = 'Please select a community type';
    }

    const selectedType = communityTypes.find(type => type.id === formData.communityTypeId);
    const isDistrictType = selectedType && selectedType.name.toLowerCase() === 'district';

    if (isDistrictType) {
      if (formData.selectedDepartments.length === 0) {
        newErrors.departments = 'Please select at least one department for district communities';
      }
      
      if (!formData.geofenceData) {
        newErrors.geofence = 'Please select a district boundary on the map';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDepartmentToggle = (departmentId) => {
    setFormData(prev => ({
      ...prev,
      selectedDepartments: prev.selectedDepartments.includes(departmentId)
        ? prev.selectedDepartments.filter(id => id !== departmentId)
        : [...prev.selectedDepartments, departmentId]
    }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/communities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        const community = result.community;
        const generatedInviteLink = result.community.invite_link || 
          `${window.location.origin}/communities/invite/${community.invite_code}`;
        
        setCreatedCommunity(community);
        setInviteLink(generatedInviteLink);
        setShowSuccessModal(true);
        
        onSuccess?.(community);
      } else {
        const error = await response.json();
        setErrors({ submit: error.message || 'Failed to create community' });
      }
    } catch (error) {
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!showSuccessModal) {
      setFormData({ 
        name: '', 
        description: '', 
        imageUrl: '', 
        communityTypeId: null, 
        selectedDepartments: [],
        geofenceData: null 
      });
      setSelectedImageFile(null);
      setErrors({});
      onClose();
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    setCreatedCommunity(null);
    setInviteLink('');
    handleClose();
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const selectedType = communityTypes.find(type => type.id === formData.communityTypeId);
  const isDistrictType = selectedType && selectedType.name.toLowerCase() === 'district';

  if (showSuccessModal) {
    return (
      <CommunitySuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessClose}
        community={createdCommunity}
        inviteLink={inviteLink}
      />
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Create Community</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <div className="p-4 sm:p-6 space-y-5">
          {/* Image Upload */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Image className="w-4 h-4" />
              Community Image
            </label>
            <ImageCropper
              onImageSelected={handleImageSelected}
              onImageUploaded={handleImageUploaded}
              title="Community Image"
              description="Upload an image for your community"
              autoUpload={true}
              cropperSize={112}
            />
          </div>

          {/* Community Name */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Type className="w-4 h-4" />
              Community Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter community name"
              className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              maxLength={100}
            />
            {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <FileText className="w-4 h-4" />
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Tell others what this community is about..."
              rows={3}
              className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none ${
                errors.description ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              maxLength={500}
            />
            {errors.description && <p className="text-xs text-red-600">{errors.description}</p>}
            <p className="text-xs text-gray-500">{formData.description.length}/500</p>
          </div>

          {/* Community Type */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Users className="w-4 h-4" />
              Community Type
            </label>
            <div className="space-y-2">
              {communityTypes.length > 0 ? (
                communityTypes.map((type) => (
                  <label
                    key={type.id}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                      formData.communityTypeId === type.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="communityType"
                      value={type.id}
                      checked={formData.communityTypeId === type.id}
                      onChange={(e) => handleInputChange('communityTypeId', parseInt(e.target.value))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{type.name}</p>
                      {type.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{type.description}</p>
                      )}
                    </div>
                  </label>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm">Loading community types...</div>
              )}
            </div>
            {errors.communityTypeId && <p className="text-xs text-red-600">{errors.communityTypeId}</p>}
          </div>

          {/* District-specific fields */}
          {isDistrictType && (
            <>
              {/* Department Selection */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Users className="w-4 h-4" />
                  Select Departments
                </label>
                <div className="max-h-48 overflow-y-auto border rounded-lg p-3 space-y-2">
                  {departments.length > 0 ? (
                    departments.map((department) => (
                      <label
                        key={department.id}
                        className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.selectedDepartments.includes(department.id)}
                          onChange={() => handleDepartmentToggle(department.id)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{department.name}</p>
                          {department.description && (
                            <p className="text-xs text-gray-500">{department.description}</p>
                          )}
                        </div>
                      </label>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500 text-sm">No departments available</div>
                  )}
                </div>
                {errors.departments && <p className="text-xs text-red-600">{errors.departments}</p>}
                {formData.selectedDepartments.length > 0 && (
                  <p className="text-xs text-blue-600">
                    {formData.selectedDepartments.length} department(s) selected
                  </p>
                )}
              </div>

              {/* Geofence Selector */}
              <div className="border-t pt-5">
                <DistrictGeofenceSelector
                  onGeofenceSelect={handleGeofenceSelect}
                  selectedGeofence={formData.geofenceData}
                />
                {errors.geofence && <p className="text-xs text-red-600 mt-2">{errors.geofence}</p>}
              </div>
            </>
          )}

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2 sticky bottom-0 bg-white pb-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Community'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCommunityModal;