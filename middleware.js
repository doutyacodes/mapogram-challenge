
// import { NextResponse } from 'next/server';
// import { jwtVerify } from 'jose';
// import { createGuestSession } from './utils/guests/guestUser';
// import { getToken } from "next-auth/jwt"

// export async function middleware(request) {
//   const { pathname } = request.nextUrl;
  
//   console.log("🔍 MIDDLEWARE FOR:", pathname);

//   // Skip middleware completely for these routes
//   if (
//     pathname.startsWith('/api') ||
//     pathname.startsWith('/_next') ||
//     pathname.startsWith('/static') ||
//     pathname.startsWith('/.well-known') || // Add this
//     pathname.includes('.') || // Skip all files with extensions (like .webmanifest, .ico, etc.)
//     pathname === '/' ||
//     pathname === '/login' ||
//     pathname === '/signup' ||
//     pathname === '/welcome' ||
//     pathname.startsWith('/auth') ||
//     pathname === '/onboarding/follow' ||
//     pathname === '/communities/select' ||
//     pathname.startsWith('/communities/invite')
//   ) {
//     console.log("✅ SKIPPING middleware for:", pathname);
//     return NextResponse.next();
//   }

//   console.log("🚨 PROCESSING middleware for:", pathname);

//   // Get token from cookies
//   const token = request.cookies.get('user_token')?.value;
  
//   // Check for NextAuth session
//   const nextAuthToken = await getToken({ 
//     req: request, 
//     secret: process.env.NEXTAUTH_SECRET 
//   });

//   console.log("🔑 Token status:", { 
//     hasCustomToken: !!token, 
//     hasNextAuthToken: !!nextAuthToken,
//     pathname 
//   });

//   let payload = null;
//   let isValidToken = false;

//   // Try to verify custom token
//   if (token) {
//     const secret = new TextEncoder().encode(process.env.JWT_SECRET);
//     try {
//       const decoded = await jwtVerify(token, secret);
//       payload = decoded.payload;
//       isValidToken = true;
//       console.log("✅ Valid custom token found");
//     } catch (error) {
//       console.log("❌ Token verification error:", error.message);
//     }
//   }

//   // If no custom token but NextAuth session exists
//   if (!isValidToken && nextAuthToken) {
//     console.log("🔄 NextAuth session found, redirecting to complete signin");
//     const response = NextResponse.redirect(new URL('/api/auth/google-signin', request.url));
//     return response;
//   }

//   // Create guest session only for actual pages that need authentication
//   if (!isValidToken && !nextAuthToken) {
//     console.log("🚨 CREATING GUEST SESSION FOR:", pathname);
    
//     const { token: guestToken } = await createGuestSession();
    
//     const response = NextResponse.redirect(new URL('/onboarding/follow', request.url));
//     response.cookies.set("user_token", guestToken, {
//       path: "/",
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "lax",
//       maxAge: 60 * 60 * 24,
//     });
    
//     return response;
//   }

//   // Continue with authenticated user logic
//   if (isValidToken) {
//     console.log("✅ Valid token found, payload:", payload);

//     if (payload.isAdmin) {
//       return NextResponse.next();
//     }

//     const isCommunityRoute = pathname.startsWith('/communities');
//     const isLayerRoute = pathname.startsWith('/layers');
//     const isPageRoute = pathname.startsWith('/page');

//     if (payload.isGuest) {
//       if (!payload.hasFollowedLayer) {
//         return NextResponse.redirect(new URL('/onboarding/follow', request.url));
//       }

//       if (isLayerRoute || isPageRoute) {
//         return NextResponse.next();
//       }

//       return NextResponse.redirect(new URL('/layers', request.url));
//     }

//     // For registered users
//     if (isCommunityRoute && pathname !== '/communities/select' && !pathname.startsWith('/communities/invite')) {
//       if (!payload.hasFollowedCommunities) {
//         return NextResponse.redirect(new URL('/communities/select', request.url));
//       }
//     }

//     if (payload.hasFollowedCommunities && pathname === '/communities/select') {
//       return NextResponse.redirect(new URL('/', request.url));
//     }

//     if (isLayerRoute || isPageRoute) {
//       const hasFollowedLayer = payload.hasFollowedLayer || false;
//       if (!hasFollowedLayer) {
//         return NextResponse.redirect(new URL('/onboarding/follow', request.url));
//       }
//     }
//   }

//   return NextResponse.next();
// }

// // Much more restrictive matcher - only for actual app routes
// export const config = {
//   matcher: [
//     // Only match specific app routes, exclude all static files and well-known paths
//     '/layers/:path*',
//     '/communities/((?!select|invite).)*', // Communities except select and invite
//     '/posts/:path*',
//     '/page/:path*',
//     '/home/:path*',
//     '/profile/:path*'
//   ],
// };

import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { createGuestSession } from './utils/guests/guestUser';
import { getToken } from "next-auth/jwt"

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  console.log("🔍 MIDDLEWARE FOR:", pathname);

  // Skip middleware completely for these routes
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/.well-known') ||
    pathname.includes('.') ||
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/welcome' ||
    pathname.startsWith('/auth') ||
    // pathname === '/onboarding/follow' || // COMMENTED: Layer onboarding
    pathname === '/communities/select' ||
    pathname.startsWith('/communities/invite')
  ) {
    console.log("✅ SKIPPING middleware for:", pathname);
    return NextResponse.next();
  }

  console.log("🚨 PROCESSING middleware for:", pathname);

  // Get token from cookies
  const token = request.cookies.get('user_token')?.value;
  
  // Check for NextAuth session
  const nextAuthToken = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  });

  console.log("🔑 Token status:", { 
    hasCustomToken: !!token, 
    hasNextAuthToken: !!nextAuthToken,
    pathname 
  });

  let payload = null;
  let isValidToken = false;

  // Try to verify custom token
  if (token) {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    try {
      const decoded = await jwtVerify(token, secret);
      payload = decoded.payload;
      isValidToken = true;
      console.log("✅ Valid custom token found");
    } catch (error) {
      console.log("❌ Token verification error:", error.message);
    }
  }

  // If no custom token but NextAuth session exists
  if (!isValidToken && nextAuthToken) {
    console.log("🔄 NextAuth session found, redirecting to complete signin");
    const response = NextResponse.redirect(new URL('/api/auth/google-signin', request.url));
    return response;
  }

  // Create guest session only for actual pages that need authentication
  if (!isValidToken && !nextAuthToken) {
    console.log("🚨 CREATING GUEST SESSION FOR:", pathname);
    
    const { token: guestToken } = await createGuestSession();
    
    // COMMENTED: Guest redirect to layer onboarding
    // const response = NextResponse.redirect(new URL('/onboarding/follow', request.url));
    const response = NextResponse.redirect(new URL('/communities/select', request.url));
    response.cookies.set("user_token", guestToken, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
    });
    
    return response;
  }

  // Continue with authenticated user logic
  if (isValidToken) {
    console.log("✅ Valid token found, payload:", payload);

    if (payload.isAdmin) {
      return NextResponse.next();
    }

    const isCommunityRoute = pathname.startsWith('/communities');
    // const isLayerRoute = pathname.startsWith('/layers'); // COMMENTED: Layer routes
    // const isPageRoute = pathname.startsWith('/page'); // COMMENTED: Page routes

    // COMMENTED: Guest user layer logic
    // if (payload.isGuest) {
    //   if (!payload.hasFollowedLayer) {
    //     return NextResponse.redirect(new URL('/onboarding/follow', request.url));
    //   }
    //
    //   if (isLayerRoute || isPageRoute) {
    //     return NextResponse.next();
    //   }
    //
    //   return NextResponse.redirect(new URL('/layers', request.url));
    // }

    // For registered users - ONLY COMMUNITIES
    if (isCommunityRoute && pathname !== '/communities/select' && !pathname.startsWith('/communities/invite')) {
      if (!payload.hasFollowedCommunities) {
        return NextResponse.redirect(new URL('/communities/select', request.url));
      }
    }

    if (payload.hasFollowedCommunities && pathname === '/communities/select') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // COMMENTED: Layer and page route checks
    // if (isLayerRoute || isPageRoute) {
    //   const hasFollowedLayer = payload.hasFollowedLayer || false;
    //   if (!hasFollowedLayer) {
    //     return NextResponse.redirect(new URL('/onboarding/follow', request.url));
    //   }
    // }
  }

  return NextResponse.next();
}

// UPDATED: Only match community routes
export const config = {
  matcher: [
    // COMMENTED: Layer routes
    // '/layers/:path*',
    '/communities/((?!select|invite).)*', // Communities except select and invite
    // COMMENTED: Other routes
    // '/posts/:path*',
    // '/page/:path*',
    // '/home/:path*',
    // '/profile/:path*'
  ],
};