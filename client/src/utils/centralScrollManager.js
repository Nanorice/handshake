/**
 * Centralized Scroll Manager - Prevents scroll jumping across the app
 * This replaces the scattered scroll management logic
 */

class CentralScrollManager {
  constructor() {
    this.scrollPositions = new Map();
    this.scrollTimeouts = new Map();
    this.isRestoring = false;
    this.observers = new Map();
    
    // Bind methods to preserve context
    this.savePosition = this.savePosition.bind(this);
    this.restorePosition = this.restorePosition.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    
    // Setup global listeners
    this.setupGlobalListeners();
  }

  /**
   * Save scroll position for a container
   */
  savePosition(containerId, context = 'default') {
    if (this.isRestoring) return;
    
    try {
      const container = document.getElementById(containerId);
      if (!container) return;
      
      const key = `${containerId}-${context}`;
      const position = {
        scrollTop: container.scrollTop,
        scrollHeight: container.scrollHeight,
        timestamp: Date.now()
      };
      
      this.scrollPositions.set(key, position);
      
      // Also save to sessionStorage for persistence
      this.saveToStorage();
      
    } catch (error) {
      console.warn('Error saving scroll position:', error);
    }
  }

  /**
   * Restore scroll position for a container
   */
  restorePosition(containerId, context = 'default', options = {}) {
    const { 
      delay = 100, 
      maxAttempts = 3, 
      fallbackToBottom = false 
    } = options;
    
    return new Promise((resolve) => {
      let attempts = 0;
      
      const attemptRestore = () => {
        attempts++;
        
        try {
          const container = document.getElementById(containerId);
          if (!container) {
            if (attempts < maxAttempts) {
              setTimeout(attemptRestore, delay * attempts);
              return;
            }
            resolve(false);
            return;
          }
          
          const key = `${containerId}-${context}`;
          const savedPosition = this.scrollPositions.get(key);
          
          if (savedPosition && savedPosition.scrollTop !== undefined) {
            this.isRestoring = true;
            
            // Only restore if the content is ready (has some height)
            if (container.scrollHeight > 100) {
              container.scrollTop = savedPosition.scrollTop;
              
              // Small delay to let the restore take effect
              setTimeout(() => {
                this.isRestoring = false;
                resolve(true);
              }, 50);
            } else if (attempts < maxAttempts) {
              // Content not ready, try again
              setTimeout(attemptRestore, delay * attempts);
              return;
            } else if (fallbackToBottom) {
              // Fallback: scroll to bottom for new conversations
              container.scrollTop = container.scrollHeight;
              setTimeout(() => {
                this.isRestoring = false;
                resolve(true);
              }, 50);
            } else {
              this.isRestoring = false;
              resolve(false);
            }
          } else {
            this.isRestoring = false;
            resolve(false);
          }
        } catch (error) {
          console.warn('Error restoring scroll position:', error);
          this.isRestoring = false;
          resolve(false);
        }
      };
      
      setTimeout(attemptRestore, delay);
    });
  }

  /**
   * Smart auto-scroll that respects user scroll position
   */
  smartAutoScroll(containerId, options = {}) {
    const { 
      threshold = 300, 
      behavior = 'smooth',
      checkUserIntent = true 
    } = options;
    
    try {
      const container = document.getElementById(containerId);
      if (!container) return false;
      
      if (checkUserIntent) {
        // Check if user is near bottom (hasn't scrolled up)
        const { scrollTop, scrollHeight, clientHeight } = container;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
        
        // Don't auto-scroll if user has scrolled up significantly
        if (distanceFromBottom > threshold) {
          return false;
        }
      }
      
      // Scroll to bottom
      container.scrollTo({
        top: container.scrollHeight,
        behavior: behavior
      });
      
      return true;
    } catch (error) {
      console.warn('Error in smart auto-scroll:', error);
      return false;
    }
  }

  /**
   * Setup debounced scroll listener for a container
   */
  setupScrollListener(containerId, context = 'default', debounceMs = 150) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Clear existing timeout
    const timeoutKey = `${containerId}-${context}`;
    if (this.scrollTimeouts.has(timeoutKey)) {
      clearTimeout(this.scrollTimeouts.get(timeoutKey));
    }
    
    // Remove existing listener
    if (this.observers.has(timeoutKey)) {
      container.removeEventListener('scroll', this.observers.get(timeoutKey));
    }
    
    // Create new debounced listener
    const debouncedSave = () => {
      clearTimeout(this.scrollTimeouts.get(timeoutKey));
      const timeout = setTimeout(() => {
        this.savePosition(containerId, context);
      }, debounceMs);
      this.scrollTimeouts.set(timeoutKey, timeout);
    };
    
    // Add listener
    container.addEventListener('scroll', debouncedSave, { passive: true });
    this.observers.set(timeoutKey, debouncedSave);
  }

  /**
   * Clean up listeners for a container
   */
  cleanupListeners(containerId, context = 'default') {
    const timeoutKey = `${containerId}-${context}`;
    
    // Clear timeout
    if (this.scrollTimeouts.has(timeoutKey)) {
      clearTimeout(this.scrollTimeouts.get(timeoutKey));
      this.scrollTimeouts.delete(timeoutKey);
    }
    
    // Remove listener
    if (this.observers.has(timeoutKey)) {
      const container = document.getElementById(containerId);
      if (container) {
        container.removeEventListener('scroll', this.observers.get(timeoutKey));
      }
      this.observers.delete(timeoutKey);
    }
  }

  /**
   * Save to sessionStorage
   */
  saveToStorage() {
    try {
      const data = {};
      this.scrollPositions.forEach((value, key) => {
        data[key] = value;
      });
      sessionStorage.setItem('centralScrollPositions', JSON.stringify(data));
    } catch (error) {
      console.warn('Error saving to sessionStorage:', error);
    }
  }

  /**
   * Load from sessionStorage
   */
  loadFromStorage() {
    try {
      const data = sessionStorage.getItem('centralScrollPositions');
      if (data) {
        const parsed = JSON.parse(data);
        Object.entries(parsed).forEach(([key, value]) => {
          this.scrollPositions.set(key, value);
        });
      }
    } catch (error) {
      console.warn('Error loading from sessionStorage:', error);
    }
  }

  /**
   * Setup global listeners
   */
  setupGlobalListeners() {
    // Load from storage on init
    this.loadFromStorage();
    
    // Save positions before page unload
    window.addEventListener('beforeunload', () => {
      this.saveToStorage();
    });
    
    // Handle visibility changes (tab switching)
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    
    // Handle route changes (for SPAs)
    if (window.history) {
      const originalPushState = window.history.pushState;
      window.history.pushState = (...args) => {
        this.saveToStorage();
        return originalPushState.apply(window.history, args);
      };
    }
  }

  /**
   * Handle tab visibility changes
   */
  handleVisibilityChange() {
    if (document.hidden) {
      // Tab is hidden, save current positions
      this.saveToStorage();
    }
  }

  /**
   * Clear all stored positions
   */
  clearAll() {
    this.scrollPositions.clear();
    sessionStorage.removeItem('centralScrollPositions');
  }

  /**
   * Get debug info
   */
  getDebugInfo() {
    return {
      positions: Object.fromEntries(this.scrollPositions),
      isRestoring: this.isRestoring,
      activeTimeouts: this.scrollTimeouts.size,
      activeObservers: this.observers.size
    };
  }
}

// Create singleton instance
const scrollManager = new CentralScrollManager();

// Export methods for easy use
export const saveScrollPosition = scrollManager.savePosition;
export const restoreScrollPosition = scrollManager.restorePosition;
export const smartAutoScroll = scrollManager.smartAutoScroll;
export const setupScrollListener = scrollManager.setupScrollListener;
export const cleanupScrollListeners = scrollManager.cleanupListeners;
export const clearAllPositions = scrollManager.clearAll;
export const getScrollDebugInfo = scrollManager.getDebugInfo;

export default scrollManager; 