// utils/markerShapes.js
export const getMarkerShape = (shape, color, hasHighPriority, isRead = false) => {
  const strokeWidth = hasHighPriority ? 4 : 3;
  
  const shapes = {
    pin: {
      path: `<path 
        d="M24 22C14.06 22 6 30.06 6 40c0 9.5 18 32 18 32s18-22.5 18-32c0-9.94-8.06-18-18-18z" 
        fill="${color}"
        stroke="white"
        stroke-width="${strokeWidth}"
        filter="url(#shadow)${isRead ? ' url(#grayscale)' : ''}"
      />`,
      clipPath: `<clipPath id="pinClip"><circle cx="24" cy="40" r="12"/></clipPath>`,
      imageProps: { x: 12, y: 28, width: 24, height: 24, clipPath: "url(#pinClip)" },
      anchor: { x: 24, y: 64 }
    },
    
    circle: {
      path: `<circle 
        cx="24" 
        cy="40" 
        r="20" 
        fill="${color}"
        stroke="white"
        stroke-width="${strokeWidth}"
        filter="url(#shadow)${isRead ? ' url(#grayscale)' : ''}"
      />`,
      clipPath: `<clipPath id="circleClip"><circle cx="24" cy="40" r="14"/></clipPath>`,
      imageProps: { x: 10, y: 26, width: 28, height: 28, clipPath: "url(#circleClip)" },
      anchor: { x: 24, y: 60 }
    },
    
    square: {
      path: `<rect 
        x="4" 
        y="20" 
        width="40" 
        height="40" 
        fill="${color}"
        stroke="white"
        stroke-width="${strokeWidth}"
        filter="url(#shadow)${isRead ? ' url(#grayscale)' : ''}"
      />`,
      clipPath: `<clipPath id="squareClip"><rect x="10" y="26" width="28" height="28"/></clipPath>`,
      imageProps: { x: 10, y: 26, width: 28, height: 28, clipPath: "url(#squareClip)" },
      anchor: { x: 24, y: 60 }
    },
    
    diamond: {
      path: `<path 
        d="M24 20 L44 40 L24 60 L4 40 Z" 
        fill="${color}"
        stroke="white"
        stroke-width="${strokeWidth}"
        filter="url(#shadow)${isRead ? ' url(#grayscale)' : ''}"
      />`,
      clipPath: `<clipPath id="diamondClip"><path d="M24 28 L36 40 L24 52 L12 40 Z"/></clipPath>`,
      imageProps: { x: 12, y: 28, width: 24, height: 24, clipPath: "url(#diamondClip)" },
      anchor: { x: 24, y: 60 }
    },
    
    triangle: {
      path: `<path 
        d="M24 20 L44 60 L4 60 Z" 
        fill="${color}"
        stroke="white"
        stroke-width="${strokeWidth}"
        filter="url(#shadow)${isRead ? ' url(#grayscale)' : ''}"
      />`,
      clipPath: `<clipPath id="triangleClip"><path d="M24 32 L34 48 L14 48 Z"/></clipPath>`,
      imageProps: { x: 14, y: 32, width: 20, height: 16, clipPath: "url(#triangleClip)" },
      anchor: { x: 24, y: 60 }
    },
    
    hexagon: {
      path: `<path 
        d="M24 22 L38 30 L38 50 L24 58 L10 50 L10 30 Z" 
        fill="${color}"
        stroke="white"
        stroke-width="${strokeWidth}"
        filter="url(#shadow)${isRead ? ' url(#grayscale)' : ''}"
      />`,
      clipPath: `<clipPath id="hexagonClip"><path d="M24 30 L32 34 L32 46 L24 50 L16 46 L16 34 Z"/></clipPath>`,
      imageProps: { x: 16, y: 30, width: 16, height: 20, clipPath: "url(#hexagonClip)" },
      anchor: { x: 24, y: 58 }
    },
    
    bead: {
      path: `<ellipse 
        cx="24" 
        cy="40" 
        rx="18" 
        ry="22" 
        fill="${color}"
        stroke="white"
        stroke-width="${strokeWidth}"
        filter="url(#shadow)${isRead ? ' url(#grayscale)' : ''}"
      />`,
      clipPath: `<clipPath id="beadClip"><ellipse cx="24" cy="40" rx="12" ry="15"/></clipPath>`,
      imageProps: { x: 12, y: 25, width: 24, height: 30, clipPath: "url(#beadClip)" },
      anchor: { x: 24, y: 62 }
    },
    
    'rounded-square': {
      path: `<rect 
        x="4" 
        y="20" 
        width="40" 
        height="40" 
        rx="8" 
        ry="8" 
        fill="${color}"
        stroke="white"
        stroke-width="${strokeWidth}"
        filter="url(#shadow)${isRead ? ' url(#grayscale)' : ''}"
      />`,
      clipPath: `<clipPath id="roundedSquareClip"><rect x="10" y="26" width="28" height="28" rx="4" ry="4"/></clipPath>`,
      imageProps: { x: 10, y: 26, width: 28, height: 28, clipPath: "url(#roundedSquareClip)" },
      anchor: { x: 24, y: 60 }
    },

    rectangle: {
      path: `<rect 
        x="2" 
        y="25" 
        width="44" 
        height="30" 
        fill="${color}"
        stroke="white"
        stroke-width="${strokeWidth}"
        filter="url(#shadow)${isRead ? ' url(#grayscale)' : ''}"
      />`,
      clipPath: `<clipPath id="rectangleClip"><rect x="8" y="30" width="32" height="20"/></clipPath>`,
      imageProps: { x: 8, y: 30, width: 32, height: 20, clipPath: "url(#rectangleClip)" },
      anchor: { x: 24, y: 55 }
    },
    
    badge: {
      path: `<rect 
        x="4" 
        y="20" 
        width="40" 
        height="40" 
        rx="20" 
        ry="20" 
        fill="${color}"
        stroke="white"
        stroke-width="${strokeWidth}"
        filter="url(#shadow)${isRead ? ' url(#grayscale)' : ''}"
      />`,
      clipPath: `<clipPath id="badgeClip"><circle cx="24" cy="40" r="14"/></clipPath>`,
      imageProps: { x: 10, y: 26, width: 28, height: 28, clipPath: "url(#badgeClip)" },
      anchor: { x: 24, y: 60 }
    },
    
    tag: {
      path: `<path 
        d="M6 30 L6 50 L26 50 L42 40 L26 30 Z" 
        fill="${color}"
        stroke="white"
        stroke-width="${strokeWidth}"
        filter="url(#shadow)${isRead ? ' url(#grayscale)' : ''}"
      />
      <circle cx="16" cy="40" r="3" fill="white"/>`,
      clipPath: `<clipPath id="tagClip"><path d="M10 34 L10 46 L22 46 L30 40 L22 34 Z"/></clipPath>`,
      imageProps: { x: 10, y: 34, width: 20, height: 12, clipPath: "url(#tagClip)" },
      anchor: { x: 24, y: 50 }
    },
    
    starburst: {
      path: `<path 
        d="M24 18 L28 28 L40 28 L31 36 L35 48 L24 42 L13 48 L17 36 L8 28 L20 28 Z" 
        fill="${color}"
        stroke="white"
        stroke-width="${strokeWidth}"
        filter="url(#shadow)${isRead ? ' url(#grayscale)' : ''}"
      />`,
      clipPath: `<clipPath id="starburstClip"><path d="M24 26 L26 32 L32 32 L28 36 L30 42 L24 38 L18 42 L20 36 L16 32 L22 32 Z"/></clipPath>`,
      imageProps: { x: 16, y: 26, width: 16, height: 16, clipPath: "url(#starburstClip)" },
      anchor: { x: 24, y: 48 }
    },

    parallelogram: {
      path: `<path 
        d="M8 25 L40 25 L36 55 L4 55 Z"
        fill="\${color}"
        stroke="white"
        stroke-width="\${strokeWidth}"
        filter="url(#shadow)\${isRead ? ' url(#grayscale)' : ''}"
      />`,
      clipPath: `<clipPath id="parallelogramClip"><path d="M12 30 L36 30 L32 50 L8 50 Z"/></clipPath>`,
      imageProps: { x: 12, y: 30, width: 24, height: 20, clipPath: "url(#parallelogramClip)" },
      anchor: { x: 24, y: 55 }
    },

    pill: {
      path: `<rect 
        x="4" 
        y="28" 
        width="40" 
        height="24" 
        rx="12" 
        ry="12" 
        fill="\${color}"
        stroke="white"
        stroke-width="\${strokeWidth}"
        filter="url(#shadow)\${isRead ? ' url(#grayscale)' : ''}"
      />`,
      clipPath: `<clipPath id="pillClip"><rect x="10" y="32" width="28" height="16" rx="8" ry="8"/></clipPath>`,
      imageProps: { x: 10, y: 32, width: 28, height: 16, clipPath: "url(#pillClip)" },
      anchor: { x: 24, y: 52 }
    },

    star: {
      path: `<path 
        d="M24 16 L28 26 L39 26 L30 33 L34 44 L24 37 L14 44 L18 33 L9 26 L20 26 Z" 
        fill="${color}"
        stroke="white"
        stroke-width="${strokeWidth}"
        filter="url(#shadow)${isRead ? ' url(#grayscale)' : ''}"
      />`,
      clipPath: `<clipPath id="starClip"><path d="M24 22 L26 28 L32 28 L27 32 L29 38 L24 34 L19 38 L21 32 L16 28 L22 28 Z"/></clipPath>`,
      imageProps: { x: 16, y: 22, width: 16, height: 16, clipPath: "url(#starClip)" },
      anchor: { x: 24, y: 46 }
    },
    
    octagon: {
      path: `<path 
        d="M16 20 L32 20 L40 28 L40 44 L32 52 L16 52 L8 44 L8 28 Z" 
        fill="${color}"
        stroke="white"
        stroke-width="${strokeWidth}"
        filter="url(#shadow)${isRead ? ' url(#grayscale)' : ''}"
      />`,
      clipPath: `<clipPath id="octagonClip"><path d="M18 28 L30 28 L36 34 L36 38 L30 44 L18 44 L12 38 L12 34 Z"/></clipPath>`,
      imageProps: { x: 12, y: 28, width: 24, height: 16, clipPath: "url(#octagonClip)" },
      anchor: { x: 24, y: 52 }
    },

    filmstrip: {
      path: `<rect 
        x="4" y="20" width="40" height="40" rx="4" ry="4" 
        fill="${color}"
        stroke="white"
        stroke-width="${strokeWidth}"
        filter="url(#shadow)${isRead ? ' url(#grayscale)' : ''}"
      />
      <rect x="8" y="24" width="32" height="8" fill="white" opacity="0.2"/>
      <rect x="8" y="48" width="32" height="8" fill="white" opacity="0.2"/>`,
      clipPath: `<clipPath id="filmClip"><rect x="10" y="34" width="28" height="12"/></clipPath>`,
      imageProps: { x: 10, y: 34, width: 28, height: 12, clipPath: "url(#filmClip)" },
      anchor: { x: 24, y: 60 }
    },
    pentagon: {
      path: `<path 
        d="M24 16 L40 24 L36 44 L12 44 L8 24 Z" 
        fill="${color}"
        stroke="white"
        stroke-width="${strokeWidth}"
        filter="url(#shadow)${isRead ? ' url(#grayscale)' : ''}"
      />`,
      clipPath: `<clipPath id="pentagonClip"><path d="M24 24 L32 28 L30 40 L18 40 L16 28 Z"/></clipPath>`,
      imageProps: { x: 16, y: 24, width: 16, height: 16, clipPath: "url(#pentagonClip)" },
      anchor: { x: 24, y: 44 }
    },

    shield: {
      path: `<path 
        d="M24 18 L36 24 V36 C36 44 30 50 24 54 C18 50 12 44 12 36 V24 Z" 
        fill="${color}"
        stroke="white"
        stroke-width="${strokeWidth}"
        filter="url(#shadow)${isRead ? ' url(#grayscale)' : ''}"
      />`,
      clipPath: `<clipPath id="shieldClip"><path d="M24 22 L32 26 V36 C32 42 28 46 24 48 C20 46 16 42 16 36 V26 Z"/></clipPath>`,
      imageProps: { x: 16, y: 22, width: 16, height: 24, clipPath: "url(#shieldClip)" },
      anchor: { x: 24, y: 54 }
    },

    droplet: {
      path: `<path 
        d="M24 16 C24 16 14 30 14 40 C14 48 19 54 24 54 C29 54 34 48 34 40 C34 30 24 16 24 16 Z" 
        fill="${color}"
        stroke="white"
        stroke-width="${strokeWidth}"
        filter="url(#shadow)${isRead ? ' url(#grayscale)' : ''}"
      />`,
      clipPath: `<clipPath id="dropletClip"><path d="M24 20 C24 20 18 30 18 38 C18 44 21 48 24 48 C27 48 30 44 30 38 C30 30 24 20 24 20 Z"/></clipPath>`,
      imageProps: { x: 18, y: 20, width: 12, height: 28, clipPath: "url(#dropletClip)" },
      anchor: { x: 24, y: 54 }
    },

    /* shape for STORY */
    bookmark: {
      path: `<path 
        d="M10 18 L38 18 C40 18 42 20 42 22 L42 58 L24 46 L6 58 L6 22 C6 20 8 18 10 18 Z" 
        fill="${color}"
        stroke="white"
        stroke-width="${strokeWidth}"
        filter="url(#shadow)${isRead ? ' url(#grayscale)' : ''}"
      />`,
      clipPath: `<clipPath id="bookmarkClip"><rect x="12" y="24" width="24" height="20" rx="2" ry="2"/></clipPath>`,
      imageProps: { x: 12, y: 24, width: 24, height: 20, clipPath: "url(#bookmarkClip)" },
      anchor: { x: 24, y: 58 }
    },

    /* New Shapes  */
    scroll: {
      path: `<path 
        d="M8 24 C8 20 10 18 14 18 L34 18 C38 18 40 20 40 24 L40 48 C40 52 38 54 34 54 L14 54 C10 54 8 52 8 48 Z
        M6 26 C6 24 7 22 9 22 C11 22 12 24 12 26 L12 46 C12 48 11 50 9 50 C7 50 6 48 6 46 Z
        M36 22 C38 22 39 24 39 26 L39 46 C39 48 38 50 36 50 C34 50 33 48 33 46 L33 26 C33 24 34 22 36 22 Z" 
        fill="${color}"
        stroke="white"
        stroke-width="${strokeWidth}"
        filter="url(#shadow)${isRead ? ' url(#grayscale)' : ''}"
      />`,
      clipPath: `<clipPath id="scrollClip"><rect x="12" y="26" width="24" height="20" rx="2" ry="2"/></clipPath>`,
      imageProps: { x: 12, y: 26, width: 24, height: 20, clipPath: "url(#scrollClip)" },
      anchor: { x: 24, y: 54 }
    },
  };



  // Return the shape or fallback to pin
  return shapes[shape] || shapes.pin;
};