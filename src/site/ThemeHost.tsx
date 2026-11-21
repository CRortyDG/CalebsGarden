'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import { projects } from '@/projects';
import { pickTheme, switchTheme, themes } from '@/themes/registry';
import type { ThemeDef, ThemeProps } from '@/themes/types';
import { ProjectList } from './PlainIndex';
import { ProjectSheet } from './ProjectSheet';

const sheetFor = (id: string) => projects.find((p) => p.id === id && p.type === 'project') ?? null;

/**
 * Picks this visit's theme, loads it, and supplies the parts every theme
 * shares: the project sheet, the Index and the Scenery menu. Until a theme has
 * loaded (or if it fails to), the server-rendered plain page stays in place.
 */
export function ThemeHost() {
  const [theme, setTheme] = useState<ThemeDef | null>(null);
  const [Scene, setScene] = useState<ComponentType<ThemeProps> | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [indexOpen, setIndexOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const pushed = useRef(false);
  // inline themes lay projects out on the page, so `#project` links just scroll there
  const inline = theme?.sheets === 'inline';
  // only themes without their own way of showing a project get the shared sheet
  const sharedSheet = !theme?.sheets || theme.sheets === 'dialog';
  const inlineRef = useRef(false);
  useEffect(() => {
    inlineRef.current = inline;
  }, [inline]);
  const indexRef = useRef<HTMLDialogElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // 1. pick the theme
  useEffect(() => {
    setTheme(pickTheme());
  }, []);

  // 2. load it; only that theme's code is downloaded
  useEffect(() => {
    if (!theme) return;
    let live = true;
    theme
      .load()
      .then((m) => {
        if (live) setScene(() => m.default);
      })
      .catch(() => {
        if (live) setFailed(true);
      });
    return () => {
      live = false;
    };
  }, [theme]);

  // 3. the server's plain page steps aside for the theme, and comes back if the theme can't load
  useEffect(() => {
    const plain = document.getElementById('plain');
    if (plain) plain.hidden = theme !== null && !failed;
    document.documentElement.classList.toggle('no-theme', failed);
  }, [theme, failed]);

  // The open project lives in the URL hash, so links can be shared and Back closes the sheet.
  useEffect(() => {
    const read = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      setOpenId(sheetFor(id) ? id : null);
      if (sheetFor(id)) setIndexOpen(false);
    };
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);

  const openProject = useCallback((id: string) => {
    if (!sheetFor(id)) return;
    pushed.current = !inlineRef.current;
    window.location.hash = id;
  }, []);

  const closeProject = useCallback(() => {
    if (pushed.current) {
      pushed.current = false;
      window.history.back();
    } else {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      setOpenId(null);
    }
  }, []);

  // Any `#project` link on the page opens the sheet.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const a = (e.target as Element).closest?.('a[href^="#"]');
      const id = a?.getAttribute('href')?.slice(1);
      if (!id || !sheetFor(id)) return;
      if (inlineRef.current) {
        // the browser scrolls to the project; just get the Index out of the way
        setIndexOpen(false);
        return;
      }
      e.preventDefault();
      openProject(id);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [openProject]);

  // Index panel
  useEffect(() => {
    const dialog = indexRef.current;
    if (!dialog) return;
    if (indexOpen && !dialog.open) dialog.showModal();
    if (!indexOpen && dialog.open) dialog.close();
  }, [indexOpen]);

  // Scenery menu closes on outside click or Esc
  useEffect(() => {
    if (!menuOpen) return;
    const away = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', away);
      document.removeEventListener('keydown', esc);
    };
  }, [menuOpen]);

  const choose = (to: string | 'random') => {
    if (!theme) return;
    setMenuOpen(false);
    const next = switchTheme(theme.id, to);
    if (next.id === theme.id) return;
    setScene(null);
    setFailed(false);
    setTheme(next);
  };

  const listed = themes.filter((t) => t.enabled || t.id === theme?.id || t.id === 'plain');
  const canShuffle = themes.filter((t) => t.enabled).length > 1;

  return (
    <div className="site" data-theme={theme?.id}>
      {Scene && !failed && (
        <Scene projects={projects} openProject={openProject} openId={openId} closeProject={closeProject} />
      )}

      {theme && (
        <nav className="chrome" aria-label="Site">
          <button type="button" onClick={() => setIndexOpen(true)}>
            Index
          </button>
          <div className="scenery" ref={menuRef}>
            <button type="button" aria-haspopup="true" aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}>
              Scenery
            </button>
            {menuOpen && (
              <div className="scenery-menu" role="group" aria-label="Choose the scenery">
                {listed.map((t) => (
                  <button key={t.id} type="button" aria-pressed={t.id === theme.id} onClick={() => choose(t.id)}>
                    <b>{t.name}</b>
                    <span>{t.blurb}</span>
                  </button>
                ))}
                {canShuffle && (
                  <button type="button" onClick={() => choose('random')}>
                    <b>Surprise me</b>
                    <span>A different one at random</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </nav>
      )}

      <ProjectSheet project={openId && sharedSheet ? sheetFor(openId) : null} onClose={closeProject} />

      <dialog
        ref={indexRef}
        className="index-panel"
        aria-labelledby="index-title"
        onClose={() => setIndexOpen(false)}
        onClick={(e) => {
          if (e.target === indexRef.current) setIndexOpen(false);
        }}
      >
        <button className="sheet-close" type="button" onClick={() => setIndexOpen(false)} aria-label="Close">
          ×
        </button>
        <h2 id="index-title">Index</h2>
        <ProjectList projects={projects} mode="sheet" />
      </dialog>
    </div>
  );
}
