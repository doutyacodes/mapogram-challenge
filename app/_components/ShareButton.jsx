'use client';

import { useState } from 'react';
import { Share2, Copy, MessageCircle, Send, Link, Check } from 'lucide-react';

export default function ShareButton({ 
  title, 
  description, 
  url = typeof window !== 'undefined' ? window.location.href : '',
  className = ""
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareData = {
    title: title,
    text: description || title,
    url: url
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareToTelegram = () => {
    const text = encodeURIComponent(shareData.text);
    const urlEncoded = encodeURIComponent(shareData.url);
    window.open(`https://t.me/share/url?url=${urlEncoded}&text=${text}`, '_blank');
  };

  const shareToFacebook = () => {
    const urlEncoded = encodeURIComponent(shareData.url);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${urlEncoded}`, '_blank');
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent(`${shareData.text} ${shareData.url}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
    onClick={() => setIsOpen(!isOpen)}
    className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-full border border-gray-300 hover:bg-gray-200 hover:border-gray-400 transition-all duration-200 text-sm font-medium"
    >
    <Share2 size={16} />
    Share
    </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Share Menu */}
          <div className="absolute bottom-full left-0 right-0 sm:left-auto sm:right-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 min-w-64">
            <div className="p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Share this</h3>
              
              <div className="space-y-2">
                {/* Copy Link */}
                <button
                  onClick={copyToClipboard}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  {copied ? (
                    <Check size={20} className="text-green-600" />
                  ) : (
                    <Copy size={20} className="text-gray-600" />
                  )}
                  <span className={copied ? "text-green-600" : "text-gray-700"}>
                    {copied ? "Link Copied!" : "Copy Link"}
                  </span>
                </button>

                {/* WhatsApp */}
                <button
                  onClick={shareToWhatsApp}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <MessageCircle size={20} className="text-green-600" />
                  <span className="text-gray-700">WhatsApp</span>
                </button>

                {/* Telegram */}
                <button
                  onClick={shareToTelegram}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Send size={20} className="text-blue-500" />
                  <span className="text-gray-700">Telegram</span>
                </button>

                {/* Facebook */}
                <button
                  onClick={shareToFacebook}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">f</span>
                  </div>
                  <span className="text-gray-700">Facebook</span>
                </button>

                {/* Twitter */}
                <button
                  onClick={shareToTwitter}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="w-5 h-5 bg-black rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">𝕏</span>
                  </div>
                  <span className="text-gray-700">Twitter</span>
                </button>

                {/* Native Share (Mobile) */}
                {navigator.share && (
                  <button
                    onClick={nativeShare}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Share2 size={20} className="text-gray-600" />
                    <span className="text-gray-700">More Options</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}