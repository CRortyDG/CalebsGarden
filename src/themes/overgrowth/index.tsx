'use client';

import './overgrowth.css';
import { useEffect, useRef } from 'react';
import { site } from '@/projects';
import { ProjectDetails } from '@/site/ProjectDetails';
import type { ThemeProps } from '../types';
import { Flower } from './Flower';
import { growStem } from './stem';
import { growVines } from './vines';

/**
 * Overgrowth: an ordinary scrolling page. The name and a labelled bud per
 * project are on the first screen; scrolling grows a stem down the page and
 * each project is a section branching off it; the page ends below ground.
 * All the text is real page text. The stem and vines are decoration on top.
 */
export default function Overgrowth({ projects }: ThemeProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const stopStem = growStem(root);
    const stopVines = growVines(root.querySelector<HTMLElement>('.og-hero')!);
    // a shared link such as ?theme=overgrowth#candlefair lands on that section
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (id) document.getElementById(id)?.scrollIntoView();
    return () => {
      stopStem();
      stopVines();
    };
  }, []);

  return (
    <div className="og" ref={ref}>
      <svg className="og-stemlayer" aria-hidden="true" />

      <header className="og-hero">
        <canvas aria-hidden="true" />
        <h1>{site.name}</h1>
        <p className="og-tagline">{site.tagline}</p>
        <nav className="og-buds" aria-label="Projects">
          {projects.map(
            (p, i) =>
              p.type !== 'empty' && (
                <a key={p.id} className="og-bud" href={`#${p.id}`}>
                  <Flower status={p.status} tone={i} size={22} />
                  {p.name}
                </a>
              ),
          )}
        </nav>
      </header>

      <div className="og-rows">
        {projects.map((p, i) => (
          <section key={p.id} id={p.id} className={`og-row ${i % 2 ? 'is-left' : 'is-right'}`} aria-labelledby={`og-${p.id}`}>
            <span className="og-flower">
              <Flower status={p.status} tone={i} />
            </span>
            <div className={`og-card ${p.type === 'project' ? '' : 'is-small'}`}>
              {p.type === 'project' ? (
                <ProjectDetails project={p} titleId={`og-${p.id}`} />
              ) : (
                <div className="sheet-body">
                  <h2 id={`og-${p.id}`}>{p.name}</h2>
                  {p.blurb && <p className="sheet-blurb">{p.blurb}</p>}
                  {p.about && <p className="sheet-about">{p.about}</p>}
                  {p.href && (
                    <div className="sheet-actions">
                      <a className="button is-primary" href={p.href}>
                        Open {p.name.toLowerCase()}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        ))}
      </div>

      <footer className="og-ground">
        <nav className="og-roots" aria-label="More">
          {site.links.map((l) => (
            <a key={l.href} className="og-root-tip" href={l.href}>
              {l.label}
            </a>
          ))}
          <a className="og-root-tip" href="/case-studies/">
            Case studies
          </a>
          <a className="og-root-tip" href="#top" onClick={(e) => (e.preventDefault(), window.scrollTo({ top: 0 }))}>
            Back to the top
          </a>
        </nav>
        <p>
          © {new Date().getFullYear()} Caleb · {site.name}
        </p>
      </footer>
    </div>
  );
}
