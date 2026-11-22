// Decorative vines that grow around the name on the first screen. They are
// different on every visit, lean toward the pointer while they grow, and keep
// clear of the text and the buds. Clicking bare ground plants a new sprout, and
// regrow() clears them and grows a fresh set.

const TAU = Math.PI * 2;

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

export function growVines(hero: HTMLElement): { stop: () => void; regrow: () => void } {
  const canvas = hero.querySelector('canvas');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return { stop: () => {}, regrow: () => {} };
  const reduceMq = matchMedia('(prefers-reduced-motion: reduce)');

  let w = 1, h = 1;
  let agents: Agent[] = [];
  let keepOut: Box[] = [];
  const pointer = { x: 0, y: 0, on: false, overText: false };
  let raf = 0;
  let visible = true;

  const R = Math.random;

  function leaf(x: number, y: number, len: number, a: number, col: string) {
    ctx!.save();
    ctx!.translate(x, y);
    ctx!.rotate(a);
    ctx!.fillStyle = col;
    ctx!.beginPath();
    ctx!.moveTo(0, 0);
    ctx!.quadraticCurveTo(len * 0.5, -len * 0.38, len, 0);
    ctx!.quadraticCurveTo(len * 0.5, len * 0.38, 0, 0);
    ctx!.fill();
    ctx!.restore();
  }

  function plant() {
    const box = hero.getBoundingClientRect();
    w = Math.max(1, box.width);
    h = Math.max(1, box.height);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas!.width = Math.round(w * dpr);
    canvas!.height = Math.round(h * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx!.clearRect(0, 0, w, h);

    // text and buds the vines must stay away from
    keepOut = [...hero.querySelectorAll('h1, .og-tagline, .og-ledger, .og-buds, .og-mark')].map((el) => {
      const r = el.getBoundingClientRect();
      const pad = 26;
      return { x: r.left - box.left - pad, y: r.top - box.top - pad, w: r.width + pad * 2, h: r.height + pad * 2 };
    });

    const thick = Math.max(2.5, Math.min(5, w * 0.004));
    agents = [];
    const seed = (x: number, y: number, a: number) =>
      agents.push({ x, y, a, home: a, width: thick * (0.7 + R() * 0.6), life: 200 + R() * 220 });
    const up = -Math.PI / 2;
    // from the ground, at the edges
    for (const fx of [0.03, 0.12, 0.88, 0.97]) seed(fx * w, h + 4, up + (fx < 0.5 ? 0.25 : -0.25) + (R() - 0.5) * 0.4);
    // creeping in from the sides and the top corners
    if (w > 700) {
      seed(-4, h * (0.25 + R() * 0.3), (R() - 0.5) * 0.5);
      seed(w + 4, h * (0.25 + R() * 0.3), Math.PI + (R() - 0.5) * 0.5);
      seed(w * (0.08 + R() * 0.1), -4, Math.PI / 2 + (R() - 0.5) * 0.4);
      seed(w * (0.82 + R() * 0.1), -4, Math.PI / 2 + (R() - 0.5) * 0.4);
    }
  }

  function turn(from: number, to: number, rate: number) {
    const d = ((to - from + Math.PI * 3) % TAU) - Math.PI;
    return from + d * rate;
  }

  function step() {
    const next: Agent[] = [];
    for (const g of agents) {
      // wander around the heading it set out on, leaning toward the pointer
      g.a = turn(g.a, g.home, 0.02) + (R() - 0.5) * 0.34;
      if (pointer.on && !pointer.overText) g.a = turn(g.a, Math.atan2(pointer.y - g.y, pointer.x - g.x), 0.03);
      // look a little ahead: turn away from text before reaching it
      const ax = g.x + Math.cos(g.a) * 22;
      const ay = g.y + Math.sin(g.a) * 22;
      let inside = false;
      for (const k of keepOut) {
        if (ax > k.x && ax < k.x + k.w && ay > k.y && ay < k.y + k.h) {
          const away = Math.atan2(g.y - (k.y + k.h / 2), (g.x - (k.x + k.w / 2)) * (k.h / k.w));
          g.a = turn(g.a, away, 0.4);
          g.home = away;
        }
        if (g.x > k.x && g.x < k.x + k.w && g.y > k.y && g.y < k.y + k.h) inside = true;
      }
      // a vine that still ends up over the text just stops
      if (inside) continue;
      const nx = g.x + Math.cos(g.a) * 1.8;
      const ny = g.y + Math.sin(g.a) * 1.8;
      ctx!.strokeStyle = g.width > 2 ? '#35592a' : '#4d7a3a';
      ctx!.lineWidth = g.width;
      ctx!.lineCap = 'round';
      ctx!.beginPath();
      ctx!.moveTo(g.x, g.y);
      ctx!.lineTo(nx, ny);
      ctx!.stroke();
      g.x = nx;
      g.y = ny;
      g.life--;
      g.width *= 0.9978;
      if (R() < 0.065) leaf(g.x, g.y, 5 + g.width * 3.2, g.a + (R() < 0.5 ? 1 : -1) * (0.9 + R() * 0.5), R() < 0.5 ? '#5d8c44' : '#79a852');
      if (R() < 0.011 && agents.length + next.length < 40 && g.width > 1.2) {
        const a = g.a + (R() < 0.5 ? 1 : -1) * (0.5 + R() * 0.6);
        next.push({ x: g.x, y: g.y, a, home: a, width: g.width * 0.7, life: 80 + R() * 150 });
      }
      if (g.life > 0 && g.width > 0.5 && g.x > -30 && g.x < w + 30 && g.y > -30 && g.y < h + 30) next.push(g);
    }
    agents = next;
  }

  function tick() {
    for (let i = 0; i < 2 && agents.length; i++) step();
    if (agents.length && visible) raf = requestAnimationFrame(tick);
    else raf = 0;
  }
  function run() {
    if (reduceMq.matches) {
      for (let i = 0; i < 2400 && agents.length; i++) step();
      return;
    }
    if (!raf && agents.length && visible) raf = requestAnimationFrame(tick);
  }

  const onMove = (e: PointerEvent) => {
    const box = hero.getBoundingClientRect();
    pointer.x = e.clientX - box.left;
    pointer.y = e.clientY - box.top;
    pointer.on = true;
    // a pointer resting on the name or the buds should not pull every vine onto them
    pointer.overText = keepOut.some((k) => pointer.x > k.x && pointer.x < k.x + k.w && pointer.y > k.y && pointer.y < k.y + k.h);
  };
  const onLeave = () => (pointer.on = false);
  const onClick = (e: MouseEvent) => {
    if ((e.target as Element).closest('a, button')) return;
    const box = hero.getBoundingClientRect();
    const a = -Math.PI / 2 + (R() - 0.5) * 1.2;
    agents.push({ x: e.clientX - box.left, y: e.clientY - box.top, a, home: a, width: 2.6, life: 90 + R() * 70 });
    run();
  };

  let lastW = 0;
  const ro = new ResizeObserver(() => {
    const nw = Math.round(hero.clientWidth);
    if (nw === lastW) return;
    lastW = nw;
    plant();
    run();
  });
  const io = new IntersectionObserver((es) => {
    visible = es[0].isIntersecting;
    if (visible) run();
  });

  const start = () => {
    lastW = Math.round(hero.clientWidth);
    plant();
    run();
    ro.observe(hero);
    io.observe(hero);
  };
  // wait for the fonts so the keep-out boxes match the real text
  let cancelled = false;
  let started = false;
  (document.fonts?.ready ?? Promise.resolve()).then(() => {
    if (cancelled) return;
    started = true;
    start();
  });

  hero.addEventListener('pointermove', onMove);
  hero.addEventListener('pointerleave', onLeave);
  hero.addEventListener('click', onClick);

  const regrow = () => {
    if (!started) return;
    plant();
    run();
  };

  const stop = () => {
    cancelled = true;
    cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
    hero.removeEventListener('pointermove', onMove);
    hero.removeEventListener('pointerleave', onLeave);
    hero.removeEventListener('click', onClick);
  };
  return { stop, regrow };
}
