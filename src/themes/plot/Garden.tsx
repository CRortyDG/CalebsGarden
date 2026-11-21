'use client';

import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { projectLink, site } from '@/projects';
import type { ThemeProps } from '../types';
import { plantGarden } from './engine';
import { beds } from './layout';

const top = (b: { x: number; y: number; w: number }) => ({ x: `${(b.x + b.w / 2) * 100}%`, y: `${b.y * 100}%` });

export function Garden({ projects, openProject }: ThemeProps) {
  const ref = useRef<HTMLElement>(null);
  const planted = projects.filter((p) => beds[p.id]);

  useEffect(() => {
    if (!ref.current) return;
    return plantGarden(
      ref.current,
      projects
        .filter((p) => beds[p.id])
        .map((p) => ({ id: p.id, clickable: p.type !== 'empty', ...beds[p.id] })),
      (id) => {
        const p = projects.find((x) => x.id === id);
        if (p?.type === 'project') openProject(id);
        else if (p?.href) window.location.assign(p.href);
      },
    );
  }, [projects, openProject]);

  return (
    <section className="garden" ref={ref} aria-label="The garden">
      <canvas aria-hidden="true" />

      <header className="gate">
        <h1>{site.name}</h1>
        <p>{site.tagline}</p>
      </header>

      {planted.map((p) => {
        const w = top(beds[p.id].wide);
        const t = top(beds[p.id].tall);
        const style = { '--wx': w.x, '--wy': w.y, '--tx': t.x, '--ty': t.y } as CSSProperties;
        const href = projectLink(p);
        const inner = (
          <>
            {p.blurb && <em>{p.blurb}</em>}
            <b>{p.name}</b>
            <i />
          </>
        );
        return href ? (
          <a key={p.id} className="stake" href={href} style={style} data-bed={p.id}>
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
    </section>
  );
}
