import type { Metadata } from 'next';
import Link from 'next/link';
import './case-study.css';
import { pieces, pieceUrl, SERIES_NAME } from './series';

const SITE = 'https://calebs.garden';

/** Metadata for one piece of the series, with its own Open Graph card. */
export function essayMetadata(slug: string, description: string, image = '/case-studies/candlefair/og.jpg'): Metadata {
  const p = pieces.find((x) => x.slug === slug)!;
  const url = pieceUrl(slug);
  return {
    title: p.title,
    description,
    alternates: { canonical: url },
    openGraph: { type: 'article', title: p.title, description, url, images: [{ url: image, width: 1200, height: 630, alt: p.title }] },
    twitter: { card: 'summary_large_image', title: p.title, description, images: [image] },
  };
}

/**
 * The frame every piece shares: series line, title, an "In short" summary that can be quoted on
 * its own, the essay, and the rest of the series at the end. Plain server markup.
 */
export function Essay({
  slug,
  dek,
  inShort,
  about,
  children,
}: {
  slug: string;
  dek: string;
  inShort: React.ReactNode;
  about: { name: string; url: string }[];
  children: React.ReactNode;
}) {
  const i = pieces.findIndex((x) => x.slug === slug);
  const p = pieces[i];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: p.title,
    description: dek,
    author: { '@type': 'Person', name: 'Caleb', url: SITE },
    isPartOf: { '@type': 'CreativeWorkSeries', name: SERIES_NAME, url: `${SITE}/case-studies` },
    about: about.map((a) => ({ '@type': 'SoftwareApplication', name: a.name, url: a.url })),
    mainEntityOfPage: `${SITE}${pieceUrl(slug)}`,
  };
  return (
    <main className="cs cs-essay">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <p className="back">
        <Link href="/case-studies">← {SERIES_NAME}</Link>
      </p>
      <header className="cs-head">
        <p className="cs-kicker">
          {SERIES_NAME} · {i + 1} of {pieces.length}
        </p>
        <h1>{p.title}</h1>
        <p className="cs-dek">{dek}</p>
      </header>
      <aside className="cs-short" aria-label="In short">
        <p className="cs-short-label">In short</p>
        {inShort}
      </aside>
      <article className="cs-prose">{children}</article>
      <nav className="cs-series" aria-label={`More from ${SERIES_NAME}`}>
        <h2>{SERIES_NAME}</h2>
        <ol>
          {pieces.map((x) => (
            <li key={x.slug} aria-current={x.slug === slug ? 'page' : undefined}>
              {x.slug === slug ? <strong>{x.title}</strong> : <Link href={pieceUrl(x.slug)}>{x.title}</Link>}
              <span>{x.blurb}</span>
            </li>
          ))}
        </ol>
      </nav>
    </main>
  );
}

/** A short "where this comes from" line under a claim. */
export function Src({ kind }: { kind: 'record' | 'memory' | 'code' }) {
  const label = { record: 'On record', memory: 'From memory', code: 'In the code' }[kind];
  return <span className={`cs-source is-${kind}`}>{label}</span>;
}
