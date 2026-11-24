import Link from 'next/link';
import { Note, noteMetadata } from '../_parts/Note';

const SLUG = 'three-tests-that-didnt-win';
export const metadata = noteMetadata(SLUG);
export const revalidate = 3600; // a scheduled note goes live within the hour of its day

const pct = (n: number, d: number) => `${Math.round((n / d) * 100)}%`;

export default function Page() {
  return (
    <Note slug={SLUG}>
      <p>
        madtown.today is a free homepage for Madison with daily puzzles, a question for the whole city and a few other small things. In October I wanted to know
        whether changing what a brand-new visitor sees first would bring more of them back. So I ran three A/B tests. None of them won.
      </p>

      <h2>How the tests worked</h2>
      <p>
        There are no accounts on madtown.today: each browser gets a random id on its first visit (more in{' '}
        <Link href="/case-studies/the-browser-is-the-account">The browser is the account</Link>). A brand-new browser landing on the homepage was put in one of two
        groups, 50/50, by a hash of that id, and stayed there. Group A got the normal homepage. Group B got a change. The main number was <strong>D1</strong>: the
        share who came back the next day.
      </p>

      <h2>1. Chair Stack only</h2>
      <p>Group B saw just one puzzle, Chair Stack, instead of the whole homepage. The idea: one obvious thing to do beats a page of choices.</p>
      <div className="cs-table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Group</th>
              <th scope="col">People</th>
              <th scope="col">Started a game</th>
              <th scope="col">Back next day</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>A · homepage</td>
              <td>313</td>
              <td>{pct(153, 313)}</td>
              <td>{pct(28, 313)}</td>
            </tr>
            <tr>
              <td>B · Chair Stack only</td>
              <td>274</td>
              <td>{pct(124, 274)}</td>
              <td>{pct(20, 274)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>Slightly worse on everything, so it ended. Fewer choices didn&apos;t mean more play.</p>

      <h2>2. The city&apos;s question first</h2>
      <p>
        Group B got the homepage with a bright &ldquo;Madison, weigh in&rdquo; card on top: that day&apos;s Madison Asks poll, the one thing on the site that&apos;s
        about the whole city at once.
      </p>
      <div className="cs-table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Group</th>
              <th scope="col">People</th>
              <th scope="col">Voted</th>
              <th scope="col">Back next day</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>A · homepage</td>
              <td>56</td>
              <td>{pct(4, 56)}</td>
              <td>{pct(2, 56)}</td>
            </tr>
            <tr>
              <td>B · Ask first</td>
              <td>68</td>
              <td>{pct(12, 68)}</td>
              <td>{pct(6, 68)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Back next day more than doubled. It also rested on six people against two. After one day it was replaced with a cleaner version of the same test, so it
        could run longer.
      </p>

      <h2>3. The city&apos;s question, run properly</h2>
      <div className="cs-table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Group</th>
              <th scope="col">People</th>
              <th scope="col">Voted</th>
              <th scope="col">Back next day</th>
              <th scope="col">Back a week later</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>A · homepage</td>
              <td>425</td>
              <td>{pct(45, 425)}</td>
              <td>{pct(18, 425)}</td>
              <td>{pct(12, 425)}</td>
            </tr>
            <tr>
              <td>B · Ask on top</td>
              <td>415</td>
              <td>{pct(99, 415)}</td>
              <td>{pct(15, 415)}</td>
              <td>{pct(4, 415)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        With seven times as many people, the next-day lift was gone. The card did exactly what a card on top does: more than twice as many people voted. It just
        didn&apos;t bring them back.
      </p>

      <h2>What I took from it</h2>
      <ul>
        <li>
          <strong>A small site can still test.</strong> A few hundred new visitors per group is enough to rule out a big effect, not to find a small
          one.
        </li>
        <li>
          <strong>Watch the early win.</strong> Six people against two looked like a doubling. It was noise.
        </li>
        <li>
          <strong>Clicks aren&apos;t the goal.</strong> Putting something on top gets it clicked. Whether people come back is a different question, and the one
          that matters for a homepage.
        </li>
        <li>
          <strong>Write down the losers.</strong> The stats page keeps every ended test, with its numbers and &ldquo;no win&rdquo; beside it. A
          test that lost is still something I know now.
        </li>
      </ul>
      <p>
        Numbers are from madtown.today&apos;s own stats page, as of 21 November 2026. Counts are per browser, so cleared cookies and switched devices blur them a
        little.
      </p>
    </Note>
  );
}
