"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import useAuth from "../hooks/useAuth";
import LoadingSpinner from "./LoadingSpinner";

const ProtectedRoute = ({ children, allowedRoutes = [] }) => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Check for exact matches in allowed routes
  const isExactMatchAllowed = allowedRoutes.includes(pathname);
  
  // Check for dynamic routes that should be public
  const isDynamicPublicRoute = (
    pathname.startsWith("/nearby-news/article/") || // Allow /nearby-news/article/<id>
    pathname === "/news-maps" ||
    pathname === "/" ||
    pathname === "/nearby-news/map"
  );

  // Route is allowed if it's either an exact match OR a dynamic public route
  const isRouteAllowed = isExactMatchAllowed || isDynamicPublicRoute;
  
  const shouldProtect = !isRouteAllowed;

  useEffect(() => {
    if (!loading && !isAuthenticated && shouldProtect) {
      router.replace("/auth/login");
    } else {
    }
  }, [isAuthenticated, loading, pathname, router, shouldProtect]);

  if (loading) {
    return <LoadingSpinner />;
  }

  // ✅ Only allow render when loading is complete
  if (shouldProtect && !isAuthenticated) {
    return null; // wait for redirect
  }

  return children;
};

export default ProtectedRoute;