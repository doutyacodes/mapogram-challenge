"use client";

import { use, useEffect, useState } from "react";
import PageView from "./components/PageView";
import TopBar from "@/components/shared/TopBar";
import { useParams } from "next/navigation";
import { useIdentityStore } from "@/stores/activeIdentityStore";


export default function PageRoute() {
  const { id: pageId } = useParams();
  const [isPageAdmin, setIsPageAdmin] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [tourismData, setTourismData] = useState({
    isStatic: false,
    stateName: '',
    totalPoints: 0
  });

  const loggedInUserId = useIdentityStore(state => state.loggedInUserId);
  const isIdentityLoading = useIdentityStore(state => state.isIdentityLoading);

  // 2. Check if current user is a page admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (!pageId) return;

      try {
        const res = await fetch(`/api/page/is-admin?pageId=${pageId}`);
        const data = await res.json();
        setIsPageAdmin(data.isAdmin);
      } catch (err) {
        console.error("Failed to check page admin:", err);
      }
    };

    checkAdmin();
  }, [pageId]);


  if (isIdentityLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {/* TopBar Component */}
      <TopBar
        type="page" 
        id={pageId} 
        currentUserId={loggedInUserId} 
        selectedDistrict={selectedDistrict}
        tourismData={tourismData}
      />
      <PageView 
        pageId={pageId} 
        isOwner={isPageAdmin} 
        selectedDistrict={selectedDistrict}
        setSelectedDistrict={setSelectedDistrict}
        onTourismUpdate={setTourismData}
      />
    </div>
  );
}