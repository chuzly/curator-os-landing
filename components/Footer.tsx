export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-white">
      <div className="container-tight py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 bg-accent" aria-hidden />
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-navy-400">
                Curator OS
              </span>
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-navy-400">
              Curator OS provides market intelligence. Physical card inspection
              remains the user&apos;s responsibility.
            </p>
          </div>

          <div className="md:col-span-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-navy-400">
              Coverage
            </p>
            <p className="mt-3 text-sm text-navy-500">
              Malaysia · Singapore · Japan · Hong Kong · Taiwan
            </p>
          </div>

          <div className="md:col-span-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-navy-400">
              Status
            </p>
            <p className="mt-3 text-sm text-navy-500">
              Private beta · onboarding by invitation
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-rule pt-6 text-xs text-navy-400 sm:flex-row sm:items-center">
          <span>© {year} Curator OS. All rights reserved.</span>
          <span>
            Not affiliated with The Pokemon Company, Nintendo, Creatures Inc.,
            or Game Freak.
          </span>
        </div>
      </div>
    </footer>
  );
}
