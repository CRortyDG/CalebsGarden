import type { Status } from '@/projects';

// A pressed plant drawn from a project's name. The same name always gives the
// same plant, so a new project gets its own species without anyone drawing it.
// The status decides how far along it is: a sprout, in bud, or in full flower.

export interface Leaf {
  d: string;
  fill: string;
}
export interface Bloom {
  x: number;
  y: number;
  /** petals, as paths around (x, y) */
  petals: string[];
  r: number;
}
export interface Specimen {
  /** Petal colour, also used for the project's name. */
  tone: string;
  ink: string;
  stems: string[];
  roots: string[];
  leaves: Leaf[];
  blooms: Bloom[];
  /** Where annotation lines can point, in the 200 x 300 drawing. */
  flower: { x: number; y: number };
  root: { x: number; y: number };
}

/** The drawing is 200 wide and 300 tall. */
export const SPECIMEN_BOX = { w: 200, h: 300 };

const TONES = [
  { tone: '#b9553f', ink: '#8c3a28' }, // terracotta
  { tone: '#c98f2b', ink: '#8a5f12' }, // ochre
  { tone: '#7d5fa6', ink: '#5b4380' }, // violet
  { tone: '#b84d72', ink: '#8c3555' }, // rose
  { tone: '#3f7c9c', ink: '#2c5b75' }, // gentian blue
];
const GREENS = ['#66773f', '#7b8a4d', '#8a9660', '#5d6e3a'];

function seeded(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f = (n: number) => n.toFixed(1);

export function drawSpecimen(name: string, status: Status): Specimen {
  const R = seeded(`sheet:${name.toLowerCase()}`);
  const pick = <T,>(list: T[]) => list[Math.floor(R() * list.length)];
  const { tone, ink } = pick(TONES);
  const kind = Math.floor(R() * 4); // flower head: daisy, bells, umbel, spike
  const leafKind = Math.floor(R() * 3); // lance, oval, lobed

  const groundY = 236;
  const height = status === 'seedling' ? 92 : 172 + R() * 16;
  const topY = groundY - height;
  const lean = (R() - 0.5) * 34;
  const sway = (R() - 0.5) * 46;
  const base = { x: 100, y: groundY };
  const top = { x: 100 + lean, y: topY };
  const c1 = { x: 100 + sway, y: groundY - height * 0.35 };
  const c2 = { x: 100 + lean - sway * 0.6, y: groundY - height * 0.7 };

  const at = (t: number) => {
    const u = 1 - t;
    const x = u * u * u * base.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * top.x;
    const y = u * u * u * base.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * top.y;
    const dx = 3 * u * u * (c1.x - base.x) + 6 * u * t * (c2.x - c1.x) + 3 * t * t * (top.x - c2.x);
    const dy = 3 * u * u * (c1.y - base.y) + 6 * u * t * (c2.y - c1.y) + 3 * t * t * (top.y - c2.y);
    return { x, y, a: Math.atan2(dy, dx) };
  };

  const stems = [`M${f(base.x)} ${f(base.y)} C${f(c1.x)} ${f(c1.y)} ${f(c2.x)} ${f(c2.y)} ${f(top.x)} ${f(top.y)}`];

  // roots
  const roots: string[] = [];
  const rootCount = 4 + Math.floor(R() * 3);
  for (let i = 0; i < rootCount; i++) {
    const spread = (i / (rootCount - 1) - 0.5) * 2;
    const ex = 100 + spread * (26 + R() * 14);
    const ey = groundY + 26 + R() * 22 - Math.abs(spread) * 8;
    roots.push(
      `M100 ${groundY} C${f(100 + spread * 6)} ${f(groundY + 10)} ${f(ex - spread * 10 + (R() - 0.5) * 10)} ${f(ey - 14)} ${f(ex)} ${f(ey)}`,
    );
  }

  // leaves, alternating up the stem
  const leaves: Leaf[] = [];
  const leafCount = status === 'seedling' ? 2 + Math.floor(R() * 2) : 4 + Math.floor(R() * 4);
  for (let i = 0; i < leafCount; i++) {
    const t = 0.14 + (i / leafCount) * 0.62 + R() * 0.03;
    const p = at(t);
    const side = i % 2 ? 1 : -1;
    const len = (status === 'seedling' ? 30 : 44) * (1 - t * 0.45) * (0.85 + R() * 0.3);
    const a = p.a + side * (0.95 + R() * 0.35);
    leaves.push({ d: leafPath(p.x, p.y, a, len, leafKind), fill: pick(GREENS) });
  }

  // flower heads
  const blooms: Bloom[] = [];
  const open = status === 'evergreen' ? 1 : status === 'budding' ? 0.55 : 0.18;
  const head = at(1);
  blooms.push(bloom(head.x, head.y, head.a, kind, open, R));
  if (status !== 'seedling') {
    // a side shoot with a second, smaller head
    const p = at(0.62);
    const side = lean > 0 ? -1 : 1;
    const ex = p.x + side * (30 + R() * 10);
    const ey = p.y - 38 - R() * 12;
    stems.push(`M${f(p.x)} ${f(p.y)} Q${f(p.x + side * 22)} ${f(p.y - 8)} ${f(ex)} ${f(ey)}`);
    blooms.push(bloom(ex, ey, -Math.PI / 2 + side * 0.3, kind, open * 0.75, R, 0.72));
  }

  return { tone, ink, stems, roots, leaves, blooms, flower: { x: head.x, y: head.y }, root: { x: 100, y: groundY + 20 } };
}

function leafPath(x: number, y: number, a: number, len: number, kind: number) {
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  const P = (u: number, v: number) => `${f(x + cos * u - sin * v)} ${f(y + sin * u + cos * v)}`;
  if (kind === 0) {
    // lance
    return `M${P(0, 0)} Q${P(len * 0.45, -len * 0.2)} ${P(len, 0)} Q${P(len * 0.45, len * 0.2)} ${P(0, 0)}Z`;
  }
  if (kind === 1) {
    // oval
    return `M${P(0, 0)} C${P(len * 0.2, -len * 0.42)} ${P(len * 0.8, -len * 0.36)} ${P(len, 0)} C${P(len * 0.8, len * 0.36)} ${P(len * 0.2, len * 0.42)} ${P(0, 0)}Z`;
  }
  // lobed
  const w = len * 0.3;
  return (
    `M${P(0, 0)} Q${P(len * 0.15, -w)} ${P(len * 0.3, -w * 0.5)} Q${P(len * 0.45, -w * 1.2)} ${P(len * 0.62, -w * 0.5)} Q${P(len * 0.8, -w * 0.9)} ${P(len, 0)}` +
    ` Q${P(len * 0.8, w * 0.9)} ${P(len * 0.62, w * 0.5)} Q${P(len * 0.45, w * 1.2)} ${P(len * 0.3, w * 0.5)} Q${P(len * 0.15, w)} ${P(0, 0)}Z`
  );
}

function petal(x: number, y: number, a: number, len: number, w: number) {
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  const P = (u: number, v: number) => `${f(x + cos * u - sin * v)} ${f(y + sin * u + cos * v)}`;
  return `M${P(0, 0)} C${P(len * 0.3, -w)} ${P(len * 0.85, -w)} ${P(len, 0)} C${P(len * 0.85, w)} ${P(len * 0.3, w)} ${P(0, 0)}Z`;
}

function bloom(x: number, y: number, a: number, kind: number, open: number, R: () => number, scale = 1): Bloom {
  const petals: string[] = [];
  const s = scale;
  if (kind === 0) {
    // daisy: petals fan further round the more open it is
    const n = 11;
    const fan = Math.PI * (0.25 + open * 1.75);
    for (let i = 0; i < n; i++) petals.push(petal(x, y, a - fan / 2 + (fan * i) / (n - 1), (15 + open * 9) * s, 3.6 * s));
    return { x, y, petals, r: (2.5 + open * 3) * s };
  }
  if (kind === 1) {
    // bells hanging from the tip
    const n = open > 0.4 ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const bx = x + (i - (n - 1) / 2) * 13 * s;
      const by = y + 3 + Math.abs(i - (n - 1) / 2) * 5;
      const len = (11 + open * 9) * s;
      const w = (3 + open * 5) * s;
      petals.push(`M${f(bx)} ${f(by)} C${f(bx - w)} ${f(by + len * 0.3)} ${f(bx - w * 1.3)} ${f(by + len)} ${f(bx - w * 0.5)} ${f(by + len)} L${f(bx)} ${f(by + len * 0.86)} L${f(bx + w * 0.5)} ${f(by + len)} C${f(bx + w * 1.3)} ${f(by + len)} ${f(bx + w)} ${f(by + len * 0.3)} ${f(bx)} ${f(by)}Z`);
    }
    return { x, y, petals, r: 0 };
  }
  if (kind === 2) {
    // umbel: small florets on spokes
    const n = 7;
    const fan = Math.PI * (0.5 + open * 0.5);
    for (let i = 0; i < n; i++) {
      const sa = a - fan / 2 + (fan * i) / (n - 1);
      const len = (16 + open * 10 + R() * 3) * s;
      const fx = x + Math.cos(sa) * len;
      const fy = y + Math.sin(sa) * len;
      const r = (1.6 + open * 3.2) * s;
      petals.push(`M${f(x)} ${f(y)} L${f(fx)} ${f(fy)} M${f(fx + r)} ${f(fy)} A${f(r)} ${f(r)} 0 1 1 ${f(fx - r)} ${f(fy)} A${f(r)} ${f(r)} 0 1 1 ${f(fx + r)} ${f(fy)}Z`);
    }
    return { x, y, petals, r: 0 };
  }
  // spike: florets in pairs up the tip
  const n = 5;
  for (let i = 0; i < n; i++) {
    const d = (i * 8 + 2) * s;
    const px = x - Math.cos(a) * d;
    const py = y - Math.sin(a) * d;
    const len = (5 + open * 9) * (0.6 + i * 0.12) * s;
    petals.push(petal(px, py, a - 1.1, len, 2.6 * s), petal(px, py, a + 1.1, len, 2.6 * s));
  }
  petals.push(petal(x, y, a, (6 + open * 6) * s, 2.4 * s));
  return { x, y, petals, r: 0 };
}

/** A joke botanical name made from the project's name and how far along it is. */
export function latinName(name: string, status: Status) {
  const word = name.split(/[.\s]/)[0].replace(/[^a-z]/gi, '').toLowerCase();
  if (!word) return '';
  const genus = word[0].toUpperCase() + word.slice(1).replace(/[aeiouy]+$/, '') + 'ia';
  const epithet = { seedling: 'novella', budding: 'gemmans', evergreen: 'sempervirens' }[status];
  return `${genus} ${epithet}`;
}

/** What the flower shows, in plain words, for people who do not know the garden terms. */
export const stageNote: Record<Status, string> = {
  seedling: 'A first sprout.',
  budding: 'In bud, still growing.',
  evergreen: 'In full flower.',
};
