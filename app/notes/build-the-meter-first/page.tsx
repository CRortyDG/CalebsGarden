import Link from 'next/link';
import { Code } from '../../case-studies/_shared/Code';
import { Note, noteMetadata } from '../_parts/Note';

const SLUG = 'build-the-meter-first';
export const metadata = noteMetadata(SLUG);
export const revalidate = 3600; // a scheduled note goes live within the hour of its day

export default function Page() {
  return (
    <Note slug={SLUG}>
      <p>
        Candlefair runs every D&amp;D group in its own small Cloudflare room, which sleeps between moves and costs close to nothing while nobody is playing (the
        details are in <Link href="/case-studies/cheap-enough-to-give-away">Cheap enough to give away</Link>). The obvious next question is: how many groups can
        it host before the free plan runs out?
      </p>
      <p>I don&apos;t know yet. And I didn&apos;t want to guess, so before answering it I built the thing that will.</p>

      <h2>The meter</h2>
      <p>
        Every campaign&apos;s room counts its own usage, by UTC day and by month: requests, messages from screens, keep-alive pings, rows read and written, images
        uploaded. A box in the DM&apos;s settings, Hosting costs, shows those counts against Cloudflare&apos;s free daily limits, and what they would cost at the
        paid plan&apos;s published prices.
      </p>
      <Code file="src/shared/hosting.ts" at="Candlefair f8de4ba" note="trimmed">{`
/**
 * What running the app costs on Cloudflare, for the DM's Hosting costs box.
 *
 * Each campaign's room counts its own usage (worker/room.ts) by UTC day and
 * month. This file turns those counts into money at Cloudflare's published
 * Workers Paid prices. Nothing here bills anyone: it's so the DM can see where
 * the cost of hosting would go if the free tier ever ran out.
 */
`}</Code>
      <p>
        It bills nobody. It exists so that when I say what a game night costs, the number comes from a game night, not a spreadsheet. It also lists what isn&apos;t
        known: whether Cloudflare bills keep-alive pings isn&apos;t documented, so the meter counts them separately instead of pretending either way.
      </p>

      <h2>Why first</h2>
      <ul>
        <li>
          <strong>A capacity number is a claim.</strong> &ldquo;Hosts 500 groups for free&rdquo; reads like a fact. If it&apos;s a guess, it&apos;s a guess dressed
          as a fact, and it&apos;s the kind of thing that gets quoted.
        </li>
        <li>
          <strong>Real use is weirder than the model.</strong> How long a session runs, how many phones stay connected, how often someone uploads a map: those
          decide the bill, and I can&apos;t know them before people play.
        </li>
        <li>
          <strong>It shows where the money would go.</strong> When a cost does turn up, the meter already says which part of the app caused it, which is the
          part to fix.
        </li>
      </ul>

      <h2>What happens without one</h2>
      <p>
        madtown.today shows the other side. Its README estimates the cost of each feature by hand, and by that estimate the &ldquo;who&apos;s here&rdquo; heartbeat
        was most of the bill. When I finally read the real invoices, most of it was something else: a monitoring add-on and a tab asking the server for news every
        few seconds. The estimate was careful and still wrong, because it was an estimate. That story is in{' '}
        <Link href="/notes/what-madtown-today-actually-costs">What madtown.today actually costs</Link>.
      </p>
      <p>When Candlefair has enough real games behind it, the capacity number will go there too, with the meter&apos;s readings next to it.</p>
    </Note>
  );
}
