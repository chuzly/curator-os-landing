// Haiku 4.5 used for speed/cost. If comp estimation quality drops (wide ranges, miscategorized cards, hallucinated venues), revert to claude-sonnet-4-6.
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 60;

type CompsResult = {
  median: number;
  rangeLow: number;
  rangeHigh: number;
  n: number;
  source: string;
  reprintRisk: "Low" | "Medium" | "High";
  reprintReason: string;
  catalysts: string[];
  risks: string[];
  conditionAdjustment: string;
  operatorNote: string;
};

const SYSTEM_PROMPT = `You are a Pokemon TCG sold comp researcher. Given a card and condition, return estimated sold comp data in MYR (Malaysian Ringgit).

You are estimating from training data only — no live web search available. Be honest in operatorNote about data freshness limitations and recommend the user verify with live comps in the Tuesday follow-up.

When estimating prices for the MY/SG/JP/HK/TW market, weight APAC venues (Carousell, Mercari JP, Yahoo Auctions JP, Shopee MY) alongside US (eBay, TCGPlayer) and EU (Cardmarket). Currency conversions: USD 1 = MYR 4.7, JPY 100 = MYR 3, EUR 1 = MYR 5.0.

Return ONLY a single JSON object — no prose, no markdown code fences, no explanation. The JSON must have these exact fields:
- median (number, RM)
- rangeLow (number)
- rangeHigh (number)
- n (number — your estimate of how many comps you are inferring from)
- source (string — always "estimated (training data)" since no live web search is available)
- reprintRisk ("Low" / "Medium" / "High")
- reprintReason (1-line string)
- catalysts (array of 1-2 strings)
- risks (array of 1-2 strings)
- conditionAdjustment (1-line string explaining how condition affects value)
- operatorNote (1-2 sentences in calm investment educator voice — anti-hype, framework-driven. If your data confidence is medium or low, you MUST include the disclosure: "Estimated from training data — verify with live comps in your Tuesday follow-up verdict report.")

If data is thin or your training data may be stale on this card, be honest in operatorNote. Don't fabricate.

Output the JSON object directly. Do not wrap it in code fences.`;

function extractJson(text: string): unknown | null {
  const cleaned = text.trim();
  // Try direct parse first.
  try {
    return JSON.parse(cleaned);
  } catch {}
  // Strip code fences if present.
  const fenced = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenced) {
    try { return JSON.parse(fenced[1]); } catch {}
  }
  // Find first balanced { ... }.
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first !== -1 && last > first) {
    try { return JSON.parse(cleaned.slice(first, last + 1)); } catch {}
  }
  return null;
}

function validateComps(data: unknown): data is CompsResult {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.median === "number" &&
    typeof d.rangeLow === "number" &&
    typeof d.rangeHigh === "number" &&
    typeof d.n === "number" &&
    typeof d.source === "string" &&
    (d.reprintRisk === "Low" || d.reprintRisk === "Medium" || d.reprintRisk === "High") &&
    typeof d.reprintReason === "string" &&
    Array.isArray(d.catalysts) &&
    Array.isArray(d.risks) &&
    typeof d.conditionAdjustment === "string" &&
    typeof d.operatorNote === "string"
  );
}

export async function POST(req: Request) {
  let body: {
    cardName?: string;
    set?: string;
    cardNumber?: string;
    variant?: string;
    condition?: string;
    language?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const cardName = (body.cardName ?? "").trim();
  const condition = (body.condition ?? "").trim();
  if (!cardName || !condition) {
    return NextResponse.json({ error: "missing_card_or_condition" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[get-comps] ANTHROPIC_API_KEY missing");
    return NextResponse.json({ error: "comps_failed" }, { status: 502 });
  }

  const userPrompt = [
    `Card: ${cardName}`,
    body.set ? `Set: ${body.set}` : null,
    body.cardNumber ? `Number: ${body.cardNumber}` : null,
    body.variant ? `Variant: ${body.variant}` : null,
    body.language ? `Language: ${body.language}` : null,
    `Condition: ${condition}`,
    ``,
    `Find recent sold comps and return the JSON object specified in the system prompt.`,
  ].filter(Boolean).join("\n");

  const client = new Anthropic({ apiKey });

  console.log(
    "[get-comps] starting, payload:",
    JSON.stringify(body).slice(0, 200),
  );
  const t0 = Date.now();

  try {
    const response = await client.messages.create(
      {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      },
      { timeout: 30_000 },
    );

    console.log(
      `[get-comps] Anthropic call complete in ${Date.now() - t0}ms, stop_reason=${response.stop_reason}`,
    );

    // Find the last text block — that's the model's final answer after any tool use.
    const textBlocks = response.content.filter(
      (b): b is Anthropic.TextBlock => b.type === "text",
    );
    const finalText = textBlocks.length ? textBlocks[textBlocks.length - 1].text : "";
    if (!finalText) {
      console.error("[get-comps] no text block in response, stop_reason=", response.stop_reason);
      return NextResponse.json({ error: "comps_failed" }, { status: 502 });
    }

    const parsed = extractJson(finalText);
    if (!validateComps(parsed)) {
      console.error("[get-comps] JSON validation failed:", finalText.slice(0, 300));
      return NextResponse.json({ error: "comps_failed" }, { status: 502 });
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[get-comps] error:", err);
    console.error(`[get-comps] failed after ${Date.now() - t0}ms`);
    if (err instanceof Anthropic.APIConnectionTimeoutError) {
      console.error("[get-comps] timeout after 30s");
      return NextResponse.json({ error: "comps_failed" }, { status: 502 });
    }
    if (err instanceof Anthropic.APIError) {
      console.error("[get-comps] Anthropic API error:", err.status, err.message);
      return NextResponse.json({ error: "comps_failed" }, { status: 502 });
    }
    return NextResponse.json({ error: "comps_failed" }, { status: 502 });
  }
}
