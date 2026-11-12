"use client";

import { useEffect, useRef, useState } from "react";
import { loadLeaflet, releaseLeafletContainer, TILE_LAYER, toLatLngTuple } from "@/utils/map/leaflet";
import { createClusterRenderer } from "@/utils/map/createClusterRenderer";
import { handleClusterClick } from "@/utils/map/handleClusterClick";

const WORLD_BOUNDS = [[-85, -180], [85, 180]];

/**
 * Creates a Leaflet map inside `containerRef` (replaces <GoogleMap>).
 *
 * Options are read when the map is created (on mount, or when `enabled` turns
 * true for components that render the container after a loading state);
 * `clusterType`, `onClick` and `onContextMenu` may change later.
 * Returns the map instance as state so components re-render once it exists.
 */
export function useLeafletMap({
  center,
  zoom = 2,
  minZoom = 2,
  maxZoom = 18,
  zoomSnap = 1,
  zoomControl = false, // false | true | "topleft" | "topright" | "bottomleft" | "bottomright"
  cluster = false,
  clusterType = "page",
  clusterOptions = {},
  restrictToWorld = true,
  enabled = true,
  onClick,
  onContextMenu,
} = {}) {
  const containerRef = useRef(null);
  const [map, setMap] = useState(null);
  const [clusterGroup, setClusterGroup] = useState(null);
  const userHasInteractedRef = useRef(false);
  const optionsRef = useRef(null);
  const onClickRef = useRef(onClick);
  const onContextMenuRef = useRef(onContextMenu);

  // Runs before the init effect below, so it always sees the latest options.
  useEffect(() => {
    optionsRef.current = {
      center, zoom, minZoom, maxZoom, zoomSnap, zoomControl, cluster, clusterType, clusterOptions, restrictToWorld,
    };
    onClickRef.current = onClick;
    onContextMenuRef.current = onContextMenu;
  });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let instance = null;
    let initialPhaseTimer = null;
    const container = containerRef.current;
    const opts = optionsRef.current;

    loadLeaflet().then((L) => {
      if (cancelled || !container) return;
      releaseLeafletContainer(container);

      instance = L.map(container, {
        center: toLatLngTuple(opts.center) ?? [20, 0],
        zoom: opts.zoom,
        minZoom: opts.minZoom,
        maxZoom: opts.maxZoom,
        zoomSnap: opts.zoomSnap,
        zoomControl: false,
        attributionControl: true,
        ...(opts.restrictToWorld ? { maxBounds: WORLD_BOUNDS, maxBoundsViscosity: 1.0 } : {}),
      });
      if (opts.zoomControl) {
        L.control.zoom({ position: typeof opts.zoomControl === "string" ? opts.zoomControl : "topleft" }).addTo(instance);
      }
      L.tileLayer(TILE_LAYER.url, {
        // Upscale native tiles when the map allows deeper zoom than the tile server.
        maxNativeZoom: TILE_LAYER.maxZoom,
        maxZoom: Math.max(opts.maxZoom, TILE_LAYER.maxZoom),
        attribution: TILE_LAYER.attribution,
      }).addTo(instance);

      let group = null;
      if (opts.cluster) {
        group = L.markerClusterGroup({
          maxClusterRadius: 80,
          // Google MarkerClusterer used algorithmOptions.maxZoom = 12
          disableClusteringAtZoom: 13,
          spiderfyOnMaxZoom: true,
          showCoverageOnHover: false,
          chunkedLoading: true,
          zoomToBoundsOnClick: false, // handleClusterClick fits bounds itself
          ...opts.clusterOptions,
          iconCreateFunction: createClusterRenderer(instance, [], {}, { type: opts.clusterType }),
        });
        group.on("clusterclick", (e) => handleClusterClick(group, e.layer, instance));
        instance.addLayer(group);
      }

      // Programmatic moves right after load are not user interaction
      // (same 2s grace period the Google Maps version used).
      let initialPhase = true;
      initialPhaseTimer = setTimeout(() => {
        initialPhase = false;
      }, 2000);
      instance.on("dragstart", () => {
        userHasInteractedRef.current = true;
      });
      instance.on("zoomstart", () => {
        if (!initialPhase) userHasInteractedRef.current = true;
      });
      instance.on("click", (e) => {
        userHasInteractedRef.current = true;
        onClickRef.current?.(e);
      });
      instance.on("contextmenu", (e) => {
        onContextMenuRef.current?.(e);
      });

      setMap(instance);
      setClusterGroup(group);
    });

    return () => {
      cancelled = true;
      clearTimeout(initialPhaseTimer);
      if (instance) instance.remove();
      releaseLeafletContainer(container);
      setMap(null);
      setClusterGroup(null);
    };
  }, [enabled]);

  // Cluster icon style can depend on data fetched after the map exists (e.g. layer type).
  useEffect(() => {
    if (!map || !clusterGroup) return;
    clusterGroup.options.iconCreateFunction = createClusterRenderer(map, [], {}, { type: clusterType });
    clusterGroup.refreshClusters();
  }, [map, clusterGroup, clusterType]);

  // Keep tiles correct when the container is resized (modals, responsive layouts).
  useEffect(() => {
    const container = containerRef.current;
    if (!map || !container || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);

  return { containerRef, map, clusterGroup, userHasInteractedRef };
}
