import type { Status } from '@/projects';

const PETALS = ['#f2a65a', '#f6d55c', '#e27396', '#b79cf0', '#f3efe2'];

/**
 * A flower whose state shows the project's growth stage:
 * a closed bud (seedling), half open (budding) or in full bloom (evergreen).
 */
export function Flower({ status, tone = 0, size = 64 }: { status: Status; tone?: number; size?: number }) {
  const petal = PETALS[tone % PETALS.length];
  const ring = (n: number, len: number, wid: number, offset = 0, fill = petal) =>
    Array.from({ length: n }, (_, i) => (
      <ellipse key={`${n}-${i}-${offset}`} cx="0" cy={-len / 2} rx={wid} ry={len / 2} fill={fill} transform={`rotate(${offset + (i * 360) / n})`} />
    ));
  const sepals = (
    <>
      <ellipse cx="0" cy="-7" rx="4.5" ry="10" fill="#5d8c44" transform="rotate(-62)" />
      <ellipse cx="0" cy="-7" rx="4.5" ry="10" fill="#4d7a3a" transform="rotate(62)" />
    </>
  );
  return (
    <svg viewBox="-32 -32 64 64" width={size} height={size} aria-hidden="true">
      {status === 'evergreen' && (
        <>
          {ring(8, 28, 7.5)}
          <g opacity="0.55">{ring(8, 18, 5, 22.5, '#ffffff')}</g>
          <circle r="6.5" fill="#5a3a14" />
          <circle r="3" fill="#8a5a24" />
        </>
      )}
      {status === 'budding' && (
        <g transform="translate(0 8)">
          {sepals}
          {[-46, -23, 0, 23, 46].map((a) => (
            <ellipse key={a} cx="0" cy="-13" rx="6.5" ry="13" fill={petal} transform={`rotate(${a})`} />
          ))}
          <ellipse cx="0" cy="-9" rx="5" ry="9" fill="#ffffff" opacity="0.35" />
        </g>
      )}
      {status === 'seedling' && (
        <g transform="translate(0 10)">
          {sepals}
          <ellipse cx="0" cy="-12" rx="6.5" ry="12" fill="#6fa04c" />
          <ellipse cx="0" cy="-19" rx="3.6" ry="6" fill={petal} />
        </g>
      )}
    </svg>
  );
}
