import { SLOT_ID, finalOrigins, finalText, isRecording, share, timeline, type Recording } from './format';
import { HowItWasMade } from './HowItWasMade';
import { Markdown } from './markdown';

/**
 * Notes written at the desk. The recording lives at public/typing/<slug>.json;
 * the page imports it (so it's here at build and on revalidation), and readers'
 * browsers fetch the same file only when they ask to watch:
 *
 *   import rec from '../../../public/typing/<slug>.json';
 *   <Note slug={SLUG} kind="note" recording={recordingInfo(SLUG, rec)}>
 *     <RecordedNote slug={SLUG} rec={rec} />
 *   </Note>
 */
function check(slug: string, rec: unknown): Recording {
  if (!isRecording(rec)) throw new Error(`public/typing/${slug}.json is not a recording`);
  return rec;
}

/** What the header's "Human written" tag needs to know. */
export function recordingInfo(slug: string, rec: unknown) {
  const r = check(slug, rec);
  const { text, origin } = finalOrigins(r);
  return {
    slug,
    minutesOfWriting: Math.max(1, Math.round(timeline(r, false).writingMs / 60000)),
    sessions: Math.max(1, r.sessions.length),
    // Written with AI help: how much of the final text is still the AI's words (0 if none, but asks were logged).
    ai: r.asks?.length ? share(text, origin).aiPct : undefined,
  };
}

/** The note's text: the recording played to the end, so the page is exactly what the replay finishes on. */
export function RecordedNote({ slug, rec }: { slug: string; rec: unknown }) {
  const r = check(slug, rec);
  return (
    <>
      <div id={SLOT_ID} />
      {/* A "# Title" first line is the note's title, which the page already shows. */}
      {r.asks?.length ? <HowItWasMade rec={r} /> : <Markdown text={finalText(r).replace(/^\s*# [^\n]*\n?/, '')} />}
    </>
  );
}
