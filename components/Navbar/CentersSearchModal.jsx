import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Users, Lock, CheckCircle, UserPlus, Clock } from 'lucide-react';

const CentersSearchModal = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [userCommunities, setUserCommunities] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showJoinConfirm, setShowJoinConfirm] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [isJoining, setIsJoining] = useState(false);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchUserCommunities();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      searchTimeoutRef.current = setTimeout(() => {
        searchCommunities(searchQuery);
      }, 300);
    } else {
      setSearchResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const searchCommunities = async (query) => {
    setIsSearching(true);
    try {
      const response = await fetch(`/api/centers/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (response.ok) {
        setSearchResults(data.communities || []);
      }
    } catch (error) {
      console.error('Error searching centers:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const fetchUserCommunities = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/centers/user');
      const data = await response.json();
      if (response.ok) {
        setUserCommunities(data.communities || []);
      }
    } catch (error) {
      console.error('Error fetching user centers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCommunityClick = (community) => {
    if (community.membership_status === 'member') {
      window.location.href = `/centers/${community.id}`;
    } else if (community.membership_status === 'none') {
      setSelectedCommunity(community);
      setShowJoinConfirm(true);
    }
  };

  const handleJoinCommunity = async () => {
    if (!selectedCommunity) return;
    
    setIsJoining(true);
    try {
      const response = await fetch('/api/centers/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId: selectedCommunity.id })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Refresh the search and user communities
        await searchCommunities(searchQuery);
        await fetchUserCommunities();
        setShowJoinConfirm(false);
        setSelectedCommunity(null);
      } else {
        alert(data.message || 'Failed to join community');
      }
    } catch (error) {
      console.error('Error joining community:', error);
      alert('Failed to join community');
    } finally {
      setIsJoining(false);
    }
  };

  const getMembershipButton = (community) => {
    switch (community.membership_status) {
      case 'member':
        return (
          <button
            onClick={() => handleCommunityClick(community)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Open
          </button>
        );
      case 'pending':
        return (
          <div className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg font-medium flex items-center gap-2 cursor-not-allowed">
            <Clock className="w-4 h-4" />
            Pending
          </div>
        );
      default:
        return (
          <button
            onClick={() => handleCommunityClick(community)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Join
          </button>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Centers</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Search Section */}
          <div className="p-6 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search centers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Search Results */}
            {searchQuery && (
              <div className="mt-4 max-h-48 overflow-y-auto">
                {isSearching ? (
                  <div className="text-center py-4 text-gray-500">Searching...</div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-2">
                    {searchResults.map((community) => (
                      <div
                        key={community.id}
                        className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                          {community.profile_pic_url ? (
                            <img
                              src={community.profile_pic_url}
                              alt={community.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <Users className="w-6 h-6" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 truncate">{community.name}</div>
                          <div className="text-sm text-gray-500 truncate">@{community.username}</div>
                        </div>
                        {getMembershipButton(community)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">No centers found</div>
                )}
              </div>
            )}
          </div>

          {/* User's Communities Section */}
          <div className="flex-1 overflow-y-auto p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Centers</h3>
            
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : userCommunities.length > 0 ? (
              <div className="space-y-3">
                {userCommunities.map((community) => (
                  <button
                    key={community.id}
                    onClick={() => {
                      if (community.is_approved) {
                        window.location.href = `/centers/${community.id}`;
                      }
                    }}
                    disabled={community.is_approved === false}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                      community.is_approved === false
                        ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60'
                        : 'bg-white border-gray-200 hover:border-blue-400 hover:shadow-md cursor-pointer'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {community.profile_pic_url ? (
                        <img
                          src={community.profile_pic_url}
                          alt={community.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <Users className="w-7 h-7" />
                      )}
                    </div>
                    
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900 truncate">{community.name}</h4>
                        {community.is_approved === false && (
                          <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        )}
                        {community.is_approved === true && (
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate">@{community.username}</p>
                      {community.role && (
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                          {community.role}
                        </span>
                      )}
                      {community.is_approved === false && (
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded">
                          Pending Approval
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">You haven&apos;t joined any centers yet</p>
                <p className="text-sm text-gray-400 mt-1">Search above to find centers to join</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Join Confirmation Modal */}
      {showJoinConfirm && selectedCommunity && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-60">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                {selectedCommunity.profile_pic_url ? (
                  <img
                    src={selectedCommunity.profile_pic_url}
                    alt={selectedCommunity.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <Users className="w-8 h-8" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-xl text-gray-900 truncate">{selectedCommunity.name}</h3>
                <p className="text-sm text-gray-500 truncate">@{selectedCommunity.username}</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700 leading-relaxed">
                Your request to join <span className="font-semibold">{selectedCommunity.name}</span> will be sent to the community administrators. 
                You&apos;ll be able to access the community once an admin approves your request.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowJoinConfirm(false);
                  setSelectedCommunity(null);
                }}
                disabled={isJoining}
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleJoinCommunity}
                disabled={isJoining}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isJoining ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Joining...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Request to Join
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CentersSearchModal;