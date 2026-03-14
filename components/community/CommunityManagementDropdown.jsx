import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  UserPlus, 
  Plus, 
  X, 
  Check, 
  Search,
  ChevronDown,
  Loader2,
  CheckCircle2,
  Lock,
  Globe,
  Clock,
  AlertCircle,
  Share2,
  MessageCircle,
  Copy,
  Facebook,
  Twitter
} from 'lucide-react';
import SearchAddCommunityButton from './SearchAddCommunityButton';


// Community Invite Modal (Updated from your existing one)
const CommunityInviteModal = ({ isOpen, onClose, community }) => {
  const [copied, setCopied] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  useEffect(() => {
    if (community?.invite_code) {
      setInviteLink(`${window.location.origin}/communities/invite/${community.invite_code}`);
    }
  }, [community]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(`Join our community "${community.name}" on our platform! ${inviteLink}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareToFacebook = () => {
    const url = encodeURIComponent(inviteLink);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent(`Join our community "${community.name}"!`);
    const url = encodeURIComponent(inviteLink);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Share2 className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Invite Members</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              {community?.image_url ? (
                <img src={community.image_url} alt={community.name} className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <Users className="w-8 h-8 text-blue-600" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{community?.name}</h3>
            <p className="text-sm text-gray-600">Share this link to invite others</p>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Invite Link
            </h4>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-700"
              />
              <button
                onClick={handleCopyLink}
                className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  copied 
                    ? 'bg-green-100 text-green-700 border border-green-200' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span className="hidden sm:inline">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span className="hidden sm:inline">Copy</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={shareToWhatsApp}
                className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="hidden sm:inline">WhatsApp</span>
                <span className="sm:hidden">WA</span>
              </button>
              <button
                onClick={shareToFacebook}
                className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors"
              >
                <Facebook className="w-4 h-4" />
                <span className="hidden sm:inline">Facebook</span>
                <span className="sm:hidden">FB</span>
              </button>
              <button
                onClick={shareToTwitter}
                className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors"
              >
                <Twitter className="w-4 h-4" />
                <span className="hidden sm:inline">Twitter</span>
                <span className="sm:hidden">X</span>
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Request Approval Modal
const RequestApprovalModal = ({ isOpen, onClose, community }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    if (isOpen && community?.id) {
      fetchRequests();
    }
  }, [isOpen, community?.id]);

  const fetchRequests = async () => {
    if (!community?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/communities/${community.id}/requests`);
      const data = await response.json();
      if (response.ok) {
        setRequests(data.requests || []);
      } else {
        console.error('Failed to fetch requests:', data.message);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (requestId, action) => {
    setActionLoading(prev => ({ ...prev, [requestId]: true }));
    
    try {
      const response = await fetch(`/api/communities/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      const data = await response.json();
      
      if (response.ok) {
        setRequests(prev => prev.filter(req => req.id !== requestId));
        // You can add a toast notification here
      } else {
        console.error('Failed to process request:', data.message);
      }
    } catch (error) {
      console.error('Error handling request:', error);
    } finally {
      setActionLoading(prev => ({ ...prev, [requestId]: false }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-orange-600" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Join Requests</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No pending requests</p>
              <p className="text-sm text-gray-500 mt-1">When users request to join, they&apos;ll appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <div key={request.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        {request.user?.profile_picture ? (
                          <img 
                            src={request.user.profile_picture} 
                            alt={request.user.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <Users className="w-5 h-5 text-gray-600" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-gray-900 truncate text-sm sm:text-base">
                          {request.user?.name || 'Unknown User'}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">
                          {request.user?.email || 'No email'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(request.followed_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleRequestAction(request.id, 'approve')}
                        disabled={actionLoading[request.id]}
                        className="px-2 sm:px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        <span className="hidden sm:inline">Approve</span>
                      </button>
                      <button
                        onClick={() => handleRequestAction(request.id, 'reject')}
                        disabled={actionLoading[request.id]}
                        className="px-2 sm:px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        <span className="hidden sm:inline">Reject</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Community Management Dropdown Component
const CommunityManagementDropdown = ({ 
  selectedCommunity, 
  userIsAdmin = false,
  onCreateCommunity, // Your existing create modal trigger: () => setIsModalOpen(true)
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [adminStatus, setAdminStatus] = useState(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Check admin status when selected community changes
  useEffect(() => {
    if (selectedCommunity?.id) {
      checkAdminStatus();
    }
  }, [selectedCommunity?.id]);

  useEffect(() => {
    if (selectedCommunity?.id) {
      checkAdminStatus();
    }
  }, [selectedCommunity?.id]);

  const checkAdminStatus = async () => {
    if (!selectedCommunity?.id) return;
    
    try {
      const response = await fetch(`/api/communities/${selectedCommunity.id}/admin-check`);
      const data = await response.json();
      
      if (response.ok) {
        setAdminStatus(data);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const toggleDropdown = () => setIsOpen(!isOpen);

  const isUserAdmin = userIsAdmin || adminStatus?.canManageRequests;

  return (
    <>
      <div className={`relative ${className}`}>
        <button 
          onClick={toggleDropdown}
          className="px-2 py-1 sm:px-3 sm:py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs sm:text-sm font-medium shadow-sm flex items-center gap-1 sm:gap-2"
        >
          <span className="sm:inline">Community</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            
            <div className="absolute top-full right-0 mt-1 w-48 sm:w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="py-1">
                <button
                  onClick={() => {
                    onCreateCommunity();
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                >
                  <Plus className="w-4 h-4 text-green-600" />
                  <span>Create Community</span>
                </button>
                
                <button
                  onClick={() => {
                    setIsSearchModalOpen(true);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                >
                  <Search className="w-4 h-4 text-blue-600" />
                  <span>Search & Add Community</span>
                </button>
                
                {isUserAdmin && selectedCommunity && (
                  <>
                    <div className="border-t border-gray-100 my-1" />
                    <div className="px-3 py-2">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Admin Options
                      </p>
                    </div>
                    
                    <button
                      onClick={() => {
                        setIsRequestModalOpen(true);
                        setIsOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                    >
                      <UserCheck className="w-4 h-4 text-orange-600" />
                      <span>View Requests</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setIsInviteModalOpen(true);
                        setIsOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                    >
                      <UserPlus className="w-4 h-4 text-blue-600" />
                      <span>Invite Members</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>


      <SearchAddCommunityButton
        isModalOpen={isSearchModalOpen} 
        setIsModalOpen={setIsSearchModalOpen}
      />


      {/* Other Modals */}
      <RequestApprovalModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        community={selectedCommunity}
      />

      <CommunityInviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        community={selectedCommunity}
      />
    </>
  );
};

export default CommunityManagementDropdown;