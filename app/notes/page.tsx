import type { Metadata } from 'next';
import Link from 'next/link';
import '../case-studies/_shared/case-study.css';
import { formatDate, posts, postUrl } from './_parts/posts';

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
      </header>
      <ol className="cs-index-list cs-notes-list">
        {posts.map((p) => (
          <li key={p.slug}>
            <time dateTime={p.date}>{formatDate(p.date)}</time>
            <Link href={postUrl(p.slug)}>{p.title}</Link>
            <p>{p.summary}</p>
          </li>
        ))}
      </ol>
    </main>
  );
}
