'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BREAK_MS, deletedSpans, diff, finalText, maskSteps, replay, wordCount, type DeskNote, type Doc, type Recording, type Step } from './format';
import { Player } from './Player';
import { askToKeep, deleteDraft, download, getDraft, listDrafts, newDraft, putDraft, type Backup, type Draft } from './store';
import './typing.css';

const DAY = 24 * 3600 * 1000;

const titleOf = (text: string) => text.split('\n').find((l) => l.trim())?.replace(/^#+\s*/, '').trim().slice(0, 80) || 'Untitled draft';
const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'untitled';
const when = (ms: number) => new Date(ms).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

/** The private writing desk at /desk. Drafts live in this browser only. */
export function Desk() {
  const [drafts, setDrafts] = useState<Draft[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const refresh = useCallback(() => {
    listDrafts()
      .then((d) => setDrafts(d.sort((a, b) => b.updated - a.updated)))
      .catch(() => setFailed(true));
  }, []);
  useEffect(() => {
    refresh();
    askToKeep();
  }, [refresh]);

  if (failed)
    return (
      <main className="desk">
        <h1>The desk</h1>
        <p className="desk-warn">This browser won&rsquo;t let the desk save drafts (a private window can do this). Open it in a normal window.</p>
      </main>
    );
  if (openId) return <Editor id={openId} onBack={() => (setOpenId(null), refresh())} />;
  return <DraftList drafts={drafts} onOpen={setOpenId} onChange={refresh} />;
}

function DraftList({ drafts, onOpen, onChange }: { drafts: Draft[] | null; onOpen: (id: string) => void; onChange: () => void }) {
  const file = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');
  const start = async () => {
    const d = newDraft();
    await putDraft(d);
    onOpen(d.id);
  };
  const load = async (f: File) => {
    try {
      const b = JSON.parse(await f.text()) as Backup;
      if (b.kind !== 'desk-draft' || !b.draft?.steps) throw new Error();
      const d = b.draft;
      if (await getDraft(d.id)) {
        const mine = await getDraft(d.id);
        if (mine && mine.updated >= d.updated) {
          setMsg('That draft is already here, and the copy here is as new or newer. Nothing changed.');
          return;
        }
      }
      await putDraft(d);
      setMsg(`Loaded “${titleOf(finalText(d))}”.`);
      onChange();
    } catch {
      setMsg('That file isn’t a desk backup.');
    }
  };
  return (
    <main className="desk">
      <header className="desk-head">
        <h1>The desk</h1>
        <p>Drafts stay in this browser. Nothing you write here is uploaded until you publish it and send the file on.</p>
      </header>
      <div className="desk-actions">
        <button type="button" className="desk-primary" onClick={start}>
          New draft
        </button>
        <button type="button" onClick={() => file.current?.click()}>
          Load a backup
        </button>
        <input
          ref={file}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) load(f);
            e.target.value = '';
          }}
        />
      </div>
      {msg && <p className="desk-msg" role="status">{msg}</p>}
      {drafts === null ? null : drafts.length === 0 ? (
        <p className="desk-empty">No drafts yet.</p>
      ) : (
        <ul className="desk-list">
          {drafts.map((d) => {
            const text = finalText(d);
            const open = d.notes.filter((n) => !n.done).length;
            return (
              <li key={d.id}>
                <button type="button" onClick={() => onOpen(d.id)}>
                  <strong>{titleOf(text)}</strong>
                  <span>
                    {wordCount(text)} words · {d.sessions.length} {d.sessions.length === 1 ? 'sitting' : 'sittings'} · last written {when(d.updated)}
                    {open ? ` · ${open} open ${open === 1 ? 'note' : 'notes'}` : ''}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

type Panel = null | { kind: 'watch'; startAt: number } | { kind: 'publish' } | { kind: 'preview'; rec: Recording } | { kind: 'delete' };

function Editor({ id, onBack }: { id: string; onBack: () => void }) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [version, setVersion] = useState(0); // bumps on each change, for the word count and notes
  const [saved, setSaved] = useState(true);
  const [panel, setPanel] = useState<Panel>(null);
  const [adding, setAdding] = useState<null | { from: number; to: number; quote: string }>(null);
  const [noteText, setNoteText] = useState('');
  const ta = useRef<HTMLTextAreaElement>(null);
  const d = useRef<Draft | null>(null);
  const doc = useRef<Doc | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Opening a draft starts a new sitting with the first change, however soon you came back.
  const reopened = useRef(true);

  useEffect(() => {
    getDraft(id).then((x) => {
      if (!x) return onBack();
      d.current = x;
      doc.current = replay(x.steps);
      setDraft(x);
    });
  }, [id, onBack]);

  const save = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (!d.current) return;
    putDraft(d.current).then(() => setSaved(true));
  }, []);
  const soon = useCallback(() => {
    setSaved(false);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(save, 700);
  }, [save]);
  useEffect(() => {
    const flush = () => document.visibilityState === 'hidden' && save();
    document.addEventListener('visibilitychange', flush);
    window.addEventListener('pagehide', save);
    return () => {
      document.removeEventListener('visibilitychange', flush);
      window.removeEventListener('pagehide', save);
      save();
    };
  }, [save]);

  // Grow the page with the text.
  const fit = () => {
    const el = ta.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 4}px`;
  };
  useEffect(fit, [draft]);

  const onInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const x = d.current;
    const dc = doc.current;
    if (!x || !dc) return;
    const ch = diff(dc.text, e.currentTarget.value);
    fit();
    if (!ch) return;
    const now = Date.now();
    const gap = x.lastWall === null ? 0 : now - x.lastWall;
    const fresh = reopened.current && x.steps.length > 0;
    reopened.current = false;
    if (x.lastWall === null || gap > BREAK_MS || fresh) x.sessions.push({ at: x.steps.length, wall: now });
    const type = (e.nativeEvent as InputEvent).inputType ?? '';
    const step: Step = [gap, ch.pos, ch.del, ch.ins];
    if (/^insertFrom(Paste|Drop)/.test(type) && ch.ins.length > 1) step.push('p');
    x.steps.push(step);
    // replay() and apply() agree; apply keeps the ids notes are pinned to.
    const before = dc.text;
    dc.text = before.slice(0, ch.pos) + ch.ins + before.slice(ch.pos + ch.del);
    const newIds = Array.from({ length: ch.ins.length }, (_, i) => dc.next + i);
    dc.next += ch.ins.length;
    dc.ids.splice(ch.pos, ch.del, ...newIds);
    x.lastWall = now;
    x.updated = now;
    setVersion((v) => v + 1);
    soon();
  };

  const startNote = () => {
    const el = ta.current;
    const dc = doc.current;
    if (!el || !dc) return;
    const a = el.selectionStart;
    const b = el.selectionEnd;
    if (b > a) setAdding({ from: dc.ids[a], to: dc.ids[b - 1], quote: dc.text.slice(a, b) });
    else setAdding({ from: -1, to: dc.ids[Math.max(0, a - 1)] ?? -1, quote: '' });
    setNoteText('');
  };
  const saveNote = () => {
    const x = d.current;
    if (!x || !adding || !noteText.trim()) return setAdding(null);
    const n: DeskNote = { id: Math.random().toString(36).slice(2, 10), text: noteText.trim(), from: adding.from, to: adding.to, at: x.steps.length, quote: adding.quote };
    x.notes.push(n);
    x.updated = Date.now();
    setAdding(null);
    setVersion((v) => v + 1);
    soon();
  };
  const editNote = (nid: string, change: Partial<DeskNote> | null) => {
    const x = d.current;
    if (!x) return;
    x.notes = change === null ? x.notes.filter((n) => n.id !== nid) : x.notes.map((n) => (n.id === nid ? { ...n, ...change } : n));
    setVersion((v) => v + 1);
    soon();
  };
  /** Where a note's words are now, or null if they've been deleted. */
  const where = (n: DeskNote): [number, number] | null => {
    const dc = doc.current;
    if (!dc) return null;
    if (n.from === -1) {
      const i = dc.ids.indexOf(n.to);
      return i === -1 ? null : [i + 1, i + 1];
    }
    const a = dc.ids.indexOf(n.from);
    const b = dc.ids.indexOf(n.to);
    if (a === -1 && b === -1) return null;
    const lo = a === -1 ? b : a;
    const hi = b === -1 ? a : b;
    return [Math.min(lo, hi), Math.max(lo, hi) + 1];
  };
  const find = (n: DeskNote) => {
    const w = where(n);
    const el = ta.current;
    if (!w || !el) return;
    el.focus();
    el.setSelectionRange(w[0], w[1]);
    const line = el.value.slice(0, w[0]).split('\n').length;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + line * 28 - window.innerHeight / 3, behavior: 'smooth' });
  };

  const backup = () => {
    const x = d.current;
    if (!x) return;
    save();
    x.backedUp = Date.now();
    putDraft(x);
    download(`${slugify(titleOf(doc.current?.text ?? ''))}-backup-${new Date().toISOString().slice(0, 10)}.json`, { kind: 'desk-draft', v: 1, draft: x } satisfies Backup);
    setVersion((v) => v + 1);
  };

  if (!draft || !d.current || !doc.current) return <main className="desk" />;
  const x = d.current;
  const text = doc.current.text;
  void version;
  const needsBackup = x.steps.length > 0 && x.updated > (x.backedUp ?? 0) && Date.now() - (x.backedUp ?? x.created) > DAY;
  const openNotes = x.notes.filter((n) => !n.done);
  const doneNotes = x.notes.filter((n) => n.done);

  return (
    <main className="desk desk-editing">
      <div className="desk-bar">
        <button type="button" onClick={() => (save(), onBack())}>
          ← Drafts
        </button>
        <span className="desk-count">
          {wordCount(text)} words · {saved ? 'Saved' : 'Saving…'}
        </span>
        <span className="desk-bar-gap" />
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={startNote}>
          Add note
        </button>
        <button type="button" onClick={() => setPanel({ kind: 'watch', startAt: 0 })} disabled={!x.steps.length}>
          Watch it
        </button>
        <button type="button" onClick={backup}>
          Save backup
        </button>
        <button type="button" className="desk-primary" onClick={() => setPanel({ kind: 'publish' })} disabled={!x.steps.length}>
          Publish
        </button>
      </div>
      {needsBackup && (
        <p className="desk-warn">
          This draft hasn&rsquo;t been backed up for over a day. If this browser&rsquo;s data is cleared, it&rsquo;s gone.{' '}
          <button type="button" className="desk-link" onClick={backup}>
            Save a backup
          </button>
        </p>
      )}

      <div className="desk-grid">
        <textarea
          ref={ta}
          className="desk-page"
          defaultValue={text}
          onInput={onInput}
          placeholder="Start writing. The first line becomes the title."
          spellCheck
          autoFocus
          aria-label="Your draft"
        />
        <aside className="desk-notes" aria-label="Notes to yourself">
          {adding && (
            <div className="desk-note is-new">
              {adding.quote && <q>{adding.quote.slice(0, 140)}</q>}
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="A note to yourself. Only you see it."
                autoFocus
                rows={3}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) saveNote();
                  if (e.key === 'Escape') setAdding(null);
                }}
              />
              <div className="desk-note-actions">
                <button type="button" className="desk-primary" onClick={saveNote}>
                  Save note
                </button>
                <button type="button" onClick={() => setAdding(null)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
          {!adding && !x.notes.length && <p className="desk-hint">Select some words and press Add note to leave yourself a note for next time. Notes are private.</p>}
          {openNotes.map((n) => (
            <NoteCard key={n.id} n={n} here={where(n)} text={text} onFind={() => find(n)} onEdit={(c) => editNote(n.id, c)} onWatch={() => setPanel({ kind: 'watch', startAt: n.at })} />
          ))}
          {doneNotes.length > 0 && (
            <details className="desk-done">
              <summary>{doneNotes.length} done</summary>
              {doneNotes.map((n) => (
                <NoteCard key={n.id} n={n} here={where(n)} text={text} onFind={() => find(n)} onEdit={(c) => editNote(n.id, c)} onWatch={() => setPanel({ kind: 'watch', startAt: n.at })} />
              ))}
            </details>
          )}
        </aside>
      </div>

      {panel && (
        <div className="desk-overlay" role="dialog" aria-modal="true" aria-label={panel.kind === 'publish' ? 'Publish' : 'Watch it'} onKeyDown={(e) => e.key === 'Escape' && setPanel(null)}>
          <div className="desk-sheet">
            {panel.kind === 'watch' && <Player rec={{ v: 1, steps: x.steps, sessions: x.sessions, notes: x.notes.map((n) => ({ at: n.at, text: n.text, from: n.from, to: n.to })) }} startAt={panel.startAt} onClose={() => setPanel(null)} />}
            {panel.kind === 'preview' && (
              <>
                <p className="desk-sheet-label">Preview: what readers will see</p>
                <Player rec={panel.rec} onClose={() => setPanel({ kind: 'publish' })} />
              </>
            )}
            {panel.kind === 'publish' && (
              <Publish
                draft={x}
                text={text}
                onChange={() => (setVersion((v) => v + 1), soon())}
                onPreview={(rec) => setPanel({ kind: 'preview', rec })}
                onClose={() => setPanel(null)}
                onDelete={() => setPanel({ kind: 'delete' })}
              />
            )}
            {panel.kind === 'delete' && (
              <div className="desk-publish">
                <h2>Delete this draft?</h2>
                <p>It&rsquo;s removed from this browser. A backup file you saved still works.</p>
                <div className="desk-actions">
                  <button type="button" className="desk-danger" onClick={() => deleteDraft(x.id).then(onBack)}>
                    Delete it
                  </button>
                  <button type="button" onClick={() => setPanel({ kind: 'publish' })}>
                    Keep it
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function NoteCard({
  n,
  here,
  text,
  onFind,
  onEdit,
  onWatch,
}: {
  n: DeskNote;
  here: [number, number] | null;
  text: string;
  onFind: () => void;
  onEdit: (c: Partial<DeskNote> | null) => void;
  onWatch: () => void;
}) {
  const words = here && here[1] > here[0] ? text.slice(here[0], here[1]) : '';
  return (
    <div className={`desk-note${n.done ? ' is-done' : ''}`}>
      {words ? <q>{words.slice(0, 140)}</q> : n.quote ? <q className="is-gone">{n.quote.slice(0, 140)} (since deleted)</q> : null}
      <p>{n.text}</p>
      <div className="desk-note-actions">
        {here && (
          <button type="button" onClick={onFind}>
            Find
          </button>
        )}
        <button type="button" onClick={onWatch} title="Replay from the moment you wrote this note">
          Back to then
        </button>
        <button type="button" onClick={() => onEdit({ done: !n.done })}>
          {n.done ? 'Reopen' : 'Done'}
        </button>
        <button type="button" onClick={() => onEdit(null)} aria-label="Delete note">
          Delete
        </button>
      </div>
    </div>
  );
}

function Publish({
  draft,
  text,
  onChange,
  onPreview,
  onClose,
  onDelete,
}: {
  draft: Draft;
  text: string;
  onChange: () => void;
  onPreview: (r: Recording) => void;
  onClose: () => void;
  onDelete: () => void;
}) {
  const spans = useMemo(() => deletedSpans(draft.steps), [draft.steps.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const hide = new Set(draft.hide ?? []);
  const show = new Set(draft.show ?? []);
  const slug = draft.slug ?? slugify(titleOf(text));
  const [, force] = useState(0);
  const set = (k: 'hide' | 'show', key: string, on: boolean) => {
    const s = new Set(draft[k] ?? []);
    if (on) s.add(key);
    else s.delete(key);
    draft[k] = [...s];
    force((v) => v + 1);
    onChange();
  };
  const build = (): Recording => {
    const ids = new Set<number>();
    for (const sp of spans) if (hide.has(sp.key)) sp.ids.forEach((i) => ids.add(i));
    return {
      v: 1,
      steps: maskSteps(draft.steps, ids),
      sessions: draft.sessions,
      notes: draft.notes.filter((n) => show.has(n.id)).map((n) => ({ at: n.at, text: n.text, from: n.from, to: n.to })),
      hidden: ids.size || undefined,
    };
  };
  const kb = Math.round(JSON.stringify(build()).length / 1024);

  return (
    <div className="desk-publish">
      <h2>Publish</h2>
      <p>
        You&rsquo;ll get one file. Send it to Claude with the title and the &ldquo;In short&rdquo; line, and it goes up as a note with the replay. Blanked-out text is
        swapped for gray bars in the file itself, so the real words never leave this browser.
      </p>

      <label className="desk-field">
        <span>Address</span>
        <span className="desk-slug">
          calebs.garden/notes/
          <input
            value={slug}
            onChange={(e) => {
              draft.slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') || undefined;
              force((v) => v + 1);
              onChange();
            }}
          />
        </span>
      </label>

      <h3>Deleted text ({spans.length})</h3>
      {spans.length === 0 ? (
        <p className="desk-hint">Nothing typed and then deleted yet, beyond a letter or two.</p>
      ) : (
        <>
          <p className="desk-hint">Tick anything readers shouldn&rsquo;t see, like a real name or a half-thought. It still plays at its real length, as a gray bar.</p>
          <ul className="desk-spans">
            {spans.map((sp) => (
              <li key={sp.key}>
                <label>
                  <input type="checkbox" checked={hide.has(sp.key)} onChange={(e) => set('hide', sp.key, e.target.checked)} />
                  <span>
                    <span className="desk-ctx">…{sp.before.slice(-30)}</span>
                    <del>{sp.text.length > 240 ? `${sp.text.slice(0, 240)}…` : sp.text}</del>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </>
      )}

      <h3>Your notes ({draft.notes.length})</h3>
      {draft.notes.length === 0 ? (
        <p className="desk-hint">No notes on this draft.</p>
      ) : (
        <>
          <p className="desk-hint">Notes stay private unless you tick them. A ticked note shows in the replay at the moment you wrote it, with its words lit up.</p>
          <ul className="desk-spans">
            {draft.notes.map((n) => (
              <li key={n.id}>
                <label>
                  <input type="checkbox" checked={show.has(n.id)} onChange={(e) => set('show', n.id, e.target.checked)} />
                  <span>{n.text}</span>
                </label>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="desk-actions">
        <button type="button" onClick={() => onPreview(build())}>
          Preview the replay
        </button>
        <button type="button" className="desk-primary" onClick={() => download(`${slug}.json`, build())}>
          Download recording ({kb} KB)
        </button>
        <button type="button" onClick={onClose}>
          Back to writing
        </button>
        <span className="desk-bar-gap" />
        <button type="button" className="desk-danger" onClick={onDelete}>
          Delete draft
        </button>
      </div>
    </div>
  );
}
