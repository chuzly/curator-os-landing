"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
      setError("Please answer the last question (want updates?).");
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
        <div className="container-tight py-12 sm:py-16">
          <h1 className="max-w-3xl text-balance text-3xl font-semibold leading-tight tracking-tightish text-navy sm:text-4xl">
            60-second collector survey.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-navy-400">
            We&apos;re building a market intelligence tool for serious Pokemon TCG collectors across Asia-Pacific. Help us understand what matters.
            <br />
            <span className="text-navy-500">我们在做 Pokemon TCG 收藏家的市场情报工具, 帮个忙, 30秒就好。</span>
          </p>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="container-tight py-10 sm:py-14">
        <Question
          number={1}
          en="Your age range"
          zh="你的年龄段"
          required
        >
          <SingleGrid options={Q1_AGE} selected={form.age} onSelect={(v) => setSingle("age", v)} cols={2} />
        </Question>

        <Question
          number={2}
          en="What kind of collector are you?"
          zh="你是哪种收藏家?"
          required
        >
          <SingleGrid options={Q2_TYPE} selected={form.collectorType} onSelect={(v) => setSingle("collectorType", v)} cols={1} />
        </Question>

        <Question
          number={3}
          en="Monthly spend on PTCG"
          zh="每月花多少钱在 PTCG?"
          required
        >
          <SingleGrid options={Q3_SPEND} selected={form.monthlySpend} onSelect={(v) => setSingle("monthlySpend", v)} cols={1} />
        </Question>

        <Question
          number={4}
          en="How do you check Pokemon card prices? (Pick all that apply)"
          zh="你怎么查卡的价钱? (可多选)"
        >
          <MultiGrid options={Q4_APPS} selected={form.apps} onToggle={(v) => toggleMulti("apps", v)} cols={2} />
        </Question>

        <Question
          number={5}
          en="Do you buy Japanese cards?"
          zh="你买日文卡吗?"
        >
          <SingleGrid options={Q5_JP} selected={form.jpCards} onSelect={(v) => setSingle("jpCards", v)} cols={1} />
        </Question>

        <Question
          number={6}
          en="Have you bought from mainland Chinese sellers (闲鱼 / 集换社)?"
          zh="你从大陆卖家买过卡吗?"
        >
          <SingleGrid options={Q6_MAINLAND} selected={form.mainlandSellers} onSelect={(v) => setSingle("mainlandSellers", v)} cols={1} />
        </Question>

        <Question
          number={7}
          en="Would you pay monthly for a tool that gives a BUY / WALK verdict on cards?"
          zh="如果有工具直接告诉你这张卡值不值买, 你愿意付费吗?"
        >
          <SingleGrid options={Q7_PAY} selected={form.payWillingness} onSelect={(v) => setSingle("payWillingness", v)} cols={1} />
        </Question>

        <Question
          number={8}
          en="What language do you prefer for tools?"
          zh="你希望工具用什么语言?"
        >
          <SingleGrid options={Q8_LANG} selected={form.languagePref} onSelect={(v) => setSingle("languagePref", v)} cols={3} />
        </Question>

        <Question
          number={9}
          en="Biggest pain when buying cards? (Pick up to 3)"
          zh="买卡最头疼的是什么? (最多选3个)"
        >
          <MultiGrid options={Q9_PAIN} selected={form.painPoints} onToggle={(v) => toggleMulti("painPoints", v)} cols={1} maxSelect={3} />
          {form.painPoints.includes("other") && (
            <input
              type="text"
              value={form.painOther}
              onChange={(e) => setSingle("painOther", e.target.value)}
              placeholder="Tell us / 告诉我们..."
              className="input-base mt-4"
              maxLength={200}
            />
          )}
        </Question>

        <Question
          number={10}
          en="Want updates when Curator OS launches?"
          zh="想收到 Curator OS 发布更新吗?"
          required
        >
          <SingleGrid options={Q10_UPDATES} selected={form.wantsUpdates} onSelect={(v) => setSingle("wantsUpdates", v)} cols={3} />
        </Question>

        {error && (
          <div className="mt-8 border-l-4 border-accent bg-white px-4 py-3 text-sm text-accent">
            {error}
          </div>
        )}

        <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full sm:w-auto"
          >
            {submitting ? "Submitting..." : "Submit / 提交"}
          </button>
          <p className="text-xs text-navy-400">
            Your responses help shape Curator OS. Thank you. / 谢谢你的时间。
          </p>
        </div>
      </form>

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
    <fieldset className="mb-10 border-t border-rule pt-8 first:border-t-0 first:pt-0">
      <legend className="mb-4 flex items-baseline gap-3">
        <span className="font-mono text-xs uppercase tracking-[0.18em] text-navy-400">
          Q{String(number).padStart(2, "0")}
        </span>
        {required && (
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
            Required
          </span>
        )}
      </legend>
      <div className="mb-5">
        <p className="text-lg font-medium text-navy">{en}</p>
        <p className="text-sm text-navy-400">{zh}</p>
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
    <div className={`grid gap-2 ${grid}`}>
      {options.map((opt) => {
        const isOn = selected === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            className={`min-h-[52px] w-full rounded-none border px-4 py-3 text-left text-sm transition-colors ${
              isOn
                ? "border-navy bg-navy text-white"
                : "border-navy-200 bg-white text-navy hover:border-navy"
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
    <div className={`grid gap-2 ${grid}`}>
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
            className={`min-h-[52px] w-full rounded-none border px-4 py-3 text-left text-sm transition-colors ${
              isOn
                ? "border-navy bg-navy text-white"
                : atLimit
                ? "border-navy-100 bg-navy-50 text-navy-300 cursor-not-allowed"
                : "border-navy-200 bg-white text-navy hover:border-navy"
            }`}
          >
            <span className="flex items-center gap-2">
              <span
                className={`inline-block h-3 w-3 border ${
                  isOn ? "border-white bg-white" : "border-navy-300"
                }`}
                aria-hidden
              >
                {isOn && (
                  <span className="block h-full w-full bg-accent" />
                )}
              </span>
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
