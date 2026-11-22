import { projects } from '@/projects';
import { Overgrowth } from '@/overgrowth/Overgrowth';
import { getUsage } from '@/usage';

// The live counts are fetched on the server and the page is rebuilt at most twice a day.
export const revalidate = 43200; // REVALIDATE_SECONDS in src/madtown-stats.ts

// The whole page is rendered on the server as real text and links; the stem,
// vines and flowers are drawn on top once scripts run.
export default async function Home() {
  const usage = await getUsage();
  return (
    <main>
      <Overgrowth projects={projects} usage={usage} />
    </main>
  );
}
