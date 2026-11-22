// madtown.today's public counts (its /api/public-stats), read on the server and kept for
// 12 hours, so calebs.garden asks at most twice a day. Any failure gives null and the page
// shows the costs without the counts.

export type MadtownDay = { date: string; visitors: number; returning: number | null; gamesFinished: number };
export type MadtownStats = { updated: string; visitorsSinceLaunch: number; days: MadtownDay[] };

export const MADTOWN_STATS_URL = process.env.MADTOWN_STATS_URL ?? 'https://madtown.today/api/public-stats';
export const REVALIDATE_SECONDS = 43200;

/** What madtown.today costs a month, in dollars, as c pays it (November 2026). */
export const MADTOWN_COSTS = [
  { item: 'Upstash Redis', note: 'counters, presence, the guestbook', usd: 15 },
  { item: 'Vercel', note: 'hosting', usd: 20 },
  { item: 'GitHub Actions', note: 'tests on every change, budgeted', usd: 15 },
] as const;
export const MADTOWN_MONTHLY_USD = MADTOWN_COSTS.reduce((s, c) => s + c.usd, 0);

/**
 * Roughly how many people a day the same monthly bill would carry before a plan has to go up.
 * An estimate, not a measurement: the Vercel Pro allowance (1 TB transfer, 10M edge requests a
 * month) divided by what a visit costs (about 50 requests, a couple of MB), with headroom.
 * Redis and CI are flat. Change it here if the real numbers say otherwise.
 */
export const MADTOWN_CAPACITY_PER_DAY = 5000;

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
