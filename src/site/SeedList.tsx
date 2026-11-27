import type { Seed } from '@/projects';

/** The small free tools in the Seedlings card: each name opens its page. */
export function SeedList({ seeds }: { seeds: Seed[] }) {
  return (
    <ul className="sheet-seeds" aria-label="Tools">
      {seeds.map((s) => (
        <li key={s.href}>
          <a href={s.href}>
            {s.name} <span aria-hidden="true">→</span>
          </a>
          <p>{s.what}</p>
        </li>
      ))}
    </ul>
  );
}
