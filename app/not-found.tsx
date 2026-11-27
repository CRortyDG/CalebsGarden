import type { Metadata } from 'next';
import { NotFound } from '@/site/NotFound';

// Any address the site doesn't have lands here (and a note that isn't out yet).
export const metadata: Metadata = {
  title: 'Nothing growing here',
  description: 'An empty pot: there is no page at this address.',
};

export default function NotFoundPage() {
  return (
    <main>
      <NotFound />
    </main>
  );
}
