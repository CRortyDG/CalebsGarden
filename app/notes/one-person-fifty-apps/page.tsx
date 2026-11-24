import Link from 'next/link';
import { Note, noteMetadata } from '../_parts/Note';

const SLUG = 'one-person-fifty-apps';
export const metadata = noteMetadata(SLUG);
export const revalidate = 3600; // a scheduled note goes live within the hour of its day

export default function Page() {
  return (
    <Note slug={SLUG}>
      <p>
        There&apos;s a developer on TikTok who ships a new free website for teachers every day. That&apos;s the kind of thing I mean when I picture{' '}
        <Link href="/case-studies/sized-to-its-community">software sized to its community</Link> at scale: not one big platform, but lots of small tools, each
        for one group. Which raises the obvious question. Could one person keep fifty of them going without becoming the thing that holds them all up?
      </p>
      <p>I think so, as long as they&apos;re built for it.</p>

      <h2>No growth target, no emergency</h2>
      <p>
        Most software pressure comes from growth. There&apos;s a target, so there&apos;s a roadmap, so there&apos;s always something urgent. Take the target away
        and the bar becomes &ldquo;it still works the way it did yesterday.&rdquo; If it does, nothing is on fire.
      </p>
      <p>
        So looking after fifty apps isn&apos;t fifty products to grow. It&apos;s upkeep: a framework upgrade here, a security fix there. Spread a couple of hours
        across each one in turn and every app still gets looked at every couple of weeks, and none of them should need attention every day. It&apos;s closer to a
        host looking after a hundred and fifty WordPress sites than to running fifty companies, and people do that.
      </p>

      <h2>Where I&apos;m the bottleneck today</h2>
      <p>
        I have two apps, so it&apos;s a small sample, but it&apos;s telling. If I disappeared for two weeks, Candlefair would keep running. madtown.today would
        run out of puzzles, and only because I write them a week or two ahead. The code isn&apos;t the bottleneck. Daily content is, and that&apos;s a different
        job.
      </p>

      <h2>No support line</h2>
      <p>
        Nobody who bought a game on a disc expected it to come with a phone number. Somewhere along the way we started assuming every app has a person on the other
        end, ready to answer. These don&apos;t. Bug reports get read and fixed, because someone always maintains the thing. But there&apos;s no inbox that needs a
        reply by Monday, and I don&apos;t think there should be.
      </p>
      <p>
        That&apos;s a big part of why fifty is possible. Live support is what really doesn&apos;t scale for one person. Code does, if you keep it small.
      </p>

      <h2>What doesn&apos;t fit</h2>
      <p>
        Some software does need a support desk: anything that handles money, or where a mistake leaves real people stuck at a door. My{' '}
        <Link href="/notes/ticketing-run-by-cities">ticketing idea</Link> is like that, and it&apos;s also a much bigger build than either app I run. So I&apos;d only
        build it if a group of venues in one place came together and said they want it and will back it, staff included. The line I&apos;d draw: if it needs
        people on call, it needs an organization behind it, not one person.
      </p>

      <h2>Nothing has to die</h2>
      <p>
        If an app nobody uses costs nothing to run, it never needs to be switched off. A group can drift away and come back a year later to find it where they left
        it. That&apos;s the opposite of how big companies treat small products, which is why lists like Killed by Google exist. It&apos;s also only true for apps
        whose hosting really drops to zero when idle. Candlefair&apos;s does. madtown.today&apos;s doesn&apos;t yet, which is part of why{' '}
        <Link href="/notes/what-madtown-today-actually-costs">it&apos;s being rewritten</Link>.
      </p>

      <h2>Where I might be wrong</h2>
      <ul>
        <li>Two apps isn&apos;t fifty. A dependency that breaks all of them in the same week would test this fast.</li>
        <li>Every app needs a domain, and fifty of them adds up to hundreds a year before anyone visits.</li>
        <li>&ldquo;No support line&rdquo; holds until a lot of people depend on something. At some size, they&apos;ll expect an answer.</li>
      </ul>
    </Note>
  );
}
