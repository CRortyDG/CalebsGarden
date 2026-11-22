// The content of the site. Add an entry here and the page, its bud on the first
// screen and the Index all pick it up.

/** Digital-garden growth stages. */
export type Status = 'seedling' | 'budding' | 'evergreen';

export interface Project {
  id: string;
  name: string;
  /** One short line shown beside the name. */
  blurb: string;
  /** Two or three sentences for the project card. */
  about: string;
  /** Three or four short lines on what's there, shown as a list in the card. */
  highlights?: string[];
  status: Status;
  /**
   * project: gets a full card on the page.
   * section: a part of this site (goes straight to `href`).
   * empty:   nothing to open yet.
   */
  type: 'project' | 'section' | 'empty';
  /** The live site, or the page on this site for a section. */
  href?: string;
  /** Shown next to the Visit button, e.g. the domain. */
  hostLabel?: string;
  /** Path of its case study on this site, once written. */
  caseStudy?: string;
  /** Public source code, if any. */
  source?: string;
  /** Card image under /public (1200×630, like a link preview), with its real pixel size. */
  image?: { src: string; alt: string; width: number; height: number };
  /** Three to five short "built with" tags. */
  tags?: string[];
  /** Who or where it is for, in a few words. */
  habitat?: string;
  /** The year it went live. */
  year?: number;
}

export const site = {
  name: 'calebs.garden',
  tagline: "a garden of things I've made",
  /** A few sentences about you. Not shown anywhere yet. */
  about: '',
  /** Ways to reach you, shown among the roots in the footer. */
  links: [] as { label: string; href: string }[],
};

export const projects: Project[] = [
  {
    id: 'candlefair',
    name: 'Candlefair',
    blurb: 'D&D at the table',
    about:
      'A companion for in-person D&D. The TV becomes the table, every player plays from their phone, and the DM runs the night from one console that remembers every name, place and loose thread so nobody has to keep the books.',
    highlights: [
      'The TV shows the map, the fights and every dice roll, live',
      'Players keep their character sheet, gold and journal on their phone',
      'The DM console remembers people, places, clues and past sessions',
      'Invites, recaps and downtime between game nights',
    ],
    status: 'budding',
    type: 'project',
    href: 'https://dungeon.garden',
    hostLabel: 'dungeon.garden',
    image: {
      src: '/projects/candlefair.png',
      alt: 'Candlefair: D&D at the table, with a TV map, a phone and a candle',
      width: 1200,
      height: 630,
    },
    tags: ['Cloudflare Workers', 'Durable Objects', 'Real-time rooms'],
    habitat: 'Your table, on game night',
  },
  {
    id: 'madtown',
    name: 'madtown.today',
    blurb: 'a daily puzzle game for Madison, WI',
    about:
      'Four daily puzzles themed around Madison, Wisconsin, on a site that feels like the old-school internet. Around the puzzles are the things that make a town page worth coming back to: stories, a guestbook and the useful odds and ends.',
    highlights: [
      'Four new puzzles every day',
      'Articles and comedy pieces, now and then',
      'A guestbook, like the old web',
      'City parking structure info and other Madison odds and ends',
    ],
    status: 'evergreen',
    type: 'project',
    href: 'https://madtown.today',
    hostLabel: 'madtown.today',
    image: {
      src: '/projects/madtown.png',
      alt: 'madtown.today: a daily puzzle game for Madison, WI, drawn like an old web page',
      width: 1200,
      height: 630,
    },
    habitat: 'Madison, WI',
  },
  {
    id: 'case-studies',
    name: 'Case studies',
    blurb: 'how they were built',
    about: 'Engineering write-ups: the decisions, the dead ends and the architecture behind each project.',
    status: 'seedling',
    type: 'section',
    href: '/case-studies/',
  },
  {
    id: 'seedlings',
    name: 'Seedlings',
    blurb: 'planting soon',
    about: 'Whatever comes next.',
    status: 'seedling',
    type: 'empty',
  },
];

export const statusLabel: Record<Status, string> = {
  seedling: 'Seedling',
  budding: 'Budding',
  evergreen: 'Evergreen',
};

/** Where a project's name links to: its card on the page, or straight to a section. */
export function projectLink(p: Project): string | undefined {
  if (p.type === 'project') return `#${p.id}`;
  return p.href;
}
