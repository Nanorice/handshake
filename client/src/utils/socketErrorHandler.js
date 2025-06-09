/**
 * This utility prevents the HMR WebSocket errors from affecting our application
 * by intercepting unhandled WebSocket connection errors
 */

// Store the last scroll position when a page refresh is detected
let lastScrollPositions = {};

// Original WebSocket class
const OriginalWebSocket = window.WebSocket;

// Better detection for HMR-specific WebSockets
const isHmrSocket = (url) => {
  return (
    url.includes('localhost:3000/ws') || 
    url.includes('localhost:3001/ws') ||
    url.includes('localhost:') && (url.includes('/sockjs-node') || url.includes('/__webpack_hmr'))
  );
};

// Override the WebSocket constructor to add error handling
window.WebSocket = function(url, protocols) {
  // Create the WebSocket instance
  const ws = new OriginalWebSocket(url, protocols);
  
  // Add connection tracking to prevent refresh cycles
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;
  
  // Only add special handling for development server WebSockets (HMR)
  if (isHmrSocket(url)) {
    console.log('Adding error handler to development WebSocket:', url);
    
    // Force disable automatic page reload for HMR failures
    if (typeof module !== 'undefined' && module.hot) {
      module.hot.accept();
    }
    
    // Add an error handler that prevents errors from bubbling up
    ws.addEventListener('error', (error) => {
      console.warn('Development WebSocket error caught:', error);
      // Prevent the error from causing app refresh
      if (error.preventDefault) {
        error.preventDefault();
      }
      if (error.stopPropagation) {
        error.stopPropagation();
      }
      
      // Track reconnect attempts to prevent refresh loops
      reconnectAttempts++;
      if (reconnectAttempts > maxReconnectAttempts) {
        console.warn(`Maximum reconnect attempts (${maxReconnectAttempts}) reached for ${url}`);
        // Don't allow any more reconnects that might trigger refreshes
        return false;
      }
      
      // Store scroll positions in case a refresh happens anyway
      storeScrollPositions();
      
      // Return true to indicate the error was handled
      return true;
    });
    
    // Handle close events that might trigger refreshes
    ws.addEventListener('close', (event) => {
      console.log(`Development WebSocket closed: ${url}`, event);
      
      // Store scroll positions before potential refresh
      storeScrollPositions();
      
      // Prevent refresh cycles
      if (reconnectAttempts > maxReconnectAttempts) {
        console.warn('Preventing WebSocket reconnection to avoid refresh cycle');
        if (event.preventDefault) {
          event.preventDefault();
        }
        if (event.stopPropagation) {
          event.stopPropagation();
        }
        return false;
      }
      
      return true;
    });
  }
  
  return ws;
};

// Restore original WebSocket properties
window.WebSocket.prototype = OriginalWebSocket.prototype;
window.WebSocket.CONNECTING = OriginalWebSocket.CONNECTING;
window.WebSocket.OPEN = OriginalWebSocket.OPEN;
window.WebSocket.CLOSING = OriginalWebSocket.CLOSING;
window.WebSocket.CLOSED = OriginalWebSocket.CLOSED;

// Store scroll positions of key elements
function storeScrollPositions() {
  // Store scroll position of main chat containers - more specific selectors
  const messageContainers = document.querySelectorAll(
    // Message containers
    '[class*="message-container"], [class*="messageContainer"], [id*="message-container"], [id*="messageContainer"],' +
    // Thread containers
    '[class*="thread-container"], [class*="threadContainer"], [id*="thread-container"], [id*="threadContainer"],' +
    // General message areas
    '[class*="message-area"], [class*="messageArea"], [id*="message-area"], [id*="messageArea"],' +
    // Any element with a data-message-container attribute
    '[data-message-container="true"], [data-thread-id]'
  );
  
  // Log what we found for debugging
  console.log(`Found ${messageContainers.length} message containers to preserve scroll position`);
  
  messageContainers.forEach((container, index) => {
    if (container && container.scrollTop) {
      // Use ID if available, otherwise create a stable identifier based on classes
      const id = container.id || `msg-container-${Array.from(container.classList).join('-')}-${index}`;
      const threadId = container.getAttribute('data-thread-id') || 'default';
      const key = `${id}-${threadId}`;
      
      lastScrollPositions[key] = container.scrollTop;
      console.log(`Stored scroll position for ${key}: ${container.scrollTop}px`);
    }
  });
  
  // Store window scroll position
  lastScrollPositions.window = {
    x: window.scrollX,
    y: window.scrollY
  };
  
  // Save to sessionStorage for persistence across refreshes
  try {
    sessionStorage.setItem('scrollPositions', JSON.stringify(lastScrollPositions));
  } catch (e) {
    console.error('Error saving scroll positions:', e);
  }
}

// Restore scroll positions after page loads
function restoreScrollPositions() {
  try {
    // Try to get positions from sessionStorage
    const savedPositions = sessionStorage.getItem('scrollPositions');
    if (savedPositions) {
      lastScrollPositions = JSON.parse(savedPositions);
    }
    
    // Wait for DOM to be fully loaded with increasing attempts for reliability
    const maxAttempts = 5;
    let attempts = 0;
    
    const attemptRestore = () => {
      // Only restore window scroll position on specific messaging/chat pages where it's actually needed
      const currentPath = window.location.pathname;
      const allowWindowScrollRestoration = [
        '/messages',
        '/chat',
        '/conversation',
        '/thread'
      ].some(path => currentPath.includes(path));
      
      // Only restore window position for messaging pages
      if (lastScrollPositions.window && allowWindowScrollRestoration) {
        console.log('Restoring window scroll position for messaging page:', lastScrollPositions.window);
        window.scrollTo(lastScrollPositions.window.x, lastScrollPositions.window.y);
      } else if (lastScrollPositions.window) {
        console.log('Skipping window scroll restoration on non-messaging page:', currentPath);
      }
      
      // Find all potential message containers using more specific selectors
      const messageContainers = document.querySelectorAll(
        // Message containers
        '[class*="message-container"], [class*="messageContainer"], [id*="message-container"], [id*="messageContainer"],' +
        // Thread containers
        '[class*="thread-container"], [class*="threadContainer"], [id*="thread-container"], [id*="threadContainer"],' +
        // General message areas
        '[class*="message-area"], [class*="messageArea"], [id*="message-area"], [id*="messageArea"],' +
        // Any element with a data-message-container attribute
        '[data-message-container="true"], [data-thread-id]'
      );
      
      // Track if we restored any positions
      let restoredAny = false;
      
      // Try to restore positions for each container
      messageContainers.forEach((container, index) => {
        if (!container) return;
        
        // Try to find a matching key in our saved positions
        // First by ID if available
        if (container.id && lastScrollPositions[container.id]) {
          container.scrollTop = lastScrollPositions[container.id];
          restoredAny = true;
          console.log(`Restored scroll position for ${container.id}: ${lastScrollPositions[container.id]}px`);
          return;
        }
        
        // Then by thread-id attribute if available
        const threadId = container.getAttribute('data-thread-id');
        if (threadId) {
          const threadKey = `msg-container-${threadId}`;
          if (lastScrollPositions[threadKey]) {
            container.scrollTop = lastScrollPositions[threadKey];
            restoredAny = true;
            console.log(`Restored scroll position for thread ${threadId}: ${lastScrollPositions[threadKey]}px`);
            return;
          }
        }
        
        // Finally by index
        const indexKey = `msg-container-${index}`;
        if (lastScrollPositions[indexKey]) {
          container.scrollTop = lastScrollPositions[indexKey];
          restoredAny = true;
          console.log(`Restored scroll position for container #${index}: ${lastScrollPositions[indexKey]}px`);
        }
      });
      
      // Only retry for messaging pages where window scroll restoration is needed
      if (!restoredAny && attempts < maxAttempts && allowWindowScrollRestoration) {
        attempts++;
        setTimeout(attemptRestore, 500 * attempts); // Longer delays to reduce interference
      }
    };
    
    // Start the first attempt
    setTimeout(attemptRestore, 50);
    
  } catch (e) {
    console.error('Error restoring scroll positions:', e);
  }
}

// Override the HMR accept function to ensure scroll positions are preserved
if (module && module.hot) {
  const originalAccept = module.hot.accept;
  module.hot.accept = function(...args) {
    // Store scroll positions before accepting update
    storeScrollPositions();
    // Call original function
    return originalAccept.apply(this, args);
  };
  
  // Listen for prepare status to save positions
  module.hot.addStatusHandler(status => {
    if (status === 'prepare' || status === 'ready') {
      console.log(`HMR status: ${status} - saving scroll positions`);
      storeScrollPositions();
    }
  });
}

export default function initSocketErrorHandler() {
  console.log('Enhanced socket error handler initialized');
  
  // Intercept errors that might cause page refreshes
  window.addEventListener('error', (event) => {
    // Check if this is a WebSocket related error
    if (event && event.message && (
      event.message.includes('WebSocket') || 
      event.message.includes('ws://') || 
      event.message.includes('wss://') ||
      event.message.includes('socket') ||
      event.message.includes('Socket')
    )) {
      console.warn('Prevented WebSocket error from refreshing page:', event.message);
      
      // Store scroll positions before potential refresh
      storeScrollPositions();
      
      // Only prevent default if it's likely a development/HMR socket
      if (
        event.message.includes('localhost') || 
        event.message.includes('webpack') || 
        event.message.includes('hmr')
      ) {
        event.preventDefault();
        return true;
      }
    }
    return false;
  });
  
  // Listen for before unload events to save scroll position
  window.addEventListener('beforeunload', () => {
    storeScrollPositions();
  });
  
  // Attempt to restore scroll positions on load
  if (document.readyState === 'complete') {
    restoreScrollPositions();
  } else {
    window.addEventListener('load', restoreScrollPositions);
  }
  
  // Also restore on route changes in SPA
  const originalPushState = window.history.pushState;
  window.history.pushState = function() {
    storeScrollPositions();
    const result = originalPushState.apply(this, arguments);
    setTimeout(restoreScrollPositions, 200);
    return result;
  };
  
  const originalReplaceState = window.history.replaceState;
  window.history.replaceState = function() {
    storeScrollPositions();
    const result = originalReplaceState.apply(this, arguments);
    setTimeout(restoreScrollPositions, 200);
    return result;
  };
  
  // Capture popstate (back/forward) events
  window.addEventListener('popstate', () => {
    setTimeout(restoreScrollPositions, 200);
  });
} 