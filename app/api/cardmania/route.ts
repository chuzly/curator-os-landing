import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const runtime = "nodejs";

type Payload = {
  age: string;
  collectorType: string;
  monthlySpend: string;
  apps: string[];
  jpCards: string;
  mainlandSellers: string;
  paidServices: string[];
  languagePref: string;
  painPoints: string[];
  painOther: string;
  wantsUpdates: string;
};

function isValid(payload: unknown): payload is Payload {
  if (!payload || typeof payload !== "object") return false;
  const p = payload as Record<string, unknown>;
  const stringFields = [
    "age",
    "collectorType",
    "monthlySpend",
    "jpCards",
    "mainlandSellers",
    "languagePref",
    "painOther",
    "wantsUpdates",
  ];
  for (const f of stringFields) {
    if (typeof p[f] !== "string") return false;
  }
  if (!Array.isArray(p.apps) || !p.apps.every((x) => typeof x === "string")) return false;
  if (!Array.isArray(p.painPoints) || !p.painPoints.every((x) => typeof x === "string")) return false;
  if (!Array.isArray(p.paidServices) || !p.paidServices.every((x) => typeof x === "string")) return false;
  if (p.paidServices.length === 0) return false; // Q7 is required, must have at least 1 selection
  if (typeof p.wantsUpdates !== "string" || p.wantsUpdates.length === 0) return false;
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

function buildBody(p: Payload) {
  const rows: [string, string][] = [
    ["Age", p.age || "—"],
    ["Type", p.collectorType || "—"],
    ["Monthly spend", p.monthlySpend || "—"],
    ["Apps used", p.apps.length ? p.apps.join(", ") : "—"],
    ["JP cards", p.jpCards || "—"],
    ["Mainland CN sellers", p.mainlandSellers || "—"],
    ["Paid services (last 6mo)", p.paidServices.length ? p.paidServices.join(", ") : "—"],
    ["Language pref", p.languagePref || "—"],
    ["Pain points", p.painPoints.length ? p.painPoints.join(", ") : "—"],
    ["Pain (other)", p.painOther || "—"],
    ["Wants updates", p.wantsUpdates || "—"],
  ];
  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n");
  const html = `<table style="border-collapse:collapse;font-family:Inter,system-ui,sans-serif;font-size:13px;color:#1F2A44">${rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 14px 6px 0;color:#5C6A89;text-transform:uppercase;letter-spacing:0.06em;font-size:11px;vertical-align:top">${escapeHtml(k)}</td><td style="padding:6px 0">${escapeHtml(v)}</td></tr>`,
    )
    .join("")}</table>`;
  return { text, html };
}

export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (!isValid(payload)) {
    return NextResponse.json(
      { error: "Please answer the required questions." },
      { status: 400 },
    );
  }

  // Supabase write — primary storage path
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[cardmania] missing SUPABASE_URL or SERVICE_ROLE_KEY env vars.");
    return NextResponse.json(
      { error: "Storage temporarily unavailable. Please try again shortly." },
      { status: 500 },
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const userAgent = req.headers.get("user-agent") ?? null;

  const { error: dbError } = await supabase.from("cardmania_submissions").insert({
    age_range: payload.age || null,
    collector_type: payload.collectorType || null,
    monthly_spend: payload.monthlySpend || null,
    apps_used: payload.apps,
    jp_cards: payload.jpCards || null,
    mainland_sellers: payload.mainlandSellers || null,
    pay_willingness: payload.paidServices,
    language_pref: payload.languagePref || null,
    pain_points: payload.painPoints,
    pain_other: payload.painOther || null,
    wants_updates: payload.wantsUpdates,
    user_agent: userAgent,
  });

  if (dbError) {
    console.error("[cardmania] supabase insert error:", dbError);
    return NextResponse.json(
      { error: "Could not save your response. Please try again." },
      { status: 502 },
    );
  }

  // Resend notification — secondary, non-blocking. If Resend fails, we still return success
  // because the data is safely in Supabase.
  const apiKey = process.env.RESEND_API_KEY;
  const notifyEmail = process.env.NOTIFY_EMAIL;
  const fromEmail = process.env.FROM_EMAIL ?? "Curator OS <onboarding@resend.dev>";

  if (apiKey && notifyEmail) {
    try {
      const resend = new Resend(apiKey);
      const { text, html } = buildBody(payload);
      await resend.emails.send({
        from: fromEmail,
        to: [notifyEmail],
        subject: `New Card Mania submission — ${payload.collectorType || "unknown"}`,
        text,
        html,
      });
    } catch (err) {
      console.error("[cardmania] resend notification failed (non-blocking):", err);
    }
  }

  return NextResponse.json({ ok: true });
}
