import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { isAuthenticated, getUserData, getAuthToken, clearAuth, setUserData as setAuthUserData } from '../utils/authUtils';

const AuthContext = createContext({
  user: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  refreshAuthState: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authStatus, setAuthStatus] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [forceUpdate, setForceUpdate] = useState(0);

  const refreshAuthState = useCallback(() => {
    console.log('[AuthContext] refreshAuthState CALLED.');
    const authenticated = isAuthenticated();
    const userData = getUserData();
    console.log('[AuthContext] refreshAuthState - isAuthenticated result:', authenticated, 'Raw userData from getUserData():', userData);
    setAuthStatus(authenticated);
    console.log('[AuthContext] refreshAuthState - Attempting to setUser with:', userData);
    setUser(userData);
    setForceUpdate(prev => prev + 1);
  }, []);

  useEffect(() => {
    console.log('[AuthContext] Main useEffect triggered. forceUpdate:', forceUpdate, 'authStatus:', authStatus);
    const checkAuth = () => {
      console.log('[AuthContext] checkAuth called.');
      try {
        const authenticated = isAuthenticated();
        console.log('[AuthContext] checkAuth - isAuthenticated result:', authenticated);
        setAuthStatus(authenticated);
        
        if (authenticated) {
          const userData = getUserData();
          console.log('[AuthContext] checkAuth - User is authenticated. Raw userData from getUserData():', userData);
          console.log('[AuthContext] checkAuth - Attempting to setUser with:', userData);
          setUser(userData);
        } else {
          console.log('[AuthContext] checkAuth - User is NOT authenticated. Setting user to null.');
          setUser(null);
        }
      } catch (err) {
        console.error('[AuthContext] Error in checkAuth:', err);
        setUser(null);
        setAuthStatus(false);
      } finally {
        console.log('[AuthContext] checkAuth finally block. Setting AuthContext loading to false.');
        setLoading(false);
      }
    };
    
    checkAuth();
    
    /* Temporarily disable authCheckInterval for diagnostics
    const authCheckInterval = setInterval(() => {
      const currentToken = getAuthToken(); // Uses TokenStorage.getToken internally with its logs
      const hasToken = !!currentToken;

      if (!hasToken && authStatus) {
        console.log('[AuthContext] Interval Check: Token deemed lost while authStatus was true. Clearing full auth state via clearAuth().');
        clearAuth(); // This will remove token, isLoggedIn, userData, etc.
        setUser(null); // Update React state
        setAuthStatus(false); // Update React state
        // Optional: Consider a redirect to login if not already on a public page
        // Example: if (window.location.pathname !== '/' && window.location.pathname !== '/login') { window.location.href = '/login'; }
      } else if (hasToken && !authStatus) {
        console.log('[AuthContext] Interval Check: Token found while authStatus was false. Attempting to re-establish session.');
        const userDataFromStorage = getUserData();
        if (userDataFromStorage) {
          setUser(userDataFromStorage);
          setAuthStatus(true);
          // Ensure isLoggedIn flag is consistent if re-establishing session this way
          localStorage.setItem('isLoggedIn', 'true'); 
        } else {
          // Token exists but no user data. This is an inconsistent state.
          // Could be a very old token or data was cleared partially.
          console.warn('[AuthContext] Interval Check: Token found, but no user data in localStorage. Clearing token to resolve inconsistency.');
          clearAuth(); // Clear everything to force a fresh login
          setUser(null);
          setAuthStatus(false);
        }
      }
    }, 5000);
    */
    
    return () => {
      // if (authCheckInterval) clearInterval(authCheckInterval); // Clear if it was enabled
    };
  }, [forceUpdate, authStatus]);

  const login = (/* credentials */) => {
    console.log('[AuthContext] login function called (placeholder, actual logic in LoginForm).');
    setLoading(true);
    setError(null);
  };

  const logout = () => {
    console.log('[AuthContext] logout() called.');
    clearAuth();
    setUser(null);
    setAuthStatus(false);
    setForceUpdate(prev => prev + 1);
    window.location.href = '/';
  };

  const value = {
    currentUser: user,
    loading: loading,
    error,
    isAuthenticated: authStatus,
    login,
    logout,
    refreshAuthState,
  };
  
  console.log('[AuthContext] Providing value:', {
      currentUser: value.currentUser, 
      isAuthenticated: value.isAuthenticated, 
      loading: value.loading
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 