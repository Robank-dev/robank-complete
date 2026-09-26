'use client';

import { useEffect, useState } from 'react';

const slides = [
  { eyebrow: 'ROBANK / ONE ACCOUNT', title: 'Your money, on every network.', detail: 'Stablecoins, gas tokens and tokenized stocks in one view.', image: '/banners/robank-hero-wide.jpg', mode: 'full' },
  { eyebrow: 'ROBANK / GLOBAL TRANSFERS', title: 'Move value across networks.', detail: 'Same-network sends and LI.FI cross-chain routes.', image: '/banners/robank-global-wide.jpg', mode: 'focus' },
  { eyebrow: 'ROBANK / AI OPERATIONS', title: 'Intent in. Controlled execution out.', detail: 'The agent prepares. You review and sign.', image: '/banners/robank-ai-wide.jpg', mode: 'focus' },
];

export default function SystemBanner() {
  const [index, setIndex] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') setIndex((value) => (value + 1) % slides.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => setImageFailed(false), [index]);

  const move = (direction: number) => setIndex((value) => (value + direction + slides.length) % slides.length);
  const slide = slides[index];

  return (
    <div className="ro-banner-carousel" aria-label="ROBANK highlights">
      {!imageFailed ? (
        <img key={slide.image} src={slide.image} alt="" className={`ro-banner-image active ${slide.mode}`} onError={() => setImageFailed(true)} />
      ) : (
        <div className="ro-banner-image ro-banner-fallback" aria-hidden="true" />
      )}
      <div className="ro-banner-shade" />
      <div className="ro-banner-copy">
        <span>{slide.eyebrow}</span>
        <strong>{slide.title}</strong>
        <small>{slide.detail}</small>
      </div>
      <button type="button" className="ro-banner-arrow ro-banner-prev" onClick={() => move(-1)} aria-label="Previous banner">‹</button>
      <button type="button" className="ro-banner-arrow ro-banner-next" onClick={() => move(1)} aria-label="Next banner">›</button>
      <div className="ro-banner-dots">
        {slides.map((item, i) => <button key={item.eyebrow} type="button" onClick={() => setIndex(i)} className={i === index ? 'active' : ''} aria-label={"Show banner " + (i + 1)} />)}
      </div>
    </div>
  );
}
