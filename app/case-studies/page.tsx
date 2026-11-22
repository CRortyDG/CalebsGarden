import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Case studies',
  description: 'Engineering write-ups on how each project in the garden was built.',
};

export default function CaseStudies() {
  return (
    <main className="plain">
      <p className="back">
        <Link href="/">← calebs.garden</Link>
      </p>
      <h1>Case studies</h1>
      <ul className="project-list">
        <li>
          <Link className="name" href="/case-studies/candlefair">
            The story behind Candlefair
          </Link>
          <span className="blurb">draft</span>
          <p>How a companion for D&amp;D at the table went from one game on Redis to a room per campaign on Cloudflare.</p>
        </li>
      </ul>
    </main>
  );
}
