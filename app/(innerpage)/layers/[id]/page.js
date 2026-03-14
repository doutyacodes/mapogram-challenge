"use client";

import { use, useEffect, useState } from "react";
import LayerView from "./components/LayerView";
import TopBar from "@/components/shared/TopBar";
import { useIdentityStore } from "@/stores/activeIdentityStore";


export default function LayerRoute({ params }) {
  const { id: layerId } = use(params);
  const loggedInUserId = useIdentityStore(state => state.loggedInUserId);
  const isIdentityLoading = useIdentityStore(state => state.isIdentityLoading);

  if (isIdentityLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {/* TopBar Component */}
      <TopBar
        type="layer" 
        id={layerId} 
        currentUserId={loggedInUserId} 
      />
      <LayerView layerId={layerId}/>
    </div>
  );
}