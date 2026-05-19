"use client";

import { useState, FormEvent } from "react";

type Status = "idle" | "submitting" | "success" | "error";

export default function EmailCapture() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email) return;
    setStatus("submitting");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "hero", email, source: "cardmania" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Could not save your email.");
      }
      setStatus("success");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (status === "success") {
    return (
      <div className="border-l-2 border-brand-gold bg-brand-panel-warm px-5 py-4 text-sm text-brand-cream">
        ✓ 已加入名单 · You&apos;re on the list. 之后再联系你。
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3 sm:flex-row">
      <input
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        required
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (status === "error") {
            setStatus("idle");
            setErrorMsg(null);
          }
        }}
        placeholder="you@domain.com"
        disabled={status === "submitting"}
        className="flex-1 rounded-sm border border-brand-gold/30 bg-brand-panel px-4 py-3.5 text-sm text-brand-cream placeholder:text-brand-cream/35 focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold"
      />
      <button
        type="submit"
        disabled={status === "submitting"}
        className="group relative rounded-sm px-6 py-3.5 font-brand-sans text-sm font-bold text-brand-bg transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        style={{
          background: "linear-gradient(180deg, #E2C58E, #C8A15A 50%, #8B6E3C)",
          boxShadow:
            "0 4px 22px rgba(200,161,90,0.4), 0 0 0 1px rgba(245,235,210,0.2) inset",
        }}
      >
        {status === "submitting" ? "保存中..." : "通知我 / Notify me"}
      </button>
      {status === "error" && (
        <p className="w-full font-brand-label text-[10px] tracking-[0.18em] uppercase text-brand-red-bright sm:w-auto">
          {errorMsg}
        </p>
      )}
    </form>
  );
}
