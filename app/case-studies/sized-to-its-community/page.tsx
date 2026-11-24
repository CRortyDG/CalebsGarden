import Link from 'next/link';
import { Essay, essayMetadata } from '../_shared/Essay';
import { pieceUrl } from '../_shared/series';

const SLUG = 'sized-to-its-community';
const dek =
  'Most software is built as if it has to serve the whole world. A lot of it doesn’t, and shouldn’t. I build for one city or one table, free or close to it, without accounts, and size everything else to fit.';

export const metadata = essayMetadata(SLUG, dek);

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
            <strong>Software sized to its community</strong> is built for a group you can name, like the people of one city or the players at one table, rather
            than for everyone at once. It is free or nearly free to use because it is cheap to run. It skips accounts unless they are truly needed. And when a second
            community wants it, they get their own copy instead of a corner of one giant platform.
          </p>
          <p>
            I build this way on purpose. madtown.today, a daily homepage for Madison, Wisconsin, and Candlefair, a companion for D&amp;D groups, are the two examples
            behind this series.
          </p>
        </>
      }
    >
      <h2>The default I don&apos;t buy</h2>
      <p>
        Modern software tends to start from one assumption: this could be used by millions of people, so build for millions of people. That brings a familiar kit
        with it. Accounts, so you can be counted and remembered. Growth targets. Infrastructure that scales up. And, to pay for all of that, a business model: ads,
        subscriptions, or your data.
      </p>
      <p>
        For some software that&apos;s exactly right. For a lot of it, I think it&apos;s the wrong default. A daily puzzle for one city doesn&apos;t need to be ready
        for the whole country. A tool for a group of friends playing D&amp;D doesn&apos;t need a sign-up flow. When software is built for a scale it will never reach,
        the people using it pay for that scale anyway, in ads, in fees, in friction.
      </p>
      <p>
        None of this is a new idea. Clay Shirky called it{' '}
        <a href="https://shirky.com/essays/situated-software/">situated software</a> back in 2004: software &ldquo;designed in and for a particular social
        situation or context,&rdquo; that leans on the group using it instead of trying to work for everyone. Robin Sloan made an app for his family alone and
        called it <a href="https://www.robinsloan.com/notes/home-cooked-app/">a home-cooked meal</a>. What&apos;s changed is how cheap it&apos;s become to run
        one, and what you do when a second community wants it too. More on who came first in{' '}
        <Link href="/notes/none-of-this-is-new">None of this is new</Link>.
      </p>
      <p>I might be wrong about how far this goes. But I&apos;ve built two things this way, and they hold up.</p>

      <h2>What &ldquo;sized to its community&rdquo; means</h2>
      <p>Four rules, which I try to keep in this order:</p>
      <ol>
        <li>
          <strong>Know exactly who it&apos;s for.</strong> Not &ldquo;users&rdquo;: the people of Madison, or the players at one table. Every decision gets easier
          when you can picture them.
        </li>
        <li>
          <strong>Make it cheap to run, so it can be free to use.</strong> The cost of the software decides what it has to ask of people. If it costs close to
          nothing, it can ask for nothing.
        </li>
        <li>
          <strong>Skip accounts unless you truly need them.</strong> The browser or a link can carry who you are. That loses some things, like moving between
          devices, and it removes the biggest wall between a person and a tool they might like.
        </li>
        <li>
          <strong>Copies, not a platform.</strong> When another community wants it, give them their own copy with their own data, rather than folding them into one
          ever-bigger site.
        </li>
      </ol>

      <h2>Two examples</h2>
      <p>
        <strong>madtown.today</strong> is a homepage for Madison: daily puzzles with local names, a poll for the whole city, the weather, parking downtown, a
        guestbook, and a webring of Madison websites. It has no accounts and no ad networks. A second city, medcity.today for Rochester, Minnesota, is being built
        from the same code with its own content, rather than by adding Rochester to madtown.today.
      </p>
      <p>
        <strong>Candlefair</strong> runs a game of D&amp;D: a TV view everyone can see, whether that&apos;s a TV in the room or a screen shared on a Discord call,
        each player&apos;s phone, and a console for the person running the game. Every group gets its own small server, which costs close to nothing while nobody is
        playing. Nobody makes an account.
      </p>
      <p>
        Neither is trying to be a platform. Neither has a growth target. Both are built so that I can keep them free without needing a business behind them.
      </p>

      <h2>What it costs</h2>
      <p>This way of building gives things up, and I&apos;d rather say so than pretend it doesn&apos;t.</p>
      <ul>
        <li>
          <strong>No accounts means no easy move between devices.</strong> A madtown.today streak lives in one browser. A Candlefair player on a second device has to
          copy a sign-in link from the first.
        </li>
        <li>
          <strong>Less to prove.</strong> Without accounts, numbers like &ldquo;users&rdquo; are rough. A counter that anyone can open is a fun counter, not a
          leaderboard.
        </li>
        <li>
          <strong>Copies take upkeep.</strong> A second city is a second set of puzzles, content and moderation. That&apos;s the point, but it doesn&apos;t come free.
        </li>
        <li>
          <strong>Cheap has a ceiling.</strong> Some of the choices that keep these tools nearly free would need rethinking if either became truly big. I think
          that&apos;s the right trade for software that probably won&apos;t.
        </li>
      </ul>

      <h2>The rest of this series</h2>
      <p>Each of the next three pieces takes one of the rules and shows how it works in both projects, with the code.</p>
      <ul>
        <li>
          <Link href={pieceUrl('the-browser-is-the-account')}>The browser is the account</Link>: how both projects know who you are without a sign-up.
        </li>
        <li>
          <Link href={pieceUrl('cheap-enough-to-give-away')}>Cheap enough to give away</Link>: what decides the bill, and how Candlefair moved to a design where an
          idle group costs close to nothing.
        </li>
        <li>
          <Link href={pieceUrl('built-for-one-place')}>Built for one place</Link>: what changes when you know exactly who it&apos;s for, and why the answer to a
          second city is a second copy.
        </li>
      </ul>
    </Essay>
  );
}
