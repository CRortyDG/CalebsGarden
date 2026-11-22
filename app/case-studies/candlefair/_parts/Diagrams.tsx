/* Hand-drawn SVG diagrams. Plain server markup: they show with scripts off.
   Every label names something that exists in the code (or existed, for the first version). */

function Arrow({ id }: { id: string }) {
  return (
    <defs>
      <marker id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0 0 L10 5 L0 10 z" className="d-head" />
      </marker>
    </defs>
  );
}

function Screens({ y = 8 }: { y?: number }) {
  return (
    <g>
      {[
        ['DM laptop', 8],
        ['Table TV', 122],
        ['Phones', 236],
      ].map(([label, x]) => (
        <g key={label as string}>
          <rect className="d-box" x={x as number} y={y} width="96" height="40" rx="8" />
          <text className="d-t" x={(x as number) + 48} y={y + 25} textAnchor="middle">
            {label}
          </text>
        </g>
      ))}
    </g>
  );
}

export function BeforeDiagram() {
  return (
    <figure className="cs-diagram">
      <h3>Before: one game on Redis</h3>
      <svg viewBox="0 0 340 430" role="img" aria-labelledby="d1t d1d">
        <title id="d1t">The first deployed version</title>
        <desc id="d1d">
          Each screen talks to Next.js functions on Vercel. A change is a POST that runs a Lua script on Upstash Redis and publishes the new version number. Every screen holds a server-sent events stream that only carries version numbers, then fetches its own view. Images go to Vercel Blob. One DM key, set as an environment variable, covers the whole site.
        </desc>
        <Arrow id="a1" />
        <Screens />
        <path className="d-line" d="M56 50 V140" markerEnd="url(#a1)" />
        <text className="d-s" x="62" y="88">
          POST /api/command
        </text>
        <path className="d-line is-old" d="M170 140 V50" markerEnd="url(#a1)" />
        <path className="d-line is-old" d="M284 140 V50" markerEnd="url(#a1)" />
        <text className="d-r" x="178" y="78">
          SSE: &quot;version 42&quot;
        </text>
        <text className="d-s" x="178" y="114">
          then GET /api/view
        </text>
        <text className="d-s" x="178" y="128">
          from every screen
        </text>
        <rect className="d-box is-old" x="8" y="144" width="324" height="84" rx="10" />
        <text className="d-t" x="22" y="168">
          Next.js 16 functions on Vercel
        </text>
        <text className="d-s" x="22" y="188">
          one long-lived stream function per open screen,
        </text>
        <text className="d-s" x="22" y="203">
          closed after 270 s and reopened (limit: 300 s)
        </text>
        <text className="d-r" x="22" y="220">
          DM_KEY: one environment variable
        </text>
        <path className="d-line" d="M120 230 V286" markerEnd="url(#a1)" />
        <text className="d-s" x="128" y="256">
          MGET · EVAL · PUBLISH
        </text>
        <path className="d-line" d="M290 230 V286" markerEnd="url(#a1)" />
        <rect className="d-box" x="8" y="290" width="212" height="128" rx="10" />
        <text className="d-t" x="22" y="314">
          Upstash Redis
        </text>
        <text className="d-m" x="22" y="336">
          cf:&lt;game&gt;:state
        </text>
        <text className="d-m" x="22" y="354">
          cf:&lt;game&gt;:ver
        </text>
        <text className="d-m" x="22" y="372">
          cf:&lt;game&gt;:ledger
        </text>
        <text className="d-s" x="22" y="396">
          + a pub/sub channel per game
        </text>
        <rect className="d-box" x="232" y="290" width="100" height="62" rx="10" />
        <text className="d-t" x="282" y="316" textAnchor="middle">
          Vercel Blob
        </text>
        <text className="d-s" x="282" y="336" textAnchor="middle">
          images
        </text>
      </svg>
      <details>
        <summary>What each part did</summary>
        <ul>
          <li>
            <strong>Writes</strong> were a POST. The server read the game, ran the rules, then saved with a Lua script that refused if the version had moved on.
          </li>
          <li>
            <strong>Updates</strong> were a version number on a server-sent events stream. The stream carried no game data, so it needed no sign-in. Each screen then asked for its own view.
          </li>
          <li>
            <strong>The DM</strong> was whoever held the one <code>DM_KEY</code>. Fine for my table, wrong for anyone else&apos;s.
          </li>
        </ul>
      </details>
    </figure>
  );
}

export function AfterDiagram() {
  return (
    <figure className="cs-diagram">
      <h3>After: a room per campaign</h3>
      <svg viewBox="0 0 340 430" role="img" aria-labelledby="d2t d2d">
        <title id="d2t">The public version</title>
        <desc id="d2d">
          Screens send changes as HTTP posts to a Cloudflare Worker and hold one WebSocket each. The Worker serves the static app, applies rate limits, and forwards each request to the campaign&apos;s Durable Object, found by name from the campaign code. The room saves to its own SQLite storage and pushes every connected screen its own view. Images go to an R2 bucket.
        </desc>
        <Arrow id="a2" />
        <Screens />
        <path className="d-line" d="M56 50 V140" markerEnd="url(#a2)" />
        <text className="d-s" x="62" y="88">
          POST /api/command
        </text>
        <path className="d-line is-push" d="M170 140 V50" markerEnd="url(#a2)" />
        <path className="d-line is-push" d="M284 140 V50" markerEnd="url(#a2)" />
        <text className="d-m" x="178" y="78">
          WebSocket: your view
        </text>
        <text className="d-s" x="178" y="114">
          the whole filtered
        </text>
        <text className="d-s" x="178" y="128">
          view, pushed
        </text>
        <rect className="d-box" x="8" y="144" width="324" height="66" rx="10" />
        <text className="d-t" x="22" y="168">
          Worker &quot;candlefair&quot;
        </text>
        <text className="d-s" x="22" y="188">
          static app · rate limits · uploads to R2
        </text>
        <path className="d-line" d="M120 212 V268" markerEnd="url(#a2)" />
        <text className="d-m" x="128" y="244">
          ROOMS.idFromName(code)
        </text>
        <path className="d-line" d="M290 212 V268" markerEnd="url(#a2)" />
        <rect className="d-box is-key" x="8" y="272" width="212" height="146" rx="10" />
        <text className="d-t" x="22" y="296">
          GameRoom (Durable Object)
        </text>
        <text className="d-s" x="22" y="314">
          one per campaign code
        </text>
        <text className="d-m" x="22" y="338">
          SQLite: doc · ledger
        </text>
        <text className="d-m" x="22" y="356">
          dm_key_hash
        </text>
        <text className="d-m" x="22" y="374">
          its own sockets
        </text>
        <text className="d-s" x="22" y="400">
          deleted after 180 idle days
        </text>
        <rect className="d-box" x="232" y="272" width="100" height="62" rx="10" />
        <text className="d-t" x="282" y="298" textAnchor="middle">
          R2
        </text>
        <text className="d-s" x="282" y="318" textAnchor="middle">
          images
        </text>
      </svg>
      <details>
        <summary>What each part does</summary>
        <ul>
          <li>
            <strong>The Worker</strong> is the front door. It never holds game state. It finds the room by name and hands the request over.
          </li>
          <li>
            <strong>The room</strong> is one Durable Object instance. Cloudflare runs at most one instance for a given name, so every screen at a table talks to the same copy of the game.
          </li>
          <li>
            <strong>Updates</strong> are the whole view each screen is allowed to see, sent over its WebSocket after every save. Not a diff.
          </li>
        </ul>
      </details>
    </figure>
  );
}

export function NamespaceDiagram() {
  const rooms: { x: number; y: number; name: string; sub: string; kind?: 'ghost' | 'key' }[] = [
    { x: 22, y: 138, name: 'k7m2qpx', sub: 'made-up code, 7 letters', kind: 'key' },
    { x: 186, y: 138, name: 'marrowmere-crew', sub: 'a code the DM chose' },
    { x: 22, y: 234, name: 'practice:k7m2qpx', sub: 'private rehearsal copy' },
    { x: 186, y: 234, name: 'zzzzzzz', sub: 'a guess: nothing stored', kind: 'ghost' },
  ];
  return (
    <figure className="cs-diagram is-wide">
      <h3>The ROOMS namespace</h3>
      <svg viewBox="0 0 350 400" role="img" aria-labelledby="d3t d3d">
        <title id="d3t">One namespace, many rooms</title>
        <desc id="d3d">
          The Worker turns a campaign code into a Durable Object id with idFromName. Each code gets its own room with its own storage and sockets. A practice copy lives under the name practice: plus the code, which no typed code can produce. A guessed code that was never created leaves nothing stored. A separate Registry object lists campaigns for the site admin page.
        </desc>
        <Arrow id="a3" />
        <rect className="d-box" x="75" y="6" width="200" height="44" rx="8" />
        <text className="d-t" x="175" y="27" textAnchor="middle">
          Worker
        </text>
        <text className="d-s" x="175" y="42" textAnchor="middle">
          ?game=&lt;code&gt;
        </text>
        <path className="d-line" d="M175 52 V100" markerEnd="url(#a3)" />
        <text className="d-m" x="183" y="80">
          idFromName(code)
        </text>
        <rect className="d-zone" x="8" y="106" width="334" height="222" rx="12" />
        <text className="d-m" x="22" y="126">
          ROOMS · class GameRoom · SQLite
        </text>
        {rooms.map((r) => (
          <g key={r.name}>
            <rect className={`d-box${r.kind === 'ghost' ? ' is-ghost' : r.kind === 'key' ? ' is-key' : ''}`} x={r.x} y={r.y} width="142" height="80" rx="8" />
            <text className="d-t" x={r.x + 10} y={r.y + 22}>
              {r.name}
            </text>
            <text className="d-s" x={r.x + 10} y={r.y + 40}>
              {r.sub}
            </text>
            {r.kind !== 'ghost' && (
              <text className="d-m" x={r.x + 10} y={r.y + 64} style={{ fontSize: 9.5 }}>
                doc · ledger · sockets
              </text>
            )}
          </g>
        ))}
        <rect className="d-box" x="8" y="344" width="334" height="48" rx="8" />
        <text className="d-t" x="22" y="365">
          Registry (&quot;admin:registry&quot;)
        </text>
        <text className="d-s" x="22" y="382">
          a separate object that lists campaigns for my admin page
        </text>
      </svg>
      <details>
        <summary>Why the names matter</summary>
        <ul>
          <li>
            <strong>Same code, same room.</strong> <code>idFromName</code> always gives the same id for the same name, so no lookup table sits in front of the rooms.
          </li>
          <li>
            <strong>Nothing shared.</strong> A room only ever reads its own storage. One table&apos;s save can&apos;t block or see another&apos;s.
          </li>
          <li>
            <strong>Practice rooms</strong> are named <code>practice:&lt;code&gt;</code>. Codes are letters, digits and dashes, so no one can type their way into one.
          </li>
          <li>
            <strong>Guesses cost nothing.</strong> A room only creates its tables on the first real save, so a wrong code leaves no rows behind.
          </li>
        </ul>
      </details>
    </figure>
  );
}
