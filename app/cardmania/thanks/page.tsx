import Link from "next/link";
import EmailCapture from "./EmailCapture";

type ThanksPageProps = {
  searchParams: { u?: string };
};

const SOCIAL_LINKS = [
  {
    name: "YouTube",
    handle: "@chous.tcg.ledger",
    href: "https://www.youtube.com/@chous.tcg.ledger",
    cn: "订阅 YouTube",
  },
  {
    name: "Instagram",
    handle: "@chous.tcg.ledger",
    href: "https://www.instagram.com/chous.tcg.ledger",
    cn: "关注 Instagram",
  },
  {
    name: "Threads",
    handle: "@chous.tcg.ledger",
    href: "https://www.threads.com/@chous.tcg.ledger",
    cn: "关注 Threads",
  },
  {
    name: "Spotify",
    handle: "Chou's TCG Ledger",
    href: "https://open.spotify.com/show/033cFnW0Ay9uqV7Gg0VBfv?si=0d67a9b24e8a4821",
    cn: "听 Podcast",
  },
  {
    name: "Website",
    handle: "chous-tcg-ledger.vercel.app",
    href: "https://chous-tcg-ledger.vercel.app/",
    cn: "邹氏卡藏官网",
  },
];

export default function ThanksPage({ searchParams }: ThanksPageProps) {
  const wantsUpdates = searchParams?.u === "yes";

  return (
    <main className="min-h-screen bg-surface">
      <header className="border-b border-rule bg-white">
        <div className="container-tight py-6">
          <div className="flex items-center gap-3">
            <div className="h-2.5 w-2.5 bg-accent" aria-hidden />
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-navy-400">
              Curator OS · Card Mania 2026
            </span>
          </div>
        </div>
      </header>

      <section className="bg-white border-b border-rule">
        <div className="container-tight py-14 sm:py-20">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
            Submitted
          </p>
          <h1 className="mt-4 max-w-3xl text-balance text-4xl font-semibold leading-tight tracking-tightish text-navy sm:text-5xl">
            Thanks for sharing.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-navy-400 sm:text-lg">
            Curator OS is being built from voices like yours. The data you just gave us shapes what we build next.
            <br />
            <span className="text-navy-500">谢谢你的时间。Curator OS 是从大家的反馈里长出来的。</span>
          </p>
        </div>
      </section>

      {wantsUpdates && (
        <section className="border-b border-rule bg-white">
          <div className="container-tight py-12">
            <p className="eyebrow uppercase">Stay in the loop</p>
            <h2 className="mt-3 max-w-2xl text-2xl font-semibold leading-snug text-navy">
              Drop your email — we&apos;ll let you know when Curator OS launches.
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-navy-400">
              留下 email, 发布的时候第一时间通知你。
            </p>
            <div className="mt-6 max-w-xl">
              <EmailCapture />
            </div>
          </div>
        </section>
      )}

      <section className="bg-white">
        <div className="container-tight py-14">
          <p className="eyebrow uppercase">Follow the journey</p>
          <h2 className="mt-3 max-w-2xl text-2xl font-semibold leading-snug text-navy">
            Curator OS is built in public by 邹氏卡藏 · Chou&apos;s TCG Ledger.
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-navy-400">
            Newsletter, podcast, IG, Threads — pick your channel.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group block border border-navy-200 bg-white p-5 transition-colors hover:border-navy"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.18em] text-navy-400 group-hover:text-navy">
                      {s.name}
                    </p>
                    <p className="mt-2 text-base font-medium text-navy">{s.handle}</p>
                    <p className="mt-1 text-xs text-navy-400">{s.cn}</p>
                  </div>
                  <span className="font-mono text-xs text-navy-300 group-hover:text-accent" aria-hidden>
                    →
                  </span>
                </div>
              </a>
            ))}
          </div>

          <div className="mt-10 border-t border-rule pt-6">
            <p className="text-xs text-navy-400">
              Or email directly:{" "}
              <a
                href="mailto:chous.tcg.ledger@outlook.com"
                className="text-navy underline hover:text-accent"
              >
                chous.tcg.ledger@outlook.com
              </a>
            </p>
          </div>
        </div>
      </section>

      <section className="bg-surface">
        <div className="container-tight py-10">
          <Link
            href="/cardmania"
            className="text-sm font-medium text-navy underline hover:text-accent"
          >
            ← Back to survey
          </Link>
        </div>
      </section>

      <footer className="border-t border-rule bg-white">
        <div className="container-tight py-8">
          <p className="text-xs text-navy-400">
            Curator OS — Market intelligence for serious Pokemon TCG collectors. Built by 邹氏卡藏.
          </p>
        </div>
      </footer>
    </main>
  );
}
