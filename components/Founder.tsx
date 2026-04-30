export default function Founder() {
  return (
    <section className="border-b border-rule bg-navy text-white">
      <div className="container-tight py-20 sm:py-24">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-navy-200">
              From the curator
            </p>
            <div className="mt-6 flex items-center gap-3">
              <div className="h-2 w-2 bg-accent" aria-hidden />
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-navy-200">
                MY · SG · JP · HK · TW
              </span>
            </div>
          </div>

          <div className="lg:col-span-8">
            <p className="text-balance text-xl leading-relaxed text-white sm:text-2xl">
              I&apos;m a curator and nomad working across Malaysia, Singapore,
              Japan, Hong Kong, and Taiwan throughout the year. Curator OS is
              built by a trader, for collectors who treat cards as assets — not
              by software people guessing at the floor.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-6 border-t border-navy-400 pt-8 sm:grid-cols-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-navy-200">
                  Background
                </p>
                <p className="mt-2 text-sm leading-relaxed text-navy-100">
                  Trading desk discipline applied to cardboard. Position
                  sizing, capital efficiency, exit planning.
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-navy-200">
                  Coverage
                </p>
                <p className="mt-2 text-sm leading-relaxed text-navy-100">
                  English and Japanese. On-the-ground presence at the venues
                  where price actually clears.
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-navy-200">
                  Stance
                </p>
                <p className="mt-2 text-sm leading-relaxed text-navy-100">
                  Sold comps over hype. Constraints over vibes. The verdict
                  serves the user, not the marketplace.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
