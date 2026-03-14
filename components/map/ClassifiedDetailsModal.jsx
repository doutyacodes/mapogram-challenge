// components/MapCard.js
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { BASE_IMG_URL } from '@/lib/map/constants';

// New Modal Component for Classified Details
const ClassifiedDetailsModal = ({ isOpen, onClose, post, onLike, isLiked, likeCount }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = post.classified_details?.images || [];
  const hasImages = images.length > 0;

  const nextImage = () => {
    if (hasImages) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = () => {
    if (hasImages) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  const handleCall = (phone) => {
    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  };

  const handleEmail = (email) => {
    if (email) {
      window.location.href = `mailto:${email}`;
    }
  };

  const renderSpecificDetails = () => {
    const { classified_details } = post;
    if (!classified_details) return null;

    const subCategory = classified_details.sub_category_name?.toLowerCase() || '';

    // Vehicle Details
    if (classified_details.vehicle_details) {
      const vd = classified_details.vehicle_details;
      return (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-3">🚗 Vehicle Details</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {vd.brand_name && <div><span className="font-medium">Brand:</span> {vd.brand_name}</div>}
            {vd.model_name && <div><span className="font-medium">Model:</span> {vd.model_name}</div>}
            {vd.year && <div><span className="font-medium">Year:</span> {vd.year}</div>}
            {vd.fuel_type && <div><span className="font-medium">Fuel:</span> {vd.fuel_type}</div>}
            {vd.transmission && <div><span className="font-medium">Transmission:</span> {vd.transmission}</div>}
            {vd.mileage_km && <div><span className="font-medium">Mileage:</span> {vd.mileage_km.toLocaleString()} km</div>}
            {vd.engine_capacity && <div><span className="font-medium">Engine:</span> {vd.engine_capacity}</div>}
            {vd.color && <div><span className="font-medium">Color:</span> {vd.color}</div>}
            {vd.number_of_owners && <div><span className="font-medium">Owners:</span> {vd.number_of_owners}</div>}
          </div>
        </div>
      );
    }

    // Electronics Details
    if (classified_details.electronics_details) {
      const ed = classified_details.electronics_details;
      return (
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-semibold text-green-800 mb-3">📱 Electronics Details</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {ed.brand_name && <div><span className="font-medium">Brand:</span> {ed.brand_name}</div>}
            {ed.model && <div><span className="font-medium">Model:</span> {ed.model}</div>}
            {ed.storage_capacity && <div><span className="font-medium">Storage:</span> {ed.storage_capacity}</div>}
            {ed.ram && <div><span className="font-medium">RAM:</span> {ed.ram}</div>}
            {ed.screen_size && <div><span className="font-medium">Screen:</span> {ed.screen_size}</div>}
            {ed.processor && <div><span className="font-medium">Processor:</span> {ed.processor}</div>}
            {ed.warranty_months_left !== undefined && (
              <div><span className="font-medium">Warranty:</span> {ed.warranty_months_left} months left</div>
            )}
            <div><span className="font-medium">Bill Available:</span> {ed.bill_available ? 'Yes' : 'No'}</div>
            <div><span className="font-medium">Box Available:</span> {ed.box_available ? 'Yes' : 'No'}</div>
          </div>
        </div>
      );
    }

    // Furniture Details
    if (classified_details.furniture_details) {
      const fd = classified_details.furniture_details;
      return (
        <div className="bg-purple-50 p-4 rounded-lg">
          <h4 className="font-semibold text-purple-800 mb-3">🪑 Furniture Details</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {fd.material && <div><span className="font-medium">Material:</span> {fd.material}</div>}
            {fd.color && <div><span className="font-medium">Color:</span> {fd.color}</div>}
            {fd.dimensions && <div><span className="font-medium">Dimensions:</span> {fd.dimensions}</div>}
            {fd.brand && <div><span className="font-medium">Brand:</span> {fd.brand}</div>}
            {fd.seating_capacity && <div><span className="font-medium">Seating:</span> {fd.seating_capacity} people</div>}
            {fd.number_of_pieces && <div><span className="font-medium">Pieces:</span> {fd.number_of_pieces}</div>}
            {fd.weight_kg && <div><span className="font-medium">Weight:</span> {fd.weight_kg} kg</div>}
            <div><span className="font-medium">Assembly Required:</span> {fd.assembly_required ? 'Yes' : 'No'}</div>
          </div>
        </div>
      );
    }

    // Real Estate Details
    if (classified_details.real_estate_details) {
      const rd = classified_details.real_estate_details;
      return (
        <div className="bg-orange-50 p-4 rounded-lg">
          <h4 className="font-semibold text-orange-800 mb-3">🏠 Property Details</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {rd.property_type && <div><span className="font-medium">Type:</span> {rd.property_type}</div>}
            {rd.area_sqft && <div><span className="font-medium">Area:</span> {rd.area_sqft} {rd.area_unit || 'sqft'}</div>}
            {rd.bedrooms && <div><span className="font-medium">Bedrooms:</span> {rd.bedrooms}</div>}
            {rd.bathrooms && <div><span className="font-medium">Bathrooms:</span> {rd.bathrooms}</div>}
            {rd.floor_number && <div><span className="font-medium">Floor:</span> {rd.floor_number}/{rd.total_floors}</div>}
            {rd.furnished && <div><span className="font-medium">Furnished:</span> {rd.furnished}</div>}
            {rd.monthly_rent && <div><span className="font-medium">Monthly Rent:</span> ₹{rd.monthly_rent.toLocaleString()}</div>}
            {rd.security_deposit && <div><span className="font-medium">Security Deposit:</span> ₹{rd.security_deposit.toLocaleString()}</div>}
            {rd.construction_year && <div><span className="font-medium">Built:</span> {rd.construction_year}</div>}
            <div><span className="font-medium">Parking:</span> {rd.parking ? 'Available' : 'Not Available'}</div>
            <div><span className="font-medium">Ready to Move:</span> {rd.ready_to_move ? 'Yes' : 'No'}</div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-4xl max-h-[90vh] transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 z-10 flex items-center justify-center w-10 h-10 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full text-white transition-all duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <div className="overflow-y-auto max-h-[90vh]">
                  {/* Image Gallery */}
                  {hasImages && (
                    <div className="relative h-64 sm:h-80 md:h-96">
                      <Image
                        src={`${BASE_IMG_URL}${images[currentImageIndex]?.image_url}`}
                        alt={`${post.title} - Image ${currentImageIndex + 1}`}
                        layout="fill"
                        objectFit="cover"
                        className="rounded-t-2xl"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/user-placeoholder.png";
                        }}
                      />
                      
                      {/* Image Navigation */}
                      {images.length > 1 && (
                        <>
                          <button
                            onClick={prevImage}
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all duration-200"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <button
                            onClick={nextImage}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all duration-200"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                          
                          {/* Image indicators */}
                          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                            {images.map((_, index) => (
                              <button
                                key={index}
                                onClick={() => setCurrentImageIndex(index)}
                                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                                  index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                                }`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-4 sm:p-6 space-y-6">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{post.title}</h2>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                            {post.classified_details?.sub_category_name}
                          </span>
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                            {post.classified_details?.listing_type}
                          </span>
                          {post.classified_details?.condition && (
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                              {post.classified_details.condition}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Price */}
                      {post.classified_details?.price && (
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            ₹{post.classified_details.price.toLocaleString()}
                          </div>
                          {post.classified_details.price_type && (
                            <div className="text-sm text-gray-500">{post.classified_details.price_type}</div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {post.description && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                        <p className="text-gray-700 text-sm leading-relaxed">{post.description}</p>
                      </div>
                    )}

                    {/* Specific Details */}
                    {renderSpecificDetails()}

                    {/* Contact Information */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
                      <div className="flex flex-col sm:flex-row gap-3">
                        {post.classified_details?.contact_phone && (
                          <button
                            onClick={() => handleCall(post.classified_details.contact_phone)}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            Call Now
                          </button>
                        )}
                        {post.classified_details?.contact_email && (
                          <button
                            onClick={() => handleEmail(post.classified_details.contact_email)}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Email
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="text-sm text-gray-600">
                        Posted by {post.user_name} • {new Date(post.created_at).toLocaleDateString()}
                      </div>
                      
                      {/* Like button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onLike(post.id);
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 transform hover:scale-105 ${
                          isLiked 
                            ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg' 
                            : 'bg-white text-gray-600 hover:bg-red-50 hover:text-red-600 border border-gray-200 hover:border-red-300'
                        }`}
                      >
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className={`h-5 w-5 transition-transform duration-200 ${isLiked ? 'scale-110' : ''}`} 
                          fill={isLiked ? 'currentColor' : 'none'} 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span className="text-sm font-medium">
                          {likeCount || 0}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ClassifiedDetailsModal;
