import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import Planny from './ScripturePlan'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Planny />
  </React.StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then(() => console.log('Service Worker registered'))
      .catch((err) => {
        // Log, but don’t break the app
        console.warn('Service Worker registration failed:', err);
      });
  });
}
