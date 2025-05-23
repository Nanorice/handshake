import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import initSocketErrorHandler from './utils/socketErrorHandler';
import { disableHmrFor } from './utils/scrollPositionManager';

// Initialize socket error handler to prevent WebSocket errors from refreshing the page
initSocketErrorHandler();

// Disable HMR for files that cause refresh issues
if (module && module.hot) {
  // Preserve state for these modules
  disableHmrFor('./utils/socketErrorHandler.js');
  disableHmrFor('./utils/scrollPositionManager.js');
  disableHmrFor('./components/Messaging/MessageThread.js');
  disableHmrFor('./components/Messaging/EnhancedMessageThread.js');
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