import Link from 'next/link';
import { Note, noteMetadata } from '../_parts/Note';
import { BITRATES, INCLUDED_GB, mbPerHour as mbPerHourAt, monthlyCost, SERVER_USD, transferGb } from './maths';
import CafeScreen from './CafeScreen';
import RadioCalc from './RadioCalc';

const SLUG = 'local-radio-for-third-spaces';
export const metadata = noteMetadata(SLUG);
export const revalidate = 3600; // a scheduled note goes live within the hour of its day

// The defaults on the page. The formulas live in maths.ts, shared with the calculator.
const KBPS = 192;
const SHOPS = 50;
const HOURS = 8;
const DAYS = 30;
const bytesPerHour = (KBPS * 1000 * 3600) / 8; // bits per second → bytes per hour
const mbPerHour = bytesPerHour / 1e6; // 86.4
const listenerHours = SHOPS * HOURS * DAYS; // 12,000
const gbPerMonth = transferGb(KBPS, SHOPS, HOURS, DAYS); // ≈ 1,036.8
const overage = monthlyCost(gbPerMonth) - SERVER_USD;
const concurrentMbps = (SHOPS * KBPS) / 1000; // 9.6

const fmt = (n: number, d = 0) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

export default function Page() {
  const LABEL: Record<number, string> = {
    128: 'Fine for talk, thin for music',
    192: 'Good background music',
    256: 'Hard to tell from the original',
    320: 'The most MP3 allows',
  };
  const rows = BITRATES.map((kbps) => {
    const gb = transferGb(kbps, SHOPS, HOURS, DAYS);
    return { kbps, gb, cost: monthlyCost(gb), peak: (SHOPS * kbps) / 1000 };
  });
  return (
    <Note slug={SLUG} kind="working">
      <p>
        Third spaces are the places that aren&apos;t home or work: coffee shops, record stores, bars, bookshops. Many of them play music all day, usually from a
        streaming service, and I&apos;d guess very little of it comes from the town they&apos;re in. The idea is giggly radio: a free stream made for those places, of music by
        local bands, where every song points to that band&apos;s next show in town.
      </p>
      <p>
        Audio streaming has a reputation for expensive bandwidth, so before anything else I wanted to know whether it could be cheap enough to give away. It can.
      </p>

      <h2>The maths</h2>
      <p>Assume 50 coffee shops, each playing the stream 8 hours a day, 30 days a month, at {KBPS} kbps.</p>
      <ul>
        <li>
          {KBPS} kbps is {KBPS} thousand bits a second, or {fmt(bytesPerHour / 3600 / 1000)} kilobytes a second, which is <strong>{fmt(mbPerHour, 1)} MB an hour</strong> for
          one listener.
        </li>
        <li>
          {SHOPS} shops × {HOURS} hours × {DAYS} days is <strong>{fmt(listenerHours)} listening hours</strong> a month.
        </li>
        <li>
          {fmt(listenerHours)} × {fmt(mbPerHour, 1)} MB is about <strong>{fmt(gbPerMonth)} GB</strong>, just over 1 TB a month.
        </li>
        <li>
          At the busiest moment that&apos;s {SHOPS} streams at once: <strong>{fmt(concurrentMbps, 1)} Mbps</strong> of outgoing bandwidth. A home internet connection
          could almost do it.
        </li>
      </ul>
      <p>
        Akamai&apos;s smallest Linode server, the Nanode 1 GB, is $5 a month and includes 1 TB of outgoing transfer. Beyond that, transfer is $0.005 per GB, which is
        $5 per extra terabyte. So the whole month comes to about <strong>${fmt(5 + overage, 2)}</strong>: the $5 server plus {fmt(gbPerMonth - INCLUDED_GB)} GB over
        the allowance.
      </p>
      <p>
        (I&apos;d remembered this as &ldquo;10 GB per $5&rdquo;. It&apos;s a hundred times better than that: 1 TB per $5.)
      </p>

      <h3>At other bitrates</h3>
      <p>
        192 kbps is a sensible floor for music in a shop. 320 kbps is the ceiling for MP3, and few people can hear the difference over a café speaker. Other
        formats, like AAC and Opus, sound as good at lower bitrates, which would make every number here smaller.
      </p>
      <div className="cs-table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Bitrate</th>
              <th scope="col">Roughly</th>
              <th scope="col">Per listener-hour</th>
              <th scope="col">{SHOPS} shops, {HOURS}h × {DAYS} days</th>
              <th scope="col">Peak</th>
              <th scope="col">Monthly cost</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.kbps}>
                <td>{r.kbps} kbps</td>
                <td>{LABEL[r.kbps]}</td>
                <td>{fmt(mbPerHourAt(r.kbps), 1)} MB</td>
                <td>{fmt(r.gb)} GB</td>
                <td>{fmt(r.peak, 1)} Mbps</td>
                <td>${fmt(r.cost, 2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        Even at 320 kbps, 50 shops come to about ${fmt(rows[rows.length - 1].cost, 2)} a month. Try other sizes:
      </p>
      <RadioCalc />
      <p>
        Prices are from Akamai&apos;s <a href="https://www.akamai.com/cloud/pricing/cpu">shared CPU pricing page</a>. I re-checked them on 21 November 2026, and the numbers here use that check. The page says prices
        vary by region, so check yours. Bandwidth only; the table leaves out everything else.
      </p>
      <p>
        One more way to see it: past the included terabyte, every extra hour of listening costs about {fmt(mbPerHour * 0.005 / 1000 * 100, 3)} cents in transfer. A shop open 8 hours
        a day for a month costs about {fmt(mbPerHour * HOURS * DAYS / 1000 * 0.005 * 100, 0)} cents. Bandwidth isn&apos;t the problem.
      </p>

      <h2>How it would run</h2>
      <p>
        One small server running a streaming server (Icecast is the usual open-source choice) sends the same stream to every shop. Each shop opens a link on
        whatever already plays music: a laptop, a phone, a cheap speaker. No accounts, in the same spirit as{' '}
        <Link href="/case-studies/the-browser-is-the-account">madtown.today</Link>.
      </p>
      <p>
        Every shop hears the same thing at the same time, which is the point of radio: a band played at 3pm is played in every shop in town at 3pm. If it grew past
        one server, a second cheap server in front could relay the stream, and the bill would still be around $10 a month.
      </p>

      <h2>What a shop would see</h2>
      <p>The stream is half of it. The other half is a screen, so &ldquo;who is this?&rdquo; has an answer. The loop I&apos;ve prototyped goes like this:</p>
      <ol>
        <li>
          <strong>Bands opt in</strong> and give giggly songs to play.
        </li>
        <li>
          <strong>Cafés stream it for free</strong> on their speakers, with a TV or tablet showing what&apos;s on.
        </li>
        <li>
          <strong>Someone in the room wonders who it is.</strong> The screen shows the band, their next show and a code to scan.
        </li>
        <li>
          <strong>The scan opens the venue&apos;s own ticket page.</strong> No app and no account. If each code is unique to a café and a show, a venue could see
          which shops send people its way.
        </li>
      </ol>
      <CafeScreen />
      <p>
        That last step is what makes it more than background music: the shop gets music that&apos;s actually from here, the band gets heard in its own city, and the
        venue gets people through the door.
      </p>

      <h2>The part that isn&apos;t cheap: rights, and people</h2>
      <p>
        In the US, playing music in a business is a public performance, and that needs a license. Businesses usually get it from the performing rights
        organizations, such as ASCAP, BMI, SESAC and GMR, which collect for songwriters and publishers. Streams online can also owe for the recordings themselves.
        The commonly cited small-business exemption is for FCC-licensed radio and TV broadcasts, and, as I understand it, it doesn&apos;t cover internet streams.
      </p>
      <p>
        giggly&apos;s answer is to not need those licenses at all. It plays music from bands who give it permission directly: local acts who agree, in writing,
        that the stream and the shops can play their songs. giggly makes no money, so it isn&apos;t taking anything from them. It&apos;s the same idea as the rest of
        what I build: free or nearly free software, given away.
      </p>
      <p>
        Every band I&apos;ve talked to so far has been for it. Streaming services pay them close to nothing anyway, and being played in a local coffee shop, with a
        nudge toward their next show at a nearby venue, can only help.
      </p>
      <p>
        That makes the bandwidth the easy part and the relationships the heavy lift. Each band is a conversation, and the stream is only as big as the number of
        bands who say yes. One catch to get right: a band can only give permission for songs whose rights it controls. If its songs are registered with a rights
        organization, or it&apos;s signed to a label, the shop may still need that organization&apos;s license. That needs a music lawyer to check before it grows. I&apos;m
        not one, and none of this is legal advice.
      </p>

      <h2>Open questions</h2>
      <ul>
        <li>How many bands does it take before the stream doesn&apos;t repeat itself every afternoon?</li>
        <li>Do shops want a say in the mix, or is the shared stream the appeal?</li>
        <li>How does a shop show what&apos;s playing, and point people to the band&apos;s next show?</li>
        <li>Does one stream per city make sense, like the copies in <Link href="/case-studies/built-for-one-place">Built for one place</Link>?</li>
      </ul>
    </Note>
  );
}
