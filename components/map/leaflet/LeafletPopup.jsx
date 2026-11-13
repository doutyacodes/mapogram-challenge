"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getLeaflet } from "@/utils/map/leaflet";

/**
 * Renders React children inside a Leaflet popup (replaces <InfoWindowF>).
 *
 * Mount it while the popup should be open. `onClose` fires when Leaflet closes
 * the popup itself (map click, Esc); unmounting closes it silently.
 */
export default function LeafletPopup({
  map,
  position,
  onClose,
  children,
  offset = [0, -5],
  maxWidth = 320,
  minWidth = 50,
  className = "leaflet-page-popup",
  closeButton = false,
  autoPan = true,
}) {
  const [container, setContainer] = useState(null);
  const popupRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const optionsRef = useRef({ offset, maxWidth, minWidth, className, closeButton, autoPan });

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Create the popup once per map.
  useEffect(() => {
    const L = getLeaflet();
    if (!map || !L) return;

    const element = document.createElement("div");
    const popup = L.popup({ ...optionsRef.current, autoPanPadding: [20, 20] }).setContent(element);
    let closingFromReact = false;
    popup.on("remove", () => {
      if (!closingFromReact) onCloseRef.current?.();
    });

    popupRef.current = popup;
    setContainer(element);

    return () => {
      closingFromReact = true;
      popup.remove();
      popupRef.current = null;
      setContainer(null);
    };
  }, [map]);

  // Open / move it.
  const lat = position?.lat;
  const lng = position?.lng;
  useEffect(() => {
    const popup = popupRef.current;
    if (!map || !popup || lat == null || lng == null) return;
    popup.setLatLng([lat, lng]);
    if (!map.hasLayer(popup)) popup.openOn(map);
  }, [map, container, lat, lng]);

  // Content size changes (carousel, tabs) → reposition and re-pan.
  useEffect(() => {
    popupRef.current?.update();
  });

  return container ? createPortal(children, container) : null;
}
