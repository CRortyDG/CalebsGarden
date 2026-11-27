// Vines that overgrow the words when you stop to read.
//
// Nothing happens while you're reading along. Leave the page still for a while
// (no scrolling, typing or moving the pointer) and the vines in the header
// band grow on, down out of it (or in from the top of the screen, if you're
// further down the page) and take the page over, like a building left to the
// weeds: they climb the margins and the edges of the text, and wrap around the
// headings, passing over a letter, under the next, and over again. They keep
// off the paragraphs, lists, code and boxes, so the reading stays clear. Run the
// pointer over them and the leaves it touches come loose, drift down a little
// way and fade. Scroll (as you will) or click and the new growth is cut back:
// every leaf drops at once and the new vines fade, while the header band's own
// vines stay put. Then it all waits to grow again the next time the page is left alone.
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
  /** where it is in winding round a line: over the words when sin(wrap) > -0.3, under them otherwise */
  wrap: number;
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
  /** how far it has fallen, and how far it falls before it's gone (5-10% of the screen) */
  fell: number;
  reach: number;
}

export function idleVines(
  root: HTMLElement,
  under: HTMLCanvasElement,
  stems: HTMLCanvasElement,
  leafCanvas: HTMLCanvasElement,
): () => void {
  // two layers of stem, one under the page's text and one over it, so a vine can wind round a line
  const ux = under.getContext('2d');
  const sx = stems.getContext('2d');
  const lx = leafCanvas.getContext('2d');
  if (!ux || !sx || !lx) return () => {};
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};
  const wait = new URLSearchParams(location.search).get('vines') === 'now' ? 3000 : IDLE_MS;

  let state: 'waiting' | 'growing' | 'clearing' = 'waiting';
  let timer = 0;
  let raf = 0;
  let vw = 1, vh = 1;
  let agents: Agent[] = [];
  // lines of text, and code, figures and boxes whole: what the vines wind round
  let lines: Box[] = [];
  let keepOff: Box[] = [];
  let leaves: Leaf[] = [];
  let frame = 0;
  const last = { x: -1, y: -1 };

  function size(c: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.round(vw * dpr);
    c.height = Math.round(vh * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // what's on screen: the reading (paragraphs, lists, code, figures, boxes)
  // as whole blocks the vines keep off, and each line of every heading,
  // which they're free to climb over and wrap around
  function measure() {
    const solid: Box[] = [];
    const text: Box[] = [];
    const add = (boxes: Box[], r: DOMRect, pad: number) => {
      if (r.width <= 0 || r.height <= 0 || r.bottom < -40 || r.top > vh + 40) return;
      boxes.push({ x: r.left - pad, y: r.top - pad, w: r.width + pad * 2, h: r.height + pad * 2 });
    };
    for (const el of root.querySelectorAll('p, ul, ol, dl, blockquote, figure, pre, table, img, svg, .cs-short, nav, button, input')) {
      if (el.closest('.og-band') && !el.matches('p')) continue;
      add(solid, el.getBoundingClientRect(), vw < 760 ? 4 : 10);
    }
    for (const el of root.querySelectorAll('h1, h2, h3, h4')) {
      if (el.closest('figure, pre, .cs-short, nav')) continue;
      const r = el.getBoundingClientRect();
      if (r.bottom < -40 || r.top > vh + 40) continue;
      const range = document.createRange();
      range.selectNodeContents(el);
      for (const line of range.getClientRects()) add(text, line, 2);
    }
    return { solid, text };
  }

  function plant() {
    vw = document.documentElement.clientWidth;
    vh = window.innerHeight;
    size(under, ux!);
    size(stems, sx!);
    size(leafCanvas, lx!);
    wipe();
    const m = measure();
    lines = m.text;
    keepOff = m.solid;
    leaves = [];
    agents = [];
    const phone = vw < 760;
    const thick = phone ? 2.4 : 3.4;
    const seed = (x: number, y: number, a: number) =>
      agents.push({
        x, y, a, home: a, wrap: Math.random() * TAU,
        width: thick * (0.75 + Math.random() * 0.5),
        life: (phone ? 450 : 750) + Math.random() * (phone ? 400 : 600),
      });
    // the vines in the header band grow on, down out of it and into the page:
    // from the band's foot when it's on screen, or in from the top of the
    // screen (as if they'd come all the way down) when you're further along
    const band = root.querySelector('.og-band');
    const foot = band ? band.getBoundingClientRect().bottom - 30 : -30;
    const y0 = Math.max(-30, Math.min(vh - 40, foot));
    const col = (root.querySelector('.cs-prose p, .cs-prose, p') ?? root).getBoundingClientRect();
    // the margins: left of the text, and right of the widest block on screen
    const left = Math.max(phone ? 6 : 10, Math.min(col.left, ...keepOff.map((k) => k.x)) - 6);
    const right = Math.min(vw - (phone ? 6 : 10), Math.max(col.right, ...keepOff.map((k) => k.x + k.w)) + 6);
    const down = (spread: number) => Math.PI / 2 + (Math.random() - 0.5) * spread;
    // down the margins on both sides
    for (let i = 0; i < (phone ? 1 : 2); i++) {
      seed(Math.max(3, left * (0.2 + Math.random() * 0.6)), y0 + Math.random() * 20, down(phone ? 0.15 : 0.5));
      seed(Math.min(vw - 3, right + (vw - right) * (0.2 + Math.random() * 0.6)), y0 + Math.random() * 20, down(phone ? 0.15 : 0.5));
    }
    // and down into the text, to climb the edges of the paragraphs and wrap the headings
    seed(col.left + col.width * (0.15 + Math.random() * 0.3), y0, down(0.8));
    if (!phone) seed(col.left + col.width * (0.55 + Math.random() * 0.3), y0, down(0.8));
  }

  function wipe() {
    for (const c of [ux!, sx!, lx!]) c.clearRect(0, 0, vw, vh);
    under.classList.remove('is-fading');
    stems.classList.remove('is-fading');
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
      // keep off the reading: turn aside before a paragraph or box, and
      // climb along its edge like ivy up a wall; one that ends up on it stops
      const ahead = hit(keepOff, g.x + Math.cos(g.a) * 16, g.y + Math.sin(g.a) * 16);
      if (ahead) {
        // slip off to the nearer side of it, and carry on down past it
        const side = g.x < ahead.x + ahead.w / 2 ? Math.PI - 0.25 : 0.25;
        g.a = turn(g.a, side, 0.35);
        g.home = Math.PI / 2;
      }
      if (hit(keepOff, g.x, g.y)) continue;
      // on a heading, creep along the line, winding over and under it
      const on = hit(lines, g.x, g.y);
      if (on) {
        g.a = turn(g.a, Math.cos(g.a) >= 0 ? 0 : Math.PI, 0.03);
        g.wrap += 0.09;
      }
      const over = !on || Math.sin(g.wrap) > -0.3;
      const nx = g.x + Math.cos(g.a) * 0.7;
      const ny = g.y + Math.sin(g.a) * 0.7;
      const c = over ? sx! : ux!;
      c.strokeStyle = g.width > 2 ? '#35592a' : '#4d7a3a';
      c.lineWidth = g.width;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(g.x, g.y);
      c.lineTo(nx, ny);
      c.stroke();
      g.x = nx;
      g.y = ny;
      g.life--;
      g.width *= 0.9995;
      if (over && Math.random() < 0.05) {
        const side = Math.random() < 0.5 ? 1 : -1;
        leaves.push(leaf(g.x, g.y, g.a + side * (0.8 + Math.random() * 0.6), 4 + g.width * 2.4, false));
      }
      if (Math.random() < 0.007 && agents.length + next.length < (vw < 760 ? 25 : 45) && g.width > 1) {
        const a = g.a + (Math.random() < 0.5 ? 1 : -1) * (0.6 + Math.random() * 0.6);
        next.push({ x: g.x, y: g.y, a, home: a, wrap: Math.random() * TAU, width: g.width * 0.7, life: 200 + Math.random() * 400 });
      }
      if (g.life > 0 && g.width > 0.5 && g.x > -20 && g.x < vw + 20 && g.y > -45 && g.y < vh + 20) next.push(g);
      else bud(g);
    }
    agents = next;
  }

  function leaf(x: number, y: number, a: number, len: number, flower: boolean): Leaf {
    return {
      x, y, a, len, flower,
      col: flower ? PETALS[Math.floor(Math.random() * PETALS.length)] : LEAF_COLS[Math.floor(Math.random() * LEAF_COLS.length)],
      open: 0, drop: -1, vx: 0, vy: 0, va: 0, phase: Math.random() * TAU, fell: 0, reach: 0,
    };
  }
  function bud(g: Agent) {
    if (g.x > 0 && g.x < vw && g.y > 0 && g.y < vh && !hit(keepOff, g.x, g.y) && Math.random() < 0.35) leaves.push(leaf(g.x, g.y, Math.random() * TAU, vw < 760 ? 3.5 : 5, true));
  }

  function fall(l: Leaf, delay: number) {
    if (l.drop >= 0) return;
    l.drop = delay;
    l.vx = (Math.random() - 0.5) * 0.8;
    l.vy = -0.2 - Math.random() * 0.4;
    l.va = (Math.random() - 0.5) * 0.08;
    l.reach = vh * (0.05 + Math.random() * 0.05);
  }

  function drawLeaves() {
    lx!.clearRect(0, 0, vw, vh);
    for (const l of leaves) {
      lx!.save();
      // a falling leaf fades over the second half of its fall
      if (l.drop === 0) lx!.globalAlpha = Math.max(0, Math.min(1, 2 * (1 - l.fell / l.reach)));
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
    if (state === 'growing' && agents.length) grow();
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
        // drift down slowly, swaying side to side and turning over, and fade
        // away a short way down rather than falling right off the screen
        l.vy = Math.min(0.55, l.vy + 0.02);
        l.x += l.vx * 0.5 + Math.sin(frame * 0.05 + l.phase) * 0.4;
        l.y += l.vy;
        l.fell += Math.max(0, l.vy);
        l.a += l.va + Math.sin(frame * 0.04 + l.phase) * 0.02;
        moving = true;
        if (l.fell >= l.reach) continue;
      }
      kept.push(l);
    }
    leaves = kept;
    drawLeaves();
    if (state === 'clearing' && !leaves.length) {
      state = 'waiting';
      wipe();
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
    under.classList.add('is-fading');
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
      wipe();
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
