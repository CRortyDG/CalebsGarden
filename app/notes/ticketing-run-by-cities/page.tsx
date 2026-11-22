import Link from 'next/link';
import { Note, noteMetadata } from '../_parts/Note';

const SLUG = 'ticketing-run-by-cities';
export const metadata = noteMetadata(SLUG);
export const revalidate = 3600; // a scheduled note goes live within the hour of its day

export default function Page() {
  return (
    <Note slug={SLUG} kind="idea">
      <p>
        I haven&apos;t built this, and I might be wrong about parts of it. But it&apos;s the clearest example I have of something I keep coming back to: a lot of
        software is built for global scale when it would work better as many local copies.
      </p>

      <h2>The idea</h2>
      <p>Ticketing for concerts, shows and local events, built like this:</p>
      <ol>
        <li>
          <strong>Open-source software</strong>, so anyone can see how it works and nobody owns the only copy.
        </li>
        <li>
          <strong>Backed by a nonprofit</strong>, whose job is to keep the software healthy and the fees low, not to grow a margin.
        </li>
        <li>
          <strong>Run locally by chapters.</strong> Wisconsin has its own deployment, run by people in Wisconsin. Minnesota has its own. Each chapter knows its
          venues, its promoters and its scene.
        </li>
        <li>
          <strong>Joined by a shared layer.</strong> Someone on wisconsintickets can still find and buy a show in Minneapolis. On screen it&apos;s one search. Behind
          it, Wisconsin&apos;s system asks Minnesota&apos;s system, and that request is metered, so each chapter is paid fairly for the work its system does.
        </li>
      </ol>

      <h2>Why local copies instead of one big platform</h2>
      <p>
        A ticket is about as local as software gets. It&apos;s for one room, on one night, in one town. The people best placed to run that are close to it: they know
        which venue double-books, which promoter is reliable, which local band is about to sell out the bigger room.
      </p>
      <p>
        One national platform makes the opposite trade. It gets economies of scale, and in exchange every city&apos;s scene runs on the same rules, pays into the
        same company, and has no say in how it works. With local chapters, a bad decision in one place stays in one place, and a good idea can be copied by the
        others because the code is open.
      </p>
      <p>
        This is the same pattern I already use at a smaller size. madtown.today&apos;s answer to a second city is a second copy built from the same code, with its own
        content and data. I wrote more about that in{' '}
        <Link href="/case-studies/built-for-one-place">Built for one place</Link>.
      </p>

      <h2>The hard parts</h2>
      <p>This is where I&apos;d expect the idea to get tested, and where I don&apos;t have answers yet.</p>
      <ul>
        <li>
          <strong>Money.</strong> A nonprofit still has to pay for servers, payment processing, support and fraud. The fee has to cover that, and someone has to
          start it before there&apos;s a fee to collect.
        </li>
        <li>
          <strong>Trust between chapters.</strong> If Wisconsin sells a Minnesota ticket, who holds the money, who refunds it, and what happens when a chapter&apos;s
          system goes down on a big on-sale day?
        </li>
        <li>
          <strong>Bots and scalpers.</strong> Big on-sales attract them. A small local system needs defences without needing a large security team.
        </li>
        <li>
          <strong>Venue contracts.</strong> Many venues already have exclusive deals with existing ticketing companies. A new system starts with the venues that
          don&apos;t.
        </li>
        <li>
          <strong>The shared layer.</strong> It has to be simple enough that a chapter run by a handful of people can keep it working: a small, boring protocol, not
          another platform.
        </li>
      </ul>

      <h2>Where I&apos;d start</h2>
      <p>
        Small, and local: one city, the venues and bands that already sell their own tickets, and nothing federated until a second chapter actually wants in. The
        shared layer is the most interesting part, and it should be the last part built.
      </p>
      <p>If you run a venue, a promoter or a nonprofit and this sounds either right or naive, I&apos;d like to hear which.</p>
    </Note>
  );
}
