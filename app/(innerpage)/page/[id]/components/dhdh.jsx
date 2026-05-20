//app\(innerpage)\page\[id]\components\PageView.jsx
"use client"
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useMediaQuery } from 'react-responsive';
import toast from "react-hot-toast";
import { 
    Briefcase, Loader2, MapPin, Search,
    ChevronLeft, ChevronRight, X, Target, Utensils,
    Activity, Calendar, Star, Clock, Heart, MessageCircle,
    Share2, Navigation2, QrCode, Award, CheckCircle
  } from "lucide-react";
import { useRouter } from "next/navigation";
import PostRegistrationModal from "@/components/map/posts/PostRegistrationModal";
import { useUserRole } from "@/app/hooks/useUserRole";
import GlobalApi from "@/app/api/GlobalApi";
import { createClusterRenderer } from "@/utils/map/createClusterRenderer";
import MapCard from "@/components/map/MapCard";
import { handleClusterClick } from "@/utils/map/handleClusterClick";
import MapTypeControls from "@/components/map/controls/MapTypeControls";
import ZoomControls from "@/components/map/controls/ZoomControls";
import MobileFilterDropdown from "@/components/map/controls/MobileFilterDropdown";
import PostFilterPanel from "@/components/map/controls/PostFilterPanel";
import ResetMapButton from "@/components/map/controls/ResetMapButton";
import { center, containerStyle, DEFAULT_ZOOM, USER_LOCATION_ZOOM } from "@/lib/map/constants";
import { createPostCategoryMarkerIcon, groupPostsByLocation, groupRegistrationsByLocation } from '@/utils/map/markerUtils';

// ── Leaflet lazy loader ────────────────────────────────────────────────────────
let L = null;
async function loadLeaflet() {
  if (L) return;
  L = (await import("leaflet")).default;
  await import("leaflet.markercluster");
  window._leaflet_L = L;
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

// ── Haversine distance — replaces google.maps.geometry.spherical ──────────────
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R  = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a  = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ── Google-style icon descriptor → Leaflet icon ───────────────────────────────
function toLeafletIcon(descriptor) {
  if (!descriptor || !L) return new L.Icon.Default();
  const url    = descriptor.url;
  const size   = descriptor.scaledSize ? [descriptor.scaledSize.width, descriptor.scaledSize.height] : [48, 70];
  const anchor = descriptor.anchor    ? [descriptor.anchor.x, descriptor.anchor.y]                   : [size[0]/2, size[1]];
  return L.icon({ iconUrl: url, iconSize: size, iconAnchor: anchor });
}

export default function PageView({pageId, isOwner, selectedDistrict, setSelectedDistrict, onTourismUpdate}) {

  // ── State ──────────────────────────────────────────────────────────────────
  const [postsItems, setPostsItems]                   = useState([]);
  const [groupedPosts, setGroupedPosts]               = useState({});
  const [selectedLocation, setSelectedLocation]       = useState(null);
  const [currentPostIndex, setCurrentPostIndex]       = useState(0);
  const [mapBounds, setMapBounds]                     = useState(null);
  const [userLocation, setUserLocation]               = useState(null);
  const [isLoading, setIsLoading]                     = useState(true);
  const [error, setError]                             = useState(null);
  const [mapRef, setMapRef]                           = useState(null);
  const router                                        = useRouter();

  const [showModal, setShowModal]                     = useState(false);
  const [locationPermissionState, setLocationPermissionState] = useState(null);
  const [availableLanguages, setAvailableLanguages]   = useState([]);
  const [postCategories, setPostCategories]           = useState([]);
  const [communities, setCommunities]                 = useState([]);
  const [showFiltersDropdown, setShowFiltersDropdown] = useState(false);
  const [countryCenter, setCountryCenter]             = useState(center);
  const [lastFetchTime, setLastFetchTime]             = useState(Date.now());
  const [showUserProfile, setShowUserProfile]         = useState(false);
  const [postLikes, setPostLikes]                     = useState({});
  const [postLikeCounts, setPostLikeCounts]           = useState({});
  const [selectedCategories, setSelectedCategories]   = useState([]);

  const userLocationRef      = useRef(null);
  const isInitialLoadRef     = useRef(true);
  const userHasInteractedRef = useRef(false);

  const [showRegistrationModal, setShowRegistrationModal]       = useState(false);
  const [groupedRegistrations, setGroupedRegistrations]         = useState({});
  const [showRegistrationDetails, setShowRegistrationDetails]   = useState(false);
  const [currentRegistrationIndex, setCurrentRegistrationIndex] = useState(0);

  const { user, canCreatePost } = useUserRole();

  // Tourism states
  const [districtPages, setDistrictPages]                   = useState([]);
  const [geofenceData, setGeofenceData]                     = useState(null);
  const [categoryMarkers, setCategoryMarkers]               = useState([]);
  const [activeCategoryMarker, setActiveCategoryMarker]     = useState(null);
  const [expandedCategory, setExpandedCategory]             = useState(null);
  const [selectedSubCategory, setSelectedSubCategory]       = useState(null);
  const [activeDiscoveryCategory, setActiveDiscoveryCategory] = useState(null);
  const [activeCardTab, setActiveCardTab]                   = useState('Rules');
  const [isTourismPage, setIsTourismPage]                   = useState(false);
  const [isDistrictFilterOpen, setIsDistrictFilterOpen]     = useState(false);
  const [districtSearchQuery, setDistrictSearchQuery]       = useState("");
  const [acceptedItems, setAcceptedItems]                   = useState([]);
  const [completedItemIds, setCompletedItemIds]             = useState(new Set());
  const [deniedItemIds, setDeniedItemIds]                   = useState(new Set());
  const [showDetailModal, setShowDetailModal]               = useState(false);
  const [selectedDetailItem, setSelectedDetailItem]         = useState(null);
  const [showQRModal, setShowQRModal]                       = useState(false);
  const [qrScanning, setQrScanning]                         = useState(false);
  const [qrSuccess, setQRSuccess]                           = useState(false);
  const [showUploadModal, setShowUploadModal]               = useState(false);
  const [uploading, setUploading]                           = useState(false);
  const [uploadSuccess, setUploadSuccess]                   = useState(false);
  const [activeDetailTab, setActiveDetailTab]               = useState('Rules');

  const triggeredPopupsRef      = useRef(new Set());
  const geofenceSetupCompleteRef = useRef(false);
  const tourismMarkersRef       = useRef([]);

  // Leaflet refs
  const mapContainerRef         = useRef(null);
  const mapInstanceRef          = useRef(null);
  const clusterGroupRef         = useRef(null);
  const markersMapRef           = useRef(new Map());
  const geofenceLayersRef       = useRef([]);
  const discoveryMarkersRef     = useRef([]);
  const tourismLeafletMarkersRef = useRef([]);
  const [leafletReady, setLeafletReady] = useState(false);

  // Popup portal DOM nodes
  const mainPopupDomRef    = useRef(null);
  const mainPopupRef       = useRef(null);
  const tourismPopupDomRef = useRef(null);
  const tourismPopupRef    = useRef(null);

  const isMobile = useMediaQuery({ maxWidth: 640 });
  const buttonStyle = {
    minWidth: isMobile ? '60px' : '100px',
    height:   isMobile ? '28px' : '38px',
    fontSize: isMobile ? '12px' : '14px'
  };

  const [readPostIds, setReadPostIds] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('readPostIds');
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });

  const markPostAsRead = useCallback((newsId) => {
    setReadPostIds(prev => {
      const updated = [...prev, newsId];
      localStorage.setItem('readPostIds', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // ── Create popup DOM nodes once ────────────────────────────────────────────
  useEffect(() => {
    mainPopupDomRef.current    = document.createElement("div");
    mainPopupDomRef.current.style.minWidth = isMobile ? "280px" : "320px";
    tourismPopupDomRef.current = document.createElement("div");
  }, []);

  // ── 1. Boot Leaflet map ────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadLeaflet();
      if (cancelled || !mapContainerRef.current || mapInstanceRef.current) return;

      const lat = Array.isArray(center) ? center[0] : (center?.lat ?? 20);
      const lng = Array.isArray(center) ? center[1] : (center?.lng ?? 0);

      const map = L.map(mapContainerRef.current, {
        center:             [lat, lng],
        zoom:               DEFAULT_ZOOM,
        minZoom:            2,
        maxZoom:            18,
        zoomControl:        false,
        attributionControl: true,
        maxBounds:          [[-85, -180], [85, 180]],
        maxBoundsViscosity: 1.0,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const clusterGroup = L.markerClusterGroup({
        maxClusterRadius:        80,
        disableClusteringAtZoom: 12,
        spiderfyOnMaxZoom:       true,
        showCoverageOnHover:     false,
        chunkedLoading:          true,
        iconCreateFunction: createClusterRenderer(map, readPostIds, groupedPosts, { type: "page" }),
      });
      map.addLayer(clusterGroup);
      clusterGroupRef.current = clusterGroup;

      clusterGroup.on('clusterclick', (e) => {
        handleClusterClick(clusterGroup, e.layer, map);
      });

      map.on('dragstart', () => { userHasInteractedRef.current = true; });
      map.on('zoom',      () => { if (!isInitialLoadRef.current) userHasInteractedRef.current = true; });
      map.on('click',     () => { userHasInteractedRef.current = true; });

      mapInstanceRef.current = map;
      setMapRef(map);
      setLeafletReady(true);

      setTimeout(() => {
        map.invalidateSize();
        isInitialLoadRef.current = false;
      }, 200);
    })();

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Tourism: check if current page is tourism ──────────────────────────────
  useEffect(() => {
    const checkTourismStatus = async () => {
      if (!pageId) return;
      if (Number(pageId) === 999991 || Number(pageId) === 999992 || Number(pageId) === 10000) {
        setIsTourismPage(true);
      }
      try {
        const res          = await GlobalApi.GetMapDistricts();
        const allDistricts = res.data.data || [];
        const districtsList = allDistricts.filter(d => Number(d.page_id) === Number(pageId));
        setDistrictPages(districtsList);
        if (districtsList.length > 0) {
          setIsTourismPage(true);
          if (districtsList.length === 1 && !selectedDistrict) {
            setSelectedDistrict(districtsList[0].name);
          }
        }
      } catch (e) {
        console.error("Tourism check failed", e);
      }
    };
    checkTourismStatus();
  }, [pageId, setSelectedDistrict]);

  // ── Geolocation watch ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (position) => setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
      (err) => console.error("Geolocation error:", err),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // ── Fetch accepted/completed challenges ────────────────────────────────────
  useEffect(() => {
    if (!isTourismPage) return;
    fetch('/api/challenges/user').then(res => res.json()).then(data => {
      if (data?.success && data?.data) {
        const accepted  = [];
        const completed = new Set();
        data.data.forEach(item => {
          const markerLike = { ...item.challenge, id: item.challenge.id };
          if (item.user_challenge.status === 'completed') completed.add(markerLike.id);
          else accepted.push(markerLike);
        });
        setAcceptedItems(accepted);
        setCompletedItemIds(completed);
      }
    }).catch(e => console.error(e));
  }, [isTourismPage]);

  // ── Distance auto-popup (Haversine replaces google.maps.geometry) ──────────
  useEffect(() => {
    if (!userLocation || !categoryMarkers || categoryMarkers.length === 0) return;
    categoryMarkers.forEach((marker) => {
      if (!marker?.position) return;
      const distance      = haversineDistance(userLocation.lat, userLocation.lng, marker.position.lat, marker.position.lng);
      const dynamicRadius = marker.radius_meters || 20;
      if (distance < dynamicRadius) {
        const isAlreadyAccepted = acceptedItems.some(i => i.id === marker.id);
        const isCompleted       = completedItemIds.has(marker.id);
        if (!isAlreadyAccepted && !isCompleted && !triggeredPopupsRef.current.has(marker.id)) {
          triggeredPopupsRef.current.add(marker.id);
          setSelectedDetailItem(marker);
          setShowDetailModal(true);
          setActiveDetailTab('Rules');
          toast.success(`You are within range of ${marker.title}!`);
        }
      }
    });
  }, [userLocation, categoryMarkers, acceptedItems, completedItemIds]);

  // ── isWithinRadius (Haversine replaces google.maps.geometry) ──────────────
  const isWithinRadius = useCallback((item) => {
    if (!userLocation || !item?.position) return false;
    const distance      = haversineDistance(userLocation.lat, userLocation.lng, item.position.lat, item.position.lng);
    const dynamicRadius = item.radius_meters || 20;
    return distance <= dynamicRadius;
  }, [userLocation]);

  // ── Tourism data sync ──────────────────────────────────────────────────────
  useEffect(() => {
    if (onTourismUpdate) {
      onTourismUpdate({ selectedDistrict, acceptedCount: acceptedItems.length });
    }
  }, [selectedDistrict, acceptedItems.length, onTourismUpdate]);

  // ── Fetch tourism geofence data ────────────────────────────────────────────
  const fetchTourismData = useCallback(async () => {
    try {
      const res          = await GlobalApi.GetMapDistricts();
      const allDistricts = res.data.data || [];
      const districts    = allDistricts.filter(d => Number(d.page_id) === Number(pageId));
      setDistrictPages(districts);

      const features = districts.map(d => {
        if (!d.geojson) return null;
        let geojsonObj = typeof d.geojson === 'string' ? JSON.parse(d.geojson) : d.geojson;
        return { type: "Feature", properties: { name: d.name, district: d.name, page_id: d.page_id }, geometry: geojsonObj };
      }).filter(Boolean);

      setGeofenceData({ type: "FeatureCollection", features });
    } catch (err) {
      console.error("Error fetching tourism data:", err);
      setGeofenceData(null);
      setError("Failed to load tourism data.");
    } finally {
      setIsLoading(false);
    }
  }, [pageId]);

  useEffect(() => {
    if (pageId && isTourismPage) {
      fetchTourismData();
    } else {
      setIsLoading(false);
    }
    const timer = setTimeout(() => { if (isLoading) setIsLoading(false); }, 5000);
    return () => clearTimeout(timer);
  }, [pageId, isTourismPage, fetchTourismData]);

  // ── districtCenter memo ────────────────────────────────────────────────────
  const districtCenter = useMemo(() => {
    if (!geofenceData || !selectedDistrict) return null;
    const lowerSelected = selectedDistrict.toLowerCase();
    const feature = geofenceData.features.find(f =>
      (f.properties.name?.toLowerCase() || f.properties.district?.toLowerCase()) === lowerSelected
    );
    if (!feature) return null;

    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
    if (feature.geometry.type === 'MultiPolygon') {
      feature.geometry.coordinates.forEach(polygon => {
        polygon[0].forEach(coord => {
          if (coord[1] < minLat) minLat = coord[1]; if (coord[1] > maxLat) maxLat = coord[1];
          if (coord[0] < minLng) minLng = coord[0]; if (coord[0] > maxLng) maxLng = coord[0];
        });
      });
    } else if (feature.geometry.type === 'Polygon') {
      feature.geometry.coordinates[0].forEach(coord => {
        if (coord[1] < minLat) minLat = coord[1]; if (coord[1] > maxLat) maxLat = coord[1];
        if (coord[0] < minLng) minLng = coord[0]; if (coord[0] > maxLng) maxLng = coord[0];
      });
    }
    if (minLat === 90) return null;
    return { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 };
  }, [geofenceData, selectedDistrict]);

  // ── Pan to district when districtCenter changes ────────────────────────────
  useEffect(() => {
    if (mapInstanceRef.current && districtCenter) {
      mapInstanceRef.current.setView(
        [districtCenter.lat, districtCenter.lng],
        Math.max(mapInstanceRef.current.getZoom(), 8)
      );
    }
  }, [districtCenter]);

  // ── visibleTourismMarkers memo ─────────────────────────────────────────────
  const visibleTourismMarkers = useMemo(() => {
    if (!isTourismPage || !selectedDistrict || !districtCenter) return [];
    const categories  = ['Challenges', 'Places', 'Food', 'Activity', 'Events'];
    let finalMarkers  = [];
    categories.forEach((cat, index) => {
      if (activeDiscoveryCategory && activeDiscoveryCategory !== cat) return;
      const items = categoryMarkers.filter(m => m.category === cat && !deniedItemIds.has(m.id));
      if (items.length === 0) return;
      if (expandedCategory === cat || activeDiscoveryCategory === cat || districtSearchQuery) {
        finalMarkers.push(...items.map(item => ({ ...item, isGroup: false, isFinished: completedItemIds.has(item.id) })));
      } else {
        const offsetLat = (index - 2) * 0.03;
        const offsetLng = (index % 2 === 0 ? 0.03 : -0.03);
        finalMarkers.push({
          id: `group-${cat}`, category: cat, isGroup: true,
          position: { lat: districtCenter.lat + offsetLat, lng: districtCenter.lng + offsetLng }
        });
      }
    });
    return finalMarkers;
  }, [isTourismPage, selectedDistrict, districtCenter, categoryMarkers, activeDiscoveryCategory, expandedCategory, deniedItemIds, completedItemIds, districtSearchQuery]);

  // ── Tourism marker icon generator ──────────────────────────────────────────
  const getMarkerIcon = (category, isSelected, isGroup = false, isFinished = false) => {
    let color = isFinished ? '#9ca3af' : '#f97316';
    let path  = '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>';
    if (!isFinished) {
      if (category === 'Places')   { color = '#22c55e'; path = '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>'; }
      else if (category === 'Food')     { color = '#ef4444'; path = '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>'; }
      else if (category === 'Activity') { color = '#06b6d4'; path = '<path d="M18 20a6 6 0 0 0-12 0"/><circle cx="12" cy="10" r="4"/><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>'; }
      else if (category === 'Events')   { color = '#8b5cf6'; path = '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>'; }
    }
    const size = isSelected ? 48 : (isGroup ? 44 : 36);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="${size}" height="${size}">
      <circle cx="20" cy="20" r="18" fill="${color}" opacity="${isGroup ? '0.4' : '0.2'}"/>
      <circle cx="20" cy="20" r="14" fill="${color}" stroke="white" stroke-width="2"/>
      <g transform="translate(8, 8) scale(0.9)">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>
      </g>
    </svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  };

  // ── Fetch district challenges ──────────────────────────────────────────────
  useEffect(() => {
    if (!selectedDistrict || !districtPages || districtPages.length === 0) { setCategoryMarkers([]); return; }
    const currentDistrict = districtPages.find(d => d.name.toLowerCase() === selectedDistrict.toLowerCase());
    if (!currentDistrict) return;

    const fetchDistrictChallenges = async () => {
      try {
        const res        = await GlobalApi.GetMapChallenges(null, currentDistrict.page_id);
        const challenges = res.data.data || [];
        const newMarkers = [];
        challenges.forEach(challenge => {
          if (Number(challenge.district_id) !== Number(currentDistrict.id)) return;
          let category = 'Challenges';
          if (challenge.frequency === 'food' || challenge.exp_type === 'breakfast' || challenge.exp_type === 'biriyani') category = 'Food';
          else if (challenge.frequency === 'contest' || challenge.frequency === 'quiz') category = 'Activity';
          else if (challenge.frequency === 'event') category = 'Events';
          else if (challenge.exp_type === 'arts' || challenge.frequency === 'experience') category = 'Places';
          if (activeDiscoveryCategory && category !== activeDiscoveryCategory) return;
          if (deniedItemIds.has(challenge.id)) return;
          const latOffset = challenge.latitude  ? 0 : ((challenge.id % 10) * 0.015 - 0.075);
          const lngOffset = challenge.longitude ? 0 : (((challenge.id * 7) % 10) * 0.015 - 0.075);
          newMarkers.push({
            id: challenge.id, ...challenge, category,
            position: {
              lat: parseFloat(challenge.latitude)  || ((districtCenter?.lat && !isNaN(districtCenter.lat)) ? districtCenter.lat + latOffset : 8.524),
              lng: parseFloat(challenge.longitude) || ((districtCenter?.lng && !isNaN(districtCenter.lng)) ? districtCenter.lng + lngOffset : 76.936)
            }
          });
        });
        setCategoryMarkers(newMarkers);
      } catch (error) {
        console.error("Failed to fetch district challenges:", error);
      }
    };
    fetchDistrictChallenges();
  }, [selectedDistrict, deniedItemIds, activeDiscoveryCategory, districtPages, districtCenter]);

  // ── 2. Post + Registration markers ────────────────────────────────────────
  useEffect(() => {
    if (!leafletReady || !mapInstanceRef.current || !clusterGroupRef.current) return;
    if (Object.keys(groupedPosts).length === 0 && Object.keys(groupedRegistrations).length === 0) return;

    const clusterGroup   = clusterGroupRef.current;
    const currentMarkers = markersMapRef.current;

    const newKeys = new Set([
      ...Object.keys(groupedPosts),
      ...Object.keys(groupedRegistrations).map(k => `reg_${k}`),
    ]);

    for (const [key, marker] of currentMarkers.entries()) {
      if (!newKeys.has(key)) { clusterGroup.removeLayer(marker); currentMarkers.delete(key); }
    }

    for (const locationKey of Object.keys(groupedPosts)) {
      const [lat, lng]      = locationKey.split(',').map(parseFloat);
      const postsAtLocation = groupedPosts[locationKey];
      const mainPost        = postsAtLocation[0];

      if (mainPost.category && !selectedCategories.includes(mainPost.category)) {
        if (currentMarkers.has(locationKey)) { clusterGroup.removeLayer(currentMarkers.get(locationKey)); currentMarkers.delete(locationKey); }
        continue;
      }

      const allPostRead  = postsAtLocation.every(p => readPostIds.includes(p.id));
      const categoryData = postCategories.find(cat => cat.id === mainPost.category_id) || { name: 'Default', shape: 'pin', icon_name: 'MapPin', color: '#6b7280' };
      const icon         = toLeafletIcon(createPostCategoryMarkerIcon(categoryData, postsAtLocation.length, mainPost, allPostRead));

      if (currentMarkers.has(locationKey)) {
        currentMarkers.get(locationKey).setIcon(icon);
        currentMarkers.get(locationKey).options._allRead = allPostRead;
      } else {
        const marker = L.marker([lat, lng], { icon, zIndexOffset: 100, _allRead: allPostRead });
        marker.on('click', (e) => { L.DomEvent.stopPropagation(e); handleMarkerClick(locationKey); });
        clusterGroup.addLayer(marker);
        currentMarkers.set(locationKey, marker);
      }
    }

    for (const locationKey of Object.keys(groupedRegistrations)) {
      const [lat, lng]              = locationKey.split(',').map(parseFloat);
      const registrationsAtLocation = groupedRegistrations[locationKey];
      const regKey                  = `reg_${locationKey}`;

      const regIconUrl = "data:image/svg+xml," + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
          <circle cx="12" cy="12" r="10" fill="#059669" stroke="#047857" stroke-width="2"/>
          <path d="M8 12l2 2 4-4" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          <text x="12" y="20" text-anchor="middle" fill="#047857" font-size="8" font-weight="bold">${registrationsAtLocation.length}</text>
        </svg>
      `);
      const regIcon = L.icon({ iconUrl: regIconUrl, iconSize: [32, 32], iconAnchor: [16, 16] });

      if (currentMarkers.has(regKey)) {
        currentMarkers.get(regKey).setIcon(regIcon);
      } else {
        const marker = L.marker([lat, lng], { icon: regIcon, zIndexOffset: 200, title: `${registrationsAtLocation.length} Registration(s)` });
        marker.on('click', (e) => { L.DomEvent.stopPropagation(e); handleRegistrationMarkerClick(locationKey); });
        clusterGroup.addLayer(marker);
        currentMarkers.set(regKey, marker);
      }
    }
  }, [leafletReady, groupedPosts, groupedRegistrations, selectedCategories, readPostIds, postCategories]);

  // ── 3. Geofence polygons + overlay + district dots ─────────────────────────
  useEffect(() => {
    if (!leafletReady || !mapInstanceRef.current || !geofenceData) return;
    const map = mapInstanceRef.current;

    geofenceLayersRef.current.forEach(l => l.remove());
    geofenceLayersRef.current = [];
    discoveryMarkersRef.current.forEach(m => map.removeLayer(m));
    discoveryMarkersRef.current = [];

    if (geofenceData.type !== 'FeatureCollection') return;

    const allBounds = L.latLngBounds([]);
    let hasCoords   = false;

    geofenceData.features.forEach(feature => {
      const distName   = feature.properties.name || feature.properties.district;
      const geometry   = feature.geometry;
      const isSelected = selectedDistrict && distName.toLowerCase() === selectedDistrict.toLowerCase();
      const featureBounds = L.latLngBounds([]);

      const rings = geometry.type === 'Polygon'
        ? geometry.coordinates
        : geometry.coordinates.flatMap(poly => poly);

      rings.forEach(ring => {
        const latLngs = ring.map(coord => [coord[1], coord[0]]);
        latLngs.forEach(ll => { featureBounds.extend(ll); allBounds.extend(ll); hasCoords = true; });

        const poly = L.polygon(latLngs, {
          color:       isSelected ? '#2563EB' : '#3B82F6',
          weight:      isSelected ? 4 : 2,
          opacity:     isSelected ? 1 : 0.8,
          fillColor:   '#3B82F6',
          fillOpacity: isSelected ? 0.2 : 0.1,
          interactive: true,
        }).addTo(map);

        poly.on('click', () => setSelectedDistrict(distName));
        geofenceLayersRef.current.push(poly);
      });

      // District centre dot (only when no district selected)
      if (!selectedDistrict && !featureBounds.isValid?.() === false) {
        try {
          const centreLatLng = featureBounds.getCenter();
          const dotIcon = L.divIcon({
            html: `<div style="width:12px;height:12px;background:white;border:2px solid #2563EB;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
            className: '', iconSize: [12, 12], iconAnchor: [6, 6],
          });
          const dot = L.marker(centreLatLng, { icon: dotIcon, zIndexOffset: 200, title: distName });
          dot.on('click', () => setSelectedDistrict(distName));
          dot.addTo(map);
          discoveryMarkersRef.current.push(dot);
        } catch {}
      }
    });

    // Grey overlay (world minus district holes)
    const worldRing    = [[85,-180],[85,180],[-85,180],[-85,-180]];
    const holesToDraw  = selectedDistrict
      ? geofenceData.features.filter(f => (f.properties.name || f.properties.district)?.toLowerCase() === selectedDistrict.toLowerCase())
      : geofenceData.features;

    const holeRings = holesToDraw.flatMap(feature => {
      const g = feature.geometry;
      return g.type === 'Polygon'
        ? [g.coordinates[0].map(c => [c[1], c[0]]).reverse()]
        : g.coordinates.map(poly => poly[0].map(c => [c[1], c[0]]).reverse());
    });

    const overlay = L.polygon([worldRing, ...holeRings], {
      color: 'transparent', fillColor: '#6B7280', fillOpacity: 0.4, interactive: false,
    }).addTo(map);
    geofenceLayersRef.current.push(overlay);

    if (hasCoords) {
      if (selectedDistrict) {
        const selFeature = geofenceData.features.find(f =>
          (f.properties.name || f.properties.district)?.toLowerCase() === selectedDistrict.toLowerCase()
        );
        if (selFeature) {
          const selBounds = L.latLngBounds([]);
          const g = selFeature.geometry;
          const allRings = g.type === 'Polygon' ? g.coordinates : g.coordinates.flatMap(p => p);
          allRings.forEach(ring => ring.forEach(c => selBounds.extend([c[1], c[0]])));
          if (selBounds.isValid()) map.fitBounds(selBounds, { padding: [80, 40] });
        }
      } else {
        if (allBounds.isValid()) map.fitBounds(allBounds, { padding: [80, 40] });
      }
    }
  }, [leafletReady, geofenceData, selectedDistrict]);

  // ── 4. Tourism item markers ────────────────────────────────────────────────
  useEffect(() => {
    if (!leafletReady || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    tourismLeafletMarkersRef.current.forEach(m => map.removeLayer(m));
    tourismLeafletMarkersRef.current = [];

    if (!isTourismPage || !selectedDistrict) return;

    visibleTourismMarkers.forEach((marker) => {
      const iconUrl = getMarkerIcon(marker.category, activeCategoryMarker === marker.id, marker.isGroup, marker.isFinished);
      const size    = marker.isGroup ? 46 : 38;
      const icon    = L.icon({ iconUrl, iconSize: [size, size], iconAnchor: [size/2, size/2] });
      const m       = L.marker([marker.position.lat, marker.position.lng], { icon, zIndexOffset: marker.isGroup ? 110 : 100 });

      m.on('click', () => {
        if (marker.isGroup) { setExpandedCategory(marker.category); }
        else if (!marker.isFinished) { setActiveCategoryMarker(marker.id); setActiveDiscoveryCategory(marker.category); }
      });

      m.addTo(map);
      tourismLeafletMarkersRef.current.push(m);
    });
  }, [leafletReady, visibleTourismMarkers, activeCategoryMarker, isTourismPage, selectedDistrict]);

  // ── 5. Main popup (post / registration) via portal ────────────────────────
  const getCurrentPostItem = () => {
    if (!selectedLocation || !groupedPosts[selectedLocation.key]) return null;
    return groupedPosts[selectedLocation.key][currentPostIndex];
  };
  const getCurrentRegistrationItem = () => {
    if (!selectedLocation || !groupedRegistrations[selectedLocation.key]) return null;
    return groupedRegistrations[selectedLocation.key][currentRegistrationIndex];
  };
  const currentPost       = getCurrentPostItem();
  const currentItem       = showRegistrationDetails ? getCurrentRegistrationItem() : getCurrentPostItem();
  const selectedPostGroup = selectedLocation ? groupedPosts[selectedLocation.key] : [];

  useEffect(() => {
    if (!leafletReady || !mapInstanceRef.current || !mainPopupDomRef.current) return;
    const map = mapInstanceRef.current;

    if (!currentItem || !selectedLocation) {
      if (mainPopupRef.current) { map.closePopup(mainPopupRef.current); mainPopupRef.current = null; }
      return;
    }
    if (mainPopupRef.current) return;

    const popup = L.popup({
      offset: [0, -5], autoPan: true,
      maxWidth: isMobile ? 280 : 320,
      closeButton: false, className: 'leaflet-page-popup',
    })
      .setLatLng([selectedLocation.lat, selectedLocation.lng])
      .setContent(mainPopupDomRef.current);

    popup.on('remove', () => {
      mainPopupRef.current = null;
      setSelectedLocation(null);
      setShowRegistrationDetails(false);
      setShowUserProfile(false);
      setCurrentRegistrationIndex(0);
    });
    popup.addTo(map);
    mainPopupRef.current = popup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leafletReady, currentItem, selectedLocation]);

  useEffect(() => {
    if (!selectedLocation && mainPopupRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.closePopup(mainPopupRef.current);
      mainPopupRef.current = null;
    }
  }, [selectedLocation]);

  // ── 6. Tourism item popup via portal ──────────────────────────────────────
  useEffect(() => {
    if (!leafletReady || !mapInstanceRef.current || !tourismPopupDomRef.current) return;
    const map        = mapInstanceRef.current;
    const markerData = categoryMarkers.find(m => m.id === activeCategoryMarker);

    if (!activeCategoryMarker || !markerData) {
      if (tourismPopupRef.current) { map.closePopup(tourismPopupRef.current); tourismPopupRef.current = null; }
      return;
    }
    if (tourismPopupRef.current) return;

    const popup = L.popup({
      offset: [0, -35], autoPan: true, maxWidth: 320,
      closeButton: false, className: 'leaflet-tourism-popup',
    })
      .setLatLng([markerData.position.lat, markerData.position.lng])
      .setContent(tourismPopupDomRef.current);

    popup.on('remove', () => { tourismPopupRef.current = null; });
    popup.addTo(map);
    tourismPopupRef.current = popup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leafletReady, activeCategoryMarker, categoryMarkers]);

  useEffect(() => {
    if (!activeCategoryMarker && tourismPopupRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.closePopup(tourismPopupRef.current);
      tourismPopupRef.current = null;
    }
  }, [activeCategoryMarker]);

  // ── Visibility change (mobile restore) ────────────────────────────────────
  useEffect(() => {
    if (!isMobile) return;
    const handleVisibilityChange = () => {
      if (!document.hidden && mapInstanceRef.current && userLocationRef.current && !userHasInteractedRef.current && locationPermissionState === 'granted') {
        setTimeout(() => mapInstanceRef.current.setView([userLocationRef.current.lat, userLocationRef.current.lng], USER_LOCATION_ZOOM), 100);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isMobile, locationPermissionState]);

  // ── Mark prev post as read on location change ──────────────────────────────
  const prevSelectedLocationRef = useRef(null);
  useEffect(() => {
    if (prevSelectedLocationRef.current && prevSelectedLocationRef.current !== selectedLocation) {
      const prevKey        = prevSelectedLocationRef.current.key;
      const prevPostsGroup = groupedPosts[prevKey];
      if (prevPostsGroup?.length > 0) {
        const prevPost = prevPostsGroup[currentPostIndex] || prevPostsGroup[0];
        if (prevPost) markPostAsRead(prevPost.id);
      }
    }
    prevSelectedLocationRef.current = selectedLocation;
  }, [selectedLocation, groupedPosts, currentPostIndex, markPostAsRead]);

  useEffect(() => { setShowUserProfile(false); }, [selectedLocation]);

  // ── Fetch posts ────────────────────────────────────────────────────────────
  const initializeLikeData = (newsData) => {
    const counts = {}; const likes = {};
    newsData.forEach(news => { counts[news.id] = news.like_count || 0; likes[news.id] = news.is_liked_by_user || false; });
    setPostLikeCounts(counts); setPostLikes(likes);
  };

  const fetchPostsData = useCallback(async (bounds, pageId, isAutoRefresh = false) => {
    try {
      if (!isAutoRefresh) setIsLoading(true);
      let url = '/api/page';
      const params = new URLSearchParams();
      if (pageId) params.append('pageId', pageId);
      if (params.toString()) url += `?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch posts data');
      const data = await response.json();
      setPostsItems(data.posts || []);
      setPostCategories(data.categories || []);
      initializeLikeData(data.posts || []);
      setGroupedPosts(groupPostsByLocation(data.posts || []));
      setGroupedRegistrations(groupRegistrationsByLocation(data.registrations || []));
    } catch (err) {
      console.error("Error fetching posts:", err);
      if (!isAutoRefresh) setError("Failed to load posts data");
    } finally {
      if (!isAutoRefresh) setIsLoading(false);
    }
  }, []);

  useEffect(() => { if (pageId) fetchPostsData(null, pageId); }, [pageId, fetchPostsData]);

  // ── Initialize selected categories ────────────────────────────────────────
  useEffect(() => {
    if (postCategories.length > 0) {
      setSelectedCategories(postCategories.filter(cat => cat.name !== 'Default').map(cat => cat.name));
    }
  }, [postCategories]);

  // ── Auto-refresh every 30s ─────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      if (availableLanguages.length > 0) { fetchPostsData(null, pageId, true); setLastFetchTime(Date.now()); }
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchPostsData, pageId]);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      markersMapRef.current.forEach(marker => { if (clusterGroupRef.current) clusterGroupRef.current.removeLayer(marker); });
      markersMapRef.current.clear();
    };
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const getCategoryByName = (categoryName) => {
    return postCategories.find(cat => cat.name === categoryName) || { name: 'Default', shape: 'pin', icon_name: 'MapPin', color: '#6b7280', class_name: '' };
  };

  const handleMarkerClick = useCallback((locationKey, index = 0) => {
    const [lat, lng] = locationKey.split(',').map(parseFloat);
    setSelectedLocation({ key: locationKey, lat, lng });
    setCurrentPostIndex(index);
  }, []);

  const handleNextPost = () => {
    if (selectedLocation && groupedPosts[selectedLocation.key]) {
      setCurrentPostIndex(prev => prev < groupedPosts[selectedLocation.key].length - 1 ? prev + 1 : prev);
    }
  };
  const handlePrevPost = () => setCurrentPostIndex(prev => prev > 0 ? prev - 1 : prev);

  const handleLikePost = async (postId) => {
    try {
      const response = await fetch('/api/posts/like', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId })
      });
      if (response.ok) {
        const data = await response.json();
        setPostLikes(prev => ({ ...prev, [postId]: data.liked }));
        setPostLikeCounts(prev => ({ ...prev, [postId]: data.liked ? (prev[postId] || 0) + 1 : Math.max((prev[postId] || 0) - 1, 0) }));
      }
    } catch {}
  };

  const handleRegistrationMarkerClick = useCallback((locationKey, index = 0) => {
    const [lat, lng] = locationKey.split(',').map(parseFloat);
    setSelectedLocation({ key: locationKey, lat, lng });
    setCurrentRegistrationIndex(index);
    setShowRegistrationDetails(true);
  }, []);

  const handleNextRegistration = () => {
    const selectedRegs = selectedLocation ? groupedRegistrations[selectedLocation.key] : [];
    if (currentRegistrationIndex < selectedRegs.length - 1) setCurrentRegistrationIndex(currentRegistrationIndex + 1);
  };
  const handlePrevRegistration = () => {
    if (currentRegistrationIndex > 0) setCurrentRegistrationIndex(currentRegistrationIndex - 1);
  };

  const handleAcceptItem  = (item) => { if (!acceptedItems.find(i => i.id === item.id)) setAcceptedItems(prev => [...prev, item]); setShowDetailModal(false); setActiveCategoryMarker(null); };
  const handleDenyItem    = (itemId) => { setDeniedItemIds(prev => new Set([...prev, itemId])); setShowDetailModal(false); setActiveCategoryMarker(null); };
  const handleShowRoute   = (item) => window.open(`https://www.google.com/maps/dir/?api=1&destination=${item.position.lat},${item.position.lng}`, '_blank');

  const filteredDistricts = districtPages.map(d => d.name).filter(name => name.toLowerCase().includes(districtSearchQuery.toLowerCase()));

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="relative">

      {/* Filter Controls - Top Right */}
      <div className="absolute top-3 right-4 z-[1000] flex items-end gap-2">
        {pageId && (
          <>
            {isMobile ? (
              <div className="flex gap-2 items-end">
                <MobileFilterDropdown
                  selectedCategories={selectedCategories} setSelectedCategories={setSelectedCategories}
                  showFiltersDropdown={showFiltersDropdown} setShowFiltersDropdown={setShowFiltersDropdown}
                  buttonStyle={buttonStyle} postCategories={postCategories}
                  fetchPostsData={fetchPostsData} mapRef={mapRef}
                />
              </div>
            ) : (
              <div className="flex gap-2">
                <PostFilterPanel
                  selectedCategories={selectedCategories} setSelectedCategories={setSelectedCategories}
                  buttonStyle={buttonStyle} postCategories={postCategories} getCategoryByName={getCategoryByName}
                />
                <ResetMapButton
                  mapRef={mapRef} fetchPostsData={fetchPostsData} setSelectedLocation={setSelectedLocation}
                  id={pageId} isMobile={isMobile} buttonStyle={buttonStyle}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Mobile Reset Button */}
      {isMobile && (
        <div className="absolute right-1 z-[1000]" style={{ bottom: '238px' }}>
          <ResetMapButton mapRef={mapRef} fetchPostsData={fetchPostsData} setSelectedLocation={setSelectedLocation} id={pageId} isMobile buttonStyle={buttonStyle} />
        </div>
      )}

      {/* Tourism: District label + clear */}
      <div className="absolute top-4 left-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {selectedDistrict && (
          <div className="flex flex-col gap-2">
            <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-white/20">
              <span className="font-black text-gray-800 tracking-wider text-sm uppercase">{selectedDistrict}</span>
            </div>
            <button onClick={() => setSelectedDistrict(null)} className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors w-fit shadow-md animate-in fade-in slide-in-from-left-2">
              <X size={12} /> Clear Filter
            </button>
          </div>
        )}
      </div>

      {/* Tourism: Accepted Items Stack */}
      {acceptedItems.length > 0 && (
        <div className="absolute left-4 top-24 z-[90] flex flex-col gap-3 pointer-events-none">
          {acceptedItems.map((item, idx) => (
            <div key={item.id} className="pointer-events-auto group relative animate-in slide-in-from-left-8 duration-500" style={{ transitionDelay: `${idx * 100}ms` }}>
              <button onClick={() => { setSelectedDetailItem(item); setShowDetailModal(true); }} className={`w-14 h-14 rounded-2xl shadow-2xl border-2 p-1 overflow-hidden transition-all duration-300 hover:scale-110 active:scale-95 ${selectedDetailItem?.id === item.id ? 'border-orange-500 scale-105' : 'border-white'}`}>
                <img src={item.media?.[0]?.media_url || '/placeholder.jpg'} className="w-full h-full object-cover rounded-xl" alt="" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                <div className="absolute top-1 right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-sm" />
              </button>
              <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl border border-gray-800">
                {item.title}
                <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45 border-l border-b border-gray-800" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tourism: Category Filter Sidebar */}
      {selectedDistrict && (
        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-[50] pointer-events-none">
          {[
            { name: 'Challenges', icon: Target,   color: 'text-orange-500' },
            { name: 'Places',     icon: MapPin,    color: 'text-green-500'  },
            { name: 'Food',       icon: Utensils,  color: 'text-red-500'    },
            { name: 'Activity',   icon: Activity,  color: 'text-purple-500' },
            { name: 'Events',     icon: Calendar,  color: 'text-indigo-500' }
          ].map((cat) => (
            <button
              key={cat.name}
              onClick={() => setActiveDiscoveryCategory(activeDiscoveryCategory === cat.name ? null : cat.name)}
              title={cat.name}
              className={`pointer-events-auto p-4 rounded-2xl shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 border-2 ${
                activeDiscoveryCategory === cat.name ? 'bg-gray-900 text-white border-gray-800 scale-110' : 'bg-white text-gray-500 border-white hover:border-gray-100'
              }`}
            >
              <cat.icon size={24} className={activeDiscoveryCategory === cat.name ? 'text-white' : cat.color} />
            </button>
          ))}
        </div>
      )}

      {/* No posts found */}
      {!isLoading && pageId && postsItems.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-[5]">
          <div className="text-center p-8 bg-white rounded-lg shadow-lg border border-red-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Posts Found</h3>
            <p className="text-gray-600">No posts available</p>
          </div>
        </div>
      )}

      {/* ── Leaflet Map ──────────────────────────────────────────────────────── */}
      <div style={containerStyle} className="relative">
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

        <MapTypeControls mapRef={mapRef} buttonStyle={buttonStyle} />
        <ZoomControls    mapRef={mapRef} isMobile={isMobile} />

        {/* Main post/registration popup portal */}
        {leafletReady && mainPopupDomRef.current && currentItem && selectedLocation &&
          createPortal(
            <MapCard
              post={currentItem}
              user={user}
              onClose={() => { setSelectedLocation(null); setShowRegistrationDetails(false); setShowUserProfile(false); setCurrentRegistrationIndex(0); }}
              onPrev={showRegistrationDetails ? handlePrevRegistration : handlePrevPost}
              onNext={showRegistrationDetails ? handleNextRegistration : handleNextPost}
              currentIndex={showRegistrationDetails ? currentRegistrationIndex : currentPostIndex}
              totalItems={showRegistrationDetails ? (groupedRegistrations[selectedLocation?.key]?.length || 0) : selectedPostGroup.length}
              onLike={handleLikePost}
              isLiked={postLikes[currentItem.id]}
              likeCount={postLikeCounts[currentItem.id] || 0}
              onProfileClick={() => setShowUserProfile(true)}
              onApplyClick={() => setShowRegistrationModal(true)}
              showRegistrationDetails={showRegistrationDetails}
              onBackFromRegistration={() => setShowRegistrationDetails(false)}
              getCurrentRegistrationItem={getCurrentRegistrationItem}
              currentRegistrationIndex={currentRegistrationIndex}
              showUserProfile={showUserProfile}
              onBackFromProfile={() => setShowUserProfile(false)}
            />,
            mainPopupDomRef.current
          )
        }

        {/* Tourism item popup portal */}
        {leafletReady && tourismPopupDomRef.current && activeCategoryMarker &&
          createPortal(
            (() => {
              const markerData = categoryMarkers.find(m => m.id === activeCategoryMarker);
              if (!markerData) return null;
              return (
                <div className="bg-white rounded-[2rem] overflow-hidden font-sans relative w-[240px] sm:w-[280px] transition-all duration-300">
                  <div className="px-4 py-3 flex items-center justify-between bg-white border-b border-gray-50">
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded text-white ${
                        markerData.category === 'Challenges' ? 'bg-orange-500' :
                        markerData.category === 'Places'     ? 'bg-green-500'  :
                        markerData.category === 'Food'       ? 'bg-red-500'    :
                        markerData.category === 'Activity'   ? 'bg-purple-500' :
                        markerData.category === 'Events'     ? 'bg-indigo-500' : 'bg-blue-500'
                      }`}>
                        {markerData.category === 'Challenges' ? <Target size={12} /> :
                         markerData.category === 'Places'     ? <MapPin size={12} /> :
                         markerData.category === 'Food'       ? <Utensils size={12} /> :
                         markerData.category === 'Activity'   ? <Activity size={12} /> :
                         markerData.category === 'Events'     ? <Calendar size={12} /> : <Star size={12} />}
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{markerData.category}</span>
                    </div>
                    <button onClick={() => setActiveCategoryMarker(null)} className="text-gray-300 hover:text-gray-600"><X size={16} /></button>
                  </div>
                  <div className="p-4">
                    <div className="h-32 w-full rounded-2xl overflow-hidden mb-3 shadow-inner">
                      <img src={markerData.media?.[0]?.media_url || '/placeholder.jpg'} className="w-full h-full object-cover" alt="" />
                    </div>
                    <h3 className="font-black text-gray-900 text-sm mb-1 leading-tight">{markerData.title}</h3>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-black uppercase">
                        Entry: {markerData.entry_points ? `${markerData.entry_points} Pts` : 'Free'}
                      </span>
                    </div>
                    <button
                      onClick={() => { setSelectedDetailItem(markerData); setShowDetailModal(true); setActiveDetailTab('Rules'); setActiveCategoryMarker(null); }}
                      className="w-full py-3 bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
                    >
                      Next <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })(),
            tourismPopupDomRef.current
          )
        }
      </div>

      {/* ── Detail Sliding Modal ─────────────────────────────────────────────── */}
      {showDetailModal && selectedDetailItem && (
        <div className="fixed inset-0 z-[100] flex justify-end pointer-events-none">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] pointer-events-auto" onClick={() => setShowDetailModal(false)} />
          <div className={`${isMobile ? 'w-[85%] h-[85%] my-auto mr-0 rounded-l-[2.5rem]' : 'w-[30%] h-[85%] my-auto mr-0 rounded-l-[3rem]'} bg-white shadow-[-20px_0_60px_rgba(0,0,0,0.1)] pointer-events-auto animate-in slide-in-from-right duration-500 flex flex-col relative overflow-hidden border border-gray-100/50`}>
            {/* Header */}
            <div className="bg-white p-6 flex items-center justify-between border-b border-gray-50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full text-white ${
                  selectedDetailItem.category === 'Challenges' ? 'bg-orange-500' :
                  selectedDetailItem.category === 'Places'     ? 'bg-green-500'  :
                  selectedDetailItem.category === 'Food'       ? 'bg-red-500'    :
                  selectedDetailItem.category === 'Activity'   ? 'bg-purple-500' :
                  selectedDetailItem.category === 'Events'     ? 'bg-indigo-500' : 'bg-blue-500'
                }`}>
                  {selectedDetailItem.category === 'Challenges' ? <Target size={16} /> :
                   selectedDetailItem.category === 'Places'     ? <MapPin size={16} /> :
                   selectedDetailItem.category === 'Food'       ? <Utensils size={16} /> :
                   selectedDetailItem.category === 'Activity'   ? <Activity size={16} /> :
                   selectedDetailItem.category === 'Events'     ? <Calendar size={16} /> : <Star size={16} />}
                </div>
                <span className="font-black text-blue-600 text-xs tracking-[0.2em] uppercase">{selectedDetailItem.category}</span>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-none pb-24">
              <div className="px-6 py-4 text-center">
                <h2 className="text-gray-900 text-2xl font-black tracking-tight leading-tight uppercase mb-4">{selectedDetailItem.title}</h2>
                <div className="rounded-[2.5rem] overflow-hidden shadow-2xl h-56 relative mb-6">
                  <img src={selectedDetailItem.media?.[0]?.media_url || '/placeholder.jpg'} className="w-full h-full object-cover" alt="" />
                </div>
              </div>

              {/* Tabs */}
              <div className="flex px-6 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
                {['Rules', 'People', 'Leaderboard'].map((tab) => (
                  <button key={tab} onClick={() => setActiveDetailTab(tab)} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest relative transition-all ${activeDetailTab === tab ? 'text-blue-600' : 'text-gray-400'}`}>
                    {tab}
                    {activeDetailTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full mx-4" />}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {activeDetailTab === 'Rules' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2">
                    <p className="text-gray-600 text-sm leading-relaxed mb-6">{selectedDetailItem.description || "Historical and cultural landmark."}</p>
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-blue-50 p-4 rounded-3xl border border-blue-100 text-center">
                        <span className="text-[8px] uppercase font-black text-blue-400 block mb-1">Price</span>
                        <span className="text-lg font-black text-blue-700">{selectedDetailItem.entry_points ? `${selectedDetailItem.entry_points} Pts` : 'Free'}</span>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-3xl border border-yellow-100 text-center">
                        <span className="text-[8px] uppercase font-black text-yellow-500 block mb-1">Prize</span>
                        <span className="text-lg font-black text-yellow-700">{selectedDetailItem.reward_points || 0} Pts</span>
                      </div>
                    </div>
                  </div>
                )}
                {(activeDetailTab === 'People' || activeDetailTab === 'Leaderboard') && (
                  <div className="text-center py-10">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">No data available yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-gray-50">
              {completedItemIds.has(selectedDetailItem.id) ? (
                <div className="text-center text-gray-400 font-black text-[10px] py-4 uppercase tracking-[0.2em]">ITEM COMPLETED</div>
              ) : acceptedItems.find(i => i.id === selectedDetailItem.id) ? (
                <div className="flex gap-3">
                  <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedDetailItem.position.lat},${selectedDetailItem.position.lng}`, '_blank')} className="flex-1 bg-gray-200 text-gray-700 font-black text-xs py-4 rounded-2xl flex items-center justify-center gap-2">
                    <Navigation2 size={16} /> ROUTE
                  </button>
                  <button
                    onClick={() => {
                      const inRange = isWithinRadius(selectedDetailItem);
                      if (!inRange) { toast.error("You must be closer to the location to complete this!"); return; }
                      if (selectedDetailItem.category === 'Food' || selectedDetailItem.category === 'Events') setShowQRModal(true);
                      else setShowUploadModal(true);
                    }}
                    className={`flex-1 font-black text-xs py-4 rounded-2xl flex justify-center items-center shadow-lg transition-all ${isWithinRadius(selectedDetailItem) ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-xl' : 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300'}`}
                  >
                    {!isWithinRadius(selectedDetailItem) ? 'TOO FAR AWAY' : (selectedDetailItem.category === 'Food' || selectedDetailItem.category === 'Events' ? 'SCAN QR' : 'UPLOAD MEDIA')}
                  </button>
                </div>
              ) : deniedItemIds.has(selectedDetailItem.id) ? (
                <div className="text-center text-gray-400 font-black text-[10px] py-4 uppercase tracking-[0.2em]">Item Hidden</div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      setAcceptedItems(prev => [...prev, selectedDetailItem]);
                      toast.success("Challenge Accepted! Start traveling!");
                      setShowDetailModal(false);
                      try { await fetch('/api/challenges/user', { method: 'POST', body: JSON.stringify({ challenge_id: selectedDetailItem.id, status: 'accepted' }) }); } catch {}
                    }}
                    className="flex-1 bg-green-600 text-white font-black text-xs py-4 rounded-2xl flex justify-center items-center shadow-lg hover:shadow-xl transition-all"
                  >
                    ACCEPT CHALLENGE
                  </button>
                  <button onClick={() => { setDeniedItemIds(prev => new Set([...prev, selectedDetailItem.id])); setShowDetailModal(false); }} className="flex-1 bg-red-600 text-white font-black text-xs py-4 rounded-2xl">
                    HIDE
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── QR Scan Modal ────────────────────────────────────────────────────── */}
      {showQRModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
          <div className="relative w-full max-w-md bg-white rounded-[3rem] overflow-hidden shadow-2xl p-8 text-center animate-in zoom-in duration-300">
            <button onClick={() => !qrScanning && setShowQRModal(false)} className="absolute top-6 right-6 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
            <h2 className="text-3xl font-black mb-2">Scan QR Code</h2>
            <p className="text-gray-400 text-sm mb-8 font-bold">Verification processing...</p>
            <div className="aspect-square w-full max-w-[240px] mx-auto mb-8 rounded-[2.5rem] border-4 border-dashed border-blue-100 flex items-center justify-center relative overflow-hidden bg-gray-50">
              {qrSuccess ? (
                <div className="h-full w-full flex flex-col items-center justify-center bg-green-500 text-white animate-in zoom-in">
                  <CheckCircle size={80} className="mb-4" />
                  <p className="font-black text-2xl uppercase tracking-widest">SUCCESS</p>
                </div>
              ) : (
                <div className={`transition-opacity duration-300 ${qrScanning ? 'opacity-100' : 'opacity-20'}`}>
                  <QrCode size={120} className={qrScanning ? 'animate-pulse' : ''} />
                </div>
              )}
              {qrScanning && <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_20px_blue] animate-bounce" style={{ top: '50%' }} />}
            </div>
            {!qrSuccess && (
              <button
                onClick={() => {
                  setQrScanning(true);
                  setTimeout(() => {
                    setQrScanning(false); setQRSuccess(true);
                    setTimeout(() => { setShowQRModal(false); setShowUploadModal(true); setQRSuccess(false); }, 1500);
                  }, 2000);
                }}
                disabled={qrScanning}
                className="w-full bg-blue-600 text-white font-black py-5 rounded-3xl text-lg hover:bg-blue-700 transition-all disabled:bg-gray-100 disabled:text-gray-400"
              >
                {qrScanning ? 'VERIFYING...' : 'SIMULATE SCAN'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Upload Media Modal ───────────────────────────────────────────────── */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
          <div className="relative w-full max-w-md bg-white rounded-[3rem] overflow-hidden shadow-2xl p-8 text-center animate-in zoom-in duration-300">
            <button onClick={() => !uploading && setShowUploadModal(false)} className="absolute top-6 right-6 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
            <h2 className="text-3xl font-black mb-2">Upload Evidence</h2>
            <p className="text-gray-400 text-sm mb-8 font-bold">Provide an image or video.</p>
            <div className="aspect-square w-full max-w-[240px] mx-auto mb-8 rounded-[2.5rem] border-4 border-dashed border-indigo-100 flex items-center justify-center relative overflow-hidden bg-gray-50 hover:bg-indigo-50 transition-colors">
              {uploadSuccess ? (
                <div className="h-full w-full flex flex-col items-center justify-center bg-[#00C853] text-white animate-in zoom-in">
                  <CheckCircle size={80} className="mb-4" />
                  <p className="font-black text-2xl uppercase tracking-widest">COMPLETED</p>
                </div>
              ) : (
                <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center transition-opacity duration-300">
                  <input
                    type="file" className="hidden" accept="image/*,video/*"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      setUploading(true);
                      const formData = new FormData();
                      formData.append('coverImage', file);
                      formData.append('type', file.type.startsWith('video') ? 'video' : 'photo');
                      try {
                        const res    = await fetch('https://wowfy.in/wowfy_app_codebase/upload.php', { method: 'POST', body: formData });
                        const result = await res.json();
                        if (result.success) {
                          setUploadSuccess(true);
                          fetch('/api/challenges/user', { method: 'POST', body: JSON.stringify({ challenge_id: selectedDetailItem.id, status: 'completed' }) });
                          setCompletedItemIds(prev => new Set([...prev, selectedDetailItem.id]));
                          setAcceptedItems(prev => prev.filter(i => i.id !== selectedDetailItem.id));
                          setTimeout(() => { setShowUploadModal(false); setShowDetailModal(false); setUploadSuccess(false); }, 1500);
                        } else { toast.error(result.error || "Upload failed"); }
                      } catch { toast.error("Upload error"); } finally { setUploading(false); }
                    }}
                  />
                  <div className={`transition-opacity duration-300 ${uploading ? 'opacity-100 animate-pulse text-indigo-500' : 'opacity-60 text-gray-500'} flex flex-col items-center justify-center`}>
                    <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                    <span className="font-black tracking-widest uppercase text-sm text-center">{uploading ? 'UPLOADING...' : 'TAP TO BROWSE'}</span>
                    {!uploading && <span className="text-[10px] mt-2 font-bold text-gray-400 uppercase tracking-widest">Image or Video</span>}
                  </div>
                </label>
              )}
            </div>
            {!uploadSuccess && <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Select file directly above to complete.</p>}
          </div>
        </div>
      )}

      {showRegistrationModal && (
        <PostRegistrationModal
          isOpen={showRegistrationModal}
          onClose={() => setShowRegistrationModal(false)}
          post={currentPost}
          onSubmit={(result) => console.log('Registration successful:', result)}
        />
      )}

      {isLoading && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white py-2 px-4 rounded-full shadow-md z-[1000]">
          <div className="flex items-center space-x-2">
            <Loader2 className="animate-spin h-5 w-5 text-blue-600" />
            <span>Loading Data...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-100 text-red-700 py-2 px-4 rounded-full shadow-md z-[1000]">
          {error}
        </div>
      )}

      <style>{`
        .leaflet-container { width: 100%; height: 100%; }
        .leaflet-page-popup .leaflet-popup-content-wrapper,
        .leaflet-tourism-popup .leaflet-popup-content-wrapper {
          padding: 0; border-radius: 12px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.18); overflow: hidden;
        }
        .leaflet-page-popup .leaflet-popup-content,
        .leaflet-tourism-popup .leaflet-popup-content { margin: 0; }
        .leaflet-page-popup .leaflet-popup-close-button,
        .leaflet-tourism-popup .leaflet-popup-close-button { display: none !important; }
      `}</style>
    </div>
  );
}