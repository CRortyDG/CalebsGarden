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
 * people use the site now, or null for no claim. Measured 22 Nov 2026 from the Upstash usage
 * tab (Fixed 250MB, two regions):
 * - Bandwidth is the limit that matters: 6 GB of the plan's 50 GB a month, 1 to 22 November,
 *   about 270 MB a day (both regions), for about 350 visitors a day. That's under 1 MB per
 *   visitor-day.
 * - 50 GB a month is about 1.67 GB a day, which at that rate is a bit over 2,000 visitors a day.
 *   Spikes don't matter on their own; the allowance is monthly.
 * - Storage is 11 MB of 250 MB, and the plan doesn't cap commands (50M so far this month).
 * Re-check against the usage tab when traffic or features change.
 */
export const MADTOWN_CAPACITY_PER_DAY: number | null = 2000;

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
