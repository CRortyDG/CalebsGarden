import type { ThemeDef } from './types';

// One line per theme. To add one: make src/themes/<id>/index.tsx with a default
// export that takes ThemeProps, add it here, and switch `enabled` on once it
// passes the house rules in docs/house-rules.md.
export const themes: ThemeDef[] = [
  {
    id: 'overgrowth',
    name: 'Overgrowth',
    blurb: 'A page that grows as you scroll',
    enabled: true,
    weight: 1,
    sheets: 'inline',
    load: () => import('./overgrowth'),
  },
  {
    id: 'plot',
    name: 'The Plot',
    blurb: 'A garden map, lit by lantern at night',
    enabled: true,
    weight: 1,
    load: () => import('./plot'),
  },
  {
    id: 'plain',
    name: 'No scenery',
    blurb: 'Just the list',
    enabled: false,
    weight: 0,
    load: () => import('./plain'),
  },
];

const KEY = 'cg-theme';
const byId = (id: string | null | undefined) => themes.find((t) => t.id === id);

const chance = (t: ThemeDef) => (t.weight > 0 ? t.weight : 1);

function randomTheme(not?: string): ThemeDef {
  const on = themes.filter((t) => t.enabled);
  let pool = on.filter((t) => t.id !== not);
  if (!pool.length) pool = on.length ? on : themes;
  let roll = Math.random() * pool.reduce((sum, t) => sum + chance(t), 0);
  for (const t of pool) {
    roll -= chance(t);
    if (roll <= 0) return t;
  }
  return pool[pool.length - 1];
}

function remember(id: string) {
  try {
    sessionStorage.setItem(KEY, id);
  } catch {
    /* storage blocked: the pick just won't survive a reload */
  }
}

/**
 * Which theme this visit gets:
 *   1. `?theme=<id>` if it names a theme (`?theme=random` forces a fresh pick)
 *   2. the theme already picked in this browser tab
 *   3. a weighted random pick from the enabled themes
 */
export function pickTheme(): ThemeDef {
  const asked = new URLSearchParams(window.location.search).get('theme');
  let theme = asked === 'random' ? undefined : byId(asked);
  if (!theme && asked !== 'random') {
    try {
      theme = byId(sessionStorage.getItem(KEY));
    } catch {
      /* ignore */
    }
  }
  theme ??= randomTheme();
  remember(theme.id);
  return theme;
}

/** Scenery menu: switch to a theme (or a random other one) and make the URL shareable. */
export function switchTheme(current: string, to: string | 'random'): ThemeDef {
  const theme = (to === 'random' ? undefined : byId(to)) ?? randomTheme(current);
  remember(theme.id);
  const url = new URL(window.location.href);
  url.searchParams.set('theme', theme.id);
  window.history.replaceState(null, '', url);
  return theme;
}
