# House rules for themes

A theme is scenery around the same content. It goes into the random pick
(`enabled: true` in `src/themes/registry.ts`) only when it passes all eight.
Until then it can still be opened with `?theme=<id>`.

1. **Names first.** Every project name is readable and clickable on the first
   screen, with no interaction and no wait longer than one second.
2. **Borrow one habit.** The theme works like something people already use: a
   scrolling page, a binder, a map, a carousel. If it needs a hint line, the
   design has failed.
3. **Clickable things look clickable.** Anything that opens something looks
   like a button, a tag or a tab. Scenery is never the only way in.
4. **One click to the project sheet.** Link a project's name to `#<id>` (use
   `projectLink(p)`) or call `openProject(id)`. The sheet is shared, so its
   content and buttons are the same in every theme.
5. **Always a way out.** The Index and Scenery buttons sit in the top right
   corner in every theme; keep that corner clear. Esc and Back close whatever
   is open.
6. **Links can be shared.** `?theme=<id>#<project>` opens that theme with that
   project showing. This comes free with the shared sheet.
7. **Works for everyone.** Thumb, keyboard and screen reader all work. Reduced
   motion gives a still version. Nothing depends on hover.
8. **Scenery reacts, never blocks.** Animation can respond to the visitor. It
   cannot delay them or hide content.

## Making a theme

1. Create `src/themes/<id>/index.tsx` with a default export that takes
   `ThemeProps` (`projects`, `openProject`). Import the theme's own CSS there,
   so it only loads with the theme.
2. Add one entry to `src/themes/registry.ts` with `enabled: false`.
3. Open `/?theme=<id>` and check it against the rules above, on a phone too.
4. Restyle the shared sheet, Index and buttons if you like by setting the
   `--sheet-*` and `--chrome-*` variables on `.site[data-theme='<id>']`.
5. Switch `enabled` on.
