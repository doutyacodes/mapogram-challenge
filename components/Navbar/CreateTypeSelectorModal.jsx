import React, { useState, useEffect } from 'react'
import UserPostCreation from './UserPostCreation';
import { X, Upload, MapPin, Calendar, Clock, Users, AlertCircle, CheckCircle, Loader2, ChevronDown, Search, ImageIcon, AtSign, ArrowLeft, Toggle } from 'lucide-react';
import { getIconComponent } from '@/app/api/utils/iconMapping';
import PagePostCreation from '../map/posts/PagePostCreation';
import ClassifiedPostCreation from './ClassifiedPostCreation';
import ComplaintsPostCreation from './ComplaintsPostCreation';

const CreateOption = ({ title, description, bgColor, bgStyle = {}, onClick, icon: Icon, loading = false }) => {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={bgStyle} // Add this line
      className={`w-full ${bgColor} text-white rounded-xl p-4 sm:p-6 text-left hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed`}
    >
      {/* rest of your component stays the same */}
      <div className="flex items-start space-x-3">
        {loading ? (
          <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 mt-0.5 flex-shrink-0 animate-spin" />
        ) : (
          Icon && <Icon className="w-5 h-5 sm:w-6 sm:h-6 mt-0.5 flex-shrink-0" />
        )}
        <div className="flex-1">
          <h3 className="font-bold text-sm sm:text-base mb-1">{title}</h3>
          <p className="text-xs sm:text-sm opacity-90 leading-tight">{description}</p>
        </div>
      </div>
    </button>
  );
};

const CreateTypeSelectorModal = ({ setCreateModalOpen, loggedInUserId, currentIdentity }) => {
  const [activePostModal, setActivePostModal] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedPostType, setSelectedPostType] = useState(null);
  const [pageTemplates, setPageTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  console.log("pageTemplates", pageTemplates)

  // Fetch page templates when modal opens for pages
  useEffect(() => {
    if (currentIdentity?.type === 'page') {
      fetchPageTemplates();
    }
  }, [currentIdentity]);

  const fetchPageTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/page/${currentIdentity.id}/post-templates`);
      if (!response.ok) {
        throw new Error('Failed to fetch page templates');
      }
      const data = await response.json();
      setPageTemplates(data.templates || []);
    } catch (error) {
      console.error('Error fetching page templates:', error);
      setError('Failed to load post options. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOptionClick = (type, postType = null) => {
    console.log('type', type, 'postType', postType);
    
    // Special case for classifieds
    if (type === 'classified') {
      setActivePostModal('classified');
      setShowCreateForm(true);
      return;
    }

    // Special case for classifieds
    if (type === 'complaints') {
      setActivePostModal('complaints');
      setShowCreateForm(true);
      return;
    }
    
    setActivePostModal(type);
    setSelectedPostType(postType);
    setShowCreateForm(true);
  };

  const handleBack = () => {
    setShowCreateForm(false);
    setActivePostModal(null);
    setSelectedPostType(null);
  };

  const handleClose = () => {
    setCreateModalOpen(false);
    setShowCreateForm(false);
    setActivePostModal(null);
    setSelectedPostType(null);
  };

  if (showCreateForm && activePostModal) {
    // ✅ Complaints modal
    if (activePostModal === "complaints") {
      return (
        <ComplaintsPostCreation
          isOpen={true}
          onClose={handleClose}
          onBack={handleBack}
        />
      );
    }

    // ✅ Classified modal
    if (activePostModal === "classified") {
      return (
        <ClassifiedPostCreation
          isOpen={true}
          onClose={handleClose}
          onBack={handleBack}
        />
      );
    }

    if (currentIdentity?.type === 'user') {
      return (
        <UserPostCreation
          isOpen={true}
          onClose={handleClose}
          onBack={handleBack}
          userId={loggedInUserId}
          postType={activePostModal}
        />
      );
    } else if (currentIdentity?.type === 'page') {
      return (
        <PagePostCreation
          isOpen={true}
          onClose={handleClose}
          onBack={handleBack}
          pageId={currentIdentity.id}
          postType={selectedPostType}
        />
      );
    }
  }

  const renderUserOptions = () => (
    <div className="space-y-3">
      <CreateOption
        title="CREATE STORY"
        description="Share what's happening right now — disappears in 24 hours"
        bgColor="bg-gradient-to-r from-purple-500 to-purple-600"
        onClick={() => handleOptionClick('story')}
        icon={Clock}
      />

      <CreateOption
        title="CREATE POST"
        description="Pin a thought, image or moment to the map — visible to your friends or public"
        bgColor="bg-gradient-to-r from-emerald-500 to-emerald-600"
        onClick={() => handleOptionClick('post')}
        icon={MapPin}
      />

      <CreateOption
        title="CREATE EVENT"
        description="Announce something happening at a place and time — let others know and join in"
        bgColor="bg-gradient-to-r from-cyan-500 to-cyan-600"
        onClick={() => handleOptionClick('event')}
        icon={Calendar}
      />

      <CreateOption
        title="CREATE CLASSIFIEDS"
        description="List something to sell, rent, or offer — job, property, service or item"
        bgColor="bg-gradient-to-r from-yellow-500 to-yellow-600"
        onClick={() => handleOptionClick('classified')}
        icon={Search}
      />
      
      <CreateOption
        title="CREATE COMPLAINT"
        description="Report an issue with your vehicle, appliance, or product and connect with the right service center."
        bgColor="bg-gradient-to-r from-red-500 to-red-600"
        onClick={() => handleOptionClick('complaints')}
        icon={AlertCircle}
      />

      {/* <CreateOption
        title="CREATE CITIZEN NEWS"
        description="Publish local news where it happened — add source, image and summary"
        bgColor="bg-gradient-to-r from-indigo-500 to-indigo-600"
        onClick={() => console.log('Create News')}
        icon={Upload}
      />
      
      <CreateOption
        title="CREATE COMMUNITY POST"
        description="Start a conversation inside your community — visible only to community members"
        bgColor="bg-gradient-to-r from-gray-500 to-gray-600"
        onClick={() => console.log('Create Community Post')}
        icon={Users}
      /> */}
    </div>
  );

  const renderPageOptions = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading post options...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-8">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchPageTemplates}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (pageTemplates.length === 0) {
      return (
        <div className="text-center py-8">
          <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">No post options available for this page type.</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {pageTemplates.map((template) => {
          const IconComponent = getIconComponent(template.icon_name);
          // Fallback to inline style if Tailwind class doesn't work
          const bgStyle = template.color ? {
            background: `linear-gradient(to right, ${template.color}, ${template.color}dd)`
          } : {};
          
          return (
            <CreateOption
              key={template.id}
              title={template.label}
              description={template.description}
              bgColor={template.gradient_class_name}
              bgStyle={bgStyle} // Add this prop
              onClick={() => handleOptionClick('page-post', template.post_type)}
              icon={IconComponent}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[95vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Create New</h2>
              {currentIdentity && (
                <p className="text-sm text-gray-600 mt-1">
                  Posting as: <span className="font-medium">{currentIdentity.name}</span>
                  {currentIdentity.type === 'page' && (
                    <span className="ml-1 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      Page
                    </span>
                  )}
                </p>
              )}
            </div>
            <button 
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {currentIdentity?.type === 'page' ? renderPageOptions() : renderUserOptions()}
        </div>
      </div>
    </div>
  );
};

export default CreateTypeSelectorModal;
