import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import initSocketErrorHandler from './utils/socketErrorHandler';
import { initGlobalScrollProtection } from './utils/globalScrollProtection';

// Initialize socket error handler to prevent WebSocket errors from refreshing the page
initSocketErrorHandler();

// Initialize global scroll protection to prevent scroll jumping
initGlobalScrollProtection();

// HMR configuration - scroll protection is now handled globally
if (module && module.hot) {
  // Global scroll protection handles state preservation during HMR
  console.log('HMR: Scroll protection active');
}

// Clear localStorage during development to ensure proper testing
if (process.env.NODE_ENV === 'development') {
  // Don't clear tokens on every reload to prevent login issues
  // localStorage.removeItem('token');
  // localStorage.removeItem('isAdmin');
  console.log('Development mode: Performance optimizations applied');
  
  // Configure HMR for React - prevent unnecessary refreshes
  if (module.hot) {
    module.hot.accept('./App', () => {
      console.log('HMR: Accepting the updated App module');
      // No need to force refresh - React HMR will handle it
    });
    
    // Log when HMR is enabled
    console.log('HMR: Hot Module Replacement is enabled');
  }
}

// Use StrictMode only in non-development environments to prevent double renders
const AppWrapper = process.env.NODE_ENV !== 'development' 
  ? (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  ) 
  : <App />;

const root = ReactDOM.createRoot(document.getElementById('root'));

// Add scroll position recovery on render
root.render(AppWrapper); 