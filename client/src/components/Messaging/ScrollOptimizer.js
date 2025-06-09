import { useEffect, useRef } from 'react';

/**
 * Hook to prevent scroll jumping during React re-renders
 * Automatically saves and restores scroll position
 */
export const useScrollOptimizer = (containerId, dependencies = []) => {
  const scrollPositionRef = useRef(null);
  const isUserScrollingRef = useRef(false);
  const lastDependencyRef = useRef(dependencies);
  
  // Save current scroll position
  const saveCurrentScrollPosition = () => {
    const container = document.getElementById(containerId);
    if (container) {
      scrollPositionRef.current = {
        scrollTop: container.scrollTop,
        scrollHeight: container.scrollHeight,
        clientHeight: container.clientHeight
      };
    }
  };
  
  // Restore scroll position
  const restoreScrollPosition = () => {
    const container = document.getElementById(containerId);
    const saved = scrollPositionRef.current;
    
    if (container && saved) {
      // Check if we should maintain position (user was not at bottom)
      const wasAtBottom = saved.scrollHeight - saved.scrollTop - saved.clientHeight < 100;
      
      if (!wasAtBottom && !isUserScrollingRef.current) {
        // Restore exact position for users scrolled up
        container.scrollTop = saved.scrollTop;
      } else if (wasAtBottom) {
        // Auto-scroll to bottom if user was already there
        container.scrollTop = container.scrollHeight;
      }
    }
  };
  
  // Track user scrolling
  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let scrollTimeout;
    const handleScroll = () => {
      isUserScrollingRef.current = true;
      saveCurrentScrollPosition();
      
      // Reset user scrolling flag after scrolling stops
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isUserScrollingRef.current = false;
      }, 150);
    };
    
    container.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [containerId]);
  
  // Handle dependency changes
  useEffect(() => {
    const hasChanged = dependencies.some((dep, index) => 
      dep !== lastDependencyRef.current[index]
    );
    
    if (hasChanged) {
      // Save position before update
      saveCurrentScrollPosition();
      
      // Restore position after React update
      const timeoutId = setTimeout(() => {
        restoreScrollPosition();
      }, 0);
      
      lastDependencyRef.current = dependencies;
      
      return () => clearTimeout(timeoutId);
    }
  }, dependencies);
  
  return {
    saveCurrentScrollPosition,
    restoreScrollPosition
  };
};