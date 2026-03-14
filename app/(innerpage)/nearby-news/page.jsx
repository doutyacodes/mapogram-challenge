"use client"
import ReactDOMServer from "react-dom/server";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useMediaQuery } from 'react-responsive';
import { GoogleMap, useLoadScript, MarkerF, InfoWindowF, Circle  } from "@react-google-maps/api";
import { 
    MapPin, AlertTriangle, Building2, UserRound, Car, Cloud, 
    PartyPopper, Swords, Megaphone, AlertCircle, Trophy, 
    Heart, Briefcase, Film, Laptop, FlaskConical, GraduationCap, 
    Leaf, Users, Train, Globe,
    BadgeDollarSign,
    Ambulance,
    Clapperboard,
    Shield,
    Rocket,
    Shirt,
    BellRing,
    Flag,
    PawPrint,
    X,
    Loader2,
    Newspaper,
    Tag,
    HardHat,
    Vote,
    Calendar,
    Flame,
    ShieldCheck,
    Bus,
    Siren,
    CloudRain,
    Search
  } from "lucide-react";
import { redirect, useRouter } from "next/navigation";
import CreatorPopupModal from "@/app/_components/CreatorPopupModal";

// Map container styles
const containerStyle = {
  width: "100%",
  height: "calc(100vh - 80px)",
};

// Default center position (world view)
const center = {
  lat: 20,
  lng: 0,
};


// // Category icons mapping using Lucide React components
// const categoryIcons = {
//   "News": <Newspaper size={24} className="text-blue-600" />,
//   // "Ads": <Tag size={24} className="text-green-600" />,
//   "Default": <Globe size={24} className="text-gray-500" />
// };

// // Category colors for map markers or other UI elements
// const categoryColors = {
//   "News": "#1E90FF",    // Dodger Blue
//   // "Ads": "#2E8B57",     // Sea Green
//   "Default": "#A52A2A"  // Brown
// };

// Category icons mapping using Lucide React components
// const categoryIcons = {
//   "News": <Newspaper size={24} className="text-blue-600" />,
//   "Alert": <AlertTriangle size={24} className="text-red-600" />,
//   "Emergency": <Siren size={24} className="text-red-700" />,
//   "Weather": <Cloud size={24} className="text-sky-500" />,
//   "Construction": <HardHat size={24} className="text-yellow-600" />,
//   "Crime": <Shield size={24} className="text-red-500" />,
//   "Politics": <Vote size={24} className="text-purple-600" />,
//   "Events": <Calendar size={24} className="text-indigo-600" />,
//   "Health": <Heart size={24} className="text-pink-600" />,
//   "Sports": <Trophy size={24} className="text-amber-600" />,
//   "Environment": <Leaf size={24} className="text-green-500" />,
//   "Fire": <Flame size={24} className="text-red-600" />,
//   "Police": <ShieldCheck size={24} className="text-blue-700" />,
//   "Public Transport": <Bus size={24} className="text-blue-400" />,
//   "Festival": <PartyPopper size={24} className="text-pink-500" />,
//   "Default": <Globe size={24} className="text-gray-500" />
// };

// // Category colors for map markers or other UI elements
// const categoryColors = {
//   "News": "#2563EB",        // Blue-600
//   "Alert": "#DC2626",       // Red-600
//   "Emergency": "#B91C1C",   // Red-700
//   "Weather": "#0EA5E9",     // Sky-500
//   "Construction": "#CA8A04", // Yellow-600
//   "Crime": "#EF4444",       // Red-500
//   "Politics": "#9333EA",    // Purple-600
//   "Events": "#4F46E5",      // Indigo-600
//   "Health": "#EC4899",      // Pink-600
//   "Sports": "#F59E0B",      // Amber-600
//   "Environment": "#22C55E", // Green-500
//   "Fire": "#DC2626",        // Red-600
//   "Police": "#1D4ED8",      // Blue-700
//   "Public Transport": "#60A5FA", // Blue-400
//   "Festival": "#EC4899",    // Pink-500
//   "Default": "#6B7280"      // Gray-500
// };

// Category icons mapping using Lucide React components for local community news
const categoryIcons = {
  "News": <Newspaper size={24} className="text-blue-600" />,
  "Alert": <AlertTriangle size={24} className="text-red-600" />,
  "Emergency": <Siren size={24} className="text-red-700" />,
  "Weather": <CloudRain size={24} className="text-sky-500" />,
  "Events": <Calendar size={24} className="text-purple-600" />,
  "Festival": <PartyPopper size={24} className="text-pink-500" />,
  "Obituary": <Heart size={24} className="text-gray-700" />,
  "Public Notice": <Megaphone size={24} className="text-orange-600" />,
  "Lost & Found": <Search size={24} className="text-teal-600" />,
  "Ads": <Tag size={24} className="text-green-600" />,
  "Default": <Globe size={24} className="text-gray-500" />
};

// Category colors for map markers or other UI elements
const categoryColors = {
  "News": "#2563EB",         // Blue-600
  "Alert": "#DC2626",        // Red-600
  "Emergency": "#B91C1C",    // Red-700
  "Weather": "#0EA5E9",      // Sky-500
  "Events": "#9333EA",       // Purple-600
  "Festival": "#EC4899",     // Pink-500
  "Obituary": "#374151",     // Gray-700
  "Public Notice": "#EA580C", // Orange-600
  "Lost & Found": "#0D9488", // Teal-600
  "Ads": "#16A34A",          // Green-600
  "Default": "#6B7280"       // Gray-500
};

// Category descriptions for reference
const categoryDescriptions = {
  "News": "General local news and updates",
  "Alert": "Important community alerts and warnings",
  "Emergency": "Emergency situations and urgent notices",
  "Weather": "Local weather updates and warnings",
  "Events": "Community events and gatherings",
  "Festival": "Local festivals and celebrations",
  "Obituary": "Community obituaries and memorials",
  "Public Notice": "Official announcements and public notices",
  "Lost & Found": "Lost items, missing persons, found items",
  "Ads": "Local advertisements and promotions",
  "Default": "Uncategorized content"
};

const createCategoryMarkerIcon = (category, newsCount = 0) => {
  const color = category ? categoryColors[category] || categoryColors.Default : categoryColors.Default;
  
  // Get the corresponding icon for the category
    // Get the corresponding icon for the category
    let IconComponent;
  
     switch(category) {
    case "News":
      IconComponent = Newspaper;
      break;
    // case "Ads":
    //   IconComponent = Tag;
    //   break;
    default:
      IconComponent = Globe;
  }
  
  // Create SVG string from the icon component with improved styling
  const iconSvg = ReactDOMServer.renderToString(
    <IconComponent color="white" size={22} strokeWidth={2.5} />
  );
  
  // Create the SVG marker with improved visibility
  return {
    url: `data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 58" width="48" height="58">
        <!-- Enhanced drop shadow filter -->
        <defs>
          <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" flood-opacity="0.4" />
          </filter>
        </defs>
        
        <!-- Marker background with stronger white border -->
        <path 
          d="M24 2C14.06 2 6 10.06 6 20c0 9.5 18 32 18 32s18-22.5 18-32c0-9.94-8.06-18-18-18z" 
          fill="${color}"
          stroke="white"
          stroke-width="3"
          filter="url(#shadow)"
        />
        
        <!-- Icon positioned in center of marker -->
        <g transform="translate(13, 11) scale(1)">${iconSvg}</g>
        
        <!-- Counter background circle for multiple items -->
        ${newsCount > 1 ? `
          <circle cx="36" cy="12" r="10" fill="white" stroke="#333" stroke-width="1.5" />
          <text x="36" y="16" font-family="Arial" font-size="12" font-weight="bold" text-anchor="middle" fill="#333">${newsCount}</text>
        ` : ''}
      </svg>
    `)}`,
    scaledSize: { width: 48, height: 58 },
    anchor: { x: 24, y: 52 },
    labelOrigin: { x: 24, y: 20 }
  };
};

// Group news by location
const groupNewsByLocation = (newsItems) => {
  const groupedNews = {};
  
  newsItems.forEach(news => {
    const locationKey = `${news.latitude},${news.longitude}`;
    
    if (!groupedNews[locationKey]) {
      groupedNews[locationKey] = [];
    }
    
    groupedNews[locationKey].push(news);
  });
  
  // Sort each group by created_at (newest first)
  Object.keys(groupedNews).forEach(key => {
    groupedNews[key].sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    );
  });
  
  return groupedNews;
};

// Replace your existing FilterPanel component with this updated version:

const FilterPanel = ({ selectedCategories, setSelectedCategories, buttonStyle, isMobile }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Function to toggle category selection
  const toggleCategory = (category) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(cat => cat !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  // Select all categories
  const selectAllCategories = () => {
    setSelectedCategories(Object.keys(categoryIcons).filter(cat => cat !== 'Default'));
  };

  // Clear all categories
  const clearAllCategories = () => {
    setSelectedCategories([]);
  };

  return (
    <div className="absolute top-3 right-4 z-10">
      {/* Fixed position toggle button for both mobile and desktop */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-white shadow-md rounded-lg p-2 hover:bg-gray-100 transition-colors duration-200 mb-2 w-full flex items-center justify-center"
        style={buttonStyle}
      >
        <span>{isExpanded ? 'Hide Filters' : 'Show Filters'}</span>
      </button>

      {/* Filter Container with opacity - positioned differently based on device */}
      {isExpanded && (
        <div 
          className={`bg-white/70 backdrop-blur-sm shadow-lg rounded-lg p-4 max-h-[70vh] overflow-y-auto w-64 max-w-[calc(100vw-2rem)] ${isMobile ? 'absolute top-12 right-0' : ''}`}
        >
          <div className="flex justify-between items-center mb-3 border-b pb-2">
            <h3 className="text-lg font-semibold">News Filters</h3>
            <div className="flex gap-2">
              <button 
                onClick={selectAllCategories}
                className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
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
            {Object.entries(categoryIcons).map(([category, icon]) => (
              category !== 'Default' && (
                <div 
                  key={category} 
                  className="flex items-center space-x-3 hover:bg-gray-50/90 p-2 rounded transition-colors cursor-pointer"
                  onClick={() => toggleCategory(category)}
                >
                  {/* Checkbox */}
                  <input 
                    type="checkbox" 
                    checked={selectedCategories.includes(category)}
                    onChange={() => {}} // Handled by the div click
                    className="w-4 h-4 text-blue-600"
                  />
                  
                  {/* Icon */}
                  <div 
                    className="w-8 h-8 flex items-center justify-center rounded-full"
                    style={{ 
                      backgroundColor: categoryColors[category] || categoryColors.Default,
                      color: 'white'
                    }}
                  >
                    {React.cloneElement(icon, { 
                      size: 20, 
                      strokeWidth: 2.5,
                      color: 'white'
                    })}
                  </div>
                  <span className="text-sm text-gray-700">{category}</span>
                </div>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function NewsMap() {
  const [newsItems, setNewsItems] = useState([]);
  const [groupedNews, setGroupedNews] = useState({});
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const [mapBounds, setMapBounds] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapRef, setMapRef] = useState(null);

  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);

  const [selectedCategories, setSelectedCategories] = useState(
    Object.keys(categoryIcons).filter(cat => cat !== 'Default')
  );

  const router = useRouter()

  const [initialCheckDone, setInitialCheckDone] = useState(false);

  const [showLocationPrompt, setShowLocationPrompt] = useState(false);

  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const [showCreatorModal, setShowCreatorModal] = useState(true);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  const timeoutRef = useRef(null);

  const MAX_RADIUS_KM = 10; // 10km radius limit
  const EARTH_RADIUS_KM = 6371; // Earth's radius in kilometers
  const USER_LOCATION_ZOOM = 14; // Zoom level when user location is available
  const DEFAULT_ZOOM = 10; // Default zoom level
  // Add buffer factor to create extended restriction bounds
  const BUFFER_FACTOR = 1.5; // Allow 50% more area beyond the data radius

  useEffect(()=>{
    redirect("/")
  },[])


  // Load Google Maps script
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  });

  const mapControlStyles = {
    // Common styles for both map type and filter buttons
    button: {
      minWidth: '100px',
      height: '38px',
      '@media (max-width: 640px)': {
        minWidth: '80px',
        height: '34px',
        fontSize: '0.875rem',
      }
    }
  };

  // Then inside your component function
  const isMobile = useMediaQuery({ maxWidth: 640 });

  // Use this to conditionally apply styles
  const buttonStyle = {
    minWidth: isMobile ? '80px' : '100px',
    height: isMobile ? '34px' : '38px'
  };

  // Add this utility function to calculate distance between coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = EARTH_RADIUS_KM * c; // Distance in km
  
  return distance;
};

// Add this function to restrict map boundaries
const restrictMapBounds = useCallback(() => {
  if (!mapRef || !userLocation) return;
  
  const currentCenter = mapRef.getCenter();
  const currentLat = currentCenter.lat();
  const currentLng = currentCenter.lng();
  
  const distance = calculateDistance(
    userLocation.lat, 
    userLocation.lng, 
    currentLat, 
    currentLng
  );
  
  // If user tries to move beyond 10km, move them back
  if (distance > MAX_RADIUS_KM) {
    // Calculate direction from user location to current position
    const angle = Math.atan2(
      currentLat - userLocation.lat,
      currentLng - userLocation.lng
    );
    
    // Set new position at the edge of the allowed circle
    const newLat = userLocation.lat + (Math.sin(angle) * MAX_RADIUS_KM / 111); // 1 degree lat ≈ 111km
    const newLng = userLocation.lng + (Math.cos(angle) * MAX_RADIUS_KM / 
      (111 * Math.cos(userLocation.lat * Math.PI / 180))); // Adjust for longitude at that latitude
    
    mapRef.panTo({ lat: newLat, lng: newLng });
  }
}, [mapRef, userLocation]);

  // Fetch news data based on map bounds
    const fetchNewsData = useCallback(async (bounds) => {
    // Don't attempt to fetch data if we don't have user location
    if (!userLocation) {
        console.log("No user location available, skipping fetch");
        return;
    }

    try {
        setIsLoading(true);
        
        // Create bounds parameters if available
        let url = '/api/nearby-news/map';
        
        if (bounds) {
        const { north, south, east, west } = bounds;
        url += `?north=${north}&south=${south}&east=${east}&west=${west}&userLat=${userLocation.lat}&userLng=${userLocation.lng}&radius=${MAX_RADIUS_KM}`;
        } else {
        // Always include user location
        url += `?userLat=${userLocation.lat}&userLng=${userLocation.lng}&radius=${MAX_RADIUS_KM}`;
        }
                const response = await fetch(url);
        
        if (!response.ok) {
        throw new Error('Failed to fetch news data');
        }
        
        const data = await response.json();
        setNewsItems(data);
        
        // Group news by location
        const grouped = groupNewsByLocation(data);
        setGroupedNews(grouped);
    } catch (err) {
        console.error("Error fetching news:", err);
        setError("Failed to load news data");
    } finally {
        setIsLoading(false);
    }
    }, [userLocation]); // We do need userLocation in the dependency array

  // Updated to handle modal states
  const getCurrentPosition = () => {
    console.log("Getting User Location")
    setIsGettingLocation(true); 
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        console.log("latitude, longitude", latitude, longitude)
        console.log("Setting User Location")
        // If map is available, pan and zoom to user location
        if (mapRef) {
          mapRef.panTo({ lat: latitude, lng: longitude });
          mapRef.setZoom(USER_LOCATION_ZOOM);
        }
        console.log("Initiate Fetch news")
        fetchNewsData();

        // Hide modal and reset loading state
        setShowLocationPrompt(false);
        setIsLoading(false);
        setIsGettingLocation(false);
      },
      (error) => {
        console.error("Error getting user location:", error);
        setLocationError("Failed to get your location. Please try again or use the default view.");
        setLocationLoading(false);
      }
    );
  };

  // Get user's location
  const getUserLocation = useCallback(() => {
    console.log("Initiate User Location fuction")

      if (navigator.geolocation) {
        navigator.permissions
          .query({ name: "geolocation" })
          .then((permissionStatus) => {
            if (permissionStatus.state === "granted") {
              console.log("Granted User Location fuction")
              // Permission already granted, get location
              getCurrentPosition();
            } else if (permissionStatus.state === "prompt") {
              // Show our custom modal instead of the browser prompt
              setIsLoading(false);
              setShowLocationPrompt(true);
            } else if (permissionStatus.state === "denied") {
              // If permission is already denied, just use default view
              console.log("Location permission was previously denied");
            }
          })
          .catch(err => {
            console.error("Error checking location permission:", err);
          });
      }
    }, []);

    // Initial data fetch and location request
    useEffect(() => {
      getUserLocation();
    }, []);

    // Only fetch data when user location is available and not when prompt is showing
    useEffect(() => {
      if (userLocation && !showLocationPrompt) {
        fetchNewsData();
      }
    }, [userLocation]);
  

  // Handle map bounds change
    const handleBoundsChanged = (map) => {
    // Only process if we have user location
    if (!userLocation) return;

    const bounds = map.getBounds();
    if (bounds) {
        const newBounds = {
        north: bounds.getNorthEast().lat(),
        south: bounds.getSouthWest().lat(),
        east: bounds.getNorthEast().lng(),
        west: bounds.getSouthWest().lng()
        };
        
        // Only fetch if bounds have changed significantly
        if (!mapBounds || 
            Math.abs(newBounds.north - mapBounds.north) > 0.5 ||
            Math.abs(newBounds.south - mapBounds.south) > 0.5 ||
            Math.abs(newBounds.east - mapBounds.east) > 0.5 ||
            Math.abs(newBounds.west - mapBounds.west) > 0.5) {
        setMapBounds(newBounds);
        fetchNewsData(newBounds);
        }
    }
    };

  const truncate = (text, length = 100) => {
    if (!text) return "";
      return text.length > length ? text.slice(0, length) + "..." : text;
  };


  // Handle marker click
  const handleMarkerClick = (locationKey, index = 0) => {
    const [lat, lng] = locationKey.split(',').map(parseFloat);
    setSelectedLocation({ key: locationKey, lat, lng });
    setCurrentNewsIndex(index);
  };

  // Navigate through news at the same location
  const handleNextNews = () => {
    if (selectedLocation && groupedNews[selectedLocation.key]) {
      const maxIndex = groupedNews[selectedLocation.key].length - 1;
      setCurrentNewsIndex((prev) => (prev < maxIndex ? prev + 1 : prev));
    }
  };

  const handlePrevNews = () => {
    setCurrentNewsIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  // Open article in new tab
  const openArticle = (id) => {
    window.open(`/nearby-news/article/${id}`, '_blank');
  };

      // Handle allow button click in modal
  const handleAllowLocation = () => {
    setLocationLoading(true);
    setLocationError(null);
    getCurrentPosition();
  };

  // In your existing map page component:
const handleNavigateToCreator = () => {
  // Navigate to your creator page
  router.push('/nearby-news/home');
};

  // Add this component inside your NewsMap function 
  const LocationPrompt = () => {
    const router = useRouter();
    const [countdown, setCountdown] = useState(null);
    const [showRedirectMessage, setShowRedirectMessage] = useState(false);
    
    // Start countdown when redirecting
    useEffect(() => {
      if (showRedirectMessage) {
        let timeLeft = 5;
        setCountdown(timeLeft);
        
        const timer = setInterval(() => {
          timeLeft -= 1;
          setCountdown(timeLeft);
          
          if (timeLeft <= 0) {
            clearInterval(timer);
            router.push('/');
          }
        }, 1000);
        
        return () => clearInterval(timer);
      }
    }, [showRedirectMessage, router]);

    const handleCancel = () => {
      // User clicked "Cancel" - show redirect message
      setShowRedirectMessage(true);
    };

    // If we're showing the redirect message
    if (showRedirectMessage) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-fadeIn">
            <div className="mb-6">
              <div className="flex justify-center mb-4">
                <MapPin className="h-12 w-12 text-red-800" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">Redirecting</h3>
              <p className="text-gray-700 mb-4 text-center">
                This feature requires location access to work properly. You&apos;re being redirected to News Maps page.
              </p>
              <div className="p-3 bg-red-50 border border-red-100 rounded text-red-700 text-center font-medium">
                Redirecting in {countdown} seconds...
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Default location prompt
    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-fadeIn">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold text-gray-800">Location Permission Required</h3>
          </div>
          
          <div className="mb-6">
            <div className="flex justify-center mb-4">
              <MapPin className="h-12 w-12 text-red-800" />
            </div>
            <p className="text-gray-700 mb-3">
              This feature requires your location. You can only see news within 10km of where you are.
            </p>
            <p className="text-gray-600 text-sm italic mb-2">
              Not allowing location access will redirect you to the News Maps page.
            </p>
            {locationError && (
              <div className="mt-2 p-3 bg-red-50 border border-red-100 rounded text-red-700 text-sm">
                {locationError}
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={handleAllowLocation}
              disabled={locationLoading}
              className="w-full px-4 py-2 bg-red-800 text-white rounded-md hover:bg-red-700 transition focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {locationLoading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="animate-spin mr-2 h-5 w-5" />
                  Getting Location...
                </span>
              ) : (
                'Allow Location Access'
              )}
            </button>
            <button
              onClick={handleCancel}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };


  // Custom Map Type Controls Component
  const MapTypeControls = ({ mapRef }) => {
  const [mapType, setMapType] = useState("roadmap");
  const [isExpanded, setIsExpanded] = useState(false);
  
  // State to track if the screen is in mobile view
  const [isMobile, setIsMobile] = useState(false);
  
  // Effect to check screen size and update isMobile state
  useEffect(() => {
      const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768); // 768px is a common breakpoint for mobile
      };
      
      // Initial check
      checkScreenSize();
      
      // Add event listener for window resize
      window.addEventListener('resize', checkScreenSize);
      
      // Clean up
      return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const changeMapType = (type) => {
      if (!mapRef) return;
      mapRef.setMapTypeId(type);
      setMapType(type);
      setIsExpanded(false);
  };

  // Desktop view: Side-by-side buttons
  if (!isMobile) {
      return (
      <div className="absolute top-3 left-4 z-10 flex flex-row">
          <button 
          onClick={() => changeMapType("roadmap")}
          className={`bg-white shadow-md p-2 hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center rounded-l-lg border-r border-gray-200 ${mapType === "roadmap" ? "bg-gray-100" : ""}`}
          style={{
              ...buttonStyle,
              color: mapType === "roadmap" ? "black" : "rgba(0,0,0,0.5)",
              fontWeight: mapType === "roadmap" ? "500" : "normal"
          }}
          >
          Map
          </button>
          <button 
          onClick={() => changeMapType("satellite")}
          className={`bg-white shadow-md p-2 hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center rounded-r-lg ${mapType === "satellite" ? "bg-gray-100" : ""}`}
          style={{
              ...buttonStyle,
              color: mapType === "satellite" ? "black" : "rgba(0,0,0,0.5)",
              fontWeight: mapType === "satellite" ? "500" : "normal"
          }}
          >
          Satellite
          </button>
      </div>
      );
  }
  
  // Mobile view: Dropdown menu
  return (
      <div className="absolute top-3 left-4 z-10 flex flex-col">
      {/* Main toggle button */}
      <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="bg-white shadow-md rounded-lg p-2 hover:bg-gray-100 transition-colors duration-200 mb-2 flex items-center justify-center"
          style={buttonStyle}
      >
          <span>{mapType === "roadmap" ? "Map" : "Satellite"}</span>
      </button>

      {/* Dropdown options */}
      {isExpanded && (
          <div className="bg-white shadow-lg rounded-lg overflow-hidden absolute top-12 left-0">
          <button 
              className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${mapType === "roadmap" ? "bg-gray-200" : ""}`}
              onClick={() => changeMapType("roadmap")}
          >
              Map
          </button>
          <button 
              className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${mapType === "satellite" ? "bg-gray-200" : ""}`}
              onClick={() => changeMapType("satellite")}
          >
              Satellite
          </button>
          </div>
      )}
      </div>
  );
  };

  // Loading state
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl font-medium">Loading Map...</div>
      </div>
    );
  }

  // Get current news item for the info window
  const getCurrentNewsItem = () => {
    if (!selectedLocation || !groupedNews[selectedLocation.key]) return null;
    return groupedNews[selectedLocation.key][currentNewsIndex];
  };

  const currentNews = getCurrentNewsItem();
  const selectedNewsGroup = selectedLocation ? groupedNews[selectedLocation.key] : [];
  const hasMultipleNews = selectedNewsGroup && selectedNewsGroup.length > 1;

  
  return (
    <div className="relative">
    {showCreatorModal && userLocation && !showLocationPrompt && (
      <CreatorPopupModal onNavigateToCreator={handleNavigateToCreator} />
    )}

    {/* Show location prompt if needed */}
    {/* {showLocationPrompt && <LocationPrompt />} */}
    {showLocationPrompt && !isLoading && <LocationPrompt />}


      {/* <MapLegend /> the legends */}
      {/* <FilterPanel 
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        buttonStyle = {buttonStyle}
        isMobile = {isMobile} */}
       {/* the filters */}
 
      {/* Be a creator button */}
      {/* <CreatorButton isMobile={isMobile} buttonStyle={buttonStyle} /> */}
{/* 
      <FilterPanel 
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        buttonStyle={buttonStyle}
        isMobile = {isMobile}
      />

      <CreatorButton 
        buttonStyle={buttonStyle} 
      /> */}

      {/* Button Container - replaces both FilterPanel and CreatorButton calls */}
<div className="absolute top-3 right-4 z-10 flex flex-col items-end gap-2">
  {/* Buttons Row */}
  <div className="flex gap-2 items-center">
    {/* Creator Button - Desktop only, hidden on mobile when filter expanded */}
    {!isMobile && (
      <button 
        onClick={() => router.push('/nearby-news/home')}
        className="bg-red-800 hover:bg-red-900 text-white shadow-md rounded-lg p-2 transition-colors duration-200 flex items-center justify-center"
        style={buttonStyle}
      >
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="mr-2"
        >
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
          <path d="m15 5 4 4"/>
        </svg>
        <span>Be a Creator</span>
      </button>
    )}

    {/* Filter Toggle Button - Expands on desktop when clicked */}
    <button 
      onClick={() => setIsFilterExpanded(!isFilterExpanded)}
      className={`bg-white shadow-md rounded-lg p-2 hover:bg-gray-100 transition-all duration-200 flex items-center justify-center ${
        isFilterExpanded && !isMobile ? 'w-64' : ''
      }`}
      style={buttonStyle}
    >
      <span>{isFilterExpanded ? 'Hide Filters' : 'Show Filters'}</span>
    </button>
  </div>

  {/* Mobile Creator Button - Below filter button, hidden when filter expanded */}
  {isMobile && !isFilterExpanded && (
    <button 
      onClick={() => router.push('/nearby-news/home')}
      className="bg-red-800 hover:bg-red-900 text-white shadow-md rounded-lg p-2 transition-colors duration-200 flex items-center justify-center w-full"
      style={buttonStyle}
    >
      <svg 
        width="16" 
        height="16" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className="mr-2"
      >
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
        <path d="m15 5 4 4"/>
      </svg>
      <span>Be a Creator</span>
    </button>
  )}

  {/* Filter Panel */}
  {isFilterExpanded && (
    <div className="bg-white/70 backdrop-blur-sm shadow-lg rounded-lg p-4 max-h-[70vh] overflow-y-auto w-64 max-w-[calc(100vw-2rem)]">
      <div className="flex justify-between items-center mb-3 border-b pb-2">
        <h3 className="text-lg font-semibold">News Filters</h3>
        <div className="flex gap-2">
          <button 
            onClick={() => setSelectedCategories(Object.keys(categoryIcons).filter(cat => cat !== 'Default'))}
            className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
          >
            All
          </button>
          <button 
            onClick={() => setSelectedCategories([])}
            className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
          >
            Clear
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-2">
        {Object.entries(categoryIcons).map(([category, icon]) => (
          category !== 'Default' && (
            <div 
              key={category} 
              className="flex items-center space-x-3 hover:bg-gray-50/90 p-2 rounded transition-colors cursor-pointer"
              onClick={() => {
                setSelectedCategories(prev => {
                  if (prev.includes(category)) {
                    return prev.filter(cat => cat !== category);
                  } else {
                    return [...prev, category];
                  }
                });
              }}
            >
              <input 
                type="checkbox" 
                checked={selectedCategories.includes(category)}
                onChange={() => {}}
                className="w-4 h-4 text-blue-600"
              />
              <div 
                className="w-8 h-8 flex items-center justify-center rounded-full"
                style={{ 
                  backgroundColor: categoryColors[category] || categoryColors.Default,
                  color: 'white'
                }}
              >
                {React.cloneElement(icon, { 
                  size: 20, 
                  strokeWidth: 2.5,
                  color: 'white'
                })}
              </div>
              <span className="text-sm text-gray-700">{category}</span>
            </div>
          )
        ))}
      </div>
    </div>
  )}
</div>

    <GoogleMap
        mapContainerStyle={containerStyle}
        center={userLocation || center}
        zoom={userLocation ? USER_LOCATION_ZOOM : DEFAULT_ZOOM}
        options={{
            fullscreenControl: false,
            streetViewControl: false,
            mapTypeControl: false,
            zoomControl: !isGettingLocation, // Disable zoom control during location fetch
            gestureHandling: isGettingLocation ? "none" : "greedy", // CHANGE THIS LINE
            // Add restriction with buffer if user location exists
            restriction: userLocation ? {
              latLngBounds: {
                north: userLocation.lat + ((MAX_RADIUS_KM * BUFFER_FACTOR) / 111),
                south: userLocation.lat - ((MAX_RADIUS_KM * BUFFER_FACTOR) / 111),
                east: userLocation.lng + ((MAX_RADIUS_KM * BUFFER_FACTOR) / (111 * Math.cos(userLocation.lat * Math.PI / 180))),
                west: userLocation.lng - ((MAX_RADIUS_KM * BUFFER_FACTOR) / (111 * Math.cos(userLocation.lat * Math.PI / 180)))
              },
              strictBounds: false // Allow some elasticity
            } : undefined,
        }}
        onLoad={(map) => setMapRef(map)}
        onIdle={(map) => {
            handleBoundsChanged(map);
            // Keep bounds checks but with the buffered area
            if (userLocation) restrictMapBounds();
        }}
        onDragEnd={() => {
            // Apply restriction with buffer zone
            if (userLocation) restrictMapBounds();
        }}
        >
 
        {/* Add radius circle when user location exists */}
        {userLocation && (
            <Circle
                center={userLocation}
                radius={MAX_RADIUS_KM * 1000} // Convert km to meters
                options={{
                    fillColor: "#3B82F6", // Light blue fill
                    fillOpacity: 0.15,    // Very subtle fill
                    strokeColor: "#3B82F6", // Light blue stroke
                    strokeOpacity: 0.6,   // Moderate stroke opacity
                    strokeWeight: 2,      // Thin border
                }}
            />
        )}
        {/* Custom Map Type Controls */}
        <MapTypeControls mapRef={mapRef} />

        {/* News Markers */}
        {Object.keys(groupedNews).map((locationKey) => {
          const [lat, lng] = locationKey.split(',').map(parseFloat);
          const newsAtLocation = groupedNews[locationKey];
          const mainNews = newsAtLocation[0]; // Use the first (most recent) news for the marker
          
          // Skip this marker if its category is not in the selected categories
          if (mainNews.category && !selectedCategories.includes(mainNews.category)) {
            return null;
          }
          
          return (
            <MarkerF
              key={locationKey}
              position={{ lat, lng }}
              onClick={() => handleMarkerClick(locationKey)}
              icon={createCategoryMarkerIcon(mainNews.category, newsAtLocation.length)}
              label={
                newsAtLocation.length > 1 
                ? {
                    text: `${newsAtLocation.length}`,
                    color: "#333",
                    fontSize: "12px",
                    fontWeight: "bold"
                }
                : null
              }
            />
          );
        })}

        {/* Info Window */}
        {currentNews && (
          <InfoWindowF
            position={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
            onCloseClick={() => setSelectedLocation(null)}
            options={{
              pixelOffset: new window.google.maps.Size(0, -5)
            }}
          >
            <div className="max-w-xs relative select-none">
              {/* Custom header with category badge and custom close button */}
              <div className="relative w-full mb-2">
              {/* Category badge centered */}
              <div className="flex justify-center">
                <span className="px-3 py-1.5 bg-slate-100 text-slate-800 text-sm font-medium rounded-full inline-flex items-center justify-center gap-1 shadow-sm">
                  <span className="flex items-center justify-center">
                    {currentNews.category ? 
                      categoryIcons[currentNews.category] || categoryIcons.Default : 
                      categoryIcons.Default}
                  </span>
                  <span>{currentNews.category || "News"}</span>
                </span>
              </div>

              {/* Close button at top-right corner */}
              <button 
                onClick={() => setSelectedLocation(null)}
                className="absolute top-0 right-0 w-6 h-6 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 shadow-sm transition-colors"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

              
              {/* Add CSS to hide the default close button */}
              <style jsx>{`
                .gm-ui-hover-effect {
                  display: none !important;
                }
                
                /* Target the parent container's top padding to remove extra space */
                .gm-style .gm-style-iw-c {
                  padding-top: 12px !important;
                }
              `}</style>
              
              {/* News Image */}
              <div className="relative h-40 w-full overflow-hidden rounded-lg mb-3">
                <img 
                  src={currentNews.image_url} 
                  alt={currentNews.title}
                  className="object-cover w-full h-full"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/placeholders/news-placeholder.jpg";
                  }}
                />
              </div>
              
              {/* News Content */}
              <h3 className="font-semibold text-lg mb-2 line-clamp-2">{currentNews.title}</h3>
              
              {/* Content */}
              <div className="mb-4">
                <p className="text-gray-600 text-sm">
                  {truncate(currentNews.content, 120)}
                </p>
                <p className="text-xs text-gray-500 italic font-light text-right mt-1">
                  {new Date(currentNews.created_at).toLocaleDateString()}
                </p>
              </div>

              {/* Action Button */}
              <button
                onClick={() => openArticle(currentNews.id)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors shadow-sm"
              >
                Read Full Article
              </button>
              
              {/* Navigation Controls for Multiple News */}
              {hasMultipleNews && (
                <div className="flex items-center justify-between mt-3">
                  <button
                    onClick={handlePrevNews}
                    disabled={currentNewsIndex === 0}
                    className={`p-1 rounded ${
                      currentNewsIndex === 0
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-blue-600 hover:bg-blue-50"
                    }`}
                  >
                    ← Previous
                  </button>
                  <span className="text-xs text-gray-500">
                    {currentNewsIndex + 1} of {selectedNewsGroup.length}
                  </span>
                  <button
                    onClick={handleNextNews}
                    disabled={currentNewsIndex === selectedNewsGroup.length - 1}
                    className={`p-1 rounded ${
                      currentNewsIndex === selectedNewsGroup.length - 1
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-blue-600 hover:bg-blue-50"
                    }`}
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          </InfoWindowF>
        )}
      </GoogleMap>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white py-2 px-4 rounded-full shadow-md z-10">
          <div className="flex items-center space-x-2">
            <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Loading news...</span>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-100 text-red-700 py-2 px-4 rounded-full shadow-md z-10">
          {error}
        </div>
      )}
    </div>
  );
}