// "use client";
// import React, { useState, useEffect } from "react";
// import Link from "next/link";
// import Image from "next/image";
// import { cn } from "@/lib/utils";
// import { usePathname } from "next/navigation";
// import SocialMediaNav from "./SocialMediaNav";
// import FloatingBubbleNav from "./FloatingBubbleNav";
// import { Menu, Info, Mail, User, LogOut, Users, UserCircle } from 'lucide-react';

// const Navbar = () => {
//   const pathname = usePathname();
//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
//   const [currentUserId, setCurrentUserId] = useState(null);
//   const [userRole, setUserRole] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);

//   const getCurrentDate = () => {
//     const now = new Date();
//     return now.toLocaleDateString('en-US', { 
//       year: 'numeric', 
//       month: 'long', 
//       day: 'numeric' 
//     });
//   };

//   // Handle logout
//   const handleLogout = async () => {
//     try {
//       const res = await fetch("/api/auth/logout", {
//         method: "GET",
//         credentials: "include",
//       });

//       if (res.ok) {
//         // Redirect to login page
//         window.location.href = "/auth/login";
//       } else {
//         console.error("Logout failed");
//       }
//     } catch (err) {
//       console.error("Logout error:", err);
//     }
//   };

//   // Fetch user data
//   useEffect(() => {
//     const fetchUser = async () => {
//       try {
//         const res = await fetch("/api/user/me");
//         const data = await res.json();

//         if (res.ok) {
//           setCurrentUserId(data.user.id);
//           setUserRole("user");
//         }
//       } catch (err) {
//         console.error("Failed to fetch current user:", err);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchUser();
//   }, []);

//   // Enhanced theme with better styling
//   const theme = {
//     bg: 'bg-slate-900',
//     border: 'border-slate-700',
//     text: 'text-slate-200',
//     hoverText: 'text-white',
//     hoverBg: 'hover:bg-slate-800',
//     hoverBorder: 'hover:border-slate-600',
//     buttonBg: 'bg-gradient-to-r from-slate-700 to-slate-800',
//     buttonHover: 'hover:from-slate-600 hover:to-slate-700',
//     primaryButton: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600',
//     ringColor: 'ring-slate-600',
//     dropdownBg: 'bg-slate-800',
//     dropdownBorder: 'border-slate-700',
//     dateText: 'text-slate-300',
//     shadow: 'shadow-lg',
//     menuButton: 'bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-slate-500'
//   };

//   const NavDropdownAlt = () => {
//     const [isDropdownOpen, setIsDropdownOpen] = useState(false);

//     return (
//       <div className="relative">
//         <button
//           onClick={() => setIsDropdownOpen(!isDropdownOpen)}
//           className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl ${theme.menuButton} ${theme.text} ${theme.hoverText} transition-all duration-300 ${theme.shadow} hover:shadow-xl hover:scale-105 font-medium min-w-[100px]`}
//         >
//           <Menu className="w-4 h-4" />
//           <span className="hidden sm:inline">Menu</span>
//         </button>

//         {isDropdownOpen && (
//           <div className={`absolute right-0 mt-3 w-52 ${theme.dropdownBg} rounded-xl ${theme.shadow} border ${theme.dropdownBorder} py-3 z-50 transform opacity-100 scale-100 transition-all duration-200 origin-top-right backdrop-blur-sm`}>
//             <div className={`absolute right-4 -top-2 w-4 h-4 ${theme.dropdownBg} transform rotate-45 border-l border-t ${theme.dropdownBorder}`} />
            
//             <div className={`relative ${theme.dropdownBg} rounded-xl space-y-1`}>
//               <Link 
//                 href="/about-us"
//                 className={`flex items-center gap-3 px-4 py-3 ${theme.text} ${theme.hoverBg} ${theme.hoverText} transition-all duration-200 hover:pl-6 group`}
//                 onClick={() => setIsDropdownOpen(false)}
//               >
//                 <Info className="w-4 h-4 group-hover:scale-110 transition-transform" />
//                 <span className="font-medium">About Us</span>
//               </Link>
              
//               <Link 
//                 href="/contact-us"
//                 className={`flex items-center gap-3 px-4 py-3 ${theme.text} ${theme.hoverBg} ${theme.hoverText} transition-all duration-200 hover:pl-6 group`}
//                 onClick={() => setIsDropdownOpen(false)}
//               >
//                 <Mail className="w-4 h-4 group-hover:scale-110 transition-transform" />
//                 <span className="font-medium">Contact Us</span>
//               </Link>

//               {/* LinkedIn Link */}
//               <a 
//                 href="https://www.linkedin.com/company/doutya"
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className={`flex items-center gap-3 px-4 py-3 ${theme.text} ${theme.hoverBg} ${theme.hoverText} transition-all duration-200 hover:pl-6 group`}
//               >
//                 <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
//                   <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
//                 </svg>
//                 <span className="font-medium">LinkedIn</span>
//               </a>

//               {/* Logout Button - Only show if user is logged in */}
//               {!isLoading && currentUserId && (
//                 <>
//                   <div className={`border-t ${theme.border} mx-2 my-2`} />
//                   <button 
//                     onClick={handleLogout}
//                     className={`flex items-center gap-3 px-4 py-3 ${theme.text} ${theme.hoverBg} hover:text-red-400 transition-all duration-200 hover:pl-6 group w-full text-left`}
//                   >
//                     <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
//                     <span className="font-medium">Logout</span>
//                   </button>
//                 </>
//               )}
//             </div>
//           </div>
//         )}
//       </div>
//     );
//   };

//   const UserDropdown = () => {
//     const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

//     return (
//       <div className="relative">
//         <button
//           onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
//           className={`flex items-center gap-3 px-5 py-2.5 rounded-xl ${theme.primaryButton} text-white transition-all duration-300 ${theme.shadow} hover:shadow-xl hover:scale-105 font-medium min-w-[120px] justify-center`}
//         >
//           <User className="w-4 h-4" />
//           <span className="font-semibold">Account</span>
//           <svg className={`w-4 h-4 transition-transform duration-300 ${isUserDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
//           </svg>
//         </button>

//         {isUserDropdownOpen && (
//           <div className={`absolute right-0 mt-3 w-56 ${theme.dropdownBg} rounded-xl ${theme.shadow} border ${theme.dropdownBorder} py-3 z-50 transform opacity-100 scale-100 transition-all duration-200 origin-top-right backdrop-blur-sm`}>
//             <div className={`absolute right-5 -top-2 w-4 h-4 ${theme.dropdownBg} transform rotate-45 border-l border-t ${theme.dropdownBorder}`} />
            
//             <div className={`relative ${theme.dropdownBg} rounded-xl space-y-1`}>
//               {/* My Page - Only show if user is logged in and has 'page' role */}
//               {!isLoading && userRole === 'page' && currentUserId && (
//                 <Link 
//                   href={`/page/${currentUserId}`}
//                   className={`flex items-center gap-3 px-4 py-3 ${theme.text} ${theme.hoverBg} ${theme.hoverText} transition-all duration-200 hover:pl-6 group`}
//                   onClick={() => setIsUserDropdownOpen(false)}
//                 >
//                   <UserCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
//                   <span className="font-medium">My Page</span>
//                 </Link>
//               )}

//               {/* My Profile - Only show if user is logged in and has 'user' role */}
//               {!isLoading && userRole === 'user' && currentUserId && (
//                 <Link 
//                   href={`/profile/${currentUserId}`}
//                   className={`flex items-center gap-3 px-4 py-3 ${theme.text} ${theme.hoverBg} ${theme.hoverText} transition-all duration-200 hover:pl-6 group`}
//                   onClick={() => setIsUserDropdownOpen(false)}
//                 >
//                   <User className="w-4 h-4 group-hover:scale-110 transition-transform" />
//                   <span className="font-medium">My Profile</span>
//                 </Link>
//               )}
              
//               {/* My Communities - Always show */}
//               <Link 
//                 href="/communities"
//                 className={`flex items-center gap-3 px-4 py-3 ${theme.text} ${theme.hoverBg} ${theme.hoverText} transition-all duration-200 hover:pl-6 group`}
//                 onClick={() => setIsUserDropdownOpen(false)}
//               >
//                 <Users className="w-4 h-4 group-hover:scale-110 transition-transform" />
//                 <span className="font-medium">My Communities</span>
//               </Link>
//             </div>
//           </div>
//         )}
//       </div>
//     );
//   };

//   const MobileUserDropdown = () => {
//     const [isMobileUserDropdownOpen, setIsMobileUserDropdownOpen] = useState(false);

//     return (
//       <div className="relative">
//         <button
//           onClick={() => setIsMobileUserDropdownOpen(!isMobileUserDropdownOpen)}
//           className={`${theme.primaryButton} text-white p-2 rounded-lg ${theme.shadow} transition-all duration-300 hover:shadow-lg hover:scale-105 w-9 h-9 flex items-center justify-center`}
//         >
//           <User size={16} />
//         </button>

//         {isMobileUserDropdownOpen && (
//           <div className={`absolute right-0 mt-2 w-44 ${theme.dropdownBg} rounded-xl ${theme.shadow} border ${theme.dropdownBorder} py-2 z-50 transform opacity-100 scale-100 transition-all duration-200 origin-top-right backdrop-blur-sm`}>
//             <div className={`absolute right-3 -top-2 w-4 h-4 ${theme.dropdownBg} transform rotate-45 border-l border-t ${theme.dropdownBorder}`} />
            
//             <div className={`relative ${theme.dropdownBg} rounded-xl space-y-1`}>
//               {/* My Page - Only show if user is logged in and has 'page' role */}
//               {!isLoading && userRole === 'page' && currentUserId && (
//                 <Link 
//                   href={`/page/${currentUserId}`}
//                   className={`flex items-center gap-2 px-3 py-2.5 ${theme.text} ${theme.hoverBg} ${theme.hoverText} transition-all duration-200 text-sm hover:pl-4 group`}
//                   onClick={() => setIsMobileUserDropdownOpen(false)}
//                 >
//                   <UserCircle className="w-3 h-3 group-hover:scale-110 transition-transform" />
//                   <span className="font-medium">My Page</span>
//                 </Link>
//               )}

//               {/* My Profile - Only show if user is logged in and has 'user' role */}
//               {!isLoading && userRole === 'user' && currentUserId && (
//                 <Link 
//                   href={`/profile/${currentUserId}`}
//                   className={`flex items-center gap-2 px-3 py-2.5 ${theme.text} ${theme.hoverBg} ${theme.hoverText} transition-all duration-200 text-sm hover:pl-4 group`}
//                   onClick={() => setIsMobileUserDropdownOpen(false)}
//                 >
//                   <User className="w-3 h-3 group-hover:scale-110 transition-transform" />
//                   <span className="font-medium">My Profile</span>
//                 </Link>
//               )}
              
//               {/* My Communities - Always show */}
//               <Link 
//                 href="/communities"
//                 className={`flex items-center gap-2 px-3 py-2.5 ${theme.text} ${theme.hoverBg} ${theme.hoverText} transition-all duration-200 text-sm hover:pl-4 group`}
//                 onClick={() => setIsMobileUserDropdownOpen(false)}
//               >
//                 <Users className="w-3 h-3 group-hover:scale-110 transition-transform" />
//                 <span className="font-medium">Communities</span>
//               </Link>
//             </div>
//           </div>
//         )}
//       </div>
//     );
//   };

//   const getMainLogo = () => {
//     return (
//         <div className="flex flex-col items-center">
//           <div className="relative h-[7.6vh] w-[35vw] md:h-[9vh] md:w-[20vw]">
//             <Image
//               src="/images/mapogram.png"
//               fill
//               objectFit="contain"
//               alt="Doutya logo"
//               className="object-center"
//             />
//           </div>
//         </div>
//     )
//   };
    
//   return (
//     <>
//       <nav className={cn(`w-full ${theme.bg} md:min-h-16 relative border-b ${theme.border} ${theme.shadow}`)}>
//         <div className="max-w-7xl mx-auto px-4">
//           <div className="relative grid items-center w-full md:grid-cols-3 py-2">
//             {/* Left Column - Date */}
//             <div className="hidden md:flex items-center justify-start">
//               <div className={`${theme.dateText} font-medium text-sm bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700`}>
//                 {getCurrentDate()}
//               </div>
//             </div>
              
//             {/* Logo Column with Mobile Date on Left */}
//             <div className="flex items-center justify-center relative">
//               {/* Mobile Date - Left of Logo */}
//               <div className="md:hidden absolute left-0">
//                 <div className={`${theme.dateText} font-medium text-xs bg-slate-800 px-2 py-1 rounded border border-slate-700`}>
//                   {getCurrentDate()}
//                 </div>
//               </div>
              
//               <Link href="/" className="hover:scale-105 transition-transform duration-300">
//                 {getMainLogo()}
//               </Link>
              
//               {/* Mobile Menu Button - Right of Logo */}
//               <div className="md:hidden absolute right-0">
//                 <div className="flex items-center gap-2">
//                   {/* User Dropdown - Mobile */}
//                   <MobileUserDropdown />
                  
//                   <button
//                     onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
//                     className={`${theme.menuButton} text-white p-2 rounded-lg ${theme.shadow} transition-all duration-300 hover:shadow-lg hover:scale-105 w-9 h-9 flex items-center justify-center`}
//                   >
//                     <Menu size={16} />
//                   </button>
//                 </div>
//                 <FloatingBubbleNav 
//                   showMenu={isMobileMenuOpen} 
//                   setShowMenu={setIsMobileMenuOpen}
//                   theme={theme}
//                   currentUserId={currentUserId}
//                   userRole={userRole}
//                   isLoading={isLoading}
//                 />
//               </div>
//             </div>

//             {/* Navigation Column - Desktop Only */}
//             <div className="hidden md:flex justify-end items-center">
//               <div className="flex items-center gap-4">
//                 {/* User Dropdown - Desktop */}
//                 <UserDropdown />
                     
//                 <NavDropdownAlt />
//               </div>
//             </div>

//           </div>
//         </div>
//       </nav>
//     </>
//   );
// };

// export default Navbar;
