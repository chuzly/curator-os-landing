import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 30;

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

const SYSTEM_PROMPT = `You are a Pokemon TCG sold comp researcher. Given a card and condition, return sold comp data in MYR (Malaysian Ringgit). Convert from USD/JPY using approximate current FX (USD 1 = MYR 4.7, JPY 100 = MYR 3).

Return ONLY a single JSON object — no prose, no markdown code fences, no explanation. The JSON must have these exact fields:
- median (number, RM)
- rangeLow (number)
- rangeHigh (number)
- n (number, count of sold comps you found)
- source (string: "eBay sold" / "Cardmarket" / "mixed" / "estimated")
- reprintRisk ("Low" / "Medium" / "High")
- reprintReason (1-line string)
- catalysts (array of 1-2 strings)
- risks (array of 1-2 strings)
- conditionAdjustment (1-line string explaining how condition affects value)
- operatorNote (1-2 sentences in calm investment educator voice — anti-hype, framework-driven)

If data is thin, be honest in operatorNote. Don't fabricate. If you couldn't find recent sold comps, set source="estimated" and explain in operatorNote.

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

  try {
    const response = await client.messages.create(
      {
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
        tools: [
          {
            type: "web_search_20260209",
            name: "web_search",
            max_uses: 3,
          } as unknown as Anthropic.Messages.ToolUnion,
        ],
      },
      { timeout: 20_000 },
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
    if (err instanceof Anthropic.APIConnectionTimeoutError) {
      console.error("[get-comps] timeout after 20s");
      return NextResponse.json({ error: "comps_failed" }, { status: 502 });
    }
    if (err instanceof Anthropic.APIError) {
      console.error("[get-comps] Anthropic API error:", err.status, err.message);
      return NextResponse.json({ error: "comps_failed" }, { status: 502 });
    }
    console.error("[get-comps] unexpected:", err);
    return NextResponse.json({ error: "comps_failed" }, { status: 502 });
  }
}
