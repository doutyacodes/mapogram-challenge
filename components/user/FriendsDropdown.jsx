import { useState, useRef, useEffect } from 'react';
import { Users, UserPlus, ChevronDown } from 'lucide-react';

const FriendsDropdown = ({ 
  isProfile, 
  isOwner, 
  friendRequestsCount, 
  handleViewRequests, 
  handleViewFriends, 
  currentTheme 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // if (!isProfile || !isOwner) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Main Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative flex items-center space-x-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg font-medium text-xs transition-all duration-200 border ${currentTheme.filterColors} bg-white hover:bg-gray-50`}
      >
        <Users className="w-3 h-3 sm:w-4 sm:h-4" />
        <span className="hidden sm:inline">Friends</span>
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        
        {/* Notification Badge */}
        {friendRequestsCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {friendRequestsCount > 9 ? '9+' : friendRequestsCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 sm:w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          {/* Friend Requests Option */}
          <button
            onClick={() => {
              handleViewRequests();
              setIsOpen(false);
            }}
            className="w-full flex items-center space-x-2 px-3 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
          >
            <UserPlus className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Friend Requests</span>
            {friendRequestsCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {friendRequestsCount > 9 ? '9+' : friendRequestsCount}
              </span>
            )}
          </button>

          {/* View Friends Option */}
          <button
            onClick={() => {
              handleViewFriends();
              setIsOpen(false);
            }}
            className="w-full flex items-center space-x-2 px-3 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
          >
            <Users className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>View Friends</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default FriendsDropdown;