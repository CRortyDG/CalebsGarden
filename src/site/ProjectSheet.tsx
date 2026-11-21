'use client';

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Project } from '@/projects';
import { ProjectDetails } from './ProjectDetails';

/**
 * The dialog behind every project sheet: opens and closes with `open`, and
 * calls `onClose` for Esc and for a click on the backdrop. A theme that draws
 * its own sheet wraps it in this.
 */
export function SheetDialog({
  open,
  onClose,
  className,
  labelledBy,
  children,
}: {
  open: boolean;
  onClose: () => void;
  className: string;
  labelledBy: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={className}
      aria-labelledby={labelledBy}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      {children}
    </dialog>
  );
}

/**
 * The one project sheet most themes share. Themes may restyle it through the
 * --sheet-* CSS variables, but the content and the order of the buttons stay
 * the same everywhere: Visit, then Read how it was built, then Source.
 */
export function ProjectSheet({ project, onClose }: { project: Project | null; onClose: () => void }) {
  return (
    <SheetDialog open={!!project} onClose={onClose} className="sheet" labelledBy="sheet-title">
      {project && (
        <article>
          <button className="sheet-close" type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
          <ProjectDetails project={project} titleId="sheet-title" />
        </article>
      )}
    </SheetDialog>
  );
}
