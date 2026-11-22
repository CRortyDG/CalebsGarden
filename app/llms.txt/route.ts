import { pieces, pieceUrl, SERIES_NAME } from '../case-studies/_shared/series';
import { livePosts, postUrl } from '../notes/_parts/posts';
import { projects } from '@/projects';

export const revalidate = 3600; // hourly, so a scheduled note appears within the hour of its day

const SITE = 'https://calebs.garden';

/** llms.txt (llmstxt.org): a plain map of the site for language models and other readers. */
export function GET() {
  const live = projects.filter((p) => p.type === 'project' && p.href);
  const text = `# calebs.garden

> Caleb builds free or nearly free software sized to its community: tools for one city or one group of people, without accounts, cheap enough to give away. This site holds the projects, the case studies on how they're built, and dated notes.

## Projects

${live.map((p) => `- [${p.name}](${p.href}): ${p.about || p.blurb}`).join('\n')}

## Case studies: ${SERIES_NAME}

${pieces.map((p) => `- [${p.title}](${SITE}${pieceUrl(p.slug)}): ${p.blurb}`).join('\n')}

## Notes

${livePosts().map((p) => `- [${p.title}](${SITE}${postUrl(p.slug)}) (${p.date}): ${p.summary}`).join('\n')}

## Optional

- [Notes RSS feed](${SITE}/notes/feed.xml)
`;
  return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
