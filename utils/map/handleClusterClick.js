// utils/map/handleClusterClick.js
// Leaflet version — replaces google.maps.LatLngBounds and google.maps.event

export const handleClusterClick = (clusterGroup, cluster, mapRef) => {
  if (!mapRef) return;

  // Leaflet MarkerClusterGroup fires 'clusterclick' with the cluster layer
  // cluster here is the L.MarkerCluster layer
  const childMarkers = cluster.getAllChildMarkers
    ? cluster.getAllChildMarkers()
    : [];

  if (childMarkers.length === 0) return;

  // Build Leaflet LatLngBounds from all child marker positions
  // Dynamically import to stay SSR-safe — L is already loaded at this point
  const L = window._leaflet_L; // set during map init (see note below)

  if (!L) {
    // Fallback: just zoom in on cluster center
    mapRef.setView(cluster.getLatLng(), Math.min(mapRef.getZoom() + 2, 12));
    return;
  }

  const bounds = L.latLngBounds(childMarkers.map(m => m.getLatLng()));
  mapRef.fitBounds(bounds, { maxZoom: 12, animate: true, duration: 0.8 });
};
