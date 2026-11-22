import { projectLink, statusLabel, type Project } from '@/projects';

/** The plain list of everything on the site, shown in the Index panel. */
export function ProjectList({ projects }: { projects: Project[] }) {
  return (
    <ul className="project-list">
      {projects.map((p) => {
        const href = projectLink(p);
        return (
          <li key={p.id}>
            {href ? (
              <a className="name" href={href}>
                {p.name}
              </a>
            ) : (
              <span className="name">{p.name}</span>
            )}
            {p.type === 'project' && <span className={`status is-${p.status}`}>{statusLabel[p.status]}</span>}
            {p.blurb && <span className="blurb">{p.blurb}</span>}
            {p.about && <p>{p.about}</p>}
          </li>
        );
      })}
    </ul>
  );
}
