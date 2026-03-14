import { NextResponse } from 'next/server';

// Common district name variations and aliases
const districtAliases = {
  'kanyakumari': ['kanniyakumari', 'cape comorin', 'kanya kumari'],
  'thiruvananthapuram': ['trivandrum', 'tvm', 'thiruvanthapuram'],
  'bangalore': ['bengaluru', 'bangalore urban'],
  'mumbai': ['bombay', 'mumbai suburban'],
  'chennai': ['madras'],
  'kolkata': ['calcutta'],
  'vishakhapatnam': ['visakhapatnam', 'vizag', 'vishakhapattanam'],
  'pondicherry': ['puducherry', 'pondy'],
  // Add more as needed
};

// Normalize search query
function normalizeQuery(query) {
  const normalized = query.toLowerCase().trim();
  
  // Check if query matches any alias
  for (const [standard, aliases] of Object.entries(districtAliases)) {
    if (aliases.includes(normalized) || standard === normalized) {
      return standard;
    }
  }
  
  return normalized;
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({ 
        districts: [],
        message: 'Query too short' 
      });
    }

    const normalizedQuery = normalizeQuery(query);
    
    // Search with multiple variations
    const searchTerms = [
      normalizedQuery,
      `${normalizedQuery} district`,
      query, // Original query
    ];

    const allResults = [];

    // Try each search term using the geojson format endpoint
    for (const term of searchTerms) {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(term + ' India')}&` +
          `format=json&` +
          `addressdetails=1&` +
          `polygon_geojson=1&` + // Request GeoJSON polygons
          `limit=15&` +
          `countrycodes=in`,
          {
            headers: {
              'User-Agent': 'DistrictCommunityApp/1.0'
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          allResults.push(...data);
        }
      } catch (err) {
        console.error(`Search failed for term: ${term}`, err);
      }
    }

    // Filter for districts only
    const districts = allResults.filter(item => {
      // Must be a relation (districts are always relations in OSM)
      if (item.osm_type !== 'relation') return false;

      // Check for district indicators
      const isStateDistrict = item.addresstype === 'state_district';
      const isCounty = item.addresstype === 'county';
      
      const isAdminBoundary = (
        item.class === 'boundary' && 
        item.type === 'administrative' &&
        item.place_rank >= 10 && 
        item.place_rank <= 12
      );

      // Must not be a state
      const notState = item.addresstype !== 'state';
      const notCountry = item.addresstype !== 'country';

      // Check if it has valid geometry (proper boundary data)
      const hasGeometry = item.geojson && 
        (item.geojson.type === 'Polygon' || item.geojson.type === 'MultiPolygon');

      return (isStateDistrict || isCounty || isAdminBoundary) && 
             notState && 
             notCountry && 
             hasGeometry;
    });

    // Remove duplicates
    const uniqueDistricts = [];
    const seenIds = new Set();

    for (const district of districts) {
      if (!seenIds.has(district.osm_id)) {
        seenIds.add(district.osm_id);
        uniqueDistricts.push({
          osm_id: district.osm_id,
          osm_type: district.osm_type,
          name: district.name,
          display_name: district.display_name,
          state: district.address?.state || '',
          lat: district.lat,
          lon: district.lon,
          boundingbox: district.boundingbox,
          importance: district.importance,
          place_rank: district.place_rank,
          addresstype: district.addresstype,
          has_boundary: true, // Confirmed to have boundary data
        });
      }
    }

    // Sort by relevance
    uniqueDistricts.sort((a, b) => {
      // Exact name match gets highest priority
      const aExactMatch = a.name?.toLowerCase() === normalizedQuery;
      const bExactMatch = b.name?.toLowerCase() === normalizedQuery;
      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;

      // Partial name match
      const aPartialMatch = a.name?.toLowerCase().includes(normalizedQuery);
      const bPartialMatch = b.name?.toLowerCase().includes(normalizedQuery);
      if (aPartialMatch && !bPartialMatch) return -1;
      if (!aPartialMatch && bPartialMatch) return 1;

      // Then by importance
      return (b.importance || 0) - (a.importance || 0);
    });

    return NextResponse.json({
      districts: uniqueDistricts.slice(0, 10),
      query: normalizedQuery,
      total: uniqueDistricts.length,
    });

  } catch (error) {
    console.error('District search error:', error);
    return NextResponse.json(
      { 
        districts: [],
        error: 'Search failed',
        message: error.message 
      },
      { status: 500 }
    );
  }
}