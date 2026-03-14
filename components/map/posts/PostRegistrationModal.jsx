import React, { useState, useEffect } from 'react';
import { X, Upload, MapPin, ExternalLink } from 'lucide-react';
import MapLocationPicker from '../../../app/_components/MapLocationPicker';

const PostRegistrationModal = ({ isOpen, onClose, post, onSubmit }) => {
  const [formData, setFormData] = useState({
    note: '',
    resumeUrl: '',
    latitude: null,
    longitude: null
  });
  const [loading, setLoading] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        note: '',
        resumeUrl: '',
        latitude: null,
        longitude: null
      });
    }
  }, [isOpen]);

  const handleLocationChange = (lat, lng) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng
    }));
  };

  const handleSubmit = async () => {
    if (!formData.latitude || !formData.longitude) {
      alert('Please select your location');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/posts/${post.id}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          note: formData.note,
          resumeUrl: formData.resumeUrl,
          latitude: formData.latitude,
          longitude: formData.longitude
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to register');
      }

      const result = await response.json();
      
      if (onSubmit) {
        onSubmit(result);
      }
      
      handleClose();
      
      // Redirect to apply link if provided
      if (post.apply_link) {
        window.open(post.apply_link, '_blank');
      }
      
    } catch (error) {
      console.error('Error registering:', error);
      alert('Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      note: '',
      resumeUrl: '',
      latitude: null,
      longitude: null
    });
    onClose();
  };

  const getButtonText = () => {
    const categoryName = post.category_name?.toLowerCase();
    if (['job', 'intern', 'gig'].includes(categoryName)) {
      return 'Submit & Apply';
    } else if (['event'].includes(categoryName)) {
      return 'Submit & Register';
    }
    return 'Submit & Continue';
  };

  const getModalTitle = () => {
    const categoryName = post.category_name?.toLowerCase();
    if (['job', 'intern', 'gig'].includes(categoryName)) {
      return 'Apply for Position';
    } else if (['event'].includes(categoryName)) {
      return 'Register for Event';
    }
    return 'Register Interest';
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
            <h2 className="text-lg sm:text-xl font-bold">{getModalTitle()}</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-blue-700 rounded-full transition-colors"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-80px)] sm:max-h-[calc(95vh-100px)]">
          <div className="space-y-4 sm:space-y-6">
            
            {/* Post Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">{post.title}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  {post.category_name}
                </span>
              </div>
            </div>

            {/* Resume URL Field - Show for job/intern/gig categories */}
            {(['job', 'intern', 'gig'].includes(post.category_name?.toLowerCase())) && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Resume URL <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={formData.resumeUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, resumeUrl: e.target.value }))}
                    placeholder="https://drive.google.com/file/d/..."
                    className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  <Upload className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500">
                  Share a link to your resume (Google Drive, Dropbox, etc.)
                </p>
              </div>
            )}

            {/* Optional Note */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Note (Optional)
              </label>
              <textarea
                value={formData.note}
                onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                placeholder="Add a personal note or message..."
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
              />
              <p className="text-xs text-gray-500">
                Optional: Share why you&apos;re interested or any additional information
              </p>
            </div>

            {/* Location Picker */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Your Location <span className="text-red-500">*</span>
              </label>
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <MapLocationPicker
                  latitude={formData.latitude}
                  longitude={formData.longitude}
                  onLocationChange={handleLocationChange}
                />
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Click on the map to set your location
              </p>
            </div>

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
                disabled={loading || !formData.latitude || !formData.longitude || 
                  (['job', 'intern', 'gig'].includes(post.category_name?.toLowerCase()) && !formData.resumeUrl)}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {getButtonText()}
                    <ExternalLink className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostRegistrationModal;