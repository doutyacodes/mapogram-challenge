'use client';

import React, { useState } from "react";
import CommunityTopBar from "@/components/community/topbar/CommunityTopBar";
import CommunityView from "./components/CommunityView";

export default function Page() {
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [tourismData, setTourismData] = useState({
    isStatic: false,
    stateName: '',
    totalPoints: 0
  });

  return (
    <div>
      <CommunityTopBar 
        selectedDistrict={selectedDistrict}
        tourismData={tourismData}
      />
      <CommunityView 
        selectedDistrict={selectedDistrict}
        setSelectedDistrict={setSelectedDistrict}
        onTourismUpdate={setTourismData}
      />
    </div>
  );
}