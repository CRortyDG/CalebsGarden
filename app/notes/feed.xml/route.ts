import { kindLabel, livePosts, postUrl } from '../_parts/posts';

export const revalidate = 3600; // hourly, so a scheduled note appears within the hour of its day

const SITE = 'https://calebs.garden';
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** RSS 2.0 feed of the notes. */
export function GET() {
  const items = livePosts()
    .map(
      (p) => `    <item>
      <title>${esc(p.title)}</title>
      <link>${SITE}${postUrl(p.slug)}</link>
      <guid>${SITE}${postUrl(p.slug)}</guid>
      <category>${kindLabel[p.kind]}</category>
      <pubDate>${new Date(`${p.date}T18:00:00Z`).toUTCString()}</pubDate>
      <description>${esc(p.summary)}</description>
    </item>`,
    )
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Notes · calebs.garden</title>
    <link>${SITE}/notes</link>
    <description>Dated notes from Caleb: ideas, opinions and maths in progress.</description>
    <language>en-us</language>
${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
