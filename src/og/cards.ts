import { pieces, SERIES_NAME } from '../../app/case-studies/_shared/series';
import { allPosts } from '../../app/notes/_parts/posts';

/**
 * The link-preview cards: the home page's vines grown from a seed (the card's
 * key, so each page has its own garden and it is the same on every share),
 * with the page's title on top. `npm run og` draws them into public/og/.
 */
export type Card = { key: string; title: string; label: string };

export function ogCards(): Card[] {
  return [
    { key: 'case-studies', title: SERIES_NAME, label: 'Case studies' },
    ...pieces.map((p) => ({ key: `case-studies/${p.slug}`, title: p.title, label: SERIES_NAME })),
    { key: 'notes', title: 'Notes', label: 'Ideas, opinions and maths in progress' },
    ...allPosts.map((p) => ({ key: `notes/${p.slug}`, title: p.title, label: 'Notes' })),
    { key: 'madtown', title: 'madtown.today, day by day', label: 'Every day since launch' },
    { key: 'experience', title: 'Systems I’ve kept running', label: 'Experience' },
  ];
}
