// const MobileResetButton = ({ mapRef, fetchPostsData, setSelectedLocation, selectedLayer }) => {
//   const handleReset = () => {
//     if (mapRef) {
//       mapRef.panTo(center);
//       mapRef.setZoom(DEFAULT_ZOOM);
//     }
//     fetchPostsData(null, selectedLayer.id)
//     setSelectedLocation(null)
//   };

//   return (
//     <button 
//       onClick={handleReset}
//       className="bg-white border-4 border-gray-400 shadow-lg rounded-full hover:bg-gray-50 hover:border-blue-400 active:scale-95 transition-all duration-200 flex items-center justify-center"
//       title="Reset to world view"
//       style={{
//         width: '55px',
//         height: '55px',
//         boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
//       }}
//     >
//       <span className="text-gray-700 hover:text-blue-600 font-semibold text-[9px] leading-tight text-center transition-colors duration-200">
//         World<br />View
//       </span>
//     </button>
//   );
// };

// const ResetZoomButton = ({ mapRef, buttonStyle, fetchPostsData, selectedLayer, setSelectedLocation }) => {
//   const handleResetZoom = () => {
//     if (mapRef) {
//       // Smooth animation to default view
//       mapRef.panTo(center);
//       mapRef.setZoom(DEFAULT_ZOOM);
//     }
//     setSelectedLocation(null)
//     fetchPostsData(null, selectedLayer.id)
//   };

//   return (
//     <button 
//       onClick={handleResetZoom}
//       className="bg-white shadow-md rounded-lg p-2 hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center"
//       style={buttonStyle}
//       title="Reset to world view"
//     >
//       <RotateCw size={16} className="mr-1" />
//       <span className="text-sm">World View</span>
//     </button>
//   );
// };

// export default MobileResetButton;