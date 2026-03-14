// FriendsListModal.jsx
import { useState, useEffect } from 'react';
import { X, Users, Search, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

const FriendsListModal = ({ isOpen, onClose, userId }) => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  // Fetch friends list
  useEffect(() => {
    if (isOpen && userId) {
      fetchFriends();
    }
  }, [isOpen, userId, fetchFriends]);

  const fetchFriends = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/friends/list?userId=${userId}`);
      const data = await response.json();
      
      if (response.ok) {
        setFriends(data.friends || []);
      } else {
        setError(data.message || 'Failed to fetch friends');
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
      setError('Failed to load friends list');
    } finally {
      setLoading(false);
    }
  };

  // Filter friends based on search
  const filteredFriends = friends.filter(friend =>
    friend.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFriendClick = (friendId) => {
    router.push(`/profile/${friendId}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Friends</h2>
            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
              {friends.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-150"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 sm:p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
            <input
              type="text"
              placeholder="Search friends..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 sm:pl-10 pr-3 py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Friends List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8 px-4">
              <p className="text-red-500 text-xs sm:text-sm">{error}</p>
              <button
                onClick={fetchFriends}
                className="mt-2 text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-medium"
              >
                Try Again
              </button>
            </div>
          ) : filteredFriends.length === 0 ? (
            <div className="text-center py-8 px-4">
              {searchTerm ? (
                <p className="text-gray-500 text-xs sm:text-sm">No friends found matching &quot;{searchTerm}&quot; </p>
              ) : (
                <div>
                  <Users className="w-8 h-8 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-xs sm:text-sm">No friends yet</p>
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredFriends.map((friend) => (
                <button
                  key={friend.id}
                  onClick={() => handleFriendClick(friend.id)}
                  className="w-full flex items-center space-x-3 p-3 sm:p-4 hover:bg-gray-50 transition-colors duration-150 text-left"
                >
                  {/* Profile Picture */}
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                    {friend.profile_pic_url ? (
                      <img
                        src={friend.profile_pic_url}
                        alt={friend.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    )}
                  </div>

                  {/* Friend Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-xs sm:text-sm truncate">
                      {friend.name || 'Unknown User'}
                    </p>
                    {friend.bio && (
                      <p className="text-gray-500 text-xs truncate mt-0.5">
                        {friend.bio}
                      </p>
                    )}
                  </div>

                  {/* Arrow indicator */}
                  <div className="text-gray-400">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendsListModal;