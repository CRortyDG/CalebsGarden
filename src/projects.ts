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
  /** The big line on the first screen. */
  headline: 'I build free software and give it away.',
  /** The line under it. */
  intro:
    "I'm Caleb. I make small, free software that people actually want to use, like a daily homepage for Madison and a companion for D&D night. No ads, no paywalls.",
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
      'A companion for D&D game night, around a real table or on a call with the TV view screen-shared. The TV becomes the table, every player plays from their phone, and the DM runs the night from one console that remembers every name, place and loose thread so nobody has to keep the books.',
    highlights: [
      'The TV shows the map, the fights and every dice roll, live',
      'Players keep their character sheet, gold and journal on their phone',
      'The DM console remembers people, places, clues and past sessions',
      'Invites, recaps and downtime between game nights',
    ],
    status: 'budding',
    type: 'project',
    href: 'https://dnd.calebs.garden',
    hostLabel: 'dnd.calebs.garden',
    image: {
      src: '/projects/candlefair.png',
      alt: 'Candlefair: D&D at the table, with a TV map, a phone and a candle',
      width: 1200,
      height: 630,
    },
    tags: ['Cloudflare Workers', 'Durable Objects', 'Real-time rooms'],
    habitat: 'Your table, on game night',
    caseStudy: '/case-studies/cheap-enough-to-give-away',
  },
  {
    id: 'madtown',
    name: 'madtown.today',
    blurb: 'a homepage for the isthmus',
    about:
      "Madison's daily homepage, made like the old-school internet and with no ad networks. Four daily puzzles to play, a question for the whole town, and the small things that make it a place people come back to.",
    highlights: [
      'Four daily puzzles: Chair Stack, Four Lakes, Word and Lap',
      'Madison Asks, a daily poll for the whole city',
      'The Madtown Gazette: articles and comedy pieces, now and then',
      'A guestbook, the weather, good causes and city parking info',
    ],
    status: 'evergreen',
    type: 'project',
    href: 'https://madtown.today',
    hostLabel: 'madtown.today',
    image: {
      src: '/projects/madtown.png',
      alt: 'madtown.today: a homepage for the isthmus, with the Chair Stack, Four Lakes and Madison Asks cards',
      width: 1200,
      height: 630,
    },
    habitat: 'Madison, WI',
  },
  {
    id: 'case-studies',
    name: 'Case studies',
    blurb: 'small software, in four parts',
    about: 'Small software: why I build free, accountless tools for one city or one group, and how madtown.today and Candlefair do it.',
    status: 'seedling',
    type: 'section',
    href: '/case-studies/',
  },
  {
    id: 'notes',
    name: 'Notes',
    blurb: 'ideas and things in progress',
    about: 'Shorter, dated posts: ideas I haven’t built yet, the maths behind them, and opinions on how I build.',
    status: 'seedling',
    type: 'section',
    href: '/notes',
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
