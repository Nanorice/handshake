import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserType } from '../utils/authUtils';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : false; // Default to light mode for better accessibility
  });

  // Check if user is a professional for enhanced color scheme
  const isProfessional = getUserType() === 'professional';

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      localStorage.setItem('theme', newMode ? 'dark' : 'light');
      return newMode;
    });
  };

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Complete theme objects with Material-UI compatibility
  const theme = {
    isDarkMode,
    isProfessional,
    
    // Basic colors - Enhanced with professional-specific variants
    bg: isDarkMode ? '#0d1117' : '#fafbfc',
    cardBg: isDarkMode ? '#161b22' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#1f2328',
    textSecondary: isDarkMode ? '#8b949e' : '#656d76',
    border: isDarkMode ? '#30363d' : '#e1e8ed',
    
    // Professional-enhanced accent colors
    accent: isDarkMode 
      ? '#238636' 
      : isProfessional 
        ? '#1e40af'  // Professional: Deep blue instead of GitHub blue
        : '#0969da',  // Student: Original GitHub blue
    accentHover: isDarkMode 
      ? '#2ea043' 
      : isProfessional 
        ? '#1d4ed8'  // Professional: Slightly lighter deep blue
        : '#0860ca',  // Student: Original hover blue
    
    // Form-specific colors - Enhanced with professional variants
    inputBg: isDarkMode ? '#0d1117' : '#ffffff',
    inputBorder: isDarkMode ? '#30363d' : '#e1e8ed',
    inputFocus: isDarkMode 
      ? '#238636' 
      : isProfessional 
        ? '#1e40af'  // Professional: Deep blue focus
        : '#0969da', // Student: Original blue focus
    shadow: isDarkMode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(140, 149, 159, 0.15)',
    
    // Material-UI compatible palette
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: {
        main: isDarkMode 
          ? '#238636' 
          : isProfessional 
            ? '#1e40af'  // Professional: Deep blue primary
            : '#0969da', // Student: Original GitHub blue
        light: isDarkMode 
          ? '#2ea043' 
          : isProfessional 
            ? '#3b82f6'  // Professional: Medium blue light variant
            : '#0550ae', // Student: Original light blue
        dark: isDarkMode 
          ? '#1a6929' 
          : isProfessional 
            ? '#1e3a8a'  // Professional: Very deep blue
            : '#0a58ca', // Student: Original dark blue
        contrastText: '#ffffff'
      },
      secondary: {
        main: isDarkMode ? '#8b949e' : '#656d76',
        light: isDarkMode ? '#9ca3af' : '#6b7280',
        dark: isDarkMode ? '#6b7280' : '#4b5563',
        contrastText: isDarkMode ? '#ffffff' : '#000000'
      },
      background: {
        default: isDarkMode ? '#0d1117' : '#fafbfc',
        paper: isDarkMode ? '#161b22' : '#ffffff'
      },
      text: {
        primary: isDarkMode ? '#ffffff' : '#1f2328',
        secondary: isDarkMode ? '#8b949e' : '#656d76'
      },
      divider: isDarkMode ? '#30363d' : '#e1e8ed',
      error: {
        main: '#f85149',
        light: '#ff7b7b',
        dark: '#da3633',
        contrastText: '#ffffff'
      },
      warning: {
        main: '#d29922',
        light: '#f5c542',
        dark: '#b8860b',
        contrastText: '#000000'
      },
      success: {
        main: isDarkMode 
          ? '#238636' 
          : isProfessional 
            ? '#059669'  // Professional: Deep emerald green
            : '#2da44e', // Student: Original green
        light: isDarkMode 
          ? '#2ea043' 
          : isProfessional 
            ? '#10b981'  // Professional: Medium emerald
            : '#4caf50', // Student: Original light green
        dark: isDarkMode 
          ? '#1a6929' 
          : isProfessional 
            ? '#047857'  // Professional: Very deep emerald
            : '#1e7e34', // Student: Original dark green
        contrastText: '#ffffff'
      },
      grey: {
        50: '#fafafa',
        100: '#f5f5f5',
        200: '#eeeeee',
        300: '#e0e0e0',
        400: '#bdbdbd',
        500: '#9e9e9e',
        600: '#757575',
        700: '#616161',
        800: '#424242',
        900: '#212121'
      }
    },
    
    // Component-specific styles - Enhanced light mode
    components: {
      card: {
        background: isDarkMode ? '#161b22' : '#ffffff',
        border: isDarkMode ? '#30363d' : '#e1e8ed',
        shadow: isDarkMode ? '0 4px 12px rgba(0, 0, 0, 0.4)' : '0 1px 3px rgba(140, 149, 159, 0.15), 0 1px 2px rgba(140, 149, 159, 0.1)'
      },
      button: {
        primary: {
          background: isDarkMode 
            ? '#238636' 
            : isProfessional 
              ? '#1e40af'  // Professional: Deep blue buttons
              : '#0969da', // Student: Original blue
          color: '#ffffff',
          hover: isDarkMode 
            ? '#2ea043' 
            : isProfessional 
              ? '#1d4ed8'  // Professional: Deep blue hover
              : '#0550ae'  // Student: Original hover
        },
        secondary: {
          background: isDarkMode ? '#21262d' : '#f6f8fa',
          color: isDarkMode ? '#f0f6fc' : '#1f2328',
          border: isDarkMode ? '#30363d' : '#e1e8ed',
          hover: isDarkMode ? '#30363d' : '#eaeef2'
        }
      },
      input: {
        background: isDarkMode ? '#0d1117' : '#ffffff',
        border: isDarkMode ? '#30363d' : '#e1e8ed',
        color: isDarkMode ? '#f0f6fc' : '#1f2328',
        placeholder: isDarkMode ? '#8b949e' : '#656d76',
        focus: isDarkMode 
          ? '#238636' 
          : isProfessional 
            ? '#1e40af'  // Professional: Deep blue focus
            : '#0969da'  // Student: Original blue focus
      },
      navbar: {
        background: isDarkMode ? 'rgba(13, 17, 23, 0.95)' : 'rgba(250, 251, 252, 0.95)',
        border: isDarkMode ? '#30363d' : '#e1e8ed'
      }
    },
    
    // Utility functions
    alpha: (color, opacity) => {
      // Simple alpha utility
      if (color.startsWith('#')) {
        const hex = color.slice(1);
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
      }
      return color;
    }
  };

  return (
    <ThemeContext.Provider value={{ ...theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}; 