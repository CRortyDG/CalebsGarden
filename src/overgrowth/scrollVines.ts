// Vines down the margins of a case study or a note that grow as you read.
//
// The whole page's vines are worked out once, up front, from the page's
// address (so a page always grows the same garden). Every point of a vine
// carries the depth at which it appears; as the reader scrolls, the vines grow
// down to a little below the bottom of the screen, easing toward it so a fast
// scroll still looks like growing rather than popping in. They never shrink back
// when you scroll up. At the end of the page the last of them grow in and the
// flowers open, so a page you've read to the end is fully grown.
//
// They keep to the margins and turn away from the text and figures, so they
// sit at the edge of your eye and never under the words. On a phone that's a
// thin creeper hugging each edge of the screen.
//
// Reduced motion: no growing. The vines are drawn fully grown and still.
// ?vines=full shows them fully grown straight away (to see the finished look).

import { seededRandom, seedFrom } from './vines';

const TAU = Math.PI * 2;
const STEP = 3;
const PETALS = ['#e27396', '#f3efe2', '#f2a65a', '#b79cf0'];

interface Pt {
  x: number;
  y: number;
  /** the depth (page y) at which this point has grown in */
  at: number;
  w: number;
}
interface Vine {
  pts: Pt[];
  col: string;
}
interface Leaf {
  x: number;
  y: number;
  a: number;
  len: number;
  at: number;
  col: string;
}
interface Bloom {
  x: number;
  y: number;
  r: number;
  at: number;
  col: string;
  a: number;
}
interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function scrollVines(root: HTMLElement, canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};
  const reduceMq = matchMedia('(prefers-reduced-motion: reduce)');
  const forceFull = new URLSearchParams(location.search).get('vines') === 'full';

  let vines: Vine[] = [];
  let leaves: Leaf[] = [];
  let blooms: Bloom[] = [];
  let top = 0; // page y where the vines start
  let end = 0; // page y where they've all grown (the foot of the page)
  let shown = 0; // how far down they've grown so far
  let full = false;
  let vw = 1, vh = 1;
  let raf = 0;
  let lastW = 0, lastH = 0;

  const pageY = () => window.scrollY;

  function plant() {
    vw = document.documentElement.clientWidth;
    const rb = root.getBoundingClientRect();
    const sy = pageY();
    const band = root.querySelector('.og-band');
    top = band ? band.getBoundingClientRect().bottom + sy - 90 : rb.top + sy;
    // the foot of the page's text, so the last flowers sit on screen at the end
    end = rb.bottom + sy - 30;
    const phone = vw < 760;
    const R = seededRandom(seedFrom(location.pathname + (phone ? ':phone' : '')));

    // what the vines keep clear of: every block of the page below the band,
    // and inside the essay each paragraph, heading and figure on its own
    const blocks: Element[] = [];
    for (const el of root.children) {
      if (el.matches('.og-band, script, .cs-vines')) continue;
      if (el.matches('.cs-prose')) blocks.push(...el.children);
      else blocks.push(el);
    }
    const pad = phone ? 6 : 34;
    const keepOut: Box[] = blocks
      .map((el) => el.getBoundingClientRect())
      .filter((r) => r.width > 0 && r.height > 0)
      .map((r) => ({ x: r.left - pad, y: r.top + sy - pad, w: r.width + pad * 2, h: r.height + pad * 2 }));

    // the free margins: left of the column, and right of the text
    const inner = root.querySelector('.cs-prose') ?? root;
    const ir = inner.getBoundingClientRect();
    const leftEdge = Math.max(0, ir.left - (phone ? 2 : 24));
    // most lines stop well short of the column's right edge
    const textRight = Math.min(ir.right, ir.left + parseFloat(getComputedStyle(inner).fontSize || '17') * 0.55 * 68);
    const rightEdge = Math.min(vw, textRight + (phone ? 2 : 48));

    vines = [];
    leaves = [];
    blooms = [];
    const lanes: { lo: number; hi: number }[] = [];
    if (phone) {
      lanes.push({ lo: 1, hi: Math.max(5, leftEdge - 2) }, { lo: Math.min(vw - 5, rightEdge + 2), hi: vw - 1 });
    } else {
      if (leftEdge > 40) lanes.push({ lo: 6, hi: leftEdge });
      const rw = vw - rightEdge;
      if (rw > 40) {
        // a wide right margin gets two vines, the outer one nearer the edge
        if (rw > 260) lanes.push({ lo: rightEdge, hi: rightEdge + rw * 0.55 }, { lo: rightEdge + rw * 0.45, hi: vw - 6 });
        else lanes.push({ lo: rightEdge, hi: vw - 6 });
      }
    }

    const base = phone ? 1.6 : Math.max(2.4, Math.min(3.6, vw * 0.0024));
    const span = Math.max(1, end - top);
    const leafCol = () => (R() < 0.5 ? '#5d8c44' : '#79a852');

    function inside(x: number, y: number) {
      for (const k of keepOut) if (x > k.x && x < k.x + k.w && y > k.y && y < k.y + k.h) return k;
      return null;
    }

    function turn(from: number, to: number, rate: number) {
      const d = ((to - from + Math.PI * 3) % TAU) - Math.PI;
      return from + d * rate;
    }

    // a short side shoot that curls into a tendril, with a leaf or a flower at its tip
    function shoot(x: number, y: number, a: number, w: number, at: number, lane: { lo: number; hi: number }, bloom: boolean) {
      const pts: Pt[] = [{ x, y, at, w }];
      let curl = (R() < 0.5 ? 1 : -1) * (0.02 + R() * 0.03);
      const life = (phone ? 10 : 18) + R() * (phone ? 14 : 30);
      let reach = at;
      for (let i = 0; i < life; i++) {
        a += curl;
        curl *= 1.07;
        x += Math.cos(a) * STEP * 0.8;
        y += Math.sin(a) * STEP * 0.8;
        if (inside(x, y) || x < lane.lo - 14 || x > lane.hi + 14) break;
        reach = Math.max(reach, y);
        w *= 0.95;
        pts.push({ x, y, at: reach + 6, w: Math.max(0.5, w) });
        if (!bloom && i > 3 && R() < 0.12) leaves.push({ x, y, a: a + (R() < 0.5 ? 1 : -1) * 1.1, len: 3 + w * 2.6, at: reach + 6, col: leafCol() });
      }
      if (pts.length > 2) vines.push({ pts, col: '#4d7a3a' });
      const tip = pts[pts.length - 1];
      if (bloom) blooms.push({ x: tip.x, y: tip.y, r: phone ? 3 : 4 + R() * 2.5, at: tip.at + 30, col: PETALS[Math.floor(R() * PETALS.length)], a: R() * TAU });
    }

    lanes.forEach((lane, li) => {
      const mid = (lane.lo + lane.hi) / 2;
      let x = lane.lo + (lane.hi - lane.lo) * (0.3 + R() * 0.4);
      // the vines start a little apart, so they don't all come down in a line
      let y = top + li * (phone ? 120 : 50) + R() * 60;
      let a = Math.PI / 2 + (R() - 0.5) * 0.6;
      const pts: Pt[] = [];
      let reach = y;
      let sinceShoot = 0;
      let sinceBloom = 0;
      while (y < end && pts.length < 20000) {
        const t = (y - top) / span;
        // wander, drift back toward the middle of its margin, and head down
        a = turn(a, Math.PI / 2, 0.025) + (R() - 0.5) * 0.3;
        const off = (x - mid) / Math.max(4, (lane.hi - lane.lo) / 2);
        if (Math.abs(off) > 0.6) a = turn(a, Math.atan2(STEP * 3, mid - x), 0.08 * Math.abs(off));
        // look ahead and turn away from the text
        const hit = inside(x + Math.cos(a) * 20, y + Math.sin(a) * 20);
        if (hit) a = turn(a, x < hit.x + hit.w / 2 ? Math.PI * 0.62 : Math.PI * 0.38, 0.35);
        // never climb back up for long
        if (Math.sin(a) < -0.2) a = turn(a, Math.PI / 2, 0.2);
        x += Math.cos(a) * STEP;
        y += Math.sin(a) * STEP;
        x = Math.max(lane.lo - 10, Math.min(lane.hi + 10, x));
        reach = Math.max(reach, y);
        const w = base * (1 - 0.45 * t);
        pts.push({ x, y, at: reach, w });
        sinceShoot++;
        sinceBloom++;
        if (R() < (phone ? 0.05 : 0.07)) leaves.push({ x, y, a: a + (R() < 0.5 ? 1 : -1) * (0.9 + R() * 0.5), len: (phone ? 3 : 5) + w * 2.4, at: reach, col: leafCol() });
        if (sinceShoot > (phone ? 50 : 30) && R() < 0.04) {
          sinceShoot = 0;
          // shoots go off sideways, toward the open side of the margin
          const side = x > mid ? -1 : 1;
          const sa = Math.PI / 2 + side * (0.9 + R() * 0.5);
          const bloom = sinceBloom > (phone ? 260 : 200) && R() < 0.6;
          if (bloom) sinceBloom = 0;
          shoot(x, y, sa, w * 0.6, reach, lane, bloom);
        }
      }
      vines.push({ pts, col: '#35592a' });
      // a last flower at the foot of every vine: it opens when you reach the end
      const tip = pts[pts.length - 1];
      if (tip) blooms.push({ x: tip.x, y: tip.y, r: phone ? 3.5 : 6, at: Infinity, col: PETALS[li % PETALS.length], a: R() * TAU });
    });
  }

  function size() {
    vh = window.innerHeight;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(vw * dpr);
    canvas.height = Math.round(vh * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function leaf(l: Leaf, sy: number, k: number) {
    ctx!.save();
    ctx!.translate(l.x, l.y - sy);
    ctx!.rotate(l.a);
    ctx!.fillStyle = l.col;
    const len = l.len * k;
    ctx!.beginPath();
    ctx!.moveTo(0, 0);
    ctx!.quadraticCurveTo(len * 0.5, -len * 0.38, len, 0);
    ctx!.quadraticCurveTo(len * 0.5, len * 0.38, 0, 0);
    ctx!.fill();
    ctx!.restore();
  }

  function bloom(b: Bloom, sy: number, k: number) {
    const r = b.r * k;
    ctx!.save();
    ctx!.translate(b.x, b.y - sy);
    ctx!.rotate(b.a);
    ctx!.fillStyle = b.col;
    for (let i = 0; i < 5; i++) {
      ctx!.rotate(TAU / 5);
      ctx!.beginPath();
      ctx!.ellipse(0, -r * 0.7, r * 0.42, r * 0.7, 0, 0, TAU);
      ctx!.fill();
    }
    ctx!.fillStyle = '#8a5a24';
    ctx!.beginPath();
    ctx!.arc(0, 0, Math.max(1, r * 0.3), 0, TAU);
    ctx!.fill();
    ctx!.restore();
  }

  function draw() {
    const sy = pageY();
    const lo = sy - 30, hi = sy + vh + 30;
    const grown = full ? Infinity : shown;
    ctx!.clearRect(0, 0, vw, vh);
    ctx!.lineCap = 'round';
    ctx!.lineJoin = 'round';
    for (const v of vines) {
      const p = v.pts;
      if (!p.length || p[0].at > grown) continue;
      ctx!.strokeStyle = v.col;
      // in short runs, so the stem can thin out down the page
      for (let i = 0; i < p.length - 1; i += 8) {
        if (p[i].at > grown) break;
        const j = Math.min(p.length - 1, i + 8);
        if (p[i].y > hi + 30 && p[j].y > hi + 30) continue;
        if (p[i].y < lo - 30 && p[j].y < lo - 30) continue;
        ctx!.lineWidth = p[i].w;
        // the vines come out of the band's growth at the top, so they fade in rather than start in a stub
        ctx!.globalAlpha = Math.max(0, Math.min(1, (p[i].y - top) / 160));
        ctx!.beginPath();
        ctx!.moveTo(p[i].x, p[i].y - sy);
        for (let n = i + 1; n <= j && p[n].at <= grown; n++) ctx!.lineTo(p[n].x, p[n].y - sy);
        ctx!.stroke();
      }
    }
    ctx!.globalAlpha = 1;
    for (const l of leaves) {
      if (l.at > grown || l.y < lo || l.y > hi) continue;
      ctx!.globalAlpha = Math.max(0, Math.min(1, (l.y - top) / 160));
      // leaves unfurl over the next few pixels of growth
      leaf(l, sy, Math.min(1, (grown - l.at) / 40 + 0.2));
    }
    ctx!.globalAlpha = 1;
    for (const b of blooms) {
      if (b.y < lo || b.y > hi) continue;
      if (b.at === Infinity ? !full && !atEnd : b.at > grown) continue;
      bloom(b, sy, b.at === Infinity ? endOpen : Math.min(1, (grown - b.at) / 60 + 0.15));
    }
  }

  let atEnd = false;
  let endOpen = 0; // the last flowers opening, 0..1

  function target() {
    const sy = pageY();
    atEnd = sy + vh >= document.documentElement.scrollHeight - 4;
    // grow to a little below the bottom of the screen; all the way at the end
    return atEnd ? end : sy + vh * 0.92;
  }

  function frame() {
    raf = 0;
    const t = target();
    let more = false;
    if (t > shown) {
      // ease toward the reading point: quick to catch up, but always growing
      shown += Math.max(2.5, (t - shown) * 0.06);
      if (shown > t) shown = t;
      more = true;
    }
    if (atEnd && shown >= end - 1 && endOpen < 1) {
      endOpen = Math.min(1, endOpen + 0.04);
      more = true;
    }
    draw();
    if (more) raf = requestAnimationFrame(frame);
  }
  const kick = () => {
    if (!raf) raf = requestAnimationFrame(frame);
  };

  function settle() {
    full = forceFull || reduceMq.matches;
    if (full) {
      shown = end;
      endOpen = 1;
      atEnd = true;
    }
  }

  function start() {
    lastW = document.documentElement.clientWidth;
    lastH = root.offsetHeight;
    plant();
    size();
    settle();
    if (!full) shown = Math.max(shown, Math.min(target(), top + 1));
    kick();
  }

  const onScroll = () => (full ? draw() : kick());
  const onResize = () => {
    if (document.documentElement.clientWidth !== lastW) start();
    else {
      size();
      onScroll();
    }
  };
  // the page grows as images and fonts load: plant again when it changes much
  const ro = new ResizeObserver(() => {
    if (Math.abs(root.offsetHeight - lastH) > 40) start();
  });
  const onMotion = () => {
    settle();
    kick();
  };

  let cancelled = false;
  (document.fonts?.ready ?? Promise.resolve()).then(() => {
    if (cancelled) return;
    start();
    ro.observe(root);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    reduceMq.addEventListener('change', onMotion);
  });

  return () => {
    cancelled = true;
    cancelAnimationFrame(raf);
    ro.disconnect();
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onResize);
    reduceMq.removeEventListener('change', onMotion);
  };
}
