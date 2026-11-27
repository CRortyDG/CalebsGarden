// Makes public/typing/how-it-was-made-example.json: a made-up recording of a
// short piece written with some AI help, for the /desk/how-it-was-made demo.
// Nobody typed it; this script plays the part of the writer, with a seeded
// random hand so the file comes out the same every time.
// Run: node --no-warnings scripts/make-ai-example.mts
import { writeFileSync } from 'node:fs';
import { diff, finalText, type Ask, type Recording, type Step, type StepFlag } from '../src/typing/format.ts';

let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const between = (a: number, b: number) => Math.round(a + rand() * (b - a));

const steps: Step[] = [];
const sessions: Recording['sessions'] = [];
const asks: Ask[] = [];
let text = '';
let wall = Date.UTC(2026, 10, 20, 2, 14); // a Thursday evening in Madison
let pending = 0;

const wait = (ms: number) => (pending += ms);
function change(next: string, dt: number, flag?: StepFlag) {
  const d = diff(text, next);
  if (!d) return;
  const gap = pending + dt;
  pending = 0;
  wall += gap;
  const s: Step = [gap, d.pos, d.del, d.ins];
  if (flag) s.push(flag);
  steps.push(s);
  text = next;
}
function session(daysLater = 0) {
  // The step after a break carries the whole gap, which is how the replay words its card.
  if (sessions.length) pending = daysLater * 24 * 3600 * 1000 - 3 * 3600 * 1000;
  sessions.push({ at: steps.length, wall: wall + pending });
}

/** Type at position `at` (default: the end), one key at a time, with a slip now and then. */
function type(s: string, at = text.length) {
  let pos = at;
  for (const ch of s) {
    if (/[a-z]/.test(ch) && rand() < 0.025) {
      change(text.slice(0, pos) + 'qwertyuiopasdfghjklzxcvbnm'[between(0, 25)] + text.slice(pos), between(70, 160));
      change(text.slice(0, pos) + text.slice(pos + 1), between(250, 500));
    }
    const dt = /[.!?]/.test(ch) ? between(150, 300) : ch === ' ' ? between(90, 220) : between(70, 190);
    change(text.slice(0, pos) + ch + text.slice(pos), dt);
    pos++;
    if (/[.!?]/.test(ch)) wait(between(900, 3500));
  }
}
/** Select `old` and type `next` over it. */
function retype(old: string, next: string) {
  const at = text.indexOf(old);
  if (at < 0) throw new Error(`no "${old}"`);
  wait(between(1500, 4000));
  change(text.slice(0, at) + next[0] + text.slice(at + old.length), between(400, 900));
  type(next.slice(1), at + 1);
}
/** Backspace `old` away, one key at a time. */
function backspace(old: string) {
  const at = text.indexOf(old);
  if (at < 0) throw new Error(`no "${old}"`);
  wait(between(1200, 3000));
  for (let i = old.length; i > 0; i--) change(text.slice(0, at + i - 1) + text.slice(at + old.length), between(40, 90));
}
function ask(a: Omit<Ask, 'at'>, think = 25000) {
  wait(think); // off in the chat window
  asks.push({ ...a, at: steps.length });
  return asks.length - 1;
}
function paste(s: string, k: number) {
  wait(between(3000, 8000));
  change(text + s, between(200, 400), `a${k}`);
}

// ---- first sitting ----
session();
type('# Keeping a balcony garden through winter\n\n');

const opening = ask({
  tool: 'Claude',
  prompt: 'Give me two opening lines for a short piece about keeping a balcony garden alive through a Wisconsin winter.',
  reply:
    '1. Every November, my balcony turns into a small argument with the weather.\n2. Winter on a balcony is a slow negotiation between clay pots and frost.',
});
paste('Every November, my balcony turns into a small argument with the weather.', opening);
retype('a small argument', 'a long argument');
retype('the weather', 'the wind off Lake Mendota');
type(' I lose most years. These are the things that have helped me lose a little less.\n\n');
type('## What I do now\n\n');

const list = ask({
  tool: 'Claude',
  prompt: 'List three short, practical ways to protect potted plants on a balcony from frost. One line each.',
  reply:
    '- Group the pots together against the wall, where the building leaks a little warmth.\n- Wrap the pots, not just the plants: bubble wrap or burlap around the sides keeps the roots from freezing.\n- Water in the morning before a cold night, since damp soil holds heat better than dry soil.',
});
paste(
  '- Group the pots together against the wall, where the building leaks a little warmth.\n- Wrap the pots, not just the plants: bubble wrap or burlap around the sides keeps the roots from freezing.\n- Water in the morning before a cold night, since damp soil holds heat better than dry soil.',
  list,
);
wait(9000);
backspace('Water in the morning before a cold night, since damp soil holds heat better than dry soil.');
type('Bring the rosemary in. It has never once made it to spring out there, whatever I wrap it in.');

// ---- the next day ----
session(1);
type('\n\nThe part I still get wrong is giving up too soon. A pot that looks finished in February is usually just asleep. ');
type('The ones I threw out were the ones that would have come back.');

ask(
  {
    tool: 'Claude',
    prompt: 'Make this paragraph sound warmer and more hopeful.',
    reply:
      "Here's the thing I keep relearning: patience is its own kind of gardening. That brown, brittle pot in February isn't gone. It's dreaming of May.",
    why: 'Too cute. I kept mine.',
  },
  40000,
);
wait(6000);
type('\n\nSo now I wait until April to decide.');

const rec: Recording = { v: 1, steps, sessions, asks };
if (finalText(rec) !== text) throw new Error('replay does not end on the text');
const out = new URL('../public/typing/how-it-was-made-example.json', import.meta.url);
writeFileSync(out, JSON.stringify(rec));
console.log(`${steps.length} steps, ${Math.round(JSON.stringify(rec).length / 1024)} KB\n\n${text}`);
