// import { Metadata } from 'next';
// import { db } from '@/utils';
// import { MAP_NEWS } from '@/utils/schema';
// import { eq } from 'drizzle-orm';
// import NewsMap from '../_components/NewsMap/NewsMap';

// export async function generateMetadata({ searchParams }) {
//   const newsId = searchParams.newsId;
  
//   if (newsId) {
//     try {
//       const news = await db
//         .select({
//           id: MAP_NEWS.id,
//           title: MAP_NEWS.title,
//           image_url: MAP_NEWS.image_url,
//           summary: MAP_NEWS.summary,
//         })
//         .from(MAP_NEWS)
//         .where(eq(MAP_NEWS.id, parseInt(newsId)))
//         .limit(1);

//       if (news && news.length > 0) {
//         const newsItem = news[0];
//         return {
//           title: `${newsItem.title} - NewsOnMap`,
//           description: newsItem.summary || newsItem.title,
//           openGraph: {
//             title: newsItem.title,
//             description: newsItem.summary || newsItem.title,
//             images: [{ url: newsItem.image_url, width: 1200, height: 630 }],
//           },
//           twitter: {
//             card: 'summary_large_image',
//             title: newsItem.title,
//             description: newsItem.summary || newsItem.title,
//             images: [newsItem.image_url],
//           }
//         };
//       }
//     } catch (error) {
//       console.error('Error:', error);
//     }
//   }
  
//   // Default metadata
//   return {
//     title: {
//         default: "NewsOnMap - Discover Local & Global News on Interactive Maps",
//         template: '%s | NewsOnMap'
//     },
//     description: "Discover breaking news around you and worldwide with NewsOnMap. View local news within 10km, contribute stories from your area, and explore global news on an interactive map interface.",
//   };
// }

// export default function Page() {
//   return <NewsMap />;
// }

import { redirect } from 'next/navigation';

export default function Home() {
  // redirect('/layers/4'); // ✅ Server-side redirect
  redirect('/communities'); // ✅ Server-side redirect
}