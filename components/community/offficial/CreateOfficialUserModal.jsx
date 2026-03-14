import React, { useState, useEffect } from 'react';
import { X, User, Lock, Eye, EyeOff, Building2, Shield, CheckCircle, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';

const LoadingSpinner = () => (
  <div className="flex items-center justify-center space-x-2">
    <Loader2 className="w-5 h-5 animate-spin text-white" />
    <span className="text-white">Processing...</span>
  </div>
);

const CreateOfficialUserModal = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [createdUser, setCreatedUser] = useState(null);
  const [communities, setCommunities] = useState([]);
  const [communityRoles, setCommunityRoles] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    confirmPassword: '',
    bio: '',
  });

  const [communitySelection, setCommunitySelection] = useState({
    communityId: '',
    roleId: '',
  });

  const [errors, setErrors] = useState({});

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setFormData({
        name: '',
        username: '',
        password: '',
        confirmPassword: '',
        bio: '',
      });
      setCommunitySelection({
        communityId: '',
        roleId: '',
      });
      setCreatedUser(null);
      setErrors({});
      setCommunities([]);
      setCommunityRoles([]);
    }
  }, [isOpen]);

  // Fetch admin's communities when modal opens
  useEffect(() => {
    if (isOpen && currentStep === 2) {
      fetchAdminCommunities();
    }
  }, [isOpen, currentStep]);

  // Fetch roles when community is selected
  useEffect(() => {
    if (communitySelection.communityId) {
      fetchCommunityRoles(communitySelection.communityId);
    }
  }, [communitySelection.communityId]);

  const fetchAdminCommunities = async () => {
    try {
      const response = await fetch(`/api/communities/admin/communities`);
      const data = await response.json();
      if (response.ok) {
        setCommunities(data.communities || []);
      }
    } catch (error) {
      console.error('Error fetching communities:', error);
    }
  };

  const fetchCommunityRoles = async (communityId) => {
    try {
      const response = await fetch(`/api/communities/admin/community-roles?communityId=${communityId}`);
      const data = await response.json();
      if (response.ok) {
        setCommunityRoles(data.roles || []);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const validateStep1 = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers and underscores';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    
    if (!communitySelection.communityId) {
      newErrors.community = 'Please select a community';
    }
    
    if (!communitySelection.roleId) {
      newErrors.role = 'Please select a role';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleCommunityChange = (e) => {
    setCommunitySelection({
      communityId: e.target.value,
      roleId: '',
    });
    setCommunityRoles([]);
    if (errors.community) {
      setErrors(prev => ({ ...prev, community: '' }));
    }
  };

  const handleRoleChange = (e) => {
    setCommunitySelection(prev => ({
      ...prev,
      roleId: e.target.value,
    }));
    if (errors.role) {
      setErrors(prev => ({ ...prev, role: '' }));
    }
  };

  const handleCreateUser = async () => {
    if (!validateStep1()) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/communities/admin/create-official-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          username: formData.username,
          password: formData.password,
          bio: formData.bio || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setCreatedUser(data.user);
        setCurrentStep(2);
      } else {
        setErrors({ general: data.message || 'Error creating user' });
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCommunity = async () => {
    if (!validateStep2()) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/communities/admin/add-user-to-community', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: createdUser.id,
          communityId: communitySelection.communityId,
          roleId: communitySelection.roleId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setCurrentStep(3);
      } else {
        setErrors({ general: data.message || 'Error adding user to community' });
      }
    } catch (error) {
      console.error('Error adding user to community:', error);
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  const selectedCommunity = communities.find(c => c.id === parseInt(communitySelection.communityId));
  const selectedRole = communityRoles.find(r => r.id === parseInt(communitySelection.roleId));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white bg-opacity-20 p-2 rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Create Official User</h2>
              <p className="text-blue-100 text-sm">
                {currentStep === 1 && 'Step 1: User Details'}
                {currentStep === 2 && 'Step 2: Assign to Community'}
                {currentStep === 3 && 'Success!'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        {currentStep !== 3 && (
          <div className="bg-gray-50 px-6 py-3">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Step {currentStep} of 2</span>
              <span>{currentStep === 1 ? 'User Details' : 'Community Assignment'}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 2) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {errors.general && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {errors.general}
            </div>
          )}

          {/* Step 1: Create User */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-1">Official User Account</h3>
                    <p className="text-sm text-blue-700">
                      This user will be created with the <span className="font-semibold">official_user</span> role and can be assigned official positions in communities.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter full name"
                  />
                </div>
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      errors.username ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Choose a username"
                  />
                </div>
                {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Confirm password"
                  />
                </div>
                {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio <span className="text-gray-500">(Optional)</span>
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                  placeholder="Add a bio for this official user..."
                />
              </div>
            </div>
          )}

          {/* Step 2: Assign to Community */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-green-900 mb-1">User Created Successfully</h3>
                    <p className="text-sm text-green-700">
                      <span className="font-semibold">{createdUser?.username}</span> has been created. Now assign them to a community with an official role.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Community *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    value={communitySelection.communityId}
                    onChange={handleCommunityChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none bg-white ${
                      errors.community ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Choose a community</option>
                    {communities.map((community) => (
                      <option key={community.id} value={community.id}>
                        {community.name} ({community.community_type})
                      </option>
                    ))}
                  </select>
                </div>
                {errors.community && <p className="mt-1 text-sm text-red-600">{errors.community}</p>}
                {communities.length === 0 && (
                  <p className="mt-1 text-sm text-gray-600">
                    You don&apos;t have any communities yet. Create a community first.
                  </p>
                )}
              </div>

              {communitySelection.communityId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Official Role *
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <select
                      value={communitySelection.roleId}
                      onChange={handleRoleChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none bg-white ${
                        errors.role ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Choose a role</option>
                      {communityRoles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.role_name} {role.is_official && '(Official)'}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role}</p>}
                  {communityRoles.length === 0 && (
                    <p className="mt-1 text-sm text-gray-600">
                      No official roles available for this community type.
                    </p>
                  )}
                </div>
              )}

              {communitySelection.communityId && communitySelection.roleId && (
                <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Summary</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><span className="font-medium">User:</span> {createdUser?.username}</p>
                    <p><span className="font-medium">Community:</span> {selectedCommunity?.name}</p>
                    <p><span className="font-medium">Role:</span> {selectedRole?.role_name}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Success */}
          {currentStep === 3 && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Successfully Created!</h3>
              <p className="text-gray-600 mb-6">
                The official user has been created and added to the community.
              </p>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-4">User Credentials</h4>
                <div className="space-y-3 text-left">
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Name</p>
                    <p className="font-semibold text-gray-900">{createdUser?.name}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Username</p>
                    <p className="font-semibold text-gray-900">{createdUser?.username}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Password</p>
                    <p className="font-mono text-sm text-gray-900">{formData.password}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Community</p>
                    <p className="font-semibold text-gray-900">{selectedCommunity?.name}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Role</p>
                    <p className="font-semibold text-gray-900">{selectedRole?.role_name}</p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  <span className="font-semibold">Important:</span> Share these credentials securely with the user. The password cannot be retrieved later.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          {currentStep === 1 && (
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleClose}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                disabled={isLoading}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isLoading ? (
                  <LoadingSpinner />
                ) : (
                  <>
                    <span>Create User</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {currentStep === 2 && (
            <div className="flex justify-between">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                onClick={handleAddToCommunity}
                disabled={isLoading || !communitySelection.communityId || !communitySelection.roleId}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isLoading ? (
                  <LoadingSpinner />
                ) : (
                  <>
                    <span>Add to Community</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {currentStep === 3 && (
            <button
              onClick={handleClose}
              className="w-full px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateOfficialUserModal;