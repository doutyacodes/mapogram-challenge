"use client"

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Phone, Mail, MapPin, Calendar, Tag, DollarSign, IndianRupee } from 'lucide-react';
import ShareButton from '@/app/_components/ShareButton';

export default function ClassifiedPage() {
  const { id } = useParams();
  const [classifiedAd, setClassifiedAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    async function fetchClassifiedAd() {
      try {
        const response = await fetch(`/api/nearby-news/classified/${id}`);

        if (!response.ok) {
          throw new Error('Failed to fetch classified ad');
        }
        
        const data = await response.json();
        setClassifiedAd(data.classifiedAd);
      } catch (err) {
        console.error('Error fetching classified ad:', err);
        setError('Failed to load classified ad. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchClassifiedAd();
    }
  }, [id]);

  const nextImage = () => {
    if (images.length > 1) {
      setCurrentImageIndex((prev) => 
        prev === images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (images.length > 1) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? images.length - 1 : prev - 1
      );
    }
  };

  const goToImage = (index) => {
    setCurrentImageIndex(index);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-800 text-2xl font-semibold">Loading classified ad...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-800 text-2xl font-semibold">{error}</div>
      </div>
    );
  }

  if (!classifiedAd) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-800 text-2xl font-semibold">Classified ad not found</div>
      </div>
    );
  }

  // Parse images (assuming they're stored as comma-separated URLs or JSON)
  let images = [];
  if (classifiedAd.images) {
    try {
      images = JSON.parse(classifiedAd.images);
    } catch {
      images = classifiedAd.images.split(',').map(url => url.trim());
    }
  }

  // Parse contact info (assuming it's stored as JSON)
  let contactInfo = {};
  if (classifiedAd.contact_info) {
    try {
      contactInfo = JSON.parse(classifiedAd.contact_info);
    } catch {
      contactInfo = { phone: classifiedAd.contact_info };
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Carousel Section */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="relative w-full h-96 md:h-[500px] rounded-lg overflow-hidden bg-gray-200">
            {images.length > 0 ? (
              <>
                <Image
                  src={images[currentImageIndex]}
                  alt={`${classifiedAd.title} - Image ${currentImageIndex + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
                
                {/* Navigation Arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
                
                {/* Image Counter */}
                {images.length > 1 && (
                  <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-gray-500">No images available</span>
              </div>
            )}
          </div>
          
          {/* Thumbnail Navigation */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => goToImage(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    index === currentImageIndex ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <Image
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    width={80}
                    height={80}
                    className="object-cover w-full h-full"
                  />
                </button>
              ))}
            </div>
          )}
          {/* Share Button */}
          <div className="flex justify-end">
            <ShareButton
              title={classifiedAd.title}
              description={classifiedAd.description.substring(0, 150) + '...'}
              className="w-full sm:w-auto"
            />
          </div>
        </div>

        {/* Details Section */}
        <div className="space-y-6">
          {/* Title and Type Badge */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                classifiedAd.ad_type === 'sell' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
              }`}>
                For {classifiedAd.ad_type === 'sell' ? 'Sale' : 'Rent'}
              </span>
              {classifiedAd.type && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                  {classifiedAd.type}
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-red-800 mb-2">
              {classifiedAd.title}
            </h1>
          </div>

          {/* Price */}
          {classifiedAd.price && (
            <div className="flex items-center gap-2 text-2xl md:text-3xl font-bold text-green-600">
              <IndianRupee size={28} />
              <span>{parseFloat(classifiedAd.price).toLocaleString()}</span>
            </div>
          )}

          {/* Category */}
          {classifiedAd.category_name && (
            <div className="flex items-center gap-2 text-gray-600">
              <Tag size={18} />
              <span className="font-medium">Category: {classifiedAd.category_name}</span>
            </div>
          )}

          {/* Created Date */}
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar size={18} />
            <span>
              Posted on {classifiedAd.created_at && format(new Date(classifiedAd.created_at), 'MMMM d, yyyy')}
            </span>
          </div>

          {/* Posted By */}
          <div className="text-gray-600">
            <span className="font-medium">Posted by: </span>
            <span>{classifiedAd.author_name || 'Anonymous'}</span>
          </div>

          {/* Description */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Description</h3>
            <div className="prose max-w-none">
              {classifiedAd.description.split('\n').map((paragraph, index) => (
                <p key={index} className="text-gray-700 mb-2 text-justify">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-red-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3 text-red-800">Contact Information</h3>
            <div className="space-y-2">
              {contactInfo.phone && (
                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-red-600" />
                  <a href={`tel:${contactInfo.phone}`} className="text-red-600 hover:underline font-medium">
                    {contactInfo.phone}
                  </a>
                </div>
              )}
              {contactInfo.email && (
                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-red-600" />
                  <a href={`mailto:${contactInfo.email}`} className="text-red-600 hover:underline font-medium">
                    {contactInfo.email}
                  </a>
                </div>
              )}
              {(classifiedAd.latitude && classifiedAd.longitude) && (
                <div className="flex items-center gap-3">
                  <MapPin size={18} className="text-red-600" />
                  <span className="text-gray-700">
                    Location: {parseFloat(classifiedAd.latitude).toFixed(4)}, {parseFloat(classifiedAd.longitude).toFixed(4)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {contactInfo.phone && (
              <a
                href={`tel:${contactInfo.phone}`}
                className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold text-center hover:bg-red-700 transition-colors"
              >
                Call Now
              </a>
            )}
            {contactInfo.email && (
              <a
                href={`mailto:${contactInfo.email}`}
                className="flex-1 bg-red-100 text-red-600 px-6 py-3 rounded-lg font-semibold text-center hover:bg-red-200 transition-colors border border-red-300"
              >
                Send Email
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}