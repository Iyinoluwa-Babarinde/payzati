'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * NavigationProgress
 * A slim NProgress-style top bar that fires on every client-side route change.
 * It does NOT require any external library — it listens to pathname changes.
 */
export default function NavigationProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevPathname = useRef(pathname);

  const startProgress = () => {
    setProgress(0);
    setVisible(true);

    let current = 0;
    intervalRef.current = setInterval(() => {
      // Trickle: fast at first, slows down asymptotically toward 90 %
      const increment = current < 30 ? 8 : current < 60 ? 4 : current < 80 ? 2 : 0.5;
      current = Math.min(current + increment, 90);
      setProgress(current);
    }, 80);
  };

  const finishProgress = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setProgress(100);
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 400);
  };

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      // A route change just completed — snap to 100 %
      finishProgress();
      prevPathname.current = pathname;
    }
  }, [pathname]);

  // Kick off the bar the moment a navigation begins.
  // We use a MutationObserver on <body> class changes that Next.js sets,
  // but the simplest reliable method: intercept link clicks globally.
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;
      const href = target.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto')) return;
      if (target.getAttribute('target') === '_blank') return;
      // Only trigger for same-origin internal navigations
      startProgress();
    };

    document.addEventListener('click', handleClick, true);
    return () => {
      document.removeEventListener('click', handleClick, true);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (!visible) return null;

  return (
    <>
      {/* Slim progress bar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '3px',
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #00D4AA, #00E6B8 60%, #33DDB8)',
          boxShadow: '0 0 12px rgba(0,212,170,0.6), 0 0 4px rgba(0,212,170,0.4)',
          zIndex: 99999,
          transition: progress === 100 ? 'width 0.15s ease, opacity 0.3s ease' : 'width 0.08s ease',
          opacity: progress === 100 ? 0 : 1,
          borderRadius: '0 2px 2px 0',
        }}
      />
      {/* Glowing leading edge dot */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: `${progress}%`,
          width: '80px',
          height: '3px',
          background: 'linear-gradient(90deg, transparent, rgba(0,212,170,0.8))',
          zIndex: 99999,
          transform: 'translateX(-100%)',
          opacity: progress === 100 ? 0 : 1,
          transition: 'opacity 0.3s ease',
        }}
      />
    </>
  );
}
