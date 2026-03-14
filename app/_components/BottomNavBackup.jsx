// "use client";

// import { useEffect, useState } from 'react';
// import { useRouter, usePathname } from 'next/navigation';

// export default function BottomNavigation() {
//   const router = useRouter();
//   const pathname = usePathname();
//   const [activeTab, setActiveTab] = useState(getActiveTabFromPath(pathname));
  
//   // Function to determine active tab based on current path
//   function getActiveTabFromPath(path) {
//     if (path === '/') {
//       return '/';
//     } else if (path === '/layers/jobs' || path.startsWith('/layers/jobs/')) {
//       return '/layers/jobs';
//     } else if (path === '/layers/city' || path.startsWith('/layers/city/')) {
//       return '/layers/city';
//     }
//     return path;
//   }
  
//   // Update active tab when pathname changes
//   useEffect(() => {
//     setActiveTab(getActiveTabFromPath(pathname));
//   }, [pathname]);
  
//   const tabs = [
//     {
//       name: 'News on Map',
//       path: '/',
//       displayName: ['News on', 'Map']
//     },
//     {
//       name: 'Jobs',
//       path: '/layers/jobs',
//       displayName: ['Jobs']
//     },
//     {
//       name: 'City',
//       path: '/layers/city',
//       displayName: ['City']
//     },
//   ];

//   const handleTabClick = (path) => {
//     setActiveTab(path);
//     router.push(path);
//   };

//   // Helper function to check if a tab is active
//   const isTabActive = (tabPath) => {
//     // For news tab
//     if (tabPath === '/') {
//       return pathname === '/';
//     }
//     // For jobs tab
//     else if (tabPath === '/layers/jobs') {
//       return pathname === '/layers/jobs' || pathname.startsWith('/layers/jobs/');
//     }
//     // For city tab
//     else if (tabPath === '/layers/city') {
//       return pathname === '/layers/city' || pathname.startsWith('/layers/city/');
//     }
//     return false;
//   };

//   // Helper function to get active styles based on tab
//   const getActiveStyles = (tabPath) => {
//     if (tabPath === '/') {
//       return 'bg-red-500 text-white font-semibold';
//     } else if (tabPath === '/layers/jobs') {
//       return 'bg-blue-500 text-white font-semibold';
//     } else if (tabPath === '/layers/city') {
//       return 'bg-emerald-500 text-white font-semibold';
//     }
//     return 'bg-red-500 text-white font-semibold';
//   };

//   // Helper function to get mobile active styles based on tab
//   const getMobileActiveStyles = (tabPath) => {
//     if (tabPath === '/') {
//       return 'bg-red-500/80 rounded-full text-white font-medium';
//     } else if (tabPath === '/layers/jobs') {
//       return 'bg-blue-500/80 rounded-full text-white font-medium';
//     } else if (tabPath === '/layers/city') {
//       return 'bg-emerald-500/80 rounded-full text-white font-medium';
//     }
//     return 'bg-red-500/80 rounded-full text-white font-medium';
//   };

//   return (
//     <div className="fixed bottom-0 left-0 right-0 flex justify-center pb-2 md:pb-4 z-10">
//       {/* Desktop view - wider nav */}
//       <div className="hidden md:flex bg-slate-800/90 shadow-lg rounded-full items-center justify-around px-6 h-16 w-full max-w-4xl mx-8">
//         {tabs.map((tab) => (
//           <button
//             key={tab.path}
//             className={`flex items-center justify-center px-5 py-2 rounded-full transition-colors duration-200 ${
//               isTabActive(tab.path)
//                 ? getActiveStyles(tab.path)
//                 : 'text-white hover:bg-white/20'
//             }`}
//             onClick={() => handleTabClick(tab.path)}
//           >
//             <span className="text-sm font-medium">{tab.name}</span>
//           </button>
//         ))}
//       </div>
      
//       {/* Mobile view - updated to match desktop style without icons */}
//       <div className="flex md:hidden bg-slate-800/90 shadow-lg rounded-full items-center justify-around h-14 w-full max-w-xl mx-2">
//         {tabs.map((tab) => (
//           <button
//             key={tab.path}
//             className={`flex flex-col items-center justify-center px-3 ${
//               isTabActive(tab.path)
//                 ? getMobileActiveStyles(tab.path)
//                 : 'text-white/80 hover:text-white'
//             }`}
//             onClick={() => handleTabClick(tab.path)}
//           >
//             <div className="flex flex-col items-center justify-center py-1">
//               <span className="text-xs leading-tight">{tab.displayName[0]}</span>
//               {tab.displayName[1] && (
//                 <span className="text-xs leading-tight">{tab.displayName[1]}</span>
//               )}
//             </div>
//           </button>
//         ))}
//       </div>
//     </div>
//   );
// }

/* v2 ---------------============================---------------==== */
// "use client";

// import { useEffect, useState } from 'react';
// import { useRouter, usePathname } from 'next/navigation';

// export default function BottomNavigation() {
//   const router = useRouter();
//   const pathname = usePathname();
//   const [followedItems, setFollowedItems] = useState({ pages: [], layers: [] });
//   const [loading, setLoading] = useState(true);
//   const [activeTab, setActiveTab] = useState('');

//   // Fetch user's followed pages and layers
//   useEffect(() => {
//     const fetchFollowedItems = async () => {
//       try {
//         const response = await fetch('/api/user/follows');
//         if (response.ok) {
//           const data = await response.json();
//           setFollowedItems(data);
//         }
//       } catch (error) {
//         console.error('Error fetching followed items:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchFollowedItems();
//   }, []);

//   // Create tabs array from followed items
//   const tabs = [
//     ...followedItems.layers.map(layer => ({
//       id: layer.id,
//       name: layer.name,
//       path: `/layers/${layer.id}`,
//       type: 'layer',
//       displayName: layer.name.length > 8 ? [layer.name.substring(0, 8)] : [layer.name]
//     })),
//     ...followedItems.pages.map(page => ({
//       id: page.id,
//       name: page.name,
//       path: `/page/${page.id}`,
//       type: 'page',
//       displayName: page.name.length > 8 ? [page.name.substring(0, 8)] : [page.name]
//     }))
//   ];

//   // Function to determine active tab based on current path
//   function getActiveTabFromPath(path, tabs) {
//     const matchingTab = tabs.find(tab => path === tab.path || path.startsWith(tab.path + '/'));
//     return matchingTab ? matchingTab.path : '';
//   }

//   // Update active tab when pathname changes or tabs change
//   useEffect(() => {
//     if (tabs.length > 0) {
//       setActiveTab(getActiveTabFromPath(pathname, tabs));
//     }
//   }, [pathname, tabs]);

//   const handleTabClick = (path) => {
//     setActiveTab(path);
//     router.push(path);
//   };

//   // Helper function to check if a tab is active
//   const isTabActive = (tabPath) => {
//     return pathname === tabPath || pathname.startsWith(tabPath + '/');
//   };

//   // Helper function to get subtle active styles based on tab type
//   const getActiveStyles = (tabType) => {
//     if (tabType === 'layer') {
//       return 'bg-blue-100 text-blue-700 font-medium border border-blue-200';
//     } else if (tabType === 'page') {
//       return 'bg-green-100 text-green-700 font-medium border border-green-200';
//     }
//     return 'bg-gray-100 text-gray-700 font-medium border border-gray-200';
//   };

//   // Helper function to get mobile active styles based on tab type
//   const getMobileActiveStyles = (tabType) => {
//     if (tabType === 'layer') {
//       return 'bg-blue-50 text-blue-600 font-medium rounded-lg border border-blue-200';
//     } else if (tabType === 'page') {
//       return 'bg-green-50 text-green-600 font-medium rounded-lg border border-green-200';
//     }
//     return 'bg-gray-50 text-gray-600 font-medium rounded-lg border border-gray-200';
//   };

//   // Show loading state or empty state
//   if (loading) {
//     return (
//       <div className="fixed bottom-0 left-0 right-0 flex justify-center pb-2 md:pb-4 z-10">
//         <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-full border border-gray-200 px-6 h-14 md:h-16 flex items-center">
//           <div className="text-gray-500 text-sm">Loading...</div>
//         </div>
//       </div>
//     );
//   }

//   if (tabs.length === 0) {
//     return (
//       <div className="fixed bottom-0 left-0 right-0 flex justify-center pb-2 md:pb-4 z-10">
//         <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-full border border-gray-200 px-6 h-14 md:h-16 flex items-center">
//           <div className="text-gray-500 text-sm">No followed items</div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="fixed bottom-0 left-0 right-0 flex justify-center pb-2 md:pb-4 z-10">
//       {/* Desktop view */}
//       <div className="hidden md:flex bg-white/90 backdrop-blur-sm shadow-lg rounded-full border border-gray-200 items-center justify-around px-4 h-16 w-full max-w-2xl mx-8">
//         {tabs.map((tab) => (
//           <button
//             key={`${tab.type}-${tab.id}`}
//             className={`flex items-center justify-center px-6 py-2 rounded-full transition-all duration-200 ${
//               isTabActive(tab.path)
//                 ? getActiveStyles(tab.type)
//                 : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
//             }`}
//             onClick={() => handleTabClick(tab.path)}
//           >
//             <span className="text-sm font-medium">{tab.name}</span>
//           </button>
//         ))}
//       </div>
      
//       {/* Mobile view */}
//       <div className="flex md:hidden bg-white/90 backdrop-blur-sm shadow-lg rounded-full border border-gray-200 items-center justify-around h-14 w-full max-w-sm mx-4">
//         {tabs.map((tab) => (
//           <button
//             key={`${tab.type}-${tab.id}`}
//             className={`flex flex-col items-center justify-center px-2 py-2 transition-all duration-200 ${
//               isTabActive(tab.path)
//                 ? getMobileActiveStyles(tab.type)
//                 : 'text-gray-500 hover:text-gray-700'
//             }`}
//             onClick={() => handleTabClick(tab.path)}
//           >
//             <div className="flex flex-col items-center justify-center">
//               {tab.displayName.map((line, index) => (
//                 <span key={index} className="text-xs leading-tight">
//                   {line}
//                 </span>
//               ))}
//             </div>
//           </button>
//         ))}
//       </div>
//     </div>
//   );
// }

// v3 my fav -------------------=====================------------------============

// "use client";

// import { useEffect, useState } from 'react';
// import { useRouter, usePathname } from 'next/navigation';
// import { Settings, X, Search, Plus, GripVertical, Layers, FileText } from 'lucide-react';

// export default function BottomNavigation() {
//   const router = useRouter();
//   const pathname = usePathname();
//   const [bottomBarItems, setBottomBarItems] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [showSettings, setShowSettings] = useState(false);
//   const [showEditModal, setShowEditModal] = useState(false);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [searchResults, setSearchResults] = useState([]);
//   const [isSearching, setIsSearching] = useState(false);
//   const [searchFilter, setSearchFilter] = useState('all');
//   const [editingItems, setEditingItems] = useState([]);

//   // Fetch user's bottom bar configuration
//   useEffect(() => {
//     const fetchBottomBarItems = async () => {
//       try {
//         const response = await fetch('/api/user/bottom-bar');
//         if (response.ok) {
//           const data = await response.json();
//           setBottomBarItems(data.items || []);
//         }
//       } catch (error) {
//         console.error('Error fetching bottom bar items:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchBottomBarItems();
//   }, []);

//   // Handle search
//   const handleSearch = async () => {
//     if (!searchQuery.trim()) return;

//     setIsSearching(true);
//     try {
//       const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&filter=${searchFilter}`);
//       if (response.ok) {
//         const results = await response.json();
//         setSearchResults(results);
//       }
//     } catch (error) {
//       console.error('Error searching:', error);
//     } finally {
//       setIsSearching(false);
//     }
//   };

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
//   }, [searchQuery, searchFilter]);

//   // Handle adding item to bottom bar
//   const handleAddToBottomBar = (item) => {
//     if (editingItems.length >= 5) {
//       alert('Maximum 5 items allowed in bottom bar');
//       return;
//     }

//     const newItem = {
//       id: item.id,
//       name: item.name,
//       type: item.itemType,
//       path: item.itemType === 'page' ? `/page/${item.id}` : `/layers/${item.id}`,
//       profile_pic_url: item.profile_pic_url || null
//     };

//     // Check if item already exists
//     if (!editingItems.find(existingItem => existingItem.id === newItem.id && existingItem.type === newItem.type)) {
//       setEditingItems([...editingItems, newItem]);
//     }
//     setSearchQuery('');
//     setSearchResults([]);
//   };

//   // Handle removing item from editing list
//   const handleRemoveFromEdit = (index) => {
//     setEditingItems(editingItems.filter((_, i) => i !== index));
//   };

//   // Handle reordering items
//   const handleReorder = (fromIndex, toIndex) => {
//     const newItems = [...editingItems];
//     const [removed] = newItems.splice(fromIndex, 1);
//     newItems.splice(toIndex, 0, removed);
//     setEditingItems(newItems);
//   };

//   // Save bottom bar configuration
//   const handleSaveBottomBar = async () => {
//     try {
//       const response = await fetch('/api/user/bottom-bar', {
//         method: 'PUT',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ items: editingItems }),
//       });

//       if (response.ok) {
//         setBottomBarItems(editingItems);
//         setShowEditModal(false);
//         setEditingItems([]);
//       }
//     } catch (error) {
//       console.error('Error saving bottom bar:', error);
//     }
//   };

//   // Open edit modal
//   const handleEditBottomBar = () => {
//     setEditingItems([...bottomBarItems]);
//     setShowEditModal(true);
//     setShowSettings(false);
//   };

//   // Get item icon
//   const getItemIcon = (type) => {
//     return type === 'page' ? FileText : Layers;
//   };

//   // Get item styles
//   const getItemStyles = (type, isActive = false) => {
//     if (type === 'page') {
//       return isActive 
//         ? 'bg-blue-100 text-blue-700 border-blue-200' 
//         : 'text-blue-600 hover:bg-blue-50';
//     } else {
//       return isActive 
//         ? 'bg-purple-100 text-purple-700 border-purple-200' 
//         : 'text-purple-600 hover:bg-purple-50';
//     }
//   };

//   // Check if tab is active
//   const isTabActive = (tabPath) => {
//     return pathname === tabPath || pathname.startsWith(tabPath + '/');
//   };

//   // Get initials for avatar
//   const getInitials = (name) => {
//     return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
//   };

//   if (loading) {
//     return (
//       <div className="fixed bottom-0 left-0 right-0 flex justify-center pb-2 md:pb-4 z-10">
//         <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-full border border-gray-200 px-6 h-14 md:h-16 flex items-center">
//           <div className="text-gray-500 text-sm">Loading...</div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <>
//     <div className="fixed bottom-0 left-0 right-0 flex justify-center pb-2 md:pb-4 z-10">
//     {/* Desktop view */}
//     <div 
//         className={`hidden md:flex bg-white/90 backdrop-blur-sm shadow-lg rounded-full border border-gray-200 items-center px-3 h-16 mx-8 ${
//         bottomBarItems.length <= 2 ? 'w-80' : 
//         bottomBarItems.length === 3 ? 'w-96' : 
//         bottomBarItems.length === 4 ? 'w-[36rem]' : 
//         'w-full max-w-3xl'
//         }`}
//     >
//         <div className="flex items-center justify-between w-full">
//         <div className="flex items-center space-x-2 flex-1">
//             {bottomBarItems.map((item, index) => {
//             const Icon = getItemIcon(item.type);
//             const isActive = isTabActive(item.path);
            
//             return (
//                 <button
//                 key={`${item.type}-${item.id}`}
//                 className={`flex items-center justify-center px-3 py-2 rounded-full transition-all duration-200 border flex-1 max-w-[200px] ${
//                     isActive
//                     ? getItemStyles(item.type, true)
//                     : getItemStyles(item.type, false) + ' border-transparent hover:border-gray-200'
//                 }`}
//                 onClick={() => router.push(item.path)}
//                 >
//                 <div className="flex items-center space-x-2">
//                     {item.profile_pic_url ? (
//                     <img 
//                         src={item.profile_pic_url} 
//                         alt={item.name} 
//                         className="w-5 h-5 rounded-full object-cover flex-shrink-0"
//                     />
//                     ) : (
//                     <Icon className="w-4 h-4 flex-shrink-0" />
//                     )}
//                     <span className="text-sm font-medium truncate">{item.name}</span>
//                 </div>
//                 </button>
//             );
//             })}
//         </div>
        
//         {/* Settings button */}
//         <div className="relative ml-3 flex-shrink-0">
//             <button
//             onClick={() => setShowSettings(!showSettings)}
//             className="flex items-center justify-center w-10 h-10 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
//             >
//             <Settings className="w-4 h-4" />
//             </button>
            
//             {showSettings && (
//             <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px]">
//                 <button
//                 onClick={handleEditBottomBar}
//                 className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
//                 >
//                 Customize Quick Access
//                 </button>
//             </div>
//             )}
//         </div>
//         </div>
//     </div>
    
//     {/* Mobile view */}
//     <div className="flex md:hidden bg-white/90 backdrop-blur-sm shadow-lg rounded-full border border-gray-200 items-center h-12 w-full max-w-sm mx-4 px-1.5 relative">
//         <div className="flex items-center justify-between w-full">
//         <div className="flex items-center flex-1 min-w-0">
//             {bottomBarItems.map((item, index) => {
//             const Icon = getItemIcon(item.type);
//             const isActive = isTabActive(item.path);
            
//             return (
//                 <button
//                 key={`${item.type}-${item.id}`}
//                 className={`flex flex-col items-center justify-center px-1 py-1 rounded-lg transition-all duration-200 flex-1 min-w-0 ${
//                     isActive ? getItemStyles(item.type, true) : getItemStyles(item.type, false)
//                 }`}
//                 onClick={() => router.push(item.path)}
//                 >
//                 {item.profile_pic_url ? (
//                     <img 
//                     src={item.profile_pic_url} 
//                     alt={item.name} 
//                     className="w-3.5 h-3.5 rounded-full object-cover mb-0.5 flex-shrink-0"
//                     />
//                 ) : (
//                     <Icon className="w-3 h-3 mb-0.5 flex-shrink-0" />
//                 )}
//                 <span className={`leading-tight truncate w-full text-center ${
//                     bottomBarItems.length <= 3 ? 'text-xs' : 'text-[10px]'
//                 }`}>
//                     {bottomBarItems.length <= 3 
//                     ? (item.name.length > 8 ? item.name.substring(0, 8) + '...' : item.name)
//                     : (item.name.length > 5 ? item.name.substring(0, 5) + '...' : item.name)
//                     }
//                 </span>
//                 </button>
//             );
//             })}
//         </div>
        
//         {/* Settings button for mobile */}
//         <button
//             onClick={() => setShowSettings(!showSettings)}
//             className="flex items-center justify-center w-7 h-7 rounded-full text-gray-500 ml-1 flex-shrink-0"
//         >
//             <Settings className="w-3 h-3" />
//         </button>
//         </div>
        
//         {showSettings && (
//         <div className="absolute bottom-full right-1.5 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[120px]">
//             <button
//             onClick={handleEditBottomBar}
//             className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50"
//             >
//             Customize
//             </button>
//         </div>
//         )}
//     </div>
//     </div>

//       {/* Edit Modal */}
//       {showEditModal && (
//         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
//           <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
//             {/* Header */}
//             <div className="flex items-center justify-between p-6 border-b border-gray-200">
//               <h2 className="text-xl font-semibold text-gray-900">Customize Quick Access</h2>
//               <button
//                 onClick={() => {
//                   setShowEditModal(false);
//                   setEditingItems([]);
//                   setSearchQuery('');
//                   setSearchResults([]);
//                 }}
//                 className="text-gray-400 hover:text-gray-600 transition-colors"
//               >
//                 <X className="w-5 h-5" />
//               </button>
//             </div>

//             <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
//               {/* Search Section */}
//               <div className="mb-6">
//                 <label className="block text-sm font-medium text-gray-700 mb-3">
//                   Add Pages or Layers ({editingItems.length}/5)
//                 </label>
                
//                 <div className="flex space-x-2 mb-3">
//                   <div className="relative flex-1">
//                     <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
//                     <input
//                       type="text"
//                       placeholder="Search pages and layers..."
//                       value={searchQuery}
//                       onChange={(e) => setSearchQuery(e.target.value)}
//                       className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     />
//                   </div>
//                   <select
//                     value={searchFilter}
//                     onChange={(e) => setSearchFilter(e.target.value)}
//                     className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   >
//                     <option value="all">All</option>
//                     <option value="pages">Pages</option>
//                     <option value="layers">Layers</option>
//                   </select>
//                 </div>

//                 {/* Search Results */}
//                 {(searchResults.length > 0 || isSearching) && searchQuery && (
//                   <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
//                     {isSearching ? (
//                       <div className="p-4 text-center text-gray-500">Searching...</div>
//                     ) : (
//                       searchResults.map((result) => {
//                         const Icon = getItemIcon(result.itemType);
//                         const isAlreadyAdded = editingItems.find(
//                           item => item.id === result.id && item.type === result.itemType
//                         );
                        
//                         return (
//                           <div
//                             key={`${result.itemType}-${result.id}`}
//                             className="flex items-center justify-between p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
//                           >
//                             <div className="flex items-center space-x-3">
//                               {result.profile_pic_url ? (
//                                 <img
//                                   src={result.profile_pic_url}
//                                   alt={result.name}
//                                   className="w-8 h-8 rounded-full object-cover"
//                                 />
//                               ) : (
//                                 <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
//                                   result.itemType === 'page' 
//                                     ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
//                                     : 'bg-gradient-to-br from-purple-500 to-purple-600'
//                                 }`}>
//                                   <Icon className="w-4 h-4" />
//                                 </div>
//                               )}
//                               <div>
//                                 <p className="font-medium text-gray-900">{result.name}</p>
//                                 <p className={`text-xs capitalize ${
//                                   result.itemType === 'page' ? 'text-blue-600' : 'text-purple-600'
//                                 }`}>
//                                   {result.itemType}
//                                 </p>
//                               </div>
//                             </div>
//                             <button
//                               onClick={() => handleAddToBottomBar(result)}
//                               disabled={isAlreadyAdded || editingItems.length >= 5}
//                               className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
//                                 isAlreadyAdded 
//                                   ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
//                                   : editingItems.length >= 5
//                                     ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
//                                     : 'bg-blue-600 text-white hover:bg-blue-700'
//                               }`}
//                             >
//                               {isAlreadyAdded ? 'Added' : 'Add'}
//                             </button>
//                           </div>
//                         );
//                       })
//                     )}
//                   </div>
//                 )}
//               </div>

//               {/* Current Items */}
//               <div className="mb-6">
//                 <label className="block text-sm font-medium text-gray-700 mb-3">
//                   Quick Access Items
//                 </label>
                
//                 {editingItems.length === 0 ? (
//                   <div className="text-center py-8 text-gray-500">
//                     <Plus className="w-8 h-8 mx-auto mb-2 text-gray-300" />
//                     <p>No items added yet</p>
//                     <p className="text-sm">Search and add pages or layers above</p>
//                   </div>
//                 ) : (
//                   <div className="space-y-2">
//                     {editingItems.map((item, index) => {
//                       const Icon = getItemIcon(item.type);
                      
//                       return (
//                         <div
//                           key={`editing-${item.type}-${item.id}-${index}`}
//                           className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
//                         >
//                           <div className="flex items-center space-x-3">
//                             <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
//                             {item.profile_pic_url ? (
//                               <img
//                                 src={item.profile_pic_url}
//                                 alt={item.name}
//                                 className="w-8 h-8 rounded-full object-cover"
//                               />
//                             ) : (
//                               <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
//                                 item.type === 'page' 
//                                   ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
//                                   : 'bg-gradient-to-br from-purple-500 to-purple-600'
//                               }`}>
//                                 <Icon className="w-4 h-4" />
//                               </div>
//                             )}
//                             <div>
//                               <p className="font-medium text-gray-900">{item.name}</p>
//                               <p className={`text-xs capitalize ${
//                                 item.type === 'page' ? 'text-blue-600' : 'text-purple-600'
//                               }`}>
//                                 {item.type}
//                               </p>
//                             </div>
//                           </div>
//                           <button
//                             onClick={() => handleRemoveFromEdit(index)}
//                             className="text-red-500 hover:text-red-700 transition-colors"
//                           >
//                             <X className="w-4 h-4" />
//                           </button>
//                         </div>
//                       );
//                     })}
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* Footer */}
//             <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
//               <button
//                 onClick={() => {
//                   setShowEditModal(false);
//                   setEditingItems([]);
//                   setSearchQuery('');
//                   setSearchResults([]);
//                 }}
//                 className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleSaveBottomBar}
//                 disabled={editingItems.length === 0}
//                 className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
//               >
//                 Save Changes
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
      
//       {/* Overlay to close settings */}
//       {showSettings && (
//         <div 
//           className="fixed inset-0 z-5" 
//           onClick={() => setShowSettings(false)}
//         />
//       )}
//     </>
//   );
// }