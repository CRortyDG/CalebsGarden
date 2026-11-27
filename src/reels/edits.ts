// Recap edits: whole reels cut the way an editor would, for any number of photos.
//
// An edit is a list of shots. A shot is one idea on screen for a few beats: a single small
// tile that flickers in the dark, a collage page that fills and is then replaced by the next
// page, a full-screen photo, three stacked panels, a strobe of photos on half beats, a beat of
// black, and a finale grid that holds for the title. Each edit is a recipe of sections with
// its own arc (a sparse open, a build, a peak, a breath, the finale); the sections repeat until
// every photo has been used, so 6 photos make a short reel and 60 make a long one.

import { drawCover, drawQuiet, H, W, type Card, type EndCard, type Look, type Media, type Segment, type Timeline } from './engine';

export type Shot =
  | { kind: 'solo'; photos: [number]; beats: number; cell: number }
  | { kind: 'grid'; photos: number[]; beats: number; cols: number; rows: number; step: number; order: number[] }
  | { kind: 'full'; photos: [number]; beats: number; blink: boolean }
  | { kind: 'split'; photos: number[]; beats: number; step: number }
  | { kind: 'strobe'; photos: number[]; beats: number; step: number }
  | { kind: 'black'; photos: []; beats: number }
  | { kind: 'finale'; photos: number[]; beats: number };

export type EditId = 'pages' | 'cuts' | 'triptych' | 'burn' | 'mosaic';
export const EDITS: { id: EditId; label: string; about: string }[] = [
  { id: 'pages', label: 'Pages', about: 'Your clip, grown up: photos flicker in alone, then collage pages fill and flip to the next set, with full-screen shots between pages.' },
  { id: 'cuts', label: 'Hard cuts', about: 'Mostly full-screen photos cut hard on every beat, broken up by four-up pages and a fast strobe at the peak.' },
  { id: 'triptych', label: 'Triptych', about: 'Three stacked panels fill one by one, then a full-screen shot, then the next three. Calm and graphic.' },
  { id: 'burn', label: 'Slow burn', about: 'Starts slow with long full-screen shots and speeds up all the way to a half-beat strobe, then lands on the grid.' },
  { id: 'mosaic', label: 'Mosaic', about: 'Collage pages that get denser as it goes: four tiles, then nine, with a full-screen breath between each page.' },
];

// ---------- planning ----------

const ORDERS_3x3 = [
  [7, 4, 1, 6, 8, 3, 5, 0, 2], // up the middle, then out
  [6, 7, 8, 5, 4, 3, 0, 1, 2], // bottom row up, snaking
  [0, 4, 8, 2, 6, 1, 5, 3, 7], // diagonal, then the gaps
  [4, 1, 3, 5, 7, 0, 2, 6, 8], // centre out
];
const ORDERS_2x2 = [
  [0, 3, 1, 2],
  [2, 1, 3, 0],
];

type Section =
  | { kind: 'solo'; beats: number }
  | { kind: 'grid'; size: 2 | 3; step: number; hold: number }
  | { kind: 'full'; beats: number; blink?: boolean }
  | { kind: 'split'; step: number; hold: number }
  | { kind: 'strobe'; count: number; step: number }
  | { kind: 'black'; beats: number };

/** The recipes: an opening played once, then a loop played until the photos run out. */
const RECIPES: Record<EditId, { open: Section[]; loop: Section[] }> = {
  pages: {
    open: [{ kind: 'solo', beats: 4 }, { kind: 'solo', beats: 4 }, { kind: 'solo', beats: 4 }],
    loop: [
      { kind: 'grid', size: 3, step: 1, hold: 2 },
      { kind: 'full', beats: 2, blink: true },
      { kind: 'full', beats: 2, blink: true },
      { kind: 'grid', size: 3, step: 0.5, hold: 2 },
      { kind: 'solo', beats: 2 },
      { kind: 'full', beats: 2, blink: true },
    ],
  },
  cuts: {
    open: [{ kind: 'full', beats: 4 }, { kind: 'black', beats: 1 }, { kind: 'full', beats: 3 }],
    loop: [
      ...Array.from({ length: 6 }, () => ({ kind: 'full', beats: 1 }) as Section),
      { kind: 'grid', size: 2, step: 1, hold: 2 },
      { kind: 'strobe', count: 6, step: 0.5 },
      { kind: 'black', beats: 1 },
    ],
  },
  triptych: {
    open: [{ kind: 'solo', beats: 4 }, { kind: 'solo', beats: 4 }],
    loop: [
      { kind: 'split', step: 1, hold: 1 },
      { kind: 'full', beats: 2, blink: true },
      { kind: 'split', step: 0.5, hold: 2 },
      { kind: 'full', beats: 1 },
      { kind: 'full', beats: 1 },
    ],
  },
  burn: {
    open: [
      { kind: 'full', beats: 4 },
      { kind: 'full', beats: 4 },
      { kind: 'full', beats: 2 },
      { kind: 'full', beats: 2 },
      { kind: 'full', beats: 2 },
      { kind: 'solo', beats: 2 },
    ],
    loop: [
      ...Array.from({ length: 4 }, () => ({ kind: 'full', beats: 1, blink: true }) as Section),
      { kind: 'grid', size: 3, step: 0.5, hold: 1 },
      { kind: 'strobe', count: 8, step: 0.5 },
    ],
  },
  mosaic: {
    open: [{ kind: 'solo', beats: 4 }, { kind: 'solo', beats: 2 }],
    loop: [
      { kind: 'grid', size: 2, step: 1, hold: 2 },
      { kind: 'full', beats: 2, blink: true },
      { kind: 'grid', size: 3, step: 0.5, hold: 2 },
      { kind: 'full', beats: 2, blink: true },
      { kind: 'black', beats: 1 },
    ],
  },
};

/**
 * Turns a recipe into shots for `n` photos, every photo used once, in order. `pace` stretches
 * or squeezes every shot (2 = twice as long). The finale shows the last nine photos again.
 */
export function planEdit(id: EditId, n: number, pace = 1): Shot[] {
  const shots: Shot[] = [];
  if (n <= 0) return shots;
  const recipe = RECIPES[id];
  let next = 0;
  let solos = 0;
  let pages = 0;
  const left = () => n - next;
  const take = (k: number) => {
    const out: number[] = [];
    while (out.length < k && next < n) out.push(next++);
    return out;
  };
  const beats = (b: number) => Math.max(1, Math.round(b * pace));
  const add = (s: Section) => {
    if (s.kind === 'black') return shots.push({ kind: 'black', photos: [], beats: beats(s.beats) });
    if (!left()) return;
    if (s.kind === 'solo') {
      const cell = [4, 1, 7, 3, 5][solos++ % 5];
      shots.push({ kind: 'solo', photos: take(1) as [number], beats: beats(s.beats), cell });
    } else if (s.kind === 'full') shots.push({ kind: 'full', photos: take(1) as [number], beats: beats(s.beats), blink: !!s.blink });
    else if (s.kind === 'grid') {
      const photos = take(s.size * s.size);
      const orders = s.size === 3 ? ORDERS_3x3 : ORDERS_2x2;
      const order = orders[pages++ % orders.length];
      shots.push({ kind: 'grid', photos, cols: s.size, rows: s.size, step: s.step, order, beats: beats(Math.ceil(photos.length * s.step) + s.hold) });
    } else if (s.kind === 'split') {
      const photos = take(3);
      shots.push({ kind: 'split', photos, step: s.step, beats: beats(Math.ceil(photos.length * s.step) + s.hold) });
    } else {
      const photos = take(s.count);
      shots.push({ kind: 'strobe', photos, step: s.step, beats: beats(Math.ceil(photos.length * s.step)) });
    }
  };
  for (const s of recipe.open) add(s);
  for (let guard = 0; left() > 0 && guard < 200; guard++) for (const s of recipe.loop) add(s);
  // Drop a trailing black beat, then land on the finale.
  while (shots.length && shots[shots.length - 1].kind === 'black') shots.pop();
  shots.push({ kind: 'finale', photos: Array.from({ length: Math.min(9, n) }, (_, i) => n - Math.min(9, n) + i), beats: 8 });
  return shots;
}

/** The shot a photo first appears in, for jumping the preview to it. */
export function shotOfPhoto(shots: Shot[], photo: number) {
  return Math.max(0, shots.findIndex((s) => s.kind !== 'finale' && (s.photos as number[]).includes(photo)));
}

// ---------- drawing ----------

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const GAP = 6;

/** A photo filling a rectangle, drifting slowly so stills feel like footage. */
function photoIn(ctx: CanvasRenderingContext2D, m: Media | null | undefined, x: number, y: number, w: number, h: number, since: number, seed: number, alpha = 1) {
  if (!m || since < 0) return;
  const drift = Math.min(1, (since + seed * 0.37) / 6);
  const dir = seed % 4;
  const s = Math.max(w / m.w, h / m.h) * (1.06 + 0.05 * drift);
  const dx = (dir === 0 ? 1 : dir === 1 ? -1 : 0) * 0.025 * w * (drift - 0.5);
  const dy = (dir === 2 ? 1 : dir === 3 ? -1 : 0) * 0.025 * h * (drift - 0.5);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.globalAlpha = alpha * clamp01(since / 0.05);
  ctx.drawImage(m.el, x + (w - m.w * s) / 2 + dx, y + (h - m.h * s) / 2 + dy, m.w * s, m.h * s);
  ctx.restore();
}

/** The flicker: a panel lands, drops out for a moment, and comes back. */
const flickerOn = (since: number, beat: number) => since >= 0 && !(since > beat * 0.12 && since < beat * 0.2);

function cellRect(cell: number, cols: number, rows: number) {
  const cw = (W - GAP * (cols + 1)) / cols;
  const ch = (H - GAP * (rows + 1)) / rows;
  return { x: GAP + (cell % cols) * (cw + GAP), y: GAP + Math.floor(cell / cols) * (ch + GAP), w: cw, h: ch };
}

export function drawEdit(ctx: CanvasRenderingContext2D, t: number, seg: Segment, tl: Timeline, cards: Card[], end: EndCard, look: Look, shots: Shot[]) {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, W, H);
  const shot = shots[seg.index];
  if (!shot) return;
  const u = t - seg.start;
  const beat = (seg.end - seg.start) / Math.max(1, shot.beats);
  const media = (p: number) => cards[p]?.media;

  switch (shot.kind) {
    case 'solo': {
      const p = shot.photos[0];
      const on = u < beat * 0.55 || (u > beat * 0.68 && u < beat * 1.15);
      const r = cellRect(shot.cell, 3, 3);
      if (on) photoIn(ctx, media(p), r.x, r.y, r.w, r.h, u, p);
      break;
    }
    case 'grid': {
      shot.photos.forEach((p, k) => {
        const since = u - k * shot.step * beat;
        if (!flickerOn(since, beat)) return;
        const r = cellRect(shot.order[k], shot.cols, shot.rows);
        photoIn(ctx, media(p), r.x, r.y, r.w, r.h, since, p);
      });
      break;
    }
    case 'full': {
      const p = shot.photos[0];
      if (shot.blink && !flickerOn(u, beat)) break;
      const m = media(p);
      if (m) photoIn(ctx, m, 0, 0, W, H, u, p);
      break;
    }
    case 'split': {
      const bh = (H - GAP * 4) / 3;
      shot.photos.forEach((p, k) => {
        const since = u - k * shot.step * beat;
        if (!flickerOn(since, beat)) return;
        photoIn(ctx, media(p), GAP, GAP + k * (bh + GAP), W - 2 * GAP, bh, since, p);
      });
      break;
    }
    case 'strobe': {
      const k = Math.min(shot.photos.length - 1, Math.floor(u / (shot.step * beat)));
      const m = media(shot.photos[k]);
      if (m) drawCover(ctx, m, 1.06);
      break;
    }
    case 'black':
      break;
    case 'finale': {
      // Every panel flickers in, one after another across the first beat, then holds.
      const cells = [4, 1, 7, 3, 5, 0, 2, 6, 8];
      const ps = shot.photos.length ? shot.photos : [0];
      for (let c = 0; c < 9; c++) {
        const p = ps[c % ps.length];
        const since = u - (c / 9) * beat;
        if (!flickerOn(since, beat * 0.6)) continue;
        const r = cellRect(cells[c], 3, 3);
        photoIn(ctx, media(p), r.x, r.y, r.w, r.h, since + 2, p);
      }
      const second = seg.beats[1] ?? seg.start + beat;
      if (end.tagline && t >= second) {
        ctx.fillStyle = `rgba(0,0,0,${(0.45 * clamp01((t - second) / 0.25)).toFixed(3)})`;
        ctx.fillRect(0, 0, W, H);
        drawQuiet(ctx, end.tagline, H * 0.5, t - second, look, 64);
      }
      const third = seg.beats[2] ?? second + beat;
      if (end.small && t >= third) drawQuiet(ctx, end.small, H * 0.5 + 90, t - third, look, 34, 0.7);
      break;
    }
  }
  void tl;
}
