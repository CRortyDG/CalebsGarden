// Where each project's bed sits on the garden map, as fractions of the garden
// (0..1). `wide` is for landscape screens, `tall` for portrait phones.
// A project with no entry here is left off the map (it is still in the Index).

export type BedKind = 'herbs' | 'sunflowers' | 'greenhouse' | 'seedlings';

export interface BedRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface BedPlace {
  kind: BedKind;
  wide: BedRect;
  tall: BedRect;
}

export const beds: Record<string, BedPlace> = {
  candlefair: {
    kind: 'herbs',
    wide: { x: 0.12, y: 0.25, w: 0.3, h: 0.28 },
    tall: { x: 0.08, y: 0.24, w: 0.5, h: 0.18 },
  },
  madtown: {
    kind: 'sunflowers',
    wide: { x: 0.6, y: 0.2, w: 0.27, h: 0.27 },
    tall: { x: 0.56, y: 0.44, w: 0.38, h: 0.17 },
  },
  'case-studies': {
    kind: 'greenhouse',
    wide: { x: 0.5, y: 0.6, w: 0.26, h: 0.27 },
    tall: { x: 0.1, y: 0.67, w: 0.46, h: 0.17 },
  },
  seedlings: {
    kind: 'seedlings',
    wide: { x: 0.08, y: 0.72, w: 0.24, h: 0.16 },
    tall: { x: 0.62, y: 0.73, w: 0.3, h: 0.12 },
  },
};
