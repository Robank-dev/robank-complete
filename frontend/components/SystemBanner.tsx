'use client';

import { useEffect, useState } from 'react';

const slides = [
  { image: '/robank-banner-global.svg', alt: 'ROBANK global capital rails' },
  { image: '/robank-banner-capital.svg', alt: 'ROBANK capital operating layer' },
  { image: '/robank-banner-agent.svg', alt: 'ROBANK agent operating layer' },
];

export default function SystemBanner() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % slides.length), 6500);
    return () => window.clearInterval(timer);
  }, []);

  const move = (direction: number) => setIndex((value) => (value + direction + slides.length) % slides.length);

  return (
    <div className="ro-banner-carousel" aria-label="ROBANK highlights">
      <button type="button" className="ro-banner-arrow ro-banner-prev" onClick={() => move(-1)} aria-label="Previous banner">‹</button>
      {slides.map((slide, i) => (
        <img key={slide.image} src={slide.image} alt={slide.alt} className={i === index ? 'ro-banner-image active' : 'ro-banner-image'} />
      ))}
      <button type="button" className="ro-banner-arrow ro-banner-next" onClick={() => move(1)} aria-label="Next banner">›</button>
      <div className="ro-banner-dots">
        {slides.map((slide, i) => <button key={slide.image} type="button" onClick={() => setIndex(i)} className={i === index ? 'active' : ''} aria-label={`Show banner ${i + 1}`} />)}
      </div>
    </div>
  );
}
