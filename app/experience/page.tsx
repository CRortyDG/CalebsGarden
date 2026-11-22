import type { Metadata } from 'next';
import Link from 'next/link';
import '../case-studies/_shared/case-study.css';
import './experience.css';
import { allPosts, isLive, postUrl } from '../notes/_parts/posts';
import { experience, site, testimonials } from '@/projects';

export const revalidate = 3600; // the links to notes appear once those notes are out

const description =
  'Caleb’s experience: infrastructure at a banking startup, sole developer for a statewide radio network’s 25 Next.js apps, hosting for 150+ client sites, rooftop radios for an ISP. Plus the receipts from the two apps he runs: tests, CI, a written threat model, deploys, backups and real incidents.';

export const metadata: Metadata = {
  title: 'Experience',
  description,
  alternates: { canonical: '/experience' },
  openGraph: { type: 'profile', title: 'Experience · calebs.garden', description, url: '/experience', images: ['/og.jpg'] },
};

const CANDLEFAIR_REPO = 'https://github.com/CRortyDG/DnDBeyondTheWick';
const cf = (path: string) => `${CANDLEFAIR_REPO}/${path}`;

/** A link to a note once it's out, plain text before that. */
function NoteLink({ slug, children }: { slug: string; children: React.ReactNode }) {
  const p = allPosts.find((x) => x.slug === slug);
  return p && isLive(p) ? <Link href={postUrl(slug)}>{children}</Link> : <>{children}</>;
}

export default function Experience() {
  const contact = site.links;
  return (
    <main className="cs cs-essay xp">
      <p className="back">
        <Link href="/">← calebs.garden</Link>
      </p>

      <header className="cs-head">
        <p className="cs-kicker">Experience</p>
        <h1>Systems I&apos;ve kept running</h1>
        <p className="cs-dek">
          Eight years, mostly one arc: field and data center work at a Madison tech company, then its web team when that spun out on its own, then one of
          our clients, a statewide radio network, hiring me as its only developer. Now I run a banking startup&apos;s cloud. Below is what each job was and
          what I owned, then the receipts from the two apps I run myself.
        </p>
        {site.lookingFor && (
          <p className="xp-looking">
            {site.lookingFor}
            {contact[0] && (
              <>
                {' '}
                <a href={contact[0].href}>{contact[0].href.replace(/^mailto:/, '')}</a>
              </>
            )}
          </p>
        )}
        <dl className="cs-facts">
          <div>
            <dt>Now</dt>
            <dd>Infrastructure Engineer, N3XT</dd>
          </div>
          <div>
            <dt>Based</dt>
            <dd>Madison, WI · remote</dd>
          </div>
          <div>
            <dt>Code</dt>
            <dd>
              <a href={site.github}>github.com/CRortyDG</a>
            </dd>
          </div>
          {contact.length > 0 && (
            <div>
              <dt>Contact</dt>
              <dd>
                {contact.map((l, i) => (
                  <span key={l.href}>
                    {i > 0 && ' · '}
                    <a href={l.href}>{l.label}</a>
                  </span>
                ))}
              </dd>
            </div>
          )}
        </dl>
      </header>

      <aside className="cs-short" aria-label="In short">
        <p className="cs-short-label">In short</p>
        <ul className="xp-short">
          <li>Production infrastructure on GCP with Kubernetes and Terraform, and the CI/CD for a whole organization (N3XT).</li>
          <li>The only developer for 25 Next.js apps, their infrastructure and their production operations (Civic Media).</li>
          <li>Hosting and the client portal for 150+ client sites, and training the people who came after me (Design.Garden).</li>
          <li>
            Two apps of my own in production, with tests, CI, a written threat model, staging and real incidents written up. Both built with Claude Code; how
            that works is <a href="#ai">below</a>.
          </li>
        </ul>
      </aside>

      <nav className="cs-toc" aria-label="On this page">
        <p>On this page</p>
        <ol>
          <li>
            <a href="#jobs">Jobs</a>
          </li>
          <li>
            <a href="#receipts">Receipts from my own apps</a>
          </li>
          <li>
            <a href="#incidents">Two incidents</a>
          </li>
          <li>
            <a href="#ai">How I build with AI</a>
          </li>
          {testimonials.length > 0 && (
            <li>
              <a href="#said">What people say</a>
            </li>
          )}
        </ol>
      </nav>

      <article className="cs-prose">
        <h2 id="jobs">Jobs</h2>
        <ol className="xp-jobs">
          {experience.map((j) => (
            <li key={j.id} id={j.id} className="xp-job">
              <header>
                <h3>
                  {j.role} <span className="xp-org">· {j.org}</span>
                </h3>
                <p className="xp-when">
                  <time>{j.dates}</time> · {j.kind}
                </p>
              </header>
              <p>{j.scope}</p>
              <p className="xp-label">What I owned</p>
              <ul>
                {j.owned.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
              {j.outcomes && j.outcomes.length > 0 && (
                <>
                  <p className="xp-label">Results</p>
                  <ul>
                    {j.outcomes.map((o) => (
                      <li key={o}>{o}</li>
                    ))}
                  </ul>
                </>
              )}
              <p className="xp-systems">
                <span className="xp-label">Ran</span> {j.systems.join(' · ')}
              </p>
            </li>
          ))}
        </ol>

        <h2 id="receipts">Receipts from my own apps</h2>
        <p>
          I can&apos;t show you my employers&apos; code. I can show you the two things I run in my own time, for real people, on my own bill:{' '}
          <a href="https://dnd.calebs.garden">Candlefair</a>, a companion for D&amp;D night, and <a href="https://madtown.today">madtown.today</a>, a daily
          homepage for Madison. Candlefair&apos;s code is public, so most of these link straight to it. madtown.today&apos;s repository is private.
        </p>

        <section className="xp-receipt" aria-labelledby="r-candlefair">
          <h3 id="r-candlefair">
            Candlefair <a href={CANDLEFAIR_REPO}>source</a>
          </h3>
          <dl>
            <dt>Tests and CI</dt>
            <dd>
              999 tests across 70 files, behaviour-level, no mocks or snapshots, about 12 seconds. GitHub Actions runs the type checks and the whole suite on
              every pull request and every push to main (<a href={cf('blob/main/.github/workflows/test.yml')}>the workflow</a>).
            </dd>
            <dt>Testing the tests</dt>
            <dd>
              On Nov 17 I had the suite audited by planting 152 bugs and seeing which ones it caught: 86, or 57%. The audit also found the Worker layer had no
              tests and that there was no CI at all. CI went in that day. The Worker tests haven&apos;t yet.
            </dd>
            <dt>Security</dt>
            <dd>
              A <a href={cf('blob/main/SECURITY_AUDIT.md')}>written audit</a> that starts from a table of every secret, what it unlocks and how hard it is to
              guess. It added rate limits per screen and per address, a 15-minute lockout after 20 wrong guesses, caps on uploads, game size and open sockets,
              and a &ldquo;try to break it&rdquo; pass that closed five more holes. Tests for the abuse cases are in{' '}
              <a href={cf('blob/main/tests/abuse.test.ts')}>abuse.test.ts</a>.
            </dd>
            <dt>Threat model, honestly</dt>
            <dd>
              There are no accounts, so identity is a link. The DM&apos;s key is 192 random bits, stored only as a hash and compared in constant time. A
              player&apos;s name is tied to the first device that signs in with it: trust on first use, which the DM can reset. What the code can&apos;t stop
              is a flood using up the free plan&apos;s daily requests; that has to be stopped at Cloudflare&apos;s edge, and the audit says so.
            </dd>
            <dt>Deploys</dt>
            <dd>
              Every merge to main deploys itself through Cloudflare&apos;s Git integration. Every change goes through a pull request, and I merge each one
              myself: 152 so far. TVs left open on game night reload themselves after a deploy, between moments, so nobody is stuck on old code.
            </dd>
            <dt>Backups and recovery</dt>
            <dd>
              Each campaign is its own Durable Object with its own SQLite. The DM can download the whole game and its ledger as JSON and restore it from that
              file. There&apos;s no backup job of my own beyond that yet. Campaigns untouched for six months are deleted, with their images.
            </dd>
            <dt>Cost and capacity</dt>
            <dd>
              A <a href={cf('blob/main/CAPACITY_REPORT.md')}>capacity report</a> before launch, and a meter in the DM&apos;s settings that counts what each
              game actually uses against Cloudflare&apos;s limits. I don&apos;t publish a capacity number until real games fill it in (
              <NoteLink slug="build-the-meter-first">Build the meter first</NoteLink>).
            </dd>
          </dl>
        </section>

        <section className="xp-receipt" aria-labelledby="r-madtown">
          <h3 id="r-madtown">madtown.today</h3>
          <dl>
            <dt>Tests and CI</dt>
            <dd>
              110 unit test files and 31 Playwright end-to-end specs. CI runs lint, unit tests and a build on every ready pull request, and the end-to-end suite
              on pull requests into main, against a throwaway Redis behind the same REST emulator I use locally. It&apos;s budgeted around the 2,000 Actions
              minutes a month the plan includes.
            </dd>
            <dt>Where CI is now</dt>
            <dd>
              Red on main since early November, and I haven&apos;t fixed it yet. I&apos;d rather say that here than have you find it.
            </dd>
            <dt>Staging</dt>
            <dd>
              Features go to a <code>dev</code> branch, which deploys to its own address with its own database, then reach production in a release pull
              request; hotfixes go straight to main and back. Every non-production deploy shows a strip naming its environment, and the strip turns red and
              says &ldquo;connected to prod Redis&rdquo; if a preview is ever pointed at live data.
            </dd>
            <dt>Players&apos; data</dt>
            <dd>
              Streaks live only in each player&apos;s browser, and no backup can bring them back. So any change to a saved-game format has to read the old one
              too, and gets tried on staging first.
            </dd>
            <dt>Cost</dt>
            <dd>
              I read the invoices line by line. Most of the bill turned out to be a monitoring add-on and a tab asking the server for news every four seconds,
              not the thing I&apos;d assumed (
              <NoteLink slug="what-madtown-today-actually-costs">What madtown.today actually costs</NoteLink>).
            </dd>
          </dl>
        </section>

        <h2 id="incidents">Two incidents</h2>
        <p>Both from Candlefair, both found by using it rather than by a test, and both fixed in public.</p>

        <section className="xp-incident" aria-labelledby="i-dice">
          <h3 id="i-dice">The dice that wouldn&apos;t leave the TV</h3>
          <dl>
            <dt>What happened</dt>
            <dd>A dice roll shown on the TV sometimes never went away.</dd>
            <dt>First fix</dt>
            <dd>
              Each overlay set its dismiss timer in an effect keyed on the whole view, and every state update made a new view, which cancelled the timer. Keying
              it on the moment&apos;s id fixed it (<a href={cf('pull/47')}>#47</a>).
            </dd>
            <dt>It came back</dt>
            <dd>
              The fix was deployed, and the dice still stuck. TV tabs opened before the deploy were still running the old JavaScript. So the TV now notices a
              new build and reloads itself between moments, and the DM got a Clear TV button for anything else (<a href={cf('pull/50')}>#50</a>).
            </dd>
            <dt>Taken from it</dt>
            <dd>A fix isn&apos;t shipped until the screens already open have it.</dd>
          </dl>
        </section>

        <section className="xp-incident" aria-labelledby="i-wifi">
          <h3 id="i-wifi">&ldquo;Slow down&rdquo; at a table on one Wi-Fi</h3>
          <dl>
            <dt>What happened</dt>
            <dd>The DM kept getting &ldquo;Too many requests&rdquo; while approving purchases, without clicking quickly.</dd>
            <dt>Cause</dt>
            <dd>
              The rate limit counted per address, and a whole table shares one Wi-Fi address. I measured it: a DM, a TV and four phones made about 30 calls a
              minute in all, so no client was looping. The limit was simply keyed on the wrong thing.
            </dd>
            <dt>Fix</dt>
            <dd>
              The limit is now per screen (address, campaign and player), with a higher ceiling per address, and screens back off for half a minute on a 429
              instead of retrying (<a href={cf('pull/62')}>#62</a>).
            </dd>
          </dl>
        </section>

        <h2 id="ai">How I build with AI</h2>
        <p>
          Claude Code writes most of the code in Candlefair and madtown.today. I&apos;m not going to apologise for that, and I don&apos;t think it&apos;s the
          interesting part. The interesting part is what stays mine:
        </p>
        <ul>
          <li>
            <strong>The architecture and the constraints.</strong> One Durable Object per campaign, no accounts, free-tier economics as a hard limit. Moving
            Candlefair off Vercel and Upstash onto Cloudflare was my call, for cost and account reasons (the{' '}
            <Link href="/case-studies/cheap-enough-to-give-away">case study</Link> has the numbers).
          </li>
          <li>
            <strong>Review.</strong> Every change arrives as a pull request with tests, and nothing reaches main unless I merge it.
          </li>
          <li>
            <strong>Attacks on my own code.</strong> I ask for adversarial passes, not just features: the security audit, the &ldquo;try to break it&rdquo; pass,
            the capacity report, and the audit that planted bugs to see what the tests missed.
          </li>
          <li>
            <strong>Using it for real.</strong> I run my own games on Candlefair. Both incidents above were things I hit while using it, not things a test
            caught.
          </li>
          <li>
            <strong>Knowing when it&apos;s wrong.</strong> The first dice fix looked right and passed its tests, and it didn&apos;t hold. The test audit found a
            ledger test that would still pass with a refund going to the wrong player. Generated code, like any code, is wrong in ways that look right, so I
            check behaviour, not diffs.
          </li>
        </ul>

        {testimonials.length > 0 && (
          <>
            <h2 id="said">What people say</h2>
            {testimonials.map((t) => (
              <blockquote key={t.name}>
                <p>{t.quote}</p>
                <footer>
                  {t.name}, {t.role}
                </footer>
              </blockquote>
            ))}
          </>
        )}
      </article>

      <nav className="cs-series" aria-label="More">
        <h2>More</h2>
        <ol>
          <li>
            <Link href="/case-studies">Small software</Link>
            <span>The case studies: how madtown.today and Candlefair are built, and why they&apos;re small on purpose.</span>
          </li>
          <li>
            <Link href="/notes">Notes</Link>
            <span>Dated posts: ideas, opinions and the maths behind them.</span>
          </li>
        </ol>
      </nav>
    </main>
  );
}
