// Vines that grow around the words when you stop to read.
//
// Nothing happens while you're reading along. Leave the page still for a while
// (no scrolling, typing or moving the pointer) and vines creep in from the
// edges of the screen and wind through the gaps between the lines. Run the
// pointer over them and the leaves it touches come loose and fall; scroll (as
// you will) and every leaf drops at once and the bare vines fade, ready to grow
// again the next time the page is left alone.
//
// Reduced motion: none of this happens. ?vines=now starts them after 3 seconds
// instead of the usual wait, to try it out.

const TAU = Math.PI * 2;
const IDLE_MS = 30_000;
const LEAF_COLS = ['#5d8c44', '#79a852', '#4d7a3a'];
const PETALS = ['#e27396', '#f3efe2', '#f2a65a', '#b79cf0'];

interface Agent {
  x: number;
  y: number;
  a: number;
  home: number;
  width: number;
  life: number;
}
interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface Leaf {
  x: number;
  y: number;
  a: number;
  len: number;
  col: string;
  flower: boolean;
  /** 0..1 as it unfurls */
  open: number;
  /** frames to wait before falling (-1 = still attached) */
  drop: number;
  vx: number;
  vy: number;
  va: number;
  phase: number;
}

export function idleVines(root: HTMLElement, stems: HTMLCanvasElement, leafCanvas: HTMLCanvasElement): () => void {
  const sx = stems.getContext('2d');
  const lx = leafCanvas.getContext('2d');
  if (!sx || !lx) return () => {};
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};
  const wait = new URLSearchParams(location.search).get('vines') === 'now' ? 3000 : IDLE_MS;

  let state: 'waiting' | 'growing' | 'clearing' = 'waiting';
  let timer = 0;
  let raf = 0;
  let vw = 1, vh = 1;
  let agents: Agent[] = [];
  // figures, code and the summary box: the vines keep off these
  let keepOut: Box[] = [];
  // lines of text: the vines wind between them, and pass behind them faintly
  let lines: Box[] = [];
  let leaves: Leaf[] = [];
  let frame = 0;
  const last = { x: -1, y: -1 };

  function size(c: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.round(vw * dpr);
    c.height = Math.round(vh * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // every line of text on screen, and figures and code as whole blocks
  function measure() {
    const solid: Box[] = [];
    const text: Box[] = [];
    const add = (boxes: Box[], r: DOMRect, pad: number) => {
      if (r.width <= 0 || r.height <= 0 || r.bottom < -40 || r.top > vh + 40) return;
      boxes.push({ x: r.left - pad, y: r.top - pad, w: r.width + pad * 2, h: r.height + pad * 2 });
    };
    for (const el of root.querySelectorAll('figure, pre, table, img, svg, .cs-short, button, input')) {
      if (el.closest('.og-band')) continue;
      add(solid, el.getBoundingClientRect(), 6);
    }
    for (const el of root.querySelectorAll('h1, h2, h3, h4, p, li, dt, dd, blockquote, .back, .cs-kicker')) {
      if (el.closest('figure, pre, .cs-short')) continue;
      const r = el.getBoundingClientRect();
      if (r.bottom < -40 || r.top > vh + 40) continue;
      const range = document.createRange();
      range.selectNodeContents(el);
      for (const line of range.getClientRects()) add(text, line, 1);
    }
    return { solid, text };
  }

  function plant() {
    vw = document.documentElement.clientWidth;
    vh = window.innerHeight;
    size(stems, sx!);
    size(leafCanvas, lx!);
    sx!.clearRect(0, 0, vw, vh);
    lx!.clearRect(0, 0, vw, vh);
    stems.classList.remove('is-fading');
    ({ solid: keepOut, text: lines } = measure());
    leaves = [];
    agents = [];
    const phone = vw < 760;
    const thick = phone ? 1.6 : 2.2;
    const seed = (x: number, y: number, a: number) =>
      agents.push({ x, y, a, home: a, width: thick * (0.75 + Math.random() * 0.5), life: (phone ? 260 : 420) + Math.random() * 380 });
    const n = phone ? 2 : 3;
    // in from both edges, toward the text, at spread-out heights
    for (let i = 0; i < n; i++) {
      seed(-4, vh * ((i + 0.2 + Math.random() * 0.6) / n), (Math.random() - 0.5) * 0.7);
      seed(vw + 4, vh * ((i + 0.2 + Math.random() * 0.6) / n), Math.PI + (Math.random() - 0.5) * 0.7);
    }
    // and up from the bottom of the screen
    seed(vw * (0.15 + Math.random() * 0.2), vh + 4, -Math.PI / 2 + (Math.random() - 0.5) * 0.5);
    seed(vw * (0.65 + Math.random() * 0.2), vh + 4, -Math.PI / 2 + (Math.random() - 0.5) * 0.5);
  }

  function turn(from: number, to: number, rate: number) {
    const d = ((to - from + Math.PI * 3) % TAU) - Math.PI;
    return from + d * rate;
  }
  const hit = (boxes: Box[], x: number, y: number) => {
    for (const k of boxes) if (x > k.x && x < k.x + k.w && y > k.y && y < k.y + k.h) return k;
    return null;
  };

  function grow() {
    const next: Agent[] = [];
    for (const g of agents) {
      g.a = turn(g.a, g.home, 0.015) + (Math.random() - 0.5) * 0.32;
      const ax = g.x + Math.cos(g.a) * 14, ay = g.y + Math.sin(g.a) * 14;
      // turn away from figures and code, and stop if one is reached
      const k = hit(keepOut, ax, ay);
      if (k) {
        g.a = turn(g.a, Math.atan2(g.y - (k.y + k.h / 2), (g.x - (k.x + k.w / 2)) * (k.h / k.w)), 0.4);
        g.home = g.a;
      }
      if (hit(keepOut, g.x, g.y)) {
        bud(g);
        continue;
      }
      // lean into the gaps between lines, running along them rather than across
      const inLine = hit(lines, g.x, g.y);
      if (hit(lines, ax, ay) && !inLine) {
        const along = Math.cos(g.a) >= 0 ? 0 : Math.PI;
        g.a = turn(g.a, along, 0.18);
      }
      const nx = g.x + Math.cos(g.a) * 0.7;
      const ny = g.y + Math.sin(g.a) * 0.7;
      // behind a word the vine carries on, sunk into the night so the word stays clear
      // (a solid colour, not transparency, so the overlapping steps don't bead)
      sx!.strokeStyle = inLine ? '#1a2a17' : g.width > 1.6 ? '#35592a' : '#4d7a3a';
      sx!.lineWidth = g.width;
      sx!.lineCap = 'round';
      sx!.beginPath();
      sx!.moveTo(g.x, g.y);
      sx!.lineTo(nx, ny);
      sx!.stroke();
      g.x = nx;
      g.y = ny;
      g.life--;
      g.width *= 0.9992;
      if (Math.random() < (inLine ? 0.01 : 0.028)) {
        const side = Math.random() < 0.5 ? 1 : -1;
        const l = leaf(g.x, g.y, g.a + side * (0.8 + Math.random() * 0.6), 4 + g.width * 2.6, false);
        if (inLine) l.col = '#22361d';
        leaves.push(l);
      }
      if (Math.random() < 0.004 && agents.length + next.length < 26 && g.width > 1) {
        const a = g.a + (Math.random() < 0.5 ? 1 : -1) * (0.6 + Math.random() * 0.6);
        next.push({ x: g.x, y: g.y, a, home: a, width: g.width * 0.7, life: 120 + Math.random() * 220 });
      }
      if (g.life > 0 && g.width > 0.5 && g.x > -20 && g.x < vw + 20 && g.y > -20 && g.y < vh + 20) next.push(g);
      else bud(g);
    }
    agents = next;
  }

  function leaf(x: number, y: number, a: number, len: number, flower: boolean): Leaf {
    return {
      x, y, a, len, flower,
      col: flower ? PETALS[Math.floor(Math.random() * PETALS.length)] : LEAF_COLS[Math.floor(Math.random() * LEAF_COLS.length)],
      open: 0, drop: -1, vx: 0, vy: 0, va: 0, phase: Math.random() * TAU,
    };
  }
  function bud(g: Agent) {
    if (g.x > 0 && g.x < vw && g.y > 0 && g.y < vh && !hit(lines, g.x, g.y) && Math.random() < 0.3) leaves.push(leaf(g.x, g.y, Math.random() * TAU, vw < 760 ? 3.5 : 5, true));
  }

  function fall(l: Leaf, delay: number) {
    if (l.drop >= 0) return;
    l.drop = delay;
    l.vx = (Math.random() - 0.5) * 0.8;
    l.vy = -0.2 - Math.random() * 0.4;
    l.va = (Math.random() - 0.5) * 0.08;
  }

  function drawLeaves() {
    lx!.clearRect(0, 0, vw, vh);
    for (const l of leaves) {
      lx!.save();
      lx!.translate(l.x, l.y);
      lx!.rotate(l.a);
      lx!.fillStyle = l.col;
      const k = 0.2 + 0.8 * l.open;
      if (l.flower) {
        const r = l.len * k;
        for (let i = 0; i < 5; i++) {
          lx!.rotate(TAU / 5);
          lx!.beginPath();
          lx!.ellipse(0, -r * 0.7, r * 0.42, r * 0.7, 0, 0, TAU);
          lx!.fill();
        }
        lx!.fillStyle = '#8a5a24';
        lx!.beginPath();
        lx!.arc(0, 0, Math.max(1, r * 0.3), 0, TAU);
        lx!.fill();
      } else {
        const len = l.len * k;
        lx!.beginPath();
        lx!.moveTo(0, 0);
        lx!.quadraticCurveTo(len * 0.5, -len * 0.38, len, 0);
        lx!.quadraticCurveTo(len * 0.5, len * 0.38, 0, 0);
        lx!.fill();
      }
      lx!.restore();
    }
  }

  function tick() {
    raf = 0;
    frame++;
    if (state === 'growing') for (let i = 0; i < 2 && agents.length; i++) grow();
    let moving = false;
    const kept: Leaf[] = [];
    for (const l of leaves) {
      if (l.open < 1) {
        l.open = Math.min(1, l.open + 0.02);
        moving = true;
      }
      if (l.drop > 0) {
        l.drop--;
        moving = true;
      } else if (l.drop === 0) {
        // drift down, swaying side to side and turning over
        l.vy = Math.min(1.3, l.vy + 0.03);
        l.x += l.vx + Math.sin(frame * 0.05 + l.phase) * 0.6;
        l.y += l.vy;
        l.a += l.va + Math.sin(frame * 0.04 + l.phase) * 0.02;
        moving = true;
        if (l.y > vh + 20) continue;
      }
      kept.push(l);
    }
    leaves = kept;
    drawLeaves();
    if (state === 'clearing' && !leaves.length) {
      state = 'waiting';
      sx!.clearRect(0, 0, vw, vh);
      lx!.clearRect(0, 0, vw, vh);
      stems.classList.remove('is-fading');
      arm();
      return;
    }
    if ((state === 'growing' && agents.length) || moving) raf = requestAnimationFrame(tick);
  }
  const kick = () => {
    if (!raf) raf = requestAnimationFrame(tick);
  };

  function arm() {
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      if (document.hidden) return arm();
      state = 'growing';
      plant();
      kick();
    }, wait);
  }

  // scrolling (or typing, or a tap) drops every leaf and fades the stems
  function clear() {
    if (state === 'waiting') return arm();
    if (state === 'clearing') return;
    state = 'clearing';
    agents = [];
    stems.classList.add('is-fading');
    for (const l of leaves) fall(l, Math.floor(Math.random() * 24));
    kick();
  }

  const onPointer = (e: PointerEvent) => {
    if (Math.abs(e.clientX - last.x) + Math.abs(e.clientY - last.y) < 4) return;
    last.x = e.clientX;
    last.y = e.clientY;
    if (state === 'waiting') return arm();
    // run the pointer over the vines and the leaves it brushes come loose
    let any = false;
    for (const l of leaves) {
      if (l.drop >= 0) continue;
      const dx = l.x - e.clientX, dy = l.y - e.clientY;
      if (dx * dx + dy * dy < 30 * 30) {
        fall(l, 0);
        any = true;
      }
    }
    if (any) kick();
  };
  const onActive = () => clear();
  const onVisible = () => {
    if (state === 'waiting') arm();
  };
  const onResize = () => {
    if (state !== 'waiting') {
      state = 'waiting';
      agents = [];
      leaves = [];
      sx!.clearRect(0, 0, vw, vh);
      lx!.clearRect(0, 0, vw, vh);
    }
    arm();
  };

  window.addEventListener('scroll', onActive, { passive: true });
  window.addEventListener('wheel', onActive, { passive: true });
  window.addEventListener('touchstart', onActive, { passive: true });
  window.addEventListener('keydown', onActive);
  window.addEventListener('pointerdown', onActive);
  window.addEventListener('pointermove', onPointer, { passive: true });
  window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', onVisible);
  arm();

  return () => {
    clearTimeout(timer);
    cancelAnimationFrame(raf);
    window.removeEventListener('scroll', onActive);
    window.removeEventListener('wheel', onActive);
    window.removeEventListener('touchstart', onActive);
    window.removeEventListener('keydown', onActive);
    window.removeEventListener('pointerdown', onActive);
    window.removeEventListener('pointermove', onPointer);
    window.removeEventListener('resize', onResize);
    document.removeEventListener('visibilitychange', onVisible);
  };
}
