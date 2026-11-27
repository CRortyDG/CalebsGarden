import { finalText, isRecording, timeline } from './format';
import { Markdown } from './markdown';
import { WatchMeWrite } from './WatchMeWrite';

/**
 * The body of a note written at the desk. Its text is the recording played to
 * the end, so what's on the page is exactly what the replay finishes on.
 *
 * The recording lives at public/typing/<slug>.json. The note's page imports it
 * (so it's here at build and on revalidation) and readers' browsers fetch the
 * same file only when they press play:
 *
 *   import rec from '../../../public/typing/<slug>.json';
 *   <Note slug={SLUG} kind="note"><RecordedNote slug={SLUG} rec={rec} /></Note>
 */
export function RecordedNote({ slug, rec }: { slug: string; rec: unknown }) {
  if (!isRecording(rec)) throw new Error(`public/typing/${slug}.json is not a recording`);
  const tl = timeline(rec, false);
  const minutes = Math.max(1, Math.round(tl.writingMs / 60000));
  return (
    <>
      <WatchMeWrite slug={slug} minutesOfWriting={minutes} sessions={Math.max(1, rec.sessions.length)} />
      {/* A "# Title" first line is the note's title, which the page already shows. */}
      <Markdown text={finalText(rec).replace(/^\s*# [^\n]*\n?/, '')} />
    </>
  );
}
