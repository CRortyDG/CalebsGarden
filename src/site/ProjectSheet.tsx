'use client';

import { useEffect, useRef } from 'react';
import { statusLabel, type Project } from '@/projects';

/**
 * The one project sheet every theme shares. Themes may restyle it through the
 * --sheet-* CSS variables, but the content and the order of the buttons stay
 * the same everywhere: Visit, then Read how it was built, then Source.
 */
export function ProjectSheet({ project, onClose }: { project: Project | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (project && !dialog.open) dialog.showModal();
    if (!project && dialog.open) dialog.close();
  }, [project]);

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-labelledby="sheet-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      {project && (
        <article>
          <button className="sheet-close" type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
          {project.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="sheet-image"
              src={project.image.src}
              alt={project.image.alt}
              width={project.image.width}
              height={project.image.height}
            />
          )}
          <div className="sheet-body">
            <p className={`status is-${project.status}`}>{statusLabel[project.status]}</p>
            <h2 id="sheet-title">{project.name}</h2>
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
        </article>
      )}
    </dialog>
  );
}
