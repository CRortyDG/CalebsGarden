import type { MetadataRoute } from 'next';

// Everyone, including AI crawlers, is welcome to read the whole site.
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: '*', allow: '/' }], sitemap: 'https://calebs.garden/sitemap.xml' };
}
