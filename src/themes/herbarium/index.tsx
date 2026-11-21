'use client';

import './herbarium.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent } from 'react';
import { site, statusLabel } from '@/projects';
import type { ThemeProps } from '../types';
import { Plate } from './Plate';
import { Specimen } from '@/plants/Specimen';
import { drawSpecimen, latinName } from '@/plants/specimen';

/**
 * Herbarium: a field journal with tab dividers. The Projects page holds one
 * specimen sheet per project, each with a pressed plant drawn from the
 * project's name. Picking a sheet up opens it as a full botanical plate, which
 * is this theme's project sheet. Everything is ordinary page text and links.
 */
export default function Herbarium({ projects, openId, closeProject }: ThemeProps) {
  const sheets = projects.filter((p) => p.type !== 'section');
  const sections = projects.filter((p) => p.type === 'section');
  const numbered = projects.filter((p) => p.type === 'project');

  const tabs = useMemo(
    () => [
      { id: 'projects', label: 'Projects' },
      ...sections.map((s) => ({ id: s.id, label: s.name })),
      ...(site.about ? [{ id: 'about', label: 'About' }] : []),
      ...(site.links.length ? [{ id: 'contact', label: 'Contact' }] : []),
    ],
    [sections],
  );
  const [tab, setTab] = useState('projects');
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  // where the sheet was on the page when it was picked up, so the plate can lift from there
  const origin = useRef<{ id: string; rect: DOMRect } | null>(null);

  // a shared link such as ?theme=herbarium#case-studies opens on that tab
  useEffect(() => {
    const read = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (id && id !== 'projects' && tabs.some((t) => t.id === id)) setTab(id);
    };
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, [tabs]);

  const onTabKey = (e: KeyboardEvent) => {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = tabs[(tabs.findIndex((t) => t.id === tab) + step + tabs.length) % tabs.length];
    setTab(next.id);
    tabRefs.current[next.id]?.focus();
  };

  const open = projects.find((p) => p.id === openId && p.type === 'project') ?? null;

  return (
    <div className="hb">
      <div className="hb-journal">
        {tabs.length > 1 && (
          <div className="hb-tabs" role="tablist" aria-label="Pages of the journal" onKeyDown={onTabKey}>
            {tabs.map((t) => (
              <button
                key={t.id}
                ref={(el) => {
                  tabRefs.current[t.id] = el;
                }}
                type="button"
                role="tab"
                id={`hb-tab-${t.id}`}
                aria-selected={tab === t.id}
                aria-controls={`hb-panel-${t.id}`}
                tabIndex={tab === t.id ? 0 : -1}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        <div className="hb-page">
          <header className="hb-head">
            <h1>{site.name}</h1>
            <p className="hb-tagline">{site.tagline}</p>
          </header>

          <section
            className="hb-panel"
            role="tabpanel"
            id="hb-panel-projects"
            aria-labelledby={tabs.length > 1 ? 'hb-tab-projects' : undefined}
            aria-label={tabs.length > 1 ? undefined : 'Projects'}
            hidden={tab !== 'projects'}
          >
            <ul className="hb-sheets">
              {sheets.map((p, i) => {
                const tilt = { '--tilt': `${((i * 37) % 5) * 0.55 - 1.1}deg` } as CSSProperties;
                if (p.type === 'empty') {
                  return (
                    <li key={p.id}>
                      <div className="hb-sheet is-empty" style={tilt}>
                        <span className="hb-mount" aria-hidden="true" />
                        <span className="hb-slip">
                          <b>{p.name}</b>
                          {p.blurb && <i>{p.blurb}</i>}
                          {p.about && <span>{p.about}</span>}
                        </span>
                      </div>
                    </li>
                  );
                }
                const plant = drawSpecimen(p.name, p.status);
                return (
                  <li key={p.id}>
                    <a
                      className={`hb-sheet${openId === p.id ? ' is-lifted' : ''}`}
                      href={`#${p.id}`}
                      style={tilt}
                      onClick={(e) => {
                        origin.current = { id: p.id, rect: e.currentTarget.getBoundingClientRect() };
                      }}
                    >
                      <Specimen plant={plant} className="hb-plant" />
                      <span className={`hb-stamp is-${p.status}`}>{statusLabel[p.status]}</span>
                      <span className="hb-slip">
                        <b style={{ color: plant.ink }}>{p.name}</b>
                        <i>{latinName(p.name, p.status)}</i>
                        {p.blurb && <span>{p.blurb}</span>}
                        <span className="hb-open">
                          Open <span aria-hidden="true">→</span>
                        </span>
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>

          {sections.map((s) => (
            <section
              key={s.id}
              className="hb-panel hb-notes"
              role="tabpanel"
              id={`hb-panel-${s.id}`}
              aria-labelledby={`hb-tab-${s.id}`}
              hidden={tab !== s.id}
            >
              <h2>{s.name}</h2>
              {s.blurb && <p className="hb-typed">{s.blurb}</p>}
              {s.about && <p>{s.about}</p>}
              {s.href && (
                <p>
                  <a className="button is-primary" href={s.href}>
                    Open {s.name.toLowerCase()}
                  </a>
                </p>
              )}
            </section>
          ))}

          {site.about && (
            <section className="hb-panel hb-notes" role="tabpanel" id="hb-panel-about" aria-labelledby="hb-tab-about" hidden={tab !== 'about'}>
              <h2>About</h2>
              <p>{site.about}</p>
            </section>
          )}

          {site.links.length > 0 && (
            <section className="hb-panel hb-notes" role="tabpanel" id="hb-panel-contact" aria-labelledby="hb-tab-contact" hidden={tab !== 'contact'}>
              <h2>Contact</h2>
              <ul className="hb-links">
                {site.links.map((l) => (
                  <li key={l.href}>
                    <a href={l.href}>{l.label}</a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      <Plate
        project={open}
        number={open ? numbered.indexOf(open) + 1 : 0}
        from={open && origin.current?.id === open.id ? origin.current.rect : null}
        onClose={closeProject}
      />
    </div>
  );
}
