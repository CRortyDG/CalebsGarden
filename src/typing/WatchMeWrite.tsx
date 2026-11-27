'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { SLOT_ID, isRecording, type Recording } from './format';
import { Player } from './Player';
import './typing.css';


/**
 * A small "Human written" tag in a note's header. Pressing it opens a short
 * explanation at the top of the note with the way into the replay. The
 * recording only downloads when someone asks to watch.
 */
export function HumanTag({ slug, minutesOfWriting, sessions }: { slug: string; minutesOfWriting: number; sessions: number }) {
  const [rec, setRec] = useState<Recording | null>(null);
  const [state, setState] = useState<'closed' | 'info' | 'loading' | 'open' | 'failed'>('closed');
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  useEffect(() => setSlot(document.getElementById(SLOT_ID)), []);

  const watch = async () => {
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

  const panel =
    state === 'open' && rec ? (
      <Player rec={rec} onClose={() => setState('closed')} />
    ) : state !== 'closed' ? (
      <div className="ww-info" id="ww-info">
        <p>
          I typed this note myself at my writing desk, which recorded every keystroke, deletion and pause. You can watch it being written, as a way of showing it&rsquo;s
          human written. It&rsquo;s a record of the writing, not proof.
        </p>
        <div className="ww-info-actions">
          <button type="button" className="ww-watch" onClick={watch} disabled={state === 'loading'}>
            <span aria-hidden>▶</span> {state === 'loading' ? 'Loading…' : 'Watch me write this'}
          </button>
          <span className="ww-info-meta">
            {state === 'failed'
              ? 'The recording didn’t load. Try again in a moment.'
              : `${minutesOfWriting} ${minutesOfWriting === 1 ? 'minute' : 'minutes'} of writing, ${sessions} ${sessions === 1 ? 'sitting' : 'sittings'}`}
          </span>
          <button type="button" className="ww-info-close" onClick={() => setState('closed')}>
            Close
          </button>
        </div>
      </div>
    ) : null;

  return (
    <>
      <button
        type="button"
        className="ww-tag"
        aria-expanded={state !== 'closed'}
        aria-controls="ww-info"
        onClick={() => {
          setState(state === 'closed' ? 'info' : 'closed');
          if (state === 'closed') slot?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }}
      >
        Human written <span className="ww-tag-i" aria-hidden>ⓘ</span>
      </button>
      {slot && panel ? createPortal(panel, slot) : null}
    </>
  );
}
