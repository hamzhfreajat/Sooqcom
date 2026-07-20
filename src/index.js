import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Fallback redirect: If a user is sent here from og-service with app_fallback=1,
// it means they clicked a Facebook link and the OS did NOT intercept it.
if (window.location.search.includes('app_fallback=1')) {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
    // iOS Device -> Redirect to Apple App Store
    window.location.replace('https://apps.apple.com/app/idYOUR_APPLE_APP_ID'); // NOTE: Update this ID!
  } else {
    // Android/Other -> Redirect to Google Play Store
    window.location.replace('https://play.google.com/store/apps/details?id=com.sooqcom.app');
  }
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
