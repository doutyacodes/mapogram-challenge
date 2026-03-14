'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trash2, Edit, Plus, AlertCircle, MapPin, Users, X } from 'lucide-react';
import useAuthRedirect from '../_component/useAuthRedirect';

export default function AdminNewsPage() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showIntroModal, setShowIntroModal] = useState(true);
  const [newsToDelete, setNewsToDelete] = useState(null);
  const router = useRouter();
  
  useAuthRedirect();

  useEffect(() => {
    fetchNews();
    // Check if user has seen the intro before
    const hasSeenIntro = localStorage.getItem('hasSeenCreatorIntro');
    if (hasSeenIntro) {
      setShowIntroModal(false);
    }
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/nearby-news', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('user_token')}`
        },
      });
      if (!res.ok) {
        throw new Error('Failed to fetch news');
      }
      const data = await res.json();
      setNews(data.news);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleIntroClose = () => {
    setShowIntroModal(false);
    localStorage.setItem('hasSeenCreatorIntro', 'true');
  };

  const handleDelete = async () => {
    if (!newsToDelete) return;
    
    try {
      const res = await fetch(`/api/nearby-news/${newsToDelete.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('user_token')}`
        },
        method: 'DELETE',
      });
      
      if (!res.ok) {
        throw new Error('Failed to delete news');
      }
      
      // Remove the deleted news from the state
      setNews(news.filter(item => item.id !== newsToDelete.id));
      setShowDeleteModal(false);
      setNewsToDelete(null);
    } catch (err) {
      console.error('Error deleting news:', err);
      setError(err.message);
    }
  };

  const confirmDelete = (newsItem) => {
    setNewsToDelete(newsItem);
    setShowDeleteModal(true);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const truncate = (text, length = 100) => {
    if (!text) return "";
      return text.length > length ? text.slice(0, length) + "..." : text;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center space-x-2 text-red-800">
            <div className="w-4 h-4 border-2 border-red-800 border-t-transparent rounded-full animate-spin"></div>
            <p>Loading news...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="bg-white p-6 rounded-lg shadow-md text-red-800">
          <p className="flex items-center"><AlertCircle className="mr-2" /> Error: {error}</p>
          <button 
            onClick={fetchNews}
            className="mt-4 px-4 py-2 bg-red-800 text-white rounded hover:bg-red-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center sm:text-left">
            News Management
            </h1>
            <a 
            href="/nearby-news/create" 
            className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-red-800 text-white rounded-md hover:bg-red-700 transition"
            >
            <Plus className="mr-2 h-5 w-5" /> Create News
            </a>
        </div>

        {/* Empty state with responsive padding and button */}
        {news.length === 0 ? (
            <div className="bg-white p-4 sm:p-8 rounded-lg shadow-md text-center">
            <p className="text-gray-600 mb-4">No news articles found.</p>
            <a 
                href="/nearby-news/create" 
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-red-800 text-white rounded-md hover:bg-red-700 transition"
        >
            <Plus className="mr-2 h-5 w-5" /> Add Your First News Article
        </a>
        </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.map(newsItem => (
              <div key={newsItem.id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
                <div className="relative h-48 w-full">
                  <img
                    src={newsItem.image_url.startsWith('http') ? newsItem.image_url : `https://wowfy.in/testusr/images/${newsItem.image_url}`} 
                    alt={newsItem.title}
                    
                    className="object-cover w-full h-full" 
                  />
                </div>
                <div className="p-4 flex-grow">
                  <h2 className="text-xl font-semibold text-gray-800 mb-2 line-clamp-2">{newsItem.title}</h2>
                    <p className="text-gray-600 text-sm">
                        {truncate(newsItem.content, 120)}
                    </p>
                </div>
                <div className="border-t border-gray-100 p-4 flex justify-between items-center">
                  <span className="text-sm text-gray-500">{formatDate(newsItem.created_at)}</span>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => router.push(`/nearby-news/edit/${newsItem.id}`)}
                      className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition"
                      aria-label="Edit news"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => confirmDelete(newsItem)}
                      className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition"
                      aria-label="Delete news"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Introduction Modal */}
      {showIntroModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-screen overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-800 to-red-700 p-6 rounded-t-2xl relative">
              <button 
                onClick={handleIntroClose}
                className="absolute top-4 right-4 text-white hover:text-red-200 transition-colors"
              >
                <X size={24} />
              </button>
              <div className="text-center">
                <div className="bg-white bg-opacity-20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Users className="text-white" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Welcome to Creator Hub!</h2>
                <p className="text-red-100">Share local news with your community</p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* About Nearby News */}
              <div className="bg-gray-50 rounded-xl p-5">
                <div className="flex items-center mb-3">
                  <MapPin className="text-red-800 mr-3" size={24} />
                  <h3 className="text-xl font-semibold text-gray-800">Discover Nearby News</h3>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  Our &quot;Nearby News&quot; feature shows you local stories within a 10km radius of your location. 
                  All news articles are displayed as interactive markers on a map, helping you stay connected 
                  with what&apos;s happening in your immediate community.
                </p>
              </div>

              {/* About Being a Creator */}
              <div className="bg-red-50 rounded-xl p-5 border-l-4 border-red-800">
                <div className="flex items-center mb-3">
                  <Plus className="text-red-800 mr-3" size={24} />
                  <h3 className="text-xl font-semibold text-gray-800">Become a Local Creator</h3>
                </div>
                <p className="text-gray-600 leading-relaxed mb-4">
                  As a creator, you can contribute to your local community by sharing news and events 
                  happening around you. Your stories will appear on the map for others in your area to discover.
                </p>
                
                <div className="bg-white rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-gray-800 mb-2">Key Features:</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-red-800 rounded-full mr-3"></div>
                      Share news within 10km of your current location
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-red-800 rounded-full mr-3"></div>
                      Location access required for accurate positioning
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-red-800 rounded-full mr-3"></div>
                      Help build a connected local community
                    </li>
                  </ul>
                </div>
              </div>

              {/* Call to Action */}
              <div className="text-center pt-4">
                <button 
                  onClick={handleIntroClose}
                  className="bg-red-800 text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Start Creating News
                </button>
                <p className="text-sm text-gray-500 mt-3">
                  You can always view this information again from the help section
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Confirm Deletion</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete &quot;{newsToDelete?.title}&quot;? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                className="px-4 py-2 bg-red-800 text-white rounded hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}