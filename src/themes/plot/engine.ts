// The garden: a top-down canvas scene of raised beds, one per project.
// At night (by the visitor's clock) every bed has a lamp, the pointer is a
// lantern that adds to them, Candlefair's bed has candles and fireflies drift
// after the light. By day it is
// still and sunny. Everything readable or clickable lives in the DOM on top
// (the stakes and the key), so this file is pure decoration plus hover and click on beds.

import type { BedKind, BedRect } from './layout';

export interface GardenBed {
  id: string;
  kind: BedKind;
  /** false for a bed with nothing to open */
  clickable: boolean;
  wide: BedRect;
  tall: BedRect;
}

type Rand = () => number;
type Ctx = CanvasRenderingContext2D;

const TAU = Math.PI * 2;
const PORTRAIT = '(orientation: portrait) and (max-width: 820px)';
const KEY_GROWN = 'cg-grown';
const KEY_TIME = 'cg-time';

function rng(seed: number): Rand {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
function store(key: string, value?: string): string | null {
  try {
    if (value === undefined) return localStorage.getItem(key);
    localStorage.setItem(key, value);
  } catch {
    /* private mode or blocked storage: the garden works without it */
  }
  return null;
}
// read once per page load, so React's dev double-mount doesn't skip the grow-in
let firstVisitCache: boolean | null = null;

const ease = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.pow(1 - t, 3));

function leaf(ctx: Ctx, x: number, y: number, len: number, wid: number, a: number, col: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(len * 0.5, -wid, len, 0);
  ctx.quadraticCurveTo(len * 0.5, wid, 0, 0);
  ctx.fill();
  ctx.restore();
}

interface Plant {
  kind: 'rosette' | 'sun' | 'sprout' | 'pot';
  x: number;
  y: number;
  r: number;
  rot: number;
  n: number;
  col: string;
  delay: number;
}
interface Candle { x: number; y: number; ph: number }
interface Fly { x: number; y: number; vx: number; vy: number; ph: number }
interface Pad { x: number; y: number; r: number; a: number }

export function plantGarden(stage: HTMLElement, beds: GardenBed[], onOpen: (id: string) => void): () => void {
  const canvas = stage.querySelector('canvas');
  if (!canvas) return () => {};
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  const reduceMq = matchMedia('(prefers-reduced-motion: reduce)');
  const portraitMq = matchMedia(PORTRAIT);
  // every element that names a bed: its stake on the map and its entry in the key
  const marks = [...stage.querySelectorAll<HTMLElement>('[data-bed]')];
  const timeBtn = stage.querySelector<HTMLButtonElement>('.time');

  // ---- time of day -------------------------------------------------------
  const hour = new Date().getHours();
  const clockNight = hour >= 19 || hour < 7;
  const saved = store(KEY_TIME);
  let night = saved === 'night' ? true : saved === 'day' ? false : clockNight;
  if (reduceMq.matches && saved == null) night = false;

  // ---- grow-in on the first visit ----------------------------------------
  if (firstVisitCache === null) {
    firstVisitCache = store(KEY_GROWN) == null;
    store(KEY_GROWN, '1');
  }
  const firstVisit = firstVisitCache;
  const plantedAt = performance.now() - (firstVisit && !reduceMq.matches ? 0 : 1e6);

  // ---- scene state -------------------------------------------------------
  let w = 1, h = 1, dpr = 1, unit = 1;
  let layout: 'wide' | 'tall' = 'wide';
  let lawn: HTMLCanvasElement | null = null;
  const shade = document.createElement('canvas');
  const sctx = shade.getContext('2d')!;
  let plants: Plant[] = [];
  let candles: Candle[] = [];
  let flies: Fly[] = [];
  let pads: Pad[] = [];
  let pond = { x: 0, y: 0, rx: 0, ry: 0 };

  const rect = (b: GardenBed) => {
    const r = b[layout];
    return { x: r.x * w, y: r.y * h, w: r.w * w, h: r.h * h };
  };

  function build() {
    const box = stage.getBoundingClientRect();
    w = Math.max(1, box.width);
    h = Math.max(1, box.height);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    unit = Math.min(w, h);
    layout = portraitMq.matches ? 'tall' : 'wide';
    for (const c of [canvas!, shade]) {
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
    }
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    sctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const R = rng(7);
    lawn = document.createElement('canvas');
    lawn.width = canvas!.width;
    lawn.height = canvas!.height;
    const l = lawn.getContext('2d')!;
    l.setTransform(dpr, 0, 0, dpr, 0, 0);

    // grass
    l.fillStyle = '#3d5a33';
    l.fillRect(0, 0, w, h);
    const blades = Math.min(120000, (w * h) / 20);
    for (let i = 0; i < blades; i++) {
      const g = (70 + R() * 55) | 0;
      l.fillStyle = `rgba(${(g * 0.55) | 0},${g},${(g * 0.45) | 0},${0.25 + R() * 0.4})`;
      l.fillRect(R() * w, R() * h, 1 + R() * 2, 1 + R() * 3);
    }
    // soft mown stripes
    for (let x = 0; x < w; x += unit * 0.12) {
      l.fillStyle = 'rgba(255,255,255,0.018)';
      l.fillRect(x, 0, unit * 0.06, h);
    }

    // stepping-stone path from the gate
    const P =
      layout === 'wide'
        ? [[0.04, 1.03], [0.42, 0.7], [0.4, 0.3], [0.98, 0.05]]
        : [[0.5, 1.03], [0.95, 0.66], [0.02, 0.48], [0.7, 0.02]];
    const bez = (t: number) => {
      const u = 1 - t;
      const k = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
      return [
        (k[0] * P[0][0] + k[1] * P[1][0] + k[2] * P[2][0] + k[3] * P[3][0]) * w,
        (k[0] * P[0][1] + k[1] * P[1][1] + k[2] * P[2][1] + k[3] * P[3][1]) * h,
      ];
    };
    const stoneR = Math.max(7, unit * 0.022);
    const stepCount = Math.round((w + h) / (stoneR * 3.4));
    for (let i = 0; i <= stepCount; i++) {
      const [x0, y0] = bez(i / stepCount);
      const x = x0 + (R() - 0.5) * 8, y = y0 + (R() - 0.5) * 8, r = stoneR * (0.8 + R() * 0.4), a = R() * TAU;
      l.save();
      l.translate(x, y);
      l.rotate(a);
      l.fillStyle = 'rgba(0,0,0,.28)';
      l.beginPath();
      l.ellipse(2, 3, r * 1.2, r * 0.85, 0, 0, TAU);
      l.fill();
      l.fillStyle = '#9a958a';
      l.beginPath();
      l.ellipse(0, 0, r * 1.2, r * 0.85, 0, 0, TAU);
      l.fill();
      l.fillStyle = 'rgba(255,255,255,.12)';
      l.beginPath();
      l.ellipse(-r * 0.3, -r * 0.25, r * 0.6, r * 0.35, 0, 0, TAU);
      l.fill();
      l.restore();
    }

    // pond
    pond =
      layout === 'wide'
        ? { x: 0.885 * w, y: 0.76 * h, rx: unit * 0.13, ry: unit * 0.1 }
        : { x: 0.26 * w, y: 0.525 * h, rx: unit * 0.17, ry: unit * 0.13 };
    l.fillStyle = 'rgba(0,0,0,.3)';
    l.beginPath();
    l.ellipse(pond.x + 3, pond.y + 5, pond.rx * 1.08, pond.ry * 1.1, 0, 0, TAU);
    l.fill();
    for (let i = 0; i < 34; i++) {
      const a = (i / 34) * TAU;
      l.fillStyle = R() < 0.5 ? '#8d887d' : '#a49f93';
      l.beginPath();
      l.ellipse(pond.x + Math.cos(a) * pond.rx * 1.04, pond.y + Math.sin(a) * pond.ry * 1.05, unit * 0.014, unit * 0.011, a, 0, TAU);
      l.fill();
    }
    const water = l.createRadialGradient(pond.x - pond.rx * 0.3, pond.y - pond.ry * 0.3, 0, pond.x, pond.y, pond.rx);
    water.addColorStop(0, '#2c5c6a');
    water.addColorStop(1, '#173540');
    l.fillStyle = water;
    l.beginPath();
    l.ellipse(pond.x, pond.y, pond.rx, pond.ry, 0, 0, TAU);
    l.fill();
    pads = Array.from({ length: 5 }, () => ({
      x: pond.x + (R() - 0.5) * pond.rx * 1.2,
      y: pond.y + (R() - 0.5) * pond.ry * 1.1,
      r: unit * (0.014 + R() * 0.01),
      a: R() * TAU,
    }));

    // hedge around the edge
    l.strokeStyle = '#1f3519';
    l.lineWidth = Math.max(12, unit * 0.03);
    l.strokeRect(0, 0, w, h);
    const bushes = Math.round((w + h) / 6);
    for (let i = 0; i < bushes; i++) {
      const side = i % 4, t = R();
      const x = side < 2 ? t * w : side === 2 ? 0 : w;
      const y = side < 2 ? (side === 0 ? 0 : h) : t * h;
      l.fillStyle = R() < 0.5 ? '#27421f' : '#335528';
      l.beginPath();
      l.arc(x, y, unit * (0.012 + R() * 0.022), 0, TAU);
      l.fill();
    }

    // raised beds and what grows in them
    plants = [];
    candles = [];
    const frame = Math.max(5, unit * 0.012);
    for (const b of beds) {
      const r = rect(b);
      const pad = unit * 0.035;
      const inside = () => [r.x + pad + R() * (r.w - 2 * pad), r.y + pad + R() * (r.h - 2 * pad)];
      if (b.kind === 'greenhouse') {
        // glass house floor; pots drawn live so they can grow
        l.fillStyle = 'rgba(0,0,0,.35)';
        l.fillRect(r.x + 6, r.y + 8, r.w, r.h);
        l.fillStyle = '#2e3d2b';
        l.fillRect(r.x, r.y, r.w, r.h);
        const cols = Math.max(3, Math.round(r.w / (unit * 0.09)));
        for (let row = 0; row < 2; row++)
          for (let c = 0; c < cols; c++)
            plants.push({ kind: 'pot', x: r.x + (r.w * (c + 0.5)) / cols, y: r.y + r.h * (row ? 0.72 : 0.28), r: Math.min(r.w / cols, r.h / 2) * 0.32, rot: R() * TAU, n: 5, col: '#6e9d52', delay: 0.3 + R() * 0.8 });
        continue;
      }
      l.fillStyle = 'rgba(0,0,0,.35)';
      l.fillRect(r.x + 4, r.y + 6, r.w, r.h);
      l.fillStyle = '#7b5a35';
      l.fillRect(r.x, r.y, r.w, r.h);
      l.fillStyle = '#3a2a1c';
      l.fillRect(r.x + frame, r.y + frame, r.w - 2 * frame, r.h - 2 * frame);
      for (let i = 0; i < (r.w * r.h) / 28; i++) {
        l.fillStyle = `rgba(${(80 + R() * 40) | 0},${(55 + R() * 30) | 0},${(35 + R() * 20) | 0},.5)`;
        l.fillRect(r.x + frame + R() * (r.w - 2 * frame), r.y + frame + R() * (r.h - 2 * frame), 2, 2);
      }
      l.strokeStyle = 'rgba(0,0,0,.35)';
      l.lineWidth = 1;
      for (let k = 1; k < 4; k++) {
        l.beginPath();
        l.moveTo(r.x + (r.w * k) / 4, r.y);
        l.lineTo(r.x + (r.w * k) / 4, r.y + frame);
        l.moveTo(r.x + (r.w * k) / 4, r.y + r.h - frame);
        l.lineTo(r.x + (r.w * k) / 4, r.y + r.h);
        l.stroke();
      }
      if (b.kind === 'herbs') {
        const n = Math.round((r.w * r.h) / (unit * unit * 0.008));
        for (let i = 0; i < n; i++) {
          const [x, y] = inside();
          plants.push({ kind: 'rosette', x, y, r: unit * (0.03 + R() * 0.02), rot: R() * TAU, n: 6 + ((R() * 4) | 0), col: R() < 0.5 ? '#5f8f4a' : '#7aa35a', delay: R() * 0.7 });
        }
        for (let i = 0; i < 7; i++) {
          const [x, y] = inside();
          candles.push({ x, y, ph: R() * TAU });
        }
      }
      if (b.kind === 'sunflowers') {
        const cols = Math.max(2, Math.round(r.w / (unit * 0.1)));
        const rows = Math.max(1, Math.round(r.h / (unit * 0.1)));
        for (let row = 0; row < rows; row++)
          for (let c = 0; c < cols; c++)
            plants.push({ kind: 'sun', x: r.x + (r.w * (c + 0.5)) / cols + (R() - 0.5) * 6, y: r.y + (r.h * (row + 0.5)) / rows + (R() - 0.5) * 6, r: Math.min(r.w / cols, r.h / rows) * 0.36, rot: R() * TAU, n: 16, col: '', delay: 0.2 + R() * 0.7 });
      }
      if (b.kind === 'seedlings') {
        const n = Math.max(4, Math.round(r.w / (unit * 0.04)));
        for (let i = 0; i < n; i++)
          plants.push({ kind: 'sprout', x: r.x + pad + (i * (r.w - 2 * pad)) / (n - 1), y: r.y + r.h / 2 + (R() - 0.5) * r.h * 0.3, r: unit * 0.013, rot: R() * TAU, n: 2, col: '#8dbb62', delay: 1 + R() * 0.6 });
      }
    }

    const count = Math.round(Math.min(40, (w * h) / 26000));
    flies = Array.from({ length: count }, () => ({ x: R() * w, y: R() * h, vx: 0, vy: 0, ph: R() * TAU }));
  }

  // ---- drawing -----------------------------------------------------------
  function drawPlant(p: Plant, g: number, t: number) {
    if (g <= 0) return;
    const c = ctx!;
    const sway = reduceMq.matches ? 0 : Math.sin(t * 0.0012 + p.x * 0.05) * 0.06;
    if (p.kind === 'rosette') {
      for (let i = 0; i < p.n; i++) leaf(c, p.x, p.y, p.r * g, p.r * 0.35 * g, p.rot + (i * TAU) / p.n + sway, i % 2 ? p.col : '#4b7a3b');
      c.fillStyle = '#a9c98a';
      c.beginPath();
      c.arc(p.x, p.y, p.r * 0.18 * g, 0, TAU);
      c.fill();
    } else if (p.kind === 'sun') {
      const r = p.r * g;
      for (let i = 0; i < 8; i++) leaf(c, p.x, p.y, r * 1.25, r * 0.4, p.rot + (i * TAU) / 8 + sway * 0.5, '#3f6b33');
      for (let i = 0; i < 16; i++) leaf(c, p.x, p.y, r, r * 0.22, p.rot + (i * TAU) / 16 + sway, i % 2 ? '#f2c230' : '#e7a91c');
      c.fillStyle = '#4a2e12';
      c.beginPath();
      c.arc(p.x, p.y, r * 0.45, 0, TAU);
      c.fill();
      c.fillStyle = '#6b4420';
      for (let i = 0; i < 14; i++) {
        const a = i * 2.4, d = Math.sqrt(i / 14) * r * 0.4;
        c.fillRect(p.x + Math.cos(a) * d - 1, p.y + Math.sin(a) * d - 1, 2, 2);
      }
    } else if (p.kind === 'sprout') {
      const r = p.r * g;
      leaf(c, p.x, p.y, r * 1.6, r * 0.6, p.rot + sway, '#8dbb62');
      leaf(c, p.x, p.y, r * 1.6, r * 0.6, p.rot + Math.PI + sway, '#79a852');
    } else if (p.kind === 'pot') {
      c.fillStyle = '#8a4b2c';
      c.beginPath();
      c.arc(p.x, p.y, p.r, 0, TAU);
      c.fill();
      c.fillStyle = '#3a2a1c';
      c.beginPath();
      c.arc(p.x, p.y, p.r * 0.78, 0, TAU);
      c.fill();
      for (let k = 0; k < p.n; k++) leaf(c, p.x, p.y, p.r * 1.25 * g, p.r * 0.42 * g, p.rot + (k * TAU) / p.n + sway, p.col);
    }
  }

  function drawGlass(b: GardenBed) {
    const r = rect(b);
    const c = ctx!;
    const gr = c.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h);
    gr.addColorStop(0, 'rgba(190,225,235,.40)');
    gr.addColorStop(0.45, 'rgba(220,240,245,.14)');
    gr.addColorStop(0.5, 'rgba(255,255,255,.34)');
    gr.addColorStop(0.56, 'rgba(220,240,245,.12)');
    gr.addColorStop(1, 'rgba(170,210,225,.30)');
    c.fillStyle = gr;
    c.fillRect(r.x, r.y, r.w, r.h);
    c.strokeStyle = '#d9e4e0';
    c.lineWidth = 2;
    c.strokeRect(r.x, r.y, r.w, r.h);
    c.lineWidth = 1;
    c.strokeStyle = 'rgba(217,228,224,.6)';
    const panes = Math.max(4, Math.round(r.w / (unit * 0.06)));
    for (let k = 1; k < panes; k++) {
      c.beginPath();
      c.moveTo(r.x + (r.w * k) / panes, r.y);
      c.lineTo(r.x + (r.w * k) / panes, r.y + r.h);
      c.stroke();
    }
    c.lineWidth = 3;
    c.strokeStyle = '#e8efec';
    c.beginPath();
    c.moveTo(r.x, r.y + r.h / 2);
    c.lineTo(r.x + r.w, r.y + r.h / 2);
    c.stroke();
  }

  function drawPond(t: number) {
    const c = ctx!;
    c.save();
    c.beginPath();
    c.ellipse(pond.x, pond.y, pond.rx, pond.ry, 0, 0, TAU);
    c.clip();
    if (!reduceMq.matches) {
      for (let i = 0; i < 3; i++) {
        const k = ((t * 0.00025 + i / 3) % 1);
        c.strokeStyle = `rgba(200,230,240,${0.18 * (1 - k)})`;
        c.lineWidth = 1;
        c.beginPath();
        c.ellipse(pond.x + pond.rx * 0.2, pond.y - pond.ry * 0.1, pond.rx * k, pond.ry * k, 0, 0, TAU);
        c.stroke();
      }
    }
    for (const p of pads) {
      c.fillStyle = '#4f8a3e';
      c.beginPath();
      c.moveTo(p.x, p.y);
      c.arc(p.x, p.y, p.r, p.a + 0.35, p.a + TAU - 0.35);
      c.closePath();
      c.fill();
    }
    c.restore();
  }

  // ---- pointer / lantern -------------------------------------------------
  const lamp = { x: 0, y: 0, tx: 0, ty: 0, active: false, last: 0, placed: false };
  let hovered: GardenBed | null = null;

  function bedAt(x: number, y: number): GardenBed | null {
    for (const b of beds) {
      const r = rect(b);
      if (x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h) return b;
    }
    return null;
  }
  function local(e: PointerEvent) {
    const box = stage.getBoundingClientRect();
    return [e.clientX - box.left, e.clientY - box.top];
  }
  function onMove(e: PointerEvent) {
    const [x, y] = local(e);
    lamp.tx = x;
    lamp.ty = y;
    lamp.active = true;
    lamp.last = performance.now();
    if (e.pointerType === 'mouse') {
      // pointing at a bed's stake or its entry in the key lights that bed
      const mark = (e.target as HTMLElement).closest?.<HTMLElement>('[data-bed]');
      const named = mark ? beds.find((b) => b.id === mark.dataset.bed) : null;
      if (named && mark!.closest('.key')) {
        const r = rect(named);
        lamp.tx = r.x + r.w / 2;
        lamp.ty = r.y + r.h / 2;
      }
      setHover(named ?? bedAt(x, y));
    }
    kick();
  }
  function onLeave(e: PointerEvent) {
    if (e.pointerType === 'mouse') {
      lamp.active = false;
      setHover(null);
    }
  }
  // Click or tap a bed to open it (its stake and its key entry are links too).
  let down = { x: 0, y: 0, t: 0 };
  function onDown(e: PointerEvent) {
    down = { x: e.clientX, y: e.clientY, t: performance.now() };
    onMove(e);
  }
  function onUp(e: PointerEvent) {
    if (e.button !== 0) return;
    if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 10 || performance.now() - down.t > 600) return;
    if ((e.target as HTMLElement).closest('a, button')) return;
    const box = stage.getBoundingClientRect();
    const b = bedAt(e.clientX - box.left, e.clientY - box.top);
    if (e.pointerType !== 'mouse') setHover(b);
    if (b?.clickable) onOpen(b.id);
  }
  function setHover(b: GardenBed | null) {
    if (hovered === b) return;
    hovered = b;
    for (const el of marks) el.classList.toggle('is-on', b?.id === el.dataset.bed);
    canvas!.style.cursor = b?.clickable ? 'pointer' : '';
  }
  // keyboard focus on a stake lights its bed
  function onFocus(e: FocusEvent) {
    const id = (e.target as HTMLElement).dataset?.bed;
    const b = beds.find((x) => x.id === id);
    if (!b) return;
    const r = rect(b);
    lamp.tx = r.x + r.w / 2;
    lamp.ty = r.y + r.h / 2;
    lamp.active = true;
    lamp.last = performance.now();
    setHover(b);
    kick();
  }

  // ---- frame -------------------------------------------------------------
  function frame(t: number) {
    const c = ctx!;
    const reduce = reduceMq.matches;
    const age = (t - plantedAt) / 1000;

    // where the lantern is
    if (!lamp.placed) {
      lamp.x = lamp.tx = w * 0.5;
      lamp.y = lamp.ty = h * 0.5;
      lamp.placed = true;
    }
    const idle = !lamp.active || t - lamp.last > 6000;
    if (idle && !reduce) {
      lamp.tx = w * (0.5 + 0.34 * Math.sin(t * 0.00021));
      lamp.ty = h * (0.5 + 0.3 * Math.sin(t * 0.00029 + 1));
    }
    const follow = reduce ? 1 : idle ? 0.04 : 0.22;
    lamp.x += (lamp.tx - lamp.x) * follow;
    lamp.y += (lamp.ty - lamp.y) * follow;

    c.drawImage(lawn!, 0, 0, w, h);
    drawPond(t);
    for (const p of plants) drawPlant(p, ease((age - p.delay) / 1.4), t);
    for (const b of beds) if (b.kind === 'greenhouse') drawGlass(b);
    for (const k of candles) {
      c.fillStyle = '#efe6cf';
      c.beginPath();
      c.arc(k.x, k.y, Math.max(2.4, unit * 0.005), 0, TAU);
      c.fill();
    }
    if (hovered) {
      const r = rect(hovered);
      c.strokeStyle = night ? 'rgba(255,226,150,.65)' : 'rgba(255,248,220,.8)';
      c.lineWidth = 2;
      c.setLineDash([6, 5]);
      c.strokeRect(r.x - 5, r.y - 5, r.w + 10, r.h + 10);
      c.setLineDash([]);
    }

    if (night) {
      // fireflies drift toward the lantern but keep their distance
      for (const f of flies) {
        const dx = lamp.x - f.x, dy = lamp.y - f.y, d = Math.hypot(dx, dy) + 1;
        const pull = d < unit * 0.35 ? 0.07 : 0.012;
        f.vx = f.vx * 0.96 + (dx / d) * pull + Math.cos(t * 0.002 + f.ph) * 0.05;
        f.vy = f.vy * 0.96 + (dy / d) * pull + Math.sin(t * 0.0017 + f.ph) * 0.05;
        if (d < unit * 0.07) {
          f.vx -= (dx / d) * 0.2;
          f.vy -= (dy / d) * 0.2;
        }
        if (!reduce) {
          f.x += f.vx;
          f.y += f.vy;
        }
      }

      sctx.globalCompositeOperation = 'source-over';
      sctx.clearRect(0, 0, w, h);
      sctx.fillStyle = 'rgba(6,10,24,.85)';
      sctx.fillRect(0, 0, w, h);
      sctx.globalCompositeOperation = 'destination-out';
      const hole = (x: number, y: number, r: number, a: number) => {
        const g = sctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(0,0,0,${a})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        sctx.fillStyle = g;
        sctx.beginPath();
        sctx.arc(x, y, r, 0, TAU);
        sctx.fill();
      };
      const reach = unit * 0.46;
      hole(lamp.x, lamp.y, reach, 1);
      // every bed has its own lamp, so the whole map reads without the lantern
      for (const b of beds) {
        const r = rect(b);
        hole(r.x + r.w / 2, r.y + r.h * 0.4, Math.max(r.w, r.h) * 0.78, hovered === b ? 0.95 : 0.72);
      }
      for (const k of candles) {
        const fl = reduce ? 1 : 0.75 + 0.25 * Math.sin(t * 0.011 + k.ph) * Math.sin(t * 0.0047 + k.ph * 2);
        hole(k.x, k.y, unit * 0.05 * fl + 10, 0.9);
      }
      for (const f of flies) {
        const on = 0.5 + 0.5 * Math.sin(t * 0.003 + f.ph * 3);
        if (on > 0.3) hole(f.x, f.y, 14 * on, 0.7);
      }
      c.drawImage(shade, 0, 0, w, h);

      c.globalCompositeOperation = 'lighter';
      const glow = (x: number, y: number, r: number, col: string) => {
        const g = c.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, col);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = g;
        c.beginPath();
        c.arc(x, y, r, 0, TAU);
        c.fill();
      };
      glow(lamp.x, lamp.y, reach * 0.75, 'rgba(255,170,70,.16)');
      for (const b of beds) {
        const r = rect(b);
        glow(r.x + r.w / 2, r.y, unit * 0.11, 'rgba(255,196,110,.20)');
      }
      // moon glint on the pond
      glow(pond.x - pond.rx * 0.35, pond.y - pond.ry * 0.35, pond.rx * 0.35, 'rgba(170,200,255,.18)');
      for (const k of candles) {
        const fl = reduce ? 1 : 0.7 + 0.3 * Math.sin(t * 0.013 + k.ph);
        glow(k.x, k.y, unit * 0.035 * fl + 6, 'rgba(255,190,90,.55)');
        c.fillStyle = '#fff2c8';
        c.beginPath();
        c.arc(k.x, k.y - 1, 1.6, 0, TAU);
        c.fill();
      }
      for (const f of flies) {
        const on = Math.max(0, Math.sin(t * 0.003 + f.ph * 3));
        glow(f.x, f.y, 9 * on + 1, `rgba(200,255,120,${0.8 * on})`);
      }
      c.globalCompositeOperation = 'source-over';
    } else {
      // warm afternoon light from the top left
      const sun = c.createLinearGradient(0, 0, w, h);
      sun.addColorStop(0, 'rgba(255,236,180,.14)');
      sun.addColorStop(1, 'rgba(40,60,90,.10)');
      c.fillStyle = sun;
      c.fillRect(0, 0, w, h);
    }
  }

  // ---- loop --------------------------------------------------------------
  let raf = 0;
  let visible = true;
  let running = false;
  const tick = (t: number) => {
    frame(t);
    const growing = (t - plantedAt) / 1000 < 3;
    if (visible && !document.hidden && (!reduceMq.matches || growing)) raf = requestAnimationFrame(tick);
    else running = false;
  };
  function kick() {
    if (running) return;
    running = true;
    raf = requestAnimationFrame(tick);
  }
  const io = new IntersectionObserver((es) => {
    visible = es[0].isIntersecting;
    if (visible) kick();
  });

  function setNight(next: boolean, remember: boolean) {
    night = next;
    if (remember) store(KEY_TIME, next ? 'night' : 'day');
    if (timeBtn) {
      timeBtn.hidden = false;
      timeBtn.textContent = night ? 'Day' : 'Night';
      timeBtn.setAttribute('aria-label', night ? 'Switch the garden to daytime' : 'Switch the garden to night');
    }
    stage.dataset.time = night ? 'night' : 'day';
    kick();
  }
  const onTime = () => setNight(!night, true);
  const onResize = () => {
    build();
    kick();
  };
  const onVis = () => {
    if (!document.hidden) kick();
  };

  build();
  setNight(night, false);
  const ro = new ResizeObserver(onResize);
  ro.observe(stage);
  io.observe(stage);
  stage.addEventListener('pointermove', onMove);
  stage.addEventListener('pointerdown', onDown);
  stage.addEventListener('pointerup', onUp);
  stage.addEventListener('pointerleave', onLeave);
  stage.addEventListener('focusin', onFocus);
  timeBtn?.addEventListener('click', onTime);
  document.addEventListener('visibilitychange', onVis);
  portraitMq.addEventListener('change', onResize);
  kick();

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
    stage.removeEventListener('pointermove', onMove);
    stage.removeEventListener('pointerdown', onDown);
  stage.removeEventListener('pointerup', onUp);
    stage.removeEventListener('pointerleave', onLeave);
    stage.removeEventListener('focusin', onFocus);
    timeBtn?.removeEventListener('click', onTime);
    document.removeEventListener('visibilitychange', onVis);
    portraitMq.removeEventListener('change', onResize);
  };
}
