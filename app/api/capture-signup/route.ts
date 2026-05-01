import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

type Customer = {
  name: string;
  instagramHandle?: string;
  email: string;
  whatsapp?: string;
  userType: "Collector" | "Vendor";
};

type Card = {
  cardName: string;
  set?: string;
  cardNumber?: string;
  variant?: string;
  language?: string;
  condition: string;
};

type Pricing = {
  askingPrice: number;
  soldMedian: number;
  rangeLow: number;
  rangeHigh: number;
  n?: number;
};

type Verdict = {
  tier: "STEAL" | "BUY" | "NEGOTIATE" | "WALK" | string;
  profile: "Collector" | "Flipper" | "Investor" | string;
};

type Metadata = {
  reprintRisk?: string;
  trend?: string;
  operatorNote?: string;
  geo_origin?: string;
  user_location?: string;
  timestamp_utc?: string;
  timestamp_local?: string;
  currency?: string;
};

type Payload = {
  customer: Customer;
  card: Card;
  pricing: Pricing;
  verdict: Verdict;
  metadata?: Metadata;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValid(p: unknown): p is Payload {
  if (!p || typeof p !== "object") return false;
  const r = p as Record<string, unknown>;
  if (!r.customer || typeof r.customer !== "object") return false;
  if (!r.card || typeof r.card !== "object") return false;
  if (!r.pricing || typeof r.pricing !== "object") return false;
  if (!r.verdict || typeof r.verdict !== "object") return false;

  const c = r.customer as Record<string, unknown>;
  if (typeof c.name !== "string" || c.name.trim().length === 0) return false;
  if (typeof c.email !== "string" || !EMAIL_RE.test(c.email)) return false;
  if (c.userType !== "Collector" && c.userType !== "Vendor") return false;

  const card = r.card as Record<string, unknown>;
  if (typeof card.cardName !== "string" || card.cardName.trim().length === 0) return false;
  if (typeof card.condition !== "string" || card.condition.trim().length === 0) return false;

  const pr = r.pricing as Record<string, unknown>;
  if (typeof pr.askingPrice !== "number") return false;

  const v = r.verdict as Record<string, unknown>;
  if (typeof v.tier !== "string" || typeof v.profile !== "string") return false;

  return true;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function fmtRM(n: number | undefined | null) {
  if (n === undefined || n === null || isNaN(n)) return "—";
  return "RM " + Number(n).toLocaleString("en-MY", { maximumFractionDigits: 0 });
}

function buildBody(p: Payload, signupNumber: number) {
  const rows: [string, string][] = [
    ["Signup #", String(signupNumber)],
    ["Customer", `${p.customer.name} (${p.customer.userType})`],
    ["Email", p.customer.email],
    ["Instagram", p.customer.instagramHandle ?? "—"],
    ["WhatsApp", p.customer.whatsapp ?? "—"],
    [
      "Card",
      [p.card.cardName, p.card.set, p.card.cardNumber, p.card.variant, p.card.language]
        .filter(Boolean)
        .join(" · "),
    ],
    ["Condition", p.card.condition],
    ["Asking", fmtRM(p.pricing.askingPrice)],
    [
      "Comps",
      `median ${fmtRM(p.pricing.soldMedian)} (range ${fmtRM(p.pricing.rangeLow)}–${fmtRM(p.pricing.rangeHigh)}${p.pricing.n ? `, n=${p.pricing.n}` : ""})`,
    ],
    ["Verdict", `${p.verdict.tier} · profile ${p.verdict.profile}`],
    ["Reprint risk", p.metadata?.reprintRisk ?? "—"],
    ["Trend", p.metadata?.trend ?? "—"],
    ["Operator note", p.metadata?.operatorNote ?? "—"],
    ["Geo origin", p.metadata?.geo_origin ?? "—"],
    ["User location", p.metadata?.user_location ?? "—"],
    ["Timestamp (UTC)", p.metadata?.timestamp_utc ?? "—"],
    ["Timestamp (local)", p.metadata?.timestamp_local ?? "—"],
    ["Currency", p.metadata?.currency ?? "MYR"],
  ];
  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n");
  const html = `<table style="border-collapse:collapse;font-family:Inter,system-ui,sans-serif;font-size:13px;color:#1F2A44">${rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 14px 6px 0;color:#5C6A89;text-transform:uppercase;letter-spacing:0.06em;font-size:11px;vertical-align:top;white-space:nowrap">${escapeHtml(k)}</td><td style="padding:6px 0">${escapeHtml(v)}</td></tr>`,
    )
    .join("")}</table>`;
  return { text, html };
}

export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch (err) {
    console.error("[capture-signup] error: invalid JSON body:", err);
    return NextResponse.json({ error: "invalid_json", success: false }, { status: 400 });
  }

  console.log(
    "[capture-signup] starting, payload keys:",
    payload && typeof payload === "object" ? Object.keys(payload) : "(non-object)",
  );

  if (!isValid(payload)) {
    console.error("[capture-signup] error: payload failed isValid() — missing required fields or wrong shape");
    return NextResponse.json(
      { error: "missing_required_fields", success: false },
      { status: 400 },
    );
  }

  console.log("[capture-signup] body validated, signup data:", {
    name: payload.customer.name,
    email: payload.customer.email ? payload.customer.email.slice(0, 3) + "..." : null,
    whatsapp: payload.customer.whatsapp ? payload.customer.whatsapp.slice(0, 3) + "..." : null,
    userType: payload.customer.userType,
    cardName: payload.card.cardName,
    verdict: payload.verdict.tier,
  });

  // Signup number — last 6 digits of Date.now() until Sheets-backed counter is wired.
  // TODO: replace with Google Sheets auto-increment once Sheets API is integrated.
  const signupNumber = Number(String(Date.now()).slice(-6));

  const apiKey = process.env.RESEND_API_KEY;
  const notifyEmail = process.env.NOTIFY_EMAIL;
  const fromEmail = process.env.FROM_EMAIL ?? "Curator OS <onboarding@resend.dev>";

  if (!apiKey || !notifyEmail) {
    console.error("[capture-signup] missing RESEND_API_KEY or NOTIFY_EMAIL.");
    return NextResponse.json(
      { error: "signup_unavailable", success: false },
      { status: 500 },
    );
  }

  const resend = new Resend(apiKey);
  const { text, html } = buildBody(payload, signupNumber);
  const subject = `SEASCC signup #${signupNumber} — ${payload.customer.name} · ${payload.verdict.tier} ${payload.card.cardName}`;

  console.log("[capture-signup] calling Resend with from:", fromEmail, "to:", notifyEmail);

  try {
    const result = await resend.emails.send({
      from: fromEmail,
      to: [notifyEmail],
      replyTo: payload.customer.email,
      subject,
      text,
      html,
    });
    console.log("[capture-signup] Resend response:", result);
    if (result?.error) {
      console.error("[capture-signup] resend error:", result.error);
      return NextResponse.json(
        { error: "signup_send_failed", success: false },
        { status: 502 },
      );
    }
  } catch (err) {
    console.error("[capture-signup] error:", err);
    console.error("[capture-signup] resend threw:", err);
    return NextResponse.json(
      { error: "signup_send_failed", success: false },
      { status: 502 },
    );
  }

  // TODO: Google Sheets append goes here. Auth via service account env vars
  // (GOOGLE_SHEETS_CLIENT_EMAIL / GOOGLE_SHEETS_PRIVATE_KEY / SHEET_ID) and use
  // the Sheets v4 batchUpdate to append a row with the same fields as buildBody().

  console.log("[capture-signup] returning success, signupNumber:", signupNumber);
  return NextResponse.json({ signupNumber, success: true });
}
