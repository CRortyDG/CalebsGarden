/** The "Small software" series: one hub essay and three case studies drawn from Candlefair and madtown.today. */
export type Piece = { slug: string; title: string; blurb: string };

export const SERIES_NAME = 'Small software';

export const pieces: Piece[] = [
  {
    slug: 'sized-to-its-community',
    title: 'Software sized to its community',
    blurb: 'Why global scale is the wrong default for a lot of software, and what I build instead.',
  },
  {
    slug: 'the-browser-is-the-account',
    title: 'The browser is the account',
    blurb: 'How madtown.today and Candlefair let people in without sign-ups, and what that gives up.',
  },
  {
    slug: 'cheap-enough-to-give-away',
    title: 'Cheap enough to give away',
    blurb: 'What it takes for a tool to cost close to nothing when nobody is using it.',
  },
  {
    slug: 'built-for-one-place',
    title: 'Built for one place',
    blurb: 'A homepage for one city and a companion for one table: what changes when you know exactly who it is for.',
  },
];

export const pieceUrl = (slug: string) => `/case-studies/${slug}`;
