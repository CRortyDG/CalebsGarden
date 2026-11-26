import type { Metadata } from 'next';
import { Desk } from '@/typing/Desk';

// The private writing desk. Drafts stay in the browser that wrote them; the
// page itself holds nothing, so it's fine that anyone can open it.
export const metadata: Metadata = {
  title: 'The desk',
  description: 'A private writing desk that records a draft so readers can watch it being written.',
  robots: { index: false, follow: false },
};

export default function DeskPage() {
  return <Desk />;
}
