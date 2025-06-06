/**
 * Global Scroll Protection - Prevents unwanted scroll jumping app-wide
 */

let scrollProtectionEnabled = true;
let lastScrollPositions = {};

/**
 * Save scroll positions of all scrollable elements
 */
const saveAllScrollPositions = () => {
  try {
    // Save main window scroll
    lastScrollPositions.window = {
      x: window.pageXOffset || document.documentElement.scrollLeft,
      y: window.pageYOffset || document.documentElement.scrollTop
    };
    
    // Save container scroll positions
    const scrollableElements = document.querySelectorAll('[id*="message"], [id*="container"], [class*="message"], [class*="scroll"]');
    scrollableElements.forEach((element, index) => {
      if (element.scrollTop > 0 || element.scrollLeft > 0) {
        const id = element.id || `element-${index}`;
        lastScrollPositions[id] = {
          top: element.scrollTop,
          left: element.scrollLeft
        };
      }
    });
    
    // Save to sessionStorage for persistence
    sessionStorage.setItem('globalScrollPositions', JSON.stringify(lastScrollPositions));
  } catch (error) {
    console.warn('Error saving scroll positions:', error);
  }
};

/**
 * Restore scroll positions
 */
const restoreAllScrollPositions = () => {
  if (!scrollProtectionEnabled) return;
  
  try {
    // Load from sessionStorage
    const saved = sessionStorage.getItem('globalScrollPositions');
    if (saved) {
      lastScrollPositions = { ...lastScrollPositions, ...JSON.parse(saved) };
    }
    
    // Restore window scroll
    if (lastScrollPositions.window) {
      setTimeout(() => {
        window.scrollTo(lastScrollPositions.window.x, lastScrollPositions.window.y);
      }, 50);
    }
    
    // Restore container scrolls
    Object.entries(lastScrollPositions).forEach(([id, position]) => {
      if (id === 'window') return;
      
      const element = document.getElementById(id);
      if (element && position.top !== undefined) {
        setTimeout(() => {
          element.scrollTop = position.top;
          if (position.left !== undefined) {
            element.scrollLeft = position.left;
          }
        }, 100);
      }
    });
  } catch (error) {
    console.warn('Error restoring scroll positions:', error);
  }
};

/**
 * Prevent automatic scroll to top during HMR
 */
const preventHMRScrollReset = () => {
  if (module && module.hot) {
    module.hot.addStatusHandler(status => {
      if (status === 'prepare') {
        saveAllScrollPositions();
      } else if (status === 'idle') {
        setTimeout(restoreAllScrollPositions, 200);
      }
    });
  }
};

/**
 * Debounced scroll saver
 */
let saveScrollTimeout;
const debouncedSaveScroll = () => {
  clearTimeout(saveScrollTimeout);
  saveScrollTimeout = setTimeout(saveAllScrollPositions, 500);
};

/**
 * Initialize global scroll protection
 */
export const initGlobalScrollProtection = () => {
  console.log('🛡️ Initializing global scroll protection...');
  
  // Prevent HMR scroll reset
  preventHMRScrollReset();
  
  // Save scroll positions before page unload
  window.addEventListener('beforeunload', saveAllScrollPositions);
  
  // Save scroll positions on route changes
  if (window.history) {
    const originalPushState = window.history.pushState;
    window.history.pushState = function(...args) {
      saveAllScrollPositions();
      const result = originalPushState.apply(this, args);
      setTimeout(restoreAllScrollPositions, 100);
      return result;
    };
    
    const originalReplaceState = window.history.replaceState;
    window.history.replaceState = function(...args) {
      saveAllScrollPositions();
      const result = originalReplaceState.apply(this, args);
      setTimeout(restoreAllScrollPositions, 100);
      return result;
    };
  }
  
  // Save on regular scroll events (debounced)
  window.addEventListener('scroll', debouncedSaveScroll, { passive: true });
  
  // Restore positions when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(restoreAllScrollPositions, 200);
    });
  } else {
    setTimeout(restoreAllScrollPositions, 200);
  }
  
  // Handle visibility changes (tab switching)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      saveAllScrollPositions();
    } else {
      setTimeout(restoreAllScrollPositions, 100);
    }
  });
  
  console.log('✅ Global scroll protection initialized');
};

/**
 * Enable/disable scroll protection
 */
export const setScrollProtectionEnabled = (enabled) => {
  scrollProtectionEnabled = enabled;
  console.log(`🛡️ Scroll protection ${enabled ? 'enabled' : 'disabled'}`);
};

/**
 * Manual save trigger
 */
export const saveCurrentScrollPositions = () => {
  saveAllScrollPositions();
};

/**
 * Manual restore trigger
 */
export const restoreScrollPositions = () => {
  restoreAllScrollPositions();
};

/**
 * Clear all saved positions
 */
export const clearScrollPositions = () => {
  lastScrollPositions = {};
  sessionStorage.removeItem('globalScrollPositions');
  console.log('🗑️ Cleared all scroll positions');
};

// Auto-initialize in development
if (process.env.NODE_ENV === 'development') {
  initGlobalScrollProtection();
} 