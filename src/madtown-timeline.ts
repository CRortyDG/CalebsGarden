// madtown.today's whole history, day by day (its /api/public-timeline), for the animated
// timeline on /madtown. Counts only: madtown works every number out inside its database and
// never sends ids. Read on the server and kept for 12 hours; any failure gives null and the
// page says the numbers are resting instead of drawing an empty chart.

export const SOURCES = ['reddit', 'search', 'social', 'otherSite', 'sharedResult', 'postedLink', 'direct'] as const;
export type Source = (typeof SOURCES)[number];

export type TimelineDay = {
  date: string;
  /** Unique browsers that Madison day. Null only in a partial export. */
  visitors: number | null;
  /** Of them, here the day before too. */
  returning: number | null;
  /** First seen that day. */
  newBrowsers: number;
  /** Where the new browsers came from; null before sources were recorded. */
  sources: Record<Source, number> | null;
  /** New browsers who started a daily game that same day. */
  newStarted: number | null;
  /** Visitors who started a daily game. */
  startedAny: number | null;
  /** New browsers back exactly 1 / 7 days later; null until that day has passed. */
  back1: number | null;
  back7: number | null;
  /** Here on 3+ of the 7 days ending this day, out of weekBrowsers here at all. */
  regulars: number | null;
  weekBrowsers: number | null;
  gamesFinished: number;
};

export type MadtownTimeline = {
  updated: string;
  visitorsSinceLaunch: number;
  regularDays: number;
  days: TimelineDay[];
};

export const MADTOWN_TIMELINE_URL = process.env.MADTOWN_TIMELINE_URL ?? 'https://madtown.today/api/public-timeline';
const REVALIDATE_SECONDS = 43200;

function valid(x: unknown): x is MadtownTimeline {
  const t = x as MadtownTimeline;
  return (
    !!t &&
    typeof t.visitorsSinceLaunch === 'number' &&
    Array.isArray(t.days) &&
    t.days.length > 1 &&
    t.days.every((d) => typeof d.date === 'string' && typeof d.newBrowsers === 'number')
  );
}

export async function getMadtownTimeline(): Promise<MadtownTimeline | null> {
  try {
    const res = await fetch(MADTOWN_TIMELINE_URL, { next: { revalidate: REVALIDATE_SECONDS }, signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const body: unknown = await res.json();
    if (!valid(body)) return null;
    return { updated: body.updated, visitorsSinceLaunch: body.visitorsSinceLaunch, regularDays: body.regularDays ?? 3, days: body.days };
  } catch {
    return null;
  }
}
