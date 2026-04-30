"use client";

import { useState, FormEvent } from "react";

type Status = "idle" | "submitting" | "success" | "error";

export default function Hero() {
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
        body: JSON.stringify({ type: "hero", email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Could not join the waitlist.");
      }
      setStatus("success");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  function scrollToSegment(segment: "collector" | "vendor") {
    const el = document.getElementById("waitlist");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    // Allow SegmentForms to react via custom event
    window.dispatchEvent(
      new CustomEvent("curator:set-segment", { detail: segment }),
    );
  }

  return (
    <section className="border-b border-rule bg-white">
      <div className="container-tight pb-20 pt-16 sm:pb-28 sm:pt-24">
        <div className="mb-10 flex items-center gap-3">
          <div className="h-2.5 w-2.5 bg-accent" aria-hidden />
          <span className="font-mono text-xs uppercase tracking-[0.18em] text-navy-400">
            Curator OS
          </span>
        </div>

        <h1 className="max-w-4xl text-balance text-4xl font-semibold leading-[1.08] tracking-tightish text-navy sm:text-5xl md:text-6xl">
          Market intelligence for serious Pokemon TCG collectors.
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-relaxed text-navy-400 sm:text-lg">
          A curator-led platform built for collectors and vendors operating
          across Malaysia, Singapore, Japan, Hong Kong, and Taiwan. Sold-comp
          data, capital discipline, and verdicts that adapt to your thesis.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-10 flex w-full max-w-xl flex-col gap-3 sm:flex-row"
          noValidate
        >
          <label htmlFor="hero-email" className="sr-only">
            Email address
          </label>
          <input
            id="hero-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@domain.com"
            disabled={status === "submitting"}
            className="input-base flex-1"
          />
          <button
            type="submit"
            disabled={status === "submitting"}
            className="btn-primary"
          >
            {status === "submitting" ? "Joining..." : "Join waitlist"}
          </button>
        </form>

        <div className="mt-3 min-h-[1.25rem] text-xs">
          {status === "success" && (
            <span className="text-navy-500">
              You&apos;re on the list. We&apos;ll be in touch.
            </span>
          )}
          {status === "error" && (
            <span className="text-accent">
              {errorMsg ?? "Something went wrong."}
            </span>
          )}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <span className="eyebrow mr-1">I am a</span>
          <button
            type="button"
            onClick={() => scrollToSegment("collector")}
            className="btn-segment"
          >
            Collector
          </button>
          <button
            type="button"
            onClick={() => scrollToSegment("vendor")}
            className="btn-segment"
          >
            Vendor / shop
          </button>
        </div>
      </div>
    </section>
  );
}
