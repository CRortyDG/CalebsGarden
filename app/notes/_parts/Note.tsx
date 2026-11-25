import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import '../../case-studies/_shared/case-study.css';
import { allPosts, formatDate, isDue, isLive, livePosts, postUrl } from './posts';
import { VineBand } from '@/overgrowth/VineBand';
import { ogImage } from '@/og/image';

const SITE = 'https://calebs.garden';

export function noteMetadata(slug: string): Metadata {
  const p = allPosts.find((x) => x.slug === slug)!;
  const url = postUrl(slug);
  const image = ogImage(`notes/${slug}`);
  return {
    title: p.title,
    description: p.summary,
    alternates: { canonical: url, types: { 'application/rss+xml': '/notes/feed.xml' } },
    openGraph: { type: 'article', title: p.title, description: p.summary, url, publishedTime: p.date, images: [{ url: image, width: 1200, height: 630, alt: p.title }] },
    twitter: { card: 'summary_large_image', title: p.title, description: p.summary, images: [image] },
  };
}

/** The frame for one note: date, title, the summary as a standalone "In short", the post, and other notes. */
export function Note({ slug, kind, children }: { slug: string; kind: 'idea' | 'working' | 'note'; children: React.ReactNode }) {
  const p = allPosts.find((x) => x.slug === slug)!;
  if (!isLive(p)) notFound();
  const label = { idea: 'An idea, not built', working: 'Working it out', note: 'Note' }[kind];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: p.title,
    description: p.summary,
    datePublished: p.date,
    author: { '@type': 'Person', name: 'Caleb', url: SITE },
    isPartOf: { '@type': 'Blog', name: 'Notes', url: `${SITE}/notes` },
    mainEntityOfPage: `${SITE}${postUrl(slug)}`,
  };
  return (
    <main className="cs cs-essay">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <VineBand>
        <p className="back">
          <Link href="/notes">← Notes</Link>
        </p>
        <header className="cs-head">
          <p className="cs-kicker">
            {isDue(p) ? '' : 'Scheduled for '}<time dateTime={p.date}>{formatDate(p.date)}</time> · {label}
          </p>
          <h1>{p.title}</h1>
        </header>
      </VineBand>
      <aside className="cs-short" aria-label="In short">
        <p className="cs-short-label">In short</p>
        <p>{p.summary}</p>
      </aside>
      <article className="cs-prose">{children}</article>
      <nav className="cs-series" aria-label="More notes">
        <h2>More notes</h2>
        <ol>
          {livePosts()
            .filter((x) => x.slug !== slug)
            .map((x) => (
              <li key={x.slug}>
                <Link href={postUrl(x.slug)}>{x.title}</Link>
                <span>{formatDate(x.date)}</span>
              </li>
            ))}
          <li>
            <Link href="/case-studies">Small software</Link>
            <span>The case studies: how madtown.today and Dungeon Garden are built.</span>
          </li>
        </ol>
      </nav>
    </main>
  );
}
