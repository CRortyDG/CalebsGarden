'use client';

import { useEffect, useRef } from 'react';
import type { Project } from '@/projects';
import { ProjectDetails } from './ProjectDetails';

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
          <ProjectDetails project={project} titleId="sheet-title" />
        </article>
      )}
    </dialog>
  );
}
