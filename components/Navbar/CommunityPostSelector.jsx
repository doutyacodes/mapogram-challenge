import React, { useState } from 'react';
import { X, MapPin, Calendar } from 'lucide-react';
import CreateCenterPostModal from './CreateInfrastructurePostModal';


const CreateOption = ({ title, description, bgColor, onClick, icon: Icon }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full ${bgColor} text-white rounded-xl p-6 text-left hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]`}
    >
      <div className="flex items-start space-x-3">
        {Icon && <Icon className="w-6 h-6 mt-0.5 flex-shrink-0" />}
        <div className="flex-1">
          <h3 className="font-bold text-base mb-1">{title}</h3>
          <p className="text-sm opacity-90 leading-tight">{description}</p>
        </div>
      </div>
    </button>
  );
};

const CommunityPostSelector = ({ isOpen, onClose, pageId }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedPostType, setSelectedPostType] = useState(null);

  if (!isOpen) return null;


  /* The below ids(18, 19) are from the COMMUNITY_POST_CATEGORIES table */
 const handleCreatePost = () => {
    setSelectedCategory({ id: 18, name: "Posts", post_type: "general" }); 
    setSelectedPostType("general");
    setShowCreateModal(true);
  };

  const handleCreateEvent = () => {
    setSelectedCategory({ id: 19, name: "Event", post_type: "personal_event" });
    setSelectedPostType("personal_event");
    setShowCreateModal(true);
  };

  const handleBack = () => {
    setShowCreateModal(false);
    setSelectedCategory(null);
    setSelectedPostType(null);
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setSelectedCategory(null);
    setSelectedPostType(null);
    onClose();
  };

  if (showCreateModal) {
    return (
      <CreateCenterPostModal
        isOpen={true}
        onClose={handleModalClose}
        onBack={handleBack}
        pageId={pageId}
        preSelectedCategory={selectedCategory}
        preSelectedPostType={selectedPostType}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Create New</h2>
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-3">
            <CreateOption
              title="CREATE POST"
              description="Pin a thought, image or moment to the map — visible to your friends or public"
              bgColor="bg-gradient-to-r from-emerald-500 to-emerald-600"
              onClick={handleCreatePost}
              icon={MapPin}
            />

            <CreateOption
              title="CREATE EVENT"
              description="Announce something happening at a place and time — let others know and join in"
              bgColor="bg-gradient-to-r from-cyan-500 to-cyan-600"
              onClick={handleCreateEvent}
              icon={Calendar}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityPostSelector;
