import { getIconComponent } from "@/app/api/utils/iconMapping";
import { useEffect } from "react";

const MobileFilterDropdown = ({ 
  selectedCategories,
  setSelectedCategories,
  showFiltersDropdown,
  setShowFiltersDropdown,
  buttonStyle,
  postCategories,
}) => {

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showFiltersDropdown && !event.target.closest('.mobile-filter-dropdown')) {
        setShowFiltersDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFiltersDropdown, setShowFiltersDropdown]);

  return (
    <div className="relative mobile-filter-dropdown">
      <button 
        onClick={() => setShowFiltersDropdown(!showFiltersDropdown)}
        className="bg-white shadow-md rounded-lg p-2 hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center"
        style={buttonStyle}
      >
        <span>Filters</span>
      </button>

      {showFiltersDropdown && (
        <div className="absolute top-12 right-0 bg-white/95 backdrop-blur-sm shadow-lg rounded-lg w-64 max-w-[calc(100vw-2rem)] z-20">
          <div className="p-4 max-h-64 overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-semibold">Categories</h4>
              <div className="flex gap-2">
                <button 
                  onClick={() => setSelectedCategories(
                    postCategories
                      .filter(cat => cat.name !== 'Default')
                      .map(cat => cat.name)
                  )}
                  className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
                >
                  All
                </button>
                <button 
                  onClick={() => setSelectedCategories([])}
                  className="text-xs bg-gray-500 text-white px-2 py-1 rounded"
                >
                  Clear
                </button>
              </div>
            </div>
            
            {postCategories.map((category) => (
              category.name !== 'Default' && (
                <div 
                  key={category.name}
                  className="flex items-center space-x-3 hover:bg-gray-50 p-2 rounded cursor-pointer"
                  onClick={() => {
                    setSelectedCategories(prev => 
                      prev.includes(category.name) 
                        ? prev.filter(cat => cat !== category.name)
                        : [...prev, category.name]
                    );
                  }}
                >
                  <input 
                    type="checkbox" 
                    checked={selectedCategories.includes(category.name)}
                    onChange={() => {}}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div 
                    className="w-6 h-6 flex items-center justify-center rounded-full"
                    style={{ 
                      backgroundColor: category.color || '#6b7280',
                      color: 'white'
                    }}
                  >
                    {(() => {
                      const IconComponent = getIconComponent(category.icon_name);
                      return <IconComponent size={14} color="white" />;
                    })()}
                  </div>
                  <span className="text-sm">{category.name}</span>
                </div>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileFilterDropdown;