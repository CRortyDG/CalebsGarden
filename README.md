# calebs.garden

My personal site. The content is one list of projects; around it the site
wears a **theme**, picked at random for each visit or chosen with
`?theme=<id>`. Whatever the theme, every project name leads to the same
project details in one click, and the Index and Scenery buttons sit in the
same corner.

Built with Next.js (App Router) and React. Every page is static.

## Run it

```sh
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Themes

| `?theme=` | What it is | In the random pick |
| --- | --- | --- |
| `overgrowth` | A scrolling page. A stem grows down it as you scroll and each project flowers off it | yes |
| `herbarium` | A field journal with tabs. Each project is a pressed plant on a sheet, and picking one up opens it as a botanical plate | yes |
| `plot` | A garden map from above with a numbered key, like a park map. Opening a project glides the map to its bed | yes |
| `plain` | No scenery, just the list | no |
| `random` | Forces a fresh random pick | |

A visit keeps its theme until the tab is closed. The Scenery button switches
themes and puts the choice in the address bar so it can be shared.

Rules every theme has to pass, and how to add one: [docs/house-rules.md](docs/house-rules.md).

## Add a project

Add an entry to [`src/projects.ts`](src/projects.ts). Every theme, the project
sheet and the Index pick it up. For The Plot, also give it a bed in
[`src/themes/plot/layout.ts`](src/themes/plot/layout.ts). Herbarium draws its
plant from the project's name, so there is nothing to add there.

## Where things live

| Path | What |
| --- | --- |
| `src/projects.ts` | The content: projects, status, links, screenshots |
| `app/page.tsx` | Home page: the plain list from the server, then the theme on top |
| `src/site/ThemeHost.tsx` | Picks and loads the theme; Index, Scenery menu, sheet and `#project` links |
| `src/site/ProjectSheet.tsx` | The shared project sheet |
| `src/site/ProjectDetails.tsx` | What the sheet shows about a project; scrolling themes put it on the page |
| `src/site/PlainIndex.tsx` | The plain list (server page, Index panel, "No scenery") |
| `src/themes/registry.ts` | The list of themes and the pick logic |
| `src/themes/overgrowth/` | Overgrowth theme: page, stem that grows with scroll, vines, flowers, CSS |
| `src/themes/herbarium/` | Herbarium theme: journal and tabs, the plate, the plant generator, CSS |
| `src/themes/plot/` | The Plot theme: markup, canvas engine, bed layout, CSS |
| `app/case-studies/` | Case studies (the Candlefair one goes at `/case-studies/candlefair`) |

## How a visit works

1. The server sends the plain page: the name and every project as a real link.
   That is what search engines, link previews and browsers without scripts get.
2. `ThemeHost` picks the theme (`?theme=`, else this tab's earlier pick, else
   random) and downloads only that theme's code.
3. The theme replaces the plain page. If it fails to load, the plain page stays.
