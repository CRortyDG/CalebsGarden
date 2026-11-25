import { Code } from '../_shared/Code';
import { Essay, essayMetadata } from '../_shared/Essay';

const SLUG = 'the-browser-is-the-account';
const dek =
  'Neither madtown.today nor Dungeon Garden has a sign-up. One treats your browser as your account; the other treats a link plus a key on your device as one. Here is how each works and what it gives up.';

export const metadata = essayMetadata(SLUG, dek);
const IMG = '/case-studies/candlefair';

export default function Page() {
  return (
    <Essay
      slug={SLUG}
      dek={dek}
      about={[
        { name: 'madtown.today', url: 'https://madtown.today' },
        { name: 'Dungeon Garden', url: 'https://dnd.calebs.garden' },
      ]}
      inShort={
        <>
          <p>
            <strong>Accountless software</strong> remembers people without asking them to sign up. madtown.today gives each browser a random id the first time it
            visits and keeps game history in that browser. Dungeon Garden puts a secret key in the link a group&apos;s organiser gets, and ties each player&apos;s name to
            the first device that uses it.
          </p>
          <p>
            Both remove the sign-up wall. Both give up easy moves between devices, and both are honest that a determined person can get around them. For a city&apos;s
            daily puzzle and a game night, that&apos;s the right trade.
          </p>
        </>
      }
    >
      <h2>Why skip accounts at all</h2>
      <p>
        An account is a wall between someone and the thing they came for. For a bank, the wall is the point. For a daily puzzle someone found from a friend&apos;s
        text, or a game night where five people need to be playing in the next two minutes, it&apos;s mostly a reason to leave. Accounts also mean storing emails and
        passwords, resetting them, and protecting them. Software that doesn&apos;t hold them can&apos;t leak them.
      </p>
      <p>So both projects start from the same question: what is the least we need to know about someone to give them a good experience?</p>

      <h2>madtown.today: your browser is you</h2>
      <p>
        The first time a browser loads madtown.today, it makes itself a random id and keeps it in local storage. There&apos;s no name, email or password behind it. The id
        lets the site count you once in &ldquo;who&apos;s here&rdquo;, count your finished puzzle once in the city&apos;s results, and give you a nickname for the
        guestbook.
      </p>
      <Code file="lib/visitor-id.ts" at="madtown.today 66ef312" note="trimmed">{`
// Anonymous per-browser id, shared by the visitor counter and stats dedupe.
const STORAGE_KEY = "mt:visitor-id";

export function getVisitorId(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && VISITOR_ID_RE.test(stored)) return stored;
    const id = randomId();
    madeNow = true;
    localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    // Storage blocked: fall back to an id that lasts for this page load.
    memoryId ??= randomId();
    return memoryId;
  }
}
`}</Code>
      <p>
        Your game history stays in your browser. Each day&apos;s game is saved there, and your streak is worked out from those saved days whenever the
        page loads. The server only counts finished games toward the city&apos;s results; it keeps no copy of yours.
      </p>
      <h3>Where it breaks, and the patch</h3>
      <p>
        A browser is a good account until you add the site to an iPhone home screen. Home-screen apps on iOS have historically had their own storage, so a player
        who installs madtown.today could open it and find their streak gone. Rather than add accounts, the site carries the streak across: before you add it, it
        uploads just your saved games under a random 12-character code that expires in 24 hours, and the installed app imports them once on first launch. Every
        missing day is added, a finished day beats an unfinished one, and the streak is worked out again from the merged days.
      </p>
      <p>
        That one feature is the whole philosophy in miniature: find the exact moment where &ldquo;the browser is the account&rdquo; fails, and fix that moment,
        instead of adding accounts for everyone.
      </p>

      <h2>Dungeon Garden: a link and a key</h2>
      <p>
        A game of D&amp;D needs more than a browser id, because one person, the DM, has powers the others don&apos;t, and players need to be told apart at the
        table. So Dungeon Garden uses links that carry identity.
      </p>
      <p>
        When someone starts a campaign, the server makes 24 random bytes as the DM&apos;s key, hands it over once inside the DM&apos;s link, and keeps only its
        SHA-256 hash. The key sits after the <code>#</code> in the link, the part browsers don&apos;t send to servers. The app saves it on the device and removes it
        from the address bar.
      </p>
      <Code file="src/server/auth.ts" at="Dungeon Garden f8de4ba">{`
/** A new campaign's DM key: 24 random bytes, URL-safe. Only its hash is stored. */
export function newDmKey(): string {
  return randomBytes(24).toString("base64url");
}
`}</Code>
      <div className="cs-pair is-phone">
        <div>
          <p>
            A player&apos;s link only has their name. The first phone to show up with that name makes its own key, and the name is locked to it. Anyone else arriving
            as that name is told it&apos;s taken. To add a second device, the player copies a sign-in link from the first. If a phone is lost, the DM can reset the
            lock.
          </p>
          <p>
            That is trust on first use. If someone claims your name before you do, it&apos;s theirs until the DM steps in. Among friends, that&apos;s a conversation,
            not an attack.
          </p>
        </div>
        <figure className="cs-phone">
          <img src={`${IMG}/phone.jpg`} width={780} height={1688} alt="A phone screen headed 'That name is taken', explaining that sam is signed in on another device and offering a sign-in link or a key" loading="lazy" />
          <figcaption>What a second device sees in Dungeon Garden when the name is already locked.</figcaption>
        </figure>
      </div>

      <h2>Side by side</h2>
      <div className="cs-table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col" />
              <th scope="col">madtown.today</th>
              <th scope="col">Dungeon Garden</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Who you are</th>
              <td>A random id your browser makes on its first visit</td>
              <td>A name in your link, locked to a key your device makes</td>
            </tr>
            <tr>
              <th scope="row">Where your stuff lives</th>
              <td>In your browser: saved games and streaks</td>
              <td>On the server, in your group&apos;s own room</td>
            </tr>
            <tr>
              <th scope="row">A second device</th>
              <td>Starts fresh, except the home-screen transfer</td>
              <td>Copy a sign-in link from the first device</td>
            </tr>
            <tr>
              <th scope="row">Clear your browser</th>
              <td>Your streak is gone</td>
              <td>Open your sign-in link again, or ask the DM to reset your name</td>
            </tr>
            <tr>
              <th scope="row">What a cheater can do</th>
              <td>Send a made-up result to the city&apos;s counts. The server checks it&apos;s consistent, but it&apos;s a fun counter, not a leaderboard.</td>
              <td>Claim an unclaimed name first. Anyone with the DM link is the DM, so the DM can make a new key any time.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>What I&apos;d tell someone trying this</h2>
      <ul>
        <li>Decide what the server truly needs to know. For madtown.today it&apos;s &ldquo;have I counted this browser?&rdquo;. For Dungeon Garden it&apos;s &ldquo;is this the DM?&rdquo;.</li>
        <li>Keep people&apos;s own history on their own device when you can. It&apos;s the cheapest storage there is, and the most private.</li>
        <li>Write down what it doesn&apos;t protect, in plain words. Both projects do, and it keeps the claims honest.</li>
        <li>When the accountless model breaks, fix that one moment, like the home-screen transfer, before reaching for accounts.</li>
      </ul>
    </Essay>
  );
}
