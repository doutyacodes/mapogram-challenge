// // app/api/onboarding/follow/route.js
// import { NextResponse } from 'next/server';
// import jwt from 'jsonwebtoken';
// import { jwtVerify } from 'jose';
// import { db } from '@/utils';
// import { USERS, LAYERS, USER_FOLLOWED_LAYERS, USER_BOTTOM_BAR } from '@/utils/schema/schema';
// import { eq, sql, desc } from 'drizzle-orm';

// // GET - Fetch top 6 non-permanent layers
// export async function GET(request) {
//   try {
//     const token = request.cookies.get('user_token')?.value;
//     if (!token) {
//       return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
//     }

//     const secret = new TextEncoder().encode(process.env.JWT_SECRET);
//     const decoded = await jwtVerify(token, secret);
//     const payload = decoded.payload;

//     // Fetch top 6 most followed non-permanent layers
//     const layers = await db
//       .select({
//         id: LAYERS.id,
//         name: LAYERS.name,
//         is_permanent: LAYERS.is_permanent,
//         followersCount: sql`(SELECT COUNT(*) FROM ${USER_FOLLOWED_LAYERS} WHERE ${USER_FOLLOWED_LAYERS.layer_id} = ${LAYERS.id})`.as('followers_count')
//       })
//       .from(LAYERS)
//       .where(eq(LAYERS.is_permanent, false))  // Only fetch non-permanent layers
//       .orderBy(desc(sql`followers_count`))
//       .limit(6);

//     // Get user's current follows for non-permanent layers only
//     const userFollowedLayers = await db
//       .select({ 
//         layer_id: USER_FOLLOWED_LAYERS.layer_id,
//         is_permanent: LAYERS.is_permanent
//       })
//       .from(USER_FOLLOWED_LAYERS)
//       .leftJoin(LAYERS, eq(USER_FOLLOWED_LAYERS.layer_id, LAYERS.id))
//       .where(eq(USER_FOLLOWED_LAYERS.user_id, payload.id));

//     const followedNonPermanentLayerIds = userFollowedLayers
//       .filter(fl => !fl.is_permanent)
//       .map(fl => fl.layer_id);

//     return NextResponse.json({
//       layers: layers.map(layer => ({
//         ...layer,
//         isFollowed: followedNonPermanentLayerIds.includes(layer.id)
//       })),
//       hasFollowedLayer: userFollowedLayers.length > 0
//     });

//   } catch (error) {
//     console.error('Error fetching follow data:', error);
//     return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
//   }
// }

// // POST - Handle layer follow actions
// export async function POST(request) {
//   try {
//     const { layerIds = [] } = await request.json();
    
//     // Get token from cookies
//     const token = request.cookies.get('user_token')?.value;
    
//     if (!token) {
//       return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
//     }

//     // Verify token
//     const secret = new TextEncoder().encode(process.env.JWT_SECRET);
//     const decoded = await jwtVerify(token, secret);
//     const payload = decoded.payload;

//     const userId = payload.id;

//     // Validate that at least 2 layers are selected
//     if (layerIds.length < 2) {
//       return NextResponse.json({ 
//         message: 'You must follow at least 2 layers' 
//       }, { status: 400 });
//     }

//     // Validate that maximum 2 layers are selected
//     if (layerIds.length > 2) {
//       return NextResponse.json({ 
//         message: 'You can follow maximum 2 layers during onboarding' 
//       }, { status: 400 });
//     }

//     // Verify that the selected layers are not permanent
//     const selectedLayers = await db
//       .select({
//         id: LAYERS.id,
//         is_permanent: LAYERS.is_permanent
//       })
//       .from(LAYERS)
//       .where(sql`${LAYERS.id} IN (${layerIds.map(() => '?').join(',')})`, layerIds);

//     const permanentLayersSelected = selectedLayers.filter(layer => layer.is_permanent);
//     if (permanentLayersSelected.length > 0) {
//       return NextResponse.json({ 
//         message: 'Cannot follow permanent layers through onboarding' 
//       }, { status: 400 });
//     }

//     await db.transaction(async (tx) => {
//       // Remove only non-permanent layer follows, keep permanent ones intact
//       await tx
//         .delete(USER_FOLLOWED_LAYERS)
//         .where(
//           sql`${USER_FOLLOWED_LAYERS.user_id} = ${userId} AND ${USER_FOLLOWED_LAYERS.layer_id} IN (
//             SELECT id FROM ${LAYERS} WHERE is_permanent = false
//           )`
//         );

//       // Add new non-permanent layer follows
//       const newLayerFollows = layerIds.map(layerId => ({
//         user_id: userId,
//         layer_id: layerId
//       }));
//       await tx.insert(USER_FOLLOWED_LAYERS).values(newLayerFollows);

//       // Clear previous bottom bar entries
//       await tx.delete(USER_BOTTOM_BAR).where(eq(USER_BOTTOM_BAR.user_id, userId));

//       // Add only the newly selected non-permanent layers to bottom bar
//       // Don't add permanent layers to bottom bar
//       const bottomBarInserts = layerIds.map((layerId, index) => ({
//         user_id: userId,
//         item_id: layerId,
//         item_type: 'layer',
//         position: index + 1 // position starts at 1
//       }));

//       if (bottomBarInserts.length > 0) {
//         await tx.insert(USER_BOTTOM_BAR).values(bottomBarInserts);
//       }
//     });

//     // Generate new token with updated follow status
//     // Remove JWT specific properties to avoid conflicts
//     const { exp, iat, ...cleanPayload } = payload;
    
//     const newTokenPayload = {
//       ...cleanPayload,
//       hasFollowedLayer: true // User has followed layers now
//     };

//     const newToken = jwt.sign(
//       newTokenPayload,
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     // Create response
//     const response = NextResponse.json({
//       message: 'Layer preferences updated successfully',
//       hasFollowedLayer: true
//     });

//     // Update cookie with new token
//     response.cookies.set("user_token", newToken, {
//       path: "/",
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "lax",
//       maxAge: 60 * 60 * 24 * 7, // 7 days
//     });

//     return response;

//   } catch (error) {
//     console.error('Error updating follows:', error);
//     return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
//   }
// }

// import { NextResponse } from 'next/server';
// import jwt from 'jsonwebtoken';
// import { jwtVerify } from 'jose';
// import { db } from '@/utils';
// import { USERS, LAYERS, USER_FOLLOWED_LAYERS, USER_BOTTOM_BAR } from '@/utils/schema/schema';
// import { eq, sql, desc } from 'drizzle-orm';
// import { getGuestFollows, setGuestFollows } from '@/utils/guests/guestUser';
// // import { getGuestFollows, setGuestFollows } from '@/utils/guestUser';

// // GET - Fetch top 6 non-permanent layers
// export async function GET(request) {
//   try {
//     const token = request.cookies.get('user_token')?.value;
//     if (!token) {
//       return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
//     }

//     const secret = new TextEncoder().encode(process.env.JWT_SECRET);
//     const decoded = await jwtVerify(token, secret);
//     const payload = decoded.payload;

//     // Fetch top 6 most followed non-permanent layers
//     const layers = await db
//       .select({
//         id: LAYERS.id,
//         name: LAYERS.name,
//         is_permanent: LAYERS.is_permanent,
//         followersCount: sql`(SELECT COUNT(*) FROM ${USER_FOLLOWED_LAYERS} WHERE ${USER_FOLLOWED_LAYERS.layer_id} = ${LAYERS.id})`.as('followers_count')
//       })
//       .from(LAYERS)
//       .where(eq(LAYERS.is_permanent, false))
//       .orderBy(desc(sql`followers_count`))
//       .limit(6);

//     let followedNonPermanentLayerIds = [];

//     if (payload.isGuest) {
//       // For guests, get follows from memory
//       const guestData = getGuestFollows(payload.sessionId);
//       followedNonPermanentLayerIds = guestData.layers || [];
//     } else {
//       // For registered users, get from database
//       const userFollowedLayers = await db
//         .select({ 
//           layer_id: USER_FOLLOWED_LAYERS.layer_id,
//           is_permanent: LAYERS.is_permanent
//         })
//         .from(USER_FOLLOWED_LAYERS)
//         .leftJoin(LAYERS, eq(USER_FOLLOWED_LAYERS.layer_id, LAYERS.id))
//         .where(eq(USER_FOLLOWED_LAYERS.user_id, payload.id));

//       followedNonPermanentLayerIds = userFollowedLayers
//         .filter(fl => !fl.is_permanent)
//         .map(fl => fl.layer_id);
//     }

//     return NextResponse.json({
//       layers: layers.map(layer => ({
//         ...layer,
//         isFollowed: followedNonPermanentLayerIds.includes(layer.id)
//       })),
//       hasFollowedLayer: followedNonPermanentLayerIds.length > 0,
//       isGuest: payload.isGuest || false
//     });

//   } catch (error) {
//     console.error('Error fetching follow data:', error);
//     return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
//   }
// }

// // POST - Handle layer follow actions
// export async function POST(request) {
//   try {
//     const { layerIds = [] } = await request.json();
    
//     const token = request.cookies.get('user_token')?.value;
    
//     if (!token) {
//       return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
//     }

//     const secret = new TextEncoder().encode(process.env.JWT_SECRET);
//     const decoded = await jwtVerify(token, secret);
//     const payload = decoded.payload;

//     // Validate layer selections
//     if (layerIds.length < 2) {
//       return NextResponse.json({ 
//         message: 'You must follow at least 2 layers' 
//       }, { status: 400 });
//     }

//     if (layerIds.length > 2) {
//       return NextResponse.json({ 
//         message: 'You can follow maximum 2 layers during onboarding' 
//       }, { status: 400 });
//     }

//     // Verify that the selected layers are not permanent
//     const selectedLayers = await db
//       .select({
//         id: LAYERS.id,
//         is_permanent: LAYERS.is_permanent
//       })
//       .from(LAYERS)
//       .where(sql`${LAYERS.id} IN (${layerIds.map(() => '?').join(',')})`, layerIds);

//     const permanentLayersSelected = selectedLayers.filter(layer => layer.is_permanent);
//     if (permanentLayersSelected.length > 0) {
//       return NextResponse.json({ 
//         message: 'Cannot follow permanent layers through onboarding' 
//       }, { status: 400 });
//     }

//     if (payload.isGuest) {
//       // Handle guest user follows
//       const guestData = {
//         layers: layerIds,
//         bottomBar: layerIds.map((layerId, index) => ({
//           item_id: layerId,
//           item_type: 'layer',
//           position: index + 1
//         }))
//       };
      
//       setGuestFollows(payload.sessionId, guestData);

//       // Generate new token with updated follow status
//       const newTokenPayload = {
//         ...payload,
//         hasFollowedLayer: true
//       };

//       const newToken = jwt.sign(
//         newTokenPayload,
//         process.env.JWT_SECRET,
//         // { expiresIn: "24h" }
//       );

//       const response = NextResponse.json({
//         message: 'Layer preferences updated successfully',
//         hasFollowedLayer: true,
//         isGuest: true
//       });

//       response.cookies.set("user_token", newToken, {
//         path: "/",
//         httpOnly: true,
//         secure: process.env.NODE_ENV === "production",
//         sameSite: "lax",
//         maxAge: 60 * 60 * 24, // 24 hours
//       });

//       return response;
//     } else {
//       // Handle registered users - existing database logic
//       await db.transaction(async (tx) => {
//         await tx
//           .delete(USER_FOLLOWED_LAYERS)
//           .where(
//             sql`${USER_FOLLOWED_LAYERS.user_id} = ${payload.id} AND ${USER_FOLLOWED_LAYERS.layer_id} IN (
//               SELECT id FROM ${LAYERS} WHERE is_permanent = false
//             )`
//           );

//         const newLayerFollows = layerIds.map(layerId => ({
//           user_id: payload.id,
//           layer_id: layerId
//         }));
//         await tx.insert(USER_FOLLOWED_LAYERS).values(newLayerFollows);

//         await tx.delete(USER_BOTTOM_BAR).where(eq(USER_BOTTOM_BAR.user_id, payload.id));

//         const bottomBarInserts = layerIds.map((layerId, index) => ({
//           user_id: payload.id,
//           item_id: layerId,
//           item_type: 'layer',
//           position: index + 1
//         }));

//         if (bottomBarInserts.length > 0) {
//           await tx.insert(USER_BOTTOM_BAR).values(bottomBarInserts);
//         }
//       });

//       // Generate new token with updated follow status
//       const { exp, iat, ...cleanPayload } = payload;
      
//       const newTokenPayload = {
//         ...cleanPayload,
//         hasFollowedLayer: true
//       };

//       const newToken = jwt.sign(
//         newTokenPayload,
//         process.env.JWT_SECRET,
//         { expiresIn: "7d" }
//       );

//       const response = NextResponse.json({
//         message: 'Layer preferences updated successfully',
//         hasFollowedLayer: true,
//         isGuest: false
//       });

//       response.cookies.set("user_token", newToken, {
//         path: "/",
//         httpOnly: true,
//         secure: process.env.NODE_ENV === "production",
//         sameSite: "lax",
//         maxAge: 60 * 60 * 24 * 7, // 7 days
//       });

//       return response;
//     }

//   } catch (error) {
//     console.error('Error updating follows:', error);
//     return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
//   }
// }
// =====================================================


// app/api/onboarding/follow/route.js

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { jwtVerify } from 'jose';
import { db } from '@/utils';
import { USERS, LAYERS, USER_FOLLOWED_LAYERS, USER_BOTTOM_BAR } from '@/utils/schema/schema';
import { eq, sql, desc } from 'drizzle-orm';

// GET - Fetch top 6 non-permanent layers
export async function GET(request) {
  try {
    const token = request.cookies.get('user_token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const decoded = await jwtVerify(token, secret);
    const payload = decoded.payload;

    // Fetch top 6 most followed non-permanent layers
    const layers = await db
      .select({
        id: LAYERS.id,
        name: LAYERS.name,
        is_permanent: LAYERS.is_permanent,
        followersCount: sql`(SELECT COUNT(*) FROM ${USER_FOLLOWED_LAYERS} WHERE ${USER_FOLLOWED_LAYERS.layer_id} = ${LAYERS.id})`.as('followers_count')
      })
      .from(LAYERS)
      .where(eq(LAYERS.is_permanent, false))
      .orderBy(desc(sql`followers_count`))
      .limit(6);

    if (payload.isGuest) {
      // For guests, return layers without follow status
      // Client will handle follow status using sessionStorage
      return NextResponse.json({
        layers: layers.map(layer => ({
          ...layer,
          isFollowed: false // Client will update this from sessionStorage
        })),
        hasFollowedLayer: payload.hasFollowedLayer || false,
        isGuest: true
      });
    } else {
      // For registered users, get follow status from database
      const userFollowedLayers = await db
        .select({ 
          layer_id: USER_FOLLOWED_LAYERS.layer_id,
          is_permanent: LAYERS.is_permanent
        })
        .from(USER_FOLLOWED_LAYERS)
        .leftJoin(LAYERS, eq(USER_FOLLOWED_LAYERS.layer_id, LAYERS.id))
        .where(eq(USER_FOLLOWED_LAYERS.user_id, payload.id));

      const followedNonPermanentLayerIds = userFollowedLayers
        .filter(fl => !fl.is_permanent)
        .map(fl => fl.layer_id);

      return NextResponse.json({
        layers: layers.map(layer => ({
          ...layer,
          isFollowed: followedNonPermanentLayerIds.includes(layer.id)
        })),
        hasFollowedLayer: followedNonPermanentLayerIds.length > 0,
        isGuest: false
      });
    }

  } catch (error) {
    console.error('Error fetching follow data:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST - Handle layer follow actions (REGISTERED USERS ONLY)
export async function POST(request) {
  try {
    const { layerIds = [] } = await request.json();
    
    const token = request.cookies.get('user_token')?.value;
    
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const decoded = await jwtVerify(token, secret);
    const payload = decoded.payload;

    // This endpoint is only for registered users
    if (payload.isGuest) {
      return NextResponse.json({ 
        message: 'Guest users should handle follows client-side' 
      }, { status: 400 });
    }

    // Validate layer selections
    if (layerIds.length < 2) {
      return NextResponse.json({ 
        message: 'You must follow at least 2 layers' 
      }, { status: 400 });
    }

    if (layerIds.length > 2) {
      return NextResponse.json({ 
        message: 'You can follow maximum 2 layers during onboarding' 
      }, { status: 400 });
    }

    // Verify that the selected layers are not permanent
    const selectedLayers = await db
      .select({
        id: LAYERS.id,
        is_permanent: LAYERS.is_permanent
      })
      .from(LAYERS)
      .where(sql`${LAYERS.id} IN (${layerIds.map(() => '?').join(',')})`, layerIds);

    const permanentLayersSelected = selectedLayers.filter(layer => layer.is_permanent);
    if (permanentLayersSelected.length > 0) {
      return NextResponse.json({ 
        message: 'Cannot follow permanent layers through onboarding' 
      }, { status: 400 });
    }

    // Handle registered users - database transaction
    await db.transaction(async (tx) => {
      // Remove existing non-permanent follows
      await tx
        .delete(USER_FOLLOWED_LAYERS)
        .where(
          sql`${USER_FOLLOWED_LAYERS.user_id} = ${payload.id} AND ${USER_FOLLOWED_LAYERS.layer_id} IN (
            SELECT id FROM ${LAYERS} WHERE is_permanent = false
          )`
        );

      // Add new follows
      const newLayerFollows = layerIds.map(layerId => ({
        user_id: payload.id,
        layer_id: layerId
      }));
      await tx.insert(USER_FOLLOWED_LAYERS).values(newLayerFollows);

      // Update bottom bar
      await tx.delete(USER_BOTTOM_BAR).where(eq(USER_BOTTOM_BAR.user_id, payload.id));

      const bottomBarInserts = layerIds.map((layerId, index) => ({
        user_id: payload.id,
        item_id: layerId,
        item_type: 'layer',
        position: index + 1
      }));

      if (bottomBarInserts.length > 0) {
        await tx.insert(USER_BOTTOM_BAR).values(bottomBarInserts);
      }
    });

    // Generate new token with updated follow status
    const { exp, iat, ...cleanPayload } = payload;
    
    const newTokenPayload = {
      ...cleanPayload,
      hasFollowedLayer: true
    };

    const newToken = jwt.sign(
      newTokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const response = NextResponse.json({
      message: 'Layer preferences updated successfully',
      hasFollowedLayer: true,
      isGuest: false
    });

    response.cookies.set("user_token", newToken, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;

  } catch (error) {
    console.error('Error updating follows:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}