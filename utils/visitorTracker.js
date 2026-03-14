// import { v4 as uuidv4 } from 'uuid';
// import Cookies from 'js-cookie';

// export function useVisitorTracker() {
//   // Get or create UUID
//   let visitorUuid = Cookies.get('visitor_uuid');
//   if (!visitorUuid) {
//     visitorUuid = uuidv4(); // Generate a new UUID
//     Cookies.set('visitor_uuid', visitorUuid, { expires: 365 }); // Set cookie for 1 year
//   }

//   // Send UUID to backend
//   const trackVisit = async () => {
//     await fetch('/api/track-visit', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ uuid: visitorUuid }),
//     });
//   };

//   return { trackVisit };
// }

// "use client"
// import Cookies from 'js-cookie';
// import { useEffect } from 'react';
// import { v4 as uuidv4 } from 'uuid';

// export function useVisitorTracker() {
//   // Get or create UUID
//   let visitorUuid = Cookies.get('visitor_uuid');
//   if (!visitorUuid) {
//     visitorUuid = uuidv4(); // Generate a new UUID
//     Cookies.set('visitor_uuid', visitorUuid, { expires: 365 }); // Set cookie for 1 year
//   }

//   // Function to track visit
//   const trackVisit = async () => {
//     await fetch('/api/track-visit', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ uuid: visitorUuid }),
//     });
//   };

//   // Function to start a new session
//   const startSession = async () => {
//     const response = await fetch('/api/session/start-session', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ uuid: visitorUuid }),
//     });

//     if (response.ok) {
//       const { sessionId } = await response.json();
//       Cookies.set('session_id', sessionId); // Store session ID in cookies
//     }
//   };

//   // Function to end the current session
//   const endSession = async () => {
//     const sessionId = Cookies.get('session_id');
//     if (!sessionId) return;

//     console.log("cokie", sessionId);
    
//     await fetch('/api/session/end-session', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ sessionId }),
//     });

//     Cookies.remove('session_id'); // Clean up session ID
//   };

//   // Call these functions at the appropriate lifecycle events
//   useEffect(() => {
//     trackVisit(); // Log the visit
//     startSession(); // Start a new session

//     // End session on page unload
//     const handleBeforeUnload = () => {
//       endSession();
//     };

//     window.addEventListener('beforeunload', handleBeforeUnload);

//     // Cleanup event listener on component unmount
//     return () => {
//       window.removeEventListener('beforeunload', handleBeforeUnload);
//     };
//   }, []);
// }


"use client"
import Cookies from 'js-cookie';
import { useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

export function useVisitorTracker() {
  const isReloading = useRef(false);

  // Get or create UUID
  let visitorUuid = Cookies.get('visitor_uuid');
  if (!visitorUuid) {
    visitorUuid = uuidv4();
    Cookies.set('visitor_uuid', visitorUuid, { expires: 365 });
  }

  // Function to make reliable API calls using sendBeacon
  const makeReliableRequest = (url, data) => {
    const jsonData = JSON.stringify(data);
    
    if (navigator.sendBeacon) {
      return navigator.sendBeacon(url, jsonData);
    } else {
      // Fallback to fetch with keepalive
      return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonData,
        keepalive: true
      }).catch(error => {
        console.error(`Failed to send request to ${url}:`, error);
      });
    }
  };

  // Function to track visit
  const trackVisit = () => {
    return makeReliableRequest('/api/track-visit', { uuid: visitorUuid });
  };

  // Function to start a new session
  const startSession = async () => {
    try {
      const response = await fetch('/api/session/start-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uuid: visitorUuid }),
      });

      if (response.ok) {
        const { sessionId } = await response.json();
        Cookies.set('session_id', sessionId);
      }
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  // Function to end the current session
  const endSession = () => {
    const sessionId = Cookies.get('session_id');
    if (!sessionId) return;

    makeReliableRequest('/api/session/end-session', { sessionId });
    Cookies.remove('session_id');
  };

  useEffect(() => {
    // Handle page reload detection
    const handleBeforeUnload = (e) => {
      if (e.persisted || (window.performance && performance.navigation.type === 1)) {
        isReloading.current = true;
        return;
      }
      
      // Make all necessary API calls
      trackVisit();
      endSession();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && !isReloading.current) {
        trackVisit(); // Record the visit data before the user switches away
        endSession(); // End the session when the page is hidden
      } else if (document.visibilityState === 'visible' && !isReloading.current) {
        console.log("visoble");
        
        // When the page becomes visible again, start a new session or resume the existing session
        startSession();
      }
    };

    // Initial calls on mount
    const initialize = async () => {
      await trackVisit();
      await startSession();
    };

    initialize();

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
}