import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Case studies',
  description: 'Engineering write-ups on how each project in the garden was built.',
};

// Placeholder until the first case study lands at /case-studies/candlefair.
export default function CaseStudies() {
  return (
    <main className="growing">
      <p className="back">
        <Link href="/">← calebs.garden</Link>
      </p>
      <h2>Case studies</h2>
      <ul>
        <li>
          <span className="name">Candlefair</span>
          <span className="host">being written</span>
          <p>How Candlefair, a companion for D&amp;D at the table, was built.</p>
        </li>
      </ul>
    </main>
  );
}
