'use client';

import '@/overgrowth/overgrowth.css';
import './not-found.css';
import { useEffect, useRef, useState } from 'react';
import { site } from '@/projects';
import { Flower } from '@/overgrowth/Flower';
import { growVines } from '@/overgrowth/vines';

/**
 * The 404 page: the home page's first screen with an empty pot in the middle.
 * The vines are the home page's (they keep clear of the pot and the words, and
 * clicking bare ground plants a sprout). "Plant something" grows a flower in
 * the pot, a different colour each time.
 */
const LINKS = [
  { href: '/', name: 'The garden', note: 'back to the start' },
  { href: '/notes', name: 'Notes', note: 'shorter, dated posts' },
  { href: '/case-studies', name: 'Case studies', note: 'the long write-ups' },
];

export function NotFound() {
  const heroRef = useRef<HTMLElement>(null);
  const [planted, setPlanted] = useState(0); // how many times something's been planted
  const [growing, setGrowing] = useState(false);
  const [tone, setTone] = useState(0);

  useEffect(() => {
    if (!heroRef.current) return;
    const vines = growVines(heroRef.current);
    return vines.stop;
  }, []);

  const plant = () => {
    // pull up whatever's there, then grow the next one on the frame after
    setGrowing(false);
    setTone((t) => (planted === 0 ? Math.floor(Math.random() * 5) : t + 1 + Math.floor(Math.random() * 3)));
    setPlanted((n) => n + 1);
    requestAnimationFrame(() => requestAnimationFrame(() => setGrowing(true)));
  };

  return (
    <div className="og nf">
      <header className="og-hero" ref={heroRef}>
        <canvas aria-hidden="true" />
        <a className="og-mark" href="/" aria-label={`${site.name}, home`}>
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
          {site.name}
        </a>

        {/* og-buds so the vines keep clear of the pot, as they do of the buds on the home page */}
        <div className="og-buds nf-pot">
          <svg className={growing ? 'nf-art is-growing' : 'nf-art'} viewBox="0 0 160 170" width="160" height="170" aria-hidden="true">
            {/* the stake, pushed in at a lean */}
            <g transform="rotate(9 118 96)">
              <rect className="nf-stake" x="115" y="58" width="5" height="44" rx="1.5" />
              <rect className="nf-tag" x="100" y="44" width="36" height="20" rx="3" />
              <text className="nf-tag-text" x="118" y="58.5" textAnchor="middle">
                404
              </text>
            </g>
            {/* the sprout, drawn in when something's planted */}
            <g className="nf-sprout" key={planted}>
              <path className="nf-stem" pathLength={1} d="M72 92 C70 76 76 64 72 50 C69 40 72 32 72 28" />
              <g transform="translate(71 72) rotate(-28)">
                <ellipse className="nf-leaf nf-leaf-l" cx="-10" cy="0" rx="10" ry="4.5" />
              </g>
              <g transform="translate(73 60) rotate(24)">
                <ellipse className="nf-leaf nf-leaf-r" cx="9" cy="0" rx="9" ry="4" />
              </g>
              <g className="nf-bloom">
                <g transform="translate(52 6)">
                  <Flower status="evergreen" tone={tone} size={40} />
                </g>
              </g>
            </g>
            {/* the pot */}
            <ellipse className="nf-soil" cx="72" cy="94" rx="46" ry="8" />
            <circle className="nf-speck" cx="56" cy="94" r="1.4" />
            <circle className="nf-speck" cx="80" cy="96" r="1.2" />
            <circle className="nf-speck" cx="95" cy="92" r="1" />
            <path className="nf-pot-body" d="M30 104 L114 104 L104 160 Q103 164 99 164 L45 164 Q41 164 40 160 Z" />
            <path className="nf-pot-shade" d="M92 104 L114 104 L104 160 Q103 164 99 164 L90 164 Z" />
            <rect className="nf-pot-rim" x="22" y="92" width="100" height="16" rx="3" />
          </svg>
          <button type="button" className="nf-plant" onClick={plant}>
            {planted ? 'Plant another' : 'Plant something'}
          </button>
        </div>

        <h1>Nothing&apos;s growing here yet.</h1>
        <p className="og-tagline">
          There&apos;s no page at this address. The link might have a typo, the page might have moved, or it&apos;s a note that hasn&apos;t come up yet: some are
          planted with a date and sprout on their day.
        </p>

        <nav className="og-buds" aria-label="Places to go instead">
          {LINKS.map((l) => (
            <a key={l.href} className="og-bud" href={l.href}>
              <span className="og-bud-name">{l.name}</span>
              <span className="og-bud-note">{l.note}</span>
              <span className="og-bud-arrow" aria-hidden="true">
                →
              </span>
            </a>
          ))}
        </nav>
      </header>
    </div>
  );
}
