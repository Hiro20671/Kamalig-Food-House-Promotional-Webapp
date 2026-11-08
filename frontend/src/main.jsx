import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Register Kamalig FH PWA Service Worker and purge any legacy caches from previous apps on the same domain
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(
          keys
            .filter((k) => k !== 'kamalig-fh-pwa-v4')
            .map((k) => caches.delete(k))
        );
      }
      const reg = await navigator.serviceWorker.register('/sw.js?v=kamalig2026', {
        updateViaCache: 'none',
      });
      await reg.update();
    } catch {
      // Ignore service worker registration errors in unsupported contexts
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
