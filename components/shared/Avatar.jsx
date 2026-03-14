"use client"

import { Globe, Layers3 } from 'lucide-react';

const Avatar = ({ item, className = "" }) => {
  const isPage = item.itemType === 'page' || item.page_type_id !== undefined;
  
  const getInitials = (name) => {
    return name?.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2) || '?';
  };

  const avatarClass = isPage 
    ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
    : 'bg-gradient-to-br from-blue-500 to-cyan-500';

  return (
    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white ${avatarClass} ${className}`}>
      {item?.profile_pic_url ? (
        <img 
          src={item.profile_pic_url} 
          alt={item.name} 
          className="w-full h-full rounded-full object-cover"
        />
      ) : isPage ? (
        <Globe className="w-4 h-4" />
      ) : (
        // <Layers3 className="w-4 h-4" />
        getInitials(item?.name)
      )}
    </div>
  );
};

export default Avatar;