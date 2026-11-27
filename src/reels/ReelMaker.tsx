'use client';

// The reel maker: drop in photos or clips, pick a song, and it cuts on the beat with a line of
// text over each clip, then records a vertical 1080×1920 video. It all runs in this tab; the
// song and the pictures never leave the device. Engine: ./engine.ts, scripts: ./scripts.ts.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  analyze,
  buildTimeline,
  drawFrame,
  FPS,
  gridAnalysis,
  H,
  pickRecorderType,
  RECAP_MAX,
  segmentAt,
  syncVideos,
  W,
  type Analysis,
  type Card,
  type EndCard,
  type Look,
  type Media,
  type Timeline,
} from './engine';
import { EDITS, planEdit, shotOfPhoto, syncEditVideos, type EditId, type Shot } from './edits';
import type { JumpStyle } from './jumps';
import { SCRIPTS } from './scripts';

type Clip = Card & { id: number; hint: string; beats: number | null; name: string; url: string | null };
type Song = { name: string; buffer: AudioBuffer; an: Analysis };
type Mode = 'story' | 'recap' | JumpStyle | EditId;
const isEditId = (m: Mode): m is EditId => EDITS.some((e) => e.id === m);
/** The styles, in the order they're offered: every one but Story needs only photos. */
const STYLES: { id: Mode; label: string; about: string }[] = [
  ...EDITS,
  { id: 'recap', label: 'Simple recap', about: 'A photo dump for your friends: photos pop in around a black screen on the beat, then build into a collage.' },
  { id: 'zoom', label: 'Zoom jump', about: 'Each photo rushes in toward the camera and punches through into the next one on the beat.' },
  { id: 'whip', label: 'Whip pan', about: 'The photos fly sideways past each other on every cut, like a fast camera swing.' },
  { id: 'polaroid', label: 'Polaroid stack', about: 'Prints drop onto a table one per beat and pile up into a messy stack.' },
  { id: 'strips', label: 'Strips', about: 'Three tall panels slide in from the top and bottom, one per beat, then the next three.' },
  { id: 'glitch', label: 'Glitch', about: 'Hard cuts with a shake, a colour split and torn lines on every beat. Best with fast songs.' },
  { id: 'story', label: 'Story with text', about: 'One clip at a time with a line of text on each, ending on a card. Good for telling a story or showing something off.' },
];

type Exported = { url: string; file: File; type: string };

const EXAMPLE = {
  song: '/reels/example/song.mp3',
  script: 'numbers',
  pictures: ['01-friends.jpg', '02-cities.jpg', '03-chat.jpg', null, '05-calendar.jpg', null, '07-days.png', '08-everyone.png', '09-trip.jpg'],
  fits: ['fill', 'fill', 'fill', 'fill', 'fill', 'fill', 'whole', 'whole', 'fill'] as const,
  end: '10-board.png',
};

let nextId = 1;
const fmt = (secs: number) => {
  const d = Math.round(Math.max(0, secs) * 10);
  return `${Math.floor(d / 600)}:${String(Math.floor(d / 10) % 60).padStart(2, '0')}.${d % 10}`;
};

async function loadMedia(file: Blob, name: string): Promise<{ media: Media; url: string }> {
  const url = URL.createObjectURL(file);
  if (file.type.startsWith('video/') || /\.(mp4|mov|m4v|webm)$/i.test(name)) {
    const el = document.createElement('video');
    el.muted = true;
    el.playsInline = true;
    el.preload = 'auto';
    el.src = url;
    await new Promise<void>((ok, fail) => {
      el.onloadeddata = () => ok();
      el.onerror = () => fail(new Error(`Couldn't open ${name}`));
    });
    return { media: { kind: 'video', el, w: el.videoWidth, h: el.videoHeight }, url };
  }
  const el = new Image();
  el.src = url;
  await el.decode().catch(() => {
    throw new Error(`Couldn't open ${name} (this browser may not read that picture type; try a JPG or PNG)`);
  });
  // Phone photos are 12+ megapixels; a reel never needs more than the screen's height, and
  // 35 full-size photos would use gigabytes of memory. Keep a 1920 px copy instead.
  const big = Math.max(el.naturalWidth, el.naturalHeight);
  if (big > 1920) {
    const k = 1920 / big;
    const c = document.createElement('canvas');
    c.width = Math.round(el.naturalWidth * k);
    c.height = Math.round(el.naturalHeight * k);
    c.getContext('2d')?.drawImage(el, 0, 0, c.width, c.height);
    return { media: { kind: 'image', el: c, w: c.width, h: c.height }, url };
  }
  return { media: { kind: 'image', el, w: el.naturalWidth, h: el.naturalHeight }, url };
}

export default function ReelMaker() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const waveRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const playRef = useRef<{ stop: () => void } | null>(null);

  const [song, setSong] = useState<Song | null>(null);
  const [bpm, setBpm] = useState(120);
  const [startAt, setStartAt] = useState(0);
  const [cutEvery, setCutEvery] = useState(2);
  const [mode, setMode] = useState<Mode>('pages');
  const [alone, setAlone] = useState(3);
  const [clips, setClips] = useState<Clip[]>([]);
  const [end, setEnd] = useState<EndCard & { url: string | null; beats: number }>({ media: null, url: null, tagline: '', small: '', beats: 8 });
  const [look, setLook] = useState<Omit<Look, 'font'>>({ text: 'quiet', motion: 'punch' });
  const [font, setFont] = useState('system-ui, sans-serif');
  const [scriptId, setScriptId] = useState(SCRIPTS[0].id);
  const [withAudio, setWithAudio] = useState(true);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<number | null>(null);
  const [exported, setExported] = useState<Exported | null>(null);
  const [dragging, setDragging] = useState(false);

  const an = useMemo(() => song?.an ?? gridAnalysis(bpm), [song, bpm]);
  // A recap edit plans its own shots from the photos; Cut every becomes its pace.
  const shots: Shot[] | undefined = useMemo(() => (isEditId(mode) ? planEdit(mode, clips.length, cutEvery / 2) : undefined), [mode, clips.length, cutEvery]);
  const tl: Timeline = useMemo(
    // In a recap, the photos that build the collage come in twice as fast as the ones that pop in alone.
    () =>
      shots
        ? buildTimeline(an, song ? startAt : 0, shots.map((x) => x.beats), 0)
        : buildTimeline(an, song ? startAt : 0, clips.map((c, i) => c.beats ?? (mode === 'recap' && i >= alone ? Math.max(1, cutEvery / 2) : cutEvery)), end.beats),
    [an, song, startAt, clips, cutEvery, end.beats, mode, alone, shots],
  );
  const fullLook: Look = useMemo(() => ({ ...look, font, mode, alone, shots }), [look, font, mode, alone, shots]);

  // Everything the animation loop reads, kept current without restarting it.
  const live = useRef({ tl, clips, end: end as EndCard, look: fullLook });
  live.current = { tl, clips, end, look: fullLook };

  const draw = useCallback((at: number, isPlaying = false) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { tl, clips, end, look } = live.current;
    const shots = look.shots;
    if (shots) syncEditVideos(at, tl, clips, shots, isPlaying);
    else syncVideos(at, tl, clips, end, isPlaying);
    drawFrame(ctx, at, tl, clips, end, look);
  }, []);

  // The caption font is the site's display font, once it has loaded.
  useEffect(() => {
    const family = getComputedStyle(document.documentElement).getPropertyValue('--font-display').trim();
    const f = `${family ? `${family}, ` : ''}'Avenir Next', system-ui, sans-serif`;
    document.fonts
      .load(`800 100px ${f}`)
      .catch(() => {})
      .finally(() => setFont(f));
  }, []);

  // Paused, show each clip settled: a still taken right on a cut would catch the text before it pops in.
  useEffect(() => {
    if (playing) return;
    const at = Math.min(t, Math.max(0, tl.duration - 0.001));
    const s = segmentAt(tl, at);
    draw(s && at - s.start < 0.25 ? Math.min(s.start + 0.25, s.end - 0.001) : at);
  }, [draw, t, tl, clips, end, fullLook, playing]);

  // The song's waveform, its beats, and the part the reel uses.
  useEffect(() => {
    const c = waveRef.current;
    const ctx = c?.getContext('2d');
    if (!c || !ctx || !song) return;
    const css = getComputedStyle(c);
    const w = (c.width = c.clientWidth * devicePixelRatio);
    const h = (c.height = c.clientHeight * devicePixelRatio);
    const dur = song.an.duration;
    const x = (s: number) => (s / dur) * w;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = css.getPropertyValue('--line');
    ctx.fillRect(x(tl.songStart), 0, x(tl.duration), h);
    const ov = song.an.overview;
    ctx.fillStyle = css.getPropertyValue('--muted');
    for (let i = 0; i < ov.length; i++) {
      const bh = Math.max(1, ov[i] * h * 0.8);
      ctx.fillRect((i / ov.length) * w, (h - bh) / 2, Math.max(1, w / ov.length - 0.5), bh);
    }
    ctx.fillStyle = css.getPropertyValue('--lamp');
    for (const s of tl.segments) ctx.fillRect(x(tl.songStart + s.start), 0, Math.max(1, devicePixelRatio), h);
    ctx.fillRect(x(tl.songStart + t), 0, 2 * devicePixelRatio, h);
  }, [song, tl, t]);

  // Tap the beat: the tempo from the taps' typical spacing (the median, so one late tap doesn't skew it).
  const taps = useRef<number[]>([]);
  const [, setTapCount] = useState(0);
  const tapBeat = () => {
    const now = performance.now();
    const last = taps.current.at(-1);
    if (last !== undefined && now - last > 2000) taps.current = [];
    taps.current = [...taps.current, now].slice(-12);
    setTapCount(taps.current.length);
    if (taps.current.length < 4) return;
    const gaps = taps.current.slice(1).map((x, i) => x - taps.current[i]).sort((a, b) => a - b);
    const mid = gaps[Math.floor(gaps.length / 2)];
    setBpm(Math.max(60, Math.min(200, Math.round((60000 / mid) * 10) / 10)));
  };

  const ctxAudio = () => (audioRef.current ??= new AudioContext());

  const stop = useCallback(() => {
    playRef.current?.stop();
    playRef.current = null;
    setPlaying(false);
  }, []);

  /** Plays from `from` seconds. With `record`, the audio also goes to `record` (the recorder's input). */
  const play = useCallback(
    (from: number, opts: { record?: MediaStreamAudioDestinationNode; onDone?: () => void; onTick?: (t: number) => void } = {}) => {
      playRef.current?.stop();
      const { tl } = live.current;
      let src: AudioBufferSourceNode | null = null;
      let clock: () => number;
      if (song) {
        const ac = ctxAudio();
        void ac.resume();
        const gain = ac.createGain();
        const at = ac.currentTime + 0.08;
        // Fade the song out with the picture.
        gain.gain.setValueAtTime(1, at + Math.max(0, tl.duration - from - 0.6));
        gain.gain.linearRampToValueAtTime(0, at + Math.max(0, tl.duration - from));
        src = ac.createBufferSource();
        src.buffer = song.buffer;
        src.connect(gain);
        gain.connect(ac.destination);
        if (opts.record) gain.connect(opts.record);
        src.start(at, tl.songStart + from);
        clock = () => from + (ac.currentTime - at);
      } else {
        const t0 = performance.now() + 80;
        clock = () => from + (performance.now() - t0) / 1000;
      }
      let raf = 0;
      let done = false;
      const tick = () => {
        if (done) return;
        const now = Math.max(from, clock());
        const dur = live.current.tl.duration;
        if (now >= dur) {
          draw(dur - 0.001);
          finish();
          opts.onDone?.();
          return;
        }
        draw(now, true);
        opts.onTick?.(now);
        if ((now * FPS) % 3 < 1) setT(now);
        raf = requestAnimationFrame(tick);
      };
      const finish = () => {
        done = true;
        cancelAnimationFrame(raf);
        try {
          src?.stop();
        } catch {}
        const { tl, clips, end } = live.current;
        syncVideos(0, tl, clips, end, false);
        setPlaying(false);
      };
      playRef.current = { stop: finish };
      setPlaying(true);
      raf = requestAnimationFrame(tick);
    },
    [song, draw],
  );

  async function onSong(file: File) {
    stop();
    setError(null);
    setBusy('Listening for the beat…');
    try {
      const buffer = await ctxAudio().decodeAudioData(await file.arrayBuffer());
      // Give the page a frame to paint "Listening…" before the (short) analysis blocks it.
      await new Promise((r) => setTimeout(r, 30));
      const a = analyze(buffer);
      setSong({ name: file.name, buffer, an: a });
      setBpm(Math.round(a.bpm));
      setStartAt(a.beats[0] ?? 0);
      setT(0);
      setExported(null);
    } catch {
      setError(`Couldn't read ${file.name} as audio. MP3, M4A, WAV and AAC all work.`);
    } finally {
      setBusy(null);
    }
  }

  async function addFiles(files: FileList | File[]) {
    setError(null);
    const list = [...files].filter((f) => /^(image|video)\//.test(f.type) || /\.(heic|mov|mp4|m4v|webm)$/i.test(f.name));
    if (!list.length) return;
    setBusy(`Opening ${list.length} file${list.length > 1 ? 's' : ''}…`);
    const loaded: { media: Media; url: string; name: string }[] = [];
    for (const f of list) {
      try {
        loaded.push({ ...(await loadMedia(f, f.name)), name: f.name });
      } catch (e) {
        setError((e as Error).message);
      }
    }
    setClips((cs) => {
      const out = [...cs];
      // Fill script slots that are still waiting for a picture first, in order.
      for (const l of loaded) {
        const slot = out.findIndex((c) => !c.media);
        // Screenshots (PNGs) usually want to be seen whole; photos and clips fill the screen.
        const fit: Clip['fit'] = /\.png$/i.test(l.name) ? 'whole' : 'fill';
        if (slot >= 0) out[slot] = { ...out[slot], media: l.media, url: l.url, name: l.name, fit };
        else out.push({ id: nextId++, media: l.media, url: l.url, name: l.name, text: '', hint: '', fit, beats: null });
      }
      return out;
    });
    setBusy(null);
    setExported(null);
  }

  function applyScript(id: string) {
    const s = SCRIPTS.find((x) => x.id === id);
    if (!s) return;
    setClips((cs) => {
      const out = s.lines.map((line, i) => (cs[i] ? { ...cs[i], text: line.text, hint: line.shot } : { id: nextId++, media: null, url: null, name: '', text: line.text, hint: line.shot, fit: 'fill' as const, beats: null }));
      // Keep any extra pictures past the script's length, without text.
      return [...out, ...cs.slice(s.lines.length)];
    });
    setEnd((e) => ({ ...e, tagline: s.tagline }));
    setExported(null);
  }

  const update = (id: number, patch: Partial<Clip>) => {
    setClips((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    setExported(null);
  };
  const move = (i: number, by: number) =>
    setClips((cs) => {
      const j = i + by;
      if (j < 0 || j >= cs.length) return cs;
      const out = [...cs];
      [out[i], out[j]] = [out[j], out[i]];
      return out;
    });

  async function loadExample(as: Mode = mode) {
    stop();
    setError(null);
    setBusy('Loading the example…');
    try {
      const s = SCRIPTS.find((x) => x.id === EXAMPLE.script)!;
      const fetchBlob = async (p: string) => {
        const r = await fetch(`/reels/example/${p}`);
        if (!r.ok) throw new Error(p);
        return r.blob();
      };
      const pics = await Promise.all(EXAMPLE.pictures.map((p) => (p ? fetchBlob(p).then((b) => loadMedia(b, p)) : null)));
      const endPic = await fetchBlob(EXAMPLE.end).then((b) => loadMedia(b, EXAMPLE.end));
      const songBlob = await fetch(EXAMPLE.song).then((r) => r.arrayBuffer());
      const buffer = await ctxAudio().decodeAudioData(songBlob);
      const a = analyze(buffer);
      setSong({ name: 'Example beat (made for this page, free to use)', buffer, an: a });
      setBpm(Math.round(a.bpm));
      // The example's drums come in on the second bar: start there.
      setStartAt(a.beats.find((b) => b > 3.2) ?? a.beats[0] ?? 0);
      setCutEvery(2);
      setScriptId(s.id);
      if (as !== 'story') {
        // A photo dump: every picture, no lines of text, and a title on the last beat.
        const all = [...pics.filter((p): p is NonNullable<typeof p> => !!p), endPic];
        setClips(all.map((p, i) => ({ id: nextId++, media: p.media, url: p.url, name: `photo ${i + 1}`, text: '', hint: '', fit: 'fill' as const, beats: null })));
        setEnd({ media: null, url: null, tagline: 'Yellowstone, summer ’27', small: '', beats: 8 });
        setT(0);
        setExported(null);
        return;
      }
      setClips(
        s.lines.map((line, i) => ({
          id: nextId++,
          media: pics[i]?.media ?? null,
          url: pics[i]?.url ?? null,
          name: EXAMPLE.pictures[i] ?? '',
          text: line.text,
          hint: line.shot,
          fit: EXAMPLE.fits[i],
          beats: null,
        })),
      );
      setEnd({ media: endPic.media, url: endPic.url, tagline: s.tagline, small: 'travel.calebs.garden', beats: 8 });
      setT(0);
      setExported(null);
    } catch {
      setError("Couldn't load the example. Check the connection and try again.");
    } finally {
      setBusy(null);
    }
  }

  // A hook for drawing any frame from a script (how the example reel on this page was rendered).
  useEffect(() => {
    (window as unknown as { __reel: unknown }).__reel = {
      loadExample,
      setMode,
      info: () => ({ duration: live.current.tl.duration, songStart: live.current.tl.songStart, bpm: an.bpm, steady: an.steady, cuts: live.current.tl.segments.map((s) => s.start) }),
      drawAt: (at: number) => {
        draw(at);
        return canvasRef.current!.toDataURL('image/jpeg', 0.92);
      },
    };
  });

  async function exportReel() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    stop();
    setError(null);
    const audio = withAudio && !!song;
    const type = pickRecorderType(audio);
    if (!type || !('captureStream' in canvas)) {
      setError("This browser can't record video. Try Chrome, Edge or Safari on a computer or phone.");
      return;
    }
    if (exported) URL.revokeObjectURL(exported.url);
    setExported(null);
    draw(0);
    const stream = canvas.captureStream(FPS);
    let dest: MediaStreamAudioDestinationNode | undefined;
    if (audio) {
      dest = ctxAudio().createMediaStreamDestination();
      stream.addTrack(dest.stream.getAudioTracks()[0]);
    }
    const rec = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 12_000_000, audioBitsPerSecond: 192_000 });
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      stream.getTracks().forEach((tr) => tr.stop());
      const isMp4 = type.startsWith('video/mp4');
      const blob = new Blob(chunks, { type: isMp4 ? 'video/mp4' : 'video/webm' });
      const file = new File([blob], `trip-reel.${isMp4 ? 'mp4' : 'webm'}`, { type: blob.type });
      setExported({ url: URL.createObjectURL(blob), file, type: blob.type });
      setExporting(null);
      setT(0);
    };
    rec.start(500);
    setExporting(0);
    play(0, {
      record: dest,
      onTick: (now) => setExporting(now / live.current.tl.duration),
      onDone: () => setTimeout(() => rec.state !== 'inactive' && rec.stop(), 250),
    });
  }

  async function share() {
    if (!exported) return;
    try {
      await navigator.share({ files: [exported.file] });
    } catch {}
  }

  const script = SCRIPTS.find((s) => s.id === scriptId);
  const canShare = typeof navigator !== 'undefined' && !!exported && !!navigator.canShare?.({ files: [exported.file] });
  const seg = segmentAt(tl, t);

  return (
    <div className="reel">
      <div className="reel-stage">
        <div className="reel-frame">
          <canvas ref={canvasRef} width={W} height={H} aria-label="Reel preview" />
          {exporting !== null && (
            <div className="reel-recording">
              Recording {Math.round(exporting * 100)}%<small>It plays through once in real time. Keep this tab open.</small>
            </div>
          )}
        </div>
        <div className="reel-transport">
          <button type="button" className="reel-btn reel-primary" onClick={() => (playing ? stop() : play(t >= tl.duration - 0.05 ? 0 : t))} disabled={exporting !== null || !tl.segments.length}>
            {playing ? 'Pause' : 'Play'}
          </button>
          <input
            type="range"
            min={0}
            max={Math.max(0.1, tl.duration)}
            step={0.01}
            value={Math.min(t, tl.duration)}
            onChange={(e) => {
              stop();
              setT(Number(e.target.value));
            }}
            aria-label="Scrub"
            disabled={exporting !== null}
          />
          <span className="reel-time">
            {fmt(t)} / {fmt(tl.duration)}
          </span>
        </div>
        <p className="reel-note">
          {seg ? (seg.kind === 'end' ? 'End card' : `Clip ${seg.index + 1} of ${clips.length}`) : ''} · {tl.segments.length ? `${tl.segments.length - 1} cuts on the beat` : 'Add a clip to start'}
        </p>
      </div>

      <div className="reel-panel">
        {busy && <p className="reel-busy">{busy}</p>}
        {error && (
          <p className="reel-error" role="alert">
            {error}
          </p>
        )}

        <section className="reel-step">
          <h2>Style</h2>
          <div className="reel-row">
            {STYLES.map(({ id: v, label }) => (
              <button key={v} type="button" className={`reel-chip${mode === v ? ' on' : ''}`} onClick={() => {
                  setMode(v);
                  // A recap is a post for friends, not an ad: drop the board's tagline and address.
                  if (v !== 'story')
                    setEnd((x) => ({ ...x, tagline: SCRIPTS.some((sc) => sc.tagline === x.tagline) ? '' : x.tagline, small: x.small === 'travel.calebs.garden' ? '' : x.small }));
                }} aria-pressed={mode === v}>
                {label}
              </button>
            ))}
          </div>
          <p className="reel-hint">
            {STYLES.find((x) => x.id === mode)?.about}
          </p>
          {mode === 'recap' && (
            <div className="reel-row">
              <span className="reel-label">Pop in alone first</span>
              {[0, 2, 3, 4, 6].map((n) => (
                <button key={n} type="button" className={`reel-chip${alone === n ? ' on' : ''}`} onClick={() => setAlone(n)} aria-pressed={alone === n}>
                  {n}
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="reel-step">
          <h2>
            <span>1</span> Song
          </h2>
          <div className="reel-row">
            <label className="reel-btn reel-primary">
              Choose a song
              <input type="file" accept="audio/*,.mp3,.m4a,.wav,.aac" hidden onChange={(e) => e.target.files?.[0] && onSong(e.target.files[0])} />
            </label>
            <button type="button" className="reel-btn" onClick={() => loadExample()}>
              Load the example
            </button>
          </div>
          {song ? (
            <>
              <p className="reel-meta">
                <strong>{song.name}</strong> · {song.an.bpm} BPM{song.an.steady ? ', steady' : ', follows the drummer'} · {song.an.beats.length} beats
              </p>
              <canvas
                ref={waveRef}
                className="reel-wave"
                onClick={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  stop();
                  setStartAt(((e.clientX - r.left) / r.width) * song.an.duration);
                  setT(0);
                }}
                aria-label="Song waveform. Click where the reel should start."
              />
              <div className="reel-row">
                <span className="reel-label">Reel starts at {fmt(tl.songStart)}</span>
                <button type="button" className="reel-btn reel-small" onClick={() => setStartAt(Math.max(0, tl.songStart - an.period * 1.02))}>
                  ◀ 1 beat
                </button>
                <button type="button" className="reel-btn reel-small" onClick={() => setStartAt(tl.songStart + an.period * 0.98)}>
                  1 beat ▶
                </button>
                <button type="button" className="reel-btn reel-small" onClick={() => setStartAt(tl.songStart + an.period * 3.98)}>
                  1 bar ▶
                </button>
              </div>
              <p className="reel-hint">Click the waveform to start on the part you want (the drop, the chorus). The gold lines are the cuts.</p>
            </>
          ) : (
            <>
            <div className="reel-row">
              <label className="reel-label">
                No song file? Cut to{' '}
                <input type="number" min={60} max={200} step={0.1} value={bpm} onChange={(e) => setBpm(Math.max(60, Math.min(200, Number(e.target.value) || 120)))} className="reel-num" /> BPM
              </label>
              <button type="button" className="reel-btn reel-small" onClick={tapBeat}>
                Tap the beat{taps.current.length >= 2 ? ` (${taps.current.length})` : ''}
              </button>
            </div>
            <p className="reel-hint">
              Using a song from Instagram or TikTok? Play it on another phone and tap along about 8 times. Then make the video, post it, and add the song in the app.
            </p>
            </>
          )}
          <div className="reel-row">
            <span className="reel-label">{shots ? 'Pace' : 'Cut every'}</span>
            {[1, 2, 4].map((n) => (
              <button key={n} type="button" className={`reel-chip${cutEvery === n ? ' on' : ''}`} onClick={() => setCutEvery(n)} aria-pressed={cutEvery === n}>
                {shots ? (n === 1 ? 'Fast' : n === 2 ? 'Normal' : 'Slow') : `${n} beat${n > 1 ? 's' : ''}`}
              </button>
            ))}
          </div>
        </section>

        {mode === 'story' && <section className="reel-step">
          <h2>
            <span>2</span> Script
          </h2>
          <div className="reel-row">
            <select value={scriptId} onChange={(e) => setScriptId(e.target.value)} className="reel-select" aria-label="Script">
              {SCRIPTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <button type="button" className="reel-btn" onClick={() => applyScript(scriptId)}>
              Use these lines
            </button>
          </div>
          {script && (
            <div className="reel-script">
              <p>{script.idea}</p>
              {script.needs && <p className="reel-needs">Needs: {script.needs}</p>}
              <ol>
                {script.lines.map((l, i) => (
                  <li key={i}>
                    <strong>{l.text}</strong> <span>{l.shot}</span>
                  </li>
                ))}
                <li>
                  <strong>{script.tagline}</strong> <span>End card: the board</span>
                </li>
              </ol>
            </div>
          )}
        </section>}

        <section className="reel-step">
          <h2>
            <span>{mode === 'story' ? 3 : 2}</span> {mode === 'story' ? 'Clips' : 'Photos'}
          </h2>
          <label
            className={`reel-drop${dragging ? ' over' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              void addFiles(e.dataTransfer.files);
            }}
          >
            <strong>Drop photos or video clips here</strong>
            <span>{mode === 'story' ? 'or tap to choose. They fill the script\'s empty slots in order.' : mode === 'recap' ? `or tap to choose. Up to ${RECAP_MAX}; past nine, each one cuts into the collage.` : shots ? 'or tap to choose. As many as you like, in the order they should appear.' : 'or tap to choose. One photo per cut, in this order.'}</span>
            <input type="file" accept="image/*,video/*" multiple hidden onChange={(e) => e.target.files && addFiles(e.target.files)} />
          </label>
          <ol className="reel-clips">
            {clips.map((c, i) => (
              <li key={c.id} className="reel-clip">
                <button type="button" className="reel-thumb" onClick={() => { stop(); setT(tl.segments[shots ? shotOfPhoto(shots, i) : i]?.start ?? 0); }} aria-label={`Show clip ${i + 1}`}>
                  {c.url && c.media?.kind === 'image' && <img src={c.url} alt="" />}
                  {c.url && c.media?.kind === 'video' && <video src={c.url} muted playsInline />}
                  {!c.media && <span>Text only</span>}
                </button>
                <div className="reel-clip-body">
                  {(mode === 'story' || shots) && (
                    <>
                      <input value={c.text} onChange={(e) => update(c.id, { text: e.target.value })} placeholder={shots ? 'Text over this photo (optional)' : 'Text on this clip'} aria-label={`Text on clip ${i + 1}`} />
                      {c.hint && <small>Shot: {c.hint}</small>}
                    </>
                  )}
                  {mode === 'recap' && <small>{i < alone ? 'Pops in alone' : i < 9 ? 'Builds the collage' : i < RECAP_MAX ? 'Cuts into the collage' : 'Over the limit: left out'}</small>}
                  <div className="reel-row">
                    {!shots && <select value={c.beats ?? ''} onChange={(e) => update(c.id, { beats: e.target.value ? Number(e.target.value) : null })} className="reel-select reel-small" aria-label="Beats">
                      <option value="">{cutEvery} beats</option>
                      {[1, 2, 3, 4, 6, 8].filter((n) => n !== cutEvery).map((n) => (
                        <option key={n} value={n}>
                          {n} beat{n > 1 ? 's' : ''}
                        </option>
                      ))}
                    </select>}
                    {c.media && mode === 'story' && (
                      <button type="button" className="reel-chip" onClick={() => update(c.id, { fit: c.fit === 'fill' ? 'whole' : 'fill' })} title="Fill crops to the screen; Whole shows all of it (good for screenshots)">
                        {c.fit === 'fill' ? 'Fill' : 'Whole'}
                      </button>
                    )}
                    <button type="button" className="reel-icon" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">
                      ↑
                    </button>
                    <button type="button" className="reel-icon" onClick={() => move(i, 1)} disabled={i === clips.length - 1} aria-label="Move down">
                      ↓
                    </button>
                    <button type="button" className="reel-icon" onClick={() => setClips((cs) => cs.filter((x) => x.id !== c.id))} aria-label="Remove">
                      ✕
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          {mode === 'story' && (
            <button type="button" className="reel-btn reel-small" onClick={() => setClips((cs) => [...cs, { id: nextId++, media: null, url: null, name: '', text: '', hint: '', fit: 'fill', beats: null }])}>
              + Text-only card
            </button>
          )}
        </section>

        <section className="reel-step">
          <h2>
            <span>{mode === 'story' ? 4 : 3}</span> {mode === 'story' ? 'End card' : 'Last beat'}
          </h2>
          {mode !== 'story' && <p className="reel-hint">{shots ? 'Ends on a grid of your last nine photos.' : mode === 'recap' ? 'Every photo lands in the collage.' : 'The last photo holds.'} A title is optional: leave it empty for photos only.</p>}
          {mode === 'story' && <div className="reel-row">
            <label className="reel-btn">
              {end.media ? 'Change picture' : 'Add a picture of the board'}
              <input
                type="file"
                accept="image/*,video/*"
                hidden
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  try {
                    const { media, url } = await loadMedia(f, f.name);
                    setEnd((x) => ({ ...x, media, url }));
                  } catch (err) {
                    setError((err as Error).message);
                  }
                }}
              />
            </label>
            {end.url && <img src={end.url} alt="" className="reel-endthumb" />}
          </div>}
          <label className="reel-field">
            {mode === 'story' ? 'Tagline' : 'Title'}
            <input value={end.tagline} onChange={(e) => setEnd((x) => ({ ...x, tagline: e.target.value }))} />
          </label>
          <label className="reel-field">
            Small line
            <input value={end.small} onChange={(e) => setEnd((x) => ({ ...x, small: e.target.value }))} />
          </label>
          <div className="reel-row">
            <span className="reel-label">Hold for</span>
            {[4, 8].map((n) => (
              <button key={n} type="button" className={`reel-chip${end.beats === n ? ' on' : ''}`} onClick={() => setEnd((x) => ({ ...x, beats: n }))} aria-pressed={end.beats === n}>
                {n} beats
              </button>
            ))}
          </div>
        </section>

        <section className="reel-step">
          <h2>
            <span>{mode === 'story' ? 5 : 4}</span> Look
          </h2>
          <div className="reel-row">
            <span className="reel-label">Text</span>
            {(['quiet', 'bold', 'boxed'] as const).map((v) => (
              <button key={v} type="button" className={`reel-chip${look.text === v ? ' on' : ''}`} onClick={() => setLook((l) => ({ ...l, text: v }))} aria-pressed={look.text === v}>
                {v === 'quiet' ? 'Clean' : v === 'bold' ? 'Bold outline' : 'White box'}
              </button>
            ))}
          </div>
          {mode === 'story' && <div className="reel-row">
            <span className="reel-label">Cuts</span>
            {(['punch', 'flash', 'clean'] as const).map((v) => (
              <button key={v} type="button" className={`reel-chip${look.motion === v ? ' on' : ''}`} onClick={() => setLook((l) => ({ ...l, motion: v }))} aria-pressed={look.motion === v}>
                {v === 'punch' ? 'Punch in' : v === 'flash' ? 'Flash' : 'Clean'}
              </button>
            ))}
          </div>}
        </section>

        <section className="reel-step">
          <h2>
            <span>{mode === 'story' ? 6 : 5}</span> Export
          </h2>
          {song && (
            <label className="reel-check">
              <input type="checkbox" checked={withAudio} onChange={(e) => setWithAudio(e.target.checked)} />
              Put the song in the video
              <small>Turn this off for a popular song: post the silent video and pick the same song inside Instagram or TikTok, starting at {fmt(tl.songStart)}.</small>
            </label>
          )}
          <div className="reel-row">
            <button type="button" className="reel-btn reel-primary" onClick={exportReel} disabled={exporting !== null || !tl.segments.length}>
              {exporting !== null ? 'Recording…' : `Make the video (${Math.ceil(tl.duration)} s)`}
            </button>
          </div>
          {exported && (
            <div className="reel-done">
              <video src={exported.url} controls playsInline className="reel-result" />
              <div className="reel-row">
                {canShare && (
                  <button type="button" className="reel-btn reel-primary" onClick={share}>
                    Save or share
                  </button>
                )}
                <a className="reel-btn" href={exported.url} download={exported.file.name}>
                  Download {exported.type.includes('mp4') ? 'MP4' : 'WebM'} ({(exported.file.size / 1e6).toFixed(1)} MB)
                </a>
              </div>
              {!exported.type.includes('mp4') && <p className="reel-hint">This browser records WebM, which Instagram won&apos;t take. Open this page in Chrome, Edge or Safari for an MP4.</p>}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
