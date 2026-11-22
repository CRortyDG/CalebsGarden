/* A code excerpt copied from the Candlefair repository. Lines that start with // are dimmed.
   "// …" marks where lines were left out. */
export function Code({ file, at, note, children }: { file: string; at: string; note?: string; children: string }) {
  const lines = children.replace(/^\n/, '').replace(/\n\s*$/, '').split('\n');
  return (
    <figure className="cs-code">
      <pre>
        <code>
          {lines.map((l, i) => (
            <span key={i} className={/^\s*(\/\/|--)/.test(l) ? 'c' : undefined}>
              {l}
              {'\n'}
            </span>
          ))}
        </code>
      </pre>
      <figcaption>
        <b>{file}</b>
        <span>at {at}</span>
        {note && <span>{note}</span>}
      </figcaption>
    </figure>
  );
}
