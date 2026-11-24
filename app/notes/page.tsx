import type { Metadata } from 'next';
import Link from 'next/link';
import '../case-studies/_shared/case-study.css';
import { formatDate, kindLabel, livePosts, postUrl } from './_parts/posts';
import { VineBand } from '@/overgrowth/VineBand';

export const revalidate = 3600; // hourly, so a scheduled note appears within the hour of its day

const description = 'Dated notes from Caleb: ideas not built yet, opinions, and things being worked out. The finished write-ups are the case studies.';

export const metadata: Metadata = {
  title: 'Notes',
  description,
  alternates: { canonical: '/notes', types: { 'application/rss+xml': '/notes/feed.xml' } },
  openGraph: { type: 'website', title: 'Notes', description, url: '/notes', images: ['/og.jpg'] },
};

export default function Notes() {
  return (
    <main className="cs cs-essay">
      <VineBand>
        <p className="back">
          <Link href="/">← calebs.garden</Link>
        </p>
        <header className="cs-head">
          <p className="cs-kicker">Notes</p>
          <h1>Notes</h1>
          <p className="cs-dek">
            Shorter, dated posts: ideas I haven&apos;t built, opinions I might change, and maths I&apos;m working out. For finished work with the code behind it, see
            the <Link href="/case-studies">case studies</Link>. There&apos;s an <a href="/notes/feed.xml">RSS feed</a>.
          </p>
          <p className="cs-dek">
            Most of these are ideas I&apos;ve been carrying around for a while. The first four went up together on 21 November 2026, and the rest come out one at
            a time. Each one is dated the day it was posted, and anything I haven&apos;t built says so.
          </p>
        </header>
      </VineBand>
      <ol className="cs-index-list cs-notes-list">
        {livePosts().map((p) => (
          <li key={p.slug}>
            <p className="cs-note-meta">
              <time dateTime={p.date}>{formatDate(p.date)}</time>
              {p.kind === 'idea' ? ` · ${kindLabel.idea}` : ''}
            </p>
            <Link href={postUrl(p.slug)}>{p.title}</Link>
            <p>{p.summary}</p>
          </li>
        ))}
      </ol>
    </main>
  );
}
