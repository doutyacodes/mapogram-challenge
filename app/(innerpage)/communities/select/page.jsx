// "use client"
// import React, { useState, useEffect } from 'react';
// import { Users, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
// import RoleSelectionModal from '@/app/_components/RoleSelectionModal';

// export default function WelcomePage() {
//   const [communities, setCommunities] = useState([]);
//   const [selectedCommunities, setSelectedCommunities] = useState([]); // Now stores {communityId, roleId}
//   const [loading, setLoading] = useState(true);
//   const [submitting, setSubmitting] = useState(false);
//   const [error, setError] = useState('');
//   const [showRoleModal, setShowRoleModal] = useState(false);
//   const [selectedCommunityForRole, setSelectedCommunityForRole] = useState(null);

//   const baseUrl = 'https://wowfy.in/newsonmap/photos/'

//   useEffect(() => {
//     fetchCommunities();
//   }, []);

//   const fetchCommunities = async () => {
//     try {
//       const response = await fetch('/api/communities');
//       const data = await response.json();
      
//       if (data.success) {
//         setCommunities(data.communities);
//       } else {
//         setError('Failed to load communities');
//       }
//     } catch (err) {
//       setError('Failed to load communities');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCommunityClick = (community) => {
//     // Check if community is already selected
//     const isSelected = selectedCommunities.some(sc => sc.communityId === community.id);
    
//     if (isSelected) {
//       // Remove from selection
//       setSelectedCommunities(prev => 
//         prev.filter(sc => sc.communityId !== community.id)
//       );
//     } else {
//       // Open role selection modal
//       setSelectedCommunityForRole(community);
//       setShowRoleModal(true);
//     }
//   };

//   const handleRoleSelect = (communityId, roleId) => {
//     setSelectedCommunities(prev => [
//       ...prev,
//       { communityId, roleId }
//     ]);
//     setShowRoleModal(false);
//     setSelectedCommunityForRole(null);
//   };

//   const isCommunitySelected = (communityId) => {
//     return selectedCommunities.some(sc => sc.communityId === communityId);
//   };

//   const handleContinue = async () => {
//     if (selectedCommunities.length < 2) {
//       setError('Please select at least 2 communities to continue');
//       return;
//     }

//     setSubmitting(true);
//     setError('');

//     try {
//       const response = await fetch('/api/communities/follow', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           communities: selectedCommunities // Send array of {communityId, roleId}
//         })
//       });

//       const data = await response.json();

//       if (data.success) {
//         // Update localStorage token if it exists
//         if (data.token && typeof window !== 'undefined') {
//           localStorage.setItem('user_token', data.token);
//         }
        
//         // Redirect to home page
//         window.location.href = '/';
//       } else {
//         setError(data.message || 'Failed to follow communities');
//       }
//     } catch (err) {
//       setError('Something went wrong. Please try again.');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
//         <div className="text-center">
//           <Loader2 className="w-8 h-8 animate-spin text-red-800 mx-auto mb-4" />
//           <p className="text-red-700">Loading communities...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100">
//       <div className="container mx-auto px-4 py-8 max-w-4xl">
//         {/* Header */}
//         <div className="text-center mb-8">
//           <div className="bg-red-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
//             <Users className="w-8 h-8 text-white" />
//           </div>
//           <h1 className="text-3xl md:text-4xl font-bold text-red-900 mb-2">
//             Welcome to Our Community!
//           </h1>
//           <p className="text-red-700 text-lg mb-4">
//             Discover amazing communities and connect with like-minded people
//           </p>
//           <p className="text-red-600 text-sm">
//             Please select at least 2 communities to get started
//           </p>
//         </div>

//         {/* Error Message */}
//         {error && (
//           <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 text-center">
//             {error}
//           </div>
//         )}

//         {/* Communities Grid */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
//           {communities.map((community) => (
//             <div
//               key={community.id}
//               onClick={() => handleCommunityClick(community)}
//               className={`relative bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-105 border-2 ${
//                 isCommunitySelected(community.id)
//                   ? 'border-red-800 bg-red-50'
//                   : 'border-transparent hover:border-red-200'
//               }`}
//             >
//               {/* Selection Indicator */}
//               {isCommunitySelected(community.id) && (
//                 <div className="absolute top-3 right-3 z-10">
//                   <CheckCircle2 className="w-6 h-6 text-red-800 bg-white rounded-full" />
//                 </div>
//               )}

//               {/* Community Image */}
//               <div className="h-32 bg-gradient-to-r from-red-100 to-red-200 rounded-t-xl flex items-center justify-center overflow-hidden">
//                 {community.image_url ? (
//                   <img
//                     src={`${baseUrl}${community.image_url}`}
//                     alt={community.name}
//                     className="w-full h-full object-cover"
//                   />
//                 ) : (
//                   <Users className="w-12 h-12 text-red-800" />
//                 )}
//               </div>

//               {/* Community Info */}
//               <div className="p-4">
//                 <h3 className="font-semibold text-red-900 text-lg mb-2 line-clamp-1">
//                   {community.name}
//                 </h3>
//                 <p className="text-red-600 text-sm line-clamp-2">
//                   {community.description || 'Join this amazing community and connect with others!'}
//                 </p>
//               </div>
//             </div>
//           ))}
//         </div>

//         {/* Selection Counter */}
//         <div className="text-center mb-6">
//           <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md">
//             <span className="text-red-800 font-medium">
//               {selectedCommunities.length} selected
//             </span>
//             <span className="text-red-600 text-sm">
//               (minimum 2 required)
//             </span>
//           </div>
//         </div>

//         {/* Continue Button */}
//         <div className="text-center">
//           <button
//             onClick={handleContinue}
//             disabled={selectedCommunities.length < 2 || submitting}
//             className={`inline-flex items-center gap-2 px-8 py-3 rounded-full font-semibold text-white transition-all duration-300 ${
//               selectedCommunities.length >= 2 && !submitting
//                 ? 'bg-red-800 hover:bg-red-900 shadow-lg hover:shadow-xl transform hover:scale-105'
//                 : 'bg-red-400 cursor-not-allowed'
//             }`}
//           >
//             {submitting ? (
//               <>
//                 <Loader2 className="w-5 h-5 animate-spin" />
//                 Following Communities...
//               </>
//             ) : (
//               <>
//                 Continue to Home
//                 <ArrowRight className="w-5 h-5" />
//               </>
//             )}
//           </button>
//         </div>

//         {/* Footer */}
//         <div className="text-center mt-8 text-red-600 text-sm">
//           <p>You can always discover and follow more communities later!</p>
//         </div>
//       </div>

//       {/* Role Selection Modal */}
//       <RoleSelectionModal
//         isOpen={showRoleModal}
//         onClose={() => {
//           setShowRoleModal(false);
//           setSelectedCommunityForRole(null);
//         }}
//         community={selectedCommunityForRole}
//         onRoleSelect={handleRoleSelect}
//         baseUrl={baseUrl}
//       />
//     </div>
//   );
// }

"use client"
import React, { useState, useEffect } from 'react';
import { Users, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import RoleSelectionModal from '@/components/community/RoleSelectionModal';

export default function WelcomePage() {
  const [communities, setCommunities] = useState([]);
  const [selectedCommunities, setSelectedCommunities] = useState([]); // Now stores {communityId, roleId}
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedCommunityForRole, setSelectedCommunityForRole] = useState(null);

  const baseUrl = 'https://wowfy.in/newsonmap/photos/'

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    try {
      const response = await fetch('/api/communities');
      const data = await response.json();
      
      if (data.success) {
        setCommunities(data.communities);
      } else {
        setError('Failed to load communities');
      }
    } catch (err) {
      setError('Failed to load communities');
    } finally {
      setLoading(false);
    }
  };

  const handleCommunityClick = (community) => {
    // Check if community is already selected
    const isSelected = selectedCommunities.some(sc => sc.communityId === community.id);
    
    if (isSelected) {
      // Remove from selection
      setSelectedCommunities(prev => 
        prev.filter(sc => sc.communityId !== community.id)
      );
    } else {
      // Open role selection modal
      setSelectedCommunityForRole(community);
      setShowRoleModal(true);
    }
  };

  const handleRoleSelect = (communityId, roleId) => {
    setSelectedCommunities(prev => [
      ...prev,
      { communityId, roleId }
    ]);
    setShowRoleModal(false);
    setSelectedCommunityForRole(null);
  };

  const isCommunitySelected = (communityId) => {
    return selectedCommunities.some(sc => sc.communityId === communityId);
  };

  const handleContinue = async () => {
    if (selectedCommunities.length < 1) {
      setError('Please select at least 1 community to continue');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/communities/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          communities: selectedCommunities // Send array of {communityId, roleId}
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update localStorage token if it exists
        if (data.token && typeof window !== 'undefined') {
          localStorage.setItem('user_token', data.token);
        }
        
        // Redirect to home page
        window.location.href = '/communities';
      } else {
        setError(data.message || 'Failed to follow communities');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin text-indigo-400 mx-auto mb-3" />
          <p className="text-slate-300 text-sm md:text-base">Loading communities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-20 md:pb-8">
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 shadow-lg shadow-indigo-500/25">
            <Users className="w-6 h-6 md:w-8 md:h-8 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent mb-2">
            Discover Communities
          </h1>
          <p className="text-slate-300 text-base md:text-lg mb-3 md:mb-4 px-4">
            Find and join communities that match your interests
          </p>
          <p className="text-slate-400 text-xs md:text-sm">
            Select at least 1 community to continue
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2 md:px-4 md:py-3 rounded-lg mb-4 md:mb-6 text-center text-sm md:text-base backdrop-blur-sm">
            {error}
          </div>
        )}

        {/* Selection Counter - Fixed at top */}
        <div className="text-center mb-4 md:mb-6 sticky top-2 z-20">
          <div className="inline-flex items-center gap-2 bg-slate-800/80 backdrop-blur-sm px-3 py-1.5 md:px-4 md:py-2 rounded-full shadow-lg border border-slate-700/50">
            <span className="text-indigo-400 font-medium text-sm md:text-base">
              {selectedCommunities.length} selected
            </span>
            <span className="text-slate-400 text-xs md:text-sm">
              (min. 1 required)
            </span>
          </div>
        </div>

        {/* Communities Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-16 md:mb-8">
          {communities.map((community) => (
            <div
              key={community.id}
              onClick={() => handleCommunityClick(community)}
              className={`relative bg-slate-800/50 backdrop-blur-sm rounded-lg md:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 border ${
                isCommunitySelected(community.id)
                  ? 'border-indigo-500 bg-indigo-500/10 shadow-indigo-500/25'
                  : 'border-slate-700/50 hover:border-slate-600'
              }`}
            >
              {/* Selection Indicator */}
              {isCommunitySelected(community.id) && (
                <div className="absolute top-2 right-2 z-10">
                  <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-indigo-400 bg-slate-800 rounded-full shadow-lg" />
                </div>
              )}

              {/* Community Image */}
              <div className="h-24 md:h-32 bg-gradient-to-r from-slate-700 to-slate-600 rounded-t-lg md:rounded-t-xl flex items-center justify-center overflow-hidden">
                {community.image_url ? (
                  <img
                    src={`${baseUrl}${community.image_url}`}
                    alt={community.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Users className="w-8 h-8 md:w-12 md:h-12 text-slate-400" />
                )}
              </div>

              {/* Community Info */}
              <div className="p-3 md:p-4">
                <h3 className="font-semibold text-white text-sm md:text-lg mb-1 md:mb-2 line-clamp-1">
                  {community.name}
                </h3>
                <p className="text-slate-400 text-xs md:text-sm line-clamp-2">
                  {community.description || 'Join this amazing community and connect with others!'}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Fixed Bottom Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700/50 p-3 md:p-4 z-30 md:relative md:bg-transparent md:border-t-0 md:backdrop-blur-none">
          <div className="max-w-4xl mx-auto">
            {/* Continue Button */}
            <div className="text-center mb-2 md:mb-0">
              <button
                onClick={handleContinue}
                disabled={selectedCommunities.length < 1 || submitting}
                className={`inline-flex items-center gap-2 px-6 py-2.5 md:px-8 md:py-3 rounded-full font-semibold text-white transition-all duration-300 text-sm md:text-base ${
                  selectedCommunities.length >= 1 && !submitting
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl shadow-indigo-500/25 transform hover:scale-105'
                    : 'bg-slate-600 cursor-not-allowed'
                }`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                    <span className="hidden sm:inline">Following Communities...</span>
                    <span className="sm:hidden">Following...</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Continue to Communities</span>
                    <span className="sm:hidden">Continue</span>
                    <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                  </>
                )}
              </button>
            </div>

            {/* Footer - Only visible on desktop */}
            <div className="hidden md:block text-center mt-4 text-slate-400 text-sm">
              <p>You can discover and follow more communities anytime!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Role Selection Modal */}
      <RoleSelectionModal
        isOpen={showRoleModal}
        onClose={() => {
          setShowRoleModal(false);
          setSelectedCommunityForRole(null);
        }}
        community={selectedCommunityForRole}
        onRoleSelect={handleRoleSelect}
        baseUrl={baseUrl}
      />
    </div>
  );
}