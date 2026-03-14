// 'use client';

// import { useEffect, useState } from 'react';
// import { Heart, HeartOff, UserPlus, Users, Check, Clock } from 'lucide-react';

// export default function ModernTopBar({ type, id, currentUserId }) {
//   const [data, setData] = useState(null);
//   const [isFollowing, setIsFollowing] = useState(false);
//   const [followersCount, setFollowersCount] = useState(0);
//   const [isLoading, setIsLoading] = useState(true);

//   // Friend request related states
//   const [friendStatus, setFriendStatus] = useState('none'); // none, pending, friends, sent
//   // const [friendStatus, setFriendStatus] = useState(null); // 'none', 'pending', 'friends', 'sent'
//   const [friendRequestsCount, setFriendRequestsCount] = useState(0);
//   const [showRequestModal, setShowRequestModal] = useState(false);
//   const [showFriendsModal, setShowFriendsModal] = useState(false);
//   const [friendRequests, setFriendRequests] = useState([]);
//   const [loadingRequests, setLoadingRequests] = useState(false);

//   const isPage = type === 'page';
//   const isProfile = type === 'profile';
//   const isOwner = (isPage && currentUserId == id) || (isProfile && currentUserId == id);

//   console.log('isOwner', isOwner)
//   // Color themes for different entity types
//   const themes = {
//     page: {
//       bg: 'bg-gradient-to-r from-amber-400 to-orange-500',
//       bgLight: 'bg-gradient-to-r from-amber-50 to-orange-50',
//       text: 'text-white',
//       textDark: 'text-amber-900',
//       badge: 'bg-white/20 text-white border-white/30',
//       followBtn: 'bg-white text-amber-600 hover:bg-amber-50',
//       accent: 'text-amber-600'
//     },
//     profile: {
//       bg: 'bg-gradient-to-r from-blue-500 to-indigo-600',
//       bgLight: 'bg-gradient-to-r from-blue-50 to-indigo-50',
//       text: 'text-white',
//       textDark: 'text-blue-900',
//       badge: 'bg-white/20 text-white border-white/30',
//       followBtn: 'bg-white text-blue-600 hover:bg-blue-50',
//       accent: 'text-blue-600'
//     },
//     layer: {
//       bg: 'bg-gradient-to-r from-red-500 to-pink-600',
//       bgLight: 'bg-gradient-to-r from-red-50 to-pink-50',
//       text: 'text-white',
//       textDark: 'text-red-900',
//       badge: 'bg-white/20 text-white border-white/30',
//       followBtn: 'bg-white text-red-600 hover:bg-red-50',
//       accent: 'text-red-600'
//     },
//     community: {
//       bg: 'bg-gradient-to-r from-purple-500 to-violet-600',
//       bgLight: 'bg-gradient-to-r from-purple-50 to-violet-50',
//       text: 'text-white',
//       textDark: 'text-purple-900',
//       badge: 'bg-white/20 text-white border-white/30',
//       followBtn: 'bg-white text-purple-600 hover:bg-purple-50',
//       accent: 'text-purple-600'
//     }
//   };

//   const currentTheme = themes[type];

//   useEffect(() => {
//     fetchData();
//     if ((!isOwner && isPage) || type === 'layer') {
//       checkFollowStatus();
//     }
//     if (isProfile && !isOwner) {
//       checkFriendStatus();
//     }
//     if (isProfile) {
//       fetchFollowersCount();
//     } else {
//       fetchFollowersCount();
//     }
//     if (isProfile && isOwner) {
//       fetchFriendRequestsCount();
//     }
//   }, [id, type, currentUserId]);
  

//   const fetchData = async () => {
//     try {
//       const endpoint = isProfile ? `/api/profile/${id}` : `/api/${type}/${id}`;
//       const response = await fetch(endpoint);
//       if (response.ok) {
//         const result = await response.json();
//         setData(result);
//       }
//     } catch (error) {
//       console.error('Error fetching data:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const checkFollowStatus = async () => {
//     try {
//       const response = await fetch(`/api/follow/${type}/${id}/status`);
//       if (response.ok) {
//         const result = await response.json();
//         setIsFollowing(result.isFollowing);
//       }
//     } catch (error) {
//       console.error('Error checking follow status:', error);
//     }
//   };

//   const checkFriendStatus = async () => {
//     try {
//       const response = await fetch(`/api/friends/${id}/status`);
//       if (response.ok) {
//         const result = await response.json();
//         setFriendStatus(result.status);
//       }
//     } catch (error) {
//       console.error('Error checking friend status:', error);
//     }
//   };

//   const fetchFollowersCount = async () => {
//     try {
//       const endpoint = isProfile ? `/api/friends/${id}/count` : `/api/follow/${type}/${id}/count`;
//       const response = await fetch(endpoint);
//       if (response.ok) {
//         const result = await response.json();
//         setFollowersCount(result.count);
//       }
//     } catch (error) {
//       console.error('Error fetching followers count:', error);
//     }
//   };

//   const fetchFriendRequestsCount = async () => {
//     try {
//       const response = await fetch(`/api/friends/requests/count`);
//       if (response.ok) {
//         const result = await response.json();
//         setFriendRequestsCount(result.count);
//       }
//     } catch (error) {
//       console.error('Error fetching friend requests count:', error);
//     }
//   };

//   const fetchFriendRequests = async () => {
//     setLoadingRequests(true);
//     try {
//       const response = await fetch(`/api/friends/requests`);
//       if (response.ok) {
//         const result = await response.json();
//         setFriendRequests(result);
//       }
//     } catch (error) {
//       console.error('Error fetching friend requests:', error);
//     } finally {
//       setLoadingRequests(false);
//     }
//   };

//   const handleFollow = async () => {
//     try {
//       const method = isFollowing ? 'DELETE' : 'POST';
//       const response = await fetch(`/api/follow/${type}/${id}`, {
//         method,
//         headers: {
//           'Content-Type': 'application/json',
//         },
//       });

//       if (response.ok) {
//         setIsFollowing(!isFollowing);
//         setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1);
//       }
//     } catch (error) {
//       console.error('Error toggling follow:', error);
//     }
//   };

//   const handleFriendRequest = async () => {
//     try {
//       getFriendButtonAction()
//       const response = await fetch(`/api/friends/request/${id}`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//       });

//       if (response.ok) {
//         setFriendStatus('sent');
//       }
//     } catch (error) {
//       console.error('Error sending friend request:', error);
//     }
//   };

//   const handleFriendRequestResponse = async (requestId, action) => {
//     try {
//       const response = await fetch(`/api/friends/requests/${requestId}`, {
//         method: 'PATCH',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ action }),
//       });

//       if (response.ok) {
//         // Refresh friend requests
//         fetchFriendRequests();
//         fetchFriendRequestsCount();
//       }
//     } catch (error) {
//       console.error('Error responding to friend request:', error);
//     }
//   };

//   const getInitials = (name) => {
//     return name?.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2) || '?';
//   };

//   const getFriendButtonAction = () => {
//     switch (friendStatus) {
//       case 'pending':
//         return () => handleFriendRequestResponse(id, 'accept');
//       case 'friends':
//       case 'sent':
//         return null; // No action for these states
//       default:
//         return handleFriendRequest;
//     }
//   };


//   const getFriendButtonText = () => {
//     switch (friendStatus) {
//       case 'friends': return 'Friends';
//       case 'sent': return 'Request Sent';
//       case 'pending': return 'Accept Request';
//       default: return 'Add Friend';
//     }
//   };

//   const getFriendButtonIcon = () => {
//     switch (friendStatus) {
//       case 'friends': return <Check className="w-4 h-4" />;
//       case 'sent': return <Clock className="w-4 h-4" />;
//       case 'pending': return <UserPlus className="w-4 h-4" />;
//       default: return <UserPlus className="w-4 h-4" />;
//     }
//   };

//   return (
//       <div className={`${currentTheme.bg} px-6 py-4`}>
//         <div className="flex items-center justify-between">
//           {/* Left Section - Profile Info */}
//           <div className="flex items-center space-x-4">
//             {/* Avatar */}
//             <div className="relative">
//               <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center overflow-hidden">
//                 {data?.avatar ? (
//                   <img 
//                     src={data.avatar} 
//                     alt={data.name}
//                     className="w-full h-full object-cover"
//                   />
//                 ) : (
//                   <span className={`text-xl font-bold ${currentTheme.text}`}>
//                     {getInitials(data?.name)}
//                   </span>
//                 )}
//               </div>
//             </div>

//             {/* Name and Info */}
//             <div className="flex flex-col">
//               <h1 className={`text-2xl font-bold ${currentTheme.text} mb-1`}>
//                 {data?.name}
//               </h1>
//               <span className={`${currentTheme.text} opacity-80 text-lg font-medium`}>
//                 {type === 'profile' && 'User'}
//               </span>
//             </div>
//           </div>

//           {/* Right Section - Action Buttons */}
//           <div className="flex items-center space-x-6">
//             {/* Followers Count */}
//             <div className="text-right">
//               <div className={`text-2xl font-bold ${currentTheme.text}`}>
//                 {data?.followers}
//               </div>
//               <div className={`${currentTheme.text} opacity-80 text-sm font-medium`}>
//                 {type === 'profile' ? 'Friends' : 'Followers'}
//               </div>
//             </div>

//             {/* Follow Button for Pages, Layers, Communities */}
//             {(type === 'page' || type === 'layer' || type === 'community') && isOwner && (
//               <button
//                 onClick={handleFollow}
//                 className={`px-8 py-3 rounded-full font-semibold transition-all duration-200 shadow-lg hover:shadow-xl ${
//                   isFollowing 
//                     ? 'bg-white/20 text-white border-2 border-white/30 hover:bg-white/30' 
//                     : currentTheme.followBtn
//                 }`}
//               >
//                 {isFollowing ? 'Following' : 'Follow'}
//               </button>
//             )}

//             {/* Friend Request Button for Users */}
//             {type === 'profile' && !isOwner && (
//               <button
//                 onClick={handleFriendRequest}
//                 disabled={friendStatus === 'sent' || friendStatus === 'friends'}
//                 className={`flex items-center space-x-2 px-6 py-3 rounded-full font-semibold transition-all duration-200 shadow-lg hover:shadow-xl ${
//                   friendStatus === 'sent' || friendStatus === 'friends'
//                     ? 'bg-white/20 text-white/70 cursor-not-allowed'
//                     : friendStatus === 'pending'  
//                     ? 'bg-green-500 text-white hover:bg-green-600'
//                     : currentTheme.followBtn
//                 }`}
//               >
//                 {getFriendButtonIcon()}
//                 <span>{getFriendButtonText()}</span>
//               </button>
//             )}

//             {/* Members Button for Communities */}
//             {type === 'community' && (
//               <button className={`flex items-center space-x-2 px-6 py-3 rounded-full font-semibold transition-all duration-200 shadow-lg hover:shadow-xl ${currentTheme.followBtn}`}>
//                 <Users className="w-5 h-5" />
//                 <span>Members</span>
//               </button>
//             )}
//           </div>
//         </div>
//       </div>
//   );
// }