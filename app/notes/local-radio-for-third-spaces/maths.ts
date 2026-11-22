// The radio note's maths, shared by the page and its calculator so they can't drift apart.
// Prices: Akamai shared CPU pricing, Nanode 1 GB, last checked 21 November 2026 (US Central).
export const SERVER_USD = 5;
export const INCLUDED_GB = 1000; // 1 TB of outgoing transfer a month included
export const OVERAGE_PER_GB = 0.005;
export const BITRATES = [128, 192, 256, 320] as const;

/** One listener for one hour, in megabytes. */
export const mbPerHour = (kbps: number) => (kbps * 1000 * 3600) / 8 / 1e6;

/** A month of shops × hours × days, in gigabytes. */
export const transferGb = (kbps: number, shops: number, hours: number, days: number) => (shops * hours * days * mbPerHour(kbps)) / 1000;

export const monthlyCost = (gb: number) => SERVER_USD + Math.max(0, gb - INCLUDED_GB) * OVERAGE_PER_GB;
