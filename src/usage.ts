// What the projects cost to run and how many people use them, for the home page.
// Each project with numbers gets an entry; Candlefair joins once groups are playing it.

import { getMadtownStats, MADTOWN_CAPACITY_PER_DAY, MADTOWN_MONTHLY_USD } from '@/madtown-stats';

export interface ProjectUsage {
  /** Project id in src/projects.ts. */
  id: string;
  /** Average people a day over the last full week, or null when the live count is unavailable. */
  perDay: number | null;
  /** People since launch, or null. */
  sinceLaunch: number | null;
  /** What it costs a month, in dollars. */
  monthlyUsd: number;
  /** Roughly how many people a day the same monthly cost would carry (an estimate). */
  capacityPerDay?: number;
}

export interface Usage {
  projects: ProjectUsage[];
  /** Sum of perDay across projects that have one, or null if none do. */
  perDay: number | null;
  monthlyUsd: number;
}

export async function getUsage(): Promise<Usage> {
  const stats = await getMadtownStats();
  // leave out today, which is still filling in
  const week = stats?.days.slice(1, 8) ?? [];
  const madtown: ProjectUsage = {
    id: 'madtown',
    perDay: week.length ? Math.round(week.reduce((s, d) => s + d.visitors, 0) / week.length) : null,
    sinceLaunch: stats?.visitorsSinceLaunch ?? null,
    monthlyUsd: MADTOWN_MONTHLY_USD,
    capacityPerDay: MADTOWN_CAPACITY_PER_DAY,
  };
  const projects = [madtown];
  const counted = projects.filter((p) => p.perDay !== null);
  return {
    projects,
    perDay: counted.length ? counted.reduce((s, p) => s + (p.perDay ?? 0), 0) : null,
    monthlyUsd: projects.reduce((s, p) => s + p.monthlyUsd, 0),
  };
}
