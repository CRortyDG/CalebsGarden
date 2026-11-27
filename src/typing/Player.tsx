'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BREAK_CARD_MS, MASK, applyIds, applyText, markers, noteRange, originById, replay, snapshots, stepsAt, textAt, timeline, wordCount, type Recording } from './format';
import './typing.css';

const SPEEDS = [1, 2, 8, 32];
const GHOST_MS = 450; // how long deleted text stays struck through, in real time
const NOTE_MS = 6000; // how long a note stays up after its moment, in real time
const EVERY = 400;

const clock = (ms: number) => {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
};

const minutes = (ms: number) => {
  const m = Math.round(ms / 60000);
  return m < 1 ? 'under a minute' : m === 1 ? '1 minute' : m < 120 ? `${m} minutes` : `${Math.round(m / 6) / 10} hours`;
};

export function gapWords(ms: number) {
  const min = ms / 60000;
  if (min < 60) return `${Math.max(10, Math.round(min))} minutes later`;
  const h = min / 60;
  if (h < 20) return Math.round(h) === 1 ? 'an hour later' : `${Math.round(h)} hours later`;
  const d = Math.round(h / 24);
  return d <= 1 ? 'the next day' : `${d} days later`;
}

/** Draws text with blanked-out runs as gray bars. */
function Runs({ text }: { text: string }) {
  if (!text.includes(MASK)) return <>{text}</>;
  const parts = text.split(/(█+)/);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith(MASK) ? (
          <span key={i} className="ww-mask" aria-label="blanked out">
            {p}
          </span>
        ) : (
          p
        ),
      )}
    </>
  );
}

export function Player({ rec, autoplay = true, onClose, startAt = 0 }: { rec: Recording; autoplay?: boolean; onClose?: () => void; startAt?: number }) {
  const [skip, setSkip] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [t, setT] = useState(() => (startAt > 0 ? timeline(rec, false).end[Math.min(startAt, rec.steps.length) - 1] ?? 0 : 0));
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(false);
  const tl = useMemo(() => timeline(rec, skip), [rec, skip]);
  const snaps = useMemo(() => snapshots(rec.steps, EVERY), [rec]);
  const marks = useMemo(() => markers(rec), [rec]);
  const writingBefore = useMemo(() => {
    // Real writing time up to each step, for the running line.
    const tl0 = timeline(rec, false);
    const out = [0];
    let w = 0;
    const breakAt = new Set(tl0.breaks.map((b) => b.at));
    rec.steps.forEach((s, i) => {
      if (!breakAt.has(i)) w += Math.max(0, s[0]);
      out.push(w);
    });
    return out;
  }, [rec]);
  const box = useRef<HTMLDivElement>(null);
  const caret = useRef<HTMLSpanElement>(null);
  const tRef = useRef(0);
  tRef.current = t;

  // Keep the same moment when skip pauses changes the clock.
  const n = stepsAt(tl, t);
  const nRef = useRef(n);
  nRef.current = n;
  const toggleSkip = () => {
    const keep = nRef.current;
    const next = timeline(rec, !skip);
    setSkip(!skip);
    setT(keep ? next.end[keep - 1] : 0);
  };

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    if (autoplay && !mq.matches) setPlaying(true);
  }, [autoplay]);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const next = Math.min(tl.total, tRef.current + (now - last) * speed);
      last = now;
      setT(next);
      if (next >= tl.total) setPlaying(false);
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, tl.total]);

  // Text at this moment, built forward from the last frame when possible.
  const cache = useRef<{ n: number; text: string }>({ n: 0, text: '' });
  const textFor = useCallback(
    (k: number) => {
      const c = cache.current;
      let text: string;
      if (k >= c.n && k - c.n < EVERY) {
        text = c.text;
        for (let i = c.n; i < k; i++) text = applyText(text, rec.steps[i]);
      } else text = textAt(rec.steps, snaps, k, EVERY);
      cache.current = { n: k, text };
      return text;
    },
    [rec, snaps],
  );
  const before = n > 0 ? textFor(n - 1) : '';
  const last = n > 0 ? rec.steps[n - 1] : null;
  const text = last ? applyText(before, last) : '';
  if (last) cache.current = { n, text };
  const caretAt = last ? last[1] + last[3].length : 0;
  const ghost = !reduced && last && last[2] > 0 && (t - tl.end[n - 1]) / speed < GHOST_MS ? before.slice(last[1], last[1] + last[2]) : '';
  // The note for this moment, and where its words are now.
  const note = (rec.notes ?? []).filter((nt) => nt.at > 0 && nt.at <= n && (t - tl.end[nt.at - 1]) / speed < NOTE_MS).slice(-1)[0];
  // AI help: which characters came from an AI, and the ask being answered (up while its reply is pasted, and a little after).
  const asks = rec.asks ?? [];
  const byId = useMemo(() => (rec.asks?.length ? originById(rec.steps) : null), [rec]);
  const ask = asks.map((a, k) => ({ ...a, k })).filter((a) => a.at > 0 && a.at <= n && (n <= a.at + 1 || (t - tl.end[a.at]) / speed < NOTE_MS)).slice(-1)[0];
  const ids = useRef<{ n: number; ids: number[]; next: number } | null>(null);
  let lit: [number, number] | null = null;
  let idsNow: number[] | null = null;
  if (byId || (note && note.from !== undefined && note.from >= 0)) {
    let c = ids.current;
    if (!c || c.n > n || n - c.n > 4000) {
      const d = replay(rec.steps, n);
      c = { n, ids: d.ids, next: d.next };
    } else {
      const d = { ids: c.ids, next: c.next };
      for (let i = c.n; i < n; i++) applyIds(d, rec.steps[i]);
      c = { n, ids: d.ids, next: d.next };
    }
    ids.current = c;
    idsNow = c.ids;
    if (note) lit = noteRange(c.ids, note.from, note.to);
  }
  const aiAt = (i: number) => (byId && idsNow ? byId[idsNow[i]] >= 0 : false);
  const brk = tl.breaks.find((b) => t >= b.from && t < b.from + BREAK_CARD_MS);
  const session = 1 + tl.breaks.filter((b) => b.at < n || (b.at === n && t >= b.from)).length;

  // Follow the cursor inside the box without moving the page.
  useEffect(() => {
    const b = box.current;
    const c = caret.current;
    if (!b || !c) return;
    const top = c.offsetTop - b.offsetTop;
    if (top < b.scrollTop + 24) b.scrollTop = Math.max(0, top - 24);
    else if (top > b.scrollTop + b.clientHeight - 48) b.scrollTop = top - b.clientHeight + 48;
  });

  const seek = (to: number) => setT(Math.max(0, Math.min(tl.total, to)));
  const playPause = () => {
    if (!playing && t >= tl.total) setT(0);
    setPlaying(!playing);
  };
  const onKey = (e: React.KeyboardEvent) => {
    if ((e.target as HTMLElement).closest('input, button, select')) {
      if (e.key !== ' ' || (e.target as HTMLElement).tagName === 'BUTTON') return;
    }
    if (e.key === ' ') {
      e.preventDefault();
      playPause();
    } else if (e.key === 'ArrowLeft') seek(t - 5000 * speed);
    else if (e.key === 'ArrowRight') seek(t + 5000 * speed);
  };

  // Cut the text where the cursor and the lit-up note words start and end.
  const aiEdges: number[] = [];
  if (byId && idsNow) for (let i = 1; i < text.length; i++) if (aiAt(i) !== aiAt(i - 1)) aiEdges.push(i);
  const cuts = [...new Set([0, caretAt, ...(lit ?? []), ...aiEdges, text.length])].filter((x) => x >= 0 && x <= text.length).sort((a, b) => a - b);
  const pieces: React.ReactNode[] = [];
  for (let i = 0; i < cuts.length; i++) {
    const at = cuts[i];
    if (at === caretAt) {
      if (ghost) pieces.push(<del key="g" className="ww-ghost">{ghost}</del>);
      pieces.push(<span key="c" className={`ww-caret${playing ? '' : ' is-still'}`} ref={caret} />);
    }
    if (i === cuts.length - 1) break;
    const part = text.slice(at, cuts[i + 1]);
    const on = lit && at >= lit[0] && at < lit[1];
    const runs = aiAt(at) ? <span className="ww-ai"><Runs text={part} /></span> : <Runs text={part} />;
    pieces.push(on ? <mark key={at} className="ww-lit">{runs}</mark> : <span key={at}>{runs}</span>);
  }
  return (
    <section className="ww" aria-label="Watch me write this" onKeyDown={onKey} tabIndex={-1}>
      <div className="ww-page" ref={box} aria-hidden={playing ? true : undefined}>
        {pieces}
        {brk && (
          <div className="ww-break" role="status">
            {brk.wall ? <span>{new Date(brk.wall).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span> : null}
            Came back {gapWords(rec.steps[brk.at][0])}
          </div>
        )}
      </div>

      <div className="ww-bar">
        <button type="button" className="ww-play" onClick={playPause} aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? '❚❚' : '▶'}
        </button>
        <div className="ww-track">
          <input
            type="range"
            min={0}
            max={Math.max(1, Math.round(tl.total))}
            step={50}
            value={Math.round(t)}
            onChange={(e) => seek(Number(e.target.value))}
            aria-label="Scrub through the writing"
            aria-valuetext={`${clock(t)} of ${clock(tl.total)}`}
          />
          <div className="ww-marks">
            {marks.map((m, i) => (
              <button
                key={i}
                type="button"
                className={`ww-mark is-${m.kind}`}
                style={{ left: `${(100 * (m.kind === 'session' ? tl.end[m.step] - BREAK_CARD_MS : tl.end[m.step])) / Math.max(1, tl.total)}%` }}
                title={m.label}
                aria-label={`Jump to: ${m.label}`}
                onClick={() => seek(m.kind === 'session' ? tl.end[m.step] - BREAK_CARD_MS : tl.end[m.step] - 1)}
              />
            ))}
          </div>
        </div>
        <span className="ww-time">
          {clock(t)} / {clock(tl.total)}
        </span>
      </div>

      <div className="ww-controls">
        <div className="ww-speeds" role="group" aria-label="Speed">
          {SPEEDS.map((s) => (
            <button key={s} type="button" aria-pressed={speed === s} onClick={() => setSpeed(s)}>
              {s === 1 ? 'Real time' : `${s}×`}
            </button>
          ))}
        </div>
        <label className="ww-skip">
          <input type="checkbox" checked={skip} onChange={toggleSkip} /> Skip pauses
        </label>
        {onClose && (
          <button type="button" className="ww-close" onClick={onClose}>
            Close
          </button>
        )}
      </div>

      <p className="ww-stats">
        {wordCount(text)} words · {minutes(writingBefore[n])} of writing · session {session} of {rec.sessions.length || 1}
      </p>
      {note && (
        <p className="ww-margin">
          <span>Note to self</span> {note.text}
          {lit ? null : note.from !== undefined && note.from >= 0 ? <em> (its words were later deleted)</em> : null}
        </p>
      )}
      {ask && (
        <p className="ww-margin is-ai">
          <span>Asked {ask.tool ?? 'an AI'}</span> {ask.prompt}
        </p>
      )}
      <p className="ww-what">
        <strong>What this shows:</strong> every change to this note&rsquo;s text, in order, with the real pauses, recorded while it was written. Pastes are marked on the
        timeline.{asks.length ? ' Text in blue was pasted from an AI and is still exactly as the AI wrote it; anything typed over it counts as typed.' : ''}{rec.hidden ? ` ${rec.hidden} characters of deleted text are blanked out.` : ''} It&rsquo;s a record of the writing, not proof: it can&rsquo;t show where the words in
        someone&rsquo;s head came from.
      </p>
    </section>
  );
}
