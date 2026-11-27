/**
 * "Watch me write this": the recording format and the replay engine.
 *
 * A recording is a list of steps. Each step is one change to the text:
 *   [ms since the step before, position, characters removed, text typed, flag?]
 * flag 'p' marks a paste or drop. Everything else (when each writing session
 * started, notes, hidden spans) hangs off step numbers.
 *
 * Every character ever typed gets an id: the n-th character typed is id n. Ids
 * are never stored; replaying the steps always rebuilds them the same way, which
 * is how notes stay attached to their words and how a deleted span is found
 * again to blank it out. No imports, so it runs in the browser, on the server
 * and in node (scripts/typing-check.ts).
 */

export type Step = [dt: number, pos: number, del: number, ins: string, flag?: StepFlag];

/** 'p': a paste or drop. 'a0', 'a1'…: text pasted from an AI, from that ask (an index into `asks`). */
export type StepFlag = 'p' | `a${number}`;

/**
 * One time the writer asked an AI for help: what they asked, what came back,
 * and the moment it happened (step count, like a note). Text pasted from the
 * reply is flagged on its step, so every character knows where it came from.
 * An ask with nothing pasted from it is a suggestion the writer didn't use.
 */
export type Ask = { at: number; prompt: string; reply?: string; tool?: string; why?: string };

/** Which ask a step's text came from, or -1 if it was typed (or pasted from somewhere else). */
export const askOf = (s: Step): number => (s[4] && s[4] !== 'p' ? Number(s[4].slice(1)) : -1);

export type Session = { at: number; wall: number }; // first step of the session, wall clock (ms)

export type DeskNote = {
  id: string;
  text: string;
  from: number; // id of the first character it's pinned to (-1: none, pinned to a point)
  to: number; // id of the last character
  at: number; // step count when it was written, for "what was I writing?"
  quote?: string; // the words it was pinned to when written, in case they're later deleted
  done?: boolean;
};

/** A note in a replay: what it says, the moment it was written, and the characters it points at (-1: a point, not words). */
export type ShownNote = { at: number; text: string; from?: number; to?: number };

/** Where a note's characters are in text with these ids, as [start, end), or null if they're gone or it's a point. */
export function noteRange(ids: number[], from: number | undefined, to: number | undefined): [number, number] | null {
  if (from === undefined || to === undefined || from < 0) return null;
  const a = ids.indexOf(from);
  const b = ids.indexOf(to);
  if (a === -1 && b === -1) return null;
  const lo = a === -1 ? b : a;
  const hi = b === -1 ? a : b;
  return [Math.min(lo, hi), Math.max(lo, hi) + 1];
}

export type Recording = {
  v: 1;
  steps: Step[];
  sessions: Session[];
  notes?: ShownNote[];
  hidden?: number; // how many characters were blanked out, for the "What this shows" line
  asks?: Ask[]; // AI help, in the order it was asked
};

/** Where a note's replay opens: the top of its text (RecordedNote puts an element with this id there). */
export const SLOT_ID = 'ww-slot';

/** Blanked-out characters are replaced with this; the player draws them as a gray bar. */
export const MASK = '█';

/** A gap longer than this is a break between writing sessions, shown as a card. */
export const BREAK_MS = 10 * 60 * 1000;
/** How long a break card stays up, in player time. */
export const BREAK_CARD_MS = 2500;
/** "Skip pauses" shortens any stop to this. */
export const SKIP_PAUSE_MS = 1500;
/** A deletion at least this long gets a marker on the scrubber. */
export const BIG_DELETE = 40;

/** The text plus, for each character, its id. */
export type Doc = { text: string; ids: number[]; next: number };

export const emptyDoc = (): Doc => ({ text: '', ids: [], next: 0 });

/** Apply one step in place. Returns what it removed (text and ids), for the ghost and for spans. */
export function apply(doc: Doc, s: Step): { text: string; ids: number[] } {
  const [, pos, del, ins] = s;
  const gone = doc.text.slice(pos, pos + del);
  const goneIds = doc.ids.slice(pos, pos + del);
  const newIds = Array.from({ length: ins.length }, (_, i) => doc.next + i);
  doc.next += ins.length;
  doc.text = doc.text.slice(0, pos) + ins + doc.text.slice(pos + del);
  doc.ids.splice(pos, del, ...newIds);
  return { text: gone, ids: goneIds };
}

/** Just the ids, no text: how the player follows a note's words. */
export function applyIds(d: { ids: number[]; next: number }, s: Step) {
  const n = s[3].length;
  d.ids.splice(s[1], s[2], ...Array.from({ length: n }, (_, i) => d.next + i));
  d.next += n;
}

/** Just the text, no ids: fast enough for the player. */
export function applyText(text: string, s: Step): string {
  return text.slice(0, s[1]) + s[3] + text.slice(s[1] + s[2]);
}

export function replay(steps: Step[], upTo = steps.length): Doc {
  const d = emptyDoc();
  for (let i = 0; i < upTo; i++) apply(d, steps[i]);
  return d;
}

export const finalText = (rec: Pick<Recording, 'steps'>) => {
  let t = '';
  for (const s of rec.steps) t = applyText(t, s);
  return t;
};

/** The single step that turns `before` into `after` (common start and end kept), or null if they match. */
export function diff(before: string, after: string): { pos: number; del: number; ins: string } | null {
  if (before === after) return null;
  let a = 0;
  const max = Math.min(before.length, after.length);
  while (a < max && before[a] === after[a]) a++;
  let b = 0;
  while (b < max - a && before[before.length - 1 - b] === after[after.length - 1 - b]) b++;
  return { pos: a, del: before.length - a - b, ins: after.slice(a, after.length - b) };
}

export const wordCount = (t: string) => (t.match(/[^\s#*_>`[\]()-]+/g) ?? []).length;

// ---------- deleted spans, for the Publish step ----------

export type Span = {
  key: string; // id of its first character, stable across reloads
  ids: number[]; // every character in it, in reading order
  text: string;
  before: string; // a little of the text in front of it, at the moment it was deleted
  at: number; // the step that finished deleting it
};

/**
 * Everything typed and later deleted, grouped the way it was deleted: a run of
 * backspaces (or forward deletes) close together is one span, a selection
 * deleted or typed over is one span. Spans shorter than `min` are left out.
 */
export function deletedSpans(steps: Step[], min = 3): Span[] {
  const d = emptyDoc();
  const out: Span[] = [];
  let cur: (Span & { pos: number; end: number }) | null = null;
  const close = () => {
    if (cur && cur.ids.length >= min) out.push({ key: String(cur.ids[0]), ids: cur.ids, text: cur.text, before: cur.before, at: cur.at });
    cur = null;
  };
  steps.forEach((s, i) => {
    const [dt, pos, del, ins] = s;
    const ctx = d.text.slice(Math.max(0, pos - 40), pos);
    const gone = apply(d, s);
    if (!del) {
      close();
      return;
    }
    const backspace = cur && !ins && dt < 3000 && pos + del === cur.pos;
    const forward = cur && !ins && dt < 3000 && pos === cur.pos;
    if (backspace && cur) {
      cur.ids = [...gone.ids, ...cur.ids];
      cur.text = gone.text + cur.text;
      cur.before = ctx;
      cur.pos = pos;
      cur.at = i + 1;
    } else if (forward && cur) {
      cur.ids.push(...gone.ids);
      cur.text += gone.text;
      cur.at = i + 1;
    } else {
      close();
      cur = { key: '', ids: gone.ids, text: gone.text, before: ctx, at: i + 1, pos, end: pos + del };
    }
    if (ins) close();
  });
  close();
  return out;
}

/** A copy of the steps with these character ids swapped for MASK. Only deleted characters can be hidden. */
export function maskSteps(steps: Step[], hide: Set<number>): Step[] {
  let id = 0;
  return steps.map((s) => {
    const ins = s[3];
    let changed = false;
    let out = '';
    for (let k = 0; k < ins.length; k++, id++) {
      if (hide.has(id)) {
        out += MASK;
        changed = true;
      } else out += ins[k];
    }
    if (!changed) return s;
    const copy = [...s] as Step;
    copy[3] = out;
    return copy;
  });
}

// ---------- the player's clock ----------

export type Timeline = {
  end: number[]; // player time (ms at 1x) when step i lands
  breaks: { at: number; from: number; wall: number }[]; // card before step `at`, starting at player time `from`
  total: number;
  writingMs: number; // real time spent writing, breaks left out
};

/** Lay the steps out in player time. Breaks become a short card; skip pauses shortens long stops. */
export function timeline(rec: Recording, skipPauses: boolean): Timeline {
  const starts = new Map(rec.sessions.map((s) => [s.at, s.wall]));
  const end: number[] = new Array(rec.steps.length);
  const breaks: Timeline['breaks'] = [];
  let t = 0;
  let writing = 0;
  rec.steps.forEach((s, i) => {
    const dt = s[0];
    if (i > 0 && (starts.has(i) || dt > BREAK_MS)) {
      breaks.push({ at: i, from: t, wall: starts.get(i) ?? 0 });
      t += BREAK_CARD_MS;
    } else {
      const wait = Math.max(0, skipPauses ? Math.min(dt, SKIP_PAUSE_MS) : dt);
      t += wait;
      writing += Math.max(0, dt);
    }
    end[i] = t;
  });
  return { end, breaks, total: t, writingMs: writing };
}

/** How many steps have landed by player time t. */
export function stepsAt(tl: Timeline, t: number): number {
  let lo = 0;
  let hi = tl.end.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (tl.end[mid] <= t) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/** Text snapshots every `every` steps, so scrubbing never replays from the start. */
export function snapshots(steps: Step[], every = 400): string[] {
  const out = [''];
  let t = '';
  steps.forEach((s, i) => {
    t = applyText(t, s);
    if ((i + 1) % every === 0) out.push(t);
  });
  return out;
}

export function textAt(steps: Step[], snaps: string[], n: number, every = 400): string {
  const k = Math.min(Math.floor(n / every), snaps.length - 1);
  let t = snaps[k];
  for (let i = k * every; i < n; i++) t = applyText(t, steps[i]);
  return t;
}

/** Markers for the scrubber: big deletions, pastes, new sessions, shown notes. */
export type Marker = { step: number; kind: 'delete' | 'paste' | 'session' | 'note' | 'ai'; label: string };

export function markers(rec: Recording): Marker[] {
  const out: Marker[] = [];
  rec.sessions.forEach((s, i) => i > 0 && out.push({ step: s.at, kind: 'session', label: `Session ${i + 1}` }));
  rec.steps.forEach((s, i) => {
    if (s[2] >= BIG_DELETE) out.push({ step: i, kind: 'delete', label: `Deleted ${s[2]} characters` });
    if (s[4] === 'p') out.push({ step: i, kind: 'paste', label: `Pasted ${s[3].length} characters` });
  });
  (rec.asks ?? []).forEach((a, k) => out.push({ step: Math.max(0, a.at - 1), kind: 'ai', label: `Ask ${k + 1}: ${a.prompt}` }));
  (rec.notes ?? []).forEach((n) => out.push({ step: Math.max(0, n.at - 1), kind: 'note', label: n.text }));
  return out.sort((a, b) => a.step - b.step);
}

/** Checks a recording someone hands us is the right shape, so a bad file fails loudly. */
export function isRecording(x: unknown): x is Recording {
  const r = x as Recording;
  return (
    !!r &&
    r.v === 1 &&
    Array.isArray(r.steps) &&
    Array.isArray(r.sessions) &&
    r.steps.every((s) => Array.isArray(s) && typeof s[0] === 'number' && typeof s[1] === 'number' && typeof s[2] === 'number' && typeof s[3] === 'string') &&
    (r.asks === undefined || (Array.isArray(r.asks) && r.asks.every((a) => typeof a.at === 'number' && typeof a.prompt === 'string'))) &&
    r.steps.every((s) => askOf(s) < (r.asks?.length ?? 0))
  );
}

// ---------- "How this was made": who wrote what ----------
/*
 * Who wrote each part of a piece, worked out from its
 * recording. Text pasted from an AI is flagged on its step (see `askOf`), and
 * every character keeps its id, so the final text can say, character by
 * character, whether it was typed or came from an AI and is still exactly as
 * the AI wrote it. A character the writer typed over an AI draft counts as
 * theirs.
 */

export const MINE = -1;

/** For every character id ever typed, the ask it came from (MINE if typed). */
export function originById(steps: Step[]): Int16Array {
  let n = 0;
  for (const s of steps) n += s[3].length;
  const out = new Int16Array(n).fill(MINE);
  let id = 0;
  for (const s of steps) {
    const k = askOf(s);
    if (k >= 0) out.fill(k, id, id + s[3].length);
    id += s[3].length;
  }
  return out;
}

/** The final text and, for each of its characters, where it came from. */
export function finalOrigins(rec: Pick<Recording, 'steps'>): { text: string; origin: Int16Array } {
  const byId = originById(rec.steps);
  const d = emptyDoc();
  for (const s of rec.steps) apply(d, s);
  return { text: d.text, origin: Int16Array.from(d.ids, (id) => byId[id]) };
}

const solid = (c: string) => !/\s/.test(c);

export type Share = { mine: number; ai: number; aiPct: number };

/** Characters (spaces left out) typed by the writer vs still as the AI wrote them. */
export function share(text: string, origin: Int16Array, from = 0, to = text.length): Share {
  let mine = 0;
  let ai = 0;
  for (let i = from; i < to; i++) {
    if (!solid(text[i])) continue;
    if (origin[i] === MINE) mine++;
    else ai++;
  }
  const all = mine + ai;
  return { mine, ai, aiPct: all ? Math.round((100 * ai) / all) : 0 };
}

export type Outcome = { kind: 'unused' | 'kept' | 'edited' | 'cut'; offered: number; kept: number; pct: number };

/** What became of each ask: never pasted, pasted and kept as written, partly kept, or pasted then cut. */
export function outcomes(rec: Recording): Outcome[] {
  const asks = rec.asks ?? [];
  const offered = new Array(asks.length).fill(0);
  for (const s of rec.steps) {
    const k = askOf(s);
    if (k >= 0) for (const c of s[3]) if (solid(c)) offered[k]++;
  }
  const kept = new Array(asks.length).fill(0);
  const { text, origin } = finalOrigins(rec);
  for (let i = 0; i < text.length; i++) if (origin[i] >= 0 && solid(text[i])) kept[origin[i]]++;
  return asks.map((_, k) => {
    const o = offered[k];
    const c = kept[k];
    const pct = o ? Math.round((100 * c) / o) : 0;
    const kind = o === 0 ? 'unused' : c === 0 ? 'cut' : c >= o ? 'kept' : 'edited';
    return { kind, offered: o, kept: c, pct };
  });
}

// ---------- the text cut into sentences, for the "who wrote what" view ----------

export type Seg = { start: number; end: number };
export type Block = { kind: 'h2' | 'h3' | 'p' | 'ul' | 'ol' | 'quote'; items: Seg[][] };

/** Sentences in a run of text, as [start, end) offsets with the spaces around them left out. */
function sentences(text: string, from: number, to: number): Seg[] {
  const out: Seg[] = [];
  let a = from;
  for (let i = from; i < to; i++) {
    const end = i === to - 1 || (/[.!?]/.test(text[i]) && /\s/.test(text[i + 1] ?? ' ') && !/[.!?]/.test(text[i + 1] ?? ''));
    if (!end) continue;
    let s = a;
    let e = i + 1;
    while (s < e && /\s/.test(text[s])) s++;
    while (e > s && /\s/.test(text[e - 1])) e--;
    if (e > s) out.push({ start: s, end: e });
    a = i + 1;
  }
  return out;
}

/**
 * The same blocks the note's Markdown makes (paragraphs, ## headings, lists,
 * quotes), but as offsets into the text, cut into sentences. List items and
 * quote lines are cut the same way, with their markers left out.
 */
export function blocks(text: string, from = 0): Block[] {
  const lines: { start: number; end: number }[] = [];
  let at = from;
  for (const l of text.slice(from).split('\n')) {
    lines.push({ start: at, end: at + l.length });
    at += l.length + 1;
  }
  const groups: { start: number; end: number }[][] = [];
  let cur: { start: number; end: number }[] = [];
  const flush = () => (cur.length && groups.push(cur), (cur = []));
  for (const l of lines) {
    const t = text.slice(l.start, l.end);
    if (!t.trim()) flush();
    else if (/^#{1,3}\s/.test(t)) {
      flush();
      groups.push([l]);
    } else cur.push(l);
  }
  flush();
  return groups.map((g) => {
    const first = text.slice(g[0].start, g[0].end);
    const h = first.match(/^(#{1,3})\s+/);
    if (h) return { kind: h[1].length === 3 ? 'h3' : 'h2', items: [sentences(text, g[0].start + h[0].length, g[0].end)] };
    const lineItems = (re: RegExp) => g.map((l) => sentences(text, l.start + (text.slice(l.start, l.end).match(re)?.[0].length ?? 0), l.end));
    const all = (re: RegExp) => g.every((l) => re.test(text.slice(l.start, l.end)));
    if (all(/^>\s?/)) return { kind: 'quote', items: [lineItems(/^>\s?/).flat()] };
    if (all(/^[-*]\s+/)) return { kind: 'ul', items: lineItems(/^[-*]\s+/) };
    if (all(/^\d+\.\s+/)) return { kind: 'ol', items: lineItems(/^\d+\.\s+/) };
    return { kind: 'p', items: [sentences(text, g[0].start, g[g.length - 1].end)] };
  });
}

export type Who = 'mine' | 'ai' | 'mixed';

/** Who wrote a sentence: all typed, all still the AI's words, or a mix. `ask` is the ask most of its AI words came from. */
export function who(text: string, origin: Int16Array, seg: Seg): { who: Who; ask: number; aiPct: number } {
  const sh = share(text, origin, seg.start, seg.end);
  const count = new Map<number, number>();
  for (let i = seg.start; i < seg.end; i++) if (origin[i] >= 0) count.set(origin[i], (count.get(origin[i]) ?? 0) + 1);
  const ask = [...count.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? MINE;
  return { who: sh.ai === 0 ? 'mine' : sh.mine === 0 ? 'ai' : 'mixed', ask, aiPct: sh.aiPct };
}
