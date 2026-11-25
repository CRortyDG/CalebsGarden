import made from './made.json';

/**
 * The link-preview image for a page: its own card in public/og/ once `npm run og`
 * has drawn it, otherwise the home page's card, so a new page never shares a
 * broken image.
 */
export function ogImage(key: string): string {
  return (made as string[]).includes(key) ? `/og/${key}.jpg` : '/og.jpg';
}
