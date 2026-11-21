import type { ComponentType } from 'react';
import type { Project } from '@/projects';

/** What every theme is given. A theme draws scenery; it never owns content. */
export interface ThemeProps {
  projects: Project[];
  /** Opens the shared project sheet (same as following a `#id` link). */
  openProject: (id: string) => void;
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
   */
  sheets?: 'dialog' | 'inline';
  load: () => Promise<{ default: ComponentType<ThemeProps> }>;
}
