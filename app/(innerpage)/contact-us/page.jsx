import React from 'react';
import { Mail, Phone, MapPin, ExternalLink } from 'lucide-react';

const ContactPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
      <div className="container mx-auto py-16 px-4">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-red-800 mb-6">Contact Us</h1>
          <div className="w-24 h-1 bg-red-800 mx-auto mb-8"></div>
        </div>

        {/* Contact Card */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            {/* Company Name */}
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-red-800 mb-2">News on Map</h2>
              <p className="text-gray-600 text-lg">(Doutya News Platform)</p>
            </div>

            {/* Contact Grid */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Address Section */}
              <div className="space-y-6">
                <div className="flex items-start justify-center md:justify-start space-x-4">
                  <MapPin className="w-6 h-6 text-red-800 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Address</h3>
                    <p className="text-gray-600 leading-relaxed">
                      Whitefield, Bengaluru,<br />
                      Karnataka, India - 560067
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-6">
                <div className="flex items-center justify-center md:justify-start space-x-4 pe-14 md:p-0">
                  <Phone className="w-6 h-6 text-red-800 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Phone</h3>
                    <a href="tel:+919633738938" className="text-red-800 hover:text-red-900 transition-colors">
                      +91 - 9633738938
                    </a>
                  </div>
                </div>

                <div className="flex items-center justify-center md:justify-start space-x-4">
                  <Mail className="w-6 h-6 text-red-800 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Email</h3>
                    <a href="mailto:contact@doutya.com" className="text-red-800 hover:text-red-900 transition-colors">
                      contact@doutya.com
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Get In Touch Button */}
            <div className="mt-12 text-center">
              <a 
                href="mailto:contact@doutya.com" 
                className="group inline-flex items-center bg-red-800 hover:bg-red-900 text-white px-8 py-4 rounded-full text-lg font-semibold transition-colors duration-300"
              >
                Get In Touch
                <ExternalLink className="ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
