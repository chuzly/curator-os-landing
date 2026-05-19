import Link from "next/link";
import Image from "next/image";
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
    <main className="brand-texture relative min-h-screen bg-brand-bg text-brand-cream font-brand-sans">
      {/* Topbar */}
      <header className="sticky top-0 z-50 border-b border-brand-gold/25 bg-brand-bg/95 backdrop-blur">
        <div className="mx-auto flex max-w-brand-content items-center justify-between px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3.5">
            <Image
              src="/brand/seal-zou.png"
              alt="邹氏卡藏 seal"
              width={56}
              height={56}
              className="h-14 w-14 object-contain"
              priority
            />
            <div className="flex flex-col">
              <span className="font-brand-brush text-2xl leading-none text-brand-cream">
                邹氏卡藏
              </span>
              <span className="mt-0.5 font-brand-label text-[10px] font-semibold leading-tight tracking-[0.22em] text-brand-gold">
                CHOU&apos;S TCG LEDGER
              </span>
            </div>
          </div>
          <span className="font-brand-label text-[10px] font-semibold tracking-[0.22em] text-brand-gold uppercase">
            Card Mania · 2026
          </span>
        </div>
      </header>

      {/* Hero — thank you */}
      <section className="relative overflow-hidden border-b border-brand-gold/15">
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(200,161,90,0.16), transparent 60%), radial-gradient(ellipse at 30% 100%, rgba(183,50,36,0.12), transparent 50%)",
          }}
        />
        {/* Decorative compass marks */}
        <div aria-hidden className="brand-compass-mark" style={{ top: "-80px", right: "-80px", width: "320px", height: "320px" }} />
        <div aria-hidden className="brand-compass-mark" style={{ bottom: "-100px", left: "-100px" }} />

        <div className="relative mx-auto max-w-brand-content px-5 py-16 sm:px-6 sm:py-24">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-brand-red-bright/55 bg-brand-red-bright/12 px-4 py-2">
            <span className="font-brand-label text-[11px] font-semibold tracking-[0.34em] uppercase text-brand-red-bright">
              ✓ 提交成功 · Submitted
            </span>
          </div>
          <h1
            className="font-brand-editorial text-5xl font-black leading-[1.1] tracking-[0.06em] sm:text-6xl md:text-7xl"
            style={{
              color: "#D43A2A",
              filter: "drop-shadow(0 4px 24px rgba(212, 58, 42, 0.3))",
            }}
          >
            谢谢你的反馈。
          </h1>
          <p className="mt-6 font-brand-label text-sm font-bold tracking-[0.24em] uppercase text-brand-cream">
            ─ Thanks for sharing your voice ─
          </p>
          <p className="mt-9 max-w-2xl text-xl font-medium leading-relaxed text-brand-cream">
            Curator OS 是从大家的反馈里长出来的。
          </p>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-brand-cream/85">
            你刚刚给的数据, 直接塑造我们下一步要做什么。
          </p>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-brand-cream/75">
            Curator OS is being built from voices like yours. The data you
            just shared shapes what we build next.
          </p>
        </div>
      </section>

      {/* Email capture — only if wants updates */}
      {wantsUpdates && (
        <section className="border-b border-brand-gold/20 bg-brand-panel-dark">
          <div className="mx-auto max-w-brand-content px-5 py-14 sm:px-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="block h-px w-9 bg-brand-gold" />
              <span className="font-brand-label text-[11px] font-bold tracking-[0.34em] uppercase text-brand-gold">
                Stay in the loop
              </span>
            </div>
            <h2 className="max-w-2xl font-brand-sans text-2xl font-bold leading-snug tracking-wide text-brand-cream sm:text-3xl">
              留下 email, 发布的时候第一时间通知你。
            </h2>
            <p className="mt-3 max-w-2xl text-base text-brand-cream/80">
              Drop your email — we&apos;ll let you know when Curator OS launches.
            </p>
            <div className="mt-8 max-w-xl">
              <EmailCapture />
            </div>
          </div>
        </section>
      )}

      {/* Social CTAs */}
      <section className="bg-brand-bg">
        <div className="mx-auto max-w-brand-content px-5 py-16 sm:px-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="block h-px w-9 bg-brand-gold" />
            <span className="font-brand-label text-[11px] font-bold tracking-[0.34em] uppercase text-brand-gold">
              Follow the journey
            </span>
          </div>
          <h2 className="max-w-2xl font-brand-sans text-2xl font-bold leading-snug tracking-wide text-brand-cream sm:text-3xl">
            Curator OS is built in public by 邹氏卡藏。
          </h2>
          <p className="mt-3 max-w-2xl text-base text-brand-cream/80">
            Newsletter, podcast, IG, Threads — pick your channel.
          </p>

          <div className="mt-10 grid gap-3.5 sm:grid-cols-2">
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group block rounded-sm border border-brand-gold/30 bg-brand-panel p-6 transition-all hover:-translate-y-0.5 hover:border-brand-gold hover:bg-brand-panel-warm"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <div>
                    <p className="font-brand-label text-[11px] font-bold tracking-[0.22em] uppercase text-brand-gold">
                      {s.name}
                    </p>
                    <p className="mt-2.5 font-brand-en text-lg font-semibold text-brand-cream">
                      {s.handle}
                    </p>
                    <p className="mt-1 text-sm text-brand-cream/75">{s.cn}</p>
                  </div>
                  <span
                    className="font-brand-label text-base font-bold text-brand-gold transition-colors group-hover:text-brand-red-bright"
                    aria-hidden
                  >
                    →
                  </span>
                </div>
              </a>
            ))}
          </div>

          <div className="mt-12 border-t border-brand-gold/20 pt-7">
            <p className="text-sm text-brand-cream/80">
              Or email directly:{" "}
              <a
                href="mailto:chous.tcg.ledger@outlook.com"
                className="font-medium text-brand-gold underline transition-colors hover:text-brand-gold-light"
              >
                chous.tcg.ledger@outlook.com
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Back to survey */}
      <section className="border-t border-brand-gold/15 bg-brand-bg-deep">
        <div className="mx-auto max-w-brand-content px-5 py-10 sm:px-6">
          <Link
            href="/cardmania"
            className="font-brand-label text-xs font-bold tracking-[0.22em] uppercase text-brand-gold transition-colors hover:text-brand-gold-light"
          >
            ← Back to survey
          </Link>
        </div>
      </section>

      {/* Footer with tagline */}
      <footer className="border-t border-brand-gold/20 bg-brand-bg-deep">
        <div className="mx-auto max-w-brand-content px-5 py-14 sm:px-6">
          <p className="font-brand-editorial text-2xl font-black tracking-[0.08em] text-brand-cream">
            每一张入藏, 都要有理由。
          </p>
          <p className="mt-3 font-brand-en text-sm font-medium tracking-[0.18em] uppercase text-brand-cream/75">
            Every card has a reason — Chou
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 font-brand-label text-[11px] font-semibold tracking-[0.22em] uppercase text-brand-cream/65">
            <span>邹氏卡藏 · Chou&apos;s TCG Ledger</span>
            <span className="text-brand-gold/50">·</span>
            <span>Card Mania 2026 · Kuala Lumpur · MY</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
