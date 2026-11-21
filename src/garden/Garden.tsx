'use client';

import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { projects } from '@/projects';
import { plantGarden } from './engine';

const top = (b: { x: number; y: number; w: number }) => ({ x: `${(b.x + b.w / 2) * 100}%`, y: `${b.y * 100}%` });

export function Garden() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    return plantGarden(
      ref.current,
      projects.map(({ id, kind, href, wide, tall }) => ({ id, kind, href, wide, tall })),
    );
  }, []);

  return (
    <section className="garden" ref={ref} aria-label="The garden">
      <canvas aria-hidden="true" />

      <header className="gate">
        <h1>calebs.garden</h1>
        <p>a garden of things I&apos;ve made</p>
      </header>

      {projects.map((p) => {
        const w = top(p.wide);
        const t = top(p.tall);
        const style = { '--wx': w.x, '--wy': w.y, '--tx': t.x, '--ty': t.y } as CSSProperties;
        const inner = (
          <>
            {p.blurb !== p.name && <em>{p.blurb}</em>}
            <b>{p.name}</b>
            <i />
          </>
        );
        return p.href ? (
          <a key={p.id} className="stake" href={p.href} style={style} data-bed={p.id}>
            {inner}
          </a>
        ) : (
          <span key={p.id} className="stake is-empty" style={style} data-bed={p.id}>
            {inner}
          </span>
        );
      })}

      <button className="time" type="button" hidden>
        Day
      </button>
      <p className="hint" hidden />
      <a className="down" href="#growing">
        What&apos;s growing <span aria-hidden="true">↓</span>
      </a>
    </section>
  );
}
