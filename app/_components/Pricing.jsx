"use client"

import { motion } from "framer-motion";

export default function Pricing() {
  return (
    <section id="pricing" className="py-16 px-4 bg-orange-50">
      <div className="max-w-7xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-bold text-gray-800"
        >
          Our Pricing Plans
        </motion.h2>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {/* Basic Plan */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
            className="bg-white p-8 rounded-lg shadow-xl hover:shadow-2xl"
          >
            <h3 className="text-2xl font-semibold text-gray-800">Basic Plan</h3>
            <p className="mt-4 text-gray-600">$19/month</p>
            <ul className="mt-4 text-gray-600">
              <li>Feature 1</li>
              <li>Feature 2</li>
              <li>Feature 3</li>
            </ul>
            <button className="mt-6 bg-orange-500 text-white px-6 py-2 rounded-full">Choose Plan</button>
          </motion.div>

          {/* Premium Plan */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
            className="bg-white p-8 rounded-lg shadow-xl hover:shadow-2xl"
          >
            <h3 className="text-2xl font-semibold text-gray-800">Premium Plan</h3>
            <p className="mt-4 text-gray-600">$39/month</p>
            <ul className="mt-4 text-gray-600">
              <li>Feature 1</li>
              <li>Feature 2</li>
              <li>Feature 3</li>
            </ul>
            <button className="mt-6 bg-orange-500 text-white px-6 py-2 rounded-full">Choose Plan</button>
          </motion.div>

          {/* Enterprise Plan */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
            className="bg-white p-8 rounded-lg shadow-xl hover:shadow-2xl"
          >
            <h3 className="text-2xl font-semibold text-gray-800">Enterprise Plan</h3>
            <p className="mt-4 text-gray-600">$99/month</p>
            <ul className="mt-4 text-gray-600">
              <li>Feature 1</li>
              <li>Feature 2</li>
              <li>Feature 3</li>
            </ul>
            <button className="mt-6 bg-orange-500 text-white px-6 py-2 rounded-full">Choose Plan</button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

