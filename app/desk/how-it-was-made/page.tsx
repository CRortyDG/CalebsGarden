import type { Metadata } from 'next';
import Link from 'next/link';
import '../../case-studies/_shared/case-study.css';
import { HowItWasMade } from '@/typing/HowItWasMade';
import { finalText, isRecording } from '@/typing/format';
import rec from '../../../public/typing/how-it-was-made-example.json';

// A prototype of "How this was made": the desk's replay, for a piece written with
// some AI help. The piece is made up (scripts/make-ai-example.mts plays the writer).
export const metadata: Metadata = {
  title: 'How this was made (example)',
  description: 'An example of a piece that shows which parts were typed and which came from an AI.',
  robots: { index: false, follow: false },
};

export default function Page() {
  if (!isRecording(rec)) throw new Error('public/typing/how-it-was-made-example.json is not a recording');
  const title = finalText(rec).match(/^\s*# ([^\n]*)/)?.[1] ?? 'Untitled';
  return (
    <main className="cs cs-essay hm-page">
      <p className="back">
        <Link href="/desk">← The desk</Link>
      </p>
      <header className="cs-head">
        <p className="cs-kicker">Example · written with AI help</p>
        <h1>{title}</h1>
      </header>
      <aside className="cs-short" aria-label="About this example">
        <p className="cs-short-label">About this page</p>
        <p>
          A made-up piece, to try out showing how AI was used to write something. When text is pasted in from an AI at the desk, it&rsquo;s marked with what was
          asked, so each sentence below knows whether it was typed or is still the AI&rsquo;s words. Tap any sentence.
        </p>
      </aside>
      <HowItWasMade rec={rec} />
    </main>
  );
}
