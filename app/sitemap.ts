import type { MetadataRoute } from 'next';
import { pieces, pieceUrl } from './case-studies/_shared/series';
import { livePosts, postUrl } from './notes/_parts/posts';

export const revalidate = 3600; // hourly, so a scheduled note appears within the hour of its day

const SITE = 'https://calebs.garden';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE}/` },
    { url: `${SITE}/experience` },
    { url: `${SITE}/case-studies` },
    ...pieces.map((p) => ({ url: `${SITE}${pieceUrl(p.slug)}` })),
    { url: `${SITE}/notes` },
    ...livePosts().map((p) => ({ url: `${SITE}${postUrl(p.slug)}`, lastModified: p.date })),
  ];
}
