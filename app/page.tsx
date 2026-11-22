import { projects } from '@/projects';
import { Overgrowth } from '@/overgrowth/Overgrowth';

// The whole page is rendered on the server as real text and links; the stem,
// vines and flowers are drawn on top once scripts run.
export default function Home() {
  return (
    <main>
      <Overgrowth projects={projects} />
    </main>
  );
}
