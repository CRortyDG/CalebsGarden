import type { Metadata } from 'next';
import Link from 'next/link';
import '../case-studies/_shared/case-study.css';
import { MADTOWN_EVENTS } from '@/madtown-events';
import { getMadtownTimeline, type TimelineDay } from '@/madtown-timeline';
import Timeline from '@/timeline/Timeline';
import { ogImage } from '@/og/image';

export const revalidate = 900; // rebuilt every 15 minutes, but the fetch below keeps a good answer for 12 hours, so madtown is still asked at most twice a day; a failed read (not cached) is retried on the next rebuild

const description =
  'Every day of madtown.today since launch, as an animated timeline you can play, pause and scrub: visitors, where new people came from, who came back, and the posts and features behind each change.';

export const metadata: Metadata = {
  title: 'madtown.today, day by day',
  description,
  alternates: { canonical: '/madtown' },
  openGraph: { type: 'article', title: 'madtown.today, day by day · calebs.garden', description, url: '/madtown', images: [ogImage('madtown')] },
  twitter: { card: 'summary_large_image', images: [ogImage('madtown')] },
};

const fmt = (n: number) => n.toLocaleString('en-US');
const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);

/** New visitors on a set of days, and how many were back a week later (days with a count only). */
function stuck(days: TimelineDay[]) {
  const counted = days.filter((d) => d.back7 !== null);
  const fresh = counted.reduce((s, d) => s + d.newBrowsers, 0);
  const back = counted.reduce((s, d) => s + (d.back7 ?? 0), 0);
  return { fresh: days.reduce((s, d) => s + d.newBrowsers, 0), rate: pct(back, fresh) };
}

export default async function MadtownNumbers() {
  const data = await getMadtownTimeline();
  const days = data?.days ?? [];

  // The page's three claims, worked out from the same numbers the timeline draws.
  const redditDays = days.filter((d) => (d.sources?.reddit ?? 0) >= 50);
  const quietDays = days.filter((d) => d.sources && d.sources.reddit < 10);
  const spike = stuck(redditDays);
  const quiet = stuck(quietDays);
  const regs = days.filter((d) => d.regulars !== null && d.weekBrowsers);
  const firstReg = regs[0];
  const lastReg = regs.at(-1);
  const recent = days.slice(-7).filter((d) => d.visitors !== null);
  const perDay = recent.length ? Math.round(recent.reduce((s, d) => s + (d.visitors ?? 0), 0) / recent.length) : null;

  return (
    <main className="cs cs-essay">
      <p className="back">
        <Link href="/">← calebs.garden</Link>
      </p>

      <header className="cs-head">
        <p className="cs-kicker">madtown.today in numbers</p>
        <h1>Day by day</h1>
        <p className="cs-dek">
          madtown.today is a daily homepage for Madison: four puzzles, a question for the town, and a Gazette. This is every day since it went up, played
          back. Press play, or drag through it. Tap a flower to see what happened that day, and switch what the bars count to see who actually stayed.
        </p>
      </header>

      {data ? (
        <>
          <Timeline data={data} events={MADTOWN_EVENTS} />

          <h2>What it shows</h2>
          <ol>
            {redditDays.length > 0 && (
              <li>
                <strong>A post brings a crowd, and very few stay.</strong> On the {redditDays.length} days Reddit sent 50 or more new people, {fmt(spike.fresh)}{' '}
                arrived and {spike.rate}% were back a week later. On ordinary days it was {quiet.rate}%. A spike is a good day, but it isn&apos;t growth.
              </li>
            )}
            {firstReg && lastReg && firstReg !== lastReg && (
              <li>
                <strong>The regulars are the site.</strong> People here on {data.regularDays} or more days a week went from {fmt(firstReg.regulars!)} to{' '}
                {fmt(lastReg.regulars!)}. As the spikes faded, their share of the week&apos;s visitors went from {pct(firstReg.regulars!, firstReg.weekBrowsers!)}%
                to {pct(lastReg.regulars!, lastReg.weekBrowsers!)}%.
              </li>
            )}
            <li>
              <strong>Shipping changes the shape more slowly than posting does.</strong> Every feature flower shows next-day return in the week before and the
              week after it. The changes are small and noisy, which is why the first-visit ideas were run as tests. Most of them{' '}
              <Link href="/notes/three-tests-that-didnt-win">didn&apos;t win</Link>.
            </li>
          </ol>

          <h2>How it&apos;s counted</h2>
          <p>
            A visitor is one browser on one Madison day. madtown.today has no accounts (
            <Link href="/case-studies/the-browser-is-the-account">the browser is the account</Link>). It keeps a random id per browser, and every number
            here is worked out inside its database. The site publishes counts only, at{' '}
            <a href="https://madtown.today/api/public-timeline">/api/public-timeline</a>, and this page reads them twice a day. {fmt(data.visitorsSinceLaunch)}{' '}
            browsers have visited since launch
            {perDay !== null ? <>, about {fmt(perDay)} a day this week</> : null}. Day one&apos;s count is partial. Where new people came from was recorded from
            October 4. The events are my own notes. A flower marks what happened; it doesn&apos;t prove what caused a change. More on who comes back is in{' '}
            <Link href="/notes/who-comes-back">this note</Link>.
          </p>
        </>
      ) : (
        <p>madtown.today&apos;s numbers couldn&apos;t be read just now. The page tries again every 15 minutes.</p>
      )}
    </main>
  );
}
