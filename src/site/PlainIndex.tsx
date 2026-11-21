import { projectLink, site, statusLabel, type Project } from '@/projects';

/**
 * The plain list of everything on the site. Used three ways:
 *  - by the server, as the page people get before (or without) a theme
 *  - inside the Index panel that every theme shares
 *  - as the "No scenery" theme
 *
 * mode "direct" links straight to each project, so it works with scripts off.
 * mode "sheet" links to `#id`, which opens the shared project sheet.
 */
export function ProjectList({ projects, mode }: { projects: Project[]; mode: 'direct' | 'sheet' }) {
  return (
    <ul className="project-list">
      {projects.map((p) => {
        const href = mode === 'sheet' ? projectLink(p) : p.href;
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

export function PlainIndex({ projects, mode, id }: { projects: Project[]; mode: 'direct' | 'sheet'; id?: string }) {
  return (
    <div className="plain" id={id}>
      <header>
        <h1>{site.name}</h1>
        <p className="tagline">{site.tagline}</p>
      </header>
      <ProjectList projects={projects} mode={mode} />
      <footer>© {new Date().getFullYear()} Caleb · {site.name}</footer>
    </div>
  );
}
