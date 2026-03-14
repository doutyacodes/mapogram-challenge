"use client";

import { use, useEffect, useState } from "react";
import CentersView from "./components/CentersView";
import { useParams } from "next/navigation";
import { useIdentityStore } from "@/stores/activeIdentityStore";
import CentersTopBar from "@/components/shared/CentersTopBar";

export default function PageRoute() {
  const { id: pageId } = useParams();
  const [isPageAdmin, setIsPageAdmin] = useState(false);

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
      <CentersTopBar
        type="page" 
        id={pageId} 
        currentUserId={loggedInUserId} 
      />
      <CentersView pageId={pageId} isOwner={isPageAdmin} />
    </div>
  );
}