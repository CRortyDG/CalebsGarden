import { seeded } from '@/plants/specimen';

/** Draws a still field of stars. The same sky every visit. */
export function drawSky(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  const paint = () => {
    const box = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1, box.width);
    const h = Math.max(1, box.height);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const R = seeded('sky');
    const count = Math.round((w * h) / 5200);
    for (let i = 0; i < count; i++) {
      const x = R() * w;
      const y = R() * h;
      const big = R() < 0.08;
      const r = big ? 1.1 + R() * 0.9 : 0.4 + R() * 0.7;
      ctx.globalAlpha = 0.35 + R() * 0.6;
      ctx.fillStyle = R() < 0.2 ? '#ffe9c4' : R() < 0.3 ? '#c9d8ff' : '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      if (big) {
        ctx.globalAlpha *= 0.1;
        ctx.beginPath();
        ctx.arc(x, y, r * 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  };

  paint();
  const ro = new ResizeObserver(paint);
  ro.observe(canvas);
  return () => ro.disconnect();
}
