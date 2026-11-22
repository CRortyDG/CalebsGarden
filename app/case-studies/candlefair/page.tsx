import type { Metadata } from 'next';
import Link from 'next/link';
import './case-study.css';
import { Code } from './_parts/Code';
import { AfterDiagram, BeforeDiagram, NamespaceDiagram } from './_parts/Diagrams';
import RoomsDemo from './_parts/RoomsDemo';
import SyncDemo from './_parts/SyncDemo';

const title = 'The story behind Candlefair';
const description =
  'How a D&D table companion went from one game on Redis to a public app where every campaign is its own Cloudflare Durable Object: rooms, WebSockets, keys, backups and the bill.';
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
  about: { '@type': 'SoftwareApplication', name: 'Candlefair', url: 'https://dungeon.garden', applicationCategory: 'GameApplication' },
  mainEntityOfPage: `https://calebs.garden${url}`,
};

const chapters = [
  ['what', 'What it is'],
  ['history', 'Three versions'],
  ['redis', 'One game on Redis'],
  ['public', 'Giving it away'],
  ['rooms', 'A room per campaign'],
  ['sync', 'Keeping screens in step'],
  ['identity', 'Who is who'],
  ['backups', 'Taking your data with you'],
  ['cost', 'The bill'],
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
          I built Candlefair to run my own D&amp;D games: a TV in the middle of the table, everyone&apos;s phone in their hand, and a DM console that remembers what I
          won&apos;t. This is how it went from one game on Redis to an app anyone can use, where every campaign is its own small server.
        </p>
        <dl className="cs-facts">
          <div>
            <dt>Live at</dt>
            <dd>
              <a href="https://dungeon.garden">dungeon.garden</a>
            </dd>
          </div>
          <div>
            <dt>Runs on</dt>
            <dd>Cloudflare Workers, Durable Objects, R2</dd>
          </div>
          <div>
            <dt>Client</dt>
            <dd>React, built with Vite</dd>
          </div>
          <div>
            <dt>Repository history</dt>
            <dd>12 to 20 November 2026</dd>
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
          <section className="cs-chapter" id="what" aria-labelledby="what-h">
            <header>
              <p className="cs-num">Chapter 1</p>
              <h2 id="what-h">What it is</h2>
            </header>
            <p>
              Candlefair is for D&amp;D played in person. There are three kinds of screen, and they all show the same game at once.
            </p>
            <ul>
              <li>
                <strong>The TV</strong> is what everyone looks at: the map with the party&apos;s tokens, fog of war, scenes, dice rolls and the party purse.
              </li>
              <li>
                <strong>Each player&apos;s phone</strong> shows their own gold, character sheet, the shop, dice, and the places and people the party has discovered.
              </li>
              <li>
                <strong>The DM console</strong> is where I run the night: the bank and its ledger, fights, what&apos;s on the TV, notes and the plan for the session.
              </li>
            </ul>
            <p>
              I built it around what frustrated me as a player and what I knew I&apos;d forget as a DM: who owes what, what the party learned six sessions ago, which shop
              sold which sword. It doesn&apos;t replace the table. There&apos;s no video chat and no drawing tools; it sits next to the dice.
            </p>
            <figure>
              <img src={`${IMG}/dm.jpg`} width={2000} height={1250} alt="The DM console: a sidebar of pages, a first-night checklist, the Bank with pay buttons for each player, and a small copy of what is on the TV" loading="lazy" />
              <figcaption>The DM console on a laptop. The right-hand column is a live copy of the TV.</figcaption>
            </figure>
          </section>

          {/* ------------------------------------------------------------ 2 */}
          <section className="cs-chapter" id="history" aria-labelledby="history-h">
            <header>
              <p className="cs-num">Chapter 2</p>
              <h2 id="history-h">Three versions</h2>
            </header>
            <p>
              There have been three versions, and only the last two are in the repository. Each item below says where the claim comes from: <Src kind="record" />
              means a commit, a pull request or a message with a timestamp; <Src kind="memory" /> means my own account, which nothing in the repository can confirm.
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
            <p className="cs-when" style={{ marginTop: 16 }}>
              Dates are from git and pull request timestamps. Open any item for the before, the after and the commits.
            </p>
          </section>

          {/* ------------------------------------------------------------ 3 */}
          <section className="cs-chapter" id="redis" aria-labelledby="redis-h">
            <header>
              <p className="cs-num">Chapter 3</p>
              <h2 id="redis-h">One game on Redis</h2>
            </header>
            <p>
              The first deployed version was a Next.js app on Vercel. That was the stack I knew, and for one table it was fine. The whole game was one JSON document in
              Upstash Redis, next to a version number and a ledger of every change to anyone&apos;s gold.
            </p>
            <p>
              A change was a POST. The server read the game, ran the rules over it, and saved the result with a short Lua script that refused to write if someone else
              had saved first. That check, and the retry around it, is still in the code today.
            </p>
            <Code file="src/server/store.ts" at="8dabf57 (the first version)">{`
-- KEYS: ver, state, ledger. ARGV[1] is the version the caller read.
local v = tonumber(redis.call('GET', KEYS[1]) or '0')
if v ~= tonumber(ARGV[1]) then return -1 end
redis.call('SET', KEYS[2], ARGV[2])
for i = 3, #ARGV do redis.call('RPUSH', KEYS[3], ARGV[i]) end
return redis.call('INCR', KEYS[1])
`}</Code>
            <p>
              Live updates were the awkward part. A Vercel function can&apos;t hold a WebSocket, so every screen kept a server-sent events stream open instead. The stream
              only ever said &ldquo;the game is at version 42 now&rdquo;; each screen then fetched its own view. A function can&apos;t run forever either, so each stream
              closed itself after 270 seconds and the browser opened a new one.
            </p>
            <Code file="app/api/stream/route.ts" at="8dabf57" note="trimmed">{`
export const maxDuration = 300;
const LIFETIME_MS = 270_000; // close before the function limit; EventSource reconnects by itself

// Server-sent events: "the game changed, it's version N now". Carries no game
// data at all, so it needs no auth: each client then fetches its own filtered view.
const unsubscribe = store.subscribe(game, (v) => send(\`event: v\\ndata: \${v}\\n\\n\`));
`}</Code>
            <p>
              And there was one DM. The key that let you run the game was a single environment variable, <code>DM_KEY</code>, for the whole site. That is fine when the
              only DM is me.
            </p>
          </section>

          {/* ------------------------------------------------------------ 4 */}
          <section className="cs-chapter" id="public" aria-labelledby="public-h">
            <header>
              <p className="cs-num">Chapter 4</p>
              <h2 id="public-h">Giving it away</h2>
            </header>
            <p>A couple of hours after Milestone 1 was merged, I asked:</p>
            <blockquote>
              how could I make this not use redis and rather use the DMs machine as the node to offload 100% of the server cost to the client? Then I could just give
              this away to people / the public
              <footer>
                <Src kind="record" /> My message, 13 November 2026, 07:22 UTC. Spelling as typed.
              </footer>
            </blockquote>
            <p>Giving it away changed what the app had to be:</p>
            <ul>
              <li>Every campaign needed its own DM key, made when the campaign is made, instead of one key in an environment variable.</li>
              <li>Campaigns had to be properly separate. One table&apos;s busy night couldn&apos;t slow another&apos;s, and one table must never see another&apos;s data.</li>
              <li>The cost of an idle campaign had to be close to nothing, because most campaigns are idle most of the week.</li>
            </ul>
            <p>Three ways were weighed that morning.</p>
            <div className="cs-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Option</th>
                    <th scope="col">What it would take</th>
                    <th scope="col">Why not</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>The DM&apos;s laptop on the local network</td>
                    <td>The app already had a file-based store for development.</td>
                    <td>Only works for phones on the same Wi-Fi. A link texted to a player at home goes nowhere.</td>
                  </tr>
                  <tr>
                    <td>WebRTC from the DM&apos;s browser</td>
                    <td>A signalling server, TURN for phones behind strict networks.</td>
                    <td>The DM&apos;s tab becomes the server: close it and the table goes dark. Rated the hardest of the three.</td>
                  </tr>
                  <tr>
                    <td>Cloudflare Durable Objects</td>
                    <td>One small stateful server per campaign, with storage and WebSockets built in.</td>
                    <td>Chosen. It still costs something, but very little when idle.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              It wasn&apos;t only about the bill. My Vercel account is paid for through madtown.today, and I wanted Candlefair&apos;s hosting to stand on its own. Dropping Next.js was part of the deal; I said that if it worked, I didn&apos;t mind what it ran on.
              The move was merged that afternoon.
            </p>
            <div className="cs-diagrams">
              <BeforeDiagram />
              <AfterDiagram />
            </div>
          </section>

          {/* ------------------------------------------------------------ 5 */}
          <section className="cs-chapter" id="rooms" aria-labelledby="rooms-h">
            <header>
              <p className="cs-num">Chapter 5</p>
              <h2 id="rooms-h">A room per campaign</h2>
            </header>
            <p>
              A Durable Object is a small server that Cloudflare keeps for a name you give it, with its own storage. Cloudflare runs at most one copy of a given object at
              a time, so everything sent to it goes through the same place. Candlefair calls one a <em>room</em>, and every campaign code gets one. The Worker in front
              never keeps game state; it finds the room and hands the request over:
            </p>
            <Code file="worker/index.ts" at="f8de4ba">{`
function room(env: Env, game: string) {
  return env.ROOMS.get(env.ROOMS.idFromName(game));
}

// A campaign's practice copy: "practice:<code>". Codes are letters, digits and dashes, so no code is ever this name.
function practiceRoom(env: Env, game: string) {
  return env.ROOMS.get(env.ROOMS.idFromName(\`practice:\${game}\`));
}
`}</Code>
            <p>
              There is no table of campaigns to look up first. The code <em>is</em> the address. Isolation falls out of that: a room only ever reads its own storage, so
              there is no shared database where one campaign&apos;s query could return another&apos;s rows.
            </p>
            <NamespaceDiagram />
            <p>
              Inside, each room has a small SQLite database. The game is still one JSON document, in a one-row <code>doc</code> table beside its version and the hash of
              the DM key. The ledger is a table with a row per entry. A save writes both inside one transaction:
            </p>
            <Code file="worker/room.ts" at="f8de4ba" note="trimmed">{`
async commit(game: string, expected: number, state: GameState, ledger: LedgerEntry[]) {
  const d = this.load();
  if (d.version !== expected) return null; // someone saved first: the caller retries
  const next: Doc = { ...d, game, version: d.version + 1, state: structuredClone(state) };
  // …
  this.ctx.storage.transactionSync(() => {
    this.save(game, next);
    for (const e of entries) this.sql.exec("INSERT INTO ledger (entry) VALUES (?)", JSON.stringify(e));
  });
  // …
  return next.version;
}
`}</Code>
            <p>
              Two details keep rooms cheap. The tables are only created on the first real save, so a request for a code that doesn&apos;t exist leaves nothing behind.
              And every room sets an alarm: after 180 days without use, it deletes itself and its images.
            </p>
            <RoomsDemo />
          </section>

          {/* ------------------------------------------------------------ 6 */}
          <section className="cs-chapter" id="sync" aria-labelledby="sync-h">
            <header>
              <p className="cs-num">Chapter 6</p>
              <h2 id="sync-h">Keeping screens in step</h2>
            </header>
            <p>
              Every screen at the table holds one WebSocket to its room. Changes don&apos;t go over it; they go over ordinary HTTP posts. After each save the room sends every
              open socket the whole view that screen is allowed to see. The DM gets everything, the TV gets what&apos;s on the TV, and a player gets their own gold and
              not their friend&apos;s secret.
            </p>
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
            <p>
              Sending the whole view instead of a list of changes costs more bytes, but it removes a class of bugs. A screen never has to apply changes in the right
              order, and one that missed three updates while a phone was asleep only needs the next one. Each view carries the game&apos;s version, and a screen ignores any
              view older than the one it has.
            </p>
            <SyncDemo />
            <h3>When a phone goes to sleep</h3>
            <p>
              Phones at a table lock their screens, drop Wi-Fi and wake up minutes later. The client pings every 25 seconds and replaces a socket it hasn&apos;t heard from
              in 75. When a socket closes it reconnects after 1 second, then 2, 4 and so on up to 15. When the tab becomes visible again or the network comes back, it
              asks for its view straight away instead of waiting. The pings themselves never wake the room:
            </p>
            <Code file="worker/room.ts" at="f8de4ba">{`
// Keep-alive pings from the browser are answered without waking the room.
ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
`}</Code>
            <p>
              The room uses Cloudflare&apos;s hibernation API for its sockets. Who is on each socket is saved with the socket, so the room can be taken out of memory between
              changes and still know who to send what when it wakes.
            </p>
            <h3>Moving tokens</h3>
            <p>
              Tokens on the map move by an absolute position, sent once when you let go, snapped to the grid. There is no merging: if the DM and a player drag the same
              token at the same moment, the later save wins. At a table where people are talking to each other, that seemed the right trade. The rules only let a
              player move their own token, and only on the map that&apos;s on the TV:
            </p>
            <Code file="src/shared/reducer.ts" at="f8de4ba">{`
case "me.tokenMove": {
  if (ctx.actor.role !== "player") fail("Only a player can do that.");
  const pid = ctx.actor.playerId;
  const live = s.scenes.find((x) => x.id === s.live.sceneId);
  if (!live || live.kind !== "map" || !live.map) fail("There's no map on the TV right now.");
  const m = live.map;
  const t = tokensOf(m).find((x) => x.playerId === pid) ?? fail("You don't have a token on this map yet. Ask the DM.");
  if (t.locked) fail("The DM has locked your token.");
  Object.assign(t, snapToGrid(m.grid, cmd.x, cmd.y, t.size));
  break;
}
`}</Code>
          </section>

          {/* ------------------------------------------------------------ 7 */}
          <section className="cs-chapter" id="identity" aria-labelledby="identity-h">
            <header>
              <p className="cs-num">Chapter 7</p>
              <h2 id="identity-h">Who is who</h2>
            </header>
            <p>
              Candlefair has no accounts and no passwords. Who you are comes from the link you opened and a key your browser keeps. That is easy at a table, and it has
              limits worth being plain about.
            </p>
            <h3>The DM key</h3>
            <p>
              When someone starts a campaign, the server makes 24 random bytes, sends them back once, and stores only their SHA-256 hash. Checking a key compares hashes
              in constant time.
            </p>
            <Code file="src/server/auth.ts" at="f8de4ba">{`
/** A new campaign's DM key: 24 random bytes, URL-safe. Only its hash is stored. */
export function newDmKey(): string {
  return randomBytes(24).toString("base64url");
}

/** Is this the campaign's DM key? A campaign with no key set lets nobody in. */
export function isDmKey(key: string | null | undefined, hash: string | null | undefined): boolean {
  if (!key || !hash) return false;
  return sameHash(sha256(key), hash);
}
`}</Code>
            <p>
              The DM&apos;s link carries the key after a <code>#</code>, in the part of a URL that browsers don&apos;t send to the server. On first load the app saves it on
              the device and removes it from the address bar, and from then on sends it in a header. The key is a bearer secret: anyone who has the DM link can run the
              game, so the DM can make a new key at any time, which cuts off every screen holding the old one. Older links that put the key in the query string still
              work and are cleaned up the same way, but a query string can end up in logs, which is why new links don&apos;t use one.
            </p>
            <h3>Players</h3>
            <div className="cs-pair is-phone">
              <div>
                <p>
                  A player&apos;s link names them, like <code>?player=sam</code>. The name alone isn&apos;t enough. The first time a phone shows up with a name, it makes
                  its own random key and the server ties the name to it. After that, anyone else arriving as &ldquo;sam&rdquo; is told the name is taken. To use a
                  second device, Sam copies a sign-in link from the first; if Sam loses the phone, the DM can reset the lock.
                </p>
                <p>
                  That is trust on first use, and it has the usual hole: if someone else claims your name before you do, it&apos;s theirs until the DM steps in. At a
                  table of friends that&apos;s a conversation, not an attack. Once a session has started, or the table is full, new names have to knock and the DM lets
                  them in.
                </p>
              </div>
              <figure className="cs-phone">
                <img src={`${IMG}/phone.jpg`} width={780} height={1688} alt="A phone screen headed 'That name is taken', explaining that sam is signed in on another device and offering a sign-in link or a key" loading="lazy" />
                <figcaption>What a second device sees when the name is already locked.</figcaption>
              </figure>
            </div>
            <h3>Campaign codes</h3>
            <p>
              A made-up code is 7 characters from a 31-letter alphabet with look-alikes like 0 and o removed, so it can be read aloud. A code a DM picks needs at least 8
              letters or digits. A code is closer to a room number than a password: with the code alone you can open the read-only TV view, which shows what&apos;s on the
              TV and nothing more. Guessing is slowed down rather than prevented: 20 misses a minute from one address locks that address out for 15 minutes at the Cloudflare data centre it reached.
            </p>
            <div className="cs-aside">
              <p>
                <strong>What this doesn&apos;t protect.</strong> Anyone with a DM link is the DM. Anyone with a code can watch the TV view. A name nobody has claimed yet
                can be claimed by whoever gets there first. None of this has been through an outside security review; the holes I know about were found by a deliberate attack on
                my own site and are listed in the history above.
              </p>
            </div>
          </section>

          {/* ------------------------------------------------------------ 8 */}
          <section className="cs-chapter" id="backups" aria-labelledby="backups-h">
            <header>
              <p className="cs-num">Chapter 8</p>
              <h2 id="backups-h">Taking your data with you</h2>
            </header>
            <p>
              Because every campaign lives in its own room, a DM&apos;s data is easy to hand back. The DM can download a backup: a zip with the game, the full ledger and
              the images it uses. Restoring one into a campaign takes a safety snapshot first, re-uploads any images that are missing, upgrades old saves to the current
              format, and moves everything to the new code.
            </p>
            <p>The limits, as they stand:</p>
            <ul>
              <li>An import can be at most 4 MB of JSON, and a game can grow to about 1.5 million characters before the room refuses to save more.</li>
              <li>The DM key, snapshots, usage counts and unreviewed Worldbuilder drafts are not in a backup. The DM key never leaves the room it was made for.</li>
              <li>
                Images that are still online when a backup is restored are linked, not copied. If the original campaign is later deleted for being idle, those
                images go with it.
              </li>
            </ul>
          </section>

          {/* ------------------------------------------------------------ 9 */}
          <section className="cs-chapter" id="cost" aria-labelledby="cost-h">
            <header>
              <p className="cs-num">Chapter 9</p>
              <h2 id="cost-h">The bill</h2>
            </header>
            <p>
              I can&apos;t give you a before-and-after bill. The Redis version was on main for about ten hours, with no real campaigns on it. What I can show is how each
              version turns one click at the table into work someone charges for. Take a table with seven screens open (a DM laptop, a TV and five phones) and a DM who
              pays the party:
            </p>
            <div className="cs-compare">
              <section>
                <h3>Version two</h3>
                <span className="cs-when">Next.js on Vercel, Upstash Redis</span>
                <ol>
                  <li>The DM&apos;s POST runs one function: a Redis read, the Lua save, a publish.</li>
                  <li>Seven open streams each hear the new version number.</li>
                  <li>Seven screens each run another function to fetch their view, and each of those reads Redis again.</li>
                  <li>Meanwhile, every open screen is a function that stays running, reopened every 270 seconds, for as long as the screen is open.</li>
                </ol>
              </section>
              <section>
                <h3>Version three</h3>
                <span className="cs-when">Worker and a Durable Object</span>
                <ol>
                  <li>The DM&apos;s POST is one Worker request, passed to the room as one request.</li>
                  <li>The room saves to its own SQLite in one transaction.</li>
                  <li>The room sends seven WebSocket messages. Cloudflare doesn&apos;t charge for messages a Durable Object sends.</li>
                  <li>Between changes the room can hibernate, and keep-alive pings are answered without waking it.</li>
                </ol>
              </section>
            </div>
            <p>
              The second shape grows with how many screens are open and for how long. The first grows mostly with how many changes are made. A table is open for hours
              and changes something every few seconds at most, so the difference matters.
            </p>
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
                    <td>Outgoing WebSocket messages aren&apos;t billed; incoming ones count as one request per 20. A hibernating object isn&apos;t billed for time.</td>
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

          {/* ------------------------------------------------------------ 10 */}
          <section className="cs-chapter" id="built" aria-labelledby="built-h">
            <header>
              <p className="cs-num">Chapter 10</p>
              <h2 id="built-h">How it was built</h2>
            </header>
            <p>
              I didn&apos;t type most of this code. Every code commit in the repository was written by Claude Code, working from my direction. My part was deciding what
              Candlefair should be and what it shouldn&apos;t: the product, every feature and its wording, the architecture calls in this case study, having my own
              site attacked to find holes, and merging each change.
            </p>
            <p>
              It still wasn&apos;t a weekend. The repository covers eight days of steady work in November 2026, from a single game on Redis to separate rooms, keys,
              backups, practice copies and a registry. The history above links each change to its commit.
            </p>
          </section>

          <footer className="cs-end">
            <h2>Try it</h2>
            <p>Start a campaign, put the TV view on a screen, and send your players the link.</p>
            <a className="cs-cta" href="https://dungeon.garden">
              Open dungeon.garden →
            </a>
            <h2 style={{ marginTop: 32 }}>About the code on this page</h2>
            <ul>
              <li>Excerpts are copied from the Candlefair repository at the commit shown under each one. “Trimmed” means lines were left out, marked with …</li>
              <li>The two demos run only in your browser. They copy the rules described here in a few hundred lines; they don&apos;t talk to Candlefair.</li>
              <li>Prices were checked on 21 November 2026 and will change.</li>
            </ul>
          </footer>
        </article>
      </div>
    </main>
  );
}
