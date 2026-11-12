// Place search (replaces Google Places Autocomplete + Geocoder).
//
// Uses Photon (https://photon.komoot.io), an OpenStreetMap geocoder built for
// search-as-you-type. Nominatim's usage policy forbids client-side autocomplete,
// so it is not used here. Callers should debounce keystrokes (PlaceSearchInput does).

const PHOTON_URL = "https://photon.komoot.io/api/";

function formatLabel(p) {
  const street = p.street ? (p.housenumber ? `${p.street} ${p.housenumber}` : p.street) : null;
  const parts = [p.name, street, p.district, p.city || p.town || p.village, p.county, p.state, p.country];
  return parts.filter(Boolean).filter((part, i, all) => all.indexOf(part) === i).join(", ");
}

/**
 * @param {string} query
 * @param {{ near?: {lat:number,lng:number}, limit?: number, signal?: AbortSignal }} [options]
 * @returns {Promise<Array<{ lat:number, lng:number, name:string, label:string }>>}
 */
export async function searchPlaces(query, { near, limit = 6, signal } = {}) {
  const q = query?.trim();
  if (!q) return [];

  const params = new URLSearchParams({ q, limit: String(limit) });
  if (near && Number.isFinite(near.lat) && Number.isFinite(near.lng)) {
    // Bias results towards this point (does not restrict them).
    params.set("lat", String(near.lat));
    params.set("lon", String(near.lng));
  }

  const response = await fetch(`${PHOTON_URL}?${params}`, { signal });
  if (!response.ok) throw new Error(`Place search failed (${response.status})`);
  const data = await response.json();

  return (data.features || [])
    .filter((f) => f.geometry?.type === "Point")
    .map((f) => ({
      lng: f.geometry.coordinates[0],
      lat: f.geometry.coordinates[1],
      name: f.properties?.name || "",
      label: formatLabel(f.properties || {}),
    }));
}
