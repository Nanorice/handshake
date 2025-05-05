import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { isAuthenticated, getUserData } from '../utils/authUtils';

const AuthContext = createContext({
  user: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authStatus, setAuthStatus] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check authentication status on mount and whenever localStorage changes
  useEffect(() => {
    const checkAuth = () => {
      try {
        // Check if user is authenticated
        const authenticated = isAuthenticated();
        console.log('AuthContext: Authentication check -', authenticated ? 'Authenticated' : 'Not authenticated');
        setAuthStatus(authenticated);
        
        if (authenticated) {
          // Get user data from localStorage
          const userData = getUserData();
          console.log('AuthContext: User data -', userData);
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
    
    // Check auth initially
    checkAuth();
    
    // Set up localStorage event listener to detect changes
    const handleStorageChange = () => {
      checkAuth();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 