import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Clear localStorage during development to ensure proper testing
if (process.env.NODE_ENV === 'development') {
  localStorage.removeItem('token');
  localStorage.removeItem('isAdmin');
  console.log('Development mode: localStorage has been cleared');
}

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 