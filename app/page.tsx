import { Garden } from '@/garden/Garden';
import { projects } from '@/projects';

export default function Home() {
  return (
    <main>
      <Garden />

      <section className="growing" id="growing" aria-labelledby="growing-title">
        <h2 id="growing-title">What&apos;s growing</h2>
        <ul>
          {projects.map((p) => (
            <li key={p.id}>
              {p.href ? <a href={p.href}>{p.name}</a> : <span className="name">{p.name}</span>}
              {p.hostLabel && p.hostLabel !== p.name && <span className="host">{p.hostLabel}</span>}
              {!p.href && <span className="host">{p.blurb}</span>}
              {p.about && <p>{p.about}</p>}
            </li>
          ))}
        </ul>
        <footer>© {new Date().getFullYear()} Caleb · calebs.garden</footer>
      </section>
    </main>
  );
}
