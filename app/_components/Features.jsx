"use client";

import { motion } from "framer-motion";
import { useState } from "react";

export default function Features() {
  const features = [
    {
      title: "Age-Appropriate Story & Content Generator",
      description:
        "Engaging Content on Any Topic: Instantly transform any topic parents input into captivating Stories, Explanations, Podcasts, and Poems tailored to the child’s age and learning stage. This feature sparks curiosity and makes complex subjects fun and accessible.",
      iconPath: "M19 11l-7-7-7 7",
    },
    {
      title: "Tailored Learning Experiences",
      description:
        "Content Aligned to Learning Style and Personality: Based on each child’s unique personality and learning preferences, Doutya customizes content and instructional methods to match how they naturally grasp new information, fostering curiosity and making learning feel intuitive and enjoyable.",
      iconPath: "M19 11l-7-7-7 7",
    },
    {
      title: "Weekly Knowledge Evaluation",
      description:
        "Targeted Knowledge Assessments: Age-specific, multiple-choice quizzes across various subjects provide parents with insights into their child’s current knowledge level and cognitive development, allowing them to track progress easily.",
      iconPath: "M19 11l-7-7-7 7",
    },
    {
      title: "Personalized Career Suggestions (Ages 6+)",
      description:
        "Early Career Exploration: Doutya’s assessments analyze personality traits and interests, guiding children toward career paths aligned with their natural strengths.",
      iconPath: "M19 11l-7-7-7 7",
    },
    {
      title: "Strength & Skill Assessment",
      description:
        "Comprehensive Skill Insights: In-depth assessments identify the child’s unique strengths, growth areas, and preferred learning styles, giving parents a full picture of their child’s abilities.",
      iconPath: "M19 11l-7-7-7 7",
    },
    {
      title: "Interactive Activities & Challenges",
      description:
        "Hands-On, Offline Engagement: Doutya promotes real-world exploration with weekly activities and challenges that kids can complete offline, with progress easily verified via photo or video submissions. This hands-on approach reinforces learning through play and practice.",
      iconPath: "M19 11l-7-7-7 7",
    },
    {
      title: "Child-Friendly Community & Progress Sharing",
      description:
        "Safe, Supportive Social Spaces: A moderated, family-friendly community where parents can share their child’s milestones, completed challenges, and achievements, fostering a supportive network among parents and families.",
      iconPath: "M19 11l-7-7-7 7",
    },
    {
      title: "Detailed Progress Reports for Parents",
      description:
        "Monthly Insights into Learning Journey: Receive comprehensive monthly reports detailing learning milestones, skill progress, and areas to focus on, giving parents a holistic view of their child’s development and achievements.",
      iconPath: "M19 11l-7-7-7 7",
    },
    {
      title: "Parent Resources & Support",
      description:
        "Guides & Tips for At-Home Support: Regularly updated tips, guides, and articles offer parents strategies to simplify complex topics, nurture a love of learning, and provide developmental support at home.",
      iconPath: "M19 11l-7-7-7 7",
    },
    {
      title: "Customizable Learning Paths",
      description:
        "Personalized Growth Plans: Tailored learning paths are crafted based on assessment results and observed progress, nurturing the child’s interests and strengths for a deeper, more enjoyable learning experience.",
      iconPath: "M19 11l-7-7-7 7",
    },
    {
      title: "Rewards & Achievement System",
      description:
        "Badges and Digital Rewards: Children earn badges and points for completing challenges and reaching milestones, which can be redeemed for exclusive content or activities that motivate continued learning.",
      iconPath: "M19 11l-7-7-7 7",
    },
    {
      title: "Customer Support & Assistance",
      description:
        "Live Chat for Parents: Dedicated support for parents to ask questions, receive guidance, and resolve any issues.",
      iconPath: "M19 11l-7-7-7 7",
    },
    {
      title: "Data Privacy & Safety Features",
      description:
        "COPPA-Compliant Design: Doutya follows strict privacy regulations, including COPPA, to protect children’s data, ensuring a secure and private learning environment.",
      iconPath: "M19 11l-7-7-7 7",
    },
  ];

  const [collapsedStates, setCollapsedStates] = useState(
    features.map(() => true) // All features initially collapsed
  );

  const toggleCollapse = (index) => {
    setCollapsedStates((prevStates) =>
      prevStates.map((state, i) => (i === index ? !state : state))
    );
  };

  return (
    <section id="features" className="py-10 px-4">
      <div className="max-w-7xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-2xl font-bold text-gray-800"
        >
          Doutya Website Features
        </motion.h2>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: index * 0.1,
              }}
              className="bg-orange-100 p-6 rounded-lg shadow-lg transform hover:scale-105 transition-transform cursor-pointer"
              onClick={() => toggleCollapse(index)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 text-orange-500 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-label={feature.title}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d={feature.iconPath}
                />
              </svg>
              <h3 className="text-lg font-semibold mt-4 text-gray-800">
                {feature.title}
              </h3>
              {/* Show description based on collapse state */}
              {!collapsedStates[index] && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.3 }}
                  className="mt-2 text-gray-600 text-sm"
                >
                  {feature.description}
                </motion.p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
