import { permanentRedirect } from 'next/navigation';

// The Candlefair case study became part of the "Small software" series.
export default function Candlefair() {
  permanentRedirect('/case-studies/cheap-enough-to-give-away');
}
