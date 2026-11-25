import Link from 'next/link';
import { Code } from '../_shared/Code';
import { AfterDiagram, BeforeDiagram, NamespaceDiagram } from '../_shared/Diagrams';
import { Essay, essayMetadata, Src } from '../_shared/Essay';
import MadtownLedger from '../_shared/MadtownLedger';
import RoomsDemo from '../_shared/RoomsDemo';
import SyncDemo from '../_shared/SyncDemo';

const SLUG = 'cheap-enough-to-give-away';
const dek =
  'Free software is only free if someone can afford to keep it running. The question that decides it isn’t how many people use it, but what an idle user and an idle group cost. Here is how Dungeon Garden was rebuilt around that question, and where madtown.today’s bill comes from.';

export const metadata = essayMetadata(SLUG, dek);
const IMG = '/case-studies/candlefair';

// madtown.today's live counts (MadtownLedger) are fetched at most twice a day.
export const revalidate = 43200;

export default function Page() {
  return (
    <Essay
      slug={SLUG}
      dek={dek}
      about={[
        { name: 'Dungeon Garden', url: 'https://dnd.calebs.garden' },
        { name: 'madtown.today', url: 'https://madtown.today' },
      ]}
      inShort={
        <>
          <p>
            To give software away, make the bill grow with what people <em>do</em>, not with how long they keep it open. Dungeon Garden&apos;s first online version kept
            a server function running for every open screen. Within a day it was rebuilt so each D&amp;D group gets its own tiny Cloudflare Durable Object, which
            can sleep between moves and sends updates for free.
          </p>
          <p>
            madtown.today shows the other side: its README said the bill was almost all a &ldquo;who&apos;s here&rdquo; heartbeat, and the real bill said otherwise.
            Knowing which feature costs what only helps if you check it against the invoice.
          </p>
        </>
      }
    >
      <h2>The first version couldn&apos;t be given away</h2>
      <p>
        Dungeon Garden runs a game of D&amp;D across a few screens: a TV view everyone watches (a TV in the room, or a screen shared on a Discord call), each
        player&apos;s phone, and the DM&apos;s console. Change something on one and the others update.
      </p>
      <figure>
        <img src={`${IMG}/tv-map.jpg`} width={2000} height={1125} alt="The Dungeon Garden TV view: a town map of Marrowmere with numbered places, the party's tokens and a party purse in the corner" loading="lazy" />
        <figcaption>The TV view, showing the built-in example campaign. Screenshots come from a throwaway test campaign.</figcaption>
      </figure>
      <p>
        The first version online was a Next.js app on Vercel with Upstash Redis, which is the stack I knew. It worked, and it was built for one game: a single DM
        key for the whole site. A couple of hours after it was merged, I asked:
      </p>
      <blockquote>
        how could I make this not use redis and rather use the DMs machine as the node to offload 100% of the server cost to the client? Then I could just give this
        away to people / the public
        <footer>
          <Src kind="record" /> My message, 13 November 2026, 07:22 UTC. Spelling as typed.
        </footer>
      </blockquote>

      <h2>The shape of a bill</h2>
      <p>
        I can&apos;t show a before-and-after bill. The first version was online for about ten hours with no real groups on it. What I can show is how each version
        turns one click into work someone charges for. Take seven screens (the DM, the TV and five phones) and a DM who pays the party:
      </p>
      <div className="cs-compare">
        <section>
          <h3>Before: Next.js on Vercel, Redis</h3>
          <ol>
            <li>The click runs one server function, which reads the game from Redis, saves it and announces a new version.</li>
            <li>Seven screens hear it, and each runs another function to fetch its own view, reading Redis again.</li>
            <li>
              Meanwhile, every open screen holds a server function open (restarted every 270 seconds) for as long as it&apos;s on. A four-hour session is a lot of
              function time.
            </li>
          </ol>
        </section>
        <section>
          <h3>After: one room per group</h3>
          <ol>
            <li>The click is one request, passed to that group&apos;s room.</li>
            <li>The room saves to its own small SQLite database.</li>
            <li>It sends seven messages over the screens&apos; open WebSockets. Cloudflare doesn&apos;t charge for those.</li>
            <li>Between clicks the room can sleep, and the screens&apos; keep-alive pings don&apos;t wake it.</li>
          </ol>
        </section>
      </div>
      <p>
        The first shape costs more the longer screens stay open. The second costs more only when someone does something. A game runs for hours and changes
        something every few seconds at most, so only the second can stay free.
      </p>
      <div className="cs-diagrams">
        <BeforeDiagram />
        <AfterDiagram />
      </div>

      <h2>Three options, one morning</h2>
      <div className="cs-table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Option</th>
              <th scope="col">The appeal</th>
              <th scope="col">The catch</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Run it on the DM&apos;s laptop, on the local network</td>
              <td>No server bill at all.</td>
              <td>Only works for phones on the same Wi-Fi. A remote player gets nothing.</td>
            </tr>
            <tr>
              <td>Peer-to-peer (WebRTC) from the DM&apos;s browser</td>
              <td>Also close to no server.</td>
              <td>The DM&apos;s tab becomes the server: close it and the game goes dark. Still needs relay servers for some phones. Rated the hardest.</td>
            </tr>
            <tr>
              <td>A tiny server per group (Cloudflare Durable Objects)</td>
              <td>Works from anywhere, and an idle group costs next to nothing.</td>
              <td>Not literally free, and it meant leaving Next.js. If it worked, I didn&apos;t mind what it ran on. Chosen, and merged that morning.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Cost wasn&apos;t the only reason to move. My Vercel account is paid for through madtown.today, and I wanted Dungeon Garden&apos;s hosting to stand on its own.
      </p>

      <h2>One room per group</h2>
      <p>
        A Durable Object is a small server Cloudflare keeps for a name you give it, with its own storage. Cloudflare runs at most one copy of a given one at a time,
        so every screen in a game talks to the same copy. Dungeon Garden calls each one a <em>room</em>, and the campaign code is its name. There&apos;s no central
        database to look up first, and no shared table where one group&apos;s data sits next to another&apos;s.
      </p>
      <Code file="worker/index.ts" at="Dungeon Garden f8de4ba">{`
function room(env: Env, game: string) {
  return env.ROOMS.get(env.ROOMS.idFromName(game));
}
`}</Code>
      <NamespaceDiagram />
      <p>
        Three details keep rooms cheap to leave lying around. A room only creates its storage on the first real save, so a mistyped or guessed code leaves nothing
        behind. A campaign nobody has touched for 180 days deletes itself and its images. And a DM&apos;s practice copy lives in a separate room, so rehearsing never
        touches the real game.
      </p>
      <RoomsDemo />

      <h2>Cheap, and still in step</h2>
      <p>
        After every change, the room sends each screen the whole picture it&apos;s allowed to see: the DM sees everything, the TV sees what&apos;s on the TV, and a
        player sees their own gold and not their friend&apos;s secrets. Sending the whole picture instead of a list of changes costs a few more bytes, but a phone
        that slept through three changes only needs the next one. Since outgoing messages are free, the extra bytes don&apos;t cost anything.
      </p>
      <SyncDemo />
      <p>
        Phones lock and drop Wi-Fi, so each screen checks in every 25 seconds and replaces a connection it hasn&apos;t heard from in 75. Those check-ins are answered
        without waking the room:
      </p>
      <Code file="worker/room.ts" at="Dungeon Garden f8de4ba">{`
// Keep-alive pings from the browser are answered without waking the room.
ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
`}</Code>
      <details className="cs-simplifies">
        <summary>How a save and an update look in the code</summary>
        <Code file="worker/room.ts" at="Dungeon Garden f8de4ba" note="trimmed">{`
async commit(game: string, expected: number, state: GameState, ledger: LedgerEntry[]) {
  const d = this.load();
  if (d.version !== expected) return null; // someone saved first: the caller retries
  // …
  this.ctx.storage.transactionSync(() => {
    this.save(game, next);
    for (const e of entries) this.sql.exec("INSERT INTO ledger (entry) VALUES (?)", JSON.stringify(e));
  });
  // …
}

/** The game changed: push every open screen its own view. Outgoing messages are free. */
async publish(_game: string, _version: number) {
  for (const ws of this.ctx.getWebSockets()) await this.push(ws);
}
`}</Code>
      </details>

      <h2>madtown.today: knowing where the bill comes from</h2>
      <p>
        madtown.today still runs on Next.js, Vercel and Upstash Redis, and that&apos;s fine for it: it&apos;s a homepage people check in on, not a game they
        keep open for hours. What matters is knowing which feature costs what. Its README spells it out:
      </p>
      <blockquote>
        Presence is almost all of it: 4 commands per heartbeat, so about 8 commands per visitor per minute while their tab is visible … Finishing a game costs about
        10.
        <footer>
          <Src kind="record" /> madtown.today README, &ldquo;Redis cost&rdquo;
        </footer>
      </blockquote>
      <p>
        The &ldquo;who&apos;s here&rdquo; card, where you can see and wave at other people on the page, is the expensive part, not the puzzles. The README works
        through two cases: a launch spike of 200 people for three hours comes to about 290,000 commands, and a steady 20 people around the clock for a month to
        about 6.9 million. Its advice if that gets tight is one setting: send the heartbeat every 60 seconds instead of 30, which halves the cost and only makes the
        online count update more slowly.
      </p>
      <p>
        That README note turned out to be out of date. When I read the real bill, the heartbeat was a small part of it. The rest, and the plan to fix it, is in{' '}
        <Link href="/notes/what-madtown-today-actually-costs">What madtown.today actually costs</Link>.
      </p>
      <p>
        The rest leans on free things used gently. The weather comes from Open-Meteo, free for non-commercial use, fetched at most once every 10 minutes for
        everyone, and your game history stays in your own browser, which costs nothing.
      </p>
      <p>
        Put together, here is what madtown.today costs to run. It publishes its own counts, so the numbers beside it are real:
      </p>
      <MadtownLedger />

      <h2>The prices, as published</h2>
      <p>Checked on 21 November 2026. They&apos;ll change.</p>
      <div className="cs-table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Service</th>
              <th scope="col">Free plan</th>
              <th scope="col">Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <a href="https://developers.cloudflare.com/workers/platform/pricing/">Cloudflare Workers</a>
              </td>
              <td>100,000 requests a day</td>
              <td>Paid plan: $5 a month, 10 million requests included.</td>
            </tr>
            <tr>
              <td>
                <a href="https://developers.cloudflare.com/durable-objects/platform/pricing/">Durable Objects</a> (SQLite)
              </td>
              <td>100,000 requests a day; 5 million rows read and 100,000 rows written a day; 5 GB stored</td>
              <td>Outgoing WebSocket messages aren&apos;t billed; incoming ones count as one request per 20. A sleeping object isn&apos;t billed for time.</td>
            </tr>
            <tr>
              <td>
                <a href="https://upstash.com/pricing/redis">Upstash Redis</a>
              </td>
              <td>500,000 commands a month</td>
              <td>Changed on 12 March 2025. Before that, the free plan was 10,000 commands a day.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        I&apos;m not putting a number on how many groups fit in Dungeon Garden&apos;s free plan. That depends on how people play, and I&apos;d rather measure it than
        guess. The DM console has a Hosting costs box that counts what each campaign actually uses, so that number will come from real games.
      </p>

      <h2>What I&apos;d tell someone trying this</h2>
      <ul>
        <li>Work out what an idle user costs before you work out what a busy one costs. For giveaway software, idle is most of the time.</li>
        <li>Prefer designs where the bill follows actions, not open tabs.</li>
        <li>Write down which feature costs what, like madtown.today&apos;s README does, so the cheap fix is obvious when you need it.</li>
        <li>Don&apos;t quote capacity you haven&apos;t measured. Build the meter first.</li>
      </ul>

      <h2>How it was built</h2>
      <p>
        I didn&apos;t type most of Dungeon Garden&apos;s code. Every code commit in its repository was written by Claude Code, working from my direction. My part was
        deciding what it should be and what it shouldn&apos;t: the product, every feature, the calls in this piece, having my own site attacked to find holes, and
        merging each change. The Redis version went up on the evening of 12 November 2026 (US Central), the room-per-group version the next morning.
      </p>
    </Essay>
  );
}
