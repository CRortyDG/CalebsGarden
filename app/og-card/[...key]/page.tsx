import { notFound } from 'next/navigation';
import { ogCards } from '@/og/cards';
import { OgCard } from '@/og/OgCard';

export const metadata = { robots: { index: false } };

/** Development only: one link-preview card at 1200×630, for `npm run og` to photograph. */
export default async function OgCardPage({ params }: { params: Promise<{ key: string[] }> }) {
  if (process.env.NODE_ENV === 'production') notFound();
  const key = (await params).key.join('/');
  const card = ogCards().find((c) => c.key === key);
  if (!card) notFound();
  return <OgCard card={card} />;
}
