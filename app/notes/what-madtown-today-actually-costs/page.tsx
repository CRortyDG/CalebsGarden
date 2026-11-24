import Link from 'next/link';
import { Note, noteMetadata } from '../_parts/Note';

const SLUG = 'what-madtown-today-actually-costs';
export const metadata = noteMetadata(SLUG);
export const revalidate = 3600; // a scheduled note goes live within the hour of its day

// One Vercel billing cycle (24 Oct to 21 Nov 2026, 29 days), read off the Pro usage page.
const VERCEL = [
  { line: 'Observability Plus events', usage: '13.97 million events', usd: 13.45 },
  { line: 'Functions (CPU, invocations, memory, transfer)', usage: '4.56 million invocations, 22 hours of CPU', usd: 7.05 },
  { line: 'Builds', usage: '26 hours of build CPU', usd: 5.25 },
  { line: 'Function and deployment storage', usage: '22 GB-months', usd: 2.24 },
  { line: 'Web Analytics', usage: '38,300 events', usd: 1.15 },
  { line: 'CDN requests and transfer', usage: '2.78 million requests, 14 GB', usd: 0.15 },
];
const VERCEL_TOTAL = 29.29;
const DAYS = 29;
const INVOCATIONS = 4_560_000;
// madtown.today's /admin/stats, the same 29 Madison days: unique browsers per day, added up.
const VISITOR_DAYS = 10_914;
const VISITORS_A_DAY = VISITOR_DAYS / DAYS; // about 376
const perDay = INVOCATIONS / DAYS;
const perVisitor = perDay / VISITORS_A_DAY;

const PLAN = [
  { step: 'Today', what: 'Next.js on Vercel Pro, Upstash Redis', usd: 'about $45', effort: '' },
  { step: '1. Settings', what: 'Observability Plus off, previews only for pull requests, shorter retention', usd: 'about $35', effort: 'an evening' },
  { step: '2. Durable Object', what: 'Who’s here, presence and live tallies over WebSockets; Upstash dropped', usd: 'about $20', effort: 'about a week' },
  { step: '3. Off Vercel', what: 'The Next.js site on Cloudflare Workers, beside the Durable Object', usd: 'about $5', effort: 'two to three more weeks' },
];

const fmt = (n: number, d = 0) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

export default function Page() {
  return (
    <Note slug={SLUG}>
      <p>
        In <Link href="/case-studies/cheap-enough-to-give-away">Cheap enough to give away</Link> I wrote that madtown.today&apos;s bill is almost entirely a
        &ldquo;who&apos;s here&rdquo; heartbeat. That came from the README, which I wrote when the heartbeat was the only live thing on the page. Then I opened the
        actual bill. The heartbeat is a small part of it. This note is what I found, and the plan to make madtown.today cost about as much as Candlefair does,
        written before I start, so I can check it against what really happens.
      </p>

      <h2>The bill</h2>
      <p>
        What madtown.today costs to run is the $15 Upstash Redis database, for about {fmt(VISITORS_A_DAY)} visitors a day. The site itself is on Vercel Pro,
        which is my own choice: I upgraded when my build and test runners went past the free plan&apos;s CPU time, and nobody using the site pays for it. Pro is a
        $20 fee that includes $20 of usage, so anything past $20 of usage is extra. Counting it all, I pay about $45 a month. One Vercel billing cycle, 24 October
        to 21 November, looked like this:
      </p>
      <div className="cs-table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Vercel line</th>
              <th scope="col">Usage</th>
              <th scope="col">Charge</th>
            </tr>
          </thead>
          <tbody>
            {VERCEL.map((r) => (
              <tr key={r.line}>
                <td>{r.line}</td>
                <td>{r.usage}</td>
                <td>${fmt(r.usd, 2)}</td>
              </tr>
            ))}
            <tr>
              <th scope="row" colSpan={2}>
                Total usage
              </th>
              <td>
                <strong>${fmt(VERCEL_TOTAL, 2)}</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        The site&apos;s own stats count {fmt(VISITOR_DAYS)} visitor-days in the same {DAYS} days, between 285 and 575 a day. So Vercel alone came to about{' '}
        {fmt((VERCEL_TOTAL / VISITOR_DAYS) * 100, 2)}¢ per visitor per day, and almost all of that grows with traffic. It isn&apos;t a flat fee that more people
        could share for free.
      </p>

      <h2>What I got wrong</h2>
      <p>I&apos;d guessed the build and test runners were the expensive part. They&apos;re part of it, but three other things matter more.</p>
      <ul>
        <li>
          <strong>The biggest line is a monitoring add-on.</strong> Observability Plus keeps 30 days of logs and traces, and charges $1.20 per million events. It
          was {fmt((13.45 / VERCEL_TOTAL) * 100)}% of the Vercel usage. Vercel now turns it on by default for new Pro teams. The free version keeps a day of history,
          which is plenty for a site this size. Turning it off is a toggle in the billing settings.
        </li>
        <li>
          <strong>The room, not the heartbeat.</strong> The Who&apos;s here card grew into a little shared room: you can wave at people and paint pixels on a canvas
          together. To keep that live, every open tab asks the server for the room every 4 seconds whenever two or more people are on the page. That&apos;s 15 requests
          a minute per tab, each about 12 Redis commands, next to 2 heartbeats a minute. {fmt(INVOCATIONS / 1e6, 2)} million function calls in {DAYS} days is about{' '}
          {fmt(Math.round(perDay / 1000) * 1000)} a day, or about {fmt(Math.round(perVisitor / 10) * 10)} for each visitor. Almost none of them are people doing something. They&apos;re open tabs asking
          whether anything changed.
        </li>
        <li>
          <strong>A build for every branch.</strong> Vercel builds a preview of every branch pushed to the repository, and the repository has about 275 branches.
          Each build runs the full test suite first, which also runs on GitHub. That&apos;s the $5.25.
        </li>
      </ul>
      <p>
        GitHub Actions turned out to be the cheap part. The $15 is a budget, not usage: the repository runs well inside the 2,000 minutes a month that a private
        repository gets for free.
      </p>

      <h2>The plan</h2>
      <p>
        The rule I took from Candlefair is that the bill should grow with what people <em>do</em>, not with how long they keep a tab open. madtown.today breaks it in
        the most literal way: a tab open on a quiet afternoon costs money every 4 seconds.
      </p>
      <p>
        Candlefair fixed the same problem with a{' '}
        <a href="https://developers.cloudflare.com/durable-objects/">Cloudflare Durable Object</a>: one small server-side object that browsers keep a WebSocket open to.
        Being connected is being here, so there&apos;s no heartbeat. When someone waves or paints, the object tells everyone. When nothing happens, it sleeps and
        isn&apos;t billed. Only the connection counts as a request, messages from browsers count as one request per 20, and messages to browsers are free. At
        madtown.today&apos;s size, that&apos;s a couple of thousand billed requests a day, against a free allowance of 100,000.
      </p>
      <div className="cs-table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Step</th>
              <th scope="col">What changes</th>
              <th scope="col">What I pay a month</th>
              <th scope="col">Effort</th>
            </tr>
          </thead>
          <tbody>
            {PLAN.map((r) => (
              <tr key={r.step}>
                <td>{r.step}</td>
                <td>{r.what}</td>
                <td>{r.usd}</td>
                <td>{r.effort}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        Step 2 alone stops at about $20 because that&apos;s Vercel Pro&apos;s minimum, however little the site uses. Step 3 moves the site itself to Cloudflare
        Workers. Next.js runs there through an adapter, so the pages stay Next.js. I tried a test build with the{' '}
        <a href="https://opennext.js.org/cloudflare">OpenNext adapter</a> before writing this. It built, and the homepage, the Gazette and the embeds rendered.
        Three things didn&apos;t work yet: the puzzles and share-image fonts are read from disk, which a Worker can&apos;t do, so they have to be bundled into the
        build; the adapter needs a slightly newer Next.js; and its support for the request middleware is still experimental.
      </p>
      <p>
        The $5 is Cloudflare&apos;s paid Workers plan. The free plan allows 10 ms of CPU per request, and on Vercel madtown.today averaged about{' '}
        {fmt((22 * 3600 * 1000) / INVOCATIONS)} ms per call, so I&apos;m planning on paying it.
      </p>

      <h2>How many people the free plan would carry</h2>
      <p>
        A rough guess, until there are real numbers to check it against. Once the 4-second polling is gone, a visit is mostly loading the page, starting and
        finishing a few puzzles, voting on the day&apos;s question and staying connected to the room. I count that as about 20 to 50 requests a person a day
        that reach a Worker. Static files like scripts, fonts and images don&apos;t count, because Cloudflare serves those for free.
      </p>
      <ul>
        <li>
          <strong>Requests:</strong> the free plan allows 100,000 a day, so that&apos;s roughly <strong>2,000 to 5,000 people a day</strong>. The room
          barely adds to it: being connected is one request, and only one in every 20 messages from browsers is billed.
        </li>
        <li>
          <strong>CPU is the real limit:</strong> a free Worker gets 10 ms per request, and a server-rendered page takes longer than that today. The free plan
          would hold the room on its own, but not the whole site, unless the pages get a lot lighter.
        </li>
        <li>
          <strong>On the $5 plan:</strong> 10 million requests a month is about 330,000 a day, so around 6,000 to 15,000 people a day before any extra cost.
        </li>
      </ul>
      <p>
        Today&apos;s traffic is about {fmt(VISITORS_A_DAY)} a day, so either plan has plenty of headroom. I&apos;ll replace these guesses with the real request
        counts after the move.
      </p>

      <h2>What stays the same</h2>
      <p>
        Nobody should notice any of this. The puzzles, the streaks and the Who&apos;s here room work the same way. Streaks live in each person&apos;s browser, so a
        new server can&apos;t lose them. The count of people here now should update faster, because it&apos;s pushed instead of polled.
      </p>

      <h2>What I&apos;ll check afterwards</h2>
      <p>
        Every number above about the future is an estimate. When each step ships, I&apos;ll come back with the next full billing cycle and the request counts, and
        update this note with what it actually cost.
      </p>

      <h2>Prices used</h2>
      <p>Checked on 21 November 2026.</p>
      <ul>
        <li>
          <a href="https://vercel.com/docs/plans/pro-plan">Vercel Pro</a>: $20 a month including $20 of usage.{' '}
          <a href="https://vercel.com/docs/observability/observability-plus">Observability Plus</a>: $1.20 per million events.
        </li>
        <li>
          <a href="https://developers.cloudflare.com/durable-objects/platform/pricing/">Durable Objects</a>: free plan 100,000 requests and 100,000 rows written a
          day. Incoming WebSocket messages count 20 to a request, and outgoing ones aren&apos;t billed.
        </li>
        <li>
          <a href="https://developers.cloudflare.com/workers/platform/pricing/">Cloudflare Workers</a>: free plan 100,000 requests a day. Paid plan $5 a month with
          10 million requests. Static files are free. <a href="https://developers.cloudflare.com/workers/platform/limits/">Limits</a>: 10 ms of CPU per request
          on the free plan.
        </li>
        <li>
          <a href="https://upstash.com/pricing/redis">Upstash Redis</a>: $0.20 per 100,000 commands, or fixed plans from $10 a month.
        </li>
      </ul>
    </Note>
  );
}
