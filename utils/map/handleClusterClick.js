// utils/map/handleClusterClick.js

export const handleClusterClick = (event, cluster, mapRef) => {
  if (!mapRef) return;

  let markers = [];
  
  if (cluster?.markers) {
    markers = cluster.markers;
  } else if (cluster?.getMarkers) {
    markers = cluster.getMarkers();
  } else if (event?.cluster) {
    markers = event.cluster.markers || [];
  } else {
    console.log('Cluster structure:', cluster, 'Event:', event);
    return;
  }

  if (markers.length === 0) return;

  const bounds = new google.maps.LatLngBounds();
  markers.forEach(marker => {
    bounds.extend(marker.getPosition());
  });

  mapRef.fitBounds(bounds, {
    duration: 800,
  });

  const listener = google.maps.event.addListener(mapRef, 'idle', () => {
    if (mapRef.getZoom() > 12) {
      mapRef.setZoom(12);
      setTimeout(() => {
        mapRef.panTo(mapRef.getCenter());
      }, 100);
    }
    google.maps.event.removeListener(listener);
  });
};
