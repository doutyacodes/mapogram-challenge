"use client";
import { useEffect, useState } from "react";

const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

const MapTypeControls = ({ mapRef, buttonStyle }) => {
  const [mapType, setMapType] = useState("roadmap");
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isExpanded && !event.target.closest('.map-type-controls')) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded]);

  const changeMapType = (type) => {
    if (!mapRef) return;
    mapRef.setMapTypeId(type);
    setMapType(type);
    setIsExpanded(false);
  };

  if (!isMobile) {
    return (
      <div className="absolute top-3 left-4 z-10 flex flex-row map-type-controls">
        <button
          onClick={() => changeMapType("roadmap")}
          className={`bg-white shadow-md p-2 hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center rounded-l-lg border-r border-gray-200 ${mapType === "roadmap" ? "bg-gray-100" : ""}`}
          style={{
            ...buttonStyle,
            color: mapType === "roadmap" ? "black" : "rgba(0,0,0,0.5)",
            fontWeight: mapType === "roadmap" ? "500" : "normal"
          }}
        >
          Map
        </button>
        <button
          onClick={() => changeMapType("satellite")}
          className={`bg-white shadow-md p-2 hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center rounded-r-lg ${mapType === "satellite" ? "bg-gray-100" : ""}`}
          style={{
            ...buttonStyle,
            color: mapType === "satellite" ? "black" : "rgba(0,0,0,0.5)",
            fontWeight: mapType === "satellite" ? "500" : "normal"
          }}
        >
          Satellite
        </button>
      </div>
    );
  }

  return (
    <div className="absolute top-3 left-4 z-10 flex flex-col map-type-controls">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-white shadow-md rounded-lg p-2 hover:bg-gray-100 transition-colors duration-200 mb-2 flex items-center justify-center"
        style={buttonStyle}
      >
        <span>{mapType === "roadmap" ? "Map" : "Satellite"}</span>
      </button>

      {isExpanded && (
        <div className="bg-white/95 backdrop-blur-sm shadow-lg rounded-lg overflow-hidden absolute top-12 left-0">
          <button
            className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${mapType === "roadmap" ? "bg-gray-200" : ""}`}
            onClick={() => changeMapType("roadmap")}
          >
            Map
          </button>
          <button
            className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${mapType === "satellite" ? "bg-gray-200" : ""}`}
            onClick={() => changeMapType("satellite")}
          >
            Satellite
          </button>
        </div>
      )}
    </div>
  );
};

export default MapTypeControls;
