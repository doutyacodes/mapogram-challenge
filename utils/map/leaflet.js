// Shared Leaflet bootstrap for client components. Leaflet touches `window` on
// import, so it is always loaded lazily from an effect, never at module scope.
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

export const TILE_LAYER = {
  url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19,
};

let leaflet = null;
let loading = null;

/** Load Leaflet + markercluster once and return the `L` namespace. */
export function loadLeaflet() {
  if (leaflet) return Promise.resolve(leaflet);
  if (!loading) {
    loading = (async () => {
      const L = (await import("leaflet")).default;
      // leaflet.markercluster registers itself on the global `L`.
      if (!window.L) window.L = L;
      await import("leaflet.markercluster");
      // createClusterRenderer / handleClusterClick read this global.
      window._leaflet_L = L;

      // Bundlers break Leaflet's CSS-based default icon path detection.
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: markerIcon2x.src ?? markerIcon2x,
        iconUrl: markerIcon.src ?? markerIcon,
        shadowUrl: markerShadow.src ?? markerShadow,
      });

      leaflet = L;
      return L;
    })();
  }
  return loading;
}

/** The loaded `L` namespace, or null before `loadLeaflet()` resolves. */
export function getLeaflet() {
  return leaflet;
}

/** Let a container be reused by a new map after a previous one was removed. */
export function releaseLeafletContainer(container) {
  if (!container || !container._leaflet_id) return;
  try {
    delete container._leaflet_id;
  } catch {
    container._leaflet_id = null;
  }
}

/** {lat,lng} | [lat,lng] → [lat,lng] (or null). */
export function toLatLngTuple(point) {
  if (!point) return null;
  if (Array.isArray(point)) return [Number(point[0]), Number(point[1])];
  const lat = Number(point.lat);
  const lng = Number(point.lng);
  return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;
}

/**
 * Convert a Google-Maps-style icon descriptor ({ url, scaledSize:{width,height},
 * anchor:{x,y} }) — the shape produced by utils/map/markerUtils — to an L.Icon.
 */
export function toLeafletIcon(L, descriptor) {
  if (!descriptor?.url) return new L.Icon.Default();
  const size = descriptor.scaledSize
    ? [descriptor.scaledSize.width, descriptor.scaledSize.height]
    : [48, 70];
  const anchor = descriptor.anchor
    ? [descriptor.anchor.x, descriptor.anchor.y]
    : [size[0] / 2, size[1]];
  return L.icon({ iconUrl: descriptor.url, iconSize: size, iconAnchor: anchor });
}

/** Small round "dot" marker (current location etc.). */
export function createDotIcon(L, { color = "#3B82F6", size = 20 } = {}) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="${color}" stroke="white" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="white"/></svg>`;
  return L.icon({
    iconUrl: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}
