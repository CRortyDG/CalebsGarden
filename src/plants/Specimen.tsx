import type { Specimen as Drawn } from './specimen';
import { SPECIMEN_BOX } from './specimen';

/** The parts of the plant, to place inside another drawing. */
export function PlantParts({ plant, roots = true }: { plant: Drawn; roots?: boolean }) {
  return (
    <>
      {roots && (
        <g fill="none" stroke="#8a6f4d" strokeWidth="1.1" strokeLinecap="round" opacity="0.85">
          {plant.roots.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
      )}
      <g fill="none" stroke="#5f6f3b" strokeWidth="2.2" strokeLinecap="round">
        {plant.stems.map((d, i) => (
          <path key={i} d={d} strokeWidth={i ? 1.5 : 2.2} />
        ))}
      </g>
      {plant.leaves.map((l, i) => (
        <path key={i} d={l.d} fill={l.fill} stroke="#4f5d31" strokeWidth="0.5" />
      ))}
      {plant.blooms.map((b, i) => (
        <g key={i}>
          {b.petals.map((d, j) => (
            <path key={j} d={d} fill={plant.tone} fillOpacity="0.86" stroke={plant.ink} strokeWidth="0.6" strokeLinejoin="round" />
          ))}
          {b.r > 0 && <circle cx={b.x} cy={b.y} r={b.r} fill="#6b4a1e" />}
        </g>
      ))}
    </>
  );
}

/** The plant on its own. Decoration: the text beside it says everything it shows. */
export function Specimen({ plant, className }: { plant: Drawn; className?: string }) {
  return (
    <svg className={className} viewBox={`0 0 ${SPECIMEN_BOX.w} ${SPECIMEN_BOX.h}`} aria-hidden="true" focusable="false">
      <PlantParts plant={plant} />
    </svg>
  );
}
