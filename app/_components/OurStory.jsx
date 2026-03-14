"use client"
import { motion } from 'framer-motion'
import React from 'react'

const OurStory = () => {
  return (
    <section id="our-story" className="mt-10 p-8">
        <motion.h1
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-3xl font-bold text-center mb-8 mt-14 "
        >
          Our Story
        </motion.h1>

        <div className="text-sm text-justify mx-auto max-w-5xl  leading-relaxed space-y-6">
          {/* First Paragraph */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeInOut", delay: 0.3 }}
          >
            Doutya was born from a father’s journey to make learning
            magical for his child. Our founder, like many parents, faced the
            daily challenge of explaining complex ideas in a way his 3-year-old
            could understand. Whether it was about stars, animals, or even
            simple science, he constantly found himself reaching for ways to
            make these ideas exciting, fun, and understandable. Bedtime was
            another adventure—no matter how many stories he told, he was always
            running out!
          </motion.div>

          {/* Second Paragraph */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeInOut", delay: 0.6 }}
          >
            With these challenges in mind, Doutya came to life. We set out
            to create a space where parents can effortlessly bring the world’s
            wonders into a child’s hands. Doutya is designed for children
            aged 2-12, making learning feel like play through age-appropriate
            stories, bedtime tales, and interactive poems on any topic. By
            simply typing in a topic, parents can unlock stories that engage
            their child’s imagination, simplify complex ideas, and turn learning
            into a joyful experience.
          </motion.div>

          {/* Third Paragraph */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeInOut", delay: 0.9 }}
          >
            At Doutya, we believe learning should be as unique as every
            child. Inspired by a father’s wish to explain the world to his
            child, we’ve created a platform that lets every family explore new
            worlds, one story at a time.
          </motion.div>
        </div>
      </section>
  )
}

export default OurStory