import React from 'react';
import { Filter } from 'lucide-react';

const FilterButton = ({ onClick, activeFiltersCount = 0, isLoading = false, buttonStyle }) => {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className="relative inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
      style={buttonStyle}
    >
      <Filter className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
      <span className="hidden sm:inline">Filters</span>
      <span className="sm:hidden">Filter</span>
      
      {activeFiltersCount > 0 && (
        <>
          <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
            {activeFiltersCount > 99 ? '99+' : activeFiltersCount}
          </div>
          <span className="ml-1 sm:ml-2 text-xs text-blue-600 font-medium">
            ({activeFiltersCount})
          </span>
        </>
      )}
      
      {isLoading && (
        <div className="ml-2 animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
      )}
    </button>
  );
};

export default FilterButton;