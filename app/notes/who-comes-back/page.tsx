import Link from 'next/link';
import { Note, noteMetadata } from '../_parts/Note';

const SLUG = 'who-comes-back';
export const metadata = noteMetadata(SLUG);
export const revalidate = 3600; // a scheduled note goes live within the hour of its day

const pct = (n: number, d: number) => `${Math.round((n / d) * 100)}%`;
const fmt = (n: number) => n.toLocaleString('en-US');

// All from madtown.today's /admin/stats, copied 21 November 2026, 11:01 PM Madison time.
// Regulars: browsers on 3+ of the 7 days ending that day.
const REGULARS = [
  { day: 'Sat 24 Oct', week: 1573, regulars: 294 },
  { day: 'Thu 5 Nov', week: 1394, regulars: 303 },
  { day: 'Fri 13 Nov', week: 990, regulars: 331 },
  { day: 'Sat 21 Nov', week: 898, regulars: 319 },
];
// New browsers since 2 Oct, by what they did on their first day.
const FIRST_DAY = [
  { group: 'Played nothing', n: 3519, d1: [96, 3462], d7: [28, 3330] },
  { group: 'Played 1 or 2 games', n: 2451, d1: [232, 2403], d7: [105, 2233] },
  { group: 'Played all 3', n: 968, d1: [248, 955], d7: [135, 900] },
] as const;
const NEW_BROWSERS = FIRST_DAY.reduce((s, r) => s + r.n, 0);
// Back the next day, by how a game ended (28 days, 23 Oct to 19 Nov).
const ENDINGS = [
  { game: 'Four Lakes', result: 'Won', n: 3750, back: 2706 },
  { game: 'Four Lakes', result: 'Lost', n: 1505, back: 1058 },
  { game: 'Madtown Word', result: 'Won', n: 4113, back: 3028 },
  { game: 'Madtown Word', result: 'Lost', n: 269, back: 177 },
  { game: 'Chair Stack', result: 'Solved', n: 7249, back: 5095 },
  { game: 'Chair Stack', result: 'Started, never solved', n: 717, back: 269 },
];

export default function Page() {
  return (
    <Note slug={SLUG} kind="note">
      <p>
        madtown.today has had {fmt(8195)} visitors since launch. That number is the one people ask about, and it&apos;s the one I watch
        least. A homepage is only worth anything if people come back to it, so most of the stats page is about who returns, and what they did the day before. Three
        things in it changed how I think about the site.
      </p>

      <h2>1. Spikes come and go. The regulars stay put.</h2>
      <p>
        I count a regular as a browser that visited on 3 or more of the last 7 days. Over the last month, every spike from a Reddit post came and went,
        and the regulars hardly moved:
      </p>
      <div className="cs-table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Week ending</th>
              <th scope="col">Browsers that week</th>
              <th scope="col">Regulars</th>
              <th scope="col">Share</th>
            </tr>
          </thead>
          <tbody>
            {REGULARS.map((r) => (
              <tr key={r.day}>
                <td>{r.day}</td>
                <td>{fmt(r.week)}</td>
                <td>{fmt(r.regulars)}</td>
                <td>{pct(r.regulars, r.week)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        The share of regulars doubled. I&apos;d love to say that&apos;s because the site got better at keeping people, but it&apos;s mostly arithmetic: the spike
        visitors left and the same 300 or so stayed. Two numbers describe madtown.today better than visitors a day: about 300 people who use it like a habit, and a
        lot of passers-by. The question that matters is how to turn a few more passers-by into the first group.
      </p>

      <h2>2. The first day decides almost everything</h2>
      <p>
        I split every new browser since 2 October by what it did on its first day, and how many came back the next day (D1) and a week later (D7):
      </p>
      <div className="cs-table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">First day</th>
              <th scope="col">New browsers</th>
              <th scope="col">Back next day</th>
              <th scope="col">Back a week later</th>
            </tr>
          </thead>
          <tbody>
            {FIRST_DAY.map((r) => (
              <tr key={r.group}>
                <td>{r.group}</td>
                <td>
                  {fmt(r.n)} ({pct(r.n, NEW_BROWSERS)})
                </td>
                <td>{pct(r.d1[0], r.d1[1])}</td>
                <td>{pct(r.d7[0], r.d7[1])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        Half of new visitors look and leave without playing anything, and almost none of them come back. People who play all three puzzles on day one come back
        about nine times as often. That&apos;s correlation, not cause: someone who plays all three may just be the kind of person who&apos;d come back anyway. I tried
        to find out with three A/B tests that changed what a new visitor sees first, and none of them moved next-day returns. That story is in{' '}
        <Link href="/notes/three-tests-that-didnt-win">Three tests on madtown.today that didn&apos;t win</Link>.
      </p>
      <p>
        Still, it tells me where to point the work. The first screen, the first puzzle and the moment right after it count for more than any new feature further down
        the page.
      </p>

      <h2>3. Losing is fine. Getting stuck isn&apos;t.</h2>
      <p>The most useful table on the stats page shows how many people came back the day after each kind of ending:</p>
      <div className="cs-table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Game</th>
              <th scope="col">How it ended</th>
              <th scope="col">People</th>
              <th scope="col">Back next day</th>
            </tr>
          </thead>
          <tbody>
            {ENDINGS.map((r) => (
              <tr key={r.game + r.result}>
                <td>{r.game}</td>
                <td>{r.result}</td>
                <td>{fmt(r.n)}</td>
                <td>{pct(r.back, r.n)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        Losing Four Lakes barely matters: 70% back after a loss, 72% after a win. A loss is still an ending. You see the answers, you get your result to share, and
        tomorrow is a new puzzle. Chair Stack can&apos;t be lost, only abandoned, and people who start a board and never finish come back at about half the rate.
        Again, correlation. But it lines up with what anyone who has rage-quit a puzzle knows: being stuck feels worse than losing.
      </p>
      <p>That is why Chair Stack works the way it does now:</p>
      <ul>
        <li>
          <strong>Boards are picked for a solve rate, not dealt at random.</strong> Each day&apos;s board is scored by simulating a few hundred players, and only
          boards that about 80 to 90% of them would solve get used.
        </li>
        <li>
          <strong>Hard days can get a hint.</strong> If a coming day&apos;s board looks too hard, I can deal it a new one or give it a Hint button before it goes live.
        </li>
        <li>
          <strong>The prediction gets checked.</strong> Each day&apos;s predicted solve rate sits next to the real one, so the model gets corrected by what people
          actually did.
        </li>
      </ul>

      <h2>What I take from it</h2>
      <ul>
        <li>
          <strong>Count the regulars, not the visitors.</strong> A launch spike looks great on a chart and leaves very little behind.
        </li>
        <li>
          <strong>Design every game to end.</strong> A win and a loss both bring people back. An unfinished game doesn&apos;t.
        </li>
        <li>
          <strong>Measure correlations, then test them.</strong> The stats point at where to look. Only a test says whether a change works, and so far mine have
          mostly said no.
        </li>
        <li>
          <strong>None of this needs accounts.</strong> Every number here comes from a random id in each browser and counts kept on the server. There are no names,
          emails or ad trackers. More in <Link href="/case-studies/the-browser-is-the-account">The browser is the account</Link>.
        </li>
      </ul>
      <p>
        Numbers are from madtown.today&apos;s own stats page, as of 21 November 2026. Counts are per browser, so cleared cookies and switched devices make some
        regulars look like newcomers.
      </p>
    </Note>
  );
}
