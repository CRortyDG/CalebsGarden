'use client';

import { useState } from 'react';
import { isRecording, type Recording } from './format';
import { Player } from './Player';
import './typing.css';

/** The "Watch me write this" button on a note. The recording only downloads when someone presses it. */
export function WatchMeWrite({ slug, minutesOfWriting, sessions }: { slug: string; minutesOfWriting: number; sessions: number }) {
  const [rec, setRec] = useState<Recording | null>(null);
  const [state, setState] = useState<'closed' | 'loading' | 'open' | 'failed'>('closed');

  const open = async () => {
    if (rec) return setState('open');
    setState('loading');
    try {
      const r = await fetch(`/typing/${slug}.json`);
      const j = await r.json();
      if (!isRecording(j)) throw new Error('not a recording');
      setRec(j);
      setState('open');
    } catch {
      setState('failed');
    }
  };

  if (state === 'open' && rec) return <Player rec={rec} onClose={() => setState('closed')} />;
  return (
    <div className="ww-invite">
      <button type="button" className="ww-invite-btn" onClick={open} disabled={state === 'loading'}>
        <span aria-hidden>▶</span> {state === 'loading' ? 'Loading…' : 'Watch me write this'}
      </button>
      <span className="ww-invite-note">
        {state === 'failed'
          ? 'The recording didn’t load. Try again in a moment.'
          : `Every keystroke, deletion and pause, replayed. ${minutesOfWriting} ${minutesOfWriting === 1 ? 'minute' : 'minutes'} of writing over ${sessions} ${sessions === 1 ? 'sitting' : 'sittings'}.`}
      </span>
    </div>
  );
}
