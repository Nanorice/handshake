import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook to preserve scroll position during React re-renders
 * Prevents scroll jumping when new messages are added
 */
export const useScrollPreservation = (containerId, messageCount) => {
  const scrollPositionRef = useRef({ scrollTop: 0, isAtBottom: true });
  const containerRef = useRef(null);
  
  // Check if user is at bottom of scroll
  const isAtBottom = useCallback(() => {
    const container = containerRef.current || document.getElementById(containerId);
    if (!container) return true;
    
    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    return distanceFromBottom < 50; // Consider "at bottom" within 50px
  }, [containerId]);
  
  // Save current scroll position
  const saveScrollPosition = useCallback(() => {
    const container = containerRef.current || document.getElementById(containerId);
    if (!container) return;
    
    scrollPositionRef.current = {
      scrollTop: container.scrollTop,
      isAtBottom: isAtBottom()
    };
  }, [containerId, isAtBottom]);
  
  // Restore scroll position
  const restoreScrollPosition = useCallback(() => {
    const container = containerRef.current || document.getElementById(containerId);
    if (!container) return;
    
    const { scrollTop, isAtBottom: wasAtBottom } = scrollPositionRef.current;
    
    if (wasAtBottom) {
      // If user was at bottom, keep them at bottom
      container.scrollTop = container.scrollHeight;
    } else {
      // If user was scrolled up, maintain their position
      container.scrollTop = scrollTop;
    }
  }, [containerId]);
  
  // Set up container reference
  useEffect(() => {
    const container = document.getElementById(containerId);
    if (container) {
      containerRef.current = container;
    }
  }, [containerId]);
  
  // Handle message count changes
  useEffect(() => {
    if (messageCount === 0) return;
    
    // Save position before potential re-render
    saveScrollPosition();
    
    // Restore position after DOM update
    const timeoutId = requestAnimationFrame(() => {
      restoreScrollPosition();
    });
    
    return () => cancelAnimationFrame(timeoutId);
  }, [messageCount, saveScrollPosition, restoreScrollPosition]);
  
  return {
    saveScrollPosition,
    restoreScrollPosition,
    isAtBottom: isAtBottom()
  };
}; 