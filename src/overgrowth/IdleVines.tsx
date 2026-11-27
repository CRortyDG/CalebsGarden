'use client';

import './overgrowth.css';
import { useEffect, useRef } from 'react';
import { idleVines } from './idleVines';

/**
 * Vines that overgrow the words when the page is left still (see idleVines.ts).
 * Put it inside the page's <main>; it winds over and under that element's text.
 */
export function IdleVines() {
  const under = useRef<HTMLCanvasElement>(null);
  const stems = useRef<HTMLCanvasElement>(null);
  const leaves = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const u = under.current;
    const s = stems.current;
    const l = leaves.current;
    const root = s?.parentElement;
    if (!u || !s || !l || !root) return;
    return idleVines(root, u, s, l);
  }, []);
  return (
    <>
      <canvas className="cs-vines" ref={under} aria-hidden="true" />
      <canvas className="cs-vines is-over" ref={stems} aria-hidden="true" />
      <canvas className="cs-vines is-over" ref={leaves} aria-hidden="true" />
    </>
  );
}
