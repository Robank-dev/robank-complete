'use client';

import { useEffect, useState } from 'react';

export function IntroLoader() {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const timer = window.setTimeout(() => setShow(false), 1800);
    return () => window.clearTimeout(timer);
  }, []);
  if (!show) return null;
  return (
    <div className="intro-loader" aria-label="Loading ROBANK">
      <div className="loader-orbit orbit-a" />
      <div className="loader-orbit orbit-b" />
      <div className="loader-core">
        <img src="/robank-mark.png" alt="ROBANK" />
      </div>
      <div className="loader-word">ROBANK</div>
      <div className="loader-status"><span /> Establishing your financial space</div>
    </div>
  );
}

export function CursorScene() {
  useEffect(() => {
    const root = document.documentElement;
    const move = (e: PointerEvent) => {
      root.style.setProperty('--mx', `${e.clientX}px`);
      root.style.setProperty('--my', `${e.clientY}px`);
      root.style.setProperty('--rx', `${(e.clientY / window.innerHeight - .5) * -7}deg`);
      root.style.setProperty('--ry', `${(e.clientX / window.innerWidth - .5) * 9}deg`);
    };
    window.addEventListener('pointermove', move);
    return () => window.removeEventListener('pointermove', move);
  }, []);
  return <div className="cursor-glow" aria-hidden="true" />;
}
