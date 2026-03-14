import React, { useState, useEffect } from 'react';
import { X, Filter, ChevronDown, ChevronUp } from 'lucide-react';

const FilterModal = ({ 
  isOpen, 
  onClose, 
  layerType, 
  currentFilters, 
  onApplyFilters 
}) => {
  const [filters, setFilters] = useState(currentFilters || {});
  const [filterOptions, setFilterOptions] = useState({});
  const [loading, setLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    type: true,
    location: false,
    compensation: false,
    experience: false,
    skills: false,
    education: false,
    deadline: false,
    language: true,
    priority: true,
    sorting: false,
    // Classifieds specific sections
    listingType: true,
    category: true,
    subCategory: true,
    price: false,
    condition: false,
    vehicle: false,
    electronics: false,
    furniture: false,
    realEstate: false,
  });

  useEffect(() => {
    if (isOpen && layerType) {
      fetchFilterOptions();
    }
  }, [isOpen, layerType]);

  const fetchFilterOptions = async () => {
    setLoading(true);
    try {
      const endpoint = layerType === 'classifieds' 
        ? `/api/classifieds/filter-options`
        : `/api/layer/filter-options?type=${layerType}`;
      
      const response = await fetch(endpoint);
      const data = await response.json();
      setFilterOptions(data);
    } catch (error) {
      console.error('Error fetching filter options:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleArrayFilterChange = (key, value, checked) => {
    setFilters(prev => {
      const currentArray = prev[key] || [];
      if (checked) {
        return {
          ...prev,
          [key]: [...currentArray, value]
        };
      } else {
        return {
          ...prev,
          [key]: currentArray.filter(item => item !== value)
        };
      }
    });
  };

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleClear = () => {
    setFilters({});
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const FilterSection = ({ title, sectionKey, children }) => (
    <div className="border-b border-gray-200 pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="flex items-center justify-between w-full text-left mb-3 font-medium text-gray-900 hover:text-blue-600 transition-colors"
      >
        <span className="text-sm sm:text-base">{title}</span>
        {expandedSections[sectionKey] ? 
          <ChevronUp className="h-4 w-4" /> : 
          <ChevronDown className="h-4 w-4" />
        }
      </button>
      {expandedSections[sectionKey] && (
        <div className="space-y-3">
          {children}
        </div>
      )}
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-2 sm:p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between rounded-t-lg">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Filter {layerType === 'job' ? 'Jobs' : layerType === 'news' ? 'News' : layerType === 'classifieds' ? 'Classifieds' : 'Posts'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-4 sm:px-6 py-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Job Filters */}
                {layerType === 'job' && (
                  <>
                    <FilterSection title="Job Type" sectionKey="type">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {filterOptions.jobTypes?.map((type) => (
                          <label key={type} className="flex items-center space-x-2 text-sm">
                            <input
                              type="checkbox"
                              checked={filters.jobType === type}
                              onChange={(e) => handleFilterChange('jobType', e.target.checked ? type : '')}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="truncate">{type}</span>
                          </label>
                        ))}
                      </div>
                    </FilterSection>

                    <FilterSection title="Location Type" sectionKey="location">
                      <div className="grid grid-cols-3 gap-2">
                        {filterOptions.locationTypes?.map((type) => (
                          <label key={type} className="flex items-center space-x-2 text-sm">
                            <input
                              type="checkbox"
                              checked={filters.locationType === type}
                              onChange={(e) => handleFilterChange('locationType', e.target.checked ? type : '')}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="capitalize">{type}</span>
                          </label>
                        ))}
                      </div>
                    </FilterSection>

                    <FilterSection title="Compensation" sectionKey="compensation">
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            checked={filters.isPaid === 'true'}
                            onChange={(e) => handleFilterChange('isPaid', e.target.checked ? 'true' : '')}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>Paid Only</span>
                        </label>
                        <label className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            checked={filters.isPaid === 'false'}
                            onChange={(e) => handleFilterChange('isPaid', e.target.checked ? 'false' : '')}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>Unpaid Only</span>
                        </label>
                      </div>
                    </FilterSection>

                    <FilterSection title="Experience" sectionKey="experience">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-700 mb-1">Min Years</label>
                          <input
                            type="number"
                            min="0"
                            max="20"
                            value={filters.minExperience || ''}
                            onChange={(e) => handleFilterChange('minExperience', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-700 mb-1">Max Years</label>
                          <input
                            type="number"
                            min="0"
                            max="20"
                            value={filters.maxExperience || ''}
                            onChange={(e) => handleFilterChange('maxExperience', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="20"
                          />
                        </div>
                      </div>
                    </FilterSection>

                    <FilterSection title="Skills" sectionKey="skills">
                      <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2">
                        <div className="space-y-2">
                          {filterOptions.skills?.map((skill) => (
                            <label key={skill.id} className="flex items-center space-x-2 text-sm">
                              <input
                                type="checkbox"
                                checked={filters.skillIds?.includes(skill.id.toString()) || false}
                                onChange={(e) => handleArrayFilterChange('skillIds', skill.id.toString(), e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="truncate">{skill.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </FilterSection>

                    <FilterSection title="Education" sectionKey="education">
                      <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2">
                        <div className="space-y-2">
                          {filterOptions.educations?.map((education) => (
                            <label key={education.id} className="flex items-center space-x-2 text-sm">
                              <input
                                type="checkbox"
                                checked={filters.educationIds?.includes(education.id.toString()) || false}
                                onChange={(e) => handleArrayFilterChange('educationIds', education.id.toString(), e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="truncate">{education.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </FilterSection>

                    <FilterSection title="Application Deadline" sectionKey="deadline">
                      <input
                        type="date"
                        value={filters.applicationDeadline || ''}
                        onChange={(e) => handleFilterChange('applicationDeadline', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Show jobs with deadline after this date</p>
                    </FilterSection>
                  </>

                )}

                {/* News Filters */}
                {layerType === 'news' && (
                  <>
                    <FilterSection title="News Type" sectionKey="priority">
                      <div className="space-y-2">
                        {filterOptions.newsTypes?.map((newsType) => (
                          <label key={newsType.id} className="flex items-center space-x-2 text-sm">
                            <input
                              type="radio"
                              name="newsType"
                              value={newsType.id}
                              checked={filters.newsType === newsType.id}
                              onChange={(e) => handleFilterChange('newsType', e.target.value)}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span>{newsType.name}</span>
                          </label>
                        ))}
                      </div>
                    </FilterSection>

                    <FilterSection title="Language" sectionKey="language">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                        {filterOptions.languages?.map((language) => (
                          <label key={language.id} className="flex items-center space-x-2 text-sm">
                            <input
                              type="checkbox"
                              checked={filters.languageId === language.id.toString()}
                              onChange={(e) => handleFilterChange('languageId', e.target.checked ? language.id.toString() : '')}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="truncate">{language.name}</span>
                          </label>
                        ))}
                      </div>
                    </FilterSection>

                    <FilterSection title="Priority" sectionKey="priority">
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            checked={filters.isHighPriority === 'true'}
                            onChange={(e) => handleFilterChange('isHighPriority', e.target.checked ? 'true' : '')}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>High Priority Only</span>
                        </label>
                        <label className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            checked={filters.isBreaking === 'true'}
                            onChange={(e) => handleFilterChange('isBreaking', e.target.checked ? 'true' : '')}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>Breaking News Only</span>
                        </label>
                      </div>
                    </FilterSection>
                  </>
                )}

                {/* Classifieds Filters */}
                {layerType === 'classifieds' && (
                  <>
                    {/* Listing Type Filter */}
                    <FilterSection title="Listing Type" sectionKey="listingType">
                      <div className="space-y-2">
                        {['sell', 'rent'].map((type) => (
                          <label key={type} className="flex items-center space-x-2 text-sm">
                            <input
                              type="radio"
                              name="listingType"
                              value={type}
                              checked={filters.listingType === type}
                              onChange={(e) => handleFilterChange('listingType', e.target.value)}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span className="capitalize">{type}</span>
                          </label>
                        ))}
                        <label className="flex items-center space-x-2 text-sm">
                          <input
                            type="radio"
                            name="listingType"
                            value=""
                            checked={!filters.listingType}
                            onChange={(e) => handleFilterChange('listingType', '')}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span>All</span>
                        </label>
                      </div>
                    </FilterSection>

                    {/* Category Filter */}
                    <FilterSection title="Category" sectionKey="category">
                      <div className="space-y-2">
                        {filterOptions.categories?.map((category) => (
                          <label key={category.id} className="flex items-center space-x-2 text-sm">
                            <input
                              type="radio"
                              name="categoryId"
                              value={category.id}
                              checked={filters.categoryId === category.id.toString()}
                              onChange={(e) => handleFilterChange('categoryId', e.target.value)}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span>{category.name}</span>
                          </label>
                        ))}
                        <label className="flex items-center space-x-2 text-sm">
                          <input
                            type="radio"
                            name="categoryId"
                            value=""
                            checked={!filters.categoryId}
                            onChange={(e) => handleFilterChange('categoryId', '')}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span>All Categories</span>
                        </label>
                      </div>
                    </FilterSection>

                    {/* Sub Category Filter - Only show if category is selected */}
                    {filters.categoryId && filterOptions.subCategories && (
                      <FilterSection title="Sub Category" sectionKey="subCategory">
                        <div className="space-y-2">
                          {filterOptions.subCategories
                            ?.filter(sub => sub.main_category_id.toString() === filters.categoryId)
                            ?.map((subCategory) => (
                            <label key={subCategory.id} className="flex items-center space-x-2 text-sm">
                              <input
                                type="radio"
                                name="subCategoryId"
                                value={subCategory.id}
                                checked={filters.subCategoryId === subCategory.id.toString()}
                                onChange={(e) => handleFilterChange('subCategoryId', e.target.value)}
                                className="text-blue-600 focus:ring-blue-500"
                              />
                              <span>{subCategory.name}</span>
                            </label>
                          ))}
                          <label className="flex items-center space-x-2 text-sm">
                            <input
                              type="radio"
                              name="subCategoryId"
                              value=""
                              checked={!filters.subCategoryId}
                              onChange={(e) => handleFilterChange('subCategoryId', '')}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span>All Sub Categories</span>
                          </label>
                        </div>
                      </FilterSection>
                    )}

                    {/* Price Range Filter */}
                    <FilterSection title="Price Range" sectionKey="price">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-700 mb-1">Min Price</label>
                          <input
                            type="number"
                            value={filters.minPrice || ''}
                            onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                            placeholder="0"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-700 mb-1">Max Price</label>
                          <input
                            type="number"
                            value={filters.maxPrice || ''}
                            onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                            placeholder="Any"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </FilterSection>

                    {/* Condition Filter */}
                    <FilterSection title="Condition" sectionKey="condition">
                      <div className="space-y-2">
                        {['new', 'like_new', 'good', 'fair', 'needs_repair'].map((condition) => (
                          <label key={condition} className="flex items-center space-x-2 text-sm">
                            <input
                              type="checkbox"
                              checked={(filters.condition || []).includes(condition)}
                              onChange={(e) => handleArrayFilterChange('condition', condition, e.target.checked)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="capitalize">{condition.replace('_', ' ')}</span>
                          </label>
                        ))}
                      </div>
                    </FilterSection>

                    {/* Vehicle Specific Filters - Only show if Vehicle category is selected */}
                    {filters.categoryId && filterOptions.categories?.find(c => c.id.toString() === filters.categoryId && c.name === 'Vehicle') && (
                      <FilterSection title="Vehicle Details" sectionKey="vehicle">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-700 mb-1">Brand</label>
                            <select
                              value={filters.vehicleBrandId || ''}
                              onChange={(e) => handleFilterChange('vehicleBrandId', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">All Brands</option>
                              {filterOptions.vehicleBrands?.map((brand) => (
                                <option key={brand.id} value={brand.id}>{brand.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-700 mb-1">Fuel Type</label>
                            <select
                              value={filters.fuelType || ''}
                              onChange={(e) => handleFilterChange('fuelType', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">All Fuel Types</option>
                              {['petrol', 'diesel', 'electric', 'hybrid', 'cng'].map((fuel) => (
                                <option key={fuel} value={fuel} className="capitalize">{fuel}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-700 mb-1">Year From</label>
                            <input
                              type="number"
                              value={filters.yearFrom || ''}
                              onChange={(e) => handleFilterChange('yearFrom', e.target.value)}
                              placeholder="2000"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-700 mb-1">Year To</label>
                            <input
                              type="number"
                              value={filters.yearTo || ''}
                              onChange={(e) => handleFilterChange('yearTo', e.target.value)}
                              placeholder="2024"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                      </FilterSection>
                    )}

                    {/* Electronics Specific Filters - Only show if Electronics category is selected */}
                    {filters.categoryId && filterOptions.categories?.find(c => c.id.toString() === filters.categoryId && c.name === 'Electronics') && (
                      <FilterSection title="Electronics Details" sectionKey="electronics">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-700 mb-1">Brand</label>
                            <select
                              value={filters.electronicsBrandId || ''}
                              onChange={(e) => handleFilterChange('electronicsBrandId', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">All Brands</option>
                              {filterOptions.electronicsBrands?.map((brand) => (
                                <option key={brand.id} value={brand.id}>{brand.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={filters.warrantyAvailable === 'true'}
                              onChange={(e) => handleFilterChange('warrantyAvailable', e.target.checked ? 'true' : '')}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm">Warranty Available</span>
                          </div>
                        </div>
                      </FilterSection>
                    )}
                  </>
                )}

                {/* Common Sorting Section */}
                <FilterSection title="Sort & Limit" sectionKey="sorting">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-700 mb-1">Sort By</label>
                      <select
                        value={filters.sortBy || 'created_at'}
                        onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="created_at">Date</option>
                        <option value="title">Title</option>
                        {layerType === 'classifieds' && (
                          <option value="price">Price</option>
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-700 mb-1">Order</label>
                      <select
                        value={filters.sortOrder || 'desc'}
                        onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="desc">
                          {filters.sortBy === 'price' ? 'Highest First' : 'Newest First'}
                        </option>
                        <option value="asc">
                          {filters.sortBy === 'price' ? 'Lowest First' : 'Oldest First'}
                        </option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-700 mb-1">Limit</label>
                      <select
                        value={filters.limit || ''}
                        onChange={(e) => handleFilterChange('limit', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">All</option>
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                      </select>
                    </div>
                  </div>
                </FilterSection>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between space-y-2 sm:space-y-0 sm:space-x-3 rounded-b-lg">
            <button
              onClick={handleClear}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Clear All
            </button>
            <div className="flex space-x-2">
              <button
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;