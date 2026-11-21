import { PlainIndex } from '@/site/PlainIndex';
import type { ThemeProps } from '../types';

/** "No scenery": the plain list, with names opening the shared project sheet. */
export default function Plain({ projects }: ThemeProps) {
  return <PlainIndex projects={projects} mode="sheet" />;
}
