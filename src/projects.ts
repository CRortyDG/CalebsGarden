// Everything that grows in the garden. Add a project here and it gets a bed,
// a stake on the home page and an entry in the plain list below the garden.
//
// Bed positions are fractions of the garden (0..1). `wide` is used on landscape
// screens, `tall` on portrait phones.

export type BedKind = 'herbs' | 'sunflowers' | 'greenhouse' | 'seedlings';

export interface BedRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Project {
  id: string;
  name: string;
  /** One short line, shown when you hover the bed. */
  blurb: string;
  /** Longer line for the list below the garden (optional). */
  about: string;
  /** Omit for a bed that has nothing planted yet. */
  href?: string;
  hostLabel?: string;
  kind: BedKind;
  wide: BedRect;
  tall: BedRect;
}

export const projects: Project[] = [
  {
    id: 'candlefair',
    name: 'Candlefair',
    blurb: 'D&D at the table · dungeon.garden',
    about: 'A companion for in-person D&D: a TV at the table, phones in hand, and a DM console that remembers everything.',
    href: 'https://dungeon.garden',
    hostLabel: 'dungeon.garden',
    kind: 'herbs',
    wide: { x: 0.12, y: 0.25, w: 0.3, h: 0.28 },
    tall: { x: 0.08, y: 0.24, w: 0.5, h: 0.18 },
  },
  {
    id: 'madtown',
    name: 'madtown.today',
    blurb: 'madtown.today',
    about: '',
    href: 'https://madtown.today',
    hostLabel: 'madtown.today',
    kind: 'sunflowers',
    wide: { x: 0.6, y: 0.2, w: 0.27, h: 0.27 },
    tall: { x: 0.56, y: 0.44, w: 0.38, h: 0.17 },
  },
  {
    id: 'case-studies',
    name: 'Case studies',
    blurb: 'how they were built',
    about: 'Engineering write-ups: the decisions, the dead ends and the architecture behind each project.',
    href: '/case-studies/',
    kind: 'greenhouse',
    wide: { x: 0.5, y: 0.6, w: 0.26, h: 0.27 },
    tall: { x: 0.1, y: 0.67, w: 0.46, h: 0.17 },
  },
  {
    id: 'seedlings',
    name: 'Seedlings',
    blurb: 'planting soon',
    about: 'Whatever comes next.',
    kind: 'seedlings',
    wide: { x: 0.08, y: 0.72, w: 0.24, h: 0.16 },
    tall: { x: 0.62, y: 0.73, w: 0.3, h: 0.12 },
  },
];
