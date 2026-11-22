import type { Metadata } from 'next';
import Link from 'next/link';
import './case-study.css';
import { Code } from './_parts/Code';
import { AfterDiagram, BeforeDiagram, NamespaceDiagram } from './_parts/Diagrams';
import RoomsDemo from './_parts/RoomsDemo';
import SyncDemo from './_parts/SyncDemo';

const title = 'Software for one table';
const description =
  'Candlefair is a free companion for D&D played in person. It is built for the people at one table, not for scale, and this is what it takes to make software like that cheap enough to give away.';
const url = '/case-studies/candlefair';
const IMG = '/case-studies/candlefair';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url },
  openGraph: {
    type: 'article',
    title,
    description,
    url,
    images: [{ url: `${IMG}/og.jpg`, width: 1200, height: 630, alt: 'Candlefair on a table TV: a town map with the party tokens on it' }],
  },
  twitter: { card: 'summary_large_image', title, description, images: [`${IMG}/og.jpg`] },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: title,
  description,
  image: `https://calebs.garden${IMG}/og.jpg`,
  author: { '@type': 'Person', name: 'Caleb', url: 'https://calebs.garden' },
  about: { '@type': 'SoftwareApplication', name: 'Candlefair', url: 'https://dnd.calebs.garden', applicationCategory: 'GameApplication' },
  mainEntityOfPage: `https://calebs.garden${url}`,
};

const chapters = [
  ['table', 'A night at the table'],
  ['who', 'Who it’s for'],
  ['free', 'Free, on purpose'],
  ['cost', 'What free costs'],
  ['rooms', 'One room per table'],
  ['care', 'Small, not sloppy'],
  ['now', 'Where it is now'],
  ['built', 'How it was built'],
] as const;

function Src({ kind }: { kind: 'record' | 'memory' | 'code' }) {
  const label = { record: 'On record', memory: 'From memory', code: 'In the code' }[kind];
  return <span className={`cs-source is-${kind}`}>{label}</span>;
}

type Milestone = {
  when: string;
  title: string;
  kind?: 'turn' | 'memory';
  before: string;
  after: string;
  how: React.ReactNode;
  evidence: React.ReactNode;
};

const milestones: Milestone[] = [
  {
    when: 'Before the repository',
    title: 'A map builder, then a bank',
    kind: 'memory',
    before: 'Playing on D&D Beyond, with maps I had made in a Claude artifact.',
    after: 'A small app of my own for the party’s money, which kept growing.',
    how: 'This version is not in the repository, so I can’t show its code.',
    evidence: (
      <>
        <Src kind="memory" /> My account. The first commit in the repository calls itself “at parity with the prototype”, so a prototype existed, but its history isn’t kept.
      </>
    ),
  },
  {
    when: '12 Nov 2026, evening (US Central)',
    title: 'Milestone 1: TV, DM and phones on Vercel',
    before: 'The prototype.',
    after: 'A Next.js 16 app on Vercel. Game state in Upstash Redis, live updates over server-sent events, one DM key for the whole site.',
    how: (
      <>
        Commits <code>ee6fb01</code>, <code>8dabf57</code>, merged as pull request #1.
      </>
    ),
    evidence: <Src kind="record" />,
  },
  {
    when: '13 Nov, 07:22 UTC',
    title: 'The question that changed the design',
    kind: 'turn',
    before: 'An app for my table.',
    after: 'A plan to give it away, which meant every campaign needed its own key and its own storage.',
    how: 'Three ways were weighed: a LAN-only app on the DM’s laptop, WebRTC from the DM’s browser, and Cloudflare Durable Objects.',
    evidence: (
      <>
        <Src kind="record" /> My message in the project thread, quoted below.
      </>
    ),
  },
  {
    when: '13 Nov, 15:37 UTC',
    title: 'Hosting moves to Cloudflare: one room per campaign',
    kind: 'turn',
    before: 'Next.js functions, Redis keys, one DM key.',
    after: 'A Vite build served by a Worker. A Durable Object per campaign code with SQLite storage and WebSockets. R2 for images. A DM key made for each campaign.',
    how: (
      <>
        Commit <code>9c66777</code>, pull request #17. The Redis version had been on main for about ten hours.
      </>
    ),
    evidence: <Src kind="record" />,
  },
  {
    when: '14 Nov',
    title: 'Hardened against bots and guessing',
    before: 'Anyone could hammer the API or try codes.',
    after: 'Limits per address on every call, an address shut out after 20 misses a minute, made-up codes that no longer leave a room behind, and size caps on requests and saved games.',
    how: (
      <>
        Commit <code>f40d14f</code>, pull request #28.
      </>
    ),
    evidence: <Src kind="record" />,
  },
  {
    when: '14 Nov',
    title: 'Tokens and fog of war on the map',
    before: 'Maps were pictures.',
    after: 'Tokens the DM and players can move, fog the DM reveals, and the live map on phones.',
    how: (
      <>
        Commits <code>018a60a</code>, <code>3088e59</code>, pull request #45.
      </>
    ),
    evidence: <Src kind="record" />,
  },
  {
    when: '15 Nov',
    title: 'Safety snapshots and backups with images',
    before: 'A bad import or a mistake could wipe a campaign.',
    after: 'A snapshot before risky changes, and zip backups that carry the images.',
    how: (
      <>
        Commit <code>761ec9a</code>, pull request #66.
      </>
    ),
    evidence: <Src kind="record" />,
  },
  {
    when: '15 Nov',
    title: 'Five holes from a deliberate attack on my own site',
    before: 'Knowing a player’s name and the code was enough to act as them.',
    after: 'A name locks to the first device’s key, other devices sign in with a copied link, and picked codes need 8 or more characters.',
    how: (
      <>
        Commit <code>85197ba</code>, pull request #78.
      </>
    ),
    evidence: <Src kind="record" />,
  },
  {
    when: '15 Nov',
    title: 'Practice mode',
    before: 'Rehearsing a session meant touching the real campaign.',
    after: 'A private copy in its own room, named so no code can reach it.',
    how: (
      <>
        Commit <code>fe7aac6</code>, pull request #83.
      </>
    ),
    evidence: <Src kind="record" />,
  },
  {
    when: '18 Nov',
    title: 'A registry of campaigns',
    before: 'Rooms knew nothing about each other, so I couldn’t see what was out there.',
    after: 'One separate object that lists campaigns for a read-only admin page.',
    how: (
      <>
        Commit <code>88299eb</code>, pull request #134.
      </>
    ),
    evidence: <Src kind="record" />,
  },
];

export default function CandlefairCaseStudy() {
  return (
    <main className="cs">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <p className="back">
        <Link href="/case-studies">← Case studies</Link>
      </p>

      <header className="cs-head">
        <p className="cs-kicker">Case study · Candlefair</p>
        <h1>{title}</h1>
        <p className="cs-dek">
          Candlefair is a free companion for D&amp;D played in person. It isn&apos;t built to reach millions of people. It&apos;s built for the few people sitting around
          my table, and for any other table that wants it. This is what it takes to make software like that cheap enough to give away.
        </p>
        <dl className="cs-facts">
          <div>
            <dt>Live at</dt>
            <dd>
              <a href="https://dnd.calebs.garden">dnd.calebs.garden</a>
            </dd>
          </div>
          <div>
            <dt>Costs players</dt>
            <dd>Nothing. No accounts, no app to install.</dd>
          </div>
          <div>
            <dt>Runs on</dt>
            <dd>Cloudflare Workers and Durable Objects</dd>
          </div>
          <div>
            <dt>Built</dt>
            <dd>November 2026</dd>
          </div>
        </dl>
        <figure className="cs-hero">
          <img src={`${IMG}/tv-map.jpg`} width={2000} height={1125} alt="The table TV view: a town map of Marrowmere with numbered places, the party's tokens and a party purse in the corner" />
          <figcaption>The TV view, showing the built-in example campaign, Marrowmere. Screenshots on this page come from a throwaway test campaign, not a real table.</figcaption>
        </figure>
      </header>

      <div className="cs-body">
        <nav className="cs-toc" aria-label="Chapters">
          <p>Chapters</p>
          <ol>
            {chapters.map(([id, name]) => (
              <li key={id}>
                <a href={`#${id}`}>{name}</a>
              </li>
            ))}
          </ol>
        </nav>

        <article>
          {/* ------------------------------------------------------------ 1 */}
          <section className="cs-chapter" id="table" aria-labelledby="table-h">
            <header>
              <p className="cs-num">Chapter 1</p>
              <h2 id="table-h">A night at the table</h2>
            </header>
            <p>
              Picture a living room. There&apos;s a TV at one end showing a map of the town, with everyone&apos;s token on it. Each player has their phone: their gold,
              their character sheet, the shop, their dice. I have a laptop with the DM console, where I pay the party, run fights, decide what goes on the TV and keep
              my notes.
            </p>
            <p>
              When I pay everyone 25 gold, every phone and the TV change at once. When a player buys a sword from the shop, I get the request and approve it. When the
              party finds a new place, it appears on their phones and stays there, so in three months someone can still look up who ran the ferry.
            </p>
            <p>
              It doesn&apos;t replace the table. There&apos;s no video chat and no drawing tools. Everyone is in the same room; Candlefair is the bookkeeping, the map
              and the memory, sitting next to the dice.
            </p>
            <figure>
              <img src={`${IMG}/dm.jpg`} width={2000} height={1250} alt="The DM console: a sidebar of pages, a first-night checklist, the Bank with pay buttons for each player, and a small copy of what is on the TV" loading="lazy" />
              <figcaption>The DM console on a laptop. The right-hand column is a live copy of the TV.</figcaption>
            </figure>
          </section>

          {/* ------------------------------------------------------------ 2 */}
          <section className="cs-chapter" id="who" aria-labelledby="who-h">
            <header>
              <p className="cs-num">Chapter 2</p>
              <h2 id="who-h">Who it&apos;s for</h2>
            </header>
            <p>I built Candlefair around two people: the player I was, and the DM I&apos;m about to be.</p>
            <h3>The player</h3>
            <p>
              As a player, the parts of D&amp;D that wore me down weren&apos;t the dice or the story. They were the bookkeeping: who has how much gold, what we were
              carrying, what that merchant said four sessions ago. Candlefair takes that off paper and puts it on the phone already in your hand, and makes some of it
              a little more fun: a party purse on the TV, job flyers, renown that goes up when the party does something worth talking about.
            </p>
            <h3>The DM</h3>
            <p>
              I&apos;m not a natural storyteller with a perfect memory. Remembering what happened six sessions or six months ago is hard, and it&apos;s harder when more
              than one group plays in the same world. That&apos;s the plan: my best friend can play about once a month, so several groups share one world and one
              storyline. Candlefair keeps track of what each group has found, what they were paid and what they still owe.
            </p>
            <h3>The table that isn&apos;t mine</h3>
            <p>
              If it works for my table, it should work for anyone&apos;s, without asking them to pay, sign up, or install anything. That last part is what shaped most of
              the engineering.
            </p>
          </section>

          {/* ------------------------------------------------------------ 3 */}
          <section className="cs-chapter" id="free" aria-labelledby="free-h">
            <header>
              <p className="cs-num">Chapter 3</p>
              <h2 id="free-h">Free, on purpose</h2>
            </header>
            <p>
              Most of what I build follows one idea: make free, or nearly free, software that people actually want and will use. madtown.today, a daily homepage for
              Madison with no ad networks, is one example. Candlefair is another.
            </p>
            <p>
              That idea comes with a trade most software doesn&apos;t make. Candlefair isn&apos;t trying to be a platform, and it isn&apos;t built for a scale it
              hasn&apos;t reached. A table is a handful of people in one room for a few hours at a time. The goal isn&apos;t to serve a million of them at once; it&apos;s to
              make each one cost so little that I never have to charge for it.
            </p>
            <p>The first version that went online didn&apos;t meet that bar. A couple of hours after it was merged, I asked:</p>
            <blockquote>
              how could I make this not use redis and rather use the DMs machine as the node to offload 100% of the server cost to the client? Then I could just give
              this away to people / the public
              <footer>
                <Src kind="record" /> My message, 13 November 2026, 07:22 UTC. Spelling as typed.
              </footer>
            </blockquote>
            <p>Giving it away meant three things had to be true:</p>
            <ul>
              <li>A table nobody is using should cost close to nothing, because most tables are idle most of the week.</li>
              <li>Every table is its own world. One group&apos;s busy night can&apos;t slow down another&apos;s, and one table never sees another&apos;s data.</li>
              <li>No accounts. A DM starts a campaign and sends a link; players open it on their phones.</li>
            </ul>
            <p>Three ways to get there were weighed that morning.</p>
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
                    <td>Only works for phones on the same Wi-Fi. A link texted to a player at home goes nowhere.</td>
                  </tr>
                  <tr>
                    <td>Peer-to-peer (WebRTC) from the DM&apos;s browser</td>
                    <td>Also close to no server.</td>
                    <td>The DM&apos;s tab becomes the server: close it and the table goes dark. It still needs relay servers for some phones. Rated the hardest of the three.</td>
                  </tr>
                  <tr>
                    <td>A tiny server per table (Cloudflare Durable Objects)</td>
                    <td>Works from anywhere, and an idle table costs next to nothing.</td>
                    <td>Not literally free, and it meant leaving Next.js. I said that if it worked, I didn&apos;t mind what it ran on. Chosen.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              The cost wasn&apos;t the only reason. My Vercel account is paid for through madtown.today, and I wanted Candlefair&apos;s hosting to stand on its own. The
              move was merged that afternoon.
            </p>
          </section>

          {/* ------------------------------------------------------------ 4 */}
          <section className="cs-chapter" id="cost" aria-labelledby="cost-h">
            <header>
              <p className="cs-num">Chapter 4</p>
              <h2 id="cost-h">What free costs</h2>
            </header>
            <p>
              I can&apos;t show you a before-and-after bill. The first version was online for about ten hours, with no real campaigns on it. What I can show is the shape
              of the bill: how each version turns one click at the table into work someone charges for.
            </p>
            <p>Take a table with seven screens open (a DM laptop, a TV and five phones) and a DM who pays the party:</p>
            <div className="cs-compare">
              <section>
                <h3>Before: Next.js on Vercel, Redis</h3>
                <span className="cs-when">the first version online</span>
                <ol>
                  <li>The DM&apos;s click runs one server function, which reads the game from Redis, saves it and announces a new version.</li>
                  <li>Seven screens hear the announcement, and each runs another function to fetch its own view, which reads Redis again.</li>
                  <li>
                    Meanwhile, every open screen is holding a server function open, restarted every 270 seconds, for as long as the screen is on. A four-hour session
                    is a lot of function time.
                  </li>
                </ol>
              </section>
              <section>
                <h3>After: a room per table</h3>
                <span className="cs-when">Cloudflare Worker and Durable Object</span>
                <ol>
                  <li>The DM&apos;s click is one request, passed to that table&apos;s room.</li>
                  <li>The room saves to its own small database.</li>
                  <li>The room sends seven messages over the screens&apos; open connections. Cloudflare doesn&apos;t charge for those.</li>
                  <li>Between clicks the room can go to sleep, and the screens&apos; &ldquo;still there?&rdquo; pings don&apos;t wake it.</li>
                </ol>
              </section>
            </div>
            <p>
              The first shape costs more the longer screens stay open. The second costs more only when people actually do something. A table is open for hours and
              changes something every few seconds at most, so for a tool like this the second shape is the one that can stay free.
            </p>
            <div className="cs-diagrams">
              <BeforeDiagram />
              <AfterDiagram />
            </div>
            <p>The published prices I checked on 21 November 2026:</p>
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
              I&apos;m not putting a number on how many tables fit in the free plan. That depends on how people play, and I&apos;d rather measure it than guess. The DM
              console has a Hosting costs box that counts what each campaign actually uses, so that number will come from real tables.
            </p>
          </section>

          {/* ------------------------------------------------------------ 5 */}
          <section className="cs-chapter" id="rooms" aria-labelledby="rooms-h">
            <header>
              <p className="cs-num">Chapter 5</p>
              <h2 id="rooms-h">One room per table</h2>
            </header>
            <p>
              A Durable Object is a small server that Cloudflare keeps for a name you give it, with its own storage. Cloudflare runs at most one copy of a given one at a
              time, so every screen at a table talks to the same copy of the game. Candlefair calls each one a <em>room</em>, and every campaign code gets its own.
            </p>
            <p>
              The code <em>is</em> the address. There&apos;s no central database of campaigns to look up first, and no shared table where one group&apos;s data sits next
              to another&apos;s. The front door just turns the code into a room:
            </p>
            <Code file="worker/index.ts" at="f8de4ba">{`
function room(env: Env, game: string) {
  return env.ROOMS.get(env.ROOMS.idFromName(game));
}
`}</Code>
            <NamespaceDiagram />
            <p>
              A few details keep rooms cheap to leave lying around. A room only creates its storage on the first real save, so a mistyped or guessed code leaves nothing
              behind. A campaign nobody has touched for 180 days deletes itself and its images. And a DM who wants to rehearse gets a private copy in a separate room,
              so practice can never touch the real game.
            </p>
            <RoomsDemo />
          </section>

          {/* ------------------------------------------------------------ 6 */}
          <section className="cs-chapter" id="care" aria-labelledby="care-h">
            <header>
              <p className="cs-num">Chapter 6</p>
              <h2 id="care-h">Small, not sloppy</h2>
            </header>
            <p>
              Small and free doesn&apos;t get a pass on the things people notice. If a phone shows the wrong gold, or a player can act as someone else, nobody at the
              table cares how cheap it was to run. These are the parts that took the most care.
            </p>

            <h3>Every screen agrees</h3>
            <p>
              Each screen keeps one live connection to its table&apos;s room. After every change, the room sends each screen the whole picture it&apos;s allowed to see:
              the DM sees everything, the TV sees what&apos;s on the TV, and a player sees their own gold and not their friend&apos;s secret. Sending the whole picture
              instead of a list of changes costs a few more bytes, but a phone that slept through three changes only needs the next one.
            </p>
            <SyncDemo />
            <details className="cs-simplifies">
              <summary>The code behind it</summary>
              <Code file="worker/room.ts" at="f8de4ba" note="trimmed">{`
/** The game changed: push every open screen its own view. Outgoing messages are free. */
async publish(_game: string, _version: number) {
  for (const ws of this.ctx.getWebSockets()) await this.push(ws);
}

private async push(ws: WebSocket) {
  const att = ws.deserializeAttachment() as Attachment;
  // …
  const who = identify(state, att.player, att.key, this.load().dmKeyHash);
  // …
  send({ t: "view", view: await projectFor(state, version, actorOf(who), () => this.loadLedger()) });
}
`}</Code>
              <Code file="worker/room.ts" at="f8de4ba" note="trimmed">{`
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
`}</Code>
            </details>

            <h3>Phones fall asleep</h3>
            <p>
              Phones at a table lock their screens and drop Wi-Fi. Each screen checks in every 25 seconds and replaces a connection it hasn&apos;t heard from in 75. A
              dropped connection retries after 1 second, then 2, then 4, up to 15. When the phone wakes up, it asks for the latest picture straight away. The check-ins
              are answered without waking the room, so a quiet table stays cheap.
            </p>
            <p>
              Tokens on the map move by where you let go, snapped to the grid. If the DM and a player drag the same token at the same moment, the later one wins. At a
              table where people are talking to each other, that seemed the right trade. A player can only move their own token, on the map that&apos;s on the TV, and
              not if the DM has locked it.
            </p>

            <h3>Who is who, without accounts</h3>
            <div className="cs-pair is-phone">
              <div>
                <p>
                  There are no passwords. When a DM starts a campaign, the server makes a random key, hands it over once inside the DM&apos;s link, and keeps only a
                  scrambled fingerprint of it (a SHA-256 hash). The key travels after the <code>#</code> in the link, a part browsers don&apos;t send to servers; the app
                  saves it on the device and removes it from the address bar.
                </p>
                <p>
                  A player&apos;s link just has their name. The first phone to show up with that name makes its own key, and the name is locked to it. Anyone else
                  arriving as that name is told it&apos;s taken. A second device signs in with a link copied from the first, and the DM can reset a lock if a phone is
                  lost.
                </p>
              </div>
              <figure className="cs-phone">
                <img src={`${IMG}/phone.jpg`} width={780} height={1688} alt="A phone screen headed 'That name is taken', explaining that sam is signed in on another device and offering a sign-in link or a key" loading="lazy" />
                <figcaption>What a second device sees when the name is already locked.</figcaption>
              </figure>
            </div>
            <div className="cs-aside">
              <p>
                <strong>What this doesn&apos;t protect.</strong> Anyone with the DM link is the DM, so the DM can make a new key at any time. Anyone with a campaign code
                can open the read-only TV view. A name nobody has claimed yet goes to whoever gets there first. Guessing codes is slowed down (20 misses a minute locks
                an address out for 15 minutes), not made impossible. None of this has had an outside security review; the holes I know about came from a deliberate
                attack on my own site, and were fixed.
              </p>
            </div>

            <h3>Your data is yours</h3>
            <p>
              A DM can download the whole campaign as a zip: the game, every gold transaction and the images. Restoring one takes a safety snapshot first and upgrades
              old saves. The limits: a backup can be at most 4 MB of game data, the DM key is never in it, and images that are still online when you restore are linked
              rather than copied.
            </p>
          </section>

          {/* ------------------------------------------------------------ 7 */}
          <section className="cs-chapter" id="now" aria-labelledby="now-h">
            <header>
              <p className="cs-num">Chapter 7</p>
              <h2 id="now-h">Where it is now</h2>
            </header>
            <p>
              Candlefair is live at <a href="https://dnd.calebs.garden">dnd.calebs.garden</a>, and anyone can start a campaign. It&apos;s still young. I don&apos;t have
              usage numbers worth quoting, and I&apos;m not going to make some up. What I have is a tool I&apos;m about to run my own first game on, built so that if
              other tables pick it up, the cost of having them stays small enough to keep it free.
            </p>
            <p>
              That&apos;s the whole bet. Not a platform, not a startup: a piece of software that a few people at a table actually want, cheap enough that I never have
              to ask them for anything.
            </p>
          </section>

          {/* ------------------------------------------------------------ 8 */}
          <section className="cs-chapter" id="built" aria-labelledby="built-h">
            <header>
              <p className="cs-num">Chapter 8</p>
              <h2 id="built-h">How it was built</h2>
            </header>
            <p>
              I didn&apos;t type most of this code. Every code commit in the repository was written by Claude Code, working from my direction. My part was deciding what
              Candlefair should be and what it shouldn&apos;t: the product, every feature and its wording, the calls in this case study, having my own site attacked to
              find holes, and merging each change.
            </p>
            <p>
              It still wasn&apos;t a weekend. The repository covers eight days of steady work in November 2026, from one game on Redis to separate rooms, keys, backups,
              practice copies and a registry. Each item below says where it comes from: <Src kind="record" /> means a commit, a pull request or a timestamped
              message; <Src kind="memory" /> means my own account.
            </p>
            <ol className="cs-timeline">
              {milestones.map((m) => (
                <li key={m.title} className={m.kind ? `is-${m.kind}` : undefined}>
                  <details>
                    <summary>
                      <time>{m.when}</time>
                      <strong>{m.title}</strong>
                    </summary>
                    <dl>
                      <dt>Before</dt>
                      <dd>{m.before}</dd>
                      <dt>After</dt>
                      <dd>{m.after}</dd>
                      <dt>How</dt>
                      <dd>{m.how}</dd>
                      <dt>Source</dt>
                      <dd>{m.evidence}</dd>
                    </dl>
                  </details>
                </li>
              ))}
            </ol>
          </section>

          <footer className="cs-end">
            <h2>Try it</h2>
            <p>Start a campaign, put the TV view on a screen, and send your players the link.</p>
            <a className="cs-cta" href="https://dnd.calebs.garden">
              Open Candlefair →
            </a>
            <h2 style={{ marginTop: 32 }}>About this page</h2>
            <ul>
              <li>Code is copied from the Candlefair repository at the commit shown under each excerpt. “Trimmed” means lines were left out, marked with …</li>
              <li>The two demos run only in your browser. They copy the rules described here in a few hundred lines; they don&apos;t talk to Candlefair.</li>
              <li>Prices were checked on 21 November 2026 and will change.</li>
            </ul>
          </footer>
        </article>
      </div>
    </main>
  );
}
