'use client';

import '../overgrowth/overgrowth.css';
import { useEffect, useRef } from 'react';
import { growVines, seedFrom } from '../overgrowth/vines';
import type { Card } from './cards';

/** One 1200×630 link-preview card, for `npm run og` to photograph. */
export function OgCard({ card }: { card: Card }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const hero = ref.current;
    if (!hero) return;
    const vines = growVines(hero, 'hero', seedFrom(card.key));
    // the vines start once the fonts are in; with reduced motion they grow all at once
    document.fonts.ready.then(() => setTimeout(() => hero.setAttribute('data-grown', ''), 300));
    return vines.stop;
  }, [card.key]);
  const size = card.title.length > 44 ? 'is-long' : card.title.length > 26 ? 'is-mid' : '';
  return (
    <div className="og og-share">
      <header className="og-hero" ref={ref}>
        <canvas aria-hidden="true" />
        <span className="og-mark">
          <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
            <path
              d="M8 15V7M8 9C8 5 5 4 2 4c0 3 2 5 6 5M8 7c0-3 2.5-5 6-5 0 3.5-2.5 5-6 5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          calebs.garden
        </span>
        <p className="og-tagline og-share-label">{card.label}</p>
        <h1 className={size}>{card.title}</h1>
      </header>
    </div>
  );
}
