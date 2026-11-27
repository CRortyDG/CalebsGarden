'use client';

import type { DeskNote, Session, Step } from './format';

/** A draft at the desk. It never leaves this browser unless you save a backup or publish. */
export type Draft = {
  id: string;
  steps: Step[];
  sessions: Session[];
  notes: DeskNote[];
  created: number;
  updated: number;
  lastWall: number | null; // wall clock of the last change, to time the next one
  backedUp?: number;
  hide?: string[]; // keys of deleted spans to blank out when publishing
  show?: string[]; // ids of notes to show readers
  slug?: string;
};

export type Backup = { kind: 'desk-draft'; v: 1; draft: Draft };

const DB = 'calebs-garden-desk';
const STORE = 'drafts';

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => {
      db.close();
      resolve(req.result);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export const listDrafts = () => run<Draft[]>('readonly', (s) => s.getAll() as IDBRequest<Draft[]>);
export const getDraft = (id: string) => run<Draft | undefined>('readonly', (s) => s.get(id) as IDBRequest<Draft | undefined>);
export const putDraft = (d: Draft) => run('readwrite', (s) => s.put(d));
export const deleteDraft = (id: string) => run('readwrite', (s) => s.delete(id));

export const newDraft = (): Draft => ({
  id: Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
  steps: [],
  sessions: [],
  notes: [],
  created: Date.now(),
  updated: Date.now(),
  lastWall: null,
});

/** Ask the browser not to clear the desk's storage when space runs low. Best effort. */
export function askToKeep() {
  try {
    navigator.storage?.persist?.();
  } catch {}
}

export function download(name: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
