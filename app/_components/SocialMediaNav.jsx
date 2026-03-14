import React from 'react';
import Link from "next/link";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaThreads, FaXTwitter, FaYoutube } from "react-icons/fa6";

const SocialMediaNav = ({ theme }) => {
  const socialLinks = [
    {
      name: 'LinkedIn',
      icon: FaLinkedinIn,
      href: 'https://www.linkedin.com/company/doutya',
      color: 'hover:bg-blue-700'
    }
  ];

  return (
    <div className="hidden md:flex justify-center items-center gap-2">
      {socialLinks.map((social) => {
        const Icon = social.icon;
        return (
          <a
            key={social.name}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-6 h-6 flex items-center justify-center rounded-full border ${theme.border} md:border-2 transition-all duration-300 ${social.color} hover:border-transparent group me-2`}
            aria-label={social.name}
          >
            <Icon 
              className={`w-3 h-3 ${theme.text} group-hover:text-white transition-colors`}
            />
          </a>
        );
      })}
    </div>
  );
};

export default SocialMediaNav;