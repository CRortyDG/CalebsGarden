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
  /** Ways to reach you, shown among the roots in the footer and on /experience. */
  links: [{ label: 'Email', href: 'mailto:caleb@madtown.today' }] as { label: string; href: string }[],
  /**
   * One or two sentences on the kind of role you want next, shown at the top of
   * /experience. Hidden while empty. Only Caleb fills this in.
   */
  lookingFor:
    "The work I love most is full-stack product work: making something people use, from the screen down to the servers. It's why I made madtown.today and Candlefair. If you're making something like that, say hello.",
  /** Public code. */
  github: 'https://github.com/CRortyDG',
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

/** A few sentences on where Caleb comes from, shown above the job list in Roots. */
export const about =
  "Before the garden, I spent years on the parts of the internet people don't see. I aimed point-to-point radios on downtown Madison rooftops for a local ISP and data center, ran hosting for an agency with 150+ client sites, and was the sole developer behind the web side of a regional radio network. Today I'm an infrastructure engineer running Kubernetes and Terraform for a living, which is exactly why I keep these projects small: I know what scale costs, and most community software doesn't need it.";

/** Where Caleb has worked, newest first. The short fields feed Roots; the rest feed /experience. */
export interface Job {
  id: string;
  role: string;
  org: string;
  /** e.g. '2025 – now' */
  when: string;
  /** One short line on the work. */
  what: string;
  /** Full dates, e.g. 'Jun 2025 – now'. */
  dates: string;
  /** e.g. 'Full-time · Remote' */
  kind: string;
  /** What the job was, in a sentence or two. */
  scope: string;
  /** What Caleb personally owned. */
  owned: string[];
  /** Systems and tools run day to day. */
  systems: string[];
  /** Measured results. Only real ones, supplied by Caleb; hidden while empty. */
  outcomes?: string[];
}

export const experience: Job[] = [
  {
    id: 'n3xt',
    role: 'Infrastructure Engineer',
    org: 'N3XT',
    when: '2025 – now',
    what: 'Cloud infrastructure on GCP with Kubernetes and Terraform; deployments, CI/CD and developer tooling.',
    dates: 'Jun 2025 – now',
    kind: 'Full-time · Remote',
    scope: 'Infrastructure engineer at a blockchain-based banking startup.',
    owned: [
      'Building and maintaining the cloud infrastructure on GCP, with Kubernetes and Terraform',
      'Deployments and the CI/CD pipelines for the organization',
      'Developer tooling for the engineering team',
    ],
    systems: ['GCP', 'Kubernetes', 'Terraform', 'CI/CD'],
  },
  {
    id: 'civic-media',
    role: 'Software Engineer',
    org: 'Civic Media',
    when: '2024 – 2025',
    what: 'Sole developer for a regional radio network: 25 Next.js apps and the GCP and Terraform under them.',
    dates: 'Jan 2024 – Jun 2025',
    kind: 'Full-time · Madison, WI · Remote',
    scope: 'The only developer at a regional radio network, reporting directly to the CEO.',
    owned: [
      'Building and maintaining 25 Next.js applications for the network',
      'All of the GCP and Terraform infrastructure under them, the CI/CD pipelines and production operations',
      'Project intake, working with a designer, and guiding an external consultant',
      'Explaining technical decisions and tradeoffs to non-technical people across the organization',
    ],
    systems: ['Next.js', 'JavaScript', 'GCP', 'Terraform', 'CI/CD'],
  },
  {
    id: 'design-garden',
    role: 'Software Engineer',
    org: 'Design.Garden',
    when: '2021 – 2024',
    what: 'Full-stack developer and hosting operator for a web agency with 150+ client sites.',
    dates: 'Jan 2021 – Jan 2024',
    kind: 'Part-time Jan – Jun 2021, full-time from Aug 2021 · Madison, WI · Remote',
    scope: 'Full-stack developer and hosting operator for a web agency managing 150+ client sites.',
    owned: [
      'Custom web applications beyond WordPress',
      'The WHMCS hosting portal, end to end',
      'Client communication from scoping through delivery',
      'Training junior staff on WordPress site management, WHMCS and working with clients',
    ],
    systems: ['PHP', 'MySQL', 'WordPress', 'WHMCS', 'Web hosting'],
  },
  {
    id: '5nines',
    role: 'IT Specialist',
    org: '5NINES',
    when: '2018 – 2020',
    what: 'Rooftop point-to-point radios, data center buildouts and network support for a regional ISP.',
    dates: 'Jun 2018 – Dec 2020',
    kind: 'Part-time · Madison, WI',
    scope: 'Field operations, infrastructure and helpdesk for a regional ISP and data center provider.',
    owned: [
      'Installing and aiming point-to-point wireless radios on commercial rooftops in downtown Madison',
      'Data center buildouts: switch rewiring and rack cabling',
      'Triaging network infrastructure alerts and client support tickets',
      'Equipment inventory',
    ],
    systems: ['Ubiquiti point-to-point wireless', 'Switching and cabling', 'Network monitoring', 'Helpdesk'],
  },
];

/** Short quotes from people Caleb has worked with. Only real ones, with their permission; hidden while empty. */
export interface Testimonial {
  quote: string;
  name: string;
  /** Their role and where you worked together, e.g. 'Designer, Civic Media'. */
  role: string;
}
export const testimonials: Testimonial[] = [];

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
