import React, { useState, useEffect } from 'react';
import { X, MapPin, PlusCircle, Newspaper } from 'lucide-react';

const CreatorPopupModal = ({ onNavigateToCreator }) => {
  const [showModal, setShowModal] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    // Check if modal has been shown before and how many times
    const modalShownCount = parseInt(localStorage.getItem('creatorModalShown') || '0');
    
    if (modalShownCount < 2) {
      // Show modal after 5 seconds
      const timer = setTimeout(() => {
        setShouldShow(true);
        setShowModal(true);
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setShowModal(false);
    // Increment the counter in localStorage
    const currentCount = parseInt(localStorage.getItem('creatorModalShown') || '0');
    localStorage.setItem('creatorModalShown', (currentCount + 1).toString());
  };

  const handleGoToCreator = () => {
    handleClose();
    if (onNavigateToCreator) {
      onNavigateToCreator();
    }
  };

  if (!shouldShow || !showModal) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative w-full max-w-md mx-auto bg-white rounded-xl shadow-2xl transform transition-all duration-300 ease-out">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 z-10"
          aria-label="Close modal"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Header with icon */}
        <div className="bg-red-800 text-white p-6 rounded-t-xl text-center">
          <div className="flex justify-center mb-3">
            <div className="bg-white bg-opacity-20 p-3 rounded-full">
              <PlusCircle className="w-8 h-8" />
            </div>
          </div>
          <h2 className="text-xl font-bold mb-2">Become a Creator!</h2>
          <p className="text-red-100 text-sm">Share local news with your community</p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="bg-red-100 p-2 rounded-full flex-shrink-0 mt-1">
                <MapPin className="w-4 h-4 text-red-800" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Local Coverage</h3>
                <p className="text-gray-600 text-xs mt-1">Post news within 10km of your current location</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="bg-red-100 p-2 rounded-full flex-shrink-0 mt-1">
                <Newspaper className="w-4 h-4 text-red-800" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Share Stories</h3>
                <p className="text-gray-600 text-xs mt-1">Help others stay informed about what&apos;s happening nearby</p>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <button
              onClick={handleGoToCreator}
              className="w-full bg-red-800 text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-900 transition-colors duration-200 shadow-md hover:shadow-lg transform hover:scale-105 transition-transform"
            >
              Start Creating News
            </button>
            
            <button
              onClick={handleClose}
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorPopupModal