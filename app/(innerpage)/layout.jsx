"use client"

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import ProtectedRoute from "../_components/ProtectedRoute";
import Navbar from "../_components/Navbar";
import LayoutWrapper from "../_components/LayoutWrapper";
import BottomNavigation from "../_components/BottomNav";

const ProtectLayout = ({ children }) => {
  const pathname = usePathname();
  const [showBottomNav, setShowBottomNav] = useState(true);

  useEffect(() => {
    // Hide bottom nav for detail pages
    // const isNewsDetailPage = /^\/news\/[^\/]+$/.test(pathname);
    // const isKidsNewsDetailPage = /^\/news-kids\/[^\/]+$/.test(pathname);
    const hideBottomNav =
    pathname.startsWith("/onboarding/follow") ||
    pathname.startsWith("/communities/select") ||
    pathname.startsWith("/centers");

    setShowBottomNav(!hideBottomNav);
    
  }, [pathname]);

  // Maps are Leaflet now (loaded per map component); no global Google Maps script.
  return (
    <>
      {/* <ProtectedRoute allowedRoutes={["/", "/search", "/our-story", "/our-features", "/about-us", "/contact-us", "/landing", "/news-maps", "/nearby-news"]}> */}
        <div className="relative min-h-screen flex bg-white">
            <div className="flex-grow">
            <Navbar />
            <div className="w-full">
              {children}
            </div>
            {/* {showBottomNav && <BottomNavigation />} */}
            </div>
        </div>
      {/* </ProtectedRoute> */}
    </>
  );
};

export default ProtectLayout;