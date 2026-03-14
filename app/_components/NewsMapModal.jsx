import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Map, MapPin, Globe, Filter, Languages, RefreshCw, Plus, Minus, Layers, Navigation, Eye, Calendar } from 'lucide-react';

const NewsMapModal = ({ isOpen, onClose, forceOpen = false }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [shouldShow, setShouldShow] = useState(false);
  const hasProcessedRef = useRef(false); // Prevent multiple processing

  useEffect(() => {
    if (isOpen && !hasProcessedRef.current) {
      hasProcessedRef.current = true;
      
      // Check visit count from localStorage
      const visitCount = parseInt(localStorage.getItem('newsMapVisits') || '0');
      
      if (forceOpen) {
        // If force opened, always show without incrementing
        setShouldShow(true);
      } else if (visitCount < 2) {
        // Show modal and increment visit count
        setShouldShow(true);
        localStorage.setItem('newsMapVisits', (visitCount + 1).toString());
      } else {
        // Don't show if already visited 2 times
        setShouldShow(false);
        onClose();
      }
    }
    
    // Reset the ref when modal is closed
    if (!isOpen) {
      hasProcessedRef.current = false;
    }
  }, [isOpen, forceOpen, onClose]);

  const slides = [
    {
      id: 'overview',
      title: 'Welcome to News On Map',
      icon: <Globe className="w-8 h-8 text-red-800" />,
      content: (
        <div className="space-y-4">
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h3 className="font-semibold text-red-900 mb-2 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Interactive News Discovery
            </h3>
            <p className="text-red-800 text-sm leading-relaxed">
              Explore real-time news events happening around the world through an interactive map interface. 
              Each marker represents a news story at its exact location.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white p-3 rounded border border-red-200">
              <div className="flex items-center mb-2">
                <Map className="w-4 h-4 text-red-600 mr-2" />
                <span className="font-medium text-red-900 text-sm">Visual Navigation</span>
              </div>
              <p className="text-gray-600 text-xs">Click markers to read news summaries and access full articles</p>
            </div>
            
            <div className="bg-white p-3 rounded border border-red-200">
              <div className="flex items-center mb-2">
                <Filter className="w-4 h-4 text-red-600 mr-2" />
                <span className="font-medium text-red-900 text-sm">Smart Filtering</span>
              </div>
              <p className="text-gray-600 text-xs">Filter by category, language, and location preferences</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'map-features',
      title: 'Map Controls & Navigation',
      icon: <Navigation className="w-8 h-8 text-red-800" />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="font-semibold text-red-900 mb-3 flex items-center">
                <Layers className="w-5 h-5 mr-2" />
                Map Views
              </h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-red-600 rounded-full mr-2"></div>
                  <span className="text-sm text-red-800">Map View - Standard street map</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-red-600 rounded-full mr-2"></div>
                  <span className="text-sm text-red-800">Satellite View - Aerial imagery</span>
                </div>
              </div>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="font-semibold text-red-900 mb-3 flex items-center">
                <Eye className="w-5 h-5 mr-2" />
                Zoom Controls
              </h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Plus className="w-4 h-4 text-red-600 mr-2" />
                  <span className="text-sm text-red-800">Zoom In - See more details</span>
                </div>
                <div className="flex items-center">
                  <Minus className="w-4 h-4 text-red-600 mr-2" />
                  <span className="text-sm text-red-800">Zoom Out - Wider view</span>
                </div>
                <div className="flex items-center">
                  <RefreshCw className="w-4 h-4 text-red-600 mr-2" />
                  <span className="text-sm text-red-800">World View - Reset to world view</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded border border-red-200">
            <h4 className="font-medium text-red-900 mb-2">Gesture Controls</h4>
            <p className="text-gray-600 text-sm">Use pinch to zoom, drag to pan, and all standard map gestures for navigation.</p>
          </div>
        </div>
      )
    },
    {
      id: 'markers-clustering',
      title: 'News Markers & Clustering',
      icon: <MapPin className="w-8 h-8 text-red-800" />,
      content: (
        <div className="space-y-4">
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h3 className="font-semibold text-red-900 mb-3">Smart Marker System</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-red-800 mb-2">Individual Markers</h4>
                <p className="text-sm text-gray-700 mb-2">Each marker represents a news story with category-specific icons:</p>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center"><span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>Different colored markers for different categories</div>
                  <div className="flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>Each with unique icons representing the news type</div>
                  <div className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>Easy visual identification of story types</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-red-800 mb-2">Clustering Feature</h4>
                <p className="text-sm text-gray-700 mb-2">When zoomed out, nearby markers cluster together:</p>
                <div className="bg-white p-3 rounded border">
                  <div className="flex items-center justify-center">
                    <div className="relative">
                      {/* SVG Map Pin */}
                      <svg width="32" height="42" viewBox="0 0 32 42" className="drop-shadow-lg">
                        <defs>
                          <filter id="pin-shadow" x="-30%" y="-30%" width="160%" height="160%">
                            <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.4" />
                          </filter>
                        </defs>
                        
                        {/* Main pin shape */}
                        <path 
                          d="M 16,4 C 25.6,4 30.4,21 16,40 C 1.6,21 6.4,4 16,4 Z"
                          fill="#7C3AED"
                          stroke="white"
                          strokeWidth="2"
                          filter="url(#pin-shadow)"
                        />
                        
                        {/* News icon inside pin */}
                        <g transform="translate(10, 8)">
                          <rect x="0" y="0" width="12" height="1.5" fill="white"/>
                          <rect x="0" y="4" width="12" height="1.5" fill="white"/>
                          <rect x="0" y="8" width="12" height="1.5" fill="white"/>
                        </g>
                      </svg>
                      
                      {/* Count Badge */}
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold border-2 border-white">5</div>
                    </div>
                  </div>
                  <p className="text-xs text-center mt-2 text-gray-600">Map pin-shaped markers with news icon and count badge</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded border border-red-200">
            <h4 className="font-medium text-red-900 mb-2">How to Use</h4>
            <div className="space-y-2 text-sm text-gray-700">
              <p>• Click individual markers to see news cards with titles, images, and summaries</p>
              <p>• Click clustered markers to zoom in and see individual stories</p>
              <p>• Use &quot;Read More&quot; button to access the full original article</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'filters',
      title: 'Filtering Options',
      icon: <Filter className="w-8 h-8 text-red-800" />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="font-semibold text-red-900 mb-3 flex items-center">
                <Filter className="w-5 h-5 mr-2" />
                Category Filter
              </h3>
              <p className="text-sm text-red-800 mb-3">Filter news by topic categories:</p>
              <div className="space-y-2">
                <div className="bg-white p-2 rounded text-xs">
                  <span className="font-medium">Multiple Categories Available:</span> Filter by various news topics like crime, politics, sports, technology, health, business, and more
                </div>
                <div className="text-xs text-red-700">
                  • All categories selected by default
                  <br />• Select/deselect individual or multiple categories
                  <br />• Only selected categories will show on map
                </div>
              </div>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="font-semibold text-red-900 mb-3 flex items-center">
                <Languages className="w-5 h-5 mr-2" />
                Language Filter
              </h3>
              <p className="text-sm text-red-800 mb-3">Filter news by publication language:</p>
              <div className="space-y-2">
                <div className="bg-white p-2 rounded text-xs">
                  <span className="font-medium">Multi-language Support:</span> Filter news by various languages from around the world
                </div>
                <div className="text-xs text-red-700">
                  • All languages included by default
                  <br />• Choose single or multiple languages
                  <br />• Perfect for regional news focus
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded border border-red-200">
            <h4 className="font-medium text-red-900 mb-2 flex items-center">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset & Refresh
            </h4>
            <p className="text-gray-600 text-sm">
              Use the &quot;World View&quot; button to reset all filters, reload fresh content, and return to the world map view.
            </p>
          </div>
        </div>
      )
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const handleClose = () => {
    setShouldShow(false);
    onClose();
    setCurrentSlide(0)
  };

  if (!shouldShow) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-red-800 text-white p-4 sm:p-6 flex items-center justify-between">
          <div className="flex items-center">
            {slides[currentSlide].icon}
            <h2 className="text-lg sm:text-xl font-bold ml-3">{slides[currentSlide].title}</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:text-red-200 transition p-1"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Indicators */}
        <div className="bg-red-100 px-4 sm:px-6 py-3">
          <div className="flex justify-center space-x-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentSlide 
                    ? 'bg-red-800 scale-110' 
                    : 'bg-red-300 hover:bg-red-400'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh]">
          {slides[currentSlide].content}
        </div>

        {/* Footer Navigation */}
        <div className="bg-gray-50 px-4 sm:px-6 py-4 flex justify-between items-center border-t">
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              currentSlide === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-red-100 text-red-800 hover:bg-red-200'
            }`}
          >
            Previous
          </button>

          <div className="text-sm text-gray-600">
            {currentSlide + 1} of {slides.length}
          </div>

          {currentSlide === slides.length - 1 ? (
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-red-800 text-white rounded-md text-sm font-medium hover:bg-red-900 transition"
            >
              Get Started
            </button>
          ) : (
            <button
              onClick={nextSlide}
              className="px-4 py-2 bg-red-800 text-white rounded-md text-sm font-medium hover:bg-red-900 transition"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Hook for managing modal state and visit tracking
export const useNewsMapModal = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [forceOpen, setForceOpen] = useState(false);
  const hasInitializedRef = useRef(false);
  const hasCheckedRef = useRef(false);

  // Initialize localStorage only once
  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      if (!localStorage.getItem('newsMapVisits')) {
        localStorage.setItem('newsMapVisits', '0');
      }
    }
  }, []);

  const openModal = (force = false) => {
    setForceOpen(force);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setForceOpen(false);
  };

  // Auto-open modal on first component mount (for new visits)
  const checkAndOpenModal = useCallback(() => {
    if (hasCheckedRef.current || !hasInitializedRef.current) return; // Prevent multiple checks
    
    hasCheckedRef.current = true;
    
    const visitCount = parseInt(localStorage.getItem('newsMapVisits') || '0');
    console.log('Current visit count:', visitCount); // Debug log
    
    if (visitCount < 2) {
      // Add a small delay to ensure component is fully mounted
      setTimeout(() => {
        openModal(false);
      }, 100);
    }
  }, []);

  // Reset check flag when component unmounts
  useEffect(() => {
    return () => {
      hasCheckedRef.current = false;
    };
  }, []);

  return {
    isModalOpen,
    forceOpen,
    openModal,
    closeModal,
    checkAndOpenModal
  };
};

export default NewsMapModal;