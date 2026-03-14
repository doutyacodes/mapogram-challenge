import ReactDOMServer from "react-dom/server";
import { Briefcase, FileText, MapPin, Newspaper, Heart } from "lucide-react"; // Added Heart icon

// Define type configurations
const TYPE_CONFIGS = {
  page: {
    color: "#2563EB",
    icon: FileText,
    shape: "marker"
  },
  job: {
    color: "#059669", 
    icon: Briefcase,
    shape: "square"
  },
  news: {
    color: "#9333EA",
    icon: Newspaper,
    shape: "marker"
  },
  event: {
    color: "#DC2626",
    icon: MapPin,
    shape: "marker"
  },
  myfriends: {
    color: "#F59E0B", // Warm amber color
    icon: Heart,
    shape: "circle" // Simple circle shape
  }
};

export const createClusterRenderer = (
  mapRef, 
  readPostIds, 
  groupedPosts, 
  options = {}
) => {
  // Extract options with defaults
  const {
    type = "page",
    customColor = null,
    customIcon = null,
    customShape = null
  } = options;

  // Get configuration for the type
  const typeConfig = TYPE_CONFIGS[type] || TYPE_CONFIGS.page;
  
  // Use custom values if provided, otherwise use type config
  const finalColor = customColor || typeConfig.color;
  const FinalIcon = customIcon || typeConfig.icon;
  const finalShape = customShape || typeConfig.shape;

  return {
    render: ({ count, position, markers }) => {
      const currentZoom = mapRef ? mapRef.getZoom() : 5;

      let baseSize, iconSize, fontSize, badgeRadius, strokeWidth;

      if (currentZoom <= 3) {
        baseSize = { width: 36, height: 42 };
        iconSize = 16;
        fontSize = "8";
        badgeRadius = 8;
        strokeWidth = 2;
      } else if (currentZoom <= 6) {
        baseSize = { width: 44, height: 52 };
        iconSize = 20;
        fontSize = "9";
        badgeRadius = 10;
        strokeWidth = 2.5;
      } else {
        baseSize = { width: 56, height: 66 };
        iconSize = 26;
        fontSize = "11";
        badgeRadius = 12;
        strokeWidth = 3;
      }

      // For square shape, make width and height equal and adjust size
      if (finalShape === "square") {
        const maxDimension = Math.max(baseSize.width, baseSize.height) * 0.8;
        baseSize = { width: maxDimension, height: maxDimension };
      }
      
      // For circle shape, make it perfectly round
      if (finalShape === "circle") {
        const diameter = Math.max(baseSize.width, baseSize.height) * 0.9;
        baseSize = { width: diameter, height: diameter };
      }

      // Check if all markers in cluster are read (grayscale)
      let allMarkersRead = true;
      if (markers && markers.length > 0) {
        const clusterLocationKeys = [];
        markers.forEach(marker => {
          const pos = marker.getPosition();
          const locationKey = `${pos.lat()},${pos.lng()}`;
          clusterLocationKeys.push(locationKey);
        });
        
        for (const locationKey of clusterLocationKeys) {
          const postAtLocation = groupedPosts[locationKey];
          if (postAtLocation) {
            const hasUnreadPosts = postAtLocation.some(news => !readPostIds.includes(news.id));
            if (hasUnreadPosts) {
              allMarkersRead = false;
              break;
            }
          }
        }
      }

      const clusterFinalColor = allMarkersRead ? '#6B7280' : finalColor;
      const opacity = 1;

      const iconSvg = ReactDOMServer.renderToString(
        <FinalIcon color="white" size={iconSize} strokeWidth={strokeWidth} />
      );

      const shadowId = `cluster-shadow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const grayscaleId = `grayscale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const getShapePath = () => {
        if (finalShape === "square") {
          const cornerRadius = 4;
          return `
            <rect 
              x="4" 
              y="20" 
              width="${baseSize.width - 8}" 
              height="${baseSize.height - 8}"
              rx="${cornerRadius}"
              ry="${cornerRadius}"
              fill="${clusterFinalColor}"
              stroke="white"
              stroke-width="${strokeWidth}"
              filter="url(#${shadowId}) ${allMarkersRead ? `url(#${grayscaleId})` : ''}"
              opacity="${opacity}"
            />
          `;
        } else if (finalShape === "circle") {
          const radius = baseSize.width / 2 - 4;
          const cx = baseSize.width / 2;
          const cy = baseSize.height / 2 + 4; // Moved up to prevent bottom cutoff
          
          return `
            <circle 
              cx="${cx}" 
              cy="${cy}" 
              r="${radius}"
              fill="${clusterFinalColor}"
              stroke="white"
              stroke-width="${strokeWidth}"
              filter="url(#${shadowId}) ${allMarkersRead ? `url(#${grayscaleId})` : ''}"
              opacity="${opacity}"
            />
          `;
        } else {
          // Default marker shape
          return `
            <path 
              d="
                M ${baseSize.width / 2},4
                C ${baseSize.width * 0.9},4 ${baseSize.width * 0.95},${baseSize.height * 0.5} ${baseSize.width / 2},${baseSize.height - 2}
                C ${baseSize.width * 0.05},${baseSize.height * 0.5} ${baseSize.width * 0.1},4 ${baseSize.width / 2},4
                Z
              "
              fill="${clusterFinalColor}"
              stroke="white"
              stroke-width="${strokeWidth}"
              filter="url(#${shadowId}) ${allMarkersRead ? `url(#${grayscaleId})` : ''}"
              opacity="${opacity}"
            />
          `;
        }
      };

      const getIconPosition = () => {
        if (finalShape === "square") {
          return `translate(${baseSize.width/2 - iconSize/2}, ${baseSize.height/2 - iconSize/2 + 16})`;
        } else if (finalShape === "circle") {
          return `translate(${baseSize.width/2 - iconSize/2}, ${baseSize.height/2 - iconSize/2 + 4})`;
        } else {
          return `translate(${baseSize.width/2 - iconSize/2}, ${baseSize.height * 0.2})`;
        }
      };

      const getBadgePosition = () => {
        if (finalShape === "square") {
          return {
            cx: baseSize.width - (badgeRadius/2) + 4,
            cy: 20 + (badgeRadius/2)
          };
        } else if (finalShape === "circle") {
          return {
            cx: baseSize.width - (badgeRadius/2) + 4,
            cy: 4 + (badgeRadius/2) // Adjusted for new circle position
          };
        } else {
          return {
            cx: baseSize.width - (badgeRadius + 2),
            cy: badgeRadius + 2
          };
        }
      };

      const badgePos = getBadgePosition();

      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${baseSize.width + 8} ${baseSize.height + 8}" width="${baseSize.width + 8}" height="${baseSize.height + 8}">
          <defs>
            <filter id="${shadowId}" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="3" stdDeviation="3" flood-opacity="0.4" />
            </filter>
            ${allMarkersRead ? `
            <filter id="${grayscaleId}">
              <feColorMatrix type="saturate" values="0"/>
            </filter>
            ` : ''}
          </defs>
          
          ${getShapePath()}
          
          <g transform="${getIconPosition()}" 
            ${allMarkersRead ? `filter="url(#${grayscaleId})"` : ''} 
            opacity="${opacity}">
            ${iconSvg}
          </g>
          
          <circle 
            cx="${badgePos.cx}" 
            cy="${badgePos.cy}" 
            r="${badgeRadius}" 
            fill="${allMarkersRead ? '#9CA3AF' : '#EF4444'}" 
            stroke="white" 
            stroke-width="2" 
            opacity="${opacity}"
          />
          <text 
            x="${badgePos.cx}" 
            y="${badgePos.cy + parseInt(fontSize)/3}" 
            font-family="Arial, sans-serif" 
            font-size="${fontSize}" 
            font-weight="bold" 
            text-anchor="middle" 
            fill="white"
            opacity="${opacity}"
          >${count}</text>
        </svg>
      `;
      
      const getAnchorPoint = () => {
        if (finalShape === "square") {
          return new google.maps.Point((baseSize.width + 8)/2, (baseSize.height + 8)/2 + 10);
        } else if (finalShape === "circle") {
          return new google.maps.Point((baseSize.width + 8)/2, (baseSize.height + 8)/2 + 10);
        } else {
          return new google.maps.Point(baseSize.width/2, baseSize.height - 4);
        }
      };
      
      return new google.maps.Marker({
        position,
        icon: {
          url: `data:image/svg+xml,${encodeURIComponent(svg)}`,
          scaledSize: new google.maps.Size(baseSize.width + 8, baseSize.height + 8),
          anchor: getAnchorPoint(),
        },
        zIndex: allMarkersRead ? 5000 : 10000,
      });
    }
  };
};
// Usage examples:
/*
// For page
const pageRenderer = createClusterRenderer(mapRef, readPostIds, groupedPosts, {
  type: "page"
});

// For job layer
const jobRenderer = createClusterRenderer(mapRef, readPostIds, groupedPosts, {
  type: "job"
});

// For news layer
const newsRenderer = createClusterRenderer(mapRef, readPostIds, groupedPosts, {
  type: "news"
});

// Custom configuration (override defaults)
const customRenderer = createClusterRenderer(mapRef, readPostIds, groupedPosts, {
  type: "job",
  customColor: "#FF5733",
  customIcon: SomeOtherIcon,
  customShape: "marker"
});
*/