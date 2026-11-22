'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/*
  A toy copy of how one Candlefair room handles a change. It runs only in this
  page: no network, no Candlefair code. The rules it follows are the real ones,
  cut down: a write carries the version it read, the room refuses a stale one
  and the caller retries, and after every save each open screen is sent the
  whole view it may see (not a diff). A screen that was offline asks for its
  view when it comes back.
*/

type Pos = { x: number; y: number };
type Game = { version: number; gold: Record<Who, number>; tokens: Record<Who, Pos>; dmNote: string };
type Who = 'wren' | 'tolly';
type ScreenId = 'dm' | 'tv' | 'phone';
type View =
  | { kind: 'dm'; version: number; gold: Record<Who, number>; tokens: Record<Who, Pos>; dmNote: string }
  | { kind: 'tv'; version: number; partyGold: number; tokens: Record<Who, Pos> }
  | { kind: 'phone'; version: number; myGold: number; tokens: Record<Who, Pos> };
type Line = { id: number; text: string; tone?: 'room' | 'push' | 'warn' };

const COLS = 6;
const ROWS = 4;
const NAMES: Record<Who, string> = { wren: 'Wren', tolly: 'Tolly' };

const START: Game = {
  version: 41,
  gold: { wren: 12, tolly: 7 },
  tokens: { wren: { x: 1, y: 1 }, tolly: { x: 2, y: 2 } },
  dmNote: 'The ferryman is lying.',
};

/** The room's projection step: each screen gets only what it may see. */
function project(g: Game, screen: ScreenId): View {
  const tokens = structuredClone(g.tokens);
  if (screen === 'dm') return { kind: 'dm', version: g.version, gold: { ...g.gold }, tokens, dmNote: g.dmNote };
  if (screen === 'tv') return { kind: 'tv', version: g.version, partyGold: g.gold.wren + g.gold.tolly, tokens };
  return { kind: 'phone', version: g.version, myGold: g.gold.wren, tokens };
}

type Cmd = { t: 'pay'; each: number } | { t: 'move'; who: Who; to: Pos };

function apply(g: Game, cmd: Cmd): Game {
  const next = structuredClone(g);
  if (cmd.t === 'pay') for (const w of Object.keys(next.gold) as Who[]) next.gold[w] += cmd.each;
  else next.tokens[cmd.who] = cmd.to; // an absolute, snapped square: last write wins
  return next;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function SyncDemo() {
  const game = useRef<Game>(structuredClone(START));
  const [views, setViews] = useState<Record<ScreenId, View>>(() => ({
    dm: project(START, 'dm'),
    tv: project(START, 'tv'),
    phone: project(START, 'phone'),
  }));
  const [online, setOnline] = useState(true);
  const onlineRef = useRef(true);
  const [flash, setFlash] = useState<ScreenId[]>([]);
  const [log, setLog] = useState<Line[]>([{ id: 0, text: 'Room is at version 41. Three screens connected.' }]);
  const [busy, setBusy] = useState(false);
  const seq = useRef(1);
  const logEl = useRef<HTMLOListElement>(null);
  const slow = useRef(380);

  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    slow.current = m.matches ? 120 : 380;
  }, []);
  useEffect(() => {
    logEl.current?.scrollTo({ top: logEl.current.scrollHeight });
  }, [log]);

  const say = useCallback((text: string, tone?: Line['tone']) => {
    setLog((l) => [...l.slice(-60), { id: seq.current++, text, tone }]);
  }, []);

  const publish = useCallback(async () => {
    const g = game.current;
    const to: ScreenId[] = onlineRef.current ? ['dm', 'tv', 'phone'] : ['dm', 'tv'];
    setViews((v) => {
      const next = { ...v };
      for (const s of to) next[s] = project(g, s);
      return next;
    });
    setFlash(to);
    say(`room → pushes v${g.version} to ${to.length} screens, each its own view` + (onlineRef.current ? '' : ' (phone is offline, skipped)'), 'push');
    await wait(slow.current * 1.6);
    setFlash([]);
  }, [say]);

  /** One command, the way execute() handles it: read, apply, save if the version still matches, else retry. */
  const run = useCallback(
    async (from: string, cmd: Cmd, readAt?: number) => {
      for (let attempt = 0; attempt < 6; attempt++) {
        const read = attempt === 0 && readAt !== undefined ? readAt : game.current.version;
        const base = attempt === 0 && readAt !== undefined ? null : structuredClone(game.current);
        say(`${from} → POST /api/command  (read v${read})`);
        await wait(slow.current);
        if (game.current.version !== read) {
          say(`room: expected v${read}, it's v${game.current.version}. Refused, retrying.`, 'warn');
          await wait(slow.current);
          continue;
        }
        const next = apply(base ?? game.current, cmd);
        next.version = read + 1;
        game.current = next;
        say(`room: v${read} matches, saved as v${next.version} in one transaction`, 'room');
        await publish();
        return;
      }
    },
    [publish, say],
  );

  const guard = (fn: () => Promise<void>) => async () => {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  const pay = guard(() => run('DM', { t: 'pay', each: 5 }));

  const movePhone = (to: Pos) =>
    guard(async () => {
      if (!onlineRef.current) {
        say('phone: no connection. The move waits until it is back.', 'warn');
        return;
      }
      await run('phone', { t: 'move', who: 'wren', to });
    })();

  const race = guard(async () => {
    // Both screens read the same version, then both send.
    const v = game.current.version;
    say(`DM and phone both drag Wren, both read v${v}`);
    const a = { t: 'move', who: 'wren', to: { x: 4, y: 1 } } as const;
    const b = { t: 'move', who: 'wren', to: { x: 3, y: 3 } } as const;
    await run('DM', a, v);
    if (!onlineRef.current) {
      say('phone: offline, its move never left the device', 'warn');
      return;
    }
    await run('phone', b, v);
    say('Wren ends where the later save put her. Nothing merges positions.');
  });

  const toggle = guard(async () => {
    if (onlineRef.current) {
      onlineRef.current = false;
      setOnline(false);
      say('phone: Wi-Fi drops. The socket closes; it retries with backoff.', 'warn');
      return;
    }
    onlineRef.current = true;
    setOnline(true);
    say('phone: back. Opens a new socket and sends its key.');
    await wait(slow.current);
    const g = game.current;
    setViews((v) => ({ ...v, phone: project(g, 'phone') }));
    setFlash(['phone']);
    say(`room → sends the phone the latest view, v${g.version}. Missed versions don't matter.`, 'push');
    await wait(slow.current * 1.6);
    setFlash([]);
  });

  const reset = () => {
    game.current = structuredClone(START);
    onlineRef.current = true;
    setOnline(true);
    setViews({ dm: project(START, 'dm'), tv: project(START, 'tv'), phone: project(START, 'phone') });
    setLog([{ id: seq.current++, text: 'Reset. Room is at version 41.' }]);
  };

  const v = views;
  return (
    <section className="cs-demo" aria-labelledby="demo-sync">
      <div className="cs-demo-head">
        <h3 id="demo-sync">Try it: one change, three screens</h3>
        <span className="cs-demo-tag">Simulation in your browser</span>
      </div>
      <div className="cs-demo-bar">
        <button type="button" className="cs-btn" onClick={pay} disabled={busy}>
          DM: pay everyone 5 gp
        </button>
        <button type="button" className="cs-btn" onClick={race} disabled={busy}>
          Two people drag Wren at once
        </button>
        <button type="button" className={`cs-btn${online ? '' : ' is-on'}`} onClick={toggle} disabled={busy} aria-pressed={!online}>
          {online ? 'Drop the phone’s Wi-Fi' : 'Bring the phone back'}
        </button>
        <button type="button" className="cs-btn" onClick={reset} disabled={busy}>
          Reset
        </button>
      </div>
      <div className="cs-screens">
        <Screen title="DM console" view={v.dm} flash={flash.includes('dm')}>
          {v.dm.kind === 'dm' && (
            <>
              <ul>
                <li>
                  <span>Wren</span>
                  <span>{v.dm.gold.wren} gp</span>
                </li>
                <li>
                  <span>Tolly</span>
                  <span>{v.dm.gold.tolly} gp</span>
                </li>
                <li className="muted">
                  <span>DM note</span>
                  <span>{v.dm.dmNote}</span>
                </li>
              </ul>
              <Board tokens={v.dm.tokens} />
            </>
          )}
        </Screen>
        <Screen title="Table TV" view={v.tv} flash={flash.includes('tv')}>
          {v.tv.kind === 'tv' && (
            <>
              <ul>
                <li>
                  <span>Party purse</span>
                  <span>{v.tv.partyGold} gp</span>
                </li>
                <li className="muted">
                  <span>DM note</span>
                  <span>not sent</span>
                </li>
              </ul>
              <Board tokens={v.tv.tokens} />
            </>
          )}
        </Screen>
        <Screen title="Wren’s phone" view={v.phone} flash={flash.includes('phone')} offline={!online}>
          {v.phone.kind === 'phone' && (
            <>
              <ul>
                <li>
                  <span>My gold</span>
                  <span>{v.phone.myGold} gp</span>
                </li>
                <li className="muted">
                  <span>Tap a square to move</span>
                  <span>{online ? '' : 'offline'}</span>
                </li>
              </ul>
              <Board tokens={v.phone.tokens} onPick={busy ? undefined : movePhone} />
            </>
          )}
        </Screen>
      </div>
      <ol className="cs-log" ref={logEl} aria-live="polite" aria-label="What the room did">
        {log.map((l) => (
          <li key={l.id} className={l.tone ? `is-${l.tone}` : undefined}>
            {l.text}
          </li>
        ))}
      </ol>
      <details className="cs-simplifies">
        <summary>What this simplifies</summary>
        <ul>
          <li>It runs entirely in this page. There is no Worker, no Durable Object and no network, so the delays are made up.</li>
          <li>The real room runs more than two hundred kinds of command through one rules function, and a view holds far more than gold and two tokens.</li>
          <li>In the real app the phone keeps its own move on screen while it waits, and the room only lets a player move their own token, on the map that is on the TV, unless the DM has locked it.</li>
          <li>The version check and retry loop came across unchanged from the Redis version, where several functions really could write at once. The demo forces a clash so you can see it.</li>
        </ul>
      </details>
    </section>
  );
}

function Screen({ title, view, flash, offline, children }: { title: string; view: View; flash: boolean; offline?: boolean; children: React.ReactNode }) {
  return (
    <div className={`cs-screen${flash ? ' is-flash' : ''}${offline ? ' is-offline' : ''}`}>
      <h4>
        {title}
        <span>v{view.version}</span>
      </h4>
      {children}
    </div>
  );
}

function Board({ tokens, onPick }: { tokens: Record<Who, Pos>; onPick?: (p: Pos) => void }) {
  const cells = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const who = (Object.keys(tokens) as Who[]).find((w) => tokens[w].x === x && tokens[w].y === y);
      const cls = `cs-cell${who === 'wren' ? ' is-w' : who === 'tolly' ? ' is-t' : ''}`;
      const label = who ? NAMES[who][0] : '';
      cells.push(
        onPick ? (
          <button key={`${x}-${y}`} type="button" className={cls} onClick={() => onPick({ x, y })} aria-label={`Move Wren to column ${x + 1}, row ${y + 1}${who ? `, ${NAMES[who]} is here` : ''}`}>
            {label}
          </button>
        ) : (
          <span key={`${x}-${y}`} className={cls} aria-hidden="true">
            {label}
          </span>
        ),
      );
    }
  }
  return <div className="cs-grid">{cells}</div>;
}
