import type { Status } from '@/projects';
import { PlantParts } from '@/plants/Specimen';
import { drawSpecimen, seeded } from '@/plants/specimen';

// A small world for one project, with that project's plant growing on it:
// the same plant it has in the Herbarium. Drawn from the project's name, so a
// new project gets its own planet without anyone drawing it.

const BODIES = [
  { base: '#3d5f86', light: '#7ea6d3', dark: '#16233a' },
  { base: '#5b4c8a', light: '#9a88cf', dark: '#221b3d' },
  { base: '#3f7466', light: '#7dbaa7', dark: '#152c26' },
  { base: '#8a6a45', light: '#cba577', dark: '#3a2a17' },
  { base: '#7a4558', light: '#c08097', dark: '#331923' },
];

/** The drawing is 300 wide and 380 tall; the planet's centre is at (150, 262). */
export const PLANET = { w: 300, h: 380, cx: 150, cy: 262, r: 105 };

export function Planet({ id, name, status, empty }: { id: string; name: string; status: Status; empty?: boolean }) {
  const R = seeded(`planet:${name.toLowerCase()}`);
  const body = empty ? { base: '#4a5060', light: '#7d8496', dark: '#1d2029' } : BODIES[Math.floor(R() * BODIES.length)];
  const { cx, cy, r } = PLANET;
  const ringed = !empty && R() < 0.45;
  const tilt = -24 + R() * 14;
  const blobs = Array.from({ length: 6 }, () => ({
    x: cx + (R() - 0.5) * r * 1.7,
    y: cy + (R() - 0.3) * r * 1.3,
    rx: 16 + R() * 34,
    ry: 8 + R() * 14,
    rot: (R() - 0.5) * 40,
  }));
  const plant = empty ? null : drawSpecimen(name, status);
  const top = cy - r + 5;

  return (
    <svg viewBox={`0 0 ${PLANET.w} ${PLANET.h}`} aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`or-body-${id}`} cx="0.36" cy="0.3" r="0.8">
          <stop offset="0" stopColor={body.light} />
          <stop offset="0.5" stopColor={body.base} />
          <stop offset="1" stopColor={body.dark} />
        </radialGradient>
        <radialGradient id={`or-shade-${id}`} cx="0.3" cy="0.25" r="0.85">
          <stop offset="0.45" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.62" />
        </radialGradient>
        <radialGradient id={`or-air-${id}`}>
          <stop offset="0.78" stopColor={body.light} stopOpacity="0.28" />
          <stop offset="1" stopColor={body.light} stopOpacity="0" />
        </radialGradient>
        <clipPath id={`or-clip-${id}`}>
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
      </defs>

      <circle cx={cx} cy={cy} r={r * 1.22} fill={`url(#or-air-${id})`} />
      {ringed && (
        <ellipse cx={cx} cy={cy} rx={r * 1.5} ry={r * 0.3} fill="none" stroke={body.light} strokeOpacity="0.45" strokeWidth="5" transform={`rotate(${tilt} ${cx} ${cy})`} />
      )}
      <circle cx={cx} cy={cy} r={r} fill={`url(#or-body-${id})`} strokeDasharray={empty ? '5 7' : undefined} stroke={empty ? '#aab0c0' : 'none'} strokeWidth="1.5" />
      <g clipPath={`url(#or-clip-${id})`} fill={body.light} fillOpacity={empty ? 0.12 : 0.24}>
        {blobs.map((b, i) => (
          <ellipse key={i} cx={b.x} cy={b.y} rx={b.rx} ry={b.ry} transform={`rotate(${b.rot} ${b.x} ${b.y})`} />
        ))}
      </g>
      <circle cx={cx} cy={cy} r={r} fill={`url(#or-shade-${id})`} />
      {ringed && (
        // the near half of the ring, in front of the planet
        <path
          d={`M${cx - r * 1.5} ${cy} A${r * 1.5} ${r * 0.3} 0 0 0 ${cx + r * 1.5} ${cy}`}
          fill="none"
          stroke={body.light}
          strokeOpacity="0.7"
          strokeWidth="5"
          transform={`rotate(${tilt} ${cx} ${cy})`}
        />
      )}

      {plant && (
        <>
          {/* the garden patch the plant grows from */}
          <ellipse cx={cx} cy={top + 3} rx="30" ry="7" fill="#5c8a45" fillOpacity="0.9" />
          <g transform={`translate(${cx - 100 * 0.75} ${top - 236 * 0.75}) scale(0.75)`} style={{ filter: 'brightness(1.45) saturate(1.15)' }}>
            <PlantParts plant={plant} roots={false} />
          </g>
        </>
      )}
    </svg>
  );
}
