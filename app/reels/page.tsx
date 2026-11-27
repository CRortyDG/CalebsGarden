import type { Metadata } from 'next';
import Link from 'next/link';
import '../case-studies/_shared/case-study.css';
import '@/reels/reels.css';
import ReelMaker from '@/reels/ReelMaker';
import { ogImage } from '@/og/image';

const description =
  'Drop in photos or clips, pick a song, and it cuts on the beat with a line of text over each clip, then makes a vertical video for Reels, TikTok or Shorts. It all runs in your browser: nothing is uploaded.';

export const metadata: Metadata = {
  title: 'Reel maker',
  description,
  alternates: { canonical: '/reels' },
  openGraph: { type: 'website', title: 'Reel maker · calebs.garden', description, url: '/reels', images: [ogImage('reels')] },
  twitter: { card: 'summary_large_image', images: [ogImage('reels')] },
};

export default function ReelsPage() {
  return (
    <main className="cs reel-page">
      <p className="back">
        <Link href="/">← calebs.garden</Link>
      </p>
      <header className="cs-head">
        <p className="cs-kicker">A small free tool</p>
        <h1>Reel maker</h1>
        <p className="cs-dek">
          Photos or clips in, a song, a line of text for each. It finds the beat, cuts on it, and hands you a vertical video. Nothing leaves your device: there is
          no server behind this page.
        </p>
      </header>

      <ReelMaker />

      <section className="reel-how">
        <h2>How it works</h2>
        <ol>
          <li>
            <strong>Finding the beat.</strong> Your browser decodes the song, and the page measures how suddenly the bass and the top end get louder, a hundred
            times a second. The tempo is the spacing that repeats most in that curve, and the beats are followed through the song so a live drummer who drifts
            still lands. A steady song is snapped to an exact grid, so every cut is even.
          </li>
          <li>
            <strong>Cutting.</strong> Each clip gets a number of beats (two by default). The first clip lands on the first beat after where you start the song,
            so every cut after it lands on a beat too. A small punch-in on each cut and a bump on the beats in between make it feel cut to the music.
          </li>
          <li>
            <strong>Making the video.</strong> The preview is drawn on a 1080×1920 canvas. Making the video plays it through once in real time while the browser
            records the canvas and the song: MP4 in Chrome, Edge and Safari (phones too), WebM in Firefox.
          </li>
        </ol>
        <h2>About the music</h2>
        <p>
          You bring the song. For your own music or a track you have the rights to, leave &ldquo;Put the song in the video&rdquo; on. For a popular song, cut to
          your own copy here, turn that off, post the silent video, and add the same song in Instagram or TikTok, which license it for you inside the app. Start
          the song there at the same moment as here (the page tells you the time) and the cuts still land.
        </p>
        <p>The example beat on this page was made for it and is free to use however you like.</p>
      </section>
    </main>
  );
}
