/** Notes: dated, shorter posts. Ideas, opinions and things in progress, unlike the case studies. */
export type Post = { slug: string; title: string; date: string; summary: string };

// Newest first. date is the US Central date it was published (YYYY-MM-DD).
export const posts: Post[] = [
  {
    slug: 'local-radio-for-third-spaces',
    title: 'Local radio for third spaces, for about $5 a month',
    date: '2026-11-21',
    summary:
      'An internet radio stream for coffee shops and other third spaces, with local bands mixed in. The bandwidth turns out to cost about $5 a month for 50 shops. The licensing is the hard part.',
  },
  {
    slug: 'ticketing-run-by-cities',
    title: 'What if every city ran its own ticketing?',
    date: '2026-11-21',
    summary:
      'An idea I haven’t built: open-source ticketing backed by a nonprofit, run as a separate copy in each city or state by a local chapter, with a shared layer so one city’s site can sell another city’s shows.',
  },
];

export const postUrl = (slug: string) => `/notes/${slug}`;

export function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}
