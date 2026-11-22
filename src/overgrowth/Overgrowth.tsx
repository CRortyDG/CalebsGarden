'use client';

import './overgrowth.css';
import { useEffect, useRef, useState } from 'react';
import { about, experience, site, type Project } from '@/projects';
import { ProjectDetails } from '@/site/ProjectDetails';
import { ProjectList } from '@/site/ProjectList';
import { Flower } from './Flower';
import { growStem } from './stem';
import { growVines } from './vines';

/**
 * Overgrowth: an ordinary scrolling page. The name and a labelled bud per
 * project are on the first screen; scrolling grows a stem down the page and
 * each project is a section branching off it; the page ends below ground.
 * All the text is real page text. The stem and vines are decoration on top.
 */
export function Overgrowth({ projects }: { projects: Project[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const indexRef = useRef<HTMLDialogElement>(null);
  const regrowRef = useRef<() => void>(() => {});
  const [indexOpen, setIndexOpen] = useState(false);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const stem = growStem(root);
    const vines = growVines(root.querySelector<HTMLElement>('.og-hero')!);
    regrowRef.current = () => {
      stem.regrow();
      vines.regrow();
    };
    // a shared link such as calebs.garden/#candlefair lands on that section
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (id) document.getElementById(id)?.scrollIntoView();
    return () => {
      stem.stop();
      vines.stop();
    };
  }, []);

  useEffect(() => {
    const dialog = indexRef.current;
    if (!dialog) return;
    if (indexOpen && !dialog.open) dialog.showModal();
    if (!indexOpen && dialog.open) dialog.close();
  }, [indexOpen]);

  return (
    <>
      <div className="og" ref={ref}>
        <svg className="og-stemlayer" aria-hidden="true" />

        <header className="og-hero">
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
          <h1>{site.headline}</h1>
          <p className="og-tagline">{site.intro}</p>
          <nav className="og-buds" aria-label="Projects">
            {projects.map(
              (p) =>
                p.type !== 'empty' && (
                  <a key={p.id} className="og-bud" href={`#${p.id}`}>
                    <span className="og-bud-name">{p.name}</span>
                    {p.blurb && <span className="og-bud-note">{p.blurb}</span>}
                    <span className="og-bud-arrow" aria-hidden="true">
                      ↓
                    </span>
                  </a>
                ),
            )}
          </nav>
        </header>

        <div className="og-rows">
          {projects.map((p, i) => (
            <section
              key={p.id}
              id={p.id}
              className={`og-row ${i % 2 ? 'is-left' : 'is-right'}`}
              aria-labelledby={`og-${p.id}`}
            >
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
            <a className="og-root-tip" href="/notes">
              Notes
            </a>
            <a className="og-root-tip" href="#experience">
              Experience
            </a>
            <a className="og-root-tip" href="#top" onClick={(e) => (e.preventDefault(), window.scrollTo({ top: 0 }))}>
              Back to the top
            </a>
          </nav>
          <section id="experience" className="og-jobs" aria-labelledby="og-jobs-title">
            <h2 id="og-jobs-title">Roots</h2>
            <p className="og-jobs-about">{about}</p>
            <ol>
              {experience.map((j) => (
                <li key={j.org + j.when} className="og-job">
                  <span className="og-job-when">{j.when}</span>
                  <span className="og-job-role">{j.role}</span>
                  <span className="og-job-org">{j.org}</span>
                </li>
              ))}
            </ol>
          </section>
          <p>
            © {new Date().getFullYear()} Caleb · {site.name}
          </p>
        </footer>
      </div>

      <nav className="chrome" aria-label="Site">
        <button type="button" onClick={() => setIndexOpen(true)}>
          Index
        </button>
        <button
          type="button"
          onClick={() => regrowRef.current()}
          title="Grow the vines and the stem again, a little differently"
        >
          <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
            <path
              d="M8 15V7M8 9C8 5 5 4 2 4c0 3 2 5 6 5M8 7c0-3 2.5-5 6-5 0 3.5-2.5 5-6 5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Regrow
        </button>
      </nav>

      <dialog
        ref={indexRef}
        className="index-panel"
        aria-labelledby="index-title"
        onClose={() => setIndexOpen(false)}
        onClick={(e) => {
          // the backdrop, or any link (the page then scrolls to that project)
          if (e.target === indexRef.current || (e.target as Element).closest('a')) setIndexOpen(false);
        }}
      >
        <button className="sheet-close" type="button" onClick={() => setIndexOpen(false)} aria-label="Close">
          ×
        </button>
        <h2 id="index-title">Index</h2>
        <ProjectList projects={projects} />
      </dialog>
    </>
  );
}
