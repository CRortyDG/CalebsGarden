import { permanentRedirect } from 'next/navigation';

// The Dungeon Garden case study became part of the "Small software" series.
export default function DungeonGarden() {
  permanentRedirect('/case-studies/cheap-enough-to-give-away');
}
