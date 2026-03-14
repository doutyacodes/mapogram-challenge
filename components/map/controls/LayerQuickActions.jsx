import React from 'react';

const LayerQuickActions = ({ 
  activeFilter, 
  onFilterChange, 
  layerType, 
  isMobile = false 
}) => {
  const buttonSize = isMobile ? '50px' : '55px';

  const handleButtonClick = (filter) => {
    if (activeFilter === filter) {
      // If clicking the same button, toggle back to 'all'
      onFilterChange('all');
    } else {
      // If clicking a different button, set that filter
      onFilterChange(filter);
    }
  };

  const getButtonStyle = (filter) => ({
    width: buttonSize,
    height: buttonSize,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
  });

  const getButtonClasses = (filter) => {
    const isActive = activeFilter === filter;
    const baseClasses = "border-4 shadow-lg rounded-full hover:bg-gray-50 active:scale-95 transition-all duration-200 flex items-center justify-center";
    
    if (isActive) {
      switch (filter) {
        case 'trending':
          return `bg-orange-500 text-white border-orange-600 hover:bg-orange-500 ${baseClasses}`;
        case 'latest':
          return `bg-green-500 text-white border-green-600 hover:bg-green-500 ${baseClasses}`;
        case 'english':
          return `bg-blue-500 text-white border-blue-600 hover:bg-blue-500 ${baseClasses}`;
        default:
          return `bg-white text-gray-700 border-gray-400 hover:border-blue-400 ${baseClasses}`;
      }
    } else {
      return `bg-white text-gray-700 border-gray-400 hover:border-blue-400 ${baseClasses}`;
    }
  };

  // Define buttons based on layer type
  const getLayerButtons = () => {
    switch (layerType) {
      case 'news':
        return [
          {
            key: 'trending',
            label: 'TOP 10',
            title: 'Top 10 Trending News'
          },
          {
            key: 'latest',
            label: 'LATEST',
            title: 'Latest News'
          },
          {
            key: 'english',
            label: 'ENGLISH',
            title: 'English Only Content'
          }
        ];
      
      case 'job':
        // Future job layer buttons - currently empty
        return [];
      
      case 'event':
        // Future event layer buttons - currently empty
        return [];
      
      default:
        return [];
    }
  };

  const buttons = getLayerButtons();

  // Don't render if no buttons for this layer type
  if (buttons.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      {buttons.map((button) => (
        <button
          key={button.key}
          onClick={() => handleButtonClick(button.key)}
          className={getButtonClasses(button.key)}
          style={getButtonStyle(button.key)}
          title={button.title}
        >
          <span className="font-bold text-[10px]">{button.label}</span>
        </button>
      ))}
    </div>
  );
};

export default LayerQuickActions;