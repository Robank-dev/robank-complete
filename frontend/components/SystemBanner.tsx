'use client';

import { useEffect, useState } from 'react';

const slides = [
  { eyebrow: 'ROBANK / FINANCIAL OPERATING LAYER', title: 'Your account. Assets. Payments. One system.', detail: 'A single operating surface for capital and agent-assisted actions.' },
  { eyebrow: 'ROBANK / MONEY RAILS', title: 'Move between bank and crypto rails.', detail: 'Fund a wallet, fund a bank, or send value from one place.' },
  { eyebrow: 'ROBANK / AGENT', title: 'Intent in. Controlled execution out.', detail: 'Ask ROBANK to prepare actions, review them, then approve.' },
];

export default function SystemBanner() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % slides.length), 6500);
    return () => window.clearInterval(timer);
  }, []);

  const move = (direction: number) => setIndex((value) => (value + direction + slides.length) % slides.length);

  const slide = slides[index];
  return (
    <div className="ro-banner-carousel" aria-label="ROBANK highlights">
      <img src="/robank-banner-hero.svg" alt="" className="ro-banner-image active" />
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
