import type { MetadataRoute } from 'next';
import { pieces, pieceUrl } from './case-studies/_shared/series';
import { posts, postUrl } from './notes/_parts/posts';

const SITE = 'https://calebs.garden';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE}/` },
    { url: `${SITE}/case-studies` },
    ...pieces.map((p) => ({ url: `${SITE}${pieceUrl(p.slug)}` })),
    { url: `${SITE}/notes` },
    ...posts.map((p) => ({ url: `${SITE}${postUrl(p.slug)}`, lastModified: p.date })),
  ];
}
