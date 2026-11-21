# calebs.garden

My personal site: a top-down garden where each project is a raised bed with a
wooden stake. At night (by the visitor's clock) the pointer is a lantern,
Candlefair's bed has candles and fireflies follow the light. By day it's sunny
and still. Below the garden is a plain list of the same links.

Built with Next.js (App Router), React and one plain-TypeScript canvas script.
Every page is static.

## Run it

```sh
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Add a project

Add an entry to [`src/projects.ts`](src/projects.ts). It gets a bed, a stake and
a line in the list. Each project has two bed positions (fractions of the
garden): `wide` for landscape screens and `tall` for portrait phones. The bed
`kind` sets what grows there (`herbs`, `sunflowers`, `greenhouse`,
`seedlings`); new kinds are drawn in [`src/garden/engine.ts`](src/garden/engine.ts).

## Where things live

| Path | What |
| --- | --- |
| `app/page.tsx` | Home page: the garden plus the "What's growing" list |
| `app/case-studies/` | Case studies (the Candlefair one goes at `/case-studies/candlefair`) |
| `src/garden/Garden.tsx` | The garden's markup: canvas, stakes, Day/Night button |
| `src/garden/engine.ts` | The canvas drawing, lantern, fireflies and hover/tap |
| `public/og.jpg` | Link preview image |

## Behaviour notes

- Night is 7pm to 7am on the visitor's clock. The Day/Night button overrides it and is remembered.
- The beds grow in from bare soil on someone's first visit only.
- With reduced motion turned on, the garden is a still daytime picture.
- Touch: the first tap on a bed shows its label, a second tap opens it. The stakes are always plain links.
