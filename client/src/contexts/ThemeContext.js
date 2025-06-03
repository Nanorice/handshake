import React, { createContext, useContext, useState, useEffect } from 'react';

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
    return saved ? saved === 'dark' : true; // Default to dark mode
  });

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
    
    // Basic colors
    bg: isDarkMode ? '#0d1117' : '#ffffff',
    cardBg: isDarkMode ? '#161b22' : '#f8f9fa',
    text: isDarkMode ? '#ffffff' : '#24292f',
    textSecondary: isDarkMode ? '#8b949e' : '#656d76',
    border: isDarkMode ? '#30363d' : '#d0d7de',
    accent: isDarkMode ? '#238636' : '#0969da',
    accentHover: isDarkMode ? '#2ea043' : '#0550ae',
    
    // Form-specific colors
    inputBg: isDarkMode ? '#0d1117' : '#ffffff',
    inputBorder: isDarkMode ? '#30363d' : '#d0d7de',
    inputFocus: isDarkMode ? '#238636' : '#0969da',
    shadow: isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)',
    
    // Material-UI compatible palette
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: {
        main: isDarkMode ? '#238636' : '#0969da',
        light: isDarkMode ? '#2ea043' : '#0550ae',
        dark: isDarkMode ? '#1a6929' : '#0a58ca',
        contrastText: '#ffffff'
      },
      secondary: {
        main: isDarkMode ? '#8b949e' : '#656d76',
        light: isDarkMode ? '#9ca3af' : '#6b7280',
        dark: isDarkMode ? '#6b7280' : '#4b5563',
        contrastText: isDarkMode ? '#ffffff' : '#000000'
      },
      background: {
        default: isDarkMode ? '#0d1117' : '#ffffff',
        paper: isDarkMode ? '#161b22' : '#f8f9fa'
      },
      text: {
        primary: isDarkMode ? '#ffffff' : '#24292f',
        secondary: isDarkMode ? '#8b949e' : '#656d76'
      },
      divider: isDarkMode ? '#30363d' : '#d0d7de',
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
        main: isDarkMode ? '#238636' : '#2da44e',
        light: isDarkMode ? '#2ea043' : '#4caf50',
        dark: isDarkMode ? '#1a6929' : '#1e7e34',
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
    
    // Component-specific styles
    components: {
      card: {
        background: isDarkMode ? '#161b22' : '#ffffff',
        border: isDarkMode ? '#30363d' : '#e1e5e9',
        shadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.4)' : '0 2px 8px rgba(31, 35, 40, 0.15)'
      },
      button: {
        primary: {
          background: isDarkMode ? '#238636' : '#0969da',
          color: '#ffffff',
          hover: isDarkMode ? '#2ea043' : '#0550ae'
        },
        secondary: {
          background: isDarkMode ? '#21262d' : '#f6f8fa',
          color: isDarkMode ? '#f0f6fc' : '#24292f',
          border: isDarkMode ? '#30363d' : '#d0d7de',
          hover: isDarkMode ? '#30363d' : '#f3f4f6'
        }
      },
      input: {
        background: isDarkMode ? '#0d1117' : '#ffffff',
        border: isDarkMode ? '#30363d' : '#d0d7de',
        color: isDarkMode ? '#f0f6fc' : '#24292f',
        placeholder: isDarkMode ? '#8b949e' : '#656d76',
        focus: isDarkMode ? '#238636' : '#0969da'
      },
      navbar: {
        background: isDarkMode ? 'rgba(13, 17, 23, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        border: isDarkMode ? '#30363d' : '#d0d7de'
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