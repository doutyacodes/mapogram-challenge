"use client"
import React, { useState, useEffect } from 'react';
import { X, Users, Loader2, CheckCircle2 } from 'lucide-react';

export default function RoleSelectionModal({ 
  isOpen, 
  onClose, 
  community, 
  onRoleSelect,
  baseUrl = ''
}) {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && community) {
      fetchCommunityRoles();
    }
  }, [isOpen, community]);

  const fetchCommunityRoles = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/communities/community-type/${community.community_type.id}/roles`);
      const data = await response.json();
      
      if (data.success) {
        setRoles(data.roles);
      } else {
        setError('Failed to load community roles');
      }
    } catch (err) {
      setError('Failed to load community roles');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = () => {
    if (selectedRole) {
      onRoleSelect(community.id, selectedRole.id);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedRole(null);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 md:p-4">
      <div className="bg-slate-800 rounded-xl md:rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden border border-slate-700/50">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-slate-700 to-slate-600 rounded-lg flex items-center justify-center overflow-hidden">
              {community?.image_url ? (
                <img
                  src={`${baseUrl}${community.image_url}`}
                  alt={community.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Users className="w-5 h-5 md:w-6 md:h-6 text-slate-400" />
              )}
            </div>
            <div>
              <h2 className="text-base md:text-lg font-semibold text-white">
                Join {community?.name}
              </h2>
              <p className="text-xs md:text-sm text-slate-400">Select your role</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2 md:px-4 md:py-3 rounded-lg mb-4 text-xs md:text-sm backdrop-blur-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-6 md:py-8">
              <Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin text-indigo-400 mx-auto mb-3 md:mb-4" />
              <p className="text-slate-300 text-sm md:text-base">Loading roles...</p>
            </div>
          ) : (
            <>
              <p className="text-slate-300 text-xs md:text-sm mb-4">
                Choose how you&apos;d like to participate in this community:
              </p>
              
              <div className="space-y-2 md:space-y-3 mb-4 md:mb-6 max-h-60 overflow-y-auto">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    onClick={() => setSelectedRole(role)}
                    className={`p-3 md:p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      selectedRole?.id === role.id
                        ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/25'
                        : 'border-slate-600/50 hover:border-slate-500 hover:bg-slate-700/50 bg-slate-700/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white text-sm md:text-base">
                        {role.role_name}
                      </span>
                      {selectedRole?.id === role.id && (
                        <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-indigo-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {roles.length === 0 && !loading && (
                <div className="text-center py-6 md:py-8 text-slate-400 text-sm md:text-base">
                  No roles available for this community
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 md:px-6 py-3 md:py-4 border-t border-slate-700/50 flex gap-2 md:gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-3 py-2 md:px-4 md:py-2 text-slate-300 border border-slate-600 rounded-lg hover:bg-slate-700/50 transition-colors text-sm md:text-base"
          >
            Cancel
          </button>
          <button
            onClick={handleRoleSelect}
            disabled={!selectedRole}
            className={`flex-1 px-3 py-2 md:px-4 md:py-2 rounded-lg font-medium transition-all duration-200 text-sm md:text-base ${
              selectedRole
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/25 transform hover:scale-105'
                : 'bg-slate-600 text-slate-400 cursor-not-allowed'
            }`}
          >
            Join Community
          </button>
        </div>
      </div>
    </div>
  );
}