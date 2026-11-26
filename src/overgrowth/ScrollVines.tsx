'use client';

import './overgrowth.css';
import { useEffect, useRef } from 'react';
import { scrollVines } from './scrollVines';

/**
 * Vines down the page's margins that grow as you read (see scrollVines.ts).
 * Put it inside the page's <main>; it reads that element's blocks to keep clear of them.
 */
export function ScrollVines() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    const root = c?.parentElement;
    if (!c || !root) return;
    return scrollVines(root, c);
  }, []);
  return <canvas className="cs-vines" ref={ref} aria-hidden="true" />;
}
