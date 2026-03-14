"use client"

import { Suspense } from 'react'
import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, User, Lock, Info, ArrowRight, ArrowLeft, Check, Loader2 } from 'lucide-react';
import ImageCropper from '@/app/_components/ImageCropper';
import { useRouter } from 'next/navigation';
import { useIdentityStore } from '@/stores/activeIdentityStore';
import { signIn, getSession } from "next-auth/react"
import { useSearchParams } from 'next/navigation';

const LoadingSpinner = () => (
  <div className="flex items-center justify-center space-x-2">
    <Loader2 className="w-5 h-5 animate-spin text-white" />
    <span className="text-white">Processing...</span>
  </div>
);

function SignUpComponent() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');

  const router = useRouter();

  const loadInitialIdentity = useIdentityStore.getState().loadInitialIdentity;

  
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    confirmPassword: '',
    bio: '',
  });

  const [errors, setErrors] = useState({});
  const [usernameExists, setUsernameExists] = useState(false);

  // useEffect to clear any existing tokens when component mounts
useEffect(() => {
  // Clear any existing tokens when user arrives at signup page
  document.cookie = 'user_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  document.cookie = 'next-auth.session-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}, []);

  const validateStep1 = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers and underscores';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    if (name === 'username' && usernameExists) {
      setUsernameExists(false);
    }
  };

  const handleImageSelected = (file, previewUrl) => {
    setSelectedImageFile(file);
  };

  const handleImageUploaded = (filePath, url) => {
    setProfileImageUrl(filePath);
  };

  const checkUsernameExists = async (username) => {
    try {
      // You can use either endpoint since both now check USERNAMES table
      const response = await fetch(`/api/username/check?username=${encodeURIComponent(username)}`);
      const data = await response.json();
      return !data.available; // returns true if username exists
    } catch (error) {
      console.error('Error checking username:', error);
      return false;
    }
  };
  
  const handleStep1Next = async () => {
    if (!validateStep1()) return;
    
    setIsLoading(true);
    
    try {
      const exists = await checkUsernameExists(formData.username);
      if (exists) {
        setUsernameExists(true);
        setErrors(prev => ({
          ...prev,
          username: 'This username is already taken'
        }));
        setIsLoading(false);
        return;
      }
      
      setCurrentStep(2);
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        username: 'Error checking username availability'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!profileImageUrl) {
      setErrors(prev => ({ ...prev, profileImage: 'Profile picture is required' }));
      return;
    }
    
    setIsLoading(true);
    
    try {
      const payload = {
        name: formData.name,
        username: formData.username,
        password: formData.password,
        bio: formData.bio || null,
        profile_pic_url: profileImageUrl
      };
      
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        loadInitialIdentity();
        // Check if there's a redirect parameter (invite link)
        // if (redirect) {
        //   router.push(redirect);
        // } else {
        //   router.push('/communities');
        //   // router.push('/layers/4');
        // }
        router.push('/communities');
      } else {
        alert(data.message || 'Error creating account. Please try again.');
      }
    } catch (error) {
      console.error('Signup error:', error);
      alert('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setIsLoading(true);
      
      console.log("Starting Google signup");
      
      // Clear any existing tokens before starting OAuth
      document.cookie = 'user_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      document.cookie = 'next-auth.session-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      
      // Small delay to ensure cookies are cleared
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Start the Google OAuth flow - this will redirect away from your page
        await signIn('google', { 
          redirect: true,
          callbackUrl: redirect ? `/api/auth/google-signin?redirect=${encodeURIComponent(redirect)}` : '/api/auth/google-signin'
        });
      
      // This code won't be reached because signIn redirects to Google
      
    } catch (error) {
      console.error('Google signup error:', error);
      alert('Google signup failed. Please try again.');
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Create your account</h1>
        <p className="text-gray-600">Join our community and start your journey</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your full name"
            />
          </div>
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Username
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.username ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Choose a username"
            />
          </div>
          {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
          {!errors.username && (
            <p className="mt-1 text-xs text-gray-600">
              Username must be unique and can only contain letters, numbers and underscores
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Create a password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Confirm your password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
        </div>
      </div>

      <button
        onClick={handleStep1Next}
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
      >
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            <span>Continue</span>
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>

      <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-300" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-2 bg-white text-gray-500">or</span>
      </div>
    </div>

    <button
      type="button"
      onClick={handleGoogleSignup}
      disabled={isLoading}
      className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors flex items-center justify-center space-x-2 mb-3"
    >
      {isLoading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700"></div>
      ) : (
        <>
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </>
      )}
    </button>

    <button
      type="button"
      onClick={() => window.location.href = '/onboarding/follow'}
      className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
    >
      Continue as Guest
    </button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Complete your profile</h1>
        <p className="text-gray-600">Add some details about yourself</p>
      </div>

      <div className="space-y-6">
        <div className="border-b border-gray-100 pb-6">
          <ImageCropper
            onImageSelected={handleImageSelected}
            onImageUploaded={handleImageUploaded}
            title="Profile Picture"
            description="Upload a profile picture to personalize your account (required)"
            autoUpload={true}
            cropperSize={200}
            required={true}
          />
          {errors.profileImage && (
            <p className="mt-2 text-sm text-red-600">{errors.profileImage}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bio <span className="text-gray-500">(Optional)</span>
          </label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
            placeholder="Tell us a bit about yourself..."
          />
          <p className="mt-1 text-xs text-gray-600">
            Share your interests, profession, or anything you&apos;d like others to know
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
        <button
          onClick={() => setCurrentStep(1)}
          className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
        <button
          onClick={handleFinalSubmit}
          disabled={isLoading}
          className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? <LoadingSpinner /> : 'Create Account'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Step {currentStep} of 2</span>
              <span>{currentStep === 1 ? 'Account Details' : 'Profile Setup'}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 2) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="p-6">
            {currentStep === 1 ? renderStep1() : renderStep2()}
          </div>
        </div>

        <div className="text-center mt-6 text-sm text-gray-600">
          <button 
            onClick={() => router.push(redirect ? `/auth/login?redirect=${encodeURIComponent(redirect)}` : '/auth/login')}
            className="..." // your existing classes
          >
            Already have an account? Login
          </button>
        </div>
      </div>
    </div>
  );
}

// ✅ Wrap with Suspense
export default function SignUpPage() {
  return (
    <Suspense fallback={<div>Loading signup page...</div>}>
      <SignUpComponent />
    </Suspense>
  );
}