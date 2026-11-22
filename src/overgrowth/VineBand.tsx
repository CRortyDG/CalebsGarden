'use client';

import './overgrowth.css';
import { useEffect, useRef } from 'react';
import { growVines } from './vines';

/**
 * The home page's vines as a calling card across the top of an inner page: a
 * full-width band behind the back link and the header that grows on each
 * visit. The children are ordinary page text; the vines are decoration.
 */
export function VineBand({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const vines = growVines(ref.current, 'band');
    return vines.stop;
  }, []);
  return (
    <div className="og-band" ref={ref}>
      <canvas aria-hidden="true" />
      {children}
    </div>
  );
}
