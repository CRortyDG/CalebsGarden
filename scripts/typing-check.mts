// Checks for the "Watch me write this" engine, plus every published recording.
// Run: npm run typing:check   (node 22.18+ runs TypeScript directly)
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';
import { MASK, deletedSpans, diff, finalText, isRecording, maskSteps, replay, snapshots, stepsAt, textAt, timeline, type Recording, type Step } from '../src/typing/format.ts';

// Type a string the way the desk records it: diff before/after each change.
function record(states: string[], dt = 120): Step[] {
  const steps: Step[] = [];
  let prev = '';
  for (const next of states) {
    const d = diff(prev, next);
    if (d) steps.push([dt, d.pos, d.del, d.ins]);
    prev = next;
  }
  return steps;
}
const typed = (s: string, from = '') => Array.from({ length: s.length }, (_, i) => from + s.slice(0, i + 1));

// diff
assert.deepEqual(diff('abc', 'abXc'), { pos: 2, del: 0, ins: 'X' });
assert.deepEqual(diff('aaa', 'aa'), { pos: 2, del: 1, ins: '' });
assert.deepEqual(diff('hello world', 'hello there'), { pos: 6, del: 5, ins: 'there' });
assert.equal(diff('same', 'same'), null);

// Typing, backspacing a name, then typing on
const states = [...typed('Hi Bob'), 'Hi Bo', 'Hi B', 'Hi ', ...typed('friend', 'Hi ')];
const steps = record(states);
assert.equal(finalText({ steps }), 'Hi friend');

// The backspaced name is one span
const spans = deletedSpans(steps);
assert.equal(spans.length, 1);
assert.equal(spans[0].text, 'Bob');
assert.equal(spans[0].before, 'Hi ');

// Blanking it hides the letters everywhere but leaves the final text alone
const masked = maskSteps(steps, new Set(spans[0].ids));
assert.equal(finalText({ steps: masked }), 'Hi friend');
assert.ok(!JSON.stringify(masked).includes('B'));
assert.ok(masked.some((s) => s[3] === MASK));

// A selection typed over is one span
const os = deletedSpans(record(['The cat sat', 'The dog sat']));
assert.ok(os.some((s) => s.text === 'cat'));

// Ids survive edits: the characters of "friend" keep their ids
const doc = replay(steps);
assert.equal(doc.ids.length, doc.text.length);

// Snapshots give the same text as a full replay at every point
const long = record(typed('The quick brown fox jumps over the lazy dog. '.repeat(30)));
const snaps = snapshots(long, 50);
for (const n of [0, 1, 49, 50, 51, 333, long.length]) assert.equal(textAt(long, snaps, n, 50), finalText({ steps: long.slice(0, n) }));

// Breaks become a card, skip pauses shortens stops
const rec: Recording = {
  v: 1,
  steps: [[0, 0, 0, 'a'], [5000, 1, 0, 'b'], [3 * 24 * 3600 * 1000, 2, 0, 'c']],
  sessions: [{ at: 0, wall: 0 }, { at: 2, wall: 1 }],
};
const real = timeline(rec, false);
assert.equal(real.breaks.length, 1);
assert.equal(real.total, 5000 + 2500);
assert.equal(timeline(rec, true).total, 1500 + 2500);
assert.equal(stepsAt(real, 0), 1);
assert.equal(stepsAt(real, 4999), 1);
assert.equal(stepsAt(real, 5000), 2);
assert.equal(stepsAt(real, real.total), 3);

// Every published recording is well formed
const dir = new URL('../public/typing/', import.meta.url);
let files = 0;
if (existsSync(dir)) {
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.json'))) {
    const r = JSON.parse(readFileSync(new URL(f, dir), 'utf8'));
    assert.ok(isRecording(r), `${f} is not a recording`);
    finalText(r);
    files++;
  }
}
console.log(`typing-check: engine ok, ${files} published recording${files === 1 ? '' : 's'} ok`);
