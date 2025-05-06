import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { isAuthenticated, getUserData, getAuthToken } from '../utils/authUtils';

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

  // Force a refresh of auth state - can be called after login
  const refreshAuthState = useCallback(() => {
    console.log('Explicitly refreshing auth state');
    const authenticated = isAuthenticated();
    const userData = getUserData();
    
    console.log('RefreshAuthState - Auth check:', authenticated, 'User data:', userData ? 'exists' : 'none');
    
    // Immediately update state
    setAuthStatus(authenticated);
    setUser(userData);
    
    // Also trigger the effect to run
    setForceUpdate(prev => prev + 1);
  }, []);

  // Check authentication status on mount and whenever localStorage changes
  useEffect(() => {
    const checkAuth = () => {
      try {
        // Check if user is authenticated
        const authenticated = isAuthenticated();
        console.log('AuthContext: Authentication check -', authenticated ? 'Authenticated' : 'Not authenticated');
        
        // Get token directly to debug
        const token = getAuthToken();
        console.log('AuthContext: Token check -', token ? `Token exists: ${token.substring(0, 10)}...` : 'No token found');
        
        setAuthStatus(authenticated);
        
        if (authenticated) {
          // Get user data from localStorage
          const userData = getUserData();
          console.log('AuthContext: User data -', userData ? 'Found user data' : 'No user data found');
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('AuthContext: Error checking authentication', err);
        setUser(null);
        setAuthStatus(false);
      } finally {
        setLoading(false);
      }
    };
    
    // Check auth immediately
    checkAuth();
    
    // Only do periodic checks, but don't modify the token
    const authCheckInterval = setInterval(() => {
      // Only check token status, don't modify it
      const hasToken = !!getAuthToken();
      if (!hasToken && authStatus) {
        console.log('AuthContext: Token lost during session, updating auth state');
        setAuthStatus(false);
        setUser(null);
      } else if (hasToken && !authStatus) {
        console.log('AuthContext: Token found during session, updating auth state');
        setAuthStatus(true);
        // Re-fetch user data
        const userData = getUserData();
        if (userData) setUser(userData);
      }
    }, 5000); // Check every 5 seconds instead of 2
    
    return () => {
      clearInterval(authCheckInterval);
    };
  }, [forceUpdate, authStatus]); // Add authStatus to dependencies so changes can trigger re-checks

  const login = () => {
    // This is now handled directly in the LoginForm component
    setLoading(true);
    setError(null);
  };

  const logout = () => {
    console.log('AuthContext: Logging out user');
    
    // Clear all auth data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('userId');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('isLoggedIn');
    
    // Update state
    setUser(null);
    setAuthStatus(false);
    
    // Force navigation to home page
    window.location.href = '/';
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated: authStatus,
    login,
    logout,
    refreshAuthState,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 