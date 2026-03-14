import React, { useState, useEffect } from 'react';
import { X, Search, Layers, Crown, ChevronRight, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';

const UserFollowedModal = ({ type, isOpen, onClose }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const router = useRouter();

  const isLayers = type === 'layers';
  const isCommunities = type === 'communities';
  
  const title = isLayers ? 'Your Layers' : 'Your Communities';
  const emptyTitle = isLayers ? 'No Layers Yet' : 'No Communities Yet';
  const emptyMessage = isLayers 
    ? "You haven't followed any layers yet. Start exploring to find interesting layers to follow!"
    : "You haven't joined any communities yet. Discover and join communities that match your interests!";

  // Fetch data when modal opens  
  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  // Filter data based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredData(data);
    } else {
      const filtered = data.filter(item => {
        const name = isLayers ? item.layer_name : item.name;
        return name.toLowerCase().includes(searchTerm.toLowerCase());
      });
      setFilteredData(filtered);
    }
  }, [data, searchTerm, isLayers]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let endpoint;
      if (isLayers) {
        endpoint = '/api/user/followed-layers';
      } else {
        endpoint = '/api/user/community/followed-communities';
      }
      
      const response = await fetch(endpoint);
      const result = await response.json();
      
      if (response.ok) {
        if (isLayers) {
          setData(result.layers || []);
        } else {
          setData(result.communities || []);
        }
      } else {
        console.error('Failed to fetch data:', result.message);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = (item) => {
    if (isLayers) {
      router.push(`/layers/${item.layer_id}`);
    } else {
      router.push(`/communities?communityId=${item.id}`);
    }
    onClose();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-lg sm:rounded-2xl shadow-xl w-full max-w-sm sm:max-w-md max-h-[90vh] sm:max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-6 border-b border-gray-100">
          <div className="flex items-center gap-2 sm:gap-3">
            {isLayers ? (
              <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
            ) : (
              <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
            )}
            <h2 className="text-lg sm:text-2xl font-bold text-gray-800">{title}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Search Bar */}
        {data.length > 0 && (
          <div className="p-3 sm:p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${isLayers ? 'layers' : 'communities'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8 sm:py-12">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-8 sm:py-12 px-4">
              {isLayers ? (
                <Layers className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
              ) : (
                <Crown className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
              )}
              <h3 className="text-base sm:text-lg font-semibold text-gray-600 mb-2">{emptyTitle}</h3>
              <p className="text-gray-500 text-xs sm:text-sm px-2">{emptyMessage}</p>
            </div>
          ) : (
            <div className="py-2 sm:py-3">
              {filteredData.map((item, index) => (
                <div
                  key={index}
                  onClick={() => handleItemClick(item)}
                  className="flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 last:border-b-0"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Icon/Image */}
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isLayers ? 'bg-red-100' : 'bg-purple-100'
                    }`}>
                      {isLayers ? (
                        <Layers className={`w-4 h-4 sm:w-5 sm:h-5 text-red-500`} />
                      ) : item.image_url ? (
                        <img 
                          src={item.image_url} 
                          alt={item.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-800 text-sm sm:text-base truncate">
                          {isLayers ? item.layer_name : item.name}
                        </h3>
                        
                        {/* Status badges */}
                        {isLayers && item.is_permanent && (
                          <span className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded-full font-medium">
                            Core
                          </span>
                        )}
                        {!isLayers && (
                          <>
                            {/* Status badges */}
                            {item.status === 'pending' && (
                              <span className="bg-yellow-100 text-yellow-800 text-xs px-1.5 py-0.5 rounded-full font-medium">
                                Pending
                              </span>
                            )}
                            {/* Role badge */}
                            <span className="bg-purple-100 text-purple-800 text-xs px-1.5 py-0.5 rounded-full font-medium capitalize">
                              {item.role_name || 'Member'}
                            </span>
                          </>
                        )}
                      </div>
                      
                      {/* Description */}
                      {!isLayers && item.description && (
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">
                          {item.description}
                        </p>
                      )}
                      
                      {/* Date */}
                      <div className="flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-400">
                          {isLayers ? 'Followed' : 'Joined'} {formatDate(isLayers ? item.followed_at : item.followed_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with count */}
        {filteredData.length > 0 && (
          <div className="px-3 py-2 sm:px-4 sm:py-3 bg-gray-50 border-t border-gray-100">
            <p className="text-xs sm:text-sm text-gray-600 text-center">
              {filteredData.length} {isLayers ? 
                (filteredData.length === 1 ? 'layer' : 'layers') : 
                (filteredData.length === 1 ? 'community' : 'communities')}
              {searchTerm && ` matching "${searchTerm}"`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserFollowedModal;