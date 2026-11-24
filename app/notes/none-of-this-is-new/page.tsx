import Link from 'next/link';
import { Note, noteMetadata } from '../_parts/Note';

const SLUG = 'none-of-this-is-new';
export const metadata = noteMetadata(SLUG);
export const revalidate = 3600; // a scheduled note goes live within the hour of its day

export default function Page() {
  return (
    <Note slug={SLUG}>
      <p>
        Someone read the <Link href="/case-studies">case studies</Link> and told me, kindly, that the idea in them isn&apos;t mine. They&apos;re right. Software
        built for a group you can name, cheap enough to give away, without accounts, with a second community getting its own copy: people have been saying this
        for twenty years, and saying it well. I knew most of that, and I still wrote as if I was working it out on my own. That&apos;s worth fixing.
      </p>

      <h2>Who said it first</h2>
      <ul>
        <li>
          <strong>Clay Shirky, 2004.</strong> <a href="https://shirky.com/essays/situated-software/">Situated Software</a> is about software &ldquo;designed in
          and for a particular social situation or context.&rdquo; His students built small tools for groups they knew, and the tools worked because they leaned on
          that group instead of trying to serve everyone. That&apos;s <Link href="/case-studies/sized-to-its-community">Sized to its community</Link>, two
          decades early.
        </li>
        <li>
          <strong>Robin Sloan, 2020.</strong> <a href="https://www.robinsloan.com/notes/home-cooked-app/">An app can be a home-cooked meal</a> is about an app he
          made for his family and nobody else. &ldquo;I am the programming equivalent of a home cook.&rdquo; A D&amp;D companion for one table is the same kind of
          cooking.
        </li>
        <li>
          <strong>Ink &amp; Switch, 2019.</strong> <a href="https://www.inkandswitch.com/local-first/">Local-first software</a> argues your data should live with
          you, not on someone&apos;s server. My apps don&apos;t go that far, but{' '}
          <Link href="/case-studies/the-browser-is-the-account">the browser is the account</Link> comes from the same instinct.
        </li>
        <li>
          <strong>The small web.</strong> Aral Balkan&apos;s <a href="https://ar.al/2020/08/07/what-is-the-small-web/">What is the Small Web?</a> puts it simply:
          &ldquo;the polar opposite of the Big Web.&rdquo; Lots of people are building that way, mostly without writing manifestos about it.
        </li>
      </ul>

      <h2>What I can add</h2>
      <p>
        Not the idea. What I have is two apps running for real people, and the receipts:{' '}
        <Link href="/notes/what-madtown-today-actually-costs">what they cost</Link>,{' '}
        <Link href="/notes/three-tests-that-didnt-win">the tests that didn&apos;t work</Link> and{' '}
        <Link href="/notes/who-comes-back">who actually comes back</Link>. That&apos;s a small contribution, and an early one. madtown.today is under two months old,
        and two apps prove much less than twenty years of other people&apos;s work.
      </p>
      <p>
        So I&apos;ll keep doing the part that&apos;s mine, which is running these things and writing down what happens, and point to the people who said it first
        when I lean on them.
      </p>
    </Note>
  );
}
