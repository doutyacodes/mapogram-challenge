"use client";

import { motion } from "framer-motion";

export default function Contact() {
  return (
    <footer id="contact" className=" bottom-0 left-0 w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between text-center md:text-left space-y-4 md:space-y-0"
      >
        {/* Address Section */}
        <div className="text-xs">
          <h3 className="text-sm font-semibold">Our Location</h3>
          <p className="mt-2">
            <strong>Located in:</strong> Sandeep Vihar
          </p>
          <p className="mt-1">
            <strong>Address:</strong> AWHO, Whitefield - Hoskote Rd, Whitefield, SV, Kannamangala, Bengaluru, Karnataka 560067
          </p>
        </div>
        
        {/* View on Map Button */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex justify-center md:justify-end"
        >
          <motion.a
            href="https://www.google.com/maps?q=AWHO,+Whitefield+-+Hoskote+Rd,+Whitefield,+SV,+Kannamangala,+Bengaluru,+Karnataka+560067"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-blue-500 font-medium py-2 px-6 rounded-full shadow-lg hover:bg-gray-100 transition"
          >
            View on Map
          </motion.a>
        </motion.div>
      </motion.div>
    </footer>
  );
}
