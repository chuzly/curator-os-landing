type Verdict = {
  profile: string;
  thesis: string;
  verdict: "Buy" | "Hold" | "Pass" | "Accumulate";
  verdictTone: "positive" | "neutral" | "negative";
  rationale: string[];
  metrics: { label: string; value: string }[];
};

const card = {
  name: "Charizard ex — Special Art Rare",
  set: "Obsidian Flames · 2023",
  language: "English · raw",
  comp: "USD 142 (30-day median, n=46)",
};

const verdicts: Verdict[] = [
  {
    profile: "Cash-rich flipper",
    thesis: "30-day horizon · turnover budget RM 18k/mo",
    verdict: "Pass",
    verdictTone: "negative",
    rationale: [
      "Sold-comp peak was 14 days ago; volume curve has rolled over.",
      "Holding 60+ days at this entry compresses your monthly turnover.",
      "Better short-horizon spreads currently in JP-language Surging Sparks.",
    ],
    metrics: [
      { label: "30d median", value: "USD 142" },
      { label: "30d delta", value: "−6.4%" },
      { label: "Sold velocity", value: "Falling" },
      { label: "Spread vs. ask", value: "8.1%" },
    ],
  },
  {
    profile: "Long-term collector",
    thesis: "18-month thesis · accumulating English SAR set",
    verdict: "Accumulate",
    verdictTone: "positive",
    rationale: [
      "Print-run constrained relative to Surging Sparks reprint cadence.",
      "PSA 10 population growth slowing; graded slabs trending up YoY.",
      "Format-relevant artwork; demand persists past tournament rotation.",
    ],
    metrics: [
      { label: "12mo median", value: "USD 156" },
      { label: "12mo delta", value: "+11.2%" },
      { label: "Pop. growth", value: "Slowing" },
      { label: "Conviction", value: "High" },
    ],
  },
];

function VerdictBadge({ verdict, tone }: { verdict: string; tone: Verdict["verdictTone"] }) {
  const toneClass =
    tone === "positive"
      ? "border-navy bg-navy text-white"
      : tone === "negative"
        ? "border-accent bg-accent text-white"
        : "border-navy-200 bg-white text-navy";
  return (
    <span
      className={`inline-flex items-center border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] ${toneClass}`}
    >
      {verdict}
    </span>
  );
}

export default function VerdictDemo() {
  return (
    <section className="border-b border-rule bg-white">
      <div className="container-tight py-20 sm:py-24">
        <div className="mb-10 max-w-2xl">
          <p className="eyebrow mb-3">Decision context</p>
          <h2 className="text-3xl font-semibold tracking-tightish text-navy sm:text-4xl">
            Same card, different verdict.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-navy-400">
            Most platforms hand you the same number regardless of who you are.
            Curator OS asks what you are trying to do, then weighs the data
            against your constraints.
          </p>
        </div>

        <div className="mb-6 border border-rule bg-surface p-5 sm:flex sm:items-end sm:justify-between sm:gap-6">
          <div>
            <p className="eyebrow mb-1.5">Subject card</p>
            <p className="text-base font-semibold tracking-tightish text-navy sm:text-lg">
              {card.name}
            </p>
            <p className="mt-1 text-xs text-navy-400">
              {card.set} · {card.language}
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:text-right">
            <p className="eyebrow mb-1.5">Reference comp</p>
            <p className="font-mono text-sm text-navy">{card.comp}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {verdicts.map((v) => (
            <article
              key={v.profile}
              className="flex flex-col border border-rule bg-white p-6 sm:p-7"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow mb-1">User profile</p>
                  <p className="text-base font-semibold tracking-tightish text-navy">
                    {v.profile}
                  </p>
                  <p className="mt-1 text-xs text-navy-400">{v.thesis}</p>
                </div>
                <VerdictBadge verdict={v.verdict} tone={v.verdictTone} />
              </div>

              <div className="my-6 h-px bg-rule" />

              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                {v.metrics.map((m) => (
                  <div key={m.label}>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-navy-400">
                      {m.label}
                    </p>
                    <p className="mt-1 font-mono text-sm text-navy">{m.value}</p>
                  </div>
                ))}
              </div>

              <div className="my-6 h-px bg-rule" />

              <div>
                <p className="eyebrow mb-3">Rationale</p>
                <ul className="space-y-2.5">
                  {v.rationale.map((r, i) => (
                    <li key={i} className="flex gap-3 text-sm leading-relaxed text-navy-500">
                      <span
                        aria-hidden
                        className="mt-2 h-px w-3 flex-none bg-navy-200"
                      />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
