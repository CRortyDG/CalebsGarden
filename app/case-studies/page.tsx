import type { Metadata } from 'next';
import Link from 'next/link';
import './_shared/case-study.css';
import { pieces, pieceUrl, SERIES_NAME } from './_shared/series';

const description =
  'A short series on software sized to its community: free or nearly free, accountless, and built for one city or one group. Drawn from madtown.today and Candlefair.';

export const metadata: Metadata = {
  title: SERIES_NAME,
  description,
  alternates: { canonical: '/case-studies' },
  openGraph: { type: 'website', title: SERIES_NAME, description, url: '/case-studies', images: ['/case-studies/candlefair/og.jpg'] },
};

export default function CaseStudies() {
  return (
    <main className="cs cs-essay">
      <p className="back">
        <Link href="/">← calebs.garden</Link>
      </p>
      <header className="cs-head">
        <p className="cs-kicker">Case studies</p>
        <h1>{SERIES_NAME}</h1>
        <p className="cs-dek">
          I build free, or nearly free, software for people I can name: one city, one group of friends. These pieces are about how that works in practice, drawn
          from two projects, <a href="https://madtown.today">madtown.today</a> and <a href="https://dnd.calebs.garden">Candlefair</a>. Start with the first; each
          one stands on its own.
        </p>
      </header>
      <ol className="cs-index-list">
        {pieces.map((p) => (
          <li key={p.slug}>
            <Link href={pieceUrl(p.slug)}>{p.title}</Link>
            <p>{p.blurb}</p>
          </li>
        ))}
      </ol>
    </main>
  );
}
