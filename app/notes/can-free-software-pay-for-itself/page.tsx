import Link from 'next/link';
import { Note, noteMetadata } from '../_parts/Note';

const SLUG = 'can-free-software-pay-for-itself';
export const metadata = noteMetadata(SLUG);
export const revalidate = 3600; // a scheduled note goes live within the hour of its day

export default function Page() {
  return (
    <Note slug={SLUG}>
      <p>
        I&apos;ve written a fair amount about keeping hosting cheap enough to give software away. That&apos;s the easy half. A free app also needs someone&apos;s
        time: fixing it, upgrading it, writing whatever it needs every day, and building what people ask for next. So the harder question is whether software like
        this can pay the person doing that, and anyone helping them.
      </p>
      <p>I think it can. Not by charging for it, but the way people already pay for things they love that they could get for free.</p>

      <h2>What madtown.today has brought in</h2>
      <p>
        I built madtown.today expecting no money at all. It launched at the start of October. By late November, two local businesses had offered to sponsor it and
        three people had bought me a coffee, which comes to $390 before card fees. That&apos;s a happy accident, not a plan, and it covers{' '}
        <Link href="/notes/what-madtown-today-actually-costs">the hosting</Link> and none of the time. But it says something: people will pay for a small free
        thing they use, even when nobody asks them to.
      </p>

      <h2>Back the person, not the software</h2>
      <p>
        Nobody tips a Twitch streamer for the video file. They pay because they like what that person makes and want them to keep making it. Patreon is a big
        business built on exactly that, and I don&apos;t think software is different. You wouldn&apos;t be paying for the app. You&apos;d be paying the person who
        keeps it going.
      </p>
      <p>
        That changes when money is needed at all. A finished app that runs on its own, like Candlefair could, needs almost nothing from its users. Money starts to
        matter in two cases: when the costs go up because more people use it, or when people want new things built. Both are easy to explain, and both are easy to
        say yes to.
      </p>

      <h2>Two kinds of work</h2>
      <p>The time a free app takes splits in two, and they behave very differently:</p>
      <ul>
        <li>
          <strong>The code.</strong> Upgrades, security fixes, the odd bug. If it&apos;s built well, this is small and it comes in bursts.
        </li>
        <li>
          <strong>Everything else.</strong> madtown.today needs a new puzzle and a new question for the city every single day. That&apos;s the real ongoing cost,
          and it isn&apos;t engineering. It&apos;s also the part I&apos;d guess people are most happy to fund, because it&apos;s what they come back for.
        </li>
      </ul>

      <h2>Build it to be left alone</h2>
      <p>
        Constant updates are a fairly new habit. A game on a disc or a boxed copy of Photoshop was written once, for one version of Windows, and it kept working.
        Plenty of websites could have stayed on the framework version they launched with and been fine, if nothing they depended on kept moving.
      </p>
      <p>
        I&apos;d like to build that way for the browser: treat it as the platform, write for a version of JavaScript, keep dependencies few, and ship something
        that keeps running without me. That&apos;s a claim about the code, not the hosting. Candlefair runs on Cloudflare, so it lives by their prices and their
        changes, and a missed security fix is always possible. But the less an app needs from its maintainer, the less it matters whether they&apos;re paid this
        month.
      </p>

      <h2>Where the money should come from</h2>
      <p>For software sized to one city or one group, I&apos;d look for it in this order:</p>
      <ul>
        <li>Local businesses that want their neighborhood&apos;s tools to exist, as sponsors.</li>
        <li>Pay what you want, with no paywall behind it.</li>
        <li>Grants, where the software does something a fund already cares about.</li>
      </ul>
      <p>
        What would make people more willing is a public ledger: what the thing costs to run, kept up to date. I wouldn&apos;t put my own hours on it, but there are
        tools for open-source projects that log time like tickets, and a project with helpers could use one.
      </p>

      <h2>Money isn&apos;t the engine</h2>
      <p>
        Most people who build free software do it because they like making things people use. That pull is stronger than the money, and I think it&apos;s
        what would keep someone going even if their day job was bagging groceries.
      </p>
      <p>
        But it has a limit. Someone working long hours for low pay may not have the energy left over, and burnout ends a lot of free software. That&apos;s why I
        care so much about the two halves above: keep the code small enough to leave alone, and fund the part that needs a person every day.
      </p>

      <h2>Where I might be wrong</h2>
      <ul>
        <li>$390 in its first two months, mostly from people I know, is not a trend. I&apos;d want a year of it before saying this works.</li>
        <li>Creators earn on Patreon because they keep showing up with something new. A finished app that never changes may be easy to forget to support.</li>
        <li>&ldquo;Left alone&rdquo; is a goal, not a promise. Browsers, hosts and security problems all move, whether I do or not.</li>
      </ul>
    </Note>
  );
}
