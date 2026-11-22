// madtown.today's public counts (its /api/public-stats), read on the server and kept for
// 12 hours, so calebs.garden asks at most twice a day. Any failure gives null and the page
// shows the costs without the counts.

export type MadtownDay = { date: string; visitors: number; returning: number | null; gamesFinished: number };
export type MadtownStats = { updated: string; visitorsSinceLaunch: number; days: MadtownDay[] };

export const MADTOWN_STATS_URL = process.env.MADTOWN_STATS_URL ?? 'https://madtown.today/api/public-stats';
export const REVALIDATE_SECONDS = 43200;

/**
 * What madtown.today costs a month, as c chose to show it (November 2026): the 250 MB fixed
 * Upstash Redis plan, $15 (c, 22 Nov 2026). Hosting the site itself is c's own choice and isn't tied to how many
 * people use it, so it isn't shown here (c, 22 Nov 2026).
 */
export const MADTOWN_COSTS = [
  { item: 'Upstash Redis, 250 MB', note: 'counters, presence, the guestbook', usd: 15 },
] as const;
/** Shown under every madtown.today cost on the site, so the number says what it is. */
export const MADTOWN_COST_FOOTNOTE = 'The 250 MB Upstash Redis database that holds everything.';
export const MADTOWN_MONTHLY_USD = MADTOWN_COSTS.reduce((s, c) => s + c.usd, 0);

/**
 * Roughly how many people a day the $15 plan carries before it needs an upgrade, at the way
 * people use the site now, or null for no claim. Estimated 22 Nov 2026, not measured:
 * - Fixed Upstash plans don't bill per command; the limits that bite are monthly bandwidth
 *   (50 GB on the 250 MB plan) and 250 MB of data.
 * - Bandwidth is the first to run out. Almost all of it is the Who's here card polling
 *   /api/room every 4 s while 2+ people are online; each poll reads the day's canvas, the
 *   last 40 events and the online list, about 10 KB. Oct 24 to Nov 21 had 4.56M function
 *   calls for ~376 visitors a day, so about 3.7 MB of Redis traffic per visitor a day, or
 *   about 110 MB a month for each daily visitor. 50 GB / 110 MB is about 450; rounded
 *   down because the online list grows with the crowd. That's close to today's traffic,
 *   which is the point: the Durable Object move takes this polling off Redis.
 * - Data is small (the per-day canvases and counters, tens of MB), so it isn't close yet.
 * Re-check against the Upstash usage tab (monthly bandwidth and data size) when it changes.
 */
export const MADTOWN_CAPACITY_PER_DAY: number | null = 400;

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
