"use client";

import { useEffect, useRef } from "react";
import { getLeaflet } from "@/utils/map/leaflet";

/**
 * A single marker that follows `position` (replaces <Marker>/<MarkerF>).
 * The marker exists while `position` is set and is removed when it is null.
 *
 * `createIcon(L)` (optional) is called once when the marker is created — pass a
 * stable function. Drag callbacks receive an L.LatLng.
 */
export function useMapMarker(map, position, { draggable = false, title, zIndexOffset = 0, createIcon, onDrag, onDragEnd } = {}) {
  const markerRef = useRef(null);
  const latestRef = useRef({ position, createIcon, onDrag, onDragEnd });

  useEffect(() => {
    latestRef.current = { position, createIcon, onDrag, onDragEnd };
  });

  const lat = position?.lat;
  const lng = position?.lng;
  const hasPosition = Number.isFinite(lat) && Number.isFinite(lng);

  // Create / remove
  useEffect(() => {
    const L = getLeaflet();
    if (!map || !L || !hasPosition) return;
    const { position: initial, createIcon: makeIcon } = latestRef.current;

    const marker = L.marker([initial.lat, initial.lng], {
      draggable,
      title,
      zIndexOffset,
      ...(makeIcon ? { icon: makeIcon(L) } : {}),
    }).addTo(map);
    marker.on("drag", (e) => latestRef.current.onDrag?.(e.target.getLatLng()));
    marker.on("dragend", (e) => latestRef.current.onDragEnd?.(e.target.getLatLng()));

    markerRef.current = marker;
    return () => {
      marker.remove();
      markerRef.current = null;
    };
  }, [map, hasPosition, draggable, title, zIndexOffset]);

  // Move
  useEffect(() => {
    if (markerRef.current && hasPosition) markerRef.current.setLatLng([lat, lng]);
  }, [lat, lng, hasPosition]);

  return markerRef;
}
