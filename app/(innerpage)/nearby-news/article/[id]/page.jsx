'use client';

import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import ShareButton from '@/app/_components/ShareButton';

export default function ArticlePage() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchArticle() {
      try {
        const response = await fetch(`/api/nearby-news/article/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch article');
        }
        
        const data = await response.json();
        setArticle(data.article);
      } catch (err) {
        console.error('Error fetching article:', err);
        setError('Failed to load article. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchArticle();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-800 text-2xl font-semibold">Loading article...</div>
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

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-800 text-2xl font-semibold">Article not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl pb-20">
      {/* Article Title */}
      <h1 className="text-4xl md:text-5xl font-bold mb-6 text-red-800">
        {article.title}
      </h1>
      
      {/* Article Metadata */}
      <div className="flex items-center justify-between mb-8 text-gray-600">
        <div className="flex items-center">
          <span className="mr-2">Published by:</span>
          <span className="font-medium">{article.author_name || 'Anonymous'}</span>
        </div>
        <div>
          {article.created_at && (
            <time dateTime={article.created_at}>
              {format(new Date(article.created_at), 'MMMM d, yyyy')}
            </time>
          )}
        </div>
      </div>
      
      {/* Article Image */}
      <div className="w-full h-96 relative mb-8 rounded-lg overflow-hidden">
        {article.image_url ? (
          <Image
            src={article.image_url}
            alt={article.title}
            fill
            className="object-cover"
            sizes="(max-width: 1200px) 100vw, 1200px"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-500">No image available</span>
          </div>
        )}
      </div>
      
      {/* Article Content */}
      <div className="prose prose-lg max-w-none">
        {article.content.split('\n').map((paragraph, index) => (
          <p key={index} className="text-justify">
            {paragraph}
          </p>
        ))}
      </div>

    {/* Share Button */}
    <div className="mt-8 flex justify-center">
      <ShareButton
        title={article.title}
        description={article.content.substring(0, 150) + '...'}
        className="w-full sm:w-auto"
      />
    </div>

    </div>
  );
}