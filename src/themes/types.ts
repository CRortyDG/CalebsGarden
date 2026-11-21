import type { ComponentType } from 'react';
import type { Project } from '@/projects';

/** What every theme is given. A theme draws scenery; it never owns content. */
export interface ThemeProps {
  projects: Project[];
  /** Opens a project (same as following a `#id` link). */
  openProject: (id: string) => void;
  /** The project that is open now, from the address bar. Only `sheets: 'theme'` themes need it. */
  openId: string | null;
  /** Closes the open project. Back and Esc already call this for the shared sheet. */
  closeProject: () => void;
}

export interface ThemeDef {
  /** Used in `?theme=<id>`. */
  id: string;
  /** Shown in the Scenery menu. */
  name: string;
  blurb: string;
  /** Only enabled themes are in the random pick. Any theme opens with `?theme=`. */
  enabled: boolean;
  /** Relative chance in the random pick. */
  weight: number;
  /**
   * dialog (default): a `#project` link opens the shared sheet in a dialog.
   * inline: the theme lays each project out on the page in an element whose id
   * is the project id, so a `#project` link simply scrolls there.
   * theme: the theme draws its own project sheet from `openId`, in its own
   * style. It must show everything `ProjectDetails` shows and keep the button
   * order, and should use `SheetDialog` so Esc, Back and the backdrop work.
   */
  sheets?: 'dialog' | 'inline' | 'theme';
  load: () => Promise<{ default: ComponentType<ThemeProps> }>;
}
