import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Fallback redirect: If a user is sent here from og-service with app_fallback=1,
// it means they clicked a Facebook link and the Android OS did NOT intercept it
// (which proves they don't have the app installed).
if (window.location.search.includes('app_fallback=1')) {
  window.location.replace('https://play.google.com/store/apps/details?id=com.sooqcom.app');
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
