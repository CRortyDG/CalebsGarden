'use client';

import { useEffect, useState } from 'react';

/*
  A cut-down version of the giggly radio prototype: what the screen in a café would show.
  Every band, song, venue and show here is made up.
*/

type Track = { band: string; song: string; genre: string; day: string; venue: string; time: string; price: string };

const TRACKS: Track[] = [
  { band: 'Low Lake Choir', song: 'Ice on the Lake', genre: 'indie folk', day: 'Fri Dec 4', venue: 'The Lantern Room', time: '8:00 PM doors', price: '$12 advance' },
  { band: 'Willow St. Ghosts', song: 'Last Bus East', genre: 'garage rock', day: 'Sat Dec 5', venue: 'Corner Bar', time: '9:30 PM', price: '$8 at the door' },
  { band: 'June Hollow', song: 'Glass Porch', genre: 'dream pop', day: 'Thu Dec 10', venue: 'Eastside Hall', time: '7:00 PM', price: 'Sliding scale' },
  { band: 'Paper Ferris', song: 'Downtown, 2 AM', genre: 'power pop', day: 'Fri Dec 4', venue: 'The Lantern Room', time: '8:00 PM doors', price: '$12 advance' },
];

const SECONDS = 12;
const TONES = ['var(--cs-rust)', 'var(--cs-moss)', 'var(--cs-sky)', 'var(--lamp)'];

function Cover({ i, band }: { i: number; band: string }) {
  const a = TONES[i % TONES.length];
  const b = TONES[(i + 2) % TONES.length];
  const initials = band.split(/\s+/).map((w) => w[0]).join('').slice(0, 2);
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <rect width="100" height="100" fill="var(--cs-raised)" />
      {i % 2 === 0 ? <circle cx="40" cy="42" r="26" fill={a} /> : <path d="M0 72 Q 50 22 100 62 V100 H0Z" fill={a} />}
      <rect x="0" y={i % 2 === 0 ? 74 : 86} width="100" height="30" fill={b} opacity="0.8" />
      <text x="8" y="94" fontSize="12" fontWeight="700" fill="var(--night)">
        {initials}
      </text>
    </svg>
  );
}

/** A made-up QR-ish pattern: decoration, not a real code. */
function FakeQr() {
  const cells: React.ReactNode[] = [];
  for (let y = 0; y < 13; y++)
    for (let x = 0; x < 13; x++) {
      const finder = (x < 4 && y < 4) || (x > 8 && y < 4) || (x < 4 && y > 8);
      const on = finder ? x % 3 !== 1 || y % 3 !== 1 : ((x * 7 + y * 11 + x * y) % 5) < 2;
      if (on) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />);
    }
  return (
    <svg viewBox="-1 -1 15 15" aria-hidden="true">
      <rect x="-1" y="-1" width="15" height="15" fill="var(--ink)" />
      <g fill="var(--night)">{cells}</g>
    </svg>
  );
}

export default function CafeScreen() {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [t, setT] = useState(0);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setT((s) => s + 0.25), 250);
    return () => clearInterval(id);
  }, [playing]);

  useEffect(() => {
    if (t >= SECONDS) {
      setI((n) => (n + 1) % TRACKS.length);
      setT(0);
    }
  }, [t]);

  const go = (d: number) => {
    setI((n) => (n + d + TRACKS.length) % TRACKS.length);
    setT(0);
  };
  const tr = TRACKS[i];

  return (
    <section className="cs-demo" aria-labelledby="cafe-screen">
      <div className="cs-demo-head">
        <h3 id="cafe-screen">What the café&apos;s screen would show</h3>
        <span className="cs-demo-tag">Prototype · made-up bands</span>
      </div>
      <div className="gr-tv" aria-live="polite">
        <div className="gr-bar">
          <span className="gr-live">
            <i aria-hidden="true" /> giggly radio · local music
          </span>
          <span>Playing at your café</span>
        </div>
        <div className="gr-np">
          <div className="gr-art" key={`a${i}`}>
            <Cover i={i} band={tr.band} />
          </div>
          <div className="gr-meta" key={`m${i}`}>
            <div className="gr-lbl">Now playing</div>
            <div className="gr-band">{tr.band}</div>
            <div className="gr-song">&ldquo;{tr.song}&rdquo;</div>
            <div className="gr-genre">{tr.genre}</div>
            <div className="gr-prog">
              <i style={{ width: `${(t / SECONDS) * 100}%` }} />
            </div>
          </div>
        </div>
        <div className="gr-card">
          <div className="gr-lbl is-hot">See them live</div>
          <div className="gr-when">{tr.day}</div>
          <div className="gr-where">{tr.venue}</div>
          <div className="gr-det">
            {tr.time} · {tr.price}
          </div>
          <div className="gr-qrrow">
            <div className="gr-qr">
              <FakeQr />
            </div>
            <div className="gr-scan">
              Scan for tickets
              <small>no app needed</small>
            </div>
          </div>
        </div>
      </div>
      <div className="cs-demo-bar gr-controls">
        <button type="button" className="cs-btn" onClick={() => go(-1)}>
          ◀ Previous
        </button>
        <button type="button" className="cs-btn" onClick={() => setPlaying((p) => !p)} aria-pressed={!playing}>
          {playing ? '❚❚ Pause' : '▶ Play'}
        </button>
        <button type="button" className="cs-btn" onClick={() => go(1)}>
          Next ▶
        </button>
      </div>
    </section>
  );
}
