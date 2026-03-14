"use client";
import React, { useState } from 'react';
import { Building, Globe, FileText, Loader2, Plus, Trash2 } from 'lucide-react';
import { ImageUploadService } from '@/utils/imageUploadService';

const UserCompanyForm = ({ onSuccess, isSubmitting, source = 'user' }) => {
  const [companies, setCompanies] = useState([
    { name: '', description: '', website_url: '', logo_url: '' }
  ]);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [companyLogos, setCompanyLogos] = useState({});

  const handleInputChange = (index, field, value) => {
    const updatedCompanies = [...companies];
    updatedCompanies[index][field] = value;
    setCompanies(updatedCompanies);
    
    // Clear error when user starts typing
    const errorKey = `${index}.${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: '' }));
    }
  };

  const addCompany = () => {
    setCompanies([...companies, { name: '', description: '', website_url: '', logo_url: '' }]);
  };

  const removeCompany = (index) => {
    if (companies.length > 1) {
      const updatedCompanies = companies.filter((_, i) => i !== index);
      setCompanies(updatedCompanies);
      
      // Remove logo from state
      const newLogos = { ...companyLogos };
      delete newLogos[index];
      setCompanyLogos(newLogos);
      
      // Clear errors for removed company
      const newErrors = { ...errors };
      Object.keys(newErrors).forEach(key => {
        if (key.startsWith(`${index}.`)) {
          delete newErrors[key];
        }
      });
      setErrors(newErrors);
    }
  };

  const handleLogoUpload = async (index, event) => {
    const file = event.target.files[0];
    if (file) {
      // Show image preview immediately
      const previewUrl = URL.createObjectURL(file);
      setCompanyLogos(prev => ({ ...prev, [index]: previewUrl }));

      try {
        // ✅ Upload the image to the server
        const uploadedFileName = await ImageUploadService.uploadToCPanel(file);

        // ✅ Update companies with the actual uploaded file name
        const updatedCompanies = [...companies];
        updatedCompanies[index].logo_url = uploadedFileName; // <- final server filename
        setCompanies(updatedCompanies);
      } catch (error) {
        console.error("Image upload failed:", error);
        // You can show an error toast or fallback here
      }
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    companies.forEach((company, index) => {
      if (!company.name.trim()) {
        newErrors[`${index}.name`] = 'Company name is required';
      }
      
      if (!company.description.trim()) {
        newErrors[`${index}.description`] = 'Company description is required';
      }
      
      if (company.website_url && !isValidUrl(company.website_url)) {
        newErrors[`${index}.website_url`] = 'Please enter a valid URL';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      if (source === "admin") {
        // If called from admin signup, return data instead of making API call
        onSuccess(companies); // Pass company data back to parent
        return;
      }

      // For other sources, make the normal API call
      const response = await fetch('/api/user/community/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ companies }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setErrors({ submit: errorData.message || 'Failed to save company information' });
      }

      if (response.ok) {
        onSuccess();
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.message || 'Failed to save company information' });
      }
    } catch (error) {
      console.error('Error saving companies:', error);
      setErrors({ submit: 'Failed to save company information' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-1 sm:mb-2">Company Details</h2>
        <p className="text-sm sm:text-base text-gray-600">Add your companies or business details</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {companies.map((company, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-3 sm:p-6 bg-gray-50">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-medium text-gray-800">
                Company {index + 1}
              </h3>
              {companies.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeCompany(index)}
                  className="text-slate-600 border border-slate-200 hover:bg-slate-50 px-2 py-1 sm:px-3 sm:py-1 rounded-md flex items-center text-sm"
                  disabled={isLoading || isSubmitting}
                >
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
              )}
            </div>

            {/* Company Logo Upload */}
            <div className="mb-4 sm:mb-6">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Company Logo
              </label>
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-white">
                  {companyLogos[index] ? (
                    <img
                      src={companyLogos[index]}
                      alt="Company logo"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Building className="w-4 h-4 sm:w-6 sm:h-6 text-gray-400" />
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    id={`logo-${index}`}
                    accept="image/*"
                    onChange={(e) => handleLogoUpload(index, e)}
                    className="hidden"
                    disabled={isLoading || isSubmitting}
                  />
                  <label
                    htmlFor={`logo-${index}`}
                    className="cursor-pointer bg-white border border-gray-300 text-gray-700 px-2 py-1.5 sm:px-4 sm:py-2 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 text-xs sm:text-sm"
                  >
                    Upload Logo
                  </label>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 2MB</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Company Name */}
              <div>
                <label htmlFor={`name-${index}`} className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Company Name *
                </label>
                <div className="relative">
                  <Building className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
                  <input
                    type="text"
                    id={`name-${index}`}
                    value={company.name}
                    onChange={(e) => handleInputChange(index, 'name', e.target.value)}
                    className={`w-full pl-8 sm:pl-10 pr-2 sm:pr-3 py-2 sm:py-2 bg-white border rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm ${
                      errors[`${index}.name`] ? 'border-red-500' : 'border-gray-200'
                    }`}
                    placeholder="Enter company name"
                    disabled={isLoading || isSubmitting}
                  />
                </div>
                {errors[`${index}.name`] && (
                  <p className="mt-1 text-xs sm:text-sm text-red-600">{errors[`${index}.name`]}</p>
                )}
              </div>

              {/* Website URL */}
              <div>
                <label htmlFor={`website-${index}`} className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Website URL
                </label>
                <div className="relative">
                  <Globe className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
                  <input
                    type="url"
                    id={`website-${index}`}
                    value={company.website_url}
                    onChange={(e) => handleInputChange(index, 'website_url', e.target.value)}
                    className={`w-full pl-8 sm:pl-10 pr-2 sm:pr-3 py-2 sm:py-2 bg-white border rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm ${
                      errors[`${index}.website_url`] ? 'border-red-500' : 'border-gray-200'
                    }`}
                    placeholder="https://example.com"
                    disabled={isLoading || isSubmitting}
                  />
                </div>
                {errors[`${index}.website_url`] && (
                  <p className="mt-1 text-xs sm:text-sm text-red-600">{errors[`${index}.website_url`]}</p>
                )}
              </div>
            </div>

            {/* Company Description */}
            <div className="mt-3 sm:mt-4">
              <label htmlFor={`description-${index}`} className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Company Description *
              </label>
              <div className="relative">
                <FileText className="absolute left-2 sm:left-3 top-3 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
                <textarea
                  id={`description-${index}`}
                  value={company.description}
                  onChange={(e) => handleInputChange(index, 'description', e.target.value)}
                  rows={3}
                  className={`w-full pl-8 sm:pl-10 pr-2 sm:pr-3 py-2 sm:py-2 bg-white border rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-none text-sm ${
                    errors[`${index}.description`] ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="Describe your company..."
                  disabled={isLoading || isSubmitting}
                />
              </div>
              {errors[`${index}.description`] && (
                <p className="mt-1 text-xs sm:text-sm text-red-600">{errors[`${index}.description`]}</p>
              )}
            </div>
          </div>
        ))}

        {/* Add Company Button */}
        <button
          type="button"
          onClick={addCompany}
          disabled={isLoading || isSubmitting}
          className="w-full border-2 border-dashed border-slate-300 text-slate-700 hover:bg-slate-50 py-2 sm:py-3 px-3 sm:px-4 rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
        >
          <Plus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
          Add Another Company
        </button>

        {/* Error Message */}
        {errors.submit && (
          <div className="p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs sm:text-sm text-red-600">{errors.submit}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || isSubmitting}
          className="w-full bg-slate-600 hover:bg-slate-700 text-white py-2 sm:py-3 px-3 sm:px-4 rounded-lg focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium text-sm sm:text-base"
        >
          {(isLoading || isSubmitting) ? (
            <>
              <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Company Information'
          )}
        </button>
      </form>
    </div>
  );
};

export default UserCompanyForm;