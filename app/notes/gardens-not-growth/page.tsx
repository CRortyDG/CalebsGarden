import Link from 'next/link';
import { Note, noteMetadata } from '../_parts/Note';

const SLUG = 'gardens-not-growth';
export const metadata = noteMetadata(SLUG);
export const revalidate = 3600; // a scheduled note goes live within the hour of its day

export default function Page() {
  return (
    <Note slug={SLUG} kind="working">
      <p>
        People call the internet a web. I&apos;ve always liked thinking of it as a garden instead. A web is one thing, spun to catch something. A garden is lots of
        small things growing next to each other, and somebody tends each one.
      </p>
      <p>
        I&apos;ve started calling what I build <strong>garden sites</strong>. Each one is a pot: a small, independent website that does one job for one group. On
        its own a pot is a nice thing to have. Put enough of them side by side and you get a farm, a set of small sites that together cover a lot of what people use
        the internet for, without any of them being built to harvest money.
      </p>

      <h2>A pot</h2>
      <p>A garden site is a pot because of a few things it has to be:</p>
      <ul>
        <li>
          <strong>Small.</strong> It does one job well and stops there. madtown.today is a daily homepage for Madison. Dungeon Garden runs a game of D&amp;D. Neither
          is trying to turn into something else.
        </li>
        <li>
          <strong>Independent.</strong> It has its own code, its own data and its own bill. If one breaks, the others don&apos;t notice. If I stop, someone else
          can pick the pot up and keep it going, because the code is public.
        </li>
        <li>
          <strong>Sized to the plant.</strong> It&apos;s built for a group you can name, which is the idea behind{' '}
          <Link href="/case-studies/sized-to-its-community">software sized to its community</Link>. A pot doesn&apos;t need to hold a tree.
        </li>
        <li>
          <strong>Cheap to water.</strong> It costs close to nothing while nobody is using it, so it can be free, and it can sit quietly through a slow season
          without being switched off.
        </li>
      </ul>

      <h2>The farm</h2>
      <p>
        One pot doesn&apos;t feed anyone. What I&apos;m more interested in is what happens when there are a lot of them. Most of what a group of people needs online
        is a handful of small jobs: what&apos;s happening in town today, a game night, a trip with friends, a waitlist at the café. Each of those can be its own pot.
        Together they start to look like the things people now get from a few giant apps, except no one company owns the field.
      </p>
      <p>The pots don&apos;t share a server or a login. What they share is closer to soil:</p>
      <ul>
        <li>
          <strong>Seeds.</strong> Good parts get copied from one pot to the next. The small per-group server Dungeon Garden runs on is the starting point for the trip
          board I&apos;m planning, and the way it knows who you are without an account is the same trick madtown.today uses.
        </li>
        <li>
          <strong>Paths between them.</strong> madtown.today has a webring of Madison websites with a button that sends you to a random one. That&apos;s a farm path:
          a way to walk from one plot to the next without a platform in the middle.
        </li>
        <li>
          <strong>Cuttings.</strong> When another city wants madtown.today, it gets its own copy, like medcity.today for Rochester, rather than a corner of mine.
        </li>
      </ul>
      <p>
        The one bit of shared ground I do care about is the name. Dungeon Garden lives at dnd.calebs.garden, and the trip board will start at
        travel.calebs.garden. I&apos;d like every pot to end in .garden, so you can tell from the address what kind of thing it is.
      </p>

      <h2>Gardening, not growing</h2>
      <p>
        Most software is farmed for yield. There&apos;s a growth target, so every season has to be bigger than the last, and eventually the thing gets sold or
        squeezed for ads, fees or data to keep the line going up. When it can&apos;t grow anymore, it gets ploughed under.
      </p>
      <p>
        A garden has a different goal. You want it healthy next year, not bigger. The work is tending: weeding, watering, an upgrade here, a fix there. I wrote
        about what that looks like in practice in{' '}
        <Link href="/notes/one-person-fifty-apps">whether one person can look after fifty of these</Link>, and about who pays for the tending in{' '}
        <Link href="/notes/can-free-software-pay-for-itself">whether free software can pay a person</Link>. The short version is that without a growth target
        there&apos;s no emergency, and a pot that&apos;s cheap enough never has to be pulled up.
      </p>

      <h2>Three pots so far</h2>
      <ul>
        <li>
          <strong>madtown.today.</strong> A daily homepage for Madison, Wisconsin, with puzzles, a poll, the weather and that webring.
        </li>
        <li>
          <strong>Dungeon Garden.</strong> A companion for D&amp;D groups. Every group gets its own tiny server, and nobody makes an account.
        </li>
        <li>
          <strong>A trip board, not built yet.</strong> One link for a group trip: friends claim a spot, vote on ideas and build the days together. No accounts, no
          payments.
        </li>
      </ul>

      <h2>Not a new idea</h2>
      <p>
        Gardens are an old picture for the internet. Mike Caulfield&apos;s{' '}
        <a href="https://hapgood.us/2015/10/17/the-garden-and-the-stream-a-technopastoral/">The Garden and the Stream</a> and Maggie Appleton&apos;s{' '}
        <a href="https://maggieappleton.com/garden-history">history of the digital garden</a> use it for personal notes that grow over time. I mean something a
        little different: small working tools, each tended on its own, that add up to something. But the instinct is the same one, and they got there first.
      </p>

      <h2>Where I might be wrong</h2>
      <ul>
        <li>Two pots and a plan isn&apos;t a farm. The idea only proves out if there are a lot of them, and some are planted by people who aren&apos;t me.</li>
        <li>
          Pots that don&apos;t share accounts can&apos;t easily share anything else either. Moving from one to the next is a link, not a smooth handoff, and some
          people will want the smooth handoff.
        </li>
        <li>Nice .garden names cost real money. A short one can run hundreds of dollars, which is a lot for a pot meant to cost nothing.</li>
        <li>
          Giant apps win partly because everything is in one place. A field of small sites has to be easy to find, or people won&apos;t walk the paths.
        </li>
      </ul>
    </Note>
  );
}
