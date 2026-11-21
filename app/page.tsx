import { projects } from '@/projects';
import { PlainIndex } from '@/site/PlainIndex';
import { ThemeHost } from '@/site/ThemeHost';

// The server sends the plain page: the name and every project as a real link.
// ThemeHost then picks this visit's theme and puts its scenery on top.
export default function Home() {
  return (
    <main>
      <PlainIndex id="plain" projects={projects} mode="direct" />
      <ThemeHost />
    </main>
  );
}
