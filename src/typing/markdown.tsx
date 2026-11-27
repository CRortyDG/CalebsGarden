import type { ReactNode } from 'react';

/**
 * Just enough Markdown for a note written at the desk: paragraphs, ## headings,
 * > quotes, - and 1. lists, [links](url), **bold**, *italics*, `code` and bare email addresses.
 * Anything else shows as typed. The published note is this, run over the
 * recording's final text, so the page and the replay can't disagree.
 */
export function Markdown({ text }: { text: string }) {
  // A heading is its own block even when the next line follows it straight away.
  const blocks = text
    .replace(/\r/g, '')
    .replace(/^(#{1,3}\s.*)$/gm, '\n$1\n')
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);
  return (
    <>
      {blocks.map((b, i) => {
        const h = b.match(/^(#{1,3})\s+(.*)$/);
        if (h) return h[1].length === 3 ? <h3 key={i}>{inline(h[2])}</h3> : <h2 key={i}>{inline(h[2])}</h2>;
        const lines = b.split('\n');
        if (lines.every((l) => /^>\s?/.test(l))) return <blockquote key={i}><p>{inline(lines.map((l) => l.replace(/^>\s?/, '')).join(' '))}</p></blockquote>;
        if (lines.every((l) => /^[-*]\s+/.test(l))) return <ul key={i}>{lines.map((l, j) => <li key={j}>{inline(l.replace(/^[-*]\s+/, ''))}</li>)}</ul>;
        if (lines.every((l) => /^\d+\.\s+/.test(l))) return <ol key={i}>{lines.map((l, j) => <li key={j}>{inline(l.replace(/^\d+\.\s+/, ''))}</li>)}</ol>;
        return <p key={i}>{lines.map((l, j) => [j > 0 && <br key={`b${j}`} />, ...inline(l, `${j}-`)])}</p>;
      })}
    </>
  );
}

const TOKEN = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|([\w.+-]+@[\w-]+(?:\.[\w-]+)+)/g;

export function inline(s: string, prefix = ''): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let k = 0;
  for (const m of s.matchAll(TOKEN)) {
    if (m.index > last) out.push(s.slice(last, m.index));
    const key = `${prefix}${k++}`;
    if (m[1] !== undefined) {
      const href = /^(https?:|\/|#|mailto:)/.test(m[2]) ? m[2] : '#';
      out.push(<a key={key} href={href}>{m[1]}</a>);
    } else if (m[3] !== undefined) out.push(<strong key={key}>{m[3]}</strong>);
    else if (m[4] !== undefined) out.push(<em key={key}>{m[4]}</em>);
    else if (m[5] !== undefined) out.push(<code key={key}>{m[5]}</code>);
    else out.push(<a key={key} href={`mailto:${m[6]}`}>{m[6]}</a>);
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push(s.slice(last));
  return out;
}
