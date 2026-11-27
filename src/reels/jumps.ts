// Five more photo styles for the reel maker, each a different way to jump on the beat:
// a zoom through the cut, a whip pan, prints dropping onto a table, panels sliding in,
// and a glitchy hard cut. Like the recap, they need only photos; a title can land at the end.

import { drawCaption, drawCover, drawSmall, H, W, type Card, type EndCard, type Look, type Media, type Segment, type Timeline } from './engine';

export const JUMP_STYLES = ['zoom', 'whip', 'polaroid', 'strips', 'glitch'] as const;
export type JumpStyle = (typeof JUMP_STYLES)[number];

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const easeOut = (x: number) => 1 - (1 - clamp01(x)) ** 3;
const easeInOut = (x: number) => {
  const c = clamp01(x);
  return c < 0.5 ? 4 * c * c * c : 1 - (-2 * c + 2) ** 3 / 2;
};
/** The same "random" number every time for the same inputs, so a reel always renders the same. */
const rnd = (a: number, b = 0) => {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Draws a photo filling a rectangle (cropped to fit), offset by dx/dy inside it. */
function coverIn(ctx: CanvasRenderingContext2D, m: Media, x: number, y: number, w: number, h: number, scale = 1, dx = 0, dy = 0) {
  const s = Math.max(w / m.w, h / m.h) * scale;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(m.el, x + (w - m.w * s) / 2 + dx, y + (h - m.h * s) / 2 + dy, m.w * s, m.h * s);
  ctx.restore();
}

export function drawJump(ctx: CanvasRenderingContext2D, t: number, seg: Segment, tl: Timeline, cards: Card[], end: EndCard, look: Look, style: JumpStyle) {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, W, H);
  const clips = tl.segments.filter((s) => s.kind === 'clip');
  const i = seg.kind === 'clip' ? seg.index : clips.length - 1;
  if (i < 0) return;
  const media = (j: number) => cards[j]?.media ?? null;
  const dt = t - seg.start;
  const span = Math.max(0.1, seg.end - seg.start);
  const ctxArgs = { ctx, t, seg, clips, media, i, dt, span };

  if (style === 'zoom') drawZoom(ctxArgs);
  else if (style === 'whip') drawWhip(ctxArgs);
  else if (style === 'polaroid') drawPolaroids(ctxArgs);
  else if (style === 'strips') drawStrips(ctxArgs);
  else drawGlitch(ctxArgs);

  if (seg.kind === 'end') {
    const second = seg.beats[1] ?? seg.start + 0.5;
    const third = seg.beats[2] ?? second + 0.5;
    if (end.tagline && t >= second) {
      if (style !== 'polaroid') {
        ctx.fillStyle = `rgba(0,0,0,${(0.35 * clamp01((t - second) / 0.2)).toFixed(3)})`;
        ctx.fillRect(0, 0, W, H);
      }
      drawCaption(ctx, end.tagline, style === 'polaroid' ? H * 0.86 : H * 0.5, t - second, look, null);
    }
    if (end.small && t >= third) drawSmall(ctx, end.small, style === 'polaroid' ? H * 0.86 + 170 : H * 0.5 + 190, t - third, look);
  }
}

type Args = {
  ctx: CanvasRenderingContext2D;
  t: number;
  seg: Segment;
  clips: Segment[];
  media: (j: number) => Media | null;
  i: number;
  dt: number;
  span: number;
};

// ---------- Zoom jump: rush into each cut and land on the next photo ----------

function zoomBlur(ctx: CanvasRenderingContext2D, m: Media | null, scale: number, amount: number) {
  if (!m) return;
  drawCover(ctx, m, scale);
  if (amount < 0.02) return;
  ctx.save();
  for (let k = 1; k <= 4; k++) {
    ctx.globalAlpha = 0.2 * amount;
    drawCover(ctx, m, scale * (1 + 0.05 * k * amount));
  }
  ctx.restore();
}

function drawZoom({ ctx, t, seg, clips, media, i, dt, span }: Args) {
  const IN = 0.13; // rush into the cut
  const OUT = 0.18; // settle after it
  const next = seg.kind === 'clip' ? clips[i + 1] : undefined;
  const toNext = next ? next.start - t : Infinity;
  if (toNext < IN) {
    const p = 1 - toNext / IN;
    zoomBlur(ctx, media(i), 1 + 0.05 * (dt / span) + 0.9 * p * p, 0.3 + 0.7 * p);
    ctx.fillStyle = `rgba(255,255,255,${(0.25 * p * p).toFixed(3)})`;
    ctx.fillRect(0, 0, W, H);
  } else if (seg.kind === 'clip' && dt < OUT && i > 0) {
    const p = dt / OUT;
    zoomBlur(ctx, media(i), 1 + 0.55 * (1 - easeOut(p)), 1 - p);
  } else {
    // Hold: a slow push in. On the end card the last photo keeps pushing.
    const s = seg.kind === 'end' ? 1.05 + 0.06 * (dt / span) : 1 + 0.05 * (dt / span);
    zoomBlur(ctx, media(i), s, 0);
  }
}

// ---------- Whip pan: the photos fly sideways past each other on the cut ----------

function drawWhip({ ctx, t, clips, media, i }: Args) {
  const HALF = 0.09; // the whip takes 0.18 s, centred on the cut
  // Which cut are we near: this clip's start (coming in) or the next one's (going out)?
  let a = -1;
  let tc = 0;
  if (i > 0 && t - clips[i].start < HALF) {
    a = i - 1;
    tc = clips[i].start;
  } else if (clips[i + 1] && clips[i + 1].start - t < HALF) {
    a = i;
    tc = clips[i + 1].start;
  }
  if (a < 0) {
    const m = media(i);
    if (m) drawCover(ctx, m, 1.04);
    return;
  }
  const b = a + 1;
  const dir = a % 2 === 0 ? 1 : -1; // alternate left and right
  const pos = clamp01((t - tc + HALF) / (2 * HALF));
  const e = easeInOut(pos);
  const blur = 160 * Math.sin(Math.PI * pos);
  const draw = (m: Media | null, dx: number) => {
    if (!m) return;
    if (blur < 4) {
      coverIn(ctx, m, 0, 0, W, H, 1.04, dx);
      return;
    }
    ctx.save();
    for (let k = -2; k <= 2; k++) {
      ctx.globalAlpha = k === 0 ? 1 : 0.35;
      coverIn(ctx, m, 0, 0, W, H, 1.04, dx + (k * blur) / 2);
    }
    ctx.restore();
  };
  draw(media(a), -dir * W * e);
  draw(media(b), dir * W * (1 - e));
}

// ---------- Polaroid stack: prints drop onto a table and pile up ----------

function drawPolaroids({ ctx, t, clips, media, i }: Args) {
  const g = ctx.createRadialGradient(W / 2, H * 0.45, 100, W / 2, H * 0.5, H * 0.75);
  g.addColorStop(0, '#5a4330');
  g.addColorStop(1, '#22180f');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const fw = 760;
  const pad = 40;
  const ph = (fw - 2 * pad) * 1.2;
  const fh = ph + pad + 170;
  for (let j = Math.max(0, i - 7); j <= i; j++) {
    const m = media(j);
    if (!m) continue;
    const landed = t - clips[j].start;
    if (landed < 0) continue;
    const drop = easeOut(landed / 0.2);
    const cx = W / 2 + (rnd(j) - 0.5) * 260;
    const cy = H * 0.46 + (rnd(j, 1) - 0.5) * 300;
    const rot = (rnd(j, 2) - 0.5) * 0.36;
    const s = 1 + 0.45 * (1 - drop);
    ctx.save();
    ctx.globalAlpha = clamp01(landed / 0.06);
    ctx.translate(cx, cy);
    ctx.rotate(rot - 0.25 * (1 - drop) * (rnd(j, 3) > 0.5 ? 1 : -1));
    ctx.scale(s, s);
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = 20 + 50 * (1 - drop);
    ctx.shadowOffsetY = 10 + 40 * (1 - drop);
    ctx.fillStyle = '#f7f3ea';
    ctx.fillRect(-fw / 2, -fh / 2, fw, fh);
    ctx.shadowColor = 'transparent';
    coverIn(ctx, m, -fw / 2 + pad, -fh / 2 + pad, fw - 2 * pad, ph);
    ctx.restore();
  }
}

// ---------- Strips: three tall panels slide in, one per beat, then the next three ----------

function drawStrips({ ctx, t, seg, clips, media, i }: Args) {
  const n = 3;
  const gap = 8;
  const sw = (W - gap * (n - 1)) / n;
  const group = Math.floor(i / n);
  for (let s = 0; s < n; s++) {
    let j = group * n + s;
    let landed: number;
    if (j <= i) landed = t - clips[j].start;
    else if (seg.kind === 'end') {
      // An unfinished last row borrows the first photos so the end card is full.
      j = s % Math.max(1, clips.length);
      landed = t - seg.start;
    } else continue;
    const m = media(j);
    if (!m) continue;
    const dir = s % 2 === 0 ? -1 : 1;
    const off = (1 - easeOut(landed / 0.22)) * H * dir;
    coverIn(ctx, m, s * (sw + gap), 0, sw, H, 1.02, 0, off);
  }
}

// ---------- Glitch: a hard cut with shake, colour split and torn lines ----------

const tints = new WeakMap<object, { red: HTMLCanvasElement; cyan: HTMLCanvasElement }>();
function tinted(m: Media) {
  const have = tints.get(m.el);
  if (have) return have;
  const make = (colour: string) => {
    const c = document.createElement('canvas');
    c.width = W / 2;
    c.height = H / 2;
    const x = c.getContext('2d')!;
    const s = Math.max(c.width / m.w, c.height / m.h);
    x.drawImage(m.el, (c.width - m.w * s) / 2, (c.height - m.h * s) / 2, m.w * s, m.h * s);
    x.globalCompositeOperation = 'multiply';
    x.fillStyle = colour;
    x.fillRect(0, 0, c.width, c.height);
    return c;
  };
  // Video frames change, so only still photos get a cached colour split.
  const out = { red: make('#ff2a2a'), cyan: make('#2affff') };
  if (m.kind === 'image') tints.set(m.el, out);
  return out;
}

function drawGlitch({ ctx, t, seg, clips, media, i, dt }: Args) {
  const m = media(i);
  if (!m) return;
  const frame = Math.floor(t * 30);
  // Strong for a moment after each cut, a small kick on the beats in between.
  const sinceBeat = t - ([...seg.beats].reverse().find((b) => b <= t) ?? seg.start);
  const hit = seg.kind === 'clip' || dt < 0.2 ? Math.max(1 - dt / 0.2, sinceBeat < 0.08 && dt > 0.2 ? 0.35 : 0) : 0;
  const shake = 50 * hit;
  const sx = (rnd(frame, 1) - 0.5) * shake;
  const sy = (rnd(frame, 2) - 0.5) * shake;
  coverIn(ctx, m, 0, 0, W, H, 1.06, sx, sy);
  if (hit > 0.05) {
    const { red, cyan } = tinted(m);
    const split = 30 * hit;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.55 * hit;
    ctx.drawImage(red, sx + split - W * 0.03, sy - H * 0.03, W * 1.06, H * 1.06);
    ctx.drawImage(cyan, sx - split - W * 0.03, sy - H * 0.03, W * 1.06, H * 1.06);
    ctx.restore();
    // Torn lines: slices of the picture pushed sideways.
    const slices = Math.round(3 + 5 * hit);
    for (let k = 0; k < slices; k++) {
      const y = rnd(frame, 10 + k) * H;
      const h = 12 + rnd(frame, 30 + k) * 110;
      const shift = (rnd(frame, 50 + k) - 0.5) * 220 * hit;
      ctx.drawImage(ctx.canvas, 0, y, W, h, shift, y, W, h);
    }
    ctx.fillStyle = `rgba(255,255,255,${(0.2 * hit * hit).toFixed(3)})`;
    ctx.fillRect(0, 0, W, H);
  }
  // Scan lines, always on, faint.
  ctx.fillStyle = 'rgba(0,0,0,0.13)';
  for (let y = 0; y < H; y += 6) ctx.fillRect(0, y, W, 2);
  void clips;
}
