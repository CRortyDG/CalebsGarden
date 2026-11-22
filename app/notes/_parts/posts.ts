/** Notes: dated, shorter posts. Ideas, opinions and things in progress, unlike the case studies. */
export type Post = { slug: string; title: string; date: string; summary: string };

// Newest first. date is the US Central date it goes out (YYYY-MM-DD). A post dated in the
// future stays hidden everywhere (index, feed, sitemap, llms.txt, its own page) until that
// day; pages under /notes re-check every hour, so it appears within an hour of midnight.
export const allPosts: Post[] = [
  {
    slug: 'one-person-fifty-apps',
    title: 'Can one person look after fifty community apps?',
    date: '2026-11-22',
    summary:
      'I think so, if they’re built to be left alone. With no growth target there’s no emergency, so the work is upkeep, not new features. The apps that need a support desk, like ticketing, only get built when the people who need them commit to backing them.',
  },
  {
    slug: 'can-free-software-pay-for-itself',
    title: 'Can free community software pay a person?',
    date: '2026-11-22',
    summary:
      'Hosting is the easy part. The real question is someone’s time. I think it can work the way Patreon does: people back the person keeping something going, not the code. That works best when the code can be left alone and the ongoing work is content and people.',
  },
  {
    slug: 'who-comes-back',
    title: 'Who comes back to madtown.today',
    date: '2026-11-22',
    summary:
      'Visitors a day is the number people ask about. The one I watch is who comes back. About 300 regulars stayed put through every spike, half of new visitors leave without playing, and a lost game brings people back almost as well as a won one. A game they get stuck in doesn’t.',
  },
  {
    slug: 'what-madtown-today-actually-costs',
    title: 'What madtown.today actually costs, and the plan to cut it',
    date: '2026-11-22',
    summary:
      'I thought madtown.today’s bill was a heartbeat. Most of it was a monitoring add-on and a tab that asks the server for news every 4 seconds. The plan: move the live parts to a Cloudflare Durable Object, then the site, and take the bill from about $50 a month to about $5.',
  },
  {
    slug: 'three-tests-that-didnt-win',
    title: 'Three tests on madtown.today that didn’t win',
    date: '2026-11-21',
    summary:
      'I ran three A/B tests on what a first-time visitor sees on madtown.today. One looked like a win on 124 people and disappeared on 840. None moved the number I cared about: whether people came back the next day.',
  },
  {
    slug: 'build-the-meter-first',
    title: 'Build the meter first',
    date: '2026-11-19',
    summary:
      'Before I put a number on how many groups Candlefair can host for free, I had it count what each game actually uses and price it against Cloudflare’s limits. The meter came first; the claim waits for real games.',
  },
  {
    slug: 'why-i-dont-put-ai-in-my-apps',
    title: 'Why I don’t put AI in my apps',
    date: '2026-11-16',
    summary:
      'I use AI for almost everything I build, and neither of my apps has a chatbot. People using them don’t want one. The AI stays behind the scenes, or comes in from outside through MCP, when someone chooses to bring their own.',
  },
  {
    slug: 'ticketing-run-by-cities',
    title: 'What if every city ran its own ticketing?',
    date: '2026-10-29',
    summary:
      'An idea I haven’t built: open-source ticketing backed by a nonprofit, run as a separate copy in each city or state by a local chapter, with a shared layer so one city’s site can sell another city’s shows.',
  },
  {
    slug: 'local-radio-for-third-spaces',
    title: 'Local radio for third spaces, for about $5 a month',
    date: '2026-10-15',
    summary:
      'An internet radio stream for coffee shops and other third spaces, with local bands mixed in. The bandwidth turns out to cost about $5 a month for 50 shops. The hard part is people: giggly plays bands who give it permission directly, so it needs no licenses, just a lot of conversations.',
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
