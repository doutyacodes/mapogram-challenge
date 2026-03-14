"use client";

const ZoomControls = ({ mapRef, isMobile }) => {
  const handleZoomIn = () => {
    if (!mapRef) return;
    const currentZoom = mapRef.getZoom();
    mapRef.setZoom(currentZoom + 1);
  };

  const handleZoomOut = () => {
    if (!mapRef) return;
    const currentZoom = mapRef.getZoom();
    mapRef.setZoom(currentZoom - 1);
  };

  return (
    <div className="absolute right-3.5 z-10 bg-white shadow-md rounded-lg overflow-hidden" style={{ bottom: isMobile ? '150px' : '115px' }}>
      <button 
        onClick={handleZoomIn}
        className="block w-full hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center border-b border-gray-200"
        style={{
          width: isMobile ? '32px' : '40px',
          height: isMobile ? '32px' : '40px',
          fontSize: isMobile ? '16px' : '18px',
          fontWeight: 'normal'
        }}
      >
        +
      </button>
      <button 
        onClick={handleZoomOut}
        className="block w-full hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center"
        style={{
          width: isMobile ? '32px' : '40px',
          height: isMobile ? '32px' : '40px',
          fontSize: isMobile ? '16px' : '18px',
          fontWeight: 'normal'
        }}
      >
        −
      </button>
    </div>
  );
};

export default ZoomControls;
