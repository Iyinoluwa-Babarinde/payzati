'use client';

import { useEffect } from 'react';

export default function PWARegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && (window as any).workbox === undefined) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((reg) => {
            console.log('PWA Service Worker registered successfully:', reg.scope);
          })
          .catch((err) => {
            console.warn('PWA Service Worker registration failed:', err);
          });
      });
    }
  }, []);

  return null;
}
