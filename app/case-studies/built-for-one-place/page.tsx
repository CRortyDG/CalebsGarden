import { Code } from '../_shared/Code';
import { Essay, essayMetadata } from '../_shared/Essay';

const SLUG = 'built-for-one-place';
const dek =
  'madtown.today is a homepage for one city. Candlefair is a companion for one group’s game. Knowing exactly who something is for changes what you build, and when a second place wants it, the answer is a second copy, not a bigger site.';

export const metadata = essayMetadata(SLUG, dek);
const IMG = '/case-studies/candlefair';

export default function Page() {
  return (
    <Essay
      slug={SLUG}
      dek={dek}
      about={[
        { name: 'madtown.today', url: 'https://madtown.today' },
        { name: 'Candlefair', url: 'https://dnd.calebs.garden' },
      ]}
      inShort={
        <>
          <p>
            Building for one specific place or group lets the details carry the product. madtown.today names its puzzles after Madison&apos;s lakes and the Memorial
            Union Terrace chairs. Candlefair is shaped around how a DM actually runs a night and remembers months of play.
          </p>
          <p>
            When another city or group wants the same thing, both projects make a copy with its own content and its own data rather than one generic platform: a
            second city gets its own site from the same code, and every D&amp;D group gets its own room.
          </p>
        </>
      }
    >
      <h2>The details are the product</h2>
      <p>
        A generic daily puzzle site is easy to find. What makes madtown.today worth opening is that it&apos;s about Madison. The grouping puzzle is called Four Lakes,
        and its solved groups are named after the lakes instead of colours. The sorting puzzle has you stack the Memorial Union Terrace chairs. The word game&apos;s
        answers are Madison words, each with a note about why. Madison Asks puts one question to the whole city each day, like the best way to eat a fried cheese
        curd. The hill card counts plastic flamingos planted on Bascom Hill toward 1,008, after the 1979 prank.
      </p>
      <p>
        Around the puzzles sit the things a neighbour would tell you: what&apos;s on in town today, picked by hand; the weather for downtown; parking; a guestbook;
        and a webring of Madison websites, with a button that sends you to a random one.
      </p>
      <p>
        None of that would survive being made general. &ldquo;A puzzle about your city&apos;s lakes&rdquo; is a worse product than a puzzle about Mendota.
      </p>

      <h2>A tool shaped like one group&apos;s game</h2>
      <p>
        Candlefair is the same idea for a game night. It&apos;s built around the frustrations I had as a player (who has how much gold, what that merchant said four
        sessions ago) and what I knew I&apos;d forget as a DM. It&apos;s shaped like a real game: a TV view everyone watches, whether that&apos;s a TV in the room or a
        screen shared on a Discord call, each player&apos;s phone, and the DM&apos;s console.
      </p>
      <figure>
        <img src={`${IMG}/dm.jpg`} width={2000} height={1250} alt="The Candlefair DM console: a sidebar of pages, a first-night checklist, the Bank with pay buttons for each player, and a small copy of what is on the TV" loading="lazy" />
        <figcaption>The DM console. The right-hand column is a live copy of the TV view.</figcaption>
      </figure>
      <p>
        It&apos;s also shaped around how I want to run my world. My best friend can play about once a month, so several groups share one world and one storyline.
        Candlefair keeps track of what each group has found and been paid, so the world stays consistent between them.
      </p>

      <h2>A second place gets a second copy</h2>
      <p>
        The usual answer to &ldquo;another city wants this&rdquo; is to add a city picker to one big site. madtown.today goes the other way. The same code can be
        built as a different city&apos;s site, chosen when it&apos;s built, and each city has its own config: its name, its copy, its games&apos; local names, its
        puzzles and its questions. medcity.today, for Rochester, Minnesota, is being built this way.
      </p>
      <Code file="cities/madtown/config.ts" at="madtown.today 66ef312" note="trimmed">{`
export const madtown: CityConfig = {
  id: "madtown",
  site: {
    name: "madtown.today",
    tagline: "a homepage for the isthmus",
    cityName: "Madison",
    region: "Madison, WI",
    motto: "77 square miles surrounded by reality",
    // …
  },
  // …
};
`}</Code>
      <p>
        The plan for this gives each city its own production database, so a bug in one city can&apos;t touch another&apos;s data, and keeps every key Madison already
        uses exactly as it is, so no one&apos;s streak resets. Each city keeps its own voice and its own content. What they share is code.
      </p>
      <p>
        Candlefair does the same thing at a smaller size. Every D&amp;D group gets its own room: its own small server and its own storage, named by its campaign
        code. Nothing is shared between groups except the code that runs them. A group that stops playing for 180 days is cleaned up, and nobody else notices.
      </p>

      <h2>Why copies beat a platform here</h2>
      <ul>
        <li>
          <strong>Local stays local.</strong> Rochester&apos;s puzzles don&apos;t have to make sense in Madison, and one group&apos;s house rules don&apos;t leak
          into another&apos;s game.
        </li>
        <li>
          <strong>Failures stay small.</strong> A bad day in one city or one group stays there.
        </li>
        <li>
          <strong>Each copy stays cheap.</strong> A copy sized to one community has a bill sized to one community.
        </li>
        <li>
          <strong>Someone local can own it.</strong> A city&apos;s site can have its own people choosing what goes on it, which a global platform can&apos;t offer.
        </li>
      </ul>
      <p>
        The cost is upkeep. A second city is a second set of puzzles, events and moderation, and it only works if someone cares about that city. I think that&apos;s
        the right price: software for a place should be looked after by people who know the place.
      </p>
    </Essay>
  );
}
