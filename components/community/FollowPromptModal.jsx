"use client"
import React from 'react';
import { X, Users, UserPlus } from 'lucide-react';

export default function FollowPromptModal({ 
  isOpen, 
  onClose, 
  community, 
  onFollow,
  baseUrl = ''
}) {
  if (!isOpen || !community) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 md:p-4">
      <div className="bg-slate-800 rounded-xl md:rounded-2xl shadow-2xl max-w-md w-full border border-slate-700/50">
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
                {community.name}
              </h2>
              <p className="text-xs md:text-sm text-slate-400">Community</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6">
          <div className="text-center">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
              <UserPlus className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
            
            <h3 className="text-lg md:text-xl font-semibold text-white mb-2">
              Follow to Access
            </h3>
            
            <p className="text-slate-300 text-sm md:text-base mb-4 md:mb-6">
              You need to follow <span className="font-semibold text-white">{community.name}</span> to access this community and its content.
            </p>
            
            <p className="text-slate-400 text-xs md:text-sm mb-6 md:mb-8">
              Following this community will allow you to view posts, participate in discussions, and stay updated with community activities.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 md:px-6 py-3 md:py-4 border-t border-slate-700/50 flex gap-2 md:gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-3 py-2 md:px-4 md:py-2 text-slate-300 border border-slate-600 rounded-lg hover:bg-slate-700/50 transition-colors text-sm md:text-base"
          >
            Cancel
          </button>
          <button
            onClick={onFollow}
            className="flex-1 px-3 py-2 md:px-4 md:py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/25 transform hover:scale-105 transition-all duration-200 text-sm md:text-base flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Follow Community
          </button>
        </div>
      </div>
    </div>
  );
}