import React from 'react';
import { createPortal } from 'react-dom';
import { X, Users, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

const GuestSignupModal = ({ isOpen, onClose, feature = "this feature" }) => {
  const router = useRouter();

  if (!isOpen) return null;

  const handleSignupClick = () => {
    onClose();
    router.push('/auth/signup');
  };

  const handleLoginClick = () => {
    onClose();
    router.push('/auth/login');
  };

  // The actual modal UI
  const modalContent = (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 opacity-10"></div>
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 pt-12 relative">
          {/* Icon */}
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-white" />
          </div>

          {/* Content */}
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Join Mapogram to Continue
            </h3>
            <p className="text-gray-600 leading-relaxed">
              To access <span className="font-semibold text-gray-800">{feature}</span>, you&apos;ll need to create an account. 
              Join thousands of users exploring and sharing amazing content!
            </p>
          </div>

          {/* Features list */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex items-center space-x-3 text-sm text-gray-700">
              <Users className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <span>Connect with friends and communities</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-700 mt-2">
              <Sparkles className="w-4 h-4 text-purple-500 flex-shrink-0" />
              <span>Create and share your own pages</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <button
              onClick={handleSignupClick}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
            >
              Create Account
            </button>
            
            <button
              onClick={handleLoginClick}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-xl font-semibold transition-all duration-200"
            >
              Already have an account? Sign In
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            It&apos;s free and takes less than a minute!
          </p>
        </div>
      </div>
    </div>
  );

  // Render in body using a portal
  return typeof window !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null;
};

export default GuestSignupModal;
