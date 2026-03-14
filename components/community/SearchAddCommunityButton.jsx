import { useState, useEffect } from 'react';
import { Search, X, Loader2, CheckCircle2, Users, Shield, UserPlus } from 'lucide-react';

const SearchAddCommunityButton = ({ isModalOpen, setIsModalOpen }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [error, setError] = useState('');

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/communities/search?query=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      if (response.ok) {
        setSearchResults(data.communities);
      } else {
        setError(data.message || 'Failed to search communities');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommunitySelect = async (community) => {
    setIsLoading(true);
    setSelectedCommunity(community);
    
    try {
      // Check if it's a community type that doesn't require roles
      if (community.community_type_name === 'Private Group' || community.community_type_name === 'Infrastructure') {
        // For these types, we'll show a confirmation modal without roles
        setIsRoleModalOpen(true);
        setIsLoading(false);
        return;
      }
      
      // For other types, fetch roles
      const response = await fetch(`/api/communities/${community.id}/roles`);
      const data = await response.json();
      
      if (response.ok) {
        setRoles(data.roles);
        setIsRoleModalOpen(true);
      } else {
        setError(data.message || 'Failed to fetch roles');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Roles fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinCommunity = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/communities/follow-community', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          community_id: selectedCommunity.id,
          community_role_id: selectedRole?.id || null,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Success - close modals and reset state
        setIsModalOpen(false);
        setIsRoleModalOpen(false);
        setSearchQuery('');
        setSearchResults([]);
        setSelectedRole(null);
        // You might want to refresh the communities list here
      } else {
        setError(data.message || 'Failed to join community');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Join error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getCommunityTypeIcon = (typeName) => {
    switch (typeName) {
      case 'Private Group':
        return <Users className="w-4 h-4" />;
      case 'Infrastructure':
        return <Shield className="w-4 h-4" />;
      default:
        return <UserPlus className="w-4 h-4" />;
    }
  };

  const getCommunityTypeColor = (typeName) => {
    switch (typeName) {
      case 'Private Group':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Infrastructure':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  return (
    <>
      {/* Search Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden border border-gray-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Find Communities
                </h2>
                <p className="text-gray-600 mt-1">
                  Discover and join communities that match your interests
                </p>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSearchQuery('');
                  setSearchResults([]);
                  setError('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              {/* Search Input */}
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search communities by name..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-12 py-4 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                />
                {isLoading && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  </div>
                )}
              </div>

              {/* Search Results */}
              {searchResults.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  <p className="text-sm text-gray-600 mb-3">
                    Found {searchResults.length} community{searchResults.length === 1 ? '' : 's'}
                  </p>
                  {searchResults.map((community) => (
                    <div
                      key={community.id}
                      onClick={() => handleCommunitySelect(community)}
                      className="p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all duration-200"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center overflow-hidden shadow-sm">
                          {community.image_url ? (
                            <img
                              src={community.image_url}
                              alt={community.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Users className="w-6 h-6 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold text-gray-900 text-lg truncate">
                              {community.name}
                            </h3>
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getCommunityTypeColor(community.community_type_name)}`}>
                              {getCommunityTypeIcon(community.community_type_name)}
                              {community.community_type_name}
                            </span>
                          </div>
                          {community.description && (
                            <p className="text-gray-600 text-sm line-clamp-2">
                              {community.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                              community.is_open 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {community.is_open ? 'Open to join' : 'Request required'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {community.member_count || 0} members
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchQuery ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    No communities found
                  </h3>
                  <p className="text-gray-500">
                    Try searching with different keywords
                  </p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    Search for communities
                  </h3>
                  <p className="text-gray-500">
                    Enter community name to discover and join
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Join Confirmation Modal */}
      {isRoleModalOpen && selectedCommunity && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center overflow-hidden shadow-sm">
                  {selectedCommunity.image_url ? (
                    <img
                      src={selectedCommunity.image_url}
                      alt={selectedCommunity.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Users className="w-6 h-6 text-white" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Join {selectedCommunity.name}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {selectedCommunity.community_type_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsRoleModalOpen(false);
                  setSelectedRole(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : (
                <>
                  {/* For Private Group and Infrastructure - Simple confirmation */}
                  {(selectedCommunity.community_type_name === 'Private Group' || 
                    selectedCommunity.community_type_name === 'Infrastructure') ? (
                    <div className="text-center py-4">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserPlus className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Ready to join?
                      </h3>
                      <p className="text-gray-600 mb-6">
                        {selectedCommunity.is_open 
                          ? `You'll be added to ${selectedCommunity.name} as a member.`
                          : `Your request to join ${selectedCommunity.name} will be sent to community admins for approval.`
                        }
                      </p>
                    </div>
                  ) : (
                    /* For other types - Role selection */
                    <>
                      <p className="text-gray-600 mb-4">
                        {selectedCommunity.is_open
                          ? 'Select your role in this community:'
                          : 'Select your desired role. Your request will be sent to the community admins for approval.'}
                      </p>
                      
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {roles.map((role) => (
                          <div
                            key={role.id}
                            onClick={() => setSelectedRole(role)}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                              selectedRole?.id === role.id
                                ? 'border-blue-500 bg-blue-50 shadow-sm'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-semibold text-gray-900">
                                  {role.role_name}
                                </span>
                                {role.description && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    {role.description}
                                  </p>
                                )}
                              </div>
                              {selectedRole?.id === role.id && (
                                <CheckCircle2 className="w-5 h-5 text-blue-500" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3">
              <button
                onClick={() => {
                  setIsRoleModalOpen(false);
                  setSelectedRole(null);
                }}
                className="flex-1 px-4 py-3 text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-100 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleJoinCommunity}
                disabled={(!selectedRole && roles.length > 0) || isLoading}
                className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                  ((!roles.length && selectedCommunity) || selectedRole) && !isLoading
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : selectedCommunity.is_open ? (
                  'Join Community'
                ) : (
                  'Request to Join'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SearchAddCommunityButton;