"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Single = { value: string; label: string };

const Q1_AGE: Single[] = [
  { value: "under_25", label: "Under 25" },
  { value: "25_35", label: "25–35" },
  { value: "35_45", label: "35–45" },
  { value: "45_plus", label: "45+" },
];

const Q2_TYPE: Single[] = [
  { value: "returning", label: "Returning collector / 回归玩家" },
  { value: "investor", label: "Active investor / 投资型" },
  { value: "casual", label: "Casual / 随意收藏" },
  { value: "reseller", label: "Reseller, flipper / 倒卖" },
  { value: "parent", label: "Parent, gift buyer / 家长" },
  { value: "vendor", label: "Vendor or shop / 商家" },
];

const Q3_SPEND: Single[] = [
  { value: "under_100", label: "Under RM 100 / 每月 < RM 100" },
  { value: "100_500", label: "RM 100 – 500" },
  { value: "500_1500", label: "RM 500 – 1,500" },
  { value: "1500_5000", label: "RM 1,500 – 5,000" },
  { value: "5000_plus", label: "RM 5,000+" },
  { value: "varies", label: "Varies a lot / 不固定" },
];

const Q4_APPS: Single[] = [
  { value: "shiny", label: "Shiny" },
  { value: "pokellector", label: "Pokellector" },
  { value: "tcgplayer", label: "TCGplayer" },
  { value: "ebay", label: "eBay (sold listings)" },
  { value: "carousell", label: "Carousell" },
  { value: "google", label: "Google / 微博 / 小红书" },
  { value: "friends", label: "Ask friends / 问朋友" },
  { value: "none", label: "Don't check, just feel / 凭感觉" },
];

const Q5_JP: Single[] = [
  { value: "often", label: "Yes, often / 经常" },
  { value: "sometimes", label: "Yes, sometimes / 偶尔" },
  { value: "never", label: "Never / 从来没买过" },
  { value: "interested", label: "Want to but don't know how / 想买但不知道怎么入手" },
];

const Q6_MAINLAND: Single[] = [
  { value: "yes", label: "Yes, bought before / 买过" },
  { value: "interested", label: "Interested but haven't / 想买" },
  { value: "no", label: "No, not interested / 没兴趣" },
  { value: "unknown", label: "What's that? / 不知道这是什么" },
];

const Q7_PAY: Single[] = [
  { value: "under_30", label: "Yes, under RM 30 / month" },
  { value: "30_99", label: "Yes, RM 30 – 99 / month" },
  { value: "100_plus", label: "Yes, RM 100+ / month" },
  { value: "free_only", label: "Free only / 只用免费的" },
];

const Q8_LANG: Single[] = [
  { value: "english", label: "English only" },
  { value: "chinese", label: "中文 only" },
  { value: "both", label: "Both / 两种都要" },
];

const Q9_PAIN: Single[] = [
  { value: "fair_price", label: "Don't know if price is fair / 不知道价钱公不公道" },
  { value: "fakes", label: "Worried about fakes / 担心买到假卡" },
  { value: "variants", label: "Variants confuse me / 不认识 variant" },
  { value: "jp_prices", label: "Can't find JP card prices / 找不到日文卡的价钱" },
  { value: "future_value", label: "Don't know which cards will appreciate / 不懂哪张会涨" },
  { value: "language", label: "Sellers don't speak my language / 卖家不会讲英文或中文" },
  { value: "dishonest", label: "Sellers not honest / 卖家不老实" },
  { value: "no_issue", label: "No issue, I go with feel / 我都靠感觉, 没问题" },
  { value: "other", label: "Other (type below) / 其他" },
];

const Q10_UPDATES: Single[] = [
  { value: "yes", label: "Yes please / 想要" },
  { value: "maybe", label: "Maybe later / 看情况" },
  { value: "no", label: "No thanks / 不用" },
];

type FormState = {
  age: string;
  collectorType: string;
  monthlySpend: string;
  apps: string[];
  jpCards: string;
  mainlandSellers: string;
  payWillingness: string;
  languagePref: string;
  painPoints: string[];
  painOther: string;
  wantsUpdates: string;
};

function emptyForm(): FormState {
  return {
    age: "",
    collectorType: "",
    monthlySpend: "",
    apps: [],
    jpCards: "",
    mainlandSellers: "",
    payWillingness: "",
    languagePref: "",
    painPoints: [],
    painOther: "",
    wantsUpdates: "",
  };
}

export default function CardManiaForm() {
  const [form, setForm] = useState<FormState>(emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function toggleMulti(field: "apps" | "painPoints", value: string) {
    setForm((prev) => {
      const list = prev[field];
      if (list.includes(value)) {
        return { ...prev, [field]: list.filter((v) => v !== value) };
      }
      return { ...prev, [field]: [...list, value] };
    });
  }

  function setSingle<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.wantsUpdates) {
      setError("请回答最后一题 / Please answer the last question.");
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/cardmania", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Could not submit. Please try again.");
      }
      router.push(`/cardmania/thanks?u=${encodeURIComponent(form.wantsUpdates)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

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

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-brand-gold/15">
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse at 25% 0%, rgba(200,161,90,0.14), transparent 55%), radial-gradient(ellipse at 80% 100%, rgba(183,50,36,0.10), transparent 50%)",
          }}
        />
        {/* Decorative compass mark — top right */}
        <div aria-hidden className="brand-compass-mark" style={{ top: "-90px", right: "-90px" }} />
        {/* Decorative compass mark — bottom left */}
        <div aria-hidden className="brand-compass-mark" style={{ bottom: "-110px", left: "-110px", width: "320px", height: "320px" }} />

        <div className="relative mx-auto grid max-w-brand-content gap-10 px-5 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1fr_auto] lg:gap-16">
          {/* Left — main content */}
          <div className="relative z-10">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-brand-gold/45 bg-brand-gold/10 px-4 py-2">
              <span className="font-brand-label text-[11px] font-semibold tracking-[0.34em] uppercase text-brand-gold">
                30-Sec Collector Survey
              </span>
            </div>
            <h1 className="font-brand-editorial text-4xl font-black leading-[1.15] tracking-[0.04em] text-brand-cream sm:text-5xl md:text-6xl">
              你怎么挑卡 ·<br className="sm:hidden" /> 我们怎么挑工具。
            </h1>
            <p className="mt-5 font-brand-label text-xs font-semibold tracking-[0.24em] uppercase text-brand-gold">
              How you buy · How we build
            </p>
            <p className="mt-7 max-w-2xl text-lg font-medium leading-relaxed text-brand-cream/90">
              我们在做一个工具帮 Pokemon 卡友判断这张卡值不值得买。
              借30秒, 让你的反馈塑造我们做什么。
            </p>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-brand-cream/75">
              Building a tool that helps Pokemon TCG collectors decide if a card
              is worth buying. 30 seconds of your feedback shapes what we build.
            </p>
          </div>

          {/* Right — brand quote panel (decorative) */}
          <aside className="relative hidden lg:flex">
            <div className="brand-rule-vertical mr-8 self-stretch" />
            <div className="flex flex-col justify-center">
              <p className="font-brand-en text-[10px] font-bold tracking-[0.34em] uppercase text-brand-gold/90">
                ─ Editorial ─
              </p>
              <div className="mt-5 space-y-1.5 font-brand-en text-sm font-semibold tracking-[0.18em] uppercase text-brand-cream/95">
                <p>The market moves.</p>
                <p>The ledger remains.</p>
                <p>Every card has a reason.</p>
              </div>
              <p className="mt-4 font-brand-en text-xs tracking-[0.15em] text-brand-gold/80">— Chou</p>
            </div>
          </aside>
        </div>
      </section>

      {/* Form */}
      <form onSubmit={handleSubmit} className="brand-ledger-lines relative mx-auto max-w-brand-content px-5 py-12 sm:px-6 sm:py-16">
        <div className="relative z-10">
        <Question number={1} en="Your age range" zh="你的年龄段" required>
          <SingleGrid options={Q1_AGE} selected={form.age} onSelect={(v) => setSingle("age", v)} cols={2} />
        </Question>

        <Question number={2} en="What kind of collector are you?" zh="你是哪种收藏家?" required>
          <SingleGrid options={Q2_TYPE} selected={form.collectorType} onSelect={(v) => setSingle("collectorType", v)} cols={1} />
        </Question>

        <Question number={3} en="Monthly spend on PTCG" zh="每月花多少钱在 PTCG?" required>
          <SingleGrid options={Q3_SPEND} selected={form.monthlySpend} onSelect={(v) => setSingle("monthlySpend", v)} cols={1} />
        </Question>

        <Question number={4} en="How do you check Pokemon card prices? (Pick all that apply)" zh="你怎么查卡的价钱? (可多选)">
          <MultiGrid options={Q4_APPS} selected={form.apps} onToggle={(v) => toggleMulti("apps", v)} cols={2} />
        </Question>

        <Question number={5} en="Do you buy Japanese cards?" zh="你买日文卡吗?">
          <SingleGrid options={Q5_JP} selected={form.jpCards} onSelect={(v) => setSingle("jpCards", v)} cols={1} />
        </Question>

        <Question number={6} en="Have you bought from mainland Chinese sellers (闲鱼 / 集换社)?" zh="你从大陆卖家买过卡吗?">
          <SingleGrid options={Q6_MAINLAND} selected={form.mainlandSellers} onSelect={(v) => setSingle("mainlandSellers", v)} cols={1} />
        </Question>

        <Question number={7} en="Would you pay monthly for a tool that tells you if a card is worth buying?" zh="如果有工具直接告诉你这张卡值不值得买, 你愿意付费吗?">
          <SingleGrid options={Q7_PAY} selected={form.payWillingness} onSelect={(v) => setSingle("payWillingness", v)} cols={1} />
        </Question>

        <Question number={8} en="What language do you prefer for tools?" zh="你希望工具用什么语言?">
          <SingleGrid options={Q8_LANG} selected={form.languagePref} onSelect={(v) => setSingle("languagePref", v)} cols={3} />
        </Question>

        <Question number={9} en="Biggest pain when buying cards? (Pick up to 3)" zh="买卡最头疼的是什么? (最多选3个)">
          <MultiGrid options={Q9_PAIN} selected={form.painPoints} onToggle={(v) => toggleMulti("painPoints", v)} cols={1} maxSelect={3} />
          {form.painPoints.includes("other") && (
            <input
              type="text"
              value={form.painOther}
              onChange={(e) => setSingle("painOther", e.target.value)}
              placeholder="告诉我们 / Tell us..."
              className="mt-4 w-full rounded-sm border border-brand-gold/35 bg-brand-panel px-4 py-3.5 text-base text-brand-cream placeholder:text-brand-cream/45 focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold"
              maxLength={200}
            />
          )}
        </Question>

        <Question number={10} en="Want updates when Curator OS launches?" zh="想收到 Curator OS 发布更新吗?" required>
          <SingleGrid options={Q10_UPDATES} selected={form.wantsUpdates} onSelect={(v) => setSingle("wantsUpdates", v)} cols={3} />
        </Question>

        {error && (
          <div className="mt-8 border-l-4 border-brand-red-bright bg-brand-panel-warm px-5 py-4 text-base text-brand-red-bright">
            {error}
          </div>
        )}

        <div className="mt-14 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={submitting}
            className="relative w-full overflow-hidden rounded-sm px-8 py-4 font-brand-sans text-lg font-black tracking-wide text-brand-bg transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            style={{
              background:
                "linear-gradient(180deg, #E2C58E, #C8A15A 50%, #8B6E3C)",
              boxShadow:
                "0 4px 22px rgba(200,161,90,0.4), 0 0 0 1px rgba(245,235,210,0.2) inset",
            }}
          >
            {submitting ? "提交中... / Submitting..." : "提交 / Submit"}
          </button>
          <p className="font-brand-label text-[11px] font-semibold tracking-[0.22em] uppercase text-brand-cream/65">
            谢谢你的时间 · Thank you for your time
          </p>
        </div>
        </div>
      </form>

      {/* Footer */}
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

function Question({
  number,
  en,
  zh,
  required,
  children,
}: {
  number: number;
  en: string;
  zh: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="mb-14 border-t border-brand-gold/20 pt-10 first:border-t-0 first:pt-0">
      <legend className="mb-6 flex items-baseline gap-4">
        <span className="font-brand-label text-[11px] font-bold tracking-[0.22em] uppercase text-brand-gold">
          Q{String(number).padStart(2, "0")}
        </span>
        {required && (
          <span className="font-brand-label text-[10px] font-bold tracking-[0.22em] uppercase text-brand-red-bright">
            必答 · Required
          </span>
        )}
      </legend>
      <div className="mb-7">
        <p className="font-brand-sans text-xl font-bold leading-snug tracking-wide text-brand-cream sm:text-2xl">
          {zh}
        </p>
        <p className="mt-2 text-base font-normal leading-relaxed text-brand-cream/75">
          {en}
        </p>
      </div>
      {children}
    </fieldset>
  );
}

function SingleGrid({
  options,
  selected,
  onSelect,
  cols,
}: {
  options: Single[];
  selected: string;
  onSelect: (v: string) => void;
  cols: 1 | 2 | 3;
}) {
  const grid =
    cols === 1
      ? "grid-cols-1"
      : cols === 2
      ? "grid-cols-2"
      : "grid-cols-1 sm:grid-cols-3";
  return (
    <div className={`grid gap-3 ${grid}`}>
      {options.map((opt) => {
        const isOn = selected === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            className={`min-h-[60px] w-full rounded-sm border px-5 py-4 text-left text-base font-medium transition-all ${
              isOn
                ? "border-brand-gold bg-brand-gold/20 text-brand-cream shadow-[0_0_0_1px_rgba(200,161,90,0.4)]"
                : "border-brand-gold/25 bg-brand-panel text-brand-cream/95 hover:border-brand-gold/65 hover:bg-brand-panel-warm hover:text-brand-cream"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function MultiGrid({
  options,
  selected,
  onToggle,
  cols,
  maxSelect,
}: {
  options: Single[];
  selected: string[];
  onToggle: (v: string) => void;
  cols: 1 | 2 | 3;
  maxSelect?: number;
}) {
  const grid =
    cols === 1
      ? "grid-cols-1"
      : cols === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : "grid-cols-1 sm:grid-cols-3";
  return (
    <div className={`grid gap-3 ${grid}`}>
      {options.map((opt) => {
        const isOn = selected.includes(opt.value);
        const atLimit = !isOn && maxSelect !== undefined && selected.length >= maxSelect;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => {
              if (atLimit) return;
              onToggle(opt.value);
            }}
            disabled={atLimit}
            className={`min-h-[60px] w-full rounded-sm border px-5 py-4 text-left text-base font-medium transition-all ${
              isOn
                ? "border-brand-gold bg-brand-gold/20 text-brand-cream shadow-[0_0_0_1px_rgba(200,161,90,0.4)]"
                : atLimit
                ? "cursor-not-allowed border-brand-gold/10 bg-brand-panel/50 text-brand-cream/30"
                : "border-brand-gold/25 bg-brand-panel text-brand-cream/95 hover:border-brand-gold/65 hover:bg-brand-panel-warm hover:text-brand-cream"
            }`}
          >
            <span className="flex items-center gap-3">
              <span
                className={`inline-block h-3.5 w-3.5 border-2 ${
                  isOn ? "border-brand-gold bg-brand-gold/30" : "border-brand-gold/50"
                }`}
                aria-hidden
              >
                {isOn && <span className="block h-full w-full bg-brand-red-bright" />}
              </span>
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
