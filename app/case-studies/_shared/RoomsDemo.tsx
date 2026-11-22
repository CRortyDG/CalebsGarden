'use client';

import { useState } from 'react';

/*
  A toy namespace. Cloudflare derives a Durable Object id from a name with
  idFromName; how it does that is Cloudflare's business. Here SHA-256 of the
  name stands in for it, because the property that matters is the same: the
  same name always lands on the same id, and different names never share one.
*/

type Room = { name: string; id: string; notes: number };

const CODE_CHARS = 'abcdefghjkmnpqrstuvwxyz23456789'; // the real alphabet: no 0/o, 1/l/i

async function idFor(name: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(name));
  return [...new Uint8Array(bytes)]
    .slice(0, 12)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function makeCode() {
  const r = new Uint32Array(7);
  crypto.getRandomValues(r);
  return [...r].map((n) => CODE_CHARS[n % CODE_CHARS.length]).join('');
}

function clean(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');
}

export default function RoomsDemo() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [code, setCode] = useState('');
  const [hit, setHit] = useState<string | null>(null);
  const [ghost, setGhost] = useState<{ name: string; id: string } | null>(null);
  const [msg, setMsg] = useState('Start a campaign, then try opening its code again, or a code nobody made.');

  const create = async () => {
    const name = makeCode();
    const id = await idFor(name);
    setRooms((r) => [...r, { name, id, notes: 0 }]);
    setHit(id);
    setGhost(null);
    setCode(name);
    setMsg(`New campaign ${name}. Its room is created on the first save.`);
  };

  const open = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = clean(code);
    if (!name) return;
    const id = await idFor(name);
    const found = rooms.find((r) => r.id === id);
    if (found) {
      setHit(id);
      setGhost(null);
      setMsg(`${name} → the same id as before, so the same room, with its ${found.notes} note${found.notes === 1 ? '' : 's'}.`);
    } else {
      setHit(null);
      setGhost({ name, id });
      setMsg(`${name} → a valid id, but that room has never saved anything. "No game here yet", and no rows written. A miss also counts toward the guessing limit.`);
    }
  };

  const addNote = (id: string) => {
    setRooms((rs) => rs.map((r) => (r.id === id ? { ...r, notes: r.notes + 1 } : r)));
    setHit(id);
    const r = rooms.find((x) => x.id === id);
    if (r) setMsg(`A note saved in ${r.name}. Every other room is untouched.`);
  };

  return (
    <section className="cs-demo" aria-labelledby="demo-rooms">
      <div className="cs-demo-head">
        <h3 id="demo-rooms">Try it: codes and rooms</h3>
        <span className="cs-demo-tag">Simulation in your browser</span>
      </div>
      <form className="cs-rooms-form" onSubmit={open}>
        <button type="button" className="cs-btn" onClick={create}>
          Start a campaign
        </button>
        <label>
          Campaign code
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. k7m2qpx" autoComplete="off" spellCheck={false} />
        </label>
        <button type="submit" className="cs-btn">
          Open
        </button>
      </form>
      <p className="cs-msg" aria-live="polite">
        {msg}
      </p>
      <div className="cs-rooms">
        {rooms.map((r) => (
          <div key={r.id} className={`cs-room${hit === r.id ? ' is-hit' : ''}`}>
            <b>{r.name}</b>
            <span className="id">id {r.id}…</span>
            <div className="row">
              <span>
                {r.notes} note{r.notes === 1 ? '' : 's'}
              </span>
              <button type="button" className="cs-btn" onClick={() => addNote(r.id)}>
                Add a note
              </button>
            </div>
          </div>
        ))}
        {ghost && (
          <div className="cs-room is-ghost">
            <b>{ghost.name}</b>
            <span className="id">id {ghost.id}…</span>
            <div className="row">
              <span>nothing stored</span>
            </div>
          </div>
        )}
      </div>
      <details className="cs-simplifies">
        <summary>What this simplifies</summary>
        <ul>
          <li>The ids here are SHA-256 of the code, cut short. Cloudflare makes the real ones; the demo only copies the promise that a name always maps to the same id.</li>
          <li>Real rooms live in Cloudflare, not in this tab, and starting a campaign also makes a DM key. Nothing here is sent anywhere.</li>
          <li>In the real app a code someone picks must have at least 8 letters or digits. Made-up codes are 7 characters from a 31-character alphabet, with look-alikes like 0, o, 1 and l left out.</li>
        </ul>
      </details>
    </section>
  );
}
