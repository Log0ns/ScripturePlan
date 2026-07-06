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
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((reg) => {
        console.log('Service Worker registered');
        setInterval(() => reg.update(), 30 * 60 * 1000);
      })
      .catch((err) => {
        console.warn('Service Worker registration failed:', err);
      });
  });
}
