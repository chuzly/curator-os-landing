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
      <div className="border-l-4 border-navy bg-white px-4 py-3 text-sm text-navy">
        You&apos;re on the list. 已加入名单, 之后再联系你。
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
        className="input-base flex-1"
      />
      <button
        type="submit"
        disabled={status === "submitting"}
        className="btn-primary"
      >
        {status === "submitting" ? "Saving..." : "Notify me / 通知我"}
      </button>
      {status === "error" && (
        <p className="w-full text-xs text-accent sm:w-auto">{errorMsg}</p>
      )}
    </form>
  );
}
