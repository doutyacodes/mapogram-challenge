import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { getIconComponent } from '@/app/api/utils/iconMapping';
import { BASE_IMG_URL } from '@/lib/map/constants';
import { getMarkerShape } from '@/app/api/utils/markerShapes';

export const createPostCategoryMarkerIcon = (categoryData, postCount = 0, post, isRead = false) => {
  const color = isRead ? '#808080' : (categoryData.color || '#6b7280');
  const markerSize = { width: 48, height: 70 };
  const hasHighPriority = postCount > 5;

  const iconSize = hasHighPriority ? 24 : 22;
  const strokeWidth = hasHighPriority ? 3 : 2.5;
  const IconComponent = getIconComponent(categoryData.icon_name);

  const iconSvg = ReactDOMServer.renderToString(
    <IconComponent color="white" size={iconSize} strokeWidth={strokeWidth} />
  );

  const displayName = post?.user_name || '';

  let shape = categoryData.shape;
  let finalColor = color;

  if (post?.status === "story") {
    shape = "bookmark";
    finalColor = "#0066FF"; // DodgerBlue shade
  }

  const shapeData = getMarkerShape(shape, finalColor, hasHighPriority, isRead);

  let nameSvg = '';
  if (displayName) {
    // More accurate text width calculation for Arial 12px font
    const maxContainerWidth = 70; // Reduced to be more conservative
    const estimatedTextWidth = displayName.length * 6.5; // More accurate for Arial 12px
    const needsScrolling = estimatedTextWidth > maxContainerWidth;
    
    if (needsScrolling) {
      const containerWidth = maxContainerWidth;
      const rectX = 24 - (containerWidth + 12) / 2;
      const rectWidth = containerWidth + 12;

      const separator = '   •   ';
      const fullText = displayName + separator;
      const singleTextWidth = fullText.length * 6.5;

      const pixelsPerSecond = 30;
      const animationDuration = singleTextWidth / pixelsPerSecond;

      nameSvg = `
        <rect x="${rectX}" y="0" width="${rectWidth}" height="20"
              rx="10" ry="10" fill="#ffffff" fill-opacity="0.95"
              stroke="#cccccc" stroke-width="1"/>

        <defs>
          <clipPath id="textClip-${displayName.replace(/[^a-zA-Z0-9]/g, '')}">
            <rect x="${rectX + 6}" y="2" width="${containerWidth}" height="16" rx="8"/>
          </clipPath>
        </defs>

        <g clip-path="url(#textClip-${displayName.replace(/[^a-zA-Z0-9]/g, '')})">
          <!-- Two copies of the text for seamless looping -->
          <g>
            <text x="0" y="14" font-family="Arial, sans-serif" font-size="12" font-weight="600" fill="#000000">
              ${fullText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}
            </text>
            <text x="${singleTextWidth}" y="14" font-family="Arial, sans-serif" font-size="12" font-weight="600" fill="#000000">
              ${fullText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}
            </text>
            <animateTransform
              attributeName="transform"
              type="translate"
              from="0,0"
              to="-${singleTextWidth},0"
              dur="${animationDuration}s"
              repeatCount="indefinite"/>
          </g>
        </g>
      `;
    } else {
      // Static text for shorter names
      const textWidth = Math.min(estimatedTextWidth, maxContainerWidth);
      const rectX = 24 - (textWidth + 12) / 2;
      const rectWidth = textWidth + 12;

      nameSvg = `
        <rect x="${rectX}" y="0" width="${rectWidth}" height="20"
              rx="10" ry="10" fill="#ffffff" fill-opacity="0.95"
              stroke="#cccccc" stroke-width="1"/>
        <text x="24" y="14" text-anchor="middle" font-family="Arial, sans-serif"
              font-size="12" font-weight="600" fill="#000000">
          ${displayName.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}
        </text>
      `;
    }
  }

  const markerSvg = `
    <svg xmlns="http://www.w3.org/2000/svg"
         viewBox="0 0 ${markerSize.width} ${markerSize.height}"
         width="${markerSize.width}" height="${markerSize.height}">
      
      <defs>
        <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.4" />
        </filter>
        ${isRead ? `
          <filter id="grayscale">
            <feColorMatrix type="saturate" values="0"/>
          </filter>
        ` : ''}
        ${shapeData.clipPath}
      </defs>
      ${nameSvg}

      ${shapeData.path}

      <g transform="translate(13, 28)">
        ${iconSvg}
      </g>

      ${postCount > 1 ? `
        <circle cx="36" cy="32" r="10" fill="${isRead ? '#cccccc' : 'white'}" stroke="#333" stroke-width="1.5"/>
        <text x="36" y="36" font-family="Arial" font-size="12" font-weight="bold"
              text-anchor="middle" fill="#333">
          ${postCount > 99 ? '99+' : postCount}
        </text>
      ` : ''}
    </svg>
  `;

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(markerSvg)}`,
    scaledSize: markerSize,
    anchor: shapeData.anchor,
    labelOrigin: { x: 24, y: 24 }
  };
};

export const groupPostsByLocation = (postsItems) => {
  const groupedPosts = {};
  postsItems.forEach(post => {
    const locationKey = `${post.latitude},${post.longitude}`;
    if (!groupedPosts[locationKey]) {
      groupedPosts[locationKey] = [];
    }
    groupedPosts[locationKey].push(post);
  });

  Object.keys(groupedPosts).forEach(key => {
    groupedPosts[key].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  });

  return groupedPosts;
};

export const groupRegistrationsByLocation = (registrations) => {
  const grouped = {};
  registrations.forEach(registration => {
    const key = `${registration.user_latitude},${registration.user_longitude}`;
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(registration);
  });
  return grouped;
};