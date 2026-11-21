// The main stem: one SVG path down the whole page, revealed by scroll position,
// with a branch to each project's flower, leaves along the way and roots at the
// bottom. It is measured from the real layout, so it follows the content
// wherever the content goes. Everything here is decoration: the page reads and
// works the same with none of it.

const NS = 'http://www.w3.org/2000/svg';
const PHONE = '(max-width: 760px)';

interface Pt {
  x: number;
  y: number;
}

export function growStem(root: HTMLElement): () => void {
  const svg = root.querySelector<SVGSVGElement>('.og-stemlayer');
  if (!svg) return () => {};
  const reduceMq = matchMedia('(prefers-reduced-motion: reduce)');
  const phoneMq = matchMedia(PHONE);

  let stem: SVGPathElement | null = null;
  let shine: SVGPathElement | null = null;
  let total = 0;
  let minLen = 0;
  let samples: { y: number; len: number }[] = [];
  let leaves: { len: number; el: SVGGElement }[] = [];
  let rows: { len: number; branch: SVGPathElement; row: HTMLElement }[] = [];

  const make = <K extends keyof SVGElementTagNameMap>(tag: K, cls: string, d?: string) => {
    const el = document.createElementNS(NS, tag);
    el.setAttribute('class', cls);
    if (d) el.setAttribute('d', d);
    svg.appendChild(el);
    return el;
  };
  const curve = (a: Pt, b: Pt) => {
    const dy = (b.y - a.y) * 0.5;
    return `C${a.x} ${a.y + dy} ${b.x} ${b.y - dy} ${b.x} ${b.y}`;
  };

  function lenAtY(y: number): number {
    if (!samples.length || y <= samples[0].y) return 0;
    let lo = 0, hi = samples.length - 1;
    if (y >= samples[hi].y) return total;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (samples[mid].y <= y) lo = mid;
      else hi = mid;
    }
    const a = samples[lo], b = samples[hi];
    return a.len + ((y - a.y) / Math.max(1, b.y - a.y)) * (b.len - a.len);
  }

  function build() {
    svg!.replaceChildren();
    const box = root.getBoundingClientRect();
    const W = box.width;
    const H = root.scrollHeight;
    svg!.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg!.style.height = `${H}px`;
    const rel = (el: Element) => {
      const r = el.getBoundingClientRect();
      return { x: r.left - box.left, y: r.top - box.top, w: r.width, h: r.height };
    };
    const phone = phoneMq.matches;
    const stemX = phone ? 26 : W / 2;

    const buds = [...root.querySelectorAll('.og-bud')].map(rel);
    const rowEls = [...root.querySelectorAll<HTMLElement>('.og-row')];
    const ground = root.querySelector('.og-ground');
    const tips = [...root.querySelectorAll('.og-root-tip')].map(rel);
    if (!buds.length || !ground) return;
    const groundBox = rel(ground);

    // where the stem starts: under the buds (desktop) or beside the first one (phone)
    const lastBudBottom = Math.max(...buds.map((b) => b.y + b.h));
    const start: Pt = phone ? { x: stemX, y: buds[0].y + buds[0].h / 2 } : { x: stemX, y: lastBudBottom + 64 };

    // twigs joining each bud to the stem; these are always drawn
    for (const b of buds) {
      if (phone) make('path', 'og-twig', `M${stemX} ${b.y + b.h / 2}L${b.x} ${b.y + b.h / 2}`);
      else {
        const from = { x: b.x + b.w / 2, y: b.y + b.h };
        make('path', 'og-twig', `M${from.x} ${from.y}${curve(from, start)}`);
      }
    }

    // the stem passes a node beside each flower
    const flowers = rowEls.map((row) => rel(row.querySelector('.og-flower')!));
    const nodes: Pt[] = flowers.map((f) => {
      const fx = f.x + f.w / 2;
      const lean = phone ? 0 : Math.sign(fx - stemX) * 14;
      return { x: stemX + lean, y: f.y + f.h / 2 + 34 };
    });
    const end: Pt = { x: stemX, y: groundBox.y + 10 };
    const points = [start, ...nodes, end];
    let d = `M${start.x} ${start.y}`;
    for (let i = 1; i < points.length; i++) d += curve(points[i - 1], points[i]);

    stem = make('path', 'og-stem', d);
    shine = make('path', 'og-stem-shine', d);
    total = stem.getTotalLength();
    for (const p of [stem, shine]) {
      p.style.strokeDasharray = `${total}`;
      p.style.strokeDashoffset = `${total}`;
    }
    samples = [];
    for (let len = 0; len <= total; len += 6) samples.push({ y: stem.getPointAtLength(len).y, len });
    samples.push({ y: end.y, len: total });
    minLen = phone ? lenAtY(lastBudBottom + 24) : 0;

    // branches to the flowers
    rows = rowEls.map((row, i) => {
      const n = nodes[i];
      const f = { x: flowers[i].x + flowers[i].w / 2, y: flowers[i].y + flowers[i].h / 2 };
      const side = Math.sign(f.x - n.x) || 1;
      const branch = make('path', 'og-branch', `M${n.x} ${n.y}C${n.x + side * 6} ${n.y - 22} ${f.x - side * 18} ${f.y + 22} ${f.x} ${f.y + 6}`);
      branch.setAttribute('pathLength', '1');
      return { len: lenAtY(n.y), branch, row };
    });

    // leaves along the stem, alternating sides
    leaves = [];
    let side = 1;
    for (let len = 46; len < total - 30; len += 52 + Math.random() * 34) {
      const p = stem.getPointAtLength(len);
      const q = stem.getPointAtLength(len + 2);
      const angle = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI;
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'og-leaf');
      g.setAttribute('transform', `translate(${p.x} ${p.y}) rotate(${angle - side * (48 + Math.random() * 24)})`);
      const leaf = document.createElementNS(NS, 'path');
      const s = (phone ? 0.8 : 1.15) * (0.8 + Math.random() * 0.5);
      leaf.setAttribute('d', `M0 0Q${10 * s} ${-8 * s} ${22 * s} 0Q${10 * s} ${8 * s} 0 0`);
      leaf.setAttribute('fill', Math.random() < 0.5 ? '#6fa04c' : '#86b85e');
      g.appendChild(leaf);
      svg!.insertBefore(g, stem);
      leaves.push({ len, el: g });
      side = -side;
    }

    // roots, spreading from the foot of the stem to each footer link
    for (const t of tips) {
      const to = { x: t.x + t.w / 2, y: t.y - 10 };
      const r = make('path', 'og-root', `M${end.x} ${end.y}${curve(end, to)}`);
      r.setAttribute('pathLength', '1');
    }
    update();
  }

  function update() {
    if (!stem || !shine) return;
    const box = root.getBoundingClientRect();
    const tipY = -box.top + window.innerHeight * 0.72;
    const len = reduceMq.matches ? total : Math.max(minLen, lenAtY(tipY));
    stem.style.strokeDashoffset = shine.style.strokeDashoffset = `${total - len}`;
    for (const l of leaves) l.el.classList.toggle('is-on', l.len <= len);
    for (const r of rows) {
      const on = r.len <= len;
      r.branch.classList.toggle('is-on', on);
      r.row.classList.toggle('is-grown', on);
    }
    root.classList.toggle('is-rooted', len >= total - 2);
  }

  let frame = 0;
  const onScroll = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(update);
  };
  let rebuild = 0;
  let lastW = 0, lastH = 0;
  const ro = new ResizeObserver(() => {
    // only rebuild when the page's own size really changed
    const w = root.clientWidth, h = root.scrollHeight;
    if (w === lastW && h === lastH) return;
    lastW = w;
    lastH = h;
    cancelAnimationFrame(rebuild);
    rebuild = requestAnimationFrame(build);
  });

  build();
  lastW = root.clientWidth;
  lastH = root.scrollHeight;
  ro.observe(root);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  reduceMq.addEventListener('change', update);

  return () => {
    cancelAnimationFrame(frame);
    cancelAnimationFrame(rebuild);
    ro.disconnect();
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    reduceMq.removeEventListener('change', update);
    svg.replaceChildren();
  };
}
