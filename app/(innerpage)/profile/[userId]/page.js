"use client";

import { use, useEffect, useState } from "react";
import UserView from "./components/UserView";
import TopBar from "@/components/shared/TopBar";


export default function LayerRoute({ params }) {
  const { userId } = use(params);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/user/me");
        const data = await res.json();

        if (res.ok) {
          setCurrentUserId(data.user.id);
        }
      } catch (err) {
        console.error("Failed to fetch current user:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  console.log('currentUserId', currentUserId)
  const isOwner = currentUserId == userId;

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {/* TopBar Component */}
      <TopBar
        type="profile" 
        id={userId} 
        currentUserId={currentUserId} 
      />
      <UserView userId={userId} isOwner={isOwner}/>
    </div>
  );
}