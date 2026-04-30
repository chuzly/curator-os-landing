import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

type HeroPayload = { type: "hero"; email: string };
type CollectorPayload = {
  type: "collector";
  email: string;
  focus: string;
  budget: string;
  painPoint: string;
};
type VendorPayload = {
  type: "vendor";
  email: string;
  businessName: string;
  city: string;
  turnover: string;
  painPoint: string;
};
type Payload = HeroPayload | CollectorPayload | VendorPayload;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValid(payload: unknown): payload is Payload {
  if (!payload || typeof payload !== "object") return false;
  const p = payload as Record<string, unknown>;
  if (typeof p.email !== "string" || !EMAIL_RE.test(p.email)) return false;

  if (p.type === "hero") return true;
  if (p.type === "collector") {
    return (
      typeof p.focus === "string" &&
      typeof p.budget === "string" &&
      typeof p.painPoint === "string" &&
      p.painPoint.trim().length > 0
    );
  }
  if (p.type === "vendor") {
    return (
      typeof p.businessName === "string" &&
      p.businessName.trim().length > 0 &&
      typeof p.city === "string" &&
      p.city.trim().length > 0 &&
      typeof p.turnover === "string" &&
      typeof p.painPoint === "string" &&
      p.painPoint.trim().length > 0
    );
  }
  return false;
}

function buildSubject(p: Payload) {
  if (p.type === "hero") return `New waitlist signup — ${p.email}`;
  if (p.type === "collector") return `New collector signup — ${p.email}`;
  return `New vendor signup — ${p.email} (${p.businessName})`;
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
  const rows: [string, string][] = [["Type", p.type], ["Email", p.email]];
  if (p.type === "collector") {
    rows.push(["Focus", p.focus], ["Budget", p.budget], ["Pain point", p.painPoint]);
  } else if (p.type === "vendor") {
    rows.push(
      ["Business", p.businessName],
      ["City", p.city],
      ["Turnover", p.turnover],
      ["Pain point", p.painPoint],
    );
  }
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
      { error: "Please fill out all required fields with a valid email." },
      { status: 400 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const notifyEmail = process.env.NOTIFY_EMAIL;
  const fromEmail = process.env.FROM_EMAIL ?? "Curator OS <onboarding@resend.dev>";

  if (!apiKey || !notifyEmail) {
    console.error("Waitlist: missing RESEND_API_KEY or NOTIFY_EMAIL.");
    return NextResponse.json(
      { error: "Waitlist is temporarily unavailable. Please try again shortly." },
      { status: 500 },
    );
  }

  const resend = new Resend(apiKey);
  const { text, html } = buildBody(payload);

  try {
    await resend.emails.send({
      from: fromEmail,
      to: [notifyEmail],
      replyTo: payload.email,
      subject: buildSubject(payload),
      text,
      html,
    });
  } catch (err) {
    console.error("Waitlist send failed:", err);
    return NextResponse.json(
      { error: "Could not record your signup. Please try again." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
