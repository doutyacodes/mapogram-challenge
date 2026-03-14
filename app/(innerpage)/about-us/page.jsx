"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Globe, Compass, Users, ArrowRight, MapPin, Newspaper, Share2, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';

const AboutUsPage = () => {

  const router = useRouter()

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const handleNav = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        {/* Header */}
        <motion.div 
          className="text-center mb-14 md:mb-20"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-red-800">About NewsOnMap</h1>
          <div className="w-16 h-1 bg-red-800 mx-auto mt-4"></div>
        </motion.div>

        {/* Main Content */}
        <div className="max-w-3xl mx-auto space-y-12">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
          >
            <h2 className="text-2xl font-semibold text-red-800 mb-5 border-b border-red-100 pb-2 flex items-center">
              <BookOpen className="mr-2 text-red-800" size={20} />
              About NewsOnMap
            </h2>
            <p className="text-gray-700 leading-relaxed text-justify mb-4">
              NewsOnMap revolutionizes how people discover and interact with news by bringing stories directly to their geographic context. We believe that understanding where news happens is just as important as understanding what happens.
            </p>
            <p className="text-gray-700 leading-relaxed text-justify mb-4">
              Born from the vision to make news discovery more intuitive and engaging, NewsOnMap transforms traditional news consumption into an interactive, location-based experience. Whether you&apos;re curious about what&apos;s happening in your neighborhood or want to explore global events, our platform puts the world&apos;s stories at your fingertips.
            </p>
            <p className="text-gray-700 leading-relaxed text-justify">
              We leverage cutting-edge technology to enhance news discovery while maintaining the highest standards of journalistic integrity and community engagement.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
          >
            <h2 className="text-2xl font-semibold text-red-800 mb-5 border-b border-red-100 pb-2 flex items-center">
              <Globe className="mr-2 text-red-800" size={20} />
              How NewsOnMap Works
            </h2>
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-medium text-red-800 mb-2 flex items-center">
                  <MapPin className="mr-2" size={18} />
                  Local News Discovery
                </h3>
                <p className="text-gray-700 leading-relaxed text-justify">
                  Discover breaking news and stories within a 10km radius of your current location. Our interactive map shows you exactly what&apos;s happening in your community, helping you stay connected with local events that matter most to you.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-red-800 mb-2 flex items-center">
                  <Eye className="mr-2" size={18} />
                  Global News Exploration
                </h3>
                <p className="text-gray-700 leading-relaxed text-justify">
                  Explore breaking news from around the world on our comprehensive global map. Curated by our editorial team, these stories provide you with a bird&apos;s-eye view of international events and their geographic context.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-red-800 mb-2 flex items-center">
                  <Share2 className="mr-2" size={18} />
                  Community Contribution
                </h3>
                <p className="text-gray-700 leading-relaxed text-justify">
                  Become a local news creator and share stories from your community. Our platform empowers citizens to contribute hyperlocal news, creating a rich tapestry of community-driven journalism that traditional media often misses.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-red-800 mb-2 flex items-center">
                  <Newspaper className="mr-2" size={18} />
                  Interactive Experience
                </h3>
                <p className="text-gray-700 leading-relaxed text-justify">
                  Every story is more than just text — it&apos;s a location, a community, and a moment in time. Our interactive interface makes news discovery engaging and intuitive, especially designed for digital natives who expect more from their news experience.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
          >
            <h2 className="text-2xl font-semibold text-red-800 mb-5 border-b border-red-100 pb-2 flex items-center">
              <Compass className="mr-2 text-red-800" size={20} />
              Our Mission
            </h2>
            <p className="text-gray-700 leading-relaxed text-justify mb-4">
              To bridge the gap between global awareness and local engagement by making news discovery as natural as exploring a map. We believe that understanding the geographic context of news creates more informed, engaged, and connected communities.
            </p>
            <p className="text-gray-700 leading-relaxed text-justify">
              NewsOnMap empowers both news consumers and creators, fostering a more democratic and inclusive news ecosystem where every voice can contribute to the broader narrative of our interconnected world.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
          >
            <h2 className="text-2xl font-semibold text-red-800 mb-5 border-b border-red-100 pb-2 flex items-center">
              <Users className="mr-2 text-red-800" size={20} />
              Why Choose NewsOnMap?
            </h2>
            <p className="text-gray-700 leading-relaxed text-justify mb-4">
              NewsOnMap makes news discovery intuitive and engaging by connecting stories to their locations. Whether you want to stay informed about your neighborhood or explore global events, our interactive maps provide the context that traditional news apps can&apos;t match.
            </p>
            <p className="text-gray-700 leading-relaxed text-justify">
              Join a community where local voices matter and where understanding the world starts with understanding your surroundings.
            </p>
          </motion.div>

          <motion.div 
            className="border-t border-red-100 pt-8 mt-10"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
          >
            <p className="text-gray-700 italic leading-relaxed text-center mb-6">
              From your neighborhood to the world, NewsOnMap connects you to the stories that shape our communities and our planet — one map, one story, one click at a time.
            </p>
            <p className="text-red-800 font-medium text-center">
              Join thousands of users who are discovering news in a whole new way.
            </p>
          </motion.div>
        </div>

        {/* Call to Action */}
        <motion.div 
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <button
            onClick={handleNav}
            className="group bg-red-800 hover:bg-red-900 text-white px-6 py-3 rounded-md text-base font-medium transition-colors duration-300 flex items-center mx-auto"
          >
            Explore NewsOnMap
            <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform duration-300" size={18} />
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default AboutUsPage;