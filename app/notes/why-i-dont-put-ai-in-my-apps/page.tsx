import Link from 'next/link';
import { Note, noteMetadata } from '../_parts/Note';

const SLUG = 'why-i-dont-put-ai-in-my-apps';
export const metadata = noteMetadata(SLUG);
export const revalidate = 3600; // a scheduled note goes live within the hour of its day

export default function Page() {
  return (
    <Note slug={SLUG}>
      <p>
        I use AI for nearly everything I make. Claude Code wrote almost all of Candlefair&apos;s code under my direction, and I use AI for graphics, for writing,
        for networking and for running my computer. But open either of my apps and you won&apos;t find a chatbot, an &ldquo;Ask AI&rdquo; button or a sparkle icon.
        That&apos;s on purpose.
      </p>

      <h2>People using them don&apos;t care</h2>
      <p>
        Someone opening madtown.today wants today&apos;s puzzle. A D&amp;D group opening Candlefair wants the game to start. Neither came to talk to anything. If
        you&apos;re already looking at the buttons that do the thing, a chat box that can also do the thing is a slower way to do it, and one more thing to learn.
      </p>
      <p>
        I tried to think of software I use every day that has AI built in, and I couldn&apos;t name one I&apos;d miss. The AI I use lives in its own place, and I
        bring my work to it.
      </p>

      <h2>Where the AI actually goes</h2>
      <p>
        <strong>Into building.</strong> This is where it changed things for me. AI makes it cheap to try an idea, throw it away and try the next one. That&apos;s
        what lets one person keep two free apps going. The people using them never see it; they just get more of what they came for.
      </p>
      <p>
        <strong>Behind the scenes.</strong> madtown.today has no AI on the site. In its admin editor, Claude can draft a day of the Madison Asks question or the
        Four Lakes puzzle from a nudge, or fact-check a day using web search. Drafts are only ever saved as drafts, and a person publishes them. Every call&apos;s
        cost is added to the month&apos;s total, and past a cap ($40 by default) Claude switches off until the month turns. The editor works the same without it.
      </p>
      <p>
        <strong>From outside, by choice.</strong> Candlefair has no AI in it either. What it has is a Worldbuilder: a small MCP server that lets a DM point their own
        Claude, in Claude Desktop or Claude Code, at their own campaign.
      </p>

      <h2>Bring your own AI</h2>
      <p>
        MCP (Model Context Protocol) is a way for an AI assistant to use an app&apos;s tools from a chat. Candlefair&apos;s Worldbuilder is built around it:
      </p>
      <ul>
        <li>It&apos;s off for every campaign until the DM turns it on, and turning it off stops every key at once.</li>
        <li>
          The DM makes a key for one campaign, with an expiry (30 days by default). It&apos;s shown once and only a hash is kept. A box can stop it reading secrets
          and DM notes.
        </li>
        <li>
          The AI can only write <em>drafts</em>: people, places, shops, job flyers, random tables and so on. They wait on the DM&apos;s Worldbuilder page, and approving
          one adds it hidden, so nothing reaches the table until the DM reveals it.
        </li>
        <li>
          A key can never change the game, reveal or publish anything, approve or delete, change settings, or read players&apos; real names or sign-in details.
        </li>
      </ul>
      <p>
        The DM pays for their own AI, because it&apos;s theirs. Candlefair pays nothing for it, and doesn&apos;t need a business model to cover it. That matters for
        software I want to keep{' '}
        <Link href="/case-studies/cheap-enough-to-give-away">cheap enough to give away</Link>.
      </p>

      <h2>I&apos;m not going to build a better agent than Anthropic</h2>
      <p>
        The AI labs spend more on their assistants than I ever could, and those assistants get better every few months without me doing anything. Anything I bolted
        into Candlefair would be a worse copy of what a DM already has open in another window.
      </p>
      <p>
        But Anthropic isn&apos;t going to build software for one D&amp;D table or one city&apos;s morning puzzle. That&apos;s my part. So the split I&apos;ve landed
        on is: I build the local software, they build the agent, and MCP lets the person join the two when they want to. It isn&apos;t an AI product. It&apos;s a
        normal app that an AI can use, at the user&apos;s choice.
      </p>
      <p>
        It also suits who&apos;s asking. Someone who already lives in Claude and likes MCP servers gets real use from it with nothing to learn: they talk to the
        assistant they already know. Everyone else never sees it.
      </p>

      <h2>Where I might be wrong</h2>
      <ul>
        <li>
          Some features would be fine as a plain AI call. A &ldquo;give me a quick NPC&rdquo; button in Candlefair wouldn&apos;t be bad. I&apos;d just have to pay for
          every press, and decide what happens when the money runs out.
        </li>
        <li>
          Bring-your-own-AI asks a lot today. Setting up an MCP server isn&apos;t something most DMs will do, so for now it&apos;s a power-user feature. That&apos;s
          fine for me, and it gets easier as the assistants make it easier.
        </li>
        <li>This is about my apps: small, free, for one group. A product built around generating things is a different question.</li>
      </ul>
    </Note>
  );
}
