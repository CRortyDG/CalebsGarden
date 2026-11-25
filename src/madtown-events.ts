// The moments on madtown.today's timeline (/madtown): where people heard about it, and what
// changed on the site. Hand-kept, because no counter knows why a day spiked. Feature dates
// come from madtown's release history; traffic dates from its first-visit sources, where a
// spike of new browsers from one place stands out. The widget adds each day's own numbers
// (how many were new, how many came back), so the text here only says what happened.

export type EventKind = 'post' | 'story' | 'press' | 'feature' | 'test';

export interface MadtownEvent {
  /** The Madison day it happened, YYYY-MM-DD. */
  date: string;
  kind: EventKind;
  /** A few words, shown on the bud's label. */
  title: string;
  /** One or two sentences. */
  body: string;
  /** A Gazette story's slug: its card then shows who landed on the story and what they did next. */
  article?: string;
}

export const EVENT_KINDS: Record<EventKind, string> = {
  post: 'Shared',
  story: 'Gazette',
  press: 'Press',
  feature: 'Shipped',
  test: 'Tested',
};

export const MADTOWN_EVENTS: MadtownEvent[] = [
  {
    date: '2026-09-29',
    kind: 'feature',
    title: 'Counting starts',
    body: 'The first day madtown.today kept a count of who visited and who came back.',
  },
  {
    date: '2026-10-04',
    kind: 'post',
    title: 'Posted on Reddit',
    body: 'A link on Reddit brought the biggest wave of new people so far, over two days.',
  },
  {
    date: '2026-10-06',
    kind: 'feature',
    title: 'A reason to come back',
    body: 'A progress strip, “Next” buttons, an all-done card and a morning report of yesterday’s results, all for someone’s first visit.',
  },
  {
    date: '2026-10-12',
    kind: 'feature',
    title: 'New front page',
    body: 'A redesigned homepage, and the word-groups puzzle got its local name: Four Lakes.',
  },
  {
    date: '2026-10-18',
    kind: 'feature',
    title: 'Lap and the archive',
    body: 'A fourth daily puzzle, Lap, and an archive of every Gazette story.',
  },
  {
    date: '2026-10-19',
    kind: 'post',
    title: 'Shared on Reddit',
    body: 'A Reddit link brought about a hundred new people over two days, starting the day Lap launched.',
  },
  {
    date: '2026-10-20',
    kind: 'test',
    title: 'Test: Chair Stack first',
    body: 'Half of new visitors got Chair Stack alone instead of the homepage. Fewer of them started a game, so the homepage stayed.',
  },
  {
    date: '2026-10-21',
    kind: 'post',
    title: 'Shared on Reddit',
    body: 'Two days of people arriving from Reddit threads.',
  },
  {
    date: '2026-10-22',
    kind: 'feature',
    title: 'Webring and a town vote',
    body: 'A “random Madison website” webring, and Madison Asks moved to the top band.',
  },
  {
    date: '2026-10-24',
    kind: 'test',
    title: 'Test: Ask first',
    body: 'New visitors were split again, this time with the daily poll on top. Twice as many voted. No more came back, so the test ended without a winner.',
  },
  {
    date: '2026-10-26',
    kind: 'post',
    title: 'Posted on Reddit again',
    body: 'Another Reddit link, the start of a week of steady arrivals from it.',
  },
  {
    date: '2026-10-29',
    kind: 'post',
    title: 'Reddit, once more',
    body: 'One more Reddit link, the last of the October run, bringing about 80 new people in a day.',
  },
  {
    date: '2026-11-03',
    kind: 'post',
    title: 'Reddit, Election Day',
    body: 'A Reddit thread on Election Day, the same day a Gazette satire ran.',
    article: 'overaged-patrons',
  },
  {
    date: '2026-11-04',
    kind: 'story',
    title: 'A Gazette satire takes off',
    body: 'A satire piece in the Madtown Gazette, about a neighborhood that wanted a concert moved close enough to object to, went round Reddit. About 1,600 people read it, most of them in two days.',
    article: 'noah-kahan-petition',
  },
  {
    date: '2026-11-05',
    kind: 'feature',
    title: 'Comments on stories',
    body: 'Gazette stories got a comment box and nicknames, the day after the satire took off.',
  },
];
