import Link from 'next/link';
import MadtownLedger from '../../case-studies/_shared/MadtownLedger';
import { Note, noteMetadata } from '../_parts/Note';

const SLUG = 'what-50-dollars-buys';
export const metadata = noteMetadata(SLUG);
export const revalidate = 3600; // a scheduled note goes live within the hour of its day

export default function Page() {
  return (
    <Note slug={SLUG} kind="note">
      <p>
        madtown.today is a free homepage for Madison: daily puzzles, a poll for the whole city, a guestbook, the weather. No accounts, no ad networks. People
        sometimes assume a site like that is either nearly free or quietly expensive. Here is the actual bill.
      </p>

      <h2>The bill</h2>
      <div className="cs-table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Service</th>
              <th scope="col">What it does</th>
              <th scope="col">A month</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Upstash Redis</td>
              <td>Every counter on the site: who&apos;s here, finished games, poll votes, the guestbook</td>
              <td>$15</td>
            </tr>
            <tr>
              <td>Vercel</td>
              <td>Hosting the site itself</td>
              <td>$20</td>
            </tr>
            <tr>
              <td>GitHub Actions</td>
              <td>Running the tests on every change, budgeted rather than spent to the cent</td>
              <td>$15</td>
            </tr>
            <tr>
              <th scope="row" colSpan={2}>
                Total
              </th>
              <td>
                <strong>$50</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>What it served</h2>
      <p>The 29 full days from 23 October to 20 November 2026, from the site&apos;s own stats page:</p>
      <ul>
        <li>
          <strong>About 380 visitors a day</strong>, between 285 and 575. A visitor is one browser on one day.
        </li>
        <li>
          <strong>About 210 a day were back from the day before.</strong> For a daily homepage, people coming back is the number that matters.
        </li>
        <li>
          <strong>8,186 browsers</strong> have visited since launch.
        </li>
      </ul>
      <p>
        Divide the bill by a month of visitors at that pace and it&apos;s <strong>under half a cent per visitor per day</strong>. Per regular, the people back
        from yesterday, it&apos;s under a cent.
      </p>

      <h2>Where it would grow</h2>
      <p>
        Vercel and the test budget are flat. Redis is the part that moves with traffic, and the README already says where: the &ldquo;who&apos;s here&rdquo;
        heartbeat, which lets you see and wave at other people on the page, is most of the Redis use. If the bill ever climbed, the first fix is one setting, a
        slower heartbeat, which halves it. I wrote more about that in{' '}
        <Link href="/case-studies/cheap-enough-to-give-away">Cheap enough to give away</Link>.
      </p>

      <h2>Who pays</h2>
      <p>
        I do. There&apos;s a &ldquo;Buy me a coffee&rdquo; link in the footer; over the last 30 days it was clicked 33 times. Whether those clicks became coffees
        shows up on Ko-fi, not on the site. $50 a month is a small enough number that the site doesn&apos;t need a business behind
        it, which is the point.
      </p>

      <h2>Live</h2>
      <p>The same numbers, refreshed from madtown.today twice a day:</p>
      <MadtownLedger />
    </Note>
  );
}
