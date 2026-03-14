"use client"
import React, { useState, useEffect, use } from 'react';
import { Users, Check, Clock, AlertCircle, ExternalLink, Image } from 'lucide-react';

const InvitePage = ({ params }) => {
  const { code:inviteCode } = use(params);
  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [alreadyMember, setAlreadyMember] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState(null); // 'approved', 'pending', 'invited', null

  useEffect(() => {
    if (inviteCode) {
      fetchCommunityInfo();
    }
  }, [inviteCode]);

  const fetchCommunityInfo = async () => {
    try {
      const response = await fetch(`/api/communities/invite/${inviteCode}`);
      const data = await response.json();

      if (response.ok) {
        setCommunity(data.community);
        // Check if user is already a member
        if (data.membershipStatus) {
          setMembershipStatus(data.membershipStatus);
          setAlreadyMember(true);
        }
      } else {
        setError(data.message || 'Invalid invite link');
      }
    } catch (error) {
      setError('Failed to load community information');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCommunity = async () => {
    setJoining(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/communities/invite/${inviteCode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        if (data.alreadyMember) {
          setAlreadyMember(true);
          setMembershipStatus(data.status);
          setSuccess(data.message);
        } else if (data.pending) {
          setSuccess(data.message);
          setMembershipStatus('pending');
        } else {
          setSuccess(data.message);
          setMembershipStatus(data.status);
          // Redirect to community after a short delay for open communities
          if (community?.is_open) {
            setTimeout(() => {
              window.location.href = data.redirect_url;
            }, 2000);
          }
        }
      } else {
        if (response.status === 401) {
          window.location.href = `/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        } else {
          setError(data.message || 'Failed to join community');
        }
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  const handleGoToCommunity = () => {
    window.location.href = `/communities?community=${community.id}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invite...</p>
        </div>
      </div>
    );
  }

  if (error && !community) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Invalid Invite</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Render already member view
  const renderAlreadyMemberView = () => {
    let statusMessage = '';
    let statusColor = '';
    
    if (membershipStatus === 'approved') {
      statusMessage = "You're already a member of this community!";
      statusColor = 'bg-green-50 border-green-200 text-green-700';
    } else if (membershipStatus === 'pending') {
      statusMessage = "Your join request is pending approval from the admin.";
      statusColor = 'bg-amber-50 border-amber-200 text-amber-700';
    } else if (membershipStatus === 'invited') {
      statusMessage = "You've been invited! Waiting for admin approval.";
      statusColor = 'bg-blue-50 border-blue-200 text-blue-700';
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {community?.image_url ? (
                <img 
                  src={community.image_url} 
                  alt={community.name} 
                  className="w-20 h-20 rounded-full object-cover" 
                />
              ) : (
                <Users className="w-10 h-10 text-blue-600" />
              )}
            </div>
            
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              {community?.name}
            </h1>
            
            <p className="text-gray-600 text-sm mb-3">
              {community?.description}
            </p>
          </div>

          <div className={`mb-6 p-4 border rounded-lg ${statusColor}`}>
            <div className="flex items-center gap-2 mb-2">
              {membershipStatus === 'approved' ? (
                <Check className="w-5 h-5" />
              ) : (
                <Clock className="w-5 h-5" />
              )}
              <p className="font-medium">{statusMessage}</p>
            </div>
            {(membershipStatus === 'pending' || membershipStatus === 'invited') && (
              <p className="text-sm mt-2">
                You&apos;ll receive a notification once your request is approved.
              </p>
            )}
          </div>

          <div className="space-y-3">
            {membershipStatus === 'approved' && (
              <button
                onClick={handleGoToCommunity}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Go to Community
              </button>
            )}
            
            <button
              onClick={() => window.location.href = '/'}
              className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  };

  // If user is already a member, show the member view
  if (alreadyMember && membershipStatus) {
    return renderAlreadyMemberView();
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-md">
        {/* Community Info */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {community?.image_url ? (
              <img 
                src={community.image_url} 
                alt={community.name} 
                className="w-20 h-20 rounded-full object-cover" 
              />
            ) : (
              <Users className="w-10 h-10 text-blue-600" />
            )}
          </div>
          
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            Join {community?.name}
          </h1>
          
          <p className="text-gray-600 text-sm mb-3">
            {community?.description}
          </p>
          
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <span className="px-2 py-1 bg-gray-100 rounded-full">
              {community?.community_type_name}
            </span>
            {!community?.is_open && (
              <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">
                Private
              </span>
            )}
          </div>
        </div>

        {/* Creator Info */}
        {community?.creator && (
          <div className="flex items-center justify-center gap-2 mb-6 p-3 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              {community.creator.profile_picture ? (
                <img 
                  src={community.creator.profile_picture} 
                  alt={community.creator.username} 
                  className="w-8 h-8 rounded-full object-cover" 
                />
              ) : (
                <span className="text-xs font-medium text-gray-600">
                  {community.creator.username?.[0]?.toUpperCase()}
                </span>
              )}
            </div>
            <span className="text-sm text-gray-600">
              Created by <span className="font-medium">{community.creator.username}</span>
            </span>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {success ? (
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-sm text-gray-600">
                {community?.is_open ? 'Redirecting to community...' : 'Request submitted successfully!'}
              </p>
            </div>
          ) : (
            <>
              <button
                onClick={handleJoinCommunity}
                disabled={joining}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {joining ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4" />
                    Join Community
                  </>
                )}
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Maybe Later
              </button>
            </>
          )}
        </div>

        {/* Community Privacy Info */}
        {!community?.is_open && !success && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-amber-600 mt-0.5" />
              <div>
                <p className="text-xs text-amber-800 font-medium">Private Community</p>
                <p className="text-xs text-amber-700">
                  This is a private community. Your request will need to be approved by the admin before you can access it.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default InvitePage;