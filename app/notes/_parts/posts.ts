/** Notes: dated, shorter posts. Ideas, opinions and things in progress, unlike the case studies. */
/** idea: not built (a proposal). working: maths or a plan in progress. note: an opinion or something that happened. */
export type Kind = 'idea' | 'working' | 'note';
export type Post = { slug: string; title: string; date: string; kind: Kind; summary: string };

/** The label shown next to a note's date, on its page and in the list. */
export const kindLabel: Record<Kind, string> = { idea: 'An idea, not built', working: 'Working it out', note: 'Note' };

// Newest first. date is the US Central date it really goes out (YYYY-MM-DD). Never backdate: a
// note's date is when it was posted, and the idea's age goes in the text instead. The four dated
// 21 November went up together; the rest go out one at a time. A post dated in the
// future stays hidden everywhere (index, feed, sitemap, llms.txt, its own page) until that
// day; pages under /notes re-check every hour, so it appears within an hour of midnight.
export const allPosts: Post[] = [
  {
    slug: 'none-of-this-is-new',
    title: 'None of this is new',
    date: '2026-11-24',
    kind: 'note',
    summary:
      'Software sized to one group, cheap and without accounts, isn’t my idea. Clay Shirky called it situated software in 2004, Robin Sloan called an app a home-cooked meal, and the local-first and small web people are building it now. What I can add is two running apps and their receipts.',
  },
  {
    slug: 'one-person-fifty-apps',
    title: 'Can one person look after fifty community apps?',
    date: '2026-12-11',
    kind: 'note',
    summary:
      'I think so, if they’re built to be left alone. With no growth target there’s no emergency, so the work is upkeep, not new features. The apps that need a support desk, like ticketing, only get built when the people who need them commit to backing them.',
  },
  {
    slug: 'can-free-software-pay-for-itself',
    title: 'Can free community software pay a person?',
    date: '2026-12-08',
    kind: 'note',
    summary:
      'Hosting is the easy part. The real question is someone’s time. I think it can work the way Patreon does: people back the person keeping something going, not the code. That works best when the code can be left alone and the ongoing work is content and people.',
  },
  {
    slug: 'build-the-meter-first',
    title: 'Build the meter first',
    date: '2026-12-04',
    kind: 'note',
    summary:
      'Before I put a number on how many groups Candlefair can host for free, I had it count what each game actually uses and price it against Cloudflare’s limits. The meter came first; the claim waits for real games.',
  },
  {
    slug: 'local-radio-for-third-spaces',
    title: 'Local radio for third spaces, for about $5 a month',
    date: '2026-12-01',
    kind: 'idea',
    summary:
      'An idea I haven’t built yet: an internet radio stream for coffee shops and other third spaces, with local bands mixed in. The bandwidth turns out to cost about $5 a month for 50 shops. The hard part is people: giggly plays bands who give it permission directly, so it needs no licenses, just a lot of conversations.',
  },
  {
    slug: 'why-i-dont-put-ai-in-my-apps',
    title: 'Why I don’t put AI in my apps',
    date: '2026-11-27',
    kind: 'note',
    summary:
      'I use AI for almost everything I build, and neither of my apps has a chatbot. People using them don’t want one. The AI stays behind the scenes, or comes in from outside through MCP, when someone chooses to bring their own.',
  },
  {
    slug: 'who-comes-back',
    title: 'Who comes back to madtown.today',
    date: '2026-11-21',
    kind: 'note',
    summary:
      'Visitors a day is the number people ask about. The one I watch is who comes back. About 300 regulars stayed put through every spike, half of new visitors leave without playing, and a lost game brings people back almost as well as a won one. A game they get stuck in doesn’t.',
  },
  {
    slug: 'what-madtown-today-actually-costs',
    title: 'What madtown.today actually costs, and the plan to cut it',
    date: '2026-11-21',
    kind: 'working',
    summary:
      'I thought madtown.today’s bill was a heartbeat. Most of it was a monitoring add-on and a tab that asks the server for news every 4 seconds. The plan: move the live parts to a Cloudflare Durable Object, then the site, and take what I pay from about $45 a month to about $5.',
  },
  {
    slug: 'three-tests-that-didnt-win',
    title: 'Three tests on madtown.today that didn’t win',
    date: '2026-11-21',
    kind: 'note',
    summary:
      'I ran three A/B tests on what a first-time visitor sees on madtown.today. One looked like a win on 124 people and disappeared on 840. None moved the number I cared about: whether people came back the next day.',
  },
  {
    slug: 'ticketing-run-by-cities',
    title: 'What if every city ran its own ticketing?',
    date: '2026-11-21',
    kind: 'idea',
    summary:
      'An idea I haven’t built: open-source ticketing backed by a nonprofit, run as a separate copy in each city or state by a local chapter, with a shared layer so one city’s site can sell another city’s shows.',
  },
];

/** Today's date in Madison, YYYY-MM-DD. */
export const centralToday = (now: Date = new Date()) => now.toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });

/** Vercel preview deployments show scheduled posts early, so they can be read before they go out. */
export const showsScheduled = () => process.env.VERCEL_ENV === 'preview';

export const isDue = (p: Post, now: Date = new Date()) => p.date <= centralToday(now);
export const isLive = (p: Post, now: Date = new Date()) => isDue(p, now) || showsScheduled();

/** The posts that are out, newest first. */
export const livePosts = (now: Date = new Date()) => allPosts.filter((p) => isLive(p, now)).sort((a, b) => b.date.localeCompare(a.date));

export const postUrl = (slug: string) => `/notes/${slug}`;

export function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}
