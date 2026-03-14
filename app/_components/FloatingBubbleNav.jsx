// import React, { useState } from 'react';
// import Link from "next/link";
// import { FaFacebookF, FaInstagram, FaLinkedinIn, FaThreads, FaXTwitter, FaYoutube } from "react-icons/fa6";
// import { Menu, X, BookOpen, PhoneCall, PenLine, Newspaper } from 'lucide-react';

// function FloatingBubbleNav({ showMenu, setShowMenu, theme }) {
//     // Keep local state for backward compatibility
//     const [isLocalMenuOpen, setIsLocalMenuOpen] = useState(false);
    
//     // Use either props or local state
//     const isMobileMenuOpen = showMenu !== undefined ? showMenu : isLocalMenuOpen;
//     const setIsMobileMenuOpen = setShowMenu || setIsLocalMenuOpen;

//     const socialLinks = [
//         {
//             name: 'LinkedIn',
//             icon: FaLinkedinIn,
//             href: 'https://www.linkedin.com/company/doutya',
//             color: 'hover:bg-blue-600'
//         }
//     ];

//     const navLinks = [
//         { 
//           name: 'About Us', 
//           href: '/about-us',
//           icon: BookOpen,
//         },
//         { 
//           name: 'Contact', 
//           href: '/contact-us',
//           icon: PhoneCall,
//         },
//     ];

//     // Only show the floating button if not controlled by parent
//     const showFloatingButton = showMenu === undefined;

//     // Use theme colors or fallback to default
//     const buttonBg = theme?.buttonBg || 'bg-slate-700';
//     const buttonHover = theme?.buttonHover || 'hover:bg-slate-600';

//     return (
//         <>
//             {/* Overlay */}
//             <div 
//                 className={`md:hidden absolute inset-0 bg-black/50 transition-opacity duration-300 z-40 ${
//                     isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
//                 }`}
//                 onClick={() => setIsMobileMenuOpen(false)}
//             />

//             {/* Only show the floating button if not controlled by Navbar */}
//             {showFloatingButton && (
//                 <div className="md:hidden fixed bottom-4 right-4 z-50">
//                     <button
//                         onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
//                         className={`${buttonBg} text-white p-2 rounded-full shadow-lg ${buttonHover} transition-colors duration-200 w-10 h-10 flex items-center justify-center`}
//                     >
//                         {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
//                     </button>
//                 </div>
//             )}

//             {/* Social Media Links - Now displays from top when menu opens */}
//             <div className={`md:hidden fixed top-16 right-3 flex flex-col gap-3 transition-all duration-300 z-50 ${
//                 isMobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
//             }`}>
//                 {socialLinks.map((social, index) => (
//                     <Link
//                         key={social.name}
//                         href={social.href}
//                         target="_blank"
//                         rel="noopener noreferrer"
//                         className={`${social.color} bg-white/90 hover:text-white text-slate-700 p-2 rounded-full shadow-md transition-all duration-200 w-10 h-10 flex items-center justify-center hover:scale-110`}
//                         style={{
//                             transitionDelay: `${index * 50}ms`
//                         }}
//                     >
//                         <social.icon size={16} />
//                     </Link>
//                 ))}
//                 {navLinks.map((link, index) => (
//                     <Link
//                         key={link.name}
//                         href={link.href}
//                         onClick={()=>setIsMobileMenuOpen(false)}
//                         className={`${buttonBg} text-white p-2 rounded-full shadow-md ${buttonHover} transition-transform duration-200 w-10 h-10 flex items-center justify-center group relative`}
//                         style={{
//                             transitionDelay: `${(index + socialLinks.length) * 50}ms`,
//                         }}
//                     >
//                         <link.icon size={20} />
//                         <span className="absolute -top-2 right-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
//                             {link.name}
//                         </span>
//                     </Link>
//                 ))}
//             </div>
//         </>
//     );
// }

// export default FloatingBubbleNav;

import React, { useState } from 'react';
import Link from "next/link";
import { Menu, X, BookOpen, PhoneCall, User } from 'lucide-react';

function FloatingBubbleNav({ showMenu, setShowMenu, theme, currentUserId, userRole, isLoading }) {
    // Keep local state for backward compatibility
    const [isLocalMenuOpen, setIsLocalMenuOpen] = useState(false);
    
    // Use either props or local state
    const isMobileMenuOpen = showMenu !== undefined ? showMenu : isLocalMenuOpen;
    const setIsMobileMenuOpen = setShowMenu || setIsLocalMenuOpen;

    const navLinks = [
        { 
          name: 'About Us', 
          href: '/about-us',
          icon: BookOpen,
        },
        { 
          name: 'Contact', 
          href: '/contact-us',
          icon: PhoneCall,
        },
        {
          name: 'LinkedIn',
          href: 'https://www.linkedin.com/company/doutya',
          icon: () => (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          ),
          external: true,
        },
    ];

    // Only show the floating button if not controlled by parent
    const showFloatingButton = showMenu === undefined;

    // Use theme colors or fallback to default
    const buttonBg = theme?.buttonBg || 'bg-gray-600';
    const buttonHover = theme?.buttonHover || 'hover:bg-gray-700';

    return (
        <>
            {/* Overlay */}
            <div 
                className={`md:hidden fixed inset-0 bg-black/50 transition-opacity duration-300 z-40 ${
                    isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Only show the floating button if not controlled by Navbar */}
            {showFloatingButton && (
                <div className="md:hidden fixed bottom-4 right-4 z-50">
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className={`${buttonBg} text-white p-2 rounded-full shadow-lg ${buttonHover} transition-colors duration-200 w-10 h-10 flex items-center justify-center`}
                    >
                        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            )}

            {/* Navigation Links - Now displays from top when menu opens */}
            <div className={`md:hidden fixed top-16 right-3 flex flex-col gap-3 transition-all duration-300 z-50 ${
                isMobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
            }`}>
                {navLinks.map((link, index) => {
                    const LinkComponent = link.external ? 'a' : Link;
                    const linkProps = link.external 
                        ? { 
                            href: link.href, 
                            target: "_blank", 
                            rel: "noopener noreferrer" 
                          }
                        : { 
                            href: link.href, 
                            onClick: () => setIsMobileMenuOpen(false) 
                          };

                    return (
                        <LinkComponent
                            key={link.name}
                            {...linkProps}
                            className={`${buttonBg} text-white p-2 rounded-full shadow-md ${buttonHover} transition-all duration-200 w-10 h-10 flex items-center justify-center group relative hover:scale-105`}
                            style={{
                                transitionDelay: `${index * 50}ms`,
                            }}
                        >
                            <link.icon size={20} />
                            <span className="absolute -left-2 top-1/2 -translate-y-1/2 -translate-x-full bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                                {link.name}
                            </span>
                        </LinkComponent>
                    );
                })}
            </div>
        </>
    );
}

export default FloatingBubbleNav;