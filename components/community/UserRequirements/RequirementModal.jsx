"use client";
import React, { useState } from 'react';
import { X } from 'lucide-react';
import UserCompanyForm from './RequirementForms/UserCompanyForm';

const RequirementModal = ({ isOpen, onClose, requirementData, communityId, onComplete }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !requirementData) return null;

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      // Mark requirement as completed
      const response = await fetch('/api/user/community/complete-requirement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          communityId,
          requirementType: requirementData.requirement_type,
        }),
      });

      if (response.ok) {
        onComplete();
      } else {
        console.error('Failed to mark requirement as complete');
      }
    } catch (error) {
      console.error('Error completing requirement:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderRequirementContent = () => {
    switch (requirementData.requirement_type) {
      case 'user_company':
        return (
          <UserCompanyForm
            onSuccess={handleComplete}
            isSubmitting={isSubmitting}
          />
        );
      
      // Add more requirement types here in the future
      // case 'user_restaurant':
      //   return <UserRestaurantForm onSuccess={handleComplete} />;
      
      default:
        return (
          <div className="text-center py-4 sm:py-6">
            <p className="text-sm text-gray-600">Unknown requirement type: {requirementData.requirement_type}</p>
            <button
              onClick={onClose}
              className="mt-3 px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-500 text-white text-sm rounded-lg hover:bg-slate-600 transition-colors"
            >
              Close
            </button>
          </div>
        );
    }
  };

  const getModalTitle = () => {
    switch (requirementData.requirement_type) {
      case 'user_company':
        return 'Complete Your Company Profile';
      default:
        return 'Complete Required Information';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-6 border-b border-gray-200">
          <h2 className="text-base sm:text-xl font-semibold text-gray-900 pr-2">
            {getModalTitle()}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
            disabled={isSubmitting}
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-6">
          <div className="mb-3 sm:mb-4">
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              To participate fully in this community, please complete the following requirement:
            </p>
          </div>
          
          {renderRequirementContent()}
        </div>
      </div>
    </div>
  );
};

export default RequirementModal;