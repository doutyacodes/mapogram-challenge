import React from 'react';
import { TrendingUp, Clock, Globe } from 'lucide-react';

const TrendingLatestControls = ({ viewMode, onViewModeChange, isMobile }) => {
  const buttonSize = isMobile ? '50px' : '55px';
  const iconSize = isMobile ? 16 : 18;

  const handleButtonClick = (mode) => {
    if (viewMode === mode) {
      // If clicking the same button, toggle back to 'all'
      onViewModeChange('all');
    } else {
      // If clicking a different button, set that mode
      onViewModeChange(mode);
    }
  };

  const getButtonStyle = (mode) => ({
    width: buttonSize,
    height: buttonSize,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
  });

  const getButtonClasses = (mode) => {
    const isActive = viewMode === mode;
    const baseClasses = "border-4 shadow-lg rounded-full hover:bg-gray-50 active:scale-95 transition-all duration-200 flex items-center justify-center";
    
    if (isActive) {
      switch (mode) {
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

  return (
    <div className="flex flex-col gap-3">
        <button
        onClick={() => handleButtonClick('trending')}
        className={getButtonClasses('trending')}
        style={getButtonStyle('trending')}
        title="Trending News"
        >
        <span className="font-bold text-[10px]">TOP 10</span>
        </button>

        <button
        onClick={() => handleButtonClick('latest')}
        className={getButtonClasses('latest')}
        style={getButtonStyle('latest')}
        title="Latest News"
        >
        <span className="font-bold text-[10px]">LATEST</span>
        </button>

        <button
        onClick={() => handleButtonClick('english')}
        className={getButtonClasses('english')}
        style={getButtonStyle('english')}
        title="English Only Content"
        >
        <span className="font-bold text-[10px]">ENGLISH</span>
        </button>
    </div>
  );
};

export default TrendingLatestControls;