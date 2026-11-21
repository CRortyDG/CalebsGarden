'use client';

import './orrery.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent, WheelEvent } from 'react';
import { projectLink, site, statusLabel } from '@/projects';
import type { ThemeProps } from '../types';
import { Planet } from './Planet';
import { drawSky } from './sky';

/**
 * Orrery: a carousel in the night sky. One planet sits in front with its
 * name, one line and an Open button; the others wait around the ring with
 * their names showing. Arrows, dots, arrow keys, a swipe or a scroll turn the
 * ring one step. Every planet grows the plant its project has elsewhere.
 */
export default function Orrery({ projects, openId }: ThemeProps) {
  const n = projects.length;
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const sky = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const wheel = useRef({ sum: 0, at: 0 });

  const step = useCallback((by: number) => setActive((a) => (a + by + n) % n), [n]);

  useEffect(() => (sky.current ? drawSky(sky.current) : undefined), []);

  // a project opened from its name, the Index or a shared link comes to the front
  useEffect(() => {
    const i = projects.findIndex((p) => p.id === openId);
    if (i >= 0) setActive(i);
  }, [openId, projects]);

  // arrow keys turn the ring, unless something is open on top or the keys are in use
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      if (document.querySelector('dialog[open]')) return;
      if ((e.target as HTMLElement).closest?.('input, textarea, select, [contenteditable]')) return;
      e.preventDefault();
      step(e.key === 'ArrowRight' ? 1 : -1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [step]);

  const onDown = (e: PointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY };
    swiped.current = false;
  };
  const onUp = (e: PointerEvent) => {
    const from = drag.current;
    drag.current = null;
    if (!from) return;
    const dx = e.clientX - from.x;
    const dy = e.clientY - from.y;
    if (Math.abs(dx) < 44 || Math.abs(dx) < Math.abs(dy) * 1.3) return;
    swiped.current = true;
    step(dx < 0 ? 1 : -1);
  };
  // one step per scroll gesture, however long the gesture runs
  const onWheel = (e: WheelEvent) => {
    const w = wheel.current;
    const now = performance.now();
    if (now - w.at < 650) return;
    w.sum += Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(w.sum) < 40) return;
    step(w.sum > 0 ? 1 : -1);
    w.sum = 0;
    w.at = now;
  };

  const front = projects[active];
  const frontLink = projectLink(front);
  const diving = !!openId && projects.some((p) => p.id === openId);

  return (
    <div
      className={`or${diving ? ' is-open' : ''}`}
      ref={root}
      style={{ '--turn': active } as CSSProperties}
      onPointerDown={onDown}
      onPointerUp={onUp}
      onPointerCancel={() => (drag.current = null)}
      onWheel={onWheel}
      onClickCapture={(e) => {
        // a swipe that started on a planet is not also a click on it
        if (!swiped.current) return;
        swiped.current = false;
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <canvas className="or-sky" ref={sky} aria-hidden="true" />

      <header className="or-gate">
        <h1>{site.name}</h1>
        <p>{site.tagline}</p>
      </header>

      <ol className="or-ring" aria-label="Projects">
        {projects.map((p, i) => {
          const rel = (((i - active) % n) + n) % n;
          const angle = (rel / n) * Math.PI * 2;
          const cos = Math.cos(angle);
          const depth = Math.pow((1 + cos) / 2, 1.4);
          const style = {
            '--sin': Math.sin(angle).toFixed(4),
            '--cos': cos.toFixed(4),
            '--depth': depth.toFixed(4),
            '--z': Math.round(depth * 10) + 1,
            '--bob': `${(i * -1.7).toFixed(1)}s`,
          } as CSSProperties;
          const isFront = rel === 0;
          const link = projectLink(p);
          const art = <Planet id={p.id} name={p.name} status={p.status} empty={p.type === 'empty'} />;
          return (
            <li key={p.id} className="or-item" data-rel={rel} style={style}>
              {isFront ? (
                link ? (
                  <a className="or-planet" href={link} aria-label={`Open ${p.name}`}>
                    {art}
                  </a>
                ) : (
                  <span className="or-planet">{art}</span>
                )
              ) : (
                <button className="or-planet" type="button" onClick={() => setActive(i)} aria-label={`Bring ${p.name} to the front`}>
                  {art}
                </button>
              )}
              {!isFront &&
                (link ? (
                  <a className="or-name" href={link}>
                    {p.name}
                  </a>
                ) : (
                  <span className="or-name">{p.name}</span>
                ))}
            </li>
          );
        })}
      </ol>

      <div className="or-caption" key={front.id} aria-live="polite">
        {front.type === 'project' && <p className={`status is-${front.status}`}>{statusLabel[front.status]}</p>}
        <h2>{front.name}</h2>
        {front.blurb && <p className="or-blurb">{front.blurb}</p>}
        {front.type === 'empty' && front.about && <p className="or-about">{front.about}</p>}
        {frontLink && (
          <p className="or-actions">
            <a className="button is-primary" href={frontLink}>
              Open {front.name}
            </a>
          </p>
        )}
      </div>

      {/* on a phone the waiting planets are mostly off screen, so the names sit here instead */}
      <nav className="or-names" aria-label="Projects by name">
        <ul>
          {projects.map((p, i) => {
            const link = projectLink(p);
            const current = i === active ? 'true' : undefined;
            return (
              <li key={p.id}>
                {link ? (
                  <a href={link} aria-current={current}>
                    {p.name}
                  </a>
                ) : (
                  <button type="button" aria-current={current} onClick={() => setActive(i)}>
                    {p.name}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="or-controls">
        <button type="button" className="or-arrow" onClick={() => step(-1)} aria-label="Previous project">
          <span aria-hidden="true">‹</span>
        </button>
        <ol className="or-dots">
          {projects.map((p, i) => (
            <li key={p.id}>
              <button type="button" aria-label={p.name} aria-current={i === active ? 'true' : undefined} onClick={() => setActive(i)} />
            </li>
          ))}
        </ol>
        <button type="button" className="or-arrow" onClick={() => step(1)} aria-label="Next project">
          <span aria-hidden="true">›</span>
        </button>
      </div>
    </div>
  );
}
