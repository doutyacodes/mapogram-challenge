import { getIconComponent } from "@/app/api/utils/iconMapping";
import { useEffect, useState } from "react";

// Updated Filter Panel for Posts
const PostFilterPanel = ({ selectedCategories, setSelectedCategories, buttonStyle, isMobile, postCategories, getCategoryByName }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleCategory = (category) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(cat => cat !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  const selectAllCategories = () => {
    const allCategoryNames = postCategories
      .filter(cat => cat.name !== 'Default')
      .map(cat => cat.name);
    setSelectedCategories(allCategoryNames);
  };

  const clearAllCategories = () => {
    setSelectedCategories([]);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isExpanded && !event.target.closest('.filter-panel')) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded]);

  return (
    <div className="filter-panel">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-white shadow-md rounded-lg p-2 hover:bg-gray-100 transition-colors duration-200 mb-2 w-full flex items-center justify-center"
        style={buttonStyle}
      >
        <span>{isExpanded ? 'Hide Filters' : 'Show Filters'}</span>
      </button>

      {isExpanded && (
        <div 
          className={`bg-white/95 backdrop-blur-sm shadow-lg rounded-lg p-4 max-h-[70vh] overflow-y-auto w-64 max-w-[calc(100vw-2rem)] ${isMobile ? 'absolute top-12 right-0' : ''}`}
        >
          <div className="flex justify-between items-center mb-3 border-b pb-2">
            <h3 className="text-lg font-semibold">Post Filters</h3>
            <div className="flex gap-2">
              <button 
                onClick={selectAllCategories}
                className="text-xs bg-red-800 text-white px-2 py-1 rounded hover:bg-red-900"
              >
                All
              </button>
              <button 
                onClick={clearAllCategories}
                className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
              >
                Clear
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            {postCategories.map((categoryData) => (
              categoryData.name !== 'Default' && (
                <div 
                  key={categoryData.name} 
                  className="flex items-center space-x-3 hover:bg-gray-50/90 p-2 rounded transition-colors cursor-pointer"
                  onClick={() => toggleCategory(categoryData.name)}
                >
                  <input 
                    type="checkbox" 
                    checked={selectedCategories.includes(categoryData.name)}
                    onChange={() => {}}
                    className="w-4 h-4 text-blue-600"
                  />
                  
                  <div 
                    className="w-8 h-8 flex items-center justify-center rounded-full"
                    style={{ 
                      backgroundColor: categoryData.color || '#6b7280',
                      color: 'white'
                    }}
                  >
                    {(() => {
                      const IconComponent = getIconComponent(categoryData.icon_name);
                      return <IconComponent size={20} strokeWidth={2.5} color="white" />;
                    })()}
                  </div>
                  <span className="text-sm text-gray-700">{categoryData.name}</span>
                </div>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostFilterPanel;