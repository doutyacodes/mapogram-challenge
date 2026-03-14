import { NextResponse } from 'next/server';
import { db } from '@/utils';
import { PAGES, PAGE_PROFILES } from '@/utils/schema/schema';
import { SERVICE_CENTER_BRANDS, SERVICE_CENTER_PRODUCTS } from '@/utils/schema/complaints_schema';
import { eq, and, inArray, sql } from 'drizzle-orm';

// Haversine formula for distance calculation
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get('brandId');
    const productId = searchParams.get('productId');
    const userLat = searchParams.get('userLat');
    const userLng = searchParams.get('userLng');

    if (!brandId || !productId) {
      return NextResponse.json({ success: false, message: "Brand ID and Product ID required" }, { status: 400 });
    }

    console.log('Fetching service centers for:', { brandId, productId, userLat, userLng });

    // First, find service centers that support this brand
    const brandServiceCenters = await db
      .select({
        page_id: SERVICE_CENTER_BRANDS.page_id
      })
      .from(SERVICE_CENTER_BRANDS)
      .where(eq(SERVICE_CENTER_BRANDS.brand_id, parseInt(brandId)));

    console.log('Brand service centers:', brandServiceCenters);

    if (brandServiceCenters.length === 0) {
      return NextResponse.json({ success: true, serviceCenters: [] });
    }

    const pageIds = brandServiceCenters.map(sc => sc.page_id);

    // Then, find service centers that also support this product
    const productServiceCenters = await db
      .select({
        page_id: SERVICE_CENTER_PRODUCTS.page_id
      })
      .from(SERVICE_CENTER_PRODUCTS)
      .where(
        and(
          inArray(SERVICE_CENTER_PRODUCTS.page_id, pageIds),
          eq(SERVICE_CENTER_PRODUCTS.product_id, parseInt(productId))
        )
      );

    console.log('Product service centers:', productServiceCenters);

    const validPageIds = productServiceCenters.map(sc => sc.page_id);

    if (validPageIds.length === 0) {
      return NextResponse.json({ success: true, serviceCenters: [] });
    }

    console.log('Valid page IDs:', validPageIds);

    // Get service centers with location data
    const serviceCenters = await db
      .select({
        id: PAGES.id,
        name: PAGES.name,
        bio: PAGE_PROFILES.bio,
        profile_pic_url: PAGE_PROFILES.profile_pic_url,
        website_url: PAGE_PROFILES.website_url,
        latitude: PAGE_PROFILES.latitude,
        longitude: PAGE_PROFILES.longitude,
      })
      .from(PAGES)
      .innerJoin(PAGE_PROFILES, eq(PAGES.id, PAGE_PROFILES.page_id))
      .where(inArray(PAGES.id, validPageIds));

    console.log('Found service centers:', serviceCenters.length);

    // Calculate distances if user location is provided
    let serviceCentersWithDistance = serviceCenters;
    
    if (userLat && userLng) {
      serviceCentersWithDistance = serviceCenters
        .map(center => {
          if (center.latitude && center.longitude) {
            const distance = calculateDistance(
              parseFloat(userLat),
              parseFloat(userLng),
              parseFloat(center.latitude),
              parseFloat(center.longitude)
            );
            return {
              ...center,
              distance: distance <= 10 ? distance : null // Only include if within 10km
            };
          }
          return {
            ...center,
            distance: null
          };
        })
        .filter(center => center.distance !== null) // Remove centers outside 10km radius
        .sort((a, b) => a.distance - b.distance); // Sort by distance
    } else {
      // Without location, just limit to 5 results
      serviceCentersWithDistance = serviceCenters.slice(0, 5);
    }

    console.log('Final service centers:', serviceCentersWithDistance.length);

    return NextResponse.json({ 
      success: true, 
      serviceCenters: serviceCentersWithDistance.map(sc => ({
        ...sc,
        distance: sc.distance ? parseFloat(sc.distance).toFixed(1) : null
      }))
    });
  } catch (error) {
    console.error("Error fetching service centers:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Failed to fetch service centers",
      error: error.message 
    }, { status: 500 });
  }
}