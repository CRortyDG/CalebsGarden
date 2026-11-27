# Watch me write this

Notes written at [calebs.garden/desk](https://calebs.garden/desk) carry a replay of every
change to their text, with the real pauses. A small "Human written" tag next to the date
opens a short explanation and the way into the replay. Pass `invite: true` in `recording`
(`{ ...recordingInfo(SLUG, rec), invite: true }`) to also show a small "Watch me write this"
button at the top of the note. The code is in `src/typing/`, with no outside
libraries and no server.

## Writing

- `/desk` is a plain writing page. Drafts live only in that browser (IndexedDB). Nothing is
  uploaded. The page is `noindex`, and it holds nothing, so it's fine that anyone can open it.
- Every change is one step: `[ms since the last step, position, characters removed, text typed, 'p' if pasted]`.
  The desk compares the text before and after each change, so paste, autocorrect, undo and
  phone keyboards all record correctly.
- Opening a draft and typing starts a new sitting, and so does a gap of more than 10 minutes. The replay shows it as a short
  "Came back 2 days later" card.
- **Notes to yourself**: select words, press Add note. Notes stay pinned to those words as
  you edit, are private, and "Back to then" replays from the moment you wrote one.
- **Save backup** downloads the whole draft (notes included). Clearing browser data deletes
  drafts, so the desk nags after a day without a backup. **Load a backup** brings one back,
  on this or another device.

## Publishing

1. Press **Publish** at the desk. Tick any deleted text to blank out (it plays as a gray bar,
   and the real letters are replaced in the file before it's downloaded). Tick any notes
   readers should see; in the replay they show at the moment you wrote them, with their
   words lit up. Then **Download recording**.
2. Hand Claude the file with the note's title and its "In short" line. The note's text is
   not copied anywhere: the page renders the recording's final text, so the page and the
   replay can't disagree. A `# Title` first line is dropped from the page body.
3. Claude puts the file at `public/typing/<slug>.json`, adds the post to
   `app/notes/_parts/posts.ts`, and makes the page:

```tsx
import { Note, noteMetadata } from '../_parts/Note';
import { RecordedNote, recordingInfo } from '@/typing/RecordedNote';
import rec from '../../../public/typing/<slug>.json';

const SLUG = '<slug>';
export const metadata = noteMetadata(SLUG);
export const revalidate = 3600;

export default function Page() {
  return (
    <Note slug={SLUG} kind="note" recording={recordingInfo(SLUG, rec)}>
      <RecordedNote slug={SLUG} rec={rec} />
    </Note>
  );
}
```

`npm run typing:check` tests the engine and checks every file in `public/typing/`.

The body supports paragraphs, `##` headings, `>` quotes, `-` and `1.` lists, links, bold,
italics and `code`. Anything else shows as typed.
