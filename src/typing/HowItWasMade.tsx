'use client';

import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { blocks, finalOrigins, outcomes, replay, share, timeline, who, type Block, type Outcome, type Recording, type Seg, type Who } from './format';
import { inline } from './markdown';
import { Player } from './Player';
import './typing.css';

/**
 * "How this was made": a piece written at the desk with some AI help, shown
 * with who wrote what. A meter up top, each sentence marked (AI words
 * underlined, a margin bar with a short line to each stretch saying who wrote
 * it), the list of everything asked of the AI and what became of it, and the
 * replay with AI text in blue. All worked out from the recording, in the
 * browser.
 */

type Run = { who: Who; ask: number; aiPct: number; segs: Seg[] };
type Place = { top: number; bottom: number; label: number };

const WIDE = 860; // below this the margin folds away and tapping a sentence opens a card

function label(r: Run, tool: string) {
  if (r.who === 'mine') return { head: 'Typed by me', sub: '' };
  if (r.who === 'ai') return { head: `${tool} wrote this`, sub: `ask ${r.ask + 1}, as written` };
  return r.aiPct >= 50 ? { head: `${tool} draft, edited by me`, sub: `ask ${r.ask + 1}, ${r.aiPct}% its words` } : { head: 'Mine, with some AI words', sub: `ask ${r.ask + 1}, ${r.aiPct}% its words` };
}

function outcomeWords(o: Outcome) {
  if (o.kind === 'unused') return 'Not used';
  if (o.kind === 'cut') return 'Pasted, then cut';
  if (o.kind === 'kept') return 'Kept as written';
  return `Kept ${o.pct}% of it`;
}

const minuteIn = (ms: number) => {
  const m = Math.floor(ms / 60000);
  return m < 1 ? 'in the first minute' : `${m} min in`;
};

export function HowItWasMade({ rec }: { rec: Recording }) {
  const asks = rec.asks ?? [];
  const tool = asks.find((a) => a.tool)?.tool ?? 'AI';
  const { text, origin } = useMemo(() => finalOrigins(rec), [rec]);
  const body = text.match(/^\s*# [^\n]*\n?/)?.[0].length ?? 0; // the "# Title" line is the page title
  const all = useMemo(() => share(text, origin, body), [text, origin, body]);
  const outs = useMemo(() => outcomes(rec), [rec]);
  const bl = useMemo(() => blocks(text, body), [text, body]);

  // The moment each character was typed or pasted, for "watch from here".
  const stepOfChar = useMemo(() => {
    const byId: number[] = [];
    rec.steps.forEach((s, i) => {
      for (let k = 0; k < s[3].length; k++) byId.push(i);
    });
    return replay(rec.steps).ids.map((id) => byId[id]);
  }, [rec]);
  const tl = useMemo(() => timeline(rec, false), [rec]);
  const sittingOf = (step: number) => rec.sessions.filter((s) => s.at <= step).length || 1;
  const sittingStart = (step: number) => {
    const s = [...rec.sessions].reverse().find((x) => x.at <= step);
    return s && s.at > 0 ? tl.end[s.at - 1] : 0;
  };

  // Sentences grouped into stretches with the same author.
  const { runs, runOf } = useMemo(() => {
    const runs: Run[] = [];
    const runOf = new Map<number, number>(); // seg start -> run
    for (const b of bl)
      for (const item of b.items)
        for (const seg of item) {
          const w = who(text, origin, seg);
          const last = runs[runs.length - 1];
          if (last && last.who === w.who && (w.who === 'mine' || last.ask === w.ask)) {
            last.segs.push(seg);
            last.aiPct = Math.round((last.aiPct * (last.segs.length - 1) + w.aiPct) / last.segs.length);
          } else runs.push({ who: w.who, ask: w.ask, aiPct: w.aiPct, segs: [seg] });
          runOf.set(seg.start, runs.length - 1);
        }
    return { runs, runOf };
  }, [bl, text, origin]);

  const [marked, setMarked] = useState(true);
  const [active, setActive] = useState<number | null>(null);
  const [hot, setHot] = useState<number | null>(null);
  const [watch, setWatch] = useState<{ at: number; key: number } | null>(null);
  const [wide, setWide] = useState(true);
  const [places, setPlaces] = useState<{ edge: number; width: number; runs: Place[] } | null>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);

  // Measure where each stretch sits, so the margin lines up with it.
  useLayoutEffect(() => {
    const el = textRef.current;
    const body = bodyRef.current;
    if (!el || !body || !marked) return;
    const measure = () => {
      const box = el.getBoundingClientRect();
      setWide(body.getBoundingClientRect().width >= WIDE);
      let edge = 0;
      el.querySelectorAll(':scope > *').forEach((c) => (edge = Math.max(edge, c.getBoundingClientRect().right - box.left)));
      let prev = -Infinity;
      let prevBottom = -Infinity;
      const out = runs.map((_, i) => {
        const spans = el.querySelectorAll(`[data-run="${i}"]`);
        const first = spans[0]?.getClientRects()[0];
        const lastRects = spans[spans.length - 1]?.getClientRects();
        const last = lastRects?.[lastRects.length - 1];
        // A stretch can start partway along the line the one before it ends on; keep their bars apart.
        const top = Math.max((first?.top ?? 0) - box.top, prevBottom + 6);
        const bottom = Math.max(top + 12, (last?.bottom ?? 0) - box.top);
        prevBottom = bottom;
        const lab = Math.max(top, prev + 8);
        prev = lab + (runs[i].who === 'mine' ? 20 : 38);
        return { top, bottom, label: lab };
      });
      setPlaces({ edge, width: body.getBoundingClientRect().width - edge - 18, runs: out });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(body);
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, [runs, marked]);

  const openWatch = (at: number) => {
    setWatch({ at, key: Date.now() });
    requestAnimationFrame(() => playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  // In a sentence that's partly the AI's, only its words are underlined; what I changed isn't.
  const byOrigin = (s: Seg, k: string): ReactNode[] => {
    const out: ReactNode[] = [];
    let a = s.start;
    for (let i = s.start + 1; i <= s.end; i++) {
      if (i < s.end && origin[i] >= 0 === origin[a] >= 0) continue;
      const part = inline(text.slice(a, i), `${k}-${a}-`);
      out.push(origin[a] >= 0 ? <span key={a} className="hm-aiw">{part}</span> : <span key={a}>{part}</span>);
      a = i;
    }
    return out;
  };
  const seg = (s: Seg, k: string): ReactNode => {
    const r = runOf.get(s.start) ?? 0;
    const run = runs[r];
    const cls = `hm-s is-${run.who}${active === r ? ' is-active' : ''}${hot === r ? ' is-hot' : ''}`;
    return (
      <span key={k}>
        <span
          className={cls}
          data-run={r}
          role="button"
          tabIndex={0}
          onClick={() => setActive(active === r ? null : r)}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setActive(active === r ? null : r))}
          onMouseEnter={() => setHot(r)}
          onMouseLeave={() => setHot(null)}
        >
          {run.who === 'mixed' ? byOrigin(s, k) : inline(text.slice(s.start, s.end), `${k}-`)}
        </span>{' '}
      </span>
    );
  };
  const renderBlock = (b: Block, i: number) => {
    const line = (item: Seg[], j: number) => item.map((s, k) => seg(s, `${i}-${j}-${k}`));
    if (b.kind === 'h2') return <h2 key={i}>{line(b.items[0], 0)}</h2>;
    if (b.kind === 'h3') return <h3 key={i}>{line(b.items[0], 0)}</h3>;
    if (b.kind === 'ul') return <ul key={i}>{b.items.map((it, j) => <li key={j}>{line(it, j)}</li>)}</ul>;
    if (b.kind === 'ol') return <ol key={i}>{b.items.map((it, j) => <li key={j}>{line(it, j)}</li>)}</ol>;
    if (b.kind === 'quote') return <blockquote key={i}><p>{line(b.items[0], 0)}</p></blockquote>;
    return <p key={i}>{line(b.items[0], 0)}</p>;
  };

  const card = (r: number) => {
    const run = runs[r];
    const l = label(run, tool);
    const a = run.ask >= 0 ? asks[run.ask] : null;
    const from = stepOfChar[run.segs[0].start] ?? 0;
    return (
      <div className="hm-card" role="dialog" aria-label={l.head}>
        <p className={`hm-card-head is-${run.who}`}>
          {l.head}
          {l.sub && <span>{l.sub}</span>}
        </p>
        {a ? (
          <>
            <p className="hm-card-k">What I asked</p>
            <q className="hm-prompt">{a.prompt}</q>
            {a.reply && (
              <details className="hm-reply">
                <summary>What it gave back</summary>
                <p>{a.reply}</p>
              </details>
            )}
          </>
        ) : (
          <p className="hm-card-note">Typed at the desk, key by key. Nothing here was pasted from an AI.</p>
        )}
        <div className="hm-card-actions">
          <button type="button" className="hm-watch" onClick={() => openWatch(a ? a.at : from)}>
            <span aria-hidden>▶</span> {a ? 'Watch from the ask' : 'Watch it typed'}
          </button>
          <button type="button" className="hm-x" onClick={() => setActive(null)}>
            Close
          </button>
        </div>
      </div>
    );
  };

  const used = outs.filter((o) => o.kind !== 'unused').length;
  const offeredChars = asks.length ? outs.reduce((n, o) => n + o.offered, 0) : 0;

  return (
    <div className="hm">
      <section className="hm-meter" aria-label="Who wrote this">
        <div className="hm-bar" aria-hidden>
          <span className="hm-bar-mine" style={{ flexGrow: 100 - all.aiPct }} />
          <span className="hm-bar-ai" style={{ flexGrow: all.aiPct }} />
        </div>
        <p className="hm-legend">
          <span className="hm-key is-mine" /> <strong>{100 - all.aiPct}%</strong> typed by me
          <span className="hm-key is-ai" /> <strong>{all.aiPct}%</strong> still {tool}&rsquo;s words, as it wrote them
        </p>
        <p className="hm-sum">
          {asks.length} {asks.length === 1 ? 'ask' : 'asks'} of {tool}, {used} used. Of the {offeredChars} characters of its text I pasted in,{' '}
          {Math.round((100 * all.ai) / Math.max(1, offeredChars))}% are still here unchanged; I rewrote or cut the rest.
        </p>
        <div className="hm-tools">
          <button type="button" aria-pressed={marked} onClick={() => (setMarked(!marked), setActive(null))}>
            {marked ? 'Hide' : 'Show'} who wrote what
          </button>
          <button type="button" onClick={() => openWatch(0)}>
            <span aria-hidden>▶</span> Watch it being written
          </button>
        </div>
      </section>

      <div ref={bodyRef} className={`hm-body${marked ? ' is-marked' : ''}${wide ? ' is-wide' : ''}`}>
        <div className="hm-text cs-prose" ref={textRef}>
          {bl.map(renderBlock)}
        </div>
        {marked && wide && places && (
          <div className="hm-gutter" style={{ left: places.edge + 18, ['--hm-room' as string]: `${places.width}px` }} aria-hidden={active === null ? undefined : true}>
            <svg className="hm-lines" width="100%" height="100%">
              {places.runs.map((p, i) => (
                <g key={i} className={`is-${runs[i].who}${hot === i || active === i ? ' is-hot' : ''}`}>
                  {/* the bar beside the stretch, and a short line from the text to it */}
                  <line x1={0} y1={p.top + 4} x2={0} y2={p.bottom - 4} className="hm-rail" />
                  <line x1={-14} y1={p.top + 13} x2={0} y2={p.top + 13} className="hm-tick" />
                  <path d={`M0 ${p.top + 13} L8 ${p.label + 10} L14 ${p.label + 10}`} className="hm-tick" fill="none" />
                </g>
              ))}
            </svg>
            {places.runs.map((p, i) => {
              const l = label(runs[i], tool);
              return (
                <button
                  key={i}
                  type="button"
                  className={`hm-label is-${runs[i].who}${hot === i || active === i ? ' is-hot' : ''}`}
                  style={{ top: p.label }}
                  onClick={() => setActive(active === i ? null : i)}
                  onMouseEnter={() => setHot(i)}
                  onMouseLeave={() => setHot(null)}
                >
                  {l.head}
                  {l.sub && <span>{l.sub}</span>}
                </button>
              );
            })}
            {active !== null && (
              <div className="hm-card-at" style={{ top: places.runs[active].label + 44 }}>
                {card(active)}
              </div>
            )}
          </div>
        )}
        {marked && !wide && active !== null && <div className="hm-sheet">{card(active)}</div>}
      </div>

      {asks.length > 0 && (
        <section className="hm-trail" aria-labelledby="hm-trail-h">
          <h2 id="hm-trail-h">Everything I asked {tool}</h2>
          <p className="hm-hint">In order, with what it gave back and what I did with it. Pasting its words in is marked at the desk, so this list is the whole of it.</p>
          <ol>
            {asks.map((a, k) => {
              const o = outs[k];
              return (
                <li key={k} className={`hm-ask is-${o.kind}`}>
                  <p className="hm-ask-meta">
                    Ask {k + 1} · sitting {sittingOf(a.at)}, {minuteIn((a.at > 0 ? tl.end[a.at - 1] : 0) - sittingStart(a.at))}
                    <span className={`hm-chip is-${o.kind}`}>{outcomeWords(o)}</span>
                  </p>
                  <q className="hm-prompt">{a.prompt}</q>
                  {a.reply && (
                    <details className="hm-reply">
                      <summary>What it gave back</summary>
                      <p>{a.reply}</p>
                    </details>
                  )}
                  {a.why && (
                    <p className="hm-why">
                      <span>Why</span> {a.why}
                    </p>
                  )}
                  <button type="button" className="hm-watch" onClick={() => openWatch(a.at)}>
                    <span aria-hidden>▶</span> Watch from here
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <div ref={playerRef} className="hm-player">
        {watch && <Player key={watch.key} rec={rec} startAt={watch.at} onClose={() => setWatch(null)} />}
      </div>
    </div>
  );
}

