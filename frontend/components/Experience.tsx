'use client';

import { useEffect } from 'react';

/** Pointer-driven parallax used by the landing visuals. Disabled for touch and reduced-motion users. */
export function CursorScene() {
  useEffect(() => {
    if (window.matchMedia('(pointer: coarse), (prefers-reduced-motion: reduce)').matches) return;
    const root = document.documentElement;
    let frame = 0;
    const move = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        root.style.setProperty('--mx', `${e.clientX}px`);
        root.style.setProperty('--my', `${e.clientY}px`);
        root.style.setProperty('--rx', `${(e.clientY / window.innerHeight - 0.5) * -7}deg`);
        root.style.setProperty('--ry', `${(e.clientX / window.innerWidth - 0.5) * 9}deg`);
      });
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => { cancelAnimationFrame(frame); window.removeEventListener('pointermove', move); };
  }, []);
  return <div className="cursor-glow" aria-hidden="true" />;
}
