'use client';

import { useEffect, useRef } from 'react';
import { statusLabel, type Project } from '@/projects';
import { SheetDialog } from '@/site/ProjectSheet';
import { Specimen } from './Specimen';
import { SPECIMEN_BOX, drawSpecimen, latinName, stageNote } from './specimen';

/**
 * The Herbarium's project sheet: the specimen sheet at full size, as a
 * botanical plate. It carries everything the shared sheet does (screenshot,
 * status, name, blurb, about, "built with", then Visit, Read how it was
 * built, Source) plus a typed herbarium label.
 */
export function Plate({
  project,
  number,
  from,
  onClose,
}: {
  project: Project | null;
  number: number;
  /** Where the small sheet sat on the page, to lift the plate from. */
  from: DOMRect | null;
  onClose: () => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const id = project?.id;

  useEffect(() => {
    const el = ref.current;
    if (!el || !id) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const to = el.getBoundingClientRect();
    const start = from
      ? `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width})`
      : 'translateY(14px) scale(0.985)';
    el.animate(
      [
        { transformOrigin: '0 0', transform: start, opacity: from ? 0.5 : 0 },
        { transformOrigin: '0 0', transform: 'none', opacity: 1 },
      ],
      { duration: from ? 460 : 240, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
    );
    // `from` is read once, when the sheet is picked up
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const plant = project ? drawSpecimen(project.name, project.status) : null;
  const pct = (y: number) => `${(y / SPECIMEN_BOX.h) * 100}%`;
  const flowerY = plant ? Math.max(34, Math.min(130, plant.flower.y)) : 0;
  const rootY = 262;
  const hasRoots = !!project?.tags?.length;

  return (
    <SheetDialog open={!!project} onClose={onClose} className="hb-plate" labelledBy="hb-plate-title">
      {project && plant && (
        <article ref={ref} className="hb-plate-sheet">
          <button className="sheet-close" type="button" onClick={onClose} aria-label="Close">
            ×
          </button>

          <header className="hb-plate-head">
            <p className={`hb-stamp is-${project.status}`}>{statusLabel[project.status]}</p>
            <h2 id="hb-plate-title" style={{ color: plant.ink }}>
              {project.name}
            </h2>
            <p className="hb-latin">{latinName(project.name, project.status)}</p>
            {project.blurb && <p className="hb-blurb">{project.blurb}</p>}
          </header>

          <div className="hb-figure">
            <div className="hb-figure-plant">
              <Specimen plant={plant} />
              <svg className="hb-leaders" viewBox={`0 0 ${SPECIMEN_BOX.w} ${SPECIMEN_BOX.h}`} aria-hidden="true">
                <path d={`M${plant.flower.x + 10} ${plant.flower.y} L${SPECIMEN_BOX.w - 24} ${flowerY} H${SPECIMEN_BOX.w}`} />
                {hasRoots && <path d={`M${plant.root.x + 8} ${plant.root.y} L${SPECIMEN_BOX.w - 24} ${rootY} H${SPECIMEN_BOX.w}`} />}
              </svg>
            </div>
            <div className="hb-annotations">
              <p className="hb-annotation" style={{ top: pct(flowerY) }}>
                <span>fig. a · {statusLabel[project.status]}</span>
                {stageNote[project.status]}
              </p>
              {hasRoots && (
                <div className="hb-annotation" style={{ top: pct(rootY) }}>
                  <span>fig. b · built on</span>
                  <ul aria-label="Built with">
                    {project.tags!.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="hb-plate-body">
            {project.image && (
              <figure className="hb-photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={project.image.src}
                  alt={project.image.alt}
                  width={project.image.width}
                  height={project.image.height}
                  loading="lazy"
                />
              </figure>
            )}
            {project.about && <p className="hb-about">{project.about}</p>}

            <dl className="hb-label">
              {project.hostLabel && (
                <div>
                  <dt>Locality</dt>
                  <dd>{project.hostLabel}</dd>
                </div>
              )}
              {project.habitat && (
                <div>
                  <dt>Habitat</dt>
                  <dd>{project.habitat}</dd>
                </div>
              )}
              {project.year && (
                <div>
                  <dt>Collected</dt>
                  <dd>{project.year}</dd>
                </div>
              )}
              <div>
                <dt>Stage</dt>
                <dd>{statusLabel[project.status]}</dd>
              </div>
              <div>
                <dt>Sheet no.</dt>
                <dd>{String(number).padStart(3, '0')}</dd>
              </div>
            </dl>

            <div className="sheet-actions">
              {project.href && (
                <a className="button is-primary" href={project.href}>
                  Visit {project.hostLabel ?? project.name} <span aria-hidden="true">↗</span>
                </a>
              )}
              {project.caseStudy && (
                <a className="button" href={project.caseStudy}>
                  Read how it was built
                </a>
              )}
              {project.source && (
                <a className="button" href={project.source}>
                  Source
                </a>
              )}
            </div>
          </div>
        </article>
      )}
    </SheetDialog>
  );
}
