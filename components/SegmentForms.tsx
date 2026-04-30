"use client";

import { useEffect, useState, FormEvent } from "react";
import FormFeedback from "@/components/FormFeedback";

type Segment = "collector" | "vendor";
type Status = "idle" | "submitting" | "success" | "error";

const collectorFocusOptions = [
  { value: "english", label: "English" },
  { value: "japanese", label: "Japanese" },
  { value: "both", label: "Both" },
];

const collectorBudgetOptions = [
  { value: "<1k", label: "Under RM 1,000" },
  { value: "1-5k", label: "RM 1,000 – 5,000" },
  { value: "5-15k", label: "RM 5,000 – 15,000" },
  { value: "15-50k", label: "RM 15,000 – 50,000" },
  { value: "50k+", label: "Over RM 50,000" },
];

const vendorTurnoverOptions = [
  { value: "<10k", label: "Under RM 10,000" },
  { value: "10-50k", label: "RM 10,000 – 50,000" },
  { value: "50-200k", label: "RM 50,000 – 200,000" },
  { value: "200k+", label: "Over RM 200,000" },
];

export default function SegmentForms() {
  const [segment, setSegment] = useState<Segment>("collector");

  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent<Segment>).detail;
      if (detail === "collector" || detail === "vendor") {
        setSegment(detail);
      }
    }
    window.addEventListener("curator:set-segment", handler as EventListener);
    return () =>
      window.removeEventListener("curator:set-segment", handler as EventListener);
  }, []);

  return (
    <section id="waitlist" className="border-b border-rule bg-surface">
      <div className="container-tight py-20 sm:py-24">
        <div className="mb-10 max-w-2xl">
          <p className="eyebrow mb-3">Join the waitlist</p>
          <h2 className="text-3xl font-semibold tracking-tightish text-navy sm:text-4xl">
            Tell us how you operate.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-navy-400">
            We onboard collectors and vendors separately. The questions are
            short and the answers shape what we build first.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Choose your role"
          className="mb-8 inline-flex flex-wrap gap-2"
        >
          <button
            role="tab"
            aria-selected={segment === "collector"}
            onClick={() => setSegment("collector")}
            className={`btn-segment ${segment === "collector" ? "btn-segment-active" : ""}`}
          >
            Collector
          </button>
          <button
            role="tab"
            aria-selected={segment === "vendor"}
            onClick={() => setSegment("vendor")}
            className={`btn-segment ${segment === "vendor" ? "btn-segment-active" : ""}`}
          >
            Vendor / shop
          </button>
        </div>

        {segment === "collector" ? <CollectorForm /> : <VendorForm />}
      </div>
    </section>
  );
}

function SuccessPanel({ text }: { text: string }) {
  return (
    <div className="border border-rule bg-white p-6 sm:p-8">
      <FormFeedback status="success" errorMsg={null} successText={text} />
    </div>
  );
}

function CollectorForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function clearErrorOnInput() {
    if (status === "error") {
      setStatus("idle");
      setErrorMsg(null);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      type: "collector",
      email: String(fd.get("email") ?? ""),
      focus: String(fd.get("focus") ?? ""),
      budget: String(fd.get("budget") ?? ""),
      painPoint: String(fd.get("painPoint") ?? ""),
    };
    setStatus("submitting");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Could not submit.");
      }
      setErrorMsg(null);
      setStatus("success");
      form?.reset();
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (status === "success") {
    return <SuccessPanel text="Received. We'll reach out as we open access." />;
  }

  return (
    <form
      onSubmit={handleSubmit}
      onInput={clearErrorOnInput}
      onChange={clearErrorOnInput}
      className="grid grid-cols-1 gap-5 border border-rule bg-white p-6 sm:p-8 md:grid-cols-2"
      noValidate
    >
      <div className="md:col-span-2">
        <label htmlFor="c-email" className="label-base">
          Email address
        </label>
        <input
          id="c-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          required
          className="input-base"
          placeholder="you@domain.com"
        />
      </div>

      <div>
        <label htmlFor="c-focus" className="label-base">
          Primary card focus
        </label>
        <select
          id="c-focus"
          name="focus"
          required
          defaultValue=""
          className="input-base bg-white"
        >
          <option value="" disabled>
            Select focus
          </option>
          {collectorFocusOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="c-budget" className="label-base">
          Monthly card budget
        </label>
        <select
          id="c-budget"
          name="budget"
          required
          defaultValue=""
          className="input-base bg-white"
        >
          <option value="" disabled>
            Select range
          </option>
          {collectorBudgetOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="md:col-span-2">
        <label htmlFor="c-pain" className="label-base">
          Biggest pain point
        </label>
        <textarea
          id="c-pain"
          name="painPoint"
          required
          rows={3}
          className="input-base resize-none"
          placeholder="What slows you down today?"
        />
      </div>

      <div className="md:col-span-2 space-y-4">
        {status === "error" && (
          <FormFeedback status="error" errorMsg={errorMsg} successText="" />
        )}
        <button
          type="submit"
          disabled={status === "submitting"}
          className="btn-primary w-full sm:w-auto"
        >
          {status === "submitting" ? "Submitting..." : "Join as collector"}
        </button>
      </div>
    </form>
  );
}

function VendorForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function clearErrorOnInput() {
    if (status === "error") {
      setStatus("idle");
      setErrorMsg(null);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      type: "vendor",
      email: String(fd.get("email") ?? ""),
      businessName: String(fd.get("businessName") ?? ""),
      city: String(fd.get("city") ?? ""),
      turnover: String(fd.get("turnover") ?? ""),
      painPoint: String(fd.get("painPoint") ?? ""),
    };
    setStatus("submitting");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Could not submit.");
      }
      setErrorMsg(null);
      setStatus("success");
      form?.reset();
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (status === "success") {
    return <SuccessPanel text="Received. We'll reach out as we open access." />;
  }

  return (
    <form
      onSubmit={handleSubmit}
      onInput={clearErrorOnInput}
      onChange={clearErrorOnInput}
      className="grid grid-cols-1 gap-5 border border-rule bg-white p-6 sm:p-8 md:grid-cols-2"
      noValidate
    >
      <div className="md:col-span-2">
        <label htmlFor="v-email" className="label-base">
          Email address
        </label>
        <input
          id="v-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          required
          className="input-base"
          placeholder="you@business.com"
        />
      </div>

      <div>
        <label htmlFor="v-business" className="label-base">
          Business name
        </label>
        <input
          id="v-business"
          name="businessName"
          type="text"
          autoComplete="organization"
          required
          className="input-base"
          placeholder="Registered or trading name"
        />
      </div>

      <div>
        <label htmlFor="v-city" className="label-base">
          Location (city)
        </label>
        <input
          id="v-city"
          name="city"
          type="text"
          autoComplete="address-level2"
          required
          className="input-base"
          placeholder="e.g. Kuala Lumpur, Singapore, Tokyo"
        />
      </div>

      <div className="md:col-span-2">
        <label htmlFor="v-turnover" className="label-base">
          Monthly inventory turnover (RM)
        </label>
        <select
          id="v-turnover"
          name="turnover"
          required
          defaultValue=""
          className="input-base bg-white"
        >
          <option value="" disabled>
            Select range
          </option>
          {vendorTurnoverOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="md:col-span-2">
        <label htmlFor="v-pain" className="label-base">
          Biggest operational pain point
        </label>
        <textarea
          id="v-pain"
          name="painPoint"
          required
          rows={3}
          className="input-base resize-none"
          placeholder="Pricing, sourcing, capital, staff, comps?"
        />
      </div>

      <div className="md:col-span-2 space-y-4">
        {status === "error" && (
          <FormFeedback status="error" errorMsg={errorMsg} successText="" />
        )}
        <button
          type="submit"
          disabled={status === "submitting"}
          className="btn-primary w-full sm:w-auto"
        >
          {status === "submitting" ? "Submitting..." : "Join as vendor"}
        </button>
      </div>
    </form>
  );
}
