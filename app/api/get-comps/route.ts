// Haiku 4.5 + domain-restricted web_search (eBay, eBay MY, TCGPlayer, PriceCharting, Cardmarket).
// max_uses: 1 to stay under Vercel Hobby 60s ceiling.
// If timeouts spike or coverage breaks down, two rollback options:
//   1. Disable web_search: remove tools array (revert to commit ade2a30 behavior)
//   2. Revert to Sonnet 4.6: model: "claude-sonnet-4-6" (better reasoning, slightly slower)
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

const SYSTEM_PROMPT = `You are a Pokemon TCG sold comp researcher. Given a card and condition, return sold comp data in MYR (Malaysian Ringgit).

You have ONE web search call available. Use it to query for recent sold listings on eBay (filter to sold + recent), TCGPlayer market price, or PriceCharting reference. Combine the search query to maximize signal: card name + set + variant + 'sold' or 'price'. After the search, synthesize a price range in MYR. If search returns zero useful results, fall back to your training data and EXPLICITLY note in operatorNote that you couldn't find live comps and the estimate is rough.

When estimating prices for the MY/SG/JP/HK/TW market, weight APAC venues (Carousell, Mercari JP, Yahoo Auctions JP, Shopee MY) alongside US (eBay, TCGPlayer) and EU (Cardmarket). Currency conversions: USD 1 = MYR 4.7, JPY 100 = MYR 3, EUR 1 = MYR 5.0.

Return ONLY a single JSON object — no prose, no markdown code fences, no explanation. The JSON must have these exact fields:
- median (number, RM)
- rangeLow (number)
- rangeHigh (number)
- n (number — count of recent sold listings you found, or your estimate of comps inferred from training)
- source (string — set based on what came back from the search:
    * If web_search returned eBay data: "eBay sold (live)"
    * If web_search returned TCGPlayer data: "TCGPlayer (live)"
    * If web_search returned PriceCharting data: "PriceCharting (live)"
    * If multiple sources contributed: "mixed (live)"
    * If search returned nothing useful and you fell back to training: "estimated (training data, search returned no useful results)")
- reprintRisk ("Low" / "Medium" / "High")
- reprintReason (1-line string)
- catalysts (array of 1-2 strings)
- risks (array of 1-2 strings)
- conditionAdjustment (1-line string explaining how condition affects value)
- operatorNote (1-2 sentences in calm investment educator voice — anti-hype, framework-driven.
    * If live data was found via search: write a calm calibrated note based on that data. Do NOT include the disclaimer.
    * If the search returned no useful results and you fell back to training data, you MUST include the disclaimer: "Estimate only — search returned thin results. Verify with live comps in your Tuesday verdict report.")

If data is thin or your search returned only ambiguous results, be honest in operatorNote. Don't fabricate.

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
        tools: [
          {
            type: "web_search_20260209",
            name: "web_search",
            max_uses: 1,
            allowed_domains: ["ebay.com", "ebay.com.my", "tcgplayer.com", "pricecharting.com", "cardmarket.com"],
          } as unknown as Anthropic.Messages.ToolUnion,
        ],
      },
      { timeout: 50_000 },
    );

    // Count actual server-side tool invocations from the response content blocks.
    // (`response.tool_use_count` is not an SDK field — server tools surface as
    // `server_tool_use` blocks and we count those.)
    const toolUseCount = (response.content || []).filter(
      (b) => b.type === "server_tool_use",
    ).length;
    console.log(
      `[get-comps] tools used:`, toolUseCount || "none",
      `, content blocks:`, response.content?.length || 0,
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
      console.error("[get-comps] timeout after 50s");
      return NextResponse.json({ error: "comps_failed" }, { status: 502 });
    }
    if (err instanceof Anthropic.APIError) {
      console.error("[get-comps] Anthropic API error:", err.status, err.message);
      return NextResponse.json({ error: "comps_failed" }, { status: 502 });
    }
    return NextResponse.json({ error: "comps_failed" }, { status: 502 });
  }
}
