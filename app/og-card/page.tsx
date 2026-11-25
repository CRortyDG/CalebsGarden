import { notFound } from 'next/navigation';
import { ogCards } from '@/og/cards';

export const metadata = { robots: { index: false } };

/** Development only: the list of link-preview cards that `npm run og` photographs. */
export default function OgCards() {
  if (process.env.NODE_ENV === 'production') notFound();
  return (
    <ul>
      {ogCards().map((c) => (
        <li key={c.key}>
          <a href={`/og-card/${c.key}`} data-key={c.key}>
            {c.title}
          </a>
        </li>
      ))}
    </ul>
  );
}
