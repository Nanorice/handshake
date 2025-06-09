// Simple scroll preservation utility to prevent jumping during React re-renders

let savedScrollPositions = new Map();

/**
 * Save scroll position before React update
 */
export const preserveScrollBeforeUpdate = (containerId) => {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const scrollInfo = {
    scrollTop: container.scrollTop,
    scrollHeight: container.scrollHeight,
    clientHeight: container.clientHeight,
    timestamp: Date.now()
  };
  
  savedScrollPositions.set(containerId, scrollInfo);
};

/**
 * Restore scroll position after React update
 */
export const restoreScrollAfterUpdate = (containerId) => {
  const container = document.getElementById(containerId);
  const saved = savedScrollPositions.get(containerId);
  
  if (!container || !saved) return;
  
  // Only restore if save was recent (within 1 second)
  if (Date.now() - saved.timestamp > 1000) {
    savedScrollPositions.delete(containerId);
    return;
  }
  
  // Check if user was at bottom
  const wasAtBottom = saved.scrollHeight - saved.scrollTop - saved.clientHeight < 100;
  
  if (wasAtBottom) {
    // If user was at bottom, scroll to new bottom
    container.scrollTop = container.scrollHeight;
  } else {
    // If user was scrolled up, maintain relative position
    const heightDifference = container.scrollHeight - saved.scrollHeight;
    container.scrollTop = saved.scrollTop + heightDifference;
  }
  
  // Clean up
  savedScrollPositions.delete(containerId);
};

/**
 * React hook for automatic scroll preservation
 */
export const useScrollPreservation = (containerId, triggerValue) => {
  const React = require('react');
  
  React.useEffect(() => {
    preserveScrollBeforeUpdate(containerId);
    
    // Restore after React has updated the DOM
    const timeoutId = setTimeout(() => {
      restoreScrollAfterUpdate(containerId);
    }, 0);
    
    return () => clearTimeout(timeoutId);
  }, [triggerValue]);
}; 