const pillars = [
  {
    index: "01",
    title: "Inventory and capital discipline",
    body: "Track exposure across sets, languages, and grading queues. Know what your shelf is worth, what it cost, and what is tying up capital that should be working harder elsewhere.",
  },
  {
    index: "02",
    title: "Accurate market data",
    body: "Sold comparables only — never asking prices. Sourced from regional marketplaces, auction houses, and verified dealer transactions across MY, SG, JP, HK, and TW.",
  },
  {
    index: "03",
    title: "Individual decision context",
    body: "Verdicts adapt to your thesis. A short-horizon flipper and a long-term collector see different conclusions on the same card, because their constraints are different.",
  },
];

export default function Pillars() {
  return (
    <section className="border-b border-rule bg-surface">
      <div className="container-tight py-20 sm:py-24">
        <div className="mb-10 max-w-2xl">
          <p className="eyebrow mb-3">What it does</p>
          <h2 className="text-3xl font-semibold tracking-tightish text-navy sm:text-4xl">
            Three pillars, one operating system.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-px bg-rule md:grid-cols-3">
          {pillars.map((p) => (
            <div key={p.index} className="bg-surface p-6 sm:p-8">
              <div className="mb-6 flex items-baseline gap-3">
                <span className="font-mono text-xs text-navy-400">{p.index}</span>
                <span className="h-px flex-1 bg-rule" />
              </div>
              <h3 className="mb-3 text-lg font-semibold tracking-tightish text-navy">
                {p.title}
              </h3>
              <p className="text-sm leading-relaxed text-navy-400">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
