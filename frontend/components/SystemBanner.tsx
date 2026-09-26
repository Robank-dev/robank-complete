'use client';

import { useEffect, useState } from 'react';

const slides = [
  { eyebrow: 'ROBANK / GLOBAL RAILS', title: 'Financial infrastructure, one surface.', detail: 'Bank rails, stablecoins and digital assets.', image: '/banners/robank-hero-wide.jpg', mode: 'full' },
  { eyebrow: 'ROBANK / GLOBAL PAYMENTS', title: 'Move value across borders.', detail: 'Bank rails, wallets and global settlement.', image: '/banners/robank-global-wide.jpg', mode: 'focus' },
  { eyebrow: 'ROBANK / AI OPERATIONS', title: 'Intent in. Controlled execution out.', detail: 'Prepare, review, approve, execute.', image: '/banners/robank-ai-wide.jpg', mode: 'focus' },
];

export default function SystemBanner() {
  const [index, setIndex] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % slides.length), 6500);
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
