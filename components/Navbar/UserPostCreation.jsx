import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, MapPin, Calendar, Clock, Users, AlertCircle, CheckCircle, Loader2, ChevronDown, Search, ImageIcon, AtSign, ArrowLeft, Toggle } from 'lucide-react';
import { ImageUploadService } from '@/utils/imageUploadService';
import MapLocationPicker from '@/app/_components/MapLocationPicker';
import toast from 'react-hot-toast';
import ModernToggle from '../shared/ModernToggle';

const TaggedMention = ({ username, onRemove }) => (
  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-1 mb-1">
    @{username}
    <button
      onClick={onRemove}
      className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-600 hover:bg-blue-200"
    >
      <X size={10} />
    </button>
  </span>
);

const UserPostCreation = ({ isOpen, onClose, userId, postType, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [availableLayers, setAvailableLayers] = useState([]);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionResults, setMentionResults] = useState([]);
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionPosition, setMentionPosition] = useState(0);
  const textareaRef = useRef(null);

  // Determine modal styling based on post type
  const modalStyles = {
    'story': {
      headerBg: 'from-purple-500 to-purple-600',
      buttonBg: 'bg-purple-600 hover:bg-purple-700',
      accentColor: 'purple'
    },
    'post': {
      headerBg: 'from-emerald-500 to-emerald-600',
      buttonBg: 'bg-emerald-600 hover:bg-emerald-700',
      accentColor: 'emerald'
    },
    'event': {
      headerBg: 'from-cyan-500 to-cyan-600',
      buttonBg: 'bg-cyan-600 hover:bg-cyan-700',
      accentColor: 'cyan'
    }
  };
  
  const currentStyle = modalStyles[postType] || modalStyles.post;

  // Main form data
  const [formData, setFormData] = useState({
    caption: '',
    image: null,
    imageFileName: '',
    latitude: 0,
    longitude: 0,
    categoryId: '',
    categoryName: '',
    isPermanent: true, // Default to permanent, user can change
    deleteAfterHours: postType === 'story' ? 24 : null,
    showOnLayers: false,
    selectedLayers: [],
    taggedUsers: []
  });

  // Event specific data
  const [eventData, setEventData] = useState({
    event_date: '',
    contact_info: '',
    additional_info: ''
  });

  const [errors, setErrors] = useState({});

  // Fetch categories and set appropriate category based on post type
  const fetchCategories = async () => {
    try {
      const response = await fetch(`/api/profile/posts/categories`);
      const data = await response.json();
      const categoriesData = data.categories || [];
      setCategories(categoriesData);
      
      // Set category based on post type
      let selectedCategory;
      switch (postType) {
        case 'story':
          selectedCategory = categoriesData.find(cat => cat.post_type === 'general');
          break;
        case 'post':
          selectedCategory = categoriesData.find(cat => cat.post_type === 'general');
          break;
        case 'event':
          selectedCategory = categoriesData.find(cat => cat.post_type === 'personal_event');
          break;
        default:
          selectedCategory = categoriesData[0];
      }
      
      if (selectedCategory) {
        setFormData(prev => ({
          ...prev,
          categoryId: selectedCategory.id.toString(),
          categoryName: selectedCategory.name
        }));
        fetchAvailableLayers(selectedCategory.id);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Load initial data
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen, postType]);

  const fetchAvailableLayers = async (categoryId) => {
    try {
      const response = await fetch(`/api/profile/posts/layers?categoryId=${categoryId}`);
      const data = await response.json();
      setAvailableLayers(data.layers || []);
    } catch (error) {
      console.error('Error fetching layers:', error);
    }
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

  // Handle mentions in caption
  const handleCaptionChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, caption: value }));
    
    // Check for @ mentions
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);
    const atPos = textBeforeCursor.lastIndexOf('@');
    
    if (atPos >= 0 && (atPos === 0 || textBeforeCursor[atPos - 1] === ' ')) {
      const query = textBeforeCursor.substring(atPos + 1);
      setMentionQuery(query);
      setMentionPosition(atPos);
      
      if (query.length > 0) {
        fetchMentionResults(query);
        setShowMentionList(true);
      } else {
        setShowMentionList(false);
      }
    } else {
      setShowMentionList(false);
    }
  };

const fetchMentionResults = async (query) => {
    try {
      const response = await fetch(`/api/profile/users/search?q=${query}`);
      const data = await response.json();
      setMentionResults(data.results || []);
    } catch (error) {
      console.error('Error fetching mention results:', error);
    }
  };

  const handleMentionSelect = (user) => {
    const beforeMention = formData.caption.substring(0, mentionPosition);
    const afterMention = formData.caption.substring(mentionPosition + mentionQuery.length + 1);
    const newCaption = `${beforeMention}@${user.username} ${afterMention}`;
    
    setFormData(prev => ({
      ...prev,
      caption: newCaption,
      taggedUsers: [...prev.taggedUsers.filter(u => u.id !== user.id), { id: user.id, username: user.username, type: user.type }]
    }));
    
    setShowMentionList(false);
    textareaRef.current.focus();
    
    // Move cursor to after the mention
    setTimeout(() => {
      const cursorPos = mentionPosition + user.username.length + 2;
      textareaRef.current.setSelectionRange(cursorPos, cursorPos);
    }, 0);
  };

  const removeMention = (userId) => {
    const userToRemove = formData.taggedUsers.find(u => u.id === userId);
    if (userToRemove) {
      const newCaption = formData.caption.replace(`@${userToRemove.username}`, '');
      setFormData(prev => ({
        ...prev,
        caption: newCaption.replace(/\s+/g, ' ').trim(),
        taggedUsers: prev.taggedUsers.filter(u => u.id !== userId)
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.caption.trim()) newErrors.caption = 'Caption is required';
    if (!formData.latitude || !formData.longitude) newErrors.location = 'Location is required';
    if (!formData.imageFileName) newErrors.image = 'Image is required';
    
    // Event specific validation
    if (postType === 'event') {
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
        caption: formData.caption,
        imageFileName: formData.imageFileName,
        latitude: formData.latitude,
        longitude: formData.longitude,
        categoryId: formData.categoryId,
        categoryName: formData.categoryName,
        deleteAfterHours: formData.isPermanent ? null : formData.deleteAfterHours,
        isPermanent: formData.isPermanent,
        isStory: postType === 'story',
        selectedLayers: formData.showOnLayers ? formData.selectedLayers : [],
        taggedUsers: formData.taggedUsers
      };
      
      // Add event specific data
      if (postType === 'event') {
        postData.eventData = eventData;
      }
      
      // Make the actual API call to create the post
      const response = await fetch('/api/profile/posts/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          // Add auth headers if needed
          // 'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(postData)
      });
      
      // Check if the response is ok
      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = 'Failed to create post';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          // If JSON parsing fails, use status text
          errorMessage = `${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      // Parse successful response
      const result = await response.json();
      
      // Show success message (you can use toast library)
      console.log('Post created successfully:', result);
      
      // Optional: Show success toast notification
      toast.success('Post created successfully!');
      
      // Close the modal
      onClose();
      
      // Reset form data
      setFormData({
        caption: '',
        image: null,
        imageFileName: '',
        latitude: 0,
        longitude: 0,
        categoryId: '',
        categoryName: '',
        isPermanent: true,
        deleteAfterHours: postType === 'story' ? 24 : null,
        showOnLayers: false,
        selectedLayers: [],
        taggedUsers: []
      });
      
      // Reset event data
      setEventData({
        event_date: '',
        contact_info: '',
        additional_info: ''
      });
      
      // Clear any existing errors
      setErrors({});
      
      // Optional: Trigger a refresh of the posts list
      // if (onPostCreated) {
      //   onPostCreated(result.post);
      // }
      
      // Optional: Redirect or show the new post
      // if (result.post && result.post.id) {
      //   // Navigate to the new post or refresh the feed
      //   window.location.reload(); // Simple refresh, or use router.refresh()
      // }
      
    } catch (error) {
      console.error('Error creating post:', error);
    setErrors(prev => ({ 
        ...prev, 
        submit: error.message || 'Failed to create post. Please try again.' 
    }));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className={`bg-gradient-to-r ${currentStyle.headerBg} text-white p-4 sm:p-6 flex items-center justify-between rounded-t-2xl flex-shrink-0`}>
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="text-white hover:text-gray-200 transition-colors p-1"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">
                {postType === 'story' && 'Create Story'}
                {postType === 'post' && 'Create Post'}
                {postType === 'event' && 'Create Event'}
              </h2>
              <p className="opacity-90 mt-1 text-sm">
                {postType === 'story' && "Share what's happening right now"}
                {postType === 'post' && "Pin a moment to the map"}
                {postType === 'event' && "Announce an event"}
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Image *
              </label>
              <div className={`border-2 border-dashed rounded-lg p-4 sm:p-6 text-center hover:border-gray-400 transition-colors ${
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
                    <Loader2 size={32} className="mx-auto text-gray-400 animate-spin mb-2" />
                  ) : (
                    <div className="flex flex-col items-center">
                      <ImageIcon size={32} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">
                        Click to upload image
                      </p>
                    </div>
                  )}
                </label>
                {formData.imageFileName && (
                  <p className="text-green-600 text-sm mt-2 flex items-center justify-center space-x-1">
                    <CheckCircle size={16} />
                    <span>Image uploaded successfully</span>
                  </p>
                )}
              </div>
              {errors.image && <p className="text-red-500 text-sm mt-1">{errors.image}</p>}
            </div>

            {/* Caption */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Caption *
              </label>
              
              {/* Tagged Users Display */}
              {formData.taggedUsers.length > 0 && (
                <div className="mb-2">
                  {formData.taggedUsers.map((user) => (
                    <TaggedMention
                      key={user.id}
                      username={user.username}
                      onRemove={() => removeMention(user.id)}
                    />
                  ))}
                </div>
              )}
              
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={formData.caption}
                  onChange={handleCaptionChange}
                  rows={4}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-${currentStyle.accentColor}-500 focus:border-transparent resize-none ${
                    errors.caption ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={
                    postType === 'story' ? "What's happening?" : 
                    postType === 'post' ? "Write a caption..." : 
                    "Describe your event..."
                  }
                />
                {postType !== 'story' && (
                  <div className="absolute bottom-2 right-2 text-gray-400">
                    <AtSign size={16} />
                  </div>
                )}
              </div>
              {errors.caption && <p className="text-red-500 text-sm mt-1">{errors.caption}</p>}
              
              {/* Mention dropdown */}
              {showMentionList && mentionResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {mentionResults.map((user) => (
                    <div
                      key={user.id}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                      onClick={() => handleMentionSelect(user)}
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-2 flex-shrink-0">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm">@{user.username}</p>
                        {user.name && <p className="text-xs text-gray-500">{user.name}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Permanent Toggle (not for stories) */}
            {postType !== 'story' && (
              <ModernToggle
                enabled={formData.isPermanent}
                onChange={(value) => setFormData(prev => ({ ...prev, isPermanent: value }))}
                label="Permanent Post"
                description={formData.isPermanent ? "Post will stay visible indefinitely" : "Post will be automatically deleted after set time"}
              />
            )}

            {/* Location Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <div className="border border-gray-300 rounded-lg overflow-hidden 
                              h-[calc(100vh-300px)] min-h-[350px] max-h-[500px]
                              sm:h-[calc(100vh-250px)] sm:min-h-[450px] sm:max-h-[600px]
                              lg:h-[calc(100vh-200px)] lg:min-h-[550px] lg:max-h-[700px]">
                <MapLocationPicker
                  latitude={formData.latitude}
                  longitude={formData.longitude}
                  onLocationChange={handleLocationChange}
                />
              </div>
              {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
            </div>

            {/* Event Details */}
            {postType === 'event' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                  <Calendar size={20} className="text-cyan-600" />
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
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent ${
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
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent ${
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
                    rows={3}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                    placeholder="Any additional details about the event..."
                  />
                </div>
              </div>
            )}

            {/* Layer Selection */}
            <div>
              <ModernToggle
                enabled={formData.showOnLayers}
                onChange={(value) => setFormData(prev => ({ ...prev, showOnLayers: value }))}
                label="Add to Friends Layers"
                description="Make this post visible on selected friend layers"
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
                              ? `border-${currentStyle.accentColor}-500 bg-${currentStyle.accentColor}-50`
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
                            className={`w-4 h-4 text-${currentStyle.accentColor}-600 border-gray-300 rounded focus:ring-${currentStyle.accentColor}-500`}
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
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 sm:px-6 py-4 border-t flex justify-end rounded-b-2xl flex-shrink-0">
          {errors.submit && (
            <p className="text-red-500 text-sm mr-4 flex items-center">
              <AlertCircle size={16} className="mr-1" />
              {errors.submit}
            </p>
          )}
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.imageFileName}
            className={`px-4 sm:px-6 py-2 ${currentStyle.buttonBg} text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2`}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm sm:text-base">Creating...</span>
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                <span className="text-sm sm:text-base">
                  {postType === 'story' && 'Create Story'}
                  {postType === 'post' && 'Create Post'}
                  {postType === 'event' && 'Create Event'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserPostCreation;