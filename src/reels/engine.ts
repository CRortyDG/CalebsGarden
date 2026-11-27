// The reel maker's engine: find the beat in a song, lay clips on it, and draw any moment of
// the reel onto a 1080×1920 canvas. No libraries and no server: Web Audio decodes the song,
// this file finds the beats, and the page records the canvas with MediaRecorder.

import { drawJump, type JumpStyle } from './jumps';

export const W = 1080;
export const H = 1920;
export const FPS = 30;

// ---------- beats ----------

export type Analysis = {
  bpm: number;
  /** Seconds between beats. */
  period: number;
  /** Beat times in seconds, from the first beat the tracker found to the song's end. */
  beats: number[];
  duration: number;
  /** True when the beats sit on an even grid (most pop, dance and hip hop); the cuts then use the grid. */
  steady: boolean;
  /** A small waveform overview for drawing (0..1, one value per 1/100 s bucket group). */
  overview: Float32Array;
};

const ENV_FPS = 100; // the onset curve has one value per 10 ms

/**
 * Finds the beats of a decoded song. It builds an onset curve (how suddenly the low end and
 * the top end get louder), picks the tempo from that curve's autocorrelation with a gentle
 * pull toward 120 BPM, then follows the beats with dynamic programming (Ellis, 2007) so a
 * drifting live drummer is followed too. A steady song is snapped to an exact grid.
 */
export function analyze(buf: AudioBuffer): Analysis {
  const sr = buf.sampleRate;
  const n = buf.length;
  const hop = Math.round(sr / ENV_FPS);
  const frames = Math.floor(n / hop);
  const chans = Array.from({ length: buf.numberOfChannels }, (_, c) => buf.getChannelData(c));

  const low = new Float32Array(frames);
  const high = new Float32Array(frames);
  const a = Math.exp((-2 * Math.PI * 180) / sr); // one-pole low pass at 180 Hz splits kick/bass from the rest
  let lp = 0;
  for (let i = 0; i < frames * hop; i++) {
    let x = 0;
    for (const ch of chans) x += ch[i];
    x /= chans.length;
    lp = (1 - a) * x + a * lp;
    const hi = x - lp;
    const f = (i / hop) | 0;
    low[f] += lp * lp;
    high[f] += hi * hi;
  }

  const env = new Float32Array(frames);
  let prevL = 0;
  let prevH = 0;
  for (let f = 0; f < frames; f++) {
    const l = Math.log1p((1000 * low[f]) / hop);
    const h = Math.log1p((1000 * high[f]) / hop);
    env[f] = Math.max(0, l - prevL) + 0.6 * Math.max(0, h - prevH);
    prevL = l;
    prevH = h;
  }
  // Take away the local average so a loud chorus doesn't count as one long onset, then scale to unit spread.
  const win = 30;
  const smooth = movingAverage(env, win);
  let sum = 0;
  let sq = 0;
  for (let f = 0; f < frames; f++) {
    env[f] = Math.max(0, env[f] - smooth[f]);
    sum += env[f];
    sq += env[f] * env[f];
  }
  const mean = sum / Math.max(1, frames);
  const sd = Math.sqrt(Math.max(1e-12, sq / Math.max(1, frames) - mean * mean));
  for (let f = 0; f < frames; f++) env[f] /= sd;

  // Tempo from autocorrelation, 70–180 BPM, weighted toward 120.
  const minLag = Math.floor((60 / 180) * ENV_FPS);
  const maxLag = Math.ceil((60 / 70) * ENV_FPS);
  const ac = new Float32Array(maxLag * 2 + 2);
  for (let lag = minLag; lag <= Math.min(maxLag * 2 + 1, frames - 1); lag++) {
    let s = 0;
    for (let f = lag; f < frames; f++) s += env[f] * env[f - lag];
    ac[lag] = s / (frames - lag);
  }
  let best = minLag;
  let bestScore = -Infinity;
  for (let lag = minLag; lag <= maxLag; lag++) {
    const bpm = (60 * ENV_FPS) / lag;
    const prior = Math.exp(-0.5 * (Math.log2(bpm / 120) / 0.9) ** 2);
    const score = (ac[lag] + 0.5 * (ac[lag * 2] ?? 0)) * prior;
    if (score > bestScore) {
      bestScore = score;
      best = lag;
    }
  }
  // Parabolic interpolation for a fractional lag.
  const y0 = ac[best - 1] ?? 0;
  const y1 = ac[best];
  const y2 = ac[best + 1] ?? 0;
  const denom = y0 - 2 * y1 + y2;
  const period = best + (denom < 0 ? (0.5 * (y0 - y2)) / denom : 0);

  const tracked = trackBeats(env, period).map((f) => f / ENV_FPS);
  let beats = tracked;
  let steady = false;
  let beatPeriod = period / ENV_FPS;
  if (tracked.length >= 8) {
    // Least squares fit of beat k = a + k·p. If the song is steady, use the grid: perfectly even cuts.
    const k = tracked.length;
    let sk = 0, st = 0, skk = 0, skt = 0;
    tracked.forEach((t, i) => {
      sk += i;
      st += t;
      skk += i * i;
      skt += i * t;
    });
    const p = (k * skt - sk * st) / (k * skk - sk * sk);
    const a0 = (st - p * sk) / k;
    const rms = Math.sqrt(tracked.reduce((s, t, i) => s + (t - (a0 + i * p)) ** 2, 0) / k);
    beatPeriod = p;
    if (rms < 0.025) {
      steady = true;
      beats = tracked.map((_, i) => a0 + i * p);
    }
  }

  return {
    bpm: Math.round((60 / beatPeriod) * 10) / 10,
    period: beatPeriod,
    beats,
    duration: buf.duration,
    steady,
    overview: overviewOf(chans, 1200),
  };
}

function movingAverage(x: Float32Array, w: number) {
  const out = new Float32Array(x.length);
  let s = 0;
  const half = w >> 1;
  for (let i = 0; i < x.length + half; i++) {
    if (i < x.length) s += x[i];
    if (i - w >= 0) s -= x[i - w];
    const at = i - half;
    if (at >= 0 && at < x.length) out[at] = s / Math.min(w, i + 1);
  }
  return out;
}

/** Dynamic-programming beat tracker: every beat is an onset peak about one period after the last one. */
function trackBeats(env: Float32Array, period: number): number[] {
  const n = env.length;
  const score = new Float32Array(n);
  const back = new Int32Array(n).fill(-1);
  const tight = 400;
  const lo = Math.round(period / 2);
  const hi = Math.round(period * 2);
  for (let t = 0; t < n; t++) {
    let bestV = 0;
    let bestP = -1;
    for (let p = t - hi; p <= t - lo; p++) {
      if (p < 0) continue;
      const v = score[p] - tight * Math.log((t - p) / period) ** 2;
      if (bestP < 0 || v > bestV) {
        bestV = v;
        bestP = p;
      }
    }
    score[t] = env[t] + (bestP >= 0 ? Math.max(0, bestV) : 0);
    back[t] = bestP >= 0 && bestV > 0 ? bestP : -1;
  }
  // Start from the best-scoring frame in the last period and walk back.
  let t = n - 1;
  for (let i = Math.max(0, n - Math.round(period)); i < n; i++) if (score[i] > score[t]) t = i;
  const out: number[] = [];
  while (t >= 0) {
    out.push(t);
    t = back[t];
  }
  return out.reverse();
}

function overviewOf(chans: Float32Array[], buckets: number) {
  const n = chans[0]?.length ?? 0;
  const out = new Float32Array(buckets);
  const size = Math.max(1, Math.floor(n / buckets));
  let max = 1e-9;
  for (let b = 0; b < buckets; b++) {
    let peak = 0;
    for (let i = b * size; i < Math.min(n, (b + 1) * size); i += 8) {
      for (const ch of chans) peak = Math.max(peak, Math.abs(ch[i]));
    }
    out[b] = peak;
    max = Math.max(max, peak);
  }
  for (let b = 0; b < buckets; b++) out[b] /= max;
  return out;
}

/** `count` beat times from the first beat at or after `from`, carried on past the song's end at the same tempo. */
export function beatsFrom(an: Pick<Analysis, 'beats' | 'period'>, from: number, count: number): number[] {
  const out: number[] = [];
  let i = an.beats.findIndex((b) => b >= from - 0.03);
  if (i < 0) i = an.beats.length;
  for (; i < an.beats.length && out.length < count; i++) out.push(an.beats[i]);
  let last = out.length ? out[out.length - 1] : (an.beats.at(-1) ?? from - an.period);
  if (!out.length) {
    // Past the end of the tracked beats: carry on the grid from the last beat.
    while (last < from - 0.03) last += an.period;
    out.push(last);
  }
  while (out.length < count) out.push((last = out[out.length - 1] + an.period));
  return out;
}

/** An even grid for when there's no song (export silent, add the music in the app). */
export function gridAnalysis(bpm: number, seconds = 600): Analysis {
  const period = 60 / bpm;
  const beats = Array.from({ length: Math.floor(seconds / period) }, (_, i) => i * period);
  return { bpm, period, beats, duration: seconds, steady: true, overview: new Float32Array(0) };
}

// ---------- the reel's timeline ----------

export type Segment = { kind: 'clip' | 'end'; index: number; start: number; end: number; beats: number[] };
export type Timeline = { songStart: number; duration: number; segments: Segment[] };

/**
 * Lays clips on the beats. Time 0 of the reel is the first beat at or after `startAt` in the
 * song, so the first clip lands on a beat; every cut after it is a beat too.
 */
export function buildTimeline(an: Analysis, startAt: number, clipBeats: number[], endBeats: number): Timeline {
  const total = clipBeats.reduce((s, b) => s + b, 0) + endBeats;
  const grid = beatsFrom(an, startAt, total + 1);
  const t0 = grid[0];
  const segments: Segment[] = [];
  let at = 0;
  const push = (kind: Segment['kind'], index: number, beats: number) => {
    segments.push({
      kind,
      index,
      start: grid[at] - t0,
      end: grid[at + beats] - t0,
      beats: grid.slice(at, at + beats).map((b) => b - t0),
    });
    at += beats;
  };
  clipBeats.forEach((b, i) => push('clip', i, b));
  if (endBeats > 0) push('end', 0, endBeats);
  return { songStart: t0, duration: segments.length ? segments[segments.length - 1].end : 0, segments };
}

export function segmentAt(tl: Timeline, t: number): Segment | undefined {
  for (const s of tl.segments) if (t < s.end) return s;
  return tl.segments[tl.segments.length - 1];
}

// ---------- drawing ----------

export type Media =
  | { kind: 'image'; el: HTMLImageElement | ImageBitmap | HTMLCanvasElement; w: number; h: number }
  | { kind: 'video'; el: HTMLVideoElement; w: number; h: number };

export type Card = { media: Media | null; text: string; fit: 'fill' | 'whole' };
export type EndCard = { media: Media | null; tagline: string; small: string };
export type Look = {
  text: 'bold' | 'boxed';
  motion: 'punch' | 'flash' | 'clean';
  /** CSS font family list for the captions. */
  font: string;
  /** 'story': one clip at a time with a line of text. 'recap': a photo dump that builds into a collage. */
  mode?: 'story' | 'recap' | JumpStyle;
  /** Recap only: how many photos pop in on their own (the rest of the screen black) before the collage starts to build. */
  alone?: number;
};

/** Background colours for clips with no photo yet (text-only cards are a real reel move too). */
const CARD_COLOURS = ['#ffd27a', '#8dbb62', '#8fc3d9', '#e08a5b', '#eef2e8'];
const CARD_INK = '#14140f';
const NIGHT = '#0b120e';

const easeOutBack = (x: number) => {
  const c1 = 1.7;
  const c3 = c1 + 1;
  return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2;
};
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** Draws the reel at time `t` (seconds from the first beat). */
export function drawFrame(ctx: CanvasRenderingContext2D, t: number, tl: Timeline, cards: Card[], end: EndCard, look: Look) {
  ctx.save();
  ctx.fillStyle = NIGHT;
  ctx.fillRect(0, 0, W, H);
  const seg = segmentAt(tl, t);
  if (!seg) {
    ctx.restore();
    return;
  }
  if (look.mode && look.mode !== 'story') {
    if (look.mode === 'recap') drawRecap(ctx, t, seg, tl, cards, end, look);
    else drawJump(ctx, t, seg, tl, cards, end, look, look.mode);
    fadeOut(ctx, t, tl);
    ctx.restore();
    return;
  }
  const dt = Math.max(0, t - seg.start);
  const span = Math.max(0.001, seg.end - seg.start);
  const lastBeat = [...seg.beats].reverse().find((b) => b <= t) ?? seg.start;
  const sinceBeat = t - lastBeat;

  // Motion: a punch-in on the cut, a small bump on each beat inside a clip, and a slow push the whole time.
  let scale = 1 + 0.05 * (dt / span);
  if (look.motion === 'punch') scale += 0.08 * Math.exp(-dt / 0.09) + (lastBeat > seg.start ? 0.022 * Math.exp(-sinceBeat / 0.08) : 0);
  else if (look.motion === 'flash') scale += lastBeat > seg.start ? 0.015 * Math.exp(-sinceBeat / 0.08) : 0;

  if (seg.kind === 'clip') {
    const card = cards[seg.index];
    const colour = CARD_COLOURS[seg.index % CARD_COLOURS.length];
    if (card?.media) {
      if (card.fit === 'whole') drawWhole(ctx, card.media, scale, 0.28, 0.9);
      else drawCover(ctx, card.media, scale);
    } else {
      ctx.fillStyle = colour;
      ctx.fillRect(0, 0, W, H);
    }
    if (card?.text) {
      const y = card.media && card.fit === 'whole' ? H * 0.155 : H * 0.5;
      drawCaption(ctx, card.text, y, dt, look, card.media ? null : CARD_INK);
    }
  } else {
    // The end card: the board itself, the tagline on top, the small line under it a beat later.
    if (end.media) drawWhole(ctx, end.media, 1 + 0.03 * (dt / span) + 0.01 * Math.sin(dt * 2.2), 0.3, 0.92);
    else {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#16251a');
      g.addColorStop(1, NIGHT);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
    if (end.tagline) drawCaption(ctx, end.tagline, end.media ? H * 0.155 : H * 0.45, dt, look, null);
    const beat2 = seg.beats[1] ?? seg.start + 0.5;
    if (end.small && t >= beat2) drawSmall(ctx, end.small, end.media ? H * 0.255 : H * 0.58, t - beat2, look);
  }

  if (look.motion === 'flash') {
    ctx.fillStyle = `rgba(255,255,255,${(0.55 * Math.exp(-dt / 0.07)).toFixed(3)})`;
    ctx.fillRect(0, 0, W, H);
  }
  fadeOut(ctx, t, tl);
  ctx.restore();
}

/** Fade to black over the last half second. */
function fadeOut(ctx: CanvasRenderingContext2D, t: number, tl: Timeline) {
  const out = clamp01((t - (tl.duration - 0.5)) / 0.5);
  if (out > 0) {
    ctx.fillStyle = `rgba(0,0,0,${out.toFixed(3)})`;
    ctx.fillRect(0, 0, W, H);
  }
}

// ---------- the photo recap ----------

export const RECAP_MAX = 60;
export type Grid = { cols: number; rows: number; count: number; order: number[] };

/**
 * The collage: a 3×3 grid of small 9:16 tiles, so every tile is a little copy of the screen's
 * shape. The photos that flash alone sit in the middle column first; the collage then fills
 * from the bottom up, so the screen builds rather than scatters. Past nine photos, each new one
 * cuts into the next cell in the same order, so a long recap keeps changing without ever
 * looking crowded.
 */
export function recapGrid(n: number): Grid {
  const count = Math.max(1, Math.min(RECAP_MAX, n));
  const cols = 3;
  const rows = 3;
  const cells = cols * rows;
  const first = [1, cols + 1, cols + 2, 0, 2 * cols + 1].filter((c) => c < cells);
  // Then bottom row to top, alternating direction across each row.
  const rest: number[] = [];
  for (let r = rows - 1; r >= 0; r--) {
    const row = Array.from({ length: cols }, (_, c) => r * cols + c);
    if ((rows - 1 - r) % 2) row.reverse();
    for (const c of row) if (!first.includes(c)) rest.push(c);
  }
  return { cols, rows, count, order: [...first, ...rest] };
}

/**
 * A photo dump that builds into a collage, cut like an editor would: hard cuts, no bounce,
 * lots of black. Each of the first photos lands on its beat as a small tile, blinks once,
 * and is gone, leaving the screen dark until the next hit. Then the rest land one per cut and
 * stay, and on the last beat the ones that flashed alone come back and the grid is full.
 * Inside every tile the picture drifts slowly, so stills feel like footage.
 */
function drawRecap(ctx: CanvasRenderingContext2D, t: number, seg: Segment, tl: Timeline, cards: Card[], end: EndCard, look: Look) {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, W, H);
  const g = recapGrid(cards.length);
  const gap = 6;
  const cw = (W - gap * (g.cols + 1)) / g.cols;
  const ch = (H - gap * (g.rows + 1)) / g.rows;
  const alone = Math.max(0, Math.min(look.alone ?? 0, g.count));
  const tile = (card: number, cell: number, since: number) => {
    const m = cards[card]?.media;
    if (!m || since < 0) return;
    const x = gap + (cell % g.cols) * (cw + gap);
    const y = gap + Math.floor(cell / g.cols) * (ch + gap);
    // A slow drift, a different direction per photo.
    const drift = Math.min(1, (since + card * 0.37) / 6);
    const dir = card % 4;
    const s = Math.max(cw / m.w, ch / m.h) * (1.06 + 0.05 * drift);
    const dx = (dir === 0 ? 1 : dir === 1 ? -1 : 0) * 0.025 * cw * (drift - 0.5);
    const dy = (dir === 2 ? 1 : dir === 3 ? -1 : 0) * 0.025 * ch * (drift - 0.5);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, cw, ch);
    ctx.clip();
    ctx.globalAlpha = clamp01(since / 0.05); // two frames in, never a pop
    ctx.drawImage(m.el, x + (cw - m.w * s) / 2 + dx, y + (ch - m.h * s) / 2 + dy, m.w * s, m.h * s);
    ctx.restore();
  };
  const landed = (i: number) => t - (tl.segments[i]?.start ?? 0);
  const cells = g.order.length;
  const cellOf = (j: number) => g.order[j % cells];
  /** Draws, for each cell, the newest photo in it among photos from..upto. */
  const latest = (from: number, upto: number, since?: number) => {
    const done = new Set<number>();
    for (let j = upto; j >= from && done.size < cells; j--) {
      const c = cellOf(j);
      if (done.has(c)) continue;
      done.add(c);
      tile(j, c, since ?? landed(j));
    }
    return done;
  };

  if (seg.kind === 'clip') {
    const i = seg.index;
    const dt = t - seg.start;
    const beat = seg.beats.length > 1 ? seg.beats[1] - seg.beats[0] : (seg.end - seg.start) / 2;
    if (i >= g.count) return;
    if (i < alone) {
      // On for a beat with one blink in it, then dark until the next hit.
      const on = dt < beat * 0.55 || (dt > beat * 0.68 && dt < beat * 1.15);
      if (on) tile(i, cellOf(i), dt);
    } else latest(alone, i);
    return;
  }

  // The last beat: the photos that flashed alone come back into any cell still empty.
  const since = t - seg.start;
  const filled = latest(alone, g.count - 1);
  for (let j = 0; j < alone; j++) if (!filled.has(cellOf(j))) {
    filled.add(cellOf(j));
    tile(j, cellOf(j), since);
  }
  for (let c = 0, k = 0; c < cells; c++) if (!filled.has(g.order[c])) tile(k++ % g.count, g.order[c], since);
  const second = seg.beats[1] ?? seg.start + 0.5;
  if (end.tagline && t >= second) {
    ctx.fillStyle = `rgba(0,0,0,${(0.45 * clamp01((t - second) / 0.25)).toFixed(3)})`;
    ctx.fillRect(0, 0, W, H);
    drawQuiet(ctx, end.tagline, H * 0.5, t - second, look, 64);
  }
  const third = seg.beats[2] ?? second + 0.5;
  if (end.small && t >= third) drawQuiet(ctx, end.small, H * 0.5 + 90, t - third, look, 34, 0.7);
}

/** Quiet type for the photo styles: no outline, no bounce, a short fade and a small rise. */
export function drawQuiet(ctx: CanvasRenderingContext2D, text: string, cy: number, dt: number, look: Look, size: number, alpha = 1) {
  const p = clamp01(dt / 0.35);
  const e = 1 - (1 - p) ** 3;
  ctx.save();
  ctx.globalAlpha = alpha * e;
  ctx.font = `500 ${size}px ${look.font}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  if ('letterSpacing' in ctx) (ctx as unknown as { letterSpacing: string }).letterSpacing = `${(size * 0.02).toFixed(1)}px`;
  const lines = wrap(ctx, text, W * 0.8);
  lines.forEach((line, i) => ctx.fillText(line, W / 2, cy + (i - (lines.length - 1) / 2) * size * 1.2 + 14 * (1 - e)));
  ctx.restore();
}

export function drawCover(ctx: CanvasRenderingContext2D, m: Media, scale: number) {
  const s = Math.max(W / m.w, H / m.h) * scale;
  const w = m.w * s;
  const h = m.h * s;
  ctx.drawImage(m.el, (W - w) / 2, (H - h) / 2, w, h);
}

/** The whole picture (a screenshot, a wide photo), on a darkened, blown-up copy of itself. */
function drawWhole(ctx: CanvasRenderingContext2D, m: Media, scale: number, top: number, bottom: number) {
  // Safari before 18 has no canvas filter: darken the copy instead of blurring it.
  const canFilter = typeof (ctx as { filter?: unknown }).filter === 'string';
  ctx.save();
  if (canFilter) ctx.filter = 'blur(36px) brightness(0.45)';
  drawCover(ctx, m, 1.15);
  ctx.restore();
  if (!canFilter) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);
  }
  const boxH = H * (bottom - top);
  const s = Math.min((W * 0.86) / m.w, boxH / m.h) * scale;
  const w = m.w * s;
  const h = m.h * s;
  const x = (W - w) / 2;
  const y = H * top + (boxH - h) / 2;
  const r = 36;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 50;
  ctx.shadowOffsetY = 18;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = NIGHT;
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.clip();
  ctx.drawImage(m.el, x, y, w, h);
  ctx.restore();
}

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number): string[] {
  const lines: string[] = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width > max && line) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    if (line) lines.push(line);
  }
  return lines;
}

export function drawCaption(ctx: CanvasRenderingContext2D, text: string, cy: number, dt: number, look: Look, ink: string | null) {
  const pop = easeOutBack(clamp01(dt / 0.16));
  const s = 0.82 + 0.18 * pop;
  const alpha = clamp01(dt / 0.05);
  let size = look.text === 'boxed' ? 84 : 112;
  let lines: string[] = [];
  for (; size >= 52; size -= 6) {
    ctx.font = `800 ${size}px ${look.font}`;
    lines = wrap(ctx, text, W * 0.82);
    if (lines.length <= 4) break;
  }
  const lh = size * 1.12;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(W / 2, cy);
  ctx.scale(s, s);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  const top = (-(lines.length - 1) * lh) / 2;
  lines.forEach((line, i) => {
    const y = top + i * lh;
    if (ink) {
      ctx.fillStyle = ink;
      ctx.fillText(line, 0, y);
    } else if (look.text === 'boxed') {
      const w = ctx.measureText(line).width;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(-w / 2 - 26, y - lh / 2 + 4, w + 52, lh - 2, 18);
      ctx.fill();
      ctx.fillStyle = CARD_INK;
      ctx.fillText(line, 0, y + 2);
    } else {
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur = 24;
      ctx.lineWidth = size * 0.16;
      ctx.strokeStyle = '#000000';
      ctx.strokeText(line, 0, y);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(line, 0, y);
    }
  });
  ctx.restore();
}

export function drawSmall(ctx: CanvasRenderingContext2D, text: string, cy: number, dt: number, look: Look) {
  const pop = easeOutBack(clamp01(dt / 0.16));
  ctx.save();
  ctx.globalAlpha = clamp01(dt / 0.05);
  ctx.translate(W / 2, cy);
  ctx.scale(0.85 + 0.15 * pop, 0.85 + 0.15 * pop);
  ctx.font = `800 56px ${look.font}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const w = ctx.measureText(text).width;
  ctx.fillStyle = '#ffd27a';
  ctx.beginPath();
  ctx.roundRect(-w / 2 - 34, -48, w + 68, 96, 48);
  ctx.fill();
  ctx.fillStyle = CARD_INK;
  ctx.fillText(text, 0, 2);
  ctx.restore();
}

/** Keeps video clips playing in step with the reel: the clip on screen plays, the rest wait at their start. */
export function syncVideos(t: number, tl: Timeline, cards: Card[], end: EndCard, playing: boolean) {
  const seg = segmentAt(tl, t);
  const media = cards.map((c) => c.media);
  media.push(end.media);
  media.forEach((m, i) => {
    if (m?.kind !== 'video') return;
    const v = m.el;
    const active = seg && (seg.kind === 'clip' ? seg.index === i : i === cards.length);
    if (!active || !seg) {
      if (!v.paused) v.pause();
      if (v.currentTime > 0.05 && !v.seeking) v.currentTime = 0;
      return;
    }
    const want = Math.min(Math.max(0, t - seg.start), Math.max(0, (v.duration || 0) - 0.05));
    if (Math.abs(v.currentTime - want) > (playing ? 0.3 : 0.04)) v.currentTime = want;
    if (playing && v.paused) void v.play().catch(() => {});
    if (!playing && !v.paused) v.pause();
  });
}

/** The best recording format this browser has: MP4 (Chrome, Edge, Safari) or WebM (Firefox). */
export function pickRecorderType(withAudio: boolean): string | null {
  if (typeof MediaRecorder === 'undefined') return null;
  const types = withAudio
    ? ['video/mp4;codecs=avc1.640028,mp4a.40.2', 'video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm']
    : ['video/mp4;codecs=avc1.640028', 'video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'];
  return types.find((t) => MediaRecorder.isTypeSupported(t)) ?? null;
}
