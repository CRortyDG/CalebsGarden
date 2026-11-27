# calebs.garden

My personal site: one scrolling page that grows. The name and a bud for each
project are on the first screen. Scrolling grows a stem down the page, each
project flowers off it in its own card, and the page ends below ground with
the roots. The **Regrow** button in the top corner grows the vines and the stem
again, a little differently each time. **Index** lists everything.

Built with Next.js (App Router) and React. Every page is static, and the whole
page is real text and links before any script runs; the plants are drawn on top.

## Run it

```sh
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Add a project

Add an entry to [`src/projects.ts`](src/projects.ts). The bud, the card and the
Index pick it up. A card image is 1200×630 (the same shape as a link preview)
and goes in `public/projects/`.

## Link previews

Every case study, note and inner page has its own link-preview card in
`public/og/`: the first screen's vines with the page's title on top. Each
card's vines grow from a seed (the page's address), so a page always gets the
same garden. After adding a note or changing a title, draw them again:

```sh
npm run dev      # in one terminal
npm run og       # in another; needs Playwright
```

The cards are listed in [`src/og/cards.ts`](src/og/cards.ts). A page without a
drawn card uses the home page's (`public/og.jpg`) until `npm run og` is run.

## Where things live

| Path | What |
| --- | --- |
| `src/projects.ts` | The content: projects, status, highlights, links, images |
| `app/page.tsx` | Home page |
| `src/overgrowth/Overgrowth.tsx` | The page: first screen, project cards, roots, Index and Regrow |
| `src/overgrowth/stem.ts` | The stem that grows with scroll, its leaves, branches and roots |
| `src/overgrowth/vines.ts` | The vines around the name on the first screen |
| `src/overgrowth/Flower.tsx` | A project's flower, drawn by its growth stage |
| `src/site/ProjectDetails.tsx` | What a project card shows |
| `src/site/ProjectList.tsx` | The list in the Index panel |
| `app/reels/`, `src/reels/` | Reel maker at `/reels`: beat detection + canvas drawing in `engine.ts`, trip board scripts in `scripts.ts`, example song and pictures in `public/reels/example/` |
| `app/case-studies/` | Case studies (the Dungeon Garden one goes at `/case-studies/candlefair`) |

A shared link to `calebs.garden/#dungeon-garden` lands on that project (the old `#candlefair` still works).
