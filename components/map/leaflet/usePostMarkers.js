"use client";

import { useEffect, useRef } from "react";
import { getLeaflet, toLeafletIcon } from "@/utils/map/leaflet";
import { createPostCategoryMarkerIcon } from "@/utils/map/markerUtils";

const DEFAULT_CATEGORY = { name: "Default", shape: "pin", icon_name: "MapPin", color: "#6b7280" };

function registrationIcon(L, count) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
      <circle cx="12" cy="12" r="10" fill="#059669" stroke="#047857" stroke-width="2"/>
      <path d="M8 12l2 2 4-4" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="12" y="20" text-anchor="middle" fill="#047857" font-size="8" font-weight="bold">${count}</text>
    </svg>`;
  return L.icon({
    iconUrl: "data:image/svg+xml," + encodeURIComponent(svg),
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

/**
 * Keeps one clustered marker per post location (and per registration location)
 * in sync with the grouped data. Replaces the google.maps.Marker +
 * MarkerClusterer effects the map views used to have.
 *
 * Markers are reused across updates; only their icon/read-state changes.
 */
export function usePostMarkers({
  map,
  clusterGroup,
  groupedPosts,
  groupedRegistrations,
  selectedCategories,
  readPostIds,
  postCategories,
  onPostClick,
  onRegistrationClick,
  shouldBlink, // optional (mainPost) => boolean, e.g. issues assigned to the viewer
}) {
  const markersRef = useRef(new Map());
  const handlersRef = useRef({ onPostClick, onRegistrationClick, shouldBlink });

  useEffect(() => {
    handlersRef.current = { onPostClick, onRegistrationClick, shouldBlink };
  }, [onPostClick, onRegistrationClick, shouldBlink]);

  useEffect(() => {
    const L = getLeaflet();
    if (!L || !map || !clusterGroup) return;

    const markers = markersRef.current;
    const wanted = new Set();
    const readIds = readPostIds || [];

    for (const [locationKey, postsAtLocation] of Object.entries(groupedPosts || {})) {
      const mainPost = postsAtLocation[0];
      if (!mainPost) continue;
      // Hidden by the category filter
      if (mainPost.category && selectedCategories && !selectedCategories.includes(mainPost.category)) continue;

      wanted.add(locationKey);
      const allRead = postsAtLocation.every((post) => readIds.includes(post.id));
      const categoryData = (postCategories || []).find((cat) => cat.id === mainPost.category_id) || DEFAULT_CATEGORY;
      const blink = Boolean(handlersRef.current.shouldBlink?.(mainPost));
      const icon = toLeafletIcon(L, createPostCategoryMarkerIcon(categoryData, postsAtLocation.length, mainPost, allRead, blink));

      let marker = markers.get(locationKey);
      if (marker) {
        marker.setIcon(icon);
        marker.options._allRead = allRead; // read by createClusterRenderer
      } else {
        const [lat, lng] = locationKey.split(",").map(parseFloat);
        marker = L.marker([lat, lng], { icon, zIndexOffset: 100, _allRead: allRead });
        marker.on("click", (e) => {
          L.DomEvent.stopPropagation(e);
          handlersRef.current.onPostClick?.(locationKey);
        });
        markers.set(locationKey, marker);
        clusterGroup.addLayer(marker);
      }
    }

    for (const [locationKey, registrations] of Object.entries(groupedRegistrations || {})) {
      const key = `reg_${locationKey}`;
      wanted.add(key);
      const icon = registrationIcon(L, registrations.length);

      let marker = markers.get(key);
      if (marker) {
        marker.setIcon(icon);
      } else {
        const [lat, lng] = locationKey.split(",").map(parseFloat);
        marker = L.marker([lat, lng], {
          icon,
          zIndexOffset: 200,
          title: `${registrations.length} Registration(s)`,
        });
        marker.on("click", (e) => {
          L.DomEvent.stopPropagation(e);
          handlersRef.current.onRegistrationClick?.(locationKey);
        });
        markers.set(key, marker);
        clusterGroup.addLayer(marker);
      }
    }

    for (const [key, marker] of markers) {
      if (!wanted.has(key)) {
        clusterGroup.removeLayer(marker);
        markers.delete(key);
      }
    }

    // Recompute cluster bubbles (read/unread colouring depends on child markers).
    clusterGroup.refreshClusters();
  }, [map, clusterGroup, groupedPosts, groupedRegistrations, selectedCategories, readPostIds, postCategories]);

  // The cluster group (and its markers) dies with the map; just forget our references.
  useEffect(() => {
    const markers = markersRef.current;
    return () => markers.clear();
  }, [clusterGroup]);
}
