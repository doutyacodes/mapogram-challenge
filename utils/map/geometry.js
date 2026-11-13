// Pure geo helpers (no map library). Replace google.maps.geometry.* usage.
// GeoJSON coordinates are [lng, lat]; Leaflet expects [lat, lng].

const EARTH_RADIUS_M = 6371000;

/** Great-circle distance in metres (replaces geometry.spherical.computeDistanceBetween). */
export function haversineMeters(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Normalise any GeoJSON object (FeatureCollection, Feature, GeometryCollection,
 * Polygon, MultiPolygon) into a list of polygons, each a list of rings of
 * [lng, lat] pairs. Non-polygon geometries are ignored.
 */
export function getPolygons(geojson) {
  if (!geojson) return [];
  const g = typeof geojson === "string" ? JSON.parse(geojson) : geojson;
  switch (g.type) {
    case "FeatureCollection":
      return (g.features || []).flatMap(getPolygons);
    case "Feature":
      return getPolygons(g.geometry);
    case "GeometryCollection":
      return (g.geometries || []).flatMap(getPolygons);
    case "Polygon":
      return [g.coordinates];
    case "MultiPolygon":
      return g.coordinates;
    default:
      return [];
  }
}

// Ray casting on a single ring; x = lng, y = lat.
function pointInRing(lng, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/** True when the point is inside any polygon (respecting holes). Replaces geometry.poly.containsLocation. */
export function pointInGeoJSON(lat, lng, geojson) {
  return getPolygons(geojson).some(([outer, ...holes]) =>
    outer && pointInRing(lng, lat, outer) && !holes.some((hole) => pointInRing(lng, lat, hole))
  );
}

/** Polygons as Leaflet lat/lng rings: [[ [lat,lng], ... ], ...] per polygon. */
export function toLatLngPolygons(geojson) {
  return getPolygons(geojson).map((rings) => rings.map((ring) => ring.map(([lng, lat]) => [lat, lng])));
}

/** [[south, west], [north, east]] bounds of all polygon coordinates, or null. */
export function geojsonBounds(geojson) {
  let south = Infinity, west = Infinity, north = -Infinity, east = -Infinity;
  for (const rings of getPolygons(geojson)) {
    for (const ring of rings) {
      for (const [lng, lat] of ring) {
        if (lat < south) south = lat;
        if (lat > north) north = lat;
        if (lng < west) west = lng;
        if (lng > east) east = lng;
      }
    }
  }
  return Number.isFinite(south) ? [[south, west], [north, east]] : null;
}

/**
 * Rings for a "world minus geofence" mask polygon: the world rectangle followed
 * by every ring of the geofence. Leaflet fills with even-odd, so the geofence
 * becomes a hole (and any enclaves inside it are masked again).
 */
export function worldMaskRings(geojson) {
  const world = [[85, -180], [85, 180], [-85, 180], [-85, -180]];
  return [world, ...toLatLngPolygons(geojson).flat()];
}
