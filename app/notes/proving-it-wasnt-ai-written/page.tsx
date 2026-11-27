import { Note, noteMetadata } from '../_parts/Note';
import { RecordedNote, recordingInfo } from '@/typing/RecordedNote';
import rec from '../../../public/typing/proving-it-wasnt-ai-written.json';

// Written at the desk: the text below is the recording's final text, as typed.
const SLUG = 'proving-it-wasnt-ai-written';
export const metadata = noteMetadata(SLUG);
export const revalidate = 3600; // a scheduled note goes live within the hour of its day

export default function Page() {
  return (
    <Note slug={SLUG} kind="working" recording={{ ...recordingInfo(SLUG, rec), invite: true }}>
      <RecordedNote slug={SLUG} rec={rec} />
    </Note>
  );
}
