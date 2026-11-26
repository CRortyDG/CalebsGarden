'use client';

import './overgrowth.css';
import { useEffect, useRef } from 'react';
import { idleVines } from './idleVines';

/**
 * Vines that grow around the words when the page is left still (see idleVines.ts).
 * Put it inside the page's <main>; it winds around that element's text.
 */
export function IdleVines() {
  const stems = useRef<HTMLCanvasElement>(null);
  const leaves = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const s = stems.current;
    const l = leaves.current;
    const root = s?.parentElement;
    if (!s || !l || !root) return;
    return idleVines(root, s, l);
  }, []);
  return (
    <>
      <canvas className="cs-vines" ref={stems} aria-hidden="true" />
      <canvas className="cs-vines" ref={leaves} aria-hidden="true" />
    </>
  );
}
