'use client';

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { projectLink, site } from '@/projects';
import type { ThemeProps } from '../types';
import { plantGarden } from './engine';
import { beds, type BedRect } from './layout';

const top = (b: { x: number; y: number; w: number }) => ({ x: `${(b.x + b.w / 2) * 100}%`, y: `${b.y * 100}%` });

/**
 * Where the map moves to so one bed sits large beside the project sheet. The
 * sheet takes the side of the screen the bed is not on, so the map never has
 * to slide past its own edge.
 */
function glideTo(b: BedRect): { transform: string; sheet: 'left' | 'right' } {
  const scale = Math.max(1.15, Math.min(2, 0.42 / b.w, 0.62 / b.h));
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  const sheet = cx > 0.5 ? 'left' : 'right';
  const clamp = (v: number) => Math.max(1 - scale, Math.min(0, v));
  const x = clamp((sheet === 'left' ? 0.7 : 0.3) - cx * scale);
  const y = clamp(0.5 - cy * scale);
  return { transform: `translate(${(x * 100).toFixed(2)}%, ${(y * 100).toFixed(2)}%) scale(${scale.toFixed(3)})`, sheet };
}

export function Garden({ projects, openProject, openId }: ThemeProps) {
  const ref = useRef<HTMLElement>(null);
  const planted = projects.filter((p) => beds[p.id]);
  const [glide, setGlide] = useState<string | null>(null);

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

  // While a project is open on a wide screen, the map glides in on its bed.
  useEffect(() => {
    const bed = openId ? beds[openId] : null;
    const wide = matchMedia('(min-width: 900px) and (orientation: landscape)').matches;
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const to = bed && wide ? glideTo(bed.wide) : null;
    setGlide(to && !still ? to.transform : null);
    // tell the shared sheet which side to open on
    const site = ref.current?.closest<HTMLElement>('.site');
    if (!site || !to) return;
    site.dataset.sheetSide = to.sheet;
  }, [openId]);

  useEffect(() => {
    const site = ref.current?.closest<HTMLElement>('.site');
    return () => {
      delete site?.dataset.sheetSide;
    };
  }, []);

  return (
    <section className="garden" ref={ref} aria-label="The garden">
      <div className="garden-view" style={glide ? { transform: glide } : undefined}>
        <canvas aria-hidden="true" />

        {planted.map((p, i) => {
          const w = top(beds[p.id].wide);
          const t = top(beds[p.id].tall);
          const style = { '--wx': w.x, '--wy': w.y, '--tx': t.x, '--ty': t.y } as CSSProperties;
          const href = projectLink(p);
          const inner = (
            <>
              {p.blurb && <em>{p.blurb}</em>}
              <b>
                <span className="num" aria-hidden="true">
                  {i + 1}
                </span>
                {p.name}
              </b>
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
      </div>

      <header className="gate">
        <h1>{site.name}</h1>
        <p>{site.tagline}</p>
      </header>

      {/* the key: the same numbers as the stakes, like the legend of a park map */}
      <nav className="key" aria-label="In the garden">
        <h2>In the garden</h2>
        <ol>
          {planted.map((p, i) => {
            const href = projectLink(p);
            const inner = (
              <>
                <span className="num" aria-hidden="true">
                  {i + 1}
                </span>
                {p.name}
              </>
            );
            return (
              <li key={p.id}>
                {href ? (
                  <a href={href} data-bed={p.id}>
                    {inner}
                  </a>
                ) : (
                  <span className="is-empty" data-bed={p.id}>
                    {inner}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <button className="time" type="button" hidden>
        Day
      </button>
    </section>
  );
}
