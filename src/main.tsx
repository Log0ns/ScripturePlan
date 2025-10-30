import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import ScripturePlan from './ScripturePlan'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ScripturePlan />
  </React.StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then(() => console.log('Service Worker registered'))
      .catch((err) => console.error('Service Worker registration failed:', err));
  });
}
