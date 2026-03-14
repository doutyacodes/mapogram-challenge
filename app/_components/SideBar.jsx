"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FaSearch,
  FaBook,
  FaTasks,
  FaUserFriends,
  FaMedal,
  FaHistory,
  FaUser,
  FaCog,
  FaSignOutAlt,
  FaInfoCircle,
  FaStar,
  FaBuilding,
  FaNewspaper,
  FaHome,
  FaTrophy,
  FaBox,
  FaGift,
} from "react-icons/fa";
import Image from "next/image";
import { ChevronRight, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import useAuth from "../hooks/useAuth";
import { hp } from "@/utils/encryption";
import { IoGlobeSharp } from "react-icons/io5";
import { GiBriefcase, GiPerspectiveDiceFive } from "react-icons/gi";
import { IoIosTrophy } from "react-icons/io";
import { FaPeopleGroup } from "react-icons/fa6";

const SideBar = () => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const pathname = usePathname();
  const { isAuthenticated, loading, logout } = useAuth();

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleItemClick = () => {
    setIsCollapsed(true);
  };

  // const navLinks = [
  //   { label: "Home", links: "/", icon: FaHome },
  //   // { label: "Search", links: "/search", icon: FaSearch },
  //   { label: "News", links: "/news-kids", icon: FaNewspaper },
  //   // { label: "Learn", links: "/learn", icon: FaBook },
  //   // { label: "Tests", links: "/tests", icon: FaTasks },
  //   // { label: "Activities", links: "/activities", icon: FaTasks },
  //   // { label: "Communities", links: "/communities", icon: FaUserFriends },
  //   { label: "Our Story", links: "/our-story", icon: FaInfoCircle },
  //   // { label: "Our Features", links: "/our-features", icon: FaStar },
  //   // { label: "About Us", links: "/about-us", icon: FaBuilding },
  //   // { label: "Challenges", links: "/challenges", icon: FaTrophy },
  // ];
  const navLinks = [
    { label: "News", icon: GiPerspectiveDiceFive, links: "/news" },
    // { label: "News", icon: IoGlobeSharp, links: "/news-kids" },
    // { label: "Careers", icon: GiBriefcase, links: "/tests" },
    { label: "Magic Box", links: "/search", icon: FaGift  },
    { label: "Kids News", icon: FaNewspaper, links: "/news-kids" },

    // { label: "Challenges", icon: IoIosTrophy, links: "/challenges" },
    // { label: "Community", icon: FaPeopleGroup, links: "/communities" },
    { label: "Our Story", links: "/our-story", icon: FaInfoCircle },
  ];
  return (
    <>
      {/* <div
        onClick={toggleCollapse}
        className={cn(
          "",
          isCollapsed
            ? "block absolute top-8 left-3 z-[999999999] md:hidden"
            : "hidden"
        )}
      >
        <Menu size={hp(3.9)} />
      </div> */}
      {!isCollapsed && (
        <div
          onClick={toggleCollapse}
          className="fixed inset-0 bg-black bg-opacity-50 z-[9998] md:hidden"
        />
      )}
      <motion.div
        animate={{ width: isCollapsed ? "6rem" : "6rem" }}
        className={cn(
          "min-h-screen shadow-lg bg-[#ffffff] relative max-md:fixed z-[9999999] flex flex-col p-3 rounded-md lg:block ",
          isCollapsed ? "hidden" : "flex"
        )}
        initial={{ width: "6rem" }}
      >
        {/* Sidebar Header */}
        {/* <div
          className="flex items-center justify-between rounded-full bg-orange-500 w-fit absolute -right-2 top-5 z-[99999999]"
          onClick={toggleCollapse}
        >
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: isCollapsed ? 0 : 180 }}

            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="text-2xl font-bold text-white"
          >
            <ChevronRight />
          </motion.div>
        </div> */}

        {/* Navigation Links */}
        <nav className={cn("flex-1 mt-20 space-y-4")}>
          {navLinks.map(({ label, icon: Icon, links }, idx) => {
            const isActive =
              pathname.includes(links); // Partial match for other links
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
                onClick={handleItemClick} // Collapse sidebar when item is clicked
              >
                <Link
                  href={links || "/"}
                  className={cn(
                    "flex items-center p-2 hover:bg-blue-100 rounded-lg cursor-pointer",
                    isCollapsed
                      ? "flex-col justify-center gap-2"
                      : "flex-col justify-center gap-2"
                  )}
                >
                  <Icon
                    size={24}
                    className={
                      isActive || (label == "Home" && pathname.includes("news"))
                        ? "text-red-500"
                        : "text-black"
                    }
                  />
                  <span
                    className={`${
                      isCollapsed
                        ? "text-[10px] text-nowrap"
                        : "text-[10px] text-nowrap"
                    } transition-all duration-300 ${
                      isActive ? "text-red-500" : ""
                    }`}
                  >
                    {label}
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </nav>
      </motion.div>
    </>
  );
};

export default SideBar;
