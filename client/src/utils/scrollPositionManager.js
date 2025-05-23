/**
 * Utility to manage scroll positions and prevent unwanted scroll jumps
 */

// Store scroll positions for various containers by thread ID
const scrollPositions = new Map();

// Save the scroll position for a specific container
export const saveScrollPosition = (containerId, threadId) => {
  try {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const position = container.scrollTop;
    const key = `${containerId}-${threadId || 'default'}`;
    
    scrollPositions.set(key, position);
    
    // Also save to sessionStorage for persistence across page reloads
    try {
      const savedPositions = JSON.parse(sessionStorage.getItem('scrollPositions') || '{}');
      savedPositions[key] = position;
      sessionStorage.setItem('scrollPositions', JSON.stringify(savedPositions));
    } catch (e) {
      console.warn('Failed to save scroll position to sessionStorage:', e);
    }
    
    return position;
  } catch (error) {
    console.error('Error saving scroll position:', error);
  }
};

// Restore the scroll position for a specific container
export const restoreScrollPosition = (containerId, threadId) => {
  try {
    const container = document.getElementById(containerId);
    if (!container) return false;
    
    const key = `${containerId}-${threadId || 'default'}`;
    
    // First try memory cache
    let position = scrollPositions.get(key);
    
    // Fall back to sessionStorage
    if (position === undefined) {
      try {
        const savedPositions = JSON.parse(sessionStorage.getItem('scrollPositions') || '{}');
        position = savedPositions[key];
      } catch (e) {
        console.warn('Failed to get scroll position from sessionStorage:', e);
      }
    }
    
    if (position !== undefined) {
      // Use setTimeout to ensure the DOM has updated
      setTimeout(() => {
        container.scrollTop = position;
      }, 50);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error restoring scroll position:', error);
    return false;
  }
};

// Watch for HMR updates and save positions before reload
if (module && module.hot) {
  module.hot.addStatusHandler(status => {
    if (status === 'prepare') {
      // About to reload, save all positions
      console.log('HMR preparing to update - saving scroll positions');
      
      // Find message containers and save their positions
      const messageContainers = document.querySelectorAll('[id*="message"],[id*="Message"]');
      messageContainers.forEach(container => {
        if (container && container.id) {
          const threadId = container.getAttribute('data-thread-id') || 'default';
          saveScrollPosition(container.id, threadId);
        }
      });
    }
  });
}

// Function to disable HMR for certain modules
export const disableHmrFor = (moduleId) => {
  if (module && module.hot) {
    module.hot.decline(moduleId);
  }
};

// Auto-restore scroll positions on page load
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    // Wait for the DOM to be fully loaded
    setTimeout(() => {
      // Find message containers and restore their positions
      const messageContainers = document.querySelectorAll('[id*="message"],[id*="Message"]');
      messageContainers.forEach(container => {
        if (container && container.id) {
          const threadId = container.getAttribute('data-thread-id') || 'default';
          restoreScrollPosition(container.id, threadId);
        }
      });
    }, 200);
  });
  
  // Save positions before any page unload/refresh
  window.addEventListener('beforeunload', (e) => {
    // Save scroll positions for all message containers
    const messageContainers = document.querySelectorAll('[id*="message"],[id*="Message"]');
    messageContainers.forEach(container => {
      if (container && container.id) {
        const threadId = container.getAttribute('data-thread-id') || 'default';
        saveScrollPosition(container.id, threadId);
      }
    });
  });
} 