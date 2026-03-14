"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Settings, X, Search, Plus, GripVertical, Layers, FileText, Users } from 'lucide-react';
import { BASE_IMG_URL } from '@/lib/map/constants';
import { getGuestFollows, setGuestFollows } from '@/utils/guests/guestUser'; // Add this import
import { useIdentityStore } from '@/stores/activeIdentityStore';

export default function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [bottomBarItems, setBottomBarItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchFilter, setSearchFilter] = useState('all');
  const [editingItems, setEditingItems] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedOverIndex, setDraggedOverIndex] = useState(null);
  const currentIdentity = useIdentityStore(state => state.currentIdentity);


  // Fetch user's bottom bar configuration
  useEffect(() => {
    const fetchBottomBarItems = async () => {
      try {
        if (currentIdentity?.type === 'guest') {
          // For guests, wait until sessionStorage has the data
          const interval = setInterval(() => {
            const guestData = getGuestFollows();
            if (guestData.bottomBar && guestData.bottomBar.length > 0) {
              setBottomBarItems(guestData.bottomBar);
              setLoading(false);
              clearInterval(interval);
            }
          }, 50); // Check every 50ms

          // Safety timeout in case no data ever appears
          setTimeout(() => {
            clearInterval(interval);
            setLoading(false);
          }, 5000); // 5s max wait
        } else {
          // For registered users, fetch from API
          const response = await fetch('/api/user/bottom-bar');
          if (response.ok) {
            const data = await response.json();
            setBottomBarItems(data.items || []);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching bottom bar items:', error);
        setLoading(false);
      }
    };

    fetchBottomBarItems();
  }, [currentIdentity]);

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&filter=${searchFilter}`);
      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
      }
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchFilter]);

  // Handle adding item to bottom bar
  const handleAddToBottomBar = (item) => {
    if (editingItems.length >= 5) {
      alert('Maximum 5 items allowed in bottom bar. Please remove an item first to add a new one.');
      return;
    }

    const newItem = {
      id: item.id,
      name: item.name,
      type: item.itemType,
      path: item.itemType === 'page' 
        ? `/page/${item.id}` 
        : item.itemType === 'layer'
          ? `/layers/${item.id}`
          : `/communities?community=${item.id}`,
      profile_pic_url: item.profile_pic_url 
        ? (item.itemType === 'community' ? `${BASE_IMG_URL}${item.profile_pic_url}` : item.profile_pic_url)
        : null,
      page_type_name: item.page_type_name
    };

    // Check if item already exists
    if (!editingItems.find(existingItem => existingItem.id === newItem.id && existingItem.type === newItem.type)) {
      setEditingItems([...editingItems, newItem]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };
 
  // Handle removing item from editing list
  const handleRemoveFromEdit = (index) => {
    setEditingItems(editingItems.filter((_, i) => i !== index));
  };

  // Handle reordering items
  const handleReorder = (fromIndex, toIndex) => {
    const newItems = [...editingItems];
    const [removed] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, removed);
    setEditingItems(newItems);
  };

  const handleSaveBottomBar = async () => {
    try {
      if (currentIdentity?.type === 'guest') {
        // For guests, save to sessionStorage
        const guestData = getGuestFollows();
        
        // Structure the data exactly as the bottom bar expects to read it
        const formattedBottomBar = editingItems.map((item, index) => ({
          // Bottom bar format
          id: item.id,
          name: item.name,
          type: item.type,
          path: item.path,
          profile_pic_url: item.profile_pic_url,
          page_type_name: item.page_type_name,
          // Also keep API format for compatibility
          item_id: item.id,
          item_type: item.type,
          position: index + 1
        }));

        const updatedGuestData = {
          ...guestData,
          bottomBar: formattedBottomBar
        };
        
        setGuestFollows(null, updatedGuestData);
        setBottomBarItems(editingItems);
      } else {
        // For registered users, save to API
        const response = await fetch('/api/user/bottom-bar', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ items: editingItems }),
        });

        if (response.ok) {
          setBottomBarItems(editingItems);
        }
      }
      
      setShowEditModal(false);
      setEditingItems([]);
    } catch (error) {
      console.error('Error saving bottom bar:', error);
    }
  };

  // Open edit modal
  const handleEditBottomBar = () => {
    setEditingItems([...bottomBarItems]);
    setShowEditModal(true);
  };

  const getItemIcon = (type) => {
    switch(type) {
      case 'page': return FileText;
      case 'layer': return Layers;
      case 'community': return Users;
      default: return FileText;
    }
  };

  const getItemStyles = (type, isActive = false) => {
    switch(type) {
      case 'page':
        return isActive 
          ? 'bg-blue-100 text-blue-700 border-blue-200' 
          : 'text-blue-600 hover:bg-blue-50';
      case 'layer':
        return isActive 
          ? 'bg-purple-100 text-purple-700 border-purple-200' 
          : 'text-purple-600 hover:bg-purple-50';
      case 'community':
        return isActive
          ? 'bg-green-100 text-green-700 border-green-200'
          : 'text-green-600 hover:bg-green-50';
      default:
        return isActive 
          ? 'bg-blue-100 text-blue-700 border-blue-200' 
          : 'text-blue-600 hover:bg-blue-50';
    }
  };

  // Check if tab is active
  const isTabActive = (tabPath) => {
    return pathname === tabPath || pathname.startsWith(tabPath + '/');
  };

  // Get initials for avatar
  const getInitials = (name) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="fixed bottom-0 left-0 right-0 flex justify-center pb-2 md:pb-4 z-10">
        <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-full border border-gray-200 px-6 h-14 md:h-16 flex items-center">
          <div className="text-gray-500 text-sm">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="fixed bottom-0 left-0 right-0 flex justify-center pb-2 md:pb-4 z-10">
    {/* Desktop view */}
      <div className="hidden md:flex bg-white/90 backdrop-blur-sm shadow-lg rounded-full border border-gray-200 items-center px-3 h-16 mx-8 w-full max-w-4xl">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-2 flex-1">
            {/* Render 5 slots - either items or plus buttons */}
            {Array.from({ length: 5 }).map((_, index) => {
              if (index < bottomBarItems.length) {
                const item = bottomBarItems[index];
                const Icon = getItemIcon(item.type);
                const isActive = isTabActive(item.path);
                
                return (
                  <button
                    key={`${item.type}-${item.id}`}
                    className={`flex items-center justify-center px-3 py-2 rounded-full transition-all duration-200 border flex-1 ${
                      isActive
                        ? getItemStyles(item.type, true)
                        : getItemStyles(item.type, false) + ' border-transparent hover:border-gray-200'
                    }`}
                    onClick={() => router.push(item.path)}
                  >
                    <div className="flex items-center space-x-2">
                      {item.profile_pic_url ? (
                          <img 
                            src={item.type === 'community' ? `${BASE_IMG_URL}${item.profile_pic_url}` : item.profile_pic_url} 
                            alt={item.name} 
                            className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <Icon className="w-4 h-4 flex-shrink-0" />
                        )}

                      <span className="text-sm font-medium truncate">
                        {item.name.length > 12 ? item.name.substring(0, 12) + '...' : item.name}
                      </span>
                    </div>
                  </button>
                );
              } else {
                return (
                  <button
                    key={`plus-${index}`}
                    onClick={() => handleEditBottomBar()}
                    className="flex flex-col items-center justify-center px-3 py-2 rounded-full transition-all duration-200 border border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-400 hover:text-gray-600 flex-1"
                  >
                    <div className="flex items-center space-x-1">
                      <Plus className="w-4 h-4" />
                      <span className="text-sm font-medium">Add</span>
                    </div>
                  </button>
                );
              }
            })}
          </div>
          
          {/* Always show settings/edit button */}
        {bottomBarItems.length === 5 && (
          <div className="relative ml-3 flex-shrink-0">
            <button
              onClick={() => handleEditBottomBar()}
              className="flex items-center justify-center w-10 h-10 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
              title="Edit Bottom Bar"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
    
    {/* Mobile view */}
    <div className="flex md:hidden bg-white/90 backdrop-blur-sm shadow-lg rounded-full border border-gray-200 items-center h-12 w-full max-w-sm mx-4 px-1.5 relative">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center flex-1 min-w-0">
            {/* Render 5 slots for mobile */}
            {Array.from({ length: 5 }).map((_, index) => {
              if (index < bottomBarItems.length) {
                const item = bottomBarItems[index];
                const Icon = getItemIcon(item.type);
                const isActive = isTabActive(item.path);
                
                return (
                  <button
                    key={`${item.type}-${item.id}`}
                    className={`flex flex-col items-center justify-center px-1 py-1 rounded-lg transition-all duration-200 flex-1 min-w-0 ${
                      isActive ? getItemStyles(item.type, true) : getItemStyles(item.type, false)
                    }`}
                    onClick={() => router.push(item.path)}
                  >
                    {item.profile_pic_url ? (
                        <img 
                          src={item.type === 'community' ? `${BASE_IMG_URL}${item.profile_pic_url}` : item.profile_pic_url} 
                          alt={item.name} 
                          className="w-3.5 h-3.5 rounded-full object-cover mb-0.5 flex-shrink-0"
                        />
                      ) : (
                        <Icon className="w-3 h-3 mb-0.5 flex-shrink-0" />
                      )}
                    <span className="text-[10px] leading-tight truncate w-full text-center">
                      {item.name.length > 6 ? item.name.substring(0, 6) + '...' : item.name}
                    </span>
                  </button>
                );
              } else {
                return (
                  <button
                    key={`plus-mobile-${index}`}
                    onClick={() => handleEditBottomBar()}
                    className="flex flex-col items-center justify-center px-1 py-1 rounded-lg transition-all duration-200 flex-1 min-w-0 border border-dashed border-gray-300 hover:border-gray-400 text-gray-400 hover:text-gray-500"
                  >
                    <Plus className="w-3 h-3 mb-0.5 flex-shrink-0" />
                    <span className="text-[10px] leading-tight">Add</span>
                  </button>
                );
              }
            })}
          </div>

          {bottomBarItems.length === 5 && (
            <button
                onClick={() => handleEditBottomBar()}
                className="flex items-center justify-center w-7 h-7 rounded-full text-gray-500 ml-1 flex-shrink-0"
                title="Edit"
              >
                <Plus className="w-3 h-3" />
              </button>
          )}
          
          </div>
        </div>
    </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Edit Bottom Bar ({editingItems.length}/5)
              </h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingItems([]);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
            {/* Search Section */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {editingItems.length >= 5 ? 'Bottom Bar Full - Remove items to add new ones' : `Add Layers (${editingItems.length}/5)`}
                </label>
                
                {/* Enhanced Search Bar */}
                <div className="relative mb-3">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search for layers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 text-sm border border-gray-300 rounded-xl bg-white shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 hover:border-gray-400 placeholder-gray-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    >
                      <X className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors" />
                    </button>
                  )}
                </div>

                {/* Search Results */}
                {(searchResults.length > 0 || isSearching) && searchQuery && (
                  <div className="border border-gray-200 rounded-xl shadow-sm max-h-48 overflow-y-auto bg-white">
                    {isSearching ? (
                      <div className="p-4 text-center text-gray-500">
                        <div className="inline-flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                          <span>Searching layers...</span>
                        </div>
                      </div>
                    ) : (
                      searchResults.map((result) => {
                        const Icon = getItemIcon(result.itemType);
                        const isAlreadyAdded = editingItems.find(
                          item => item.id === result.id && item.type === result.itemType
                        );
                        
                        return (
                          <div
                            key={`${result.itemType}-${result.id}`}
                            className="flex items-center justify-between p-4 hover:bg-purple-50 border-b border-gray-100 last:border-b-0 transition-colors duration-150"
                          >
                            <div className="flex items-center space-x-3">
                              {result.profile_pic_url ? (
                                <img
                                  src={result.profile_pic_url}
                                  alt={result.name}
                                  className="w-10 h-10 rounded-full object-cover border-2 border-purple-100"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold bg-gradient-to-br from-purple-500 to-purple-600 shadow-sm">
                                  <Icon className="w-5 h-5" />
                                </div>
                              )}
                              
                              <div>
                                <p className="font-medium text-gray-900">{result.name}</p>
                                <div className="flex items-center space-x-2">
                                  <p className="text-xs text-purple-600 font-medium capitalize">
                                    Layer
                                  </p>
                                  {result.page_type_name && (
                                    <>
                                      <span className="text-xs text-gray-400">•</span>
                                      <p className="text-xs text-gray-600 capitalize">
                                        {result.page_type_name}
                                      </p>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleAddToBottomBar(result)}
                              disabled={isAlreadyAdded || editingItems.length >= 5}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                isAlreadyAdded 
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : editingItems.length >= 5
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-purple-600 text-white hover:bg-purple-700 shadow-sm hover:shadow-md transform hover:-translate-y-0.5'
                              }`}
                            >
                              {isAlreadyAdded ? 'Added' : 'Add'}
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Current Items */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Bottom Bar Items (Drag to reorder)
                </label>
                
                {editingItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Plus className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>No items added yet</p>
                    <p className="text-sm">Search and add pages or layers above</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {editingItems.map((item, index) => {
                      const Icon = getItemIcon(item.type);
                      
                      return (
                        <div
                          key={`editing-${item.type}-${item.id}-${index}`}
                          draggable
                          onDragStart={(e) => {
                            setDraggedItem(index);
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                            setDraggedOverIndex(index);
                          }}
                          onDragLeave={() => {
                            setDraggedOverIndex(null);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (draggedItem !== null && draggedItem !== index) {
                              handleReorder(draggedItem, index);
                            }
                            setDraggedItem(null);
                            setDraggedOverIndex(null);
                          }}
                          onDragEnd={() => {
                            setDraggedItem(null);
                            setDraggedOverIndex(null);
                          }}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-move ${
                            draggedOverIndex === index 
                              ? 'bg-blue-50 border-blue-200 transform scale-105' 
                              : draggedItem === index
                              ? 'bg-gray-100 border-gray-300 opacity-50'
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <GripVertical className="w-4 h-4 text-gray-400" />
                              {item.profile_pic_url ? (
                                <img
                                  src={item.itemType === 'community' ? `${BASE_IMG_URL}${item.profile_pic_url}` : item.profile_pic_url}
                                  alt={item.name}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                                  item.itemType === 'page' 
                                    ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                                    : 'bg-gradient-to-br from-purple-500 to-purple-600'
                                }`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                              )}
                            <div className="pointer-events-none">
                              <p className="font-medium text-gray-900">{item.name}</p>
                              <div className="flex items-center space-x-2">
                                <p className={`text-xs capitalize ${
                                  item.type === 'page' ? 'text-blue-600' : 'text-purple-600'
                                }`}>
                                  {item.type}
                                </p>
                                {item.page_type_name && (
                                  <>
                                    <span className="text-xs text-gray-400">•</span>
                                    <p className="text-xs text-gray-600 capitalize">
                                      {item.page_type_name}
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFromEdit(index);
                            }}
                            className="text-red-500 hover:text-red-700 transition-colors z-10"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingItems([]);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBottomBar}
                disabled={editingItems.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}