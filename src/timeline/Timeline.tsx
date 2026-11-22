'use client';

// madtown.today, day by day: an animated, scrubbable timeline of every day since launch.
// It plays like a short film when it scrolls into view (a vine grows along the bottom, each
// day's bar rises from it, and events open as flowers where they happened), but it is all
// live SVG, so you can pause, drag through it, hover or tap any day, and switch what the
// bars count. With reduced motion it opens finished, and Play steps from event to event.
//
// Data: src/madtown-timeline.ts (counts only), events: src/madtown-events.ts.

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { MadtownEvent } from '@/madtown-events';
import { EVENT_KINDS } from '@/madtown-events';
import type { MadtownTimeline, Source, TimelineDay } from '@/madtown-timeline';
import { SOURCES } from '@/madtown-timeline';
import './timeline.css';

type Lens = 'visitors' | 'sources' | 'stayed';
const LENSES: { id: Lens; label: string; hint: string }[] = [
  { id: 'visitors', label: 'Who visited', hint: 'Each day’s visitors: people back again, and people here for the first time.' },
  { id: 'sources', label: 'Where new people came from', hint: 'Only first-time visitors, by the link or site that brought them.' },
  { id: 'stayed', label: 'Who stayed', hint: 'Each day’s first-time visitors, and how many of them played, came back the next day, and came back a week later.' },
];

const SOURCE_LABELS: Record<Source | 'unknown', string> = {
  reddit: 'Reddit',
  search: 'Search',
  social: 'Instagram, Facebook, Teams, email',
  otherSite: 'Another website',
  sharedResult: 'A friend’s shared result',
  postedLink: 'Flyers and other tagged links',
  direct: 'Typed in, saved, or an app',
  unknown: 'Not recorded yet',
};

const DAYS_PER_SECOND = 3.2;
const EVENT_HOLD_MS = 1100;
const REDUCED_STEP_MS = 2600;

const fmt = (n: number) => n.toLocaleString('en-US');
const pct = (n: number | null, d: number | null) => (n === null || !d ? null : Math.round((n / d) * 100));
const shortDate = (date: string) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric' });
const monthDay = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' });
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const ease = (x: number) => 1 - Math.pow(1 - x, 3);

/** "nice" gridline step for a max value. */
function niceStep(max: number) {
  const raw = max / 3;
  const pow = Math.pow(10, Math.floor(Math.log10(raw || 1)));
  return [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? raw;
}

/** New visitors back the next day, pooled over days [from, to). Null with too few. */
function pooledBack1(days: TimelineDay[], from: number, to: number) {
  let n = 0;
  let back = 0;
  for (let i = Math.max(0, from); i < Math.min(days.length, to); i++) {
    const d = days[i];
    if (d.back1 === null || !d.newBrowsers) continue;
    n += d.newBrowsers;
    back += d.back1;
  }
  return n >= 50 ? Math.round((back / n) * 100) : null;
}

type Segment = { key: string; value: number; cls: string };

function segmentsFor(day: TimelineDay, lens: Lens): Segment[] {
  if (lens === 'visitors') {
    const fresh = day.newBrowsers;
    const back = day.visitors === null ? 0 : Math.max(0, day.visitors - fresh);
    return [
      { key: 'back', value: back, cls: 'tl-back' },
      { key: 'new', value: fresh, cls: 'tl-new' },
    ];
  }
  if (lens === 'sources') {
    if (!day.sources) return [{ key: 'unknown', value: day.newBrowsers, cls: 'tl-src-unknown' }];
    // The sources hash and the cohort set are counted apart and can differ by a few.
    return SOURCES.map((s) => ({ key: s, value: day.sources![s], cls: `tl-src-${s}` }));
  }
  return [];
}

export interface TimelineProps {
  data: MadtownTimeline;
  events: MadtownEvent[];
}

export default function Timeline({ data, events }: TimelineProps) {
  const days = data.days;
  const n = days.length;
  const index = useMemo(() => new Map(days.map((d, i) => [d.date, i])), [days]);
  const marks = useMemo(
    () => events.map((e) => ({ ...e, i: index.get(e.date) ?? -1 })).filter((e) => e.i >= 0).sort((a, b) => a.i - b.i),
    [events, index],
  );

  // ---- size --------------------------------------------------------------------------
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(760);
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setWidth(Math.max(280, Math.round(el.getBoundingClientRect().width)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const narrow = width < 560;
  const H = narrow ? 210 : 280;
  const L = narrow ? 30 : 40;
  const R = narrow ? 8 : 14;
  const TOP = 14;
  const BASE = H - 30; // the vine
  const step = (width - L - R) / n;
  const xAt = (i: number) => L + (i + 0.5) * step;
  const barW = Math.max(2, step * 0.72);

  // ---- playback ----------------------------------------------------------------------
  // t runs 0..n: day i has fully grown once t >= i + 1. The server renders the finished picture.
  const [t, setT] = useState(n);
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [lens, setLens] = useState<Lens>('visitors');
  const [hover, setHover] = useState<number | null>(null);
  const started = useRef(false);
  const tRef = useRef(t);
  tRef.current = t;

  useLayoutEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    if (!mq.matches) setT(0); // empty until it scrolls into view and plays
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Plays the first time it's mostly on screen; pauses when it scrolls away.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || reduced) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          setPlaying(true);
        } else if (!entry.isIntersecting) setPlaying(false);
      },
      { threshold: 0.45 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  // The animation loop (motion allowed): steady speed, slower into an event, a short hold on it.
  useEffect(() => {
    if (!playing || reduced) return;
    let raf = 0;
    let last = performance.now();
    let holdUntil = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (now < holdUntil) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const cur = tRef.current;
      const near = marks.some((m) => m.i + 1 - cur > 0 && m.i + 1 - cur < 0.9);
      let next = cur + dt * DAYS_PER_SECOND * (near ? 0.35 : 1);
      const crossed = marks.find((m) => cur < m.i + 1 && next >= m.i + 1);
      if (crossed) {
        next = crossed.i + 1;
        holdUntil = now + EVENT_HOLD_MS;
      }
      if (next >= n) {
        setT(n);
        setPlaying(false);
        return;
      }
      setT(next);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, reduced, marks, n]);

  // Reduced motion: Play jumps from event to event, no tweening.
  useEffect(() => {
    if (!playing || !reduced) return;
    const id = window.setInterval(() => {
      const cur = tRef.current;
      const next = marks.find((m) => m.i + 1 > cur + 0.01);
      if (!next) {
        setT(n);
        setPlaying(false);
      } else setT(next.i + 1);
    }, REDUCED_STEP_MS);
    return () => window.clearInterval(id);
  }, [playing, reduced, marks, n]);

  const togglePlay = useCallback(() => {
    started.current = true;
    setPlaying((p) => {
      if (!p && tRef.current >= n - 0.001) setT(reduced && marks.length ? marks[0].i + 1 : 0);
      return !p;
    });
  }, [n, reduced, marks]);

  const jumpEvent = (dir: 1 | -1) => {
    started.current = true;
    setPlaying(false);
    const cur = Math.ceil(tRef.current - 0.001) - 1;
    const target = dir === 1 ? marks.find((m) => m.i > cur) : [...marks].reverse().find((m) => m.i < cur);
    if (target) setT(target.i + 1);
    else setT(dir === 1 ? n : 1);
  };

  // ---- pointer: hover to read a day, press and drag to scrub ---------------------------
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);
  const dayFromEvent = (e: React.PointerEvent) => {
    const rect = svgRef.current!.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * width;
    return clamp(Math.floor((x - L) / step), 0, n - 1);
  };
  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    started.current = true;
    setPlaying(false);
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    const i = dayFromEvent(e);
    setT(i + 1);
    setHover(i);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const i = dayFromEvent(e);
    if (dragging.current) setT(i + 1);
    if (e.pointerType === 'mouse' || dragging.current) setHover(i);
  };
  const onPointerUp = () => {
    dragging.current = false;
  };

  // ---- what's on screen ------------------------------------------------------------------
  const playhead = clamp(Math.ceil(t - 0.001) - 1, 0, n - 1);
  const focus = hover ?? playhead;
  const day = days[focus];
  const grow = (i: number) => ease(clamp(t - i, 0, 1));

  const yMax = useMemo(() => {
    const m =
      lens === 'visitors'
        ? Math.max(...days.map((d) => Math.max(d.visitors ?? 0, d.newBrowsers)))
        : Math.max(...days.map((d) => d.newBrowsers));
    return Math.max(10, m) * 1.06;
  }, [days, lens]);
  const yScale = (v: number) => (v / yMax) * (BASE - TOP);
  const gridStep = niceStep(yMax);
  const grid = Array.from({ length: Math.floor(yMax / gridStep) }, (_, k) => (k + 1) * gridStep);

  // The vine: a gentle wave along the baseline, as far as the playhead.
  const vineEnd = L + clamp(t, 0, n) * step;
  let vine = `M ${L} ${BASE}`;
  for (let x = L + 4; x <= vineEnd; x += 4) vine += ` L ${x.toFixed(1)} ${(BASE + Math.sin((x - L) / 23) * 2.6).toFixed(1)}`;

  const activeMark = [...marks].reverse().find((m) => m.i <= focus) ?? null;
  const onEventDay = activeMark?.i === focus;

  // Regulars strip: their share of each week's visitors, which is what changed.
  const RH = narrow ? 58 : 66;
  const regDays = days
    .map((d, i) => ({ i, v: d.regulars, share: d.regulars !== null && d.weekBrowsers ? (d.regulars / d.weekBrowsers) * 100 : null }))
    .filter((d): d is { i: number; v: number; share: number } => d.v !== null && d.share !== null);
  const shareMax = Math.max(10, ...regDays.map((d) => d.share)) * 1.1;
  const regY = (share: number) => RH - 6 - (share / shareMax) * (RH - 26);
  const regShown = regDays.filter((d) => d.i < t);
  const regPath = regShown.map((d, k) => `${k ? 'L' : 'M'} ${xAt(d.i).toFixed(1)} ${regY(d.share).toFixed(1)}`).join(' ');
  const regNow = [...regDays].reverse().find((d) => d.i <= focus && d.i < t) ?? null;

  const lensInfo = LENSES.find((l) => l.id === lens)!;

  return (
    <figure className="tl" aria-labelledby="tl-title">
      <figcaption className="tl-head">
        <p className="tl-kicker" id="tl-title">
          madtown.today, day by day
        </p>
        <div className="tl-readout" aria-live={playing ? 'off' : 'polite'}>
          <p className="tl-date">{shortDate(day.date)}</p>
          <dl className="tl-chips">
            <div>
              <dt>Visitors</dt>
              <dd>{day.visitors === null ? '—' : fmt(day.visitors)}</dd>
            </div>
            <div>
              <dt>First time</dt>
              <dd className="is-new">{fmt(day.newBrowsers)}</dd>
            </div>
            <div>
              <dt>Here yesterday too</dt>
              <dd className="is-back">{day.returning === null ? '—' : fmt(day.returning)}</dd>
            </div>
            <div>
              <dt>Regulars</dt>
              <dd className="is-reg">{regNow ? fmt(regNow.v) : '—'}</dd>
            </div>
          </dl>
        </div>
      </figcaption>

      <div className="tl-lenses" role="radiogroup" aria-label="What the bars count">
        {LENSES.map((l) => (
          <button key={l.id} type="button" role="radio" aria-checked={lens === l.id} className="tl-lens" onClick={() => setLens(l.id)}>
            {l.label}
          </button>
        ))}
      </div>
      <p className="tl-hint">{lensInfo.hint}</p>

      <div className="tl-stage" ref={wrapRef}>
        <svg
          ref={svgRef}
          className="tl-chart"
          width={width}
          height={H}
          viewBox={`0 0 ${width} ${H}`}
          role="img"
          aria-label={`Bar chart, ${n} days from ${monthDay(days[0].date)} to ${monthDay(days[n - 1].date)}. ${lensInfo.hint} The table below has every number.`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onPointerLeave={() => !dragging.current && setHover(null)}
        >
          {grid.map((g) => (
            <g key={g} className="tl-grid">
              <line x1={L} x2={width - R} y1={BASE - yScale(g)} y2={BASE - yScale(g)} />
              <text x={L - 6} y={BASE - yScale(g) + 4} textAnchor="end">
                {fmt(g)}
              </text>
            </g>
          ))}

          {/* the bars */}
          {days.map((d, i) => {
            const g = grow(i);
            if (g <= 0) return null;
            const x = xAt(i) - barW / 2;
            const dim = hover !== null && hover !== i ? ' is-dim' : '';
            if (lens === 'stayed') {
              const layers = [
                { v: d.newBrowsers, cls: 'tl-st-new', w: 1 },
                { v: d.newStarted, cls: 'tl-st-played', w: 0.78 },
                { v: d.back1, cls: 'tl-st-back1', w: 0.56 },
                { v: d.back7, cls: 'tl-st-back7', w: 0.34 },
              ];
              return (
                <g key={d.date} className={`tl-bar${dim}`}>
                  {layers.map((ly) =>
                    ly.v === null ? null : (
                      <rect
                        key={ly.cls}
                        className={ly.cls}
                        x={xAt(i) - (barW * ly.w) / 2}
                        width={barW * ly.w}
                        y={BASE - yScale(ly.v) * g}
                        height={Math.max(0, yScale(ly.v) * g)}
                        rx={Math.min(2, barW / 4)}
                      />
                    ),
                  )}
                </g>
              );
            }
            let y = BASE;
            return (
              <g key={d.date} className={`tl-bar${dim}`}>
                {segmentsFor(d, lens).map((s) => {
                  const h = yScale(s.value) * g;
                  y -= h;
                  return h > 0 ? <rect key={s.key} className={s.cls} x={x} width={barW} y={y} height={h} /> : null;
                })}
              </g>
            );
          })}

          {/* the vine, its leaves (one a week) and the event flowers */}
          <path className="tl-vine" d={vine} />
          {days.map((d, i) => {
            if (i % 7 !== 3) return null;
            const g = grow(i);
            if (g <= 0) return null;
            const up = (i / 7) % 2 < 1;
            return (
              <path
                key={`leaf-${d.date}`}
                className="tl-leaf"
                d="M0 0 C 3 -4, 9 -5, 12 -1 C 8 1, 3 1, 0 0 Z"
                transform={`translate(${xAt(i)} ${BASE}) rotate(${up ? -28 : 28}) scale(${g * (narrow ? 0.8 : 1)}) ${up ? '' : 'scale(1 -1)'}`}
              />
            );
          })}
          {marks.map((m) => {
            const open = clamp((t - m.i - 0.2) / 0.8, 0, 1);
            const cx = xAt(m.i);
            const cy = BASE + 1;
            const on = activeMark?.i === m.i;
            return (
              <g
                key={m.date}
                className={`tl-bud tl-kind-${m.kind}${on ? ' is-on' : ''}`}
                transform={`translate(${cx} ${cy})`}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  started.current = true;
                  setPlaying(false);
                  setHover(null);
                  setT(m.i + 1);
                }}
              >
                <title>{`${monthDay(m.date)}: ${m.title}`}</title>
                <circle className="tl-bud-hit" r={11} />
                {open <= 0 ? (
                  <circle className="tl-bud-closed" r={3.2} />
                ) : (
                  <g transform={`scale(${ease(open)})`}>
                    {[0, 72, 144, 216, 288].map((a) => (
                      <ellipse key={a} className="tl-petal" rx={2.6} ry={5.2} cy={-4.6} transform={`rotate(${a})`} />
                    ))}
                    <circle className="tl-bud-heart" r={2.2} />
                  </g>
                )}
              </g>
            );
          })}

          {/* the playhead, or the day under the pointer */}
          <line className="tl-cursor" x1={xAt(focus)} x2={xAt(focus)} y1={TOP} y2={BASE} />

          {/* month labels */}
          {days.map((d, i) =>
            d.date.endsWith('-01') || (i === 0 && !days.slice(1, 5).some((x) => x.date.endsWith('-01'))) ? (
              <text key={`m-${d.date}`} className="tl-axis" x={xAt(i) - step / 2} y={H - 6}>
                {monthDay(d.date)}
              </text>
            ) : null,
          )}
        </svg>

        <svg className="tl-regulars" width={width} height={RH} viewBox={`0 0 ${width} ${RH}`} aria-hidden="true">
          <text className="tl-axis" x={L} y={11}>
            {narrow ? 'Regulars' : `Regulars (here ${data.regularDays}+ days a week)`}
            {regNow ? (
              <tspan className="tl-reg-label">
                {'  '}
                {fmt(regNow.v)}, {Math.round(regNow.share)}% of the week&apos;s visitors
              </tspan>
            ) : null}
          </text>
          <line className="tl-grid-base" x1={L} x2={width - R} y1={RH - 6} y2={RH - 6} />
          {regPath && <path className="tl-reg-line" d={regPath} />}
          {regNow && <circle className="tl-reg-dot" cx={xAt(regNow.i)} cy={regY(regNow.share)} r={3.5} />}
        </svg>
      </div>

      <Legend lens={lens} />

      <div className="tl-controls">
        <button type="button" className="tl-btn is-play" onClick={togglePlay} aria-label={playing ? 'Pause' : reduced ? 'Step through the events' : 'Play'}>
          <span aria-hidden="true">{playing ? '❚❚' : '▶'}</span>
          <span className="tl-btn-text">{playing ? 'Pause' : t >= n - 0.001 ? 'Replay' : 'Play'}</span>
        </button>
        <button type="button" className="tl-btn" onClick={() => jumpEvent(-1)} aria-label="Previous event">
          <span aria-hidden="true">‹</span>
        </button>
        <input
          className="tl-scrub"
          type="range"
          min={0}
          max={n - 1}
          step={1}
          value={playhead}
          aria-label="Day"
          aria-valuetext={shortDate(days[playhead].date)}
          onChange={(e) => {
            started.current = true;
            setPlaying(false);
            setHover(null);
            setT(Number(e.target.value) + 1);
          }}
        />
        <button type="button" className="tl-btn" onClick={() => jumpEvent(1)} aria-label="Next event">
          <span aria-hidden="true">›</span>
        </button>
      </div>

      <div className="tl-panels">
        <EventCard mark={activeMark} onDay={onEventDay} days={days} />
        <Funnel day={day} />
      </div>

      <details className="tl-table">
        <summary>Every day as a table</summary>
        <div className="tl-table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Day</th>
                <th scope="col">Visitors</th>
                <th scope="col">First time</th>
                <th scope="col">From Reddit</th>
                <th scope="col">Played on day one</th>
                <th scope="col">Back next day</th>
                <th scope="col">Back a week later</th>
                <th scope="col">Regulars</th>
              </tr>
            </thead>
            <tbody>
              {[...days].reverse().map((d) => (
                <tr key={d.date}>
                  <th scope="row">{shortDate(d.date)}</th>
                  <td>{d.visitors === null ? '—' : fmt(d.visitors)}</td>
                  <td>{fmt(d.newBrowsers)}</td>
                  <td>{d.sources ? fmt(d.sources.reddit) : '—'}</td>
                  <td>{d.newStarted === null ? '—' : fmt(d.newStarted)}</td>
                  <td>{d.back1 === null ? '—' : fmt(d.back1)}</td>
                  <td>{d.back7 === null ? '—' : fmt(d.back7)}</td>
                  <td>{d.regulars === null ? '—' : fmt(d.regulars)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

function Legend({ lens }: { lens: Lens }) {
  const items: { cls: string; label: string }[] =
    lens === 'visitors'
      ? [
          { cls: 'tl-back', label: 'Been before' },
          { cls: 'tl-new', label: 'First time' },
        ]
      : lens === 'sources'
        ? [...SOURCES.map((s) => ({ cls: `tl-src-${s}`, label: SOURCE_LABELS[s] })), { cls: 'tl-src-unknown', label: SOURCE_LABELS.unknown }]
        : [
            { cls: 'tl-st-new', label: 'First time' },
            { cls: 'tl-st-played', label: 'Played a game that day' },
            { cls: 'tl-st-back1', label: 'Back the next day' },
            { cls: 'tl-st-back7', label: 'Back a week later' },
          ];
  return (
    <ul className="tl-legend">
      {items.map((it) => (
        <li key={it.cls}>
          <svg width="12" height="12" aria-hidden="true">
            <rect className={it.cls} width="12" height="12" rx="3" />
          </svg>
          {it.label}
        </li>
      ))}
      <li className="tl-legend-buds">
        {(['post', 'feature', 'test'] as const).map((k) => (
          <span key={k} className={`tl-kind-${k}`}>
            <svg width="12" height="12" viewBox="-6 -6 12 12" aria-hidden="true">
              <circle className="tl-petal" r="5" />
            </svg>
            {EVENT_KINDS[k]}
          </span>
        ))}
      </li>
    </ul>
  );
}

/** What happened, and that day's numbers: for traffic, who stuck; for a change, before vs after. */
function EventCard({ mark, onDay, days }: { mark: (MadtownEvent & { i: number }) | null; onDay: boolean; days: TimelineDay[] }) {
  if (!mark) {
    return (
      <section className="tl-card is-empty">
        <p>Flowers on the vine mark the days something happened. Tap one, or press Play.</p>
      </section>
    );
  }
  const d = days[mark.i];
  const next = days[mark.i + 1];
  let stat: React.ReactNode = null;
  if (mark.kind === 'post' || mark.kind === 'press') {
    const two = next && mark.kind === 'post' ? [d, next] : [d];
    const fresh = two.reduce((s, x) => s + x.newBrowsers, 0);
    const reddit = two.reduce((s, x) => s + (x.sources?.reddit ?? 0), 0);
    const b1 = two.every((x) => x.back1 !== null) ? two.reduce((s, x) => s + (x.back1 ?? 0), 0) : null;
    const b7 = two.every((x) => x.back7 !== null) ? two.reduce((s, x) => s + (x.back7 ?? 0), 0) : null;
    stat = (
      <p className="tl-card-stat">
        <strong>{fmt(fresh)}</strong> first-time visitors over {two.length === 2 ? 'those two days' : 'the day'}
        {reddit > 0 && two.every((x) => x.sources) ? <>, {pct(reddit, fresh)}% of them from Reddit</> : null}.{' '}
        {b1 !== null && (
          <>
            <strong>{pct(b1, fresh)}%</strong> came back the next day
            {b7 !== null ? (
              <>
                {' '}
                and <strong>{pct(b7, fresh)}%</strong> a week later.
              </>
            ) : (
              '.'
            )}
          </>
        )}
      </p>
    );
  } else if (mark.i > 0) {
    const before = pooledBack1(days, mark.i - 7, mark.i);
    const after = pooledBack1(days, mark.i, mark.i + 7);
    stat =
      before !== null && after !== null ? (
        <p className="tl-card-stat">
          First-time visitors back the next day: <strong>{before}%</strong> in the week before, <strong>{after}%</strong> in the week after.
        </p>
      ) : null;
  }
  return (
    <section className={`tl-card tl-kind-${mark.kind}${onDay ? ' is-on' : ''}`} aria-live="polite">
      <p className="tl-card-kicker">
        {EVENT_KINDS[mark.kind]} · {shortDate(mark.date)}
      </p>
      <h3>{mark.title}</h3>
      <p>{mark.body}</p>
      {stat}
    </section>
  );
}

/** That day's first-time visitors: how many played, came back the next day, and a week later. */
function Funnel({ day }: { day: TimelineDay }) {
  const rows = [
    { label: 'Here for the first time', v: day.newBrowsers, cls: 'tl-st-new' },
    { label: 'Played a game that day', v: day.newStarted, cls: 'tl-st-played' },
    { label: 'Came back the next day', v: day.back1, cls: 'tl-st-back1' },
    { label: 'Came back a week later', v: day.back7, cls: 'tl-st-back7' },
  ];
  const top = Math.max(1, day.newBrowsers);
  return (
    <section className="tl-card tl-funnel">
      <p className="tl-card-kicker">First-time visitors · {shortDate(day.date)}</p>
      <ul>
        {rows.map((r) => (
          <li key={r.label}>
            <span className="tl-funnel-label">{r.label}</span>
            <span className="tl-funnel-track">
              {r.v !== null && (
                <svg width="100%" height="10" aria-hidden="true">
                  <rect className={r.cls} width={`${Math.max(1, (r.v / top) * 100)}%`} height="10" rx="3" />
                </svg>
              )}
            </span>
            <span className="tl-funnel-n">
              {r.v === null ? (r === rows[1] ? 'not counted' : 'not yet') : r === rows[0] ? fmt(r.v) : `${fmt(r.v)} · ${pct(r.v, top)}%`}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
