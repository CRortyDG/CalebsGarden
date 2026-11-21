import { statusLabel, type Project } from '@/projects';

/**
 * What the site says about one project. The dialog sheet and any theme that
 * lays projects out on the page both use this, so the content and the order of
 * the buttons are the same everywhere: Visit, Read how it was built, Source.
 */
export function ProjectDetails({ project, titleId }: { project: Project; titleId: string }) {
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
