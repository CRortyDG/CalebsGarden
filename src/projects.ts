// The content of the site. Themes are scenery around this list and never own
// content: add an entry here and every theme, the project sheet and the Index
// pick it up.

/** Digital-garden growth stages. */
export type Status = 'seedling' | 'budding' | 'evergreen';

export interface Project {
  id: string;
  name: string;
  /** One short line shown beside the name. */
  blurb: string;
  /** Two or three sentences for the project sheet. */
  about: string;
  status: Status;
  /**
   * project: opens the shared project sheet.
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
  /** Screenshot under /public, with its real pixel size. */
  image?: { src: string; alt: string; width: number; height: number };
  /** Three to five short "built with" tags. */
  tags?: string[];
}

export const site = {
  name: 'calebs.garden',
  tagline: "a garden of things I've made",
  /** Ways to reach you, shown in the footer of themes that have one. */
  links: [] as { label: string; href: string }[],
};

export const projects: Project[] = [
  {
    id: 'candlefair',
    name: 'Candlefair',
    blurb: 'D&D at the table',
    about:
      'A companion for in-person D&D: a TV at the table, phones in hand, and a DM console that remembers everything.',
    status: 'budding',
    type: 'project',
    href: 'https://dungeon.garden',
    hostLabel: 'dungeon.garden',
    image: {
      src: '/projects/candlefair.jpg',
      alt: 'Candlefair on the table TV: a town map with the party tokens on it',
      width: 2000,
      height: 1125,
    },
    tags: ['Cloudflare Workers', 'Durable Objects', 'Real-time rooms'],
  },
  {
    id: 'madtown',
    name: 'madtown.today',
    blurb: '',
    about: '',
    status: 'evergreen',
    type: 'project',
    href: 'https://madtown.today',
    hostLabel: 'madtown.today',
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

/** Where a click on a project's name should go inside a theme. */
export function projectLink(p: Project): string | undefined {
  if (p.type === 'project') return `#${p.id}`;
  return p.href;
}
