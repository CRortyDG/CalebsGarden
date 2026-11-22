// madtown.today's public counts (its /api/public-stats), read on the server and kept for
// 12 hours, so calebs.garden asks at most twice a day. Any failure gives null and the page
// shows the costs without the counts.

export type MadtownDay = { date: string; visitors: number; returning: number | null; gamesFinished: number };
export type MadtownStats = { updated: string; visitorsSinceLaunch: number; days: MadtownDay[] };

export const MADTOWN_STATS_URL = process.env.MADTOWN_STATS_URL ?? 'https://madtown.today/api/public-stats';
export const REVALIDATE_SECONDS = 43200;

/**
 * What madtown.today costs a month, as c chose to show it (November 2026): the 5 GB Upstash
 * Redis database, $15. Hosting the site itself is c's own choice and isn't tied to how many
 * people use it, so it isn't shown here (c, 22 Nov 2026).
 */
export const MADTOWN_COSTS = [
  { item: 'Upstash Redis, 5 GB', note: 'counters, presence, the guestbook', usd: 15 },
] as const;
/** Shown under every madtown.today cost on the site, so the number says what it is. */
export const MADTOWN_COST_FOOTNOTE = 'The 5 GB Upstash Redis database that holds everything.';
export const MADTOWN_MONTHLY_USD = MADTOWN_COSTS.reduce((s, c) => s + c.usd, 0);

/**
 * Roughly how many people a day the $15 plan carries before it needs an upgrade, at the way
 * people use the site now, or null for no claim. Estimated 22 Nov 2026, not measured:
 * - Fixed Upstash plans don't bill per command; the limits that bite are monthly bandwidth
 *   (500 GB on the 5 GB plan), 5 GB of data and 10,000 commands a second.
 * - Bandwidth is the first to run out. Almost all of it is the Who's here card polling
 *   /api/room every 4 s while 2+ people are online; each poll reads the day's canvas, the
 *   last 40 events and the online list, about 10 KB. Oct 24 to Nov 21 had 4.56M function
 *   calls for ~376 visitors a day, so about 3.7 MB of Redis traffic per visitor a day, or
 *   about 110 MB a month for each daily visitor. 500 GB / 110 MB is about 4,500; rounded
 *   down because the online list grows with the crowd.
 * - Data is small (the per-day canvases and counters, tens of MB), and commands peak in the
 *   tens a second, so neither is close.
 * Re-check against the Upstash usage tab (monthly bandwidth and data size) when it changes.
 */
export const MADTOWN_CAPACITY_PER_DAY: number | null = 4000;

function valid(x: unknown): x is MadtownStats {
  const s = x as MadtownStats;
  return !!s && typeof s.visitorsSinceLaunch === 'number' && Array.isArray(s.days) && s.days.every((d) => typeof d.visitors === 'number' && typeof d.date === 'string');
}

export async function getMadtownStats(): Promise<MadtownStats | null> {
  try {
    const res = await fetch(MADTOWN_STATS_URL, { next: { revalidate: REVALIDATE_SECONDS }, signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const body: unknown = await res.json();
    return valid(body) ? body : null;
  } catch {
    return null;
  }
}
