import React from 'react';
import { MapPin } from 'lucide-react';

const LocationModal = ({ isOpen, onLocationGranted, isLoading }) => {
  if (!isOpen) return null;

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          onLocationGranted(latitude, longitude);
        },
        (error) => {
          console.error("Error getting location:", error);
          // You might want to show an error message here
          alert("Unable to get your location. Please enable location services and try again.");
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4 text-center">
        <div className="mb-4">
          <MapPin className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Location Access Required</h2>
          <p className="text-gray-600 mb-4">
            We need your location to show you relevant content within a 5km radius of your area.
          </p>
        </div>
        
        <button
          onClick={requestLocation}
          disabled={isLoading}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? 'Getting Location...' : 'Allow Location Access'}
        </button>
        
        <p className="text-xs text-gray-500 mt-3">
          Your location is only used to show nearby content and is not stored permanently.
        </p>
      </div>
    </div>
  );
};

export default LocationModal;