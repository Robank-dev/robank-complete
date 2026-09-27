'use client';

import { useEffect, useRef, useState } from 'react';

const finePointer = () => window.matchMedia('(pointer: fine)').matches;
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Landing-page interaction layer: click ripples, scroll reveals, a soft pointer
 * spotlight, pointer tilt for [data-tilt] and hero parallax. The cursor itself is a
 * native CSS cursor (see landing.css), so it never lags behind the pointer. Pointer
 * effects only run for fine pointers; motion is skipped for reduced-motion users.
 */
export function LandingFx() {
  const spot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reveal = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); reveal.unobserve(e.target); }
    }, { threshold: 0.14, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('[data-reveal]').forEach((el) => reveal.observe(el));
    if (reducedMotion()) {
      document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('in'));
      return () => reveal.disconnect();
    }

    const cleanups: (() => void)[] = [() => reveal.disconnect()];

    const ripple = (e: PointerEvent) => {
      const r = document.createElement('span');
      r.className = 'lp-ripple';
      r.style.left = `${e.clientX}px`;
      r.style.top = `${e.clientY}px`;
      document.body.appendChild(r);
      r.addEventListener('animationend', () => r.remove(), { once: true });
    };
    window.addEventListener('pointerdown', ripple, { passive: true });
    cleanups.push(() => window.removeEventListener('pointerdown', ripple));

    if (finePointer()) {
      // Spotlight + hero parallax, updated at most once per frame and only while the pointer moves.
      let x = 0, y = 0, sx = innerWidth / 2, sy = innerHeight / 2, frame = 0, easing = 0;
      const hero = document.querySelector<HTMLElement>('.lp-hero');
      const tick = () => {
        sx += (x - sx) * 0.35; sy += (y - sy) * 0.35;
        if (spot.current) spot.current.style.transform = `translate3d(${sx}px,${sy}px,0)`;
        if (hero) {
          hero.style.setProperty('--px', (x / innerWidth - 0.5).toFixed(3));
          hero.style.setProperty('--py', (y / innerHeight - 0.5).toFixed(3));
        }
        frame = Math.abs(x - sx) + Math.abs(y - sy) > 0.5 && ++easing < 40 ? requestAnimationFrame(tick) : 0;
      };
      const move = (e: PointerEvent) => {
        x = e.clientX; y = e.clientY; easing = 0;
        spot.current?.classList.add('on');
        if (!frame) frame = requestAnimationFrame(tick);
      };
      const leave = () => spot.current?.classList.remove('on');
      window.addEventListener('pointermove', move, { passive: true });
      document.documentElement.addEventListener('pointerleave', leave);
      cleanups.push(() => {
        cancelAnimationFrame(frame);
        window.removeEventListener('pointermove', move);
        document.documentElement.removeEventListener('pointerleave', leave);
      });

      document.querySelectorAll<HTMLElement>('[data-tilt]').forEach((el) => {
        const max = Number(el.dataset.tilt) || 8;
        const target = el.querySelector<HTMLElement>('[data-tilt-target]') || el;
        let raf = 0, box: DOMRect | null = null, ex = 0, ey = 0;
        const apply = () => {
          raf = 0;
          if (!box) return;
          const px = (ex - box.left) / box.width, py = (ey - box.top) / box.height;
          target.style.setProperty('--tx', `${((0.5 - py) * max).toFixed(2)}deg`);
          target.style.setProperty('--ty', `${((px - 0.5) * max).toFixed(2)}deg`);
          target.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`);
          target.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`);
        };
        const onMove = (e: PointerEvent) => {
          if (!box) { box = el.getBoundingClientRect(); target.classList.add('tilting'); }
          ex = e.clientX; ey = e.clientY;
          if (!raf) raf = requestAnimationFrame(apply);
        };
        const onLeave = () => {
          box = null;
          cancelAnimationFrame(raf); raf = 0;
          target.style.setProperty('--tx', '0deg');
          target.style.setProperty('--ty', '0deg');
          target.classList.remove('tilting');
        };
        const onScroll = () => { if (box) box = el.getBoundingClientRect(); };
        el.addEventListener('pointermove', onMove);
        el.addEventListener('pointerleave', onLeave);
        window.addEventListener('scroll', onScroll, { passive: true });
        cleanups.push(() => { el.removeEventListener('pointermove', onMove); el.removeEventListener('pointerleave', onLeave); window.removeEventListener('scroll', onScroll); });
      });
    }

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return <div ref={spot} className="lp-spotlight" aria-hidden="true" />;
}

/** Steps 0..count-1 while the element is on screen, holding the last step before looping. */
export function useLoop<T extends HTMLElement>(count: number, stepMs: number, holdMs = 2600) {
  const ref = useRef<T>(null);
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (reducedMotion()) { setStep(count - 1); return; }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, [count]);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setStep((s) => (s + 1) % count), step === count - 1 ? holdMs : stepMs);
    return () => clearTimeout(t);
  }, [visible, step, count, stepMs, holdMs]);

  return [ref, step] as const;
}

/** Types `text` out once `active` turns true; resets when it turns false. */
export function useTypewriter(text: string, active: boolean, speed = 32) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!active) { setN(0); return; }
    if (reducedMotion()) { setN(text.length); return; }
    if (n >= text.length) return;
    const t = setTimeout(() => setN(n + 1), speed);
    return () => clearTimeout(t);
  }, [active, n, text, speed]);
  return text.slice(0, n);
}
