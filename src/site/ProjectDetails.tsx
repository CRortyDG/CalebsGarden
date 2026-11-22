import { statusLabel, type Project } from '@/projects';
import type { ProjectUsage } from '@/usage';

const fmt = (n: number) => n.toLocaleString('en-US');

/**
 * What the site says about one project, in its card on the page. Buttons go
 * in this order: Visit, Read how it was built, Source.
 */
export function ProjectDetails({ project, titleId, usage }: { project: Project; titleId: string; usage?: ProjectUsage }) {
  return (
    <>
      {project.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="sheet-image"
          src={project.image.src}
          alt={project.image.alt}
          width={project.image.width}
          height={project.image.height}
          loading="lazy"
        />
      )}
      <div className="sheet-body">
        <p className={`status is-${project.status}`}>{statusLabel[project.status]}</p>
        <h2 id={titleId}>{project.name}</h2>
        {project.blurb && <p className="sheet-blurb">{project.blurb}</p>}
        {project.about && <p className="sheet-about">{project.about}</p>}
        {usage && (
          <dl className="sheet-stats">
            {usage.perDay !== null && (
              <div>
                <dt>People a day</dt>
                <dd>{fmt(usage.perDay)}</dd>
              </div>
            )}
            {usage.sinceLaunch !== null && (
              <div>
                <dt>Since launch</dt>
                <dd>{fmt(usage.sinceLaunch)}</dd>
              </div>
            )}
            <div>
              <dt>Costs a month</dt>
              <dd>${fmt(usage.monthlyUsd)}</dd>
            </div>
          </dl>
        )}
        {usage?.capacityPerDay && (
          <p className="sheet-stats-note">
            Most of that is flat plan pricing, not traffic. The same ${fmt(usage.monthlyUsd)} would carry
            about {fmt(usage.capacityPerDay)} people a day before anything has to go up.
          </p>
        )}
        {usage?.costNote && <p className="sheet-stats-note">{usage.costNote}</p>}
        {project.highlights && project.highlights.length > 0 && (
          <ul className="sheet-highlights" aria-label="What's there">
            {project.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        )}
        {project.tags && project.tags.length > 0 && (
          <ul className="sheet-tags" aria-label="Built with">
            {project.tags.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        )}
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
    </>
  );
}
