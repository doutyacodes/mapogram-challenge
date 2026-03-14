import { db } from "@/utils";
import { HYPERLOCAL_NEWS, HYPERLOCAL_CATEGORIES, CLASSIFIED_ADS, OBITUARIES } from "@/utils/schema/schema";
import { NextResponse } from "next/server";
import { and, eq, gte, lte, sql, or } from "drizzle-orm";


// export async function GET(req) {
//   try {
//     const url = new URL(req.url);
    
//     // Extract user location and radius parameters
//     const userLat = url.searchParams.get('userLat');
//     const userLng = url.searchParams.get('userLng');
//     const radius = url.searchParams.get('radius') || 10; // Default 10km

//     console.log("userLat", userLat, "userLng", userLng)
    
//     // Extract bounding box parameters from query string (if present)
//     const north = url.searchParams.get('north');
//     const south = url.searchParams.get('south');
//     const east = url.searchParams.get('east');
//     const west = url.searchParams.get('west');
    
//     // If no user location is provided, return an empty array
//     // This enforces the requirement that users must provide their location
//     if (!userLat || !userLng) {
//       return NextResponse.json([]);
//     }
    
//     // Build base query
//     let query = db
//       .select({
//         id: HYPERLOCAL_NEWS.id,
//         title: HYPERLOCAL_NEWS.title,
//         image_url: HYPERLOCAL_NEWS.image_url,
//         // article_url: HYPERLOCAL_NEWS.article_url,
//         content: HYPERLOCAL_NEWS.content,
//         latitude: HYPERLOCAL_NEWS.latitude,
//         longitude: HYPERLOCAL_NEWS.longitude,
//         category: HYPERLOCAL_CATEGORIES.name,
//         created_at: HYPERLOCAL_NEWS.created_at,
//       })
//       .from(HYPERLOCAL_NEWS)
//       .leftJoin(HYPERLOCAL_CATEGORIES, eq(HYPERLOCAL_NEWS.category_id, HYPERLOCAL_CATEGORIES.id));
    
//     // First, filter by user's location radius
//     // Using the Haversine formula to calculate distance between points
//     // Note: This is a simplified version for SQL
//     const haversineFormula = sql`
//       (
//         6371 * acos(
//           cos(radians(${parseFloat(userLat)})) * 
//           cos(radians(${HYPERLOCAL_NEWS.latitude})) * 
//           cos(radians(${HYPERLOCAL_NEWS.longitude}) - radians(${parseFloat(userLng)})) + 
//           sin(radians(${parseFloat(userLat)})) * 
//           sin(radians(${HYPERLOCAL_NEWS.latitude}))
//         )
//       )
//     `;
    
//     // Apply radius filter - only show news within the specified radius
//     query = query.where(lte(haversineFormula, parseFloat(radius)));
    
//     // Apply additional geographic filtering if bounds are provided
//     if (north && south && east && west) {
//       query = query.where(
//         and(
//           gte(HYPERLOCAL_NEWS.latitude, parseFloat(south)),
//           lte(HYPERLOCAL_NEWS.latitude, parseFloat(north)),
//           // Handle cases where the map crosses the 180th meridian
//           east < west 
//             ? or(
//                 gte(HYPERLOCAL_NEWS.longitude, parseFloat(west)),
//                 lte(HYPERLOCAL_NEWS.longitude, parseFloat(east))
//               )
//             : and(
//                 gte(HYPERLOCAL_NEWS.longitude, parseFloat(west)),
//                 lte(HYPERLOCAL_NEWS.longitude, parseFloat(east))
//               )
//         )
//       );
//     }
    
//     // Execute the query
//     const news = await query.orderBy(sql`${HYPERLOCAL_NEWS.created_at} DESC`);

//     // Return the news data
//     return NextResponse.json(news);
//   } catch (error) {
//     console.error("News Map API Error:", error);
//     return NextResponse.json(
//       { message: "Error fetching news data" },
//       { status: 500 }
//     );
//   }
// }

export async function GET(req) {
  try {
    const url = new URL(req.url);
    
    const userLat = url.searchParams.get('userLat');
    const userLng = url.searchParams.get('userLng');
    const radius = url.searchParams.get('radius') || 10;
    
    const north = url.searchParams.get('north');
    const south = url.searchParams.get('south');
    const east = url.searchParams.get('east');
    const west = url.searchParams.get('west');
    
    if (!userLat || !userLng) {
      return NextResponse.json([]);
    }
    
    // Build geographic filter condition for each table
      let newsGeoFilter = lte(sql`
        (
          6371 * acos(
            cos(radians(${parseFloat(userLat)})) * 
            cos(radians(${HYPERLOCAL_NEWS.latitude})) * 
            cos(radians(${HYPERLOCAL_NEWS.longitude}) - radians(${parseFloat(userLng)})) + 
            sin(radians(${parseFloat(userLat)})) * 
            sin(radians(${HYPERLOCAL_NEWS.latitude}))
          )
        )
      `, parseFloat(radius));

      let classifiedsGeoFilter = lte(sql`
        (
          6371 * acos(
            cos(radians(${parseFloat(userLat)})) * 
            cos(radians(${CLASSIFIED_ADS.latitude})) * 
            cos(radians(${CLASSIFIED_ADS.longitude}) - radians(${parseFloat(userLng)})) + 
            sin(radians(${parseFloat(userLat)})) * 
            sin(radians(${CLASSIFIED_ADS.latitude}))
          )
        )
      `, parseFloat(radius));

      let obituariesGeoFilter = lte(sql`
        (
          6371 * acos(
            cos(radians(${parseFloat(userLat)})) * 
            cos(radians(${OBITUARIES.latitude})) * 
            cos(radians(${OBITUARIES.longitude}) - radians(${parseFloat(userLng)})) + 
            sin(radians(${parseFloat(userLat)})) * 
            sin(radians(${OBITUARIES.latitude}))
          )
        )
      `, parseFloat(radius));

      if (north && south && east && west) {
        const newsBoundsFilter = and(
          gte(HYPERLOCAL_NEWS.latitude, parseFloat(south)),
          lte(HYPERLOCAL_NEWS.latitude, parseFloat(north)),
          east < west 
            ? or(
                gte(HYPERLOCAL_NEWS.longitude, parseFloat(west)),
                lte(HYPERLOCAL_NEWS.longitude, parseFloat(east))
              )
            : and(
                gte(HYPERLOCAL_NEWS.longitude, parseFloat(west)),
                lte(HYPERLOCAL_NEWS.longitude, parseFloat(east))
              )
        );
        
        const classifiedsBoundsFilter = and(
          gte(CLASSIFIED_ADS.latitude, parseFloat(south)),
          lte(CLASSIFIED_ADS.latitude, parseFloat(north)),
          east < west 
            ? or(
                gte(CLASSIFIED_ADS.longitude, parseFloat(west)),
                lte(CLASSIFIED_ADS.longitude, parseFloat(east))
              )
            : and(
                gte(CLASSIFIED_ADS.longitude, parseFloat(west)),
                lte(CLASSIFIED_ADS.longitude, parseFloat(east))
              )
        );
        
        const obituariesBoundsFilter = and(
          gte(OBITUARIES.latitude, parseFloat(south)),
          lte(OBITUARIES.latitude, parseFloat(north)),
          east < west 
            ? or(
                gte(OBITUARIES.longitude, parseFloat(west)),
                lte(OBITUARIES.longitude, parseFloat(east))
              )
            : and(
                gte(OBITUARIES.longitude, parseFloat(west)),
                lte(OBITUARIES.longitude, parseFloat(east))
              )
        );
        
        newsGeoFilter = and(newsGeoFilter, newsBoundsFilter);
        classifiedsGeoFilter = and(classifiedsGeoFilter, classifiedsBoundsFilter);
        obituariesGeoFilter = and(obituariesGeoFilter, obituariesBoundsFilter);
      }

      // Fetch News
      const newsQuery = db
        .select({
          id: HYPERLOCAL_NEWS.id,
          title: HYPERLOCAL_NEWS.title,
          image_url: HYPERLOCAL_NEWS.image_url,
          content: HYPERLOCAL_NEWS.content,
          latitude: HYPERLOCAL_NEWS.latitude,
          longitude: HYPERLOCAL_NEWS.longitude,
          category: HYPERLOCAL_CATEGORIES.name,
          created_at: HYPERLOCAL_NEWS.created_at,
          type: sql`'news'`.as('type')
        })
        .from(HYPERLOCAL_NEWS)
        .leftJoin(HYPERLOCAL_CATEGORIES, eq(HYPERLOCAL_NEWS.category_id, HYPERLOCAL_CATEGORIES.id))
        .where(newsGeoFilter);

      // Fetch Classifieds
      const classifiedsQuery = db
        .select({
          id: CLASSIFIED_ADS.id,
          title: CLASSIFIED_ADS.title,
          image_url: CLASSIFIED_ADS.images,
          content: CLASSIFIED_ADS.description,
          latitude: CLASSIFIED_ADS.latitude,
          longitude: CLASSIFIED_ADS.longitude,
          category: HYPERLOCAL_CATEGORIES.name,
          created_at: CLASSIFIED_ADS.created_at,
          type: sql`'classified'`.as('type'),
          ad_type: CLASSIFIED_ADS.ad_type,
          price: CLASSIFIED_ADS.price,
          item_type: CLASSIFIED_ADS.type,
          contact_info: CLASSIFIED_ADS.contact_info
        })
        .from(CLASSIFIED_ADS)
        .leftJoin(HYPERLOCAL_CATEGORIES, eq(CLASSIFIED_ADS.category_id, HYPERLOCAL_CATEGORIES.id))
        .where(classifiedsGeoFilter);

      // Fetch Obituaries
      const obituariesQuery = db
        .select({
          id: OBITUARIES.id,
          title: OBITUARIES.person_name,
          image_url: OBITUARIES.image_url,
          content: sql`''`.as('content'),
          latitude: OBITUARIES.latitude,
          longitude: OBITUARIES.longitude,
          category: HYPERLOCAL_CATEGORIES.name,
          created_at: OBITUARIES.created_at,
          type: sql`'obituary'`.as('type'),
          person_name: OBITUARIES.person_name,
          age: OBITUARIES.age,
          date_of_death: OBITUARIES.date_of_death
        })
        .from(OBITUARIES)
        .leftJoin(HYPERLOCAL_CATEGORIES, eq(OBITUARIES.category_id, HYPERLOCAL_CATEGORIES.id))
        .where(obituariesGeoFilter);
    
    // Execute all queries
    const [news, classifieds, obituaries] = await Promise.all([
      newsQuery,
      classifiedsQuery,
      obituariesQuery
    ]);
    
    // Combine all results and sort by created_at
    const allItems = [...news, ...classifieds, ...obituaries]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

          console.log("allitems", allItems)

    
    return NextResponse.json(allItems);
  } catch (error) {
    console.error("News Map API Error:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}