// "use client"

// import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { CheckCircle, Circle, ArrowRight, Layers3, Search } from 'lucide-react';
// import Avatar from '@/components/shared/Avatar';

// const FollowOnboardingPage = () => {
//   const [layers, setLayers] = useState([]);
//   const [selectedLayers, setSelectedLayers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [submitting, setSubmitting] = useState(false);
//   const [error, setError] = useState('');
//   const [searchQuery, setSearchQuery] = useState('');
//   const [searchResults, setSearchResults] = useState([]);
//   const [isSearching, setIsSearching] = useState(false);
//   const router = useRouter();

//   const MAX_SELECTIONS = 2; // Maximum layer selections allowed
//   const MIN_SELECTIONS = 2; // Minimum layer selections required

//   useEffect(() => {
//     fetchData();
//   }, []);

//   // Debounced search
//   useEffect(() => {
//     const timer = setTimeout(() => {
//       if (searchQuery.trim()) {
//         handleSearch();
//       } else {
//         setSearchResults([]);
//       }
//     }, 300);

//     return () => clearTimeout(timer);
//   }, [searchQuery]);

//   const fetchData = async () => {
//     try {
//       const response = await fetch('/api/onboarding/follow');
//       if (response.ok) {
//         const data = await response.json();
//         setLayers(data.layers || []);
        
//         // Get already followed non-permanent layers
//         const alreadyFollowedLayers = data.layers
//           .filter(l => l.isFollowed && !l.is_permanent)
//           .map(l => l.id);
        
//         setSelectedLayers(alreadyFollowedLayers);
//       } else {
//         setError('Failed to load data');
//       }
//     } catch (err) {
//       setError('Failed to load data');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const toggleLayerSelection = (layerId) => {
//     if (selectedLayers.includes(layerId)) {
//       setSelectedLayers(prev => prev.filter(id => id !== layerId));
//       setError(''); // Clear any previous error
//     } else if (selectedLayers.length < MAX_SELECTIONS) {
//       setSelectedLayers(prev => [...prev, layerId]);
//       setError(''); // Clear any previous error
//     } else {
//       setError(`You can follow up to ${MAX_SELECTIONS} layers. You can follow more later from your feed!`);
//     }
//   };

//   const handleSearch = async () => {
//     if (!searchQuery.trim()) return;

//     setIsSearching(true);
//     try {
//       const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&filter=layers`);
//       if (response.ok) {
//         const results = await response.json();
//         // Filter out permanent layers from search results
//         const filteredResults = results.filter(result => !result.is_permanent);
//         setSearchResults(filteredResults);
//       }
//     } catch (error) {
//       console.error('Error searching:', error);
//     } finally {
//       setIsSearching(false);
//     }
//   };

//   const handleAddFromSearch = (item) => {
//     if (selectedLayers.length >= MAX_SELECTIONS) {
//       setError(`You can select up to ${MAX_SELECTIONS} layers in total`);
//       return;
//     }

//     if (!selectedLayers.includes(item.id)) {
//       setSelectedLayers(prev => [...prev, item.id]);
//       if (!layers.find(l => l.id === item.id)) {
//         setLayers(prev => [...prev, { ...item, isFollowed: false }]);
//       }
//     }
    
//     setSearchQuery('');
//     setSearchResults([]);
//   };

//   const handleSubmit = async () => {
//     if (selectedLayers.length < MIN_SELECTIONS) {
//       setError(`Please select at least ${MIN_SELECTIONS} layers to continue`);
//       return;
//     }

//     setSubmitting(true);
//     setError('');

//     try {
//       const response = await fetch('/api/onboarding/follow', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           layerIds: selectedLayers,
//         }),
//       });

//       if (response.ok) {
//         window.location.href = '/layers/4'; // full page reload with cookie
//       } else {
//         const data = await response.json();
//         setError(data.message || 'Failed to save preferences');
//       }
//     } catch (err) {
//       setError('Failed to save preferences');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4"></div>
//           <p className="text-sm text-gray-600">Loading your preferences...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//   <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-4 px-4 sm:py-6">
//     <div className="max-w-3xl mx-auto">
//       {/* Header - More compact */}
//       <div className="text-center mb-6">
//         <div className="mx-auto h-10 w-10 bg-indigo-600 rounded-full flex items-center justify-center mb-3">
//           <Layers3 className="h-4 w-4 text-white" />
//         </div>
//         <h1 className="text-xl font-bold text-gray-900 mb-1">
//           Choose Your Interests
//         </h1>
//         <p className="text-xs text-gray-600 max-w-md mx-auto">
//           Select {MIN_SELECTIONS} layers to personalize your feed
//         </p>
//       </div>

//       {/* Search Section - More compact */}
//       <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 mb-4">
//         <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
//           <Search className="w-4 h-4 mr-1 text-indigo-600" />
//           Discover Layers
//         </h3>
//         <div className="relative">
//           <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
//             <Search className="h-3 w-3 text-gray-400" />
//           </div>
//           <input
//             type="text"
//             placeholder="Search layers..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="block w-full pl-8 pr-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
//           />
//         </div>

//         {/* Search Results - More compact */}
//         {(searchResults.length > 0 || isSearching) && searchQuery && (
//           <div className="mt-2 border border-gray-200 rounded-md max-h-48 overflow-y-auto text-xs">
//             {isSearching ? (
//               <div className="p-2 text-center text-gray-500 flex items-center justify-center">
//                 <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-600 mr-1"></div>
//                 Searching...
//               </div>
//             ) : searchResults.length === 0 ? (
//               <div className="p-2 text-center text-gray-500">
//                 No matching layers
//               </div>
//             ) : (
//               searchResults.map((result) => {
//                 const isAlreadySelected = selectedLayers.includes(result.id);
                
//                 return (
//                   <div
//                     key={result.id}
//                     className="flex items-center justify-between p-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
//                   >
//                     <div className="flex items-center space-x-2">
//                       <Avatar item={{ ...result, itemType: 'layer' }} size="sm" />
//                       <div>
//                         <p className="font-medium text-gray-900">{result.name}</p>
//                       </div>
//                     </div>
//                     <button
//                       onClick={() => handleAddFromSearch(result)}
//                       disabled={isAlreadySelected || selectedLayers.length >= MAX_SELECTIONS}
//                       className={`px-2 py-1 text-xs rounded-md font-medium ${
//                         isAlreadySelected 
//                           ? 'bg-green-100 text-green-700 cursor-not-allowed'
//                           : selectedLayers.length >= MAX_SELECTIONS
//                             ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
//                             : 'bg-indigo-600 text-white hover:bg-indigo-700'
//                       }`}
//                     >
//                       {isAlreadySelected ? '✓' : 'Add'}
//                     </button>
//                   </div>
//                 );
//               })
//             )}
//           </div>
//         )}
//       </div>

//       {error && (
//         <div className="mb-3 bg-red-50 border border-red-200 rounded-md p-2 text-xs text-red-600 flex items-center">
//           <Circle className="w-3 h-3 mr-1 fill-current" />
//           {error}
//         </div>
//       )}

//       {/* Layers Section - More compact */}
//       <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-4">
//         <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-3">
//           <div className="flex items-center space-x-2">
//             <div className="bg-white bg-opacity-20 rounded-md p-1">
//               <Layers3 className="h-4 w-4 text-white" />
//             </div>
//             <div>
//               <h2 className="text-sm font-semibold text-white">Popular Layers</h2>
//             </div>
//           </div>
//         </div>
        
//         <div className="p-3">
//           {layers.length === 0 ? (
//             <p className="text-gray-500 text-center py-4 text-xs">No layers available</p>
//           ) : (
//             <div className="grid gap-2">
//               {layers.map((layer) => (
//                 <div
//                   key={layer.id}
//                   onClick={() => toggleLayerSelection(layer.id)}
//                   className={`cursor-pointer rounded-lg p-3 border transition-all ${
//                     selectedLayers.includes(layer.id)
//                       ? 'border-blue-500 bg-blue-50'
//                       : 'border-gray-200 hover:border-blue-300'
//                   }`}
//                 >
//                   <div className="flex items-center justify-between">
//                     <div className="flex items-center space-x-2">
//                       <Avatar item={{ ...layer, itemType: 'layer' }} size="sm" />
//                       <div className="flex-1">
//                         <h3 className="text-xs font-semibold text-gray-900">{layer.name}</h3>
//                       </div>
//                     </div>
//                     <div className="ml-2">
//                       {selectedLayers.includes(layer.id) ? (
//                         <CheckCircle className="h-4 w-4 text-blue-500" />
//                       ) : (
//                         <Circle className="h-4 w-4 text-gray-400" />
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Selection Summary & Continue Button - More compact */}
//       <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3">
//         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
//           <div className="mb-2 sm:mb-0">
//             <p className="text-xs text-gray-600">
//               Selected: <span className="font-semibold text-blue-600">{selectedLayers.length}/{MIN_SELECTIONS}</span>
//             </p>
//             {selectedLayers.length < MIN_SELECTIONS && (
//               <p className="text-xs text-amber-600 mt-0.5">
//                 Select {MIN_SELECTIONS - selectedLayers.length} more
//               </p>
//             )}
//           </div>
          
//           <button
//             onClick={handleSubmit}
//             disabled={submitting || selectedLayers.length < MIN_SELECTIONS}
//             className={`w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-medium transition-all ${
//               submitting || selectedLayers.length < MIN_SELECTIONS
//                 ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
//                 : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
//             }`}
//           >
//             {submitting ? (
//               <>
//                 <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
//                 Processing...
//               </>
//             ) : (
//               'Continue'
//             )}
//           </button>
//         </div>
//       </div>
//     </div>
//   </div>
//   );
// };

// export default FollowOnboardingPage;

"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Circle, ArrowRight, Layers3, Search } from 'lucide-react';
import Avatar from '@/components/shared/Avatar';
import { getGuestFollows, setGuestFollows } from '@/utils/guests/guestUser';

const FollowOnboardingPage = () => {
  const [layers, setLayers] = useState([]);
  const [selectedLayers, setSelectedLayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [userInfo, setUserInfo] = useState({ isGuest: false, hasFollowedLayer: false });
  const router = useRouter();

  const MAX_SELECTIONS = 2;
  const MIN_SELECTIONS = 2;

  useEffect(() => {
    fetchData();
  }, []);

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
  }, [searchQuery]);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/onboarding/follow');
      if (response.ok) {
        const data = await response.json();
        setLayers(data.layers || []);
        setUserInfo({
          isGuest: data.isGuest || false,
          hasFollowedLayer: data.hasFollowedLayer || false
        });

        // Handle follow status based on user type
        if (data.isGuest) {
          // For guests, get follows from sessionStorage
          const guestData = getGuestFollows();
          const guestFollowedLayers = guestData.layers || [];
          
          // Update layers with guest follow status
          const updatedLayers = data.layers.map(layer => ({
            ...layer,
            isFollowed: guestFollowedLayers.includes(layer.id)
          }));
          setLayers(updatedLayers);
          
          // Set selected layers from guest data
          const alreadyFollowedLayers = updatedLayers
            .filter(l => l.isFollowed && !l.is_permanent)
            .map(l => l.id);
          setSelectedLayers(alreadyFollowedLayers);
        } else {
          // For registered users, use server data
          const alreadyFollowedLayers = data.layers
            .filter(l => l.isFollowed && !l.is_permanent)
            .map(l => l.id);
          setSelectedLayers(alreadyFollowedLayers);
        }
      } else {
        setError('Failed to load data');
      }
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const toggleLayerSelection = (layerId) => {
    if (selectedLayers.includes(layerId)) {
      setSelectedLayers(prev => prev.filter(id => id !== layerId));
      setError('');
    } else if (selectedLayers.length < MAX_SELECTIONS) {
      setSelectedLayers(prev => [...prev, layerId]);
      setError('');
    } else {
      setError(`You can follow up to ${MAX_SELECTIONS} layers. You can follow more later from your feed!`);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&filter=layers`);
      if (response.ok) {
        const results = await response.json();
        const filteredResults = results.filter(result => !result.is_permanent);
        setSearchResults(filteredResults);
      }
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddFromSearch = (item) => {
    if (selectedLayers.length >= MAX_SELECTIONS) {
      setError(`You can select up to ${MAX_SELECTIONS} layers in total`);
      return;
    }

    if (!selectedLayers.includes(item.id)) {
      setSelectedLayers(prev => [...prev, item.id]);
      if (!layers.find(l => l.id === item.id)) {
        setLayers(prev => [...prev, { ...item, isFollowed: false }]);
      }
    }
    
    setSearchQuery('');
    setSearchResults([]);
  };

const handleGuestSubmit = async () => {
  // For guests, handle everything client-side
  
  // Get full layer data for the selected layers
  const selectedLayerData = layers.filter(layer => selectedLayers.includes(layer.id));
  
  const guestData = {
    layers: selectedLayers, // Keep the simple array of IDs
    bottomBar: selectedLayerData.map((layer, index) => ({
      // Structure it exactly like the bottom bar expects
      id: layer.id,
      name: layer.name,
      type: 'layer', // Always 'layer' for onboarding
      path: `/layers/${layer.id}`,
      profile_pic_url: layer.profile_pic_url || null,
      page_type_name: layer.page_type_name || null,
      // Also keep the API format for compatibility
      item_id: layer.id,
      item_type: 'layer',
      position: index + 1
    }))
  };

  // Save to sessionStorage
  setGuestFollows(null, guestData);

  // Update JWT token to reflect hasFollowedLayer = true
  try {
    const response = await fetch('/api/auth/update-guest-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        hasFollowedLayer: true
      })
    });

    if (response.ok) {
      window.location.href = '/layers/6'; // full page reload with updated cookie
    } else {
      // If token update fails, still redirect (data is saved in sessionStorage)
      console.warn('Token update failed, but proceeding with redirect');
      window.location.href = '/layers/6';
    }
  } catch (error) {
    // If token update fails, still redirect (data is saved in sessionStorage)
    console.warn('Token update failed, but proceeding with redirect');
    window.location.href = '/layers/6';
  }
};

  const handleRegisteredUserSubmit = async () => {
    // For registered users, use the existing API
    const response = await fetch('/api/onboarding/follow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        layerIds: selectedLayers,
      }),
    });

    if (response.ok) {
      window.location.href = '/layers/6';
    } else {
      const data = await response.json();
      setError(data.message || 'Failed to save preferences');
    }
  };

  const handleSubmit = async () => {
    if (selectedLayers.length < MIN_SELECTIONS) {
      setError(`Please select at least ${MIN_SELECTIONS} layers to continue`);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      if (userInfo.isGuest) {
        await handleGuestSubmit();
      } else {
        await handleRegisteredUserSubmit();
      }
    } catch (err) {
      setError('Failed to save preferences');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Loading your preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-4 px-4 sm:py-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto h-10 w-10 bg-indigo-600 rounded-full flex items-center justify-center mb-3">
            <Layers3 className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">
            Choose Your Interests
          </h1>
          <p className="text-xs text-gray-600 max-w-md mx-auto">
            Select {MIN_SELECTIONS} layers to personalize your feed
            {userInfo.isGuest && (
              <span className="block text-indigo-600 font-medium mt-1">
                ✨ Guest Mode - Your preferences are saved for this session
              </span>
            )}
          </p>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 mb-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
            <Search className="w-4 h-4 mr-1 text-indigo-600" />
            Discover Layers
          </h3>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
              <Search className="h-3 w-3 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search layers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-8 pr-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Search Results */}
          {(searchResults.length > 0 || isSearching) && searchQuery && (
            <div className="mt-2 border border-gray-200 rounded-md max-h-48 overflow-y-auto text-xs">
              {isSearching ? (
                <div className="p-2 text-center text-gray-500 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-600 mr-1"></div>
                  Searching...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-2 text-center text-gray-500">
                  No matching layers
                </div>
              ) : (
                searchResults.map((result) => {
                  const isAlreadySelected = selectedLayers.includes(result.id);
                  
                  return (
                    <div
                      key={result.id}
                      className="flex items-center justify-between p-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center space-x-2">
                        <Avatar item={{ ...result, itemType: 'layer' }} size="sm" />
                        <div>
                          <p className="font-medium text-gray-900">{result.name}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddFromSearch(result)}
                        disabled={isAlreadySelected || selectedLayers.length >= MAX_SELECTIONS}
                        className={`px-2 py-1 text-xs rounded-md font-medium ${
                          isAlreadySelected 
                            ? 'bg-green-100 text-green-700 cursor-not-allowed'
                            : selectedLayers.length >= MAX_SELECTIONS
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                      >
                        {isAlreadySelected ? '✓' : 'Add'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="mb-3 bg-red-50 border border-red-200 rounded-md p-2 text-xs text-red-600 flex items-center">
            <Circle className="w-3 h-3 mr-1 fill-current" />
            {error}
          </div>
        )}

        {/* Layers Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-4">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-3">
            <div className="flex items-center space-x-2">
              <div className="bg-white bg-opacity-20 rounded-md p-1">
                <Layers3 className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Popular Layers</h2>
              </div>
            </div>
          </div>
          
          <div className="p-3">
            {layers.length === 0 ? (
              <p className="text-gray-500 text-center py-4 text-xs">No layers available</p>
            ) : (
              <div className="grid gap-2">
                {layers.map((layer) => (
                  <div
                    key={layer.id}
                    onClick={() => toggleLayerSelection(layer.id)}
                    className={`cursor-pointer rounded-lg p-3 border transition-all ${
                      selectedLayers.includes(layer.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Avatar item={{ ...layer, itemType: 'layer' }} size="sm" />
                        <div className="flex-1">
                          <h3 className="text-xs font-semibold text-gray-900">{layer.name}</h3>
                        </div>
                      </div>
                      <div className="ml-2">
                        {selectedLayers.includes(layer.id) ? (
                          <CheckCircle className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Circle className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Selection Summary & Continue Button */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-2 sm:mb-0">
              <p className="text-xs text-gray-600">
                Selected: <span className="font-semibold text-blue-600">{selectedLayers.length}/{MIN_SELECTIONS}</span>
              </p>
              {selectedLayers.length < MIN_SELECTIONS && (
                <p className="text-xs text-amber-600 mt-0.5">
                  Select {MIN_SELECTIONS - selectedLayers.length} more
                </p>
              )}
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={submitting || selectedLayers.length < MIN_SELECTIONS}
              className={`w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                submitting || selectedLayers.length < MIN_SELECTIONS
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
              }`}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                  Processing...
                </>
              ) : (
                'Continue'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FollowOnboardingPage;