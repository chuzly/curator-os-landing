// Opus 4.7 + domain-restricted web_search (eBay, eBay MY, TCGPlayer, PriceCharting, Cardmarket).
// Vercel Pro tier — function timeout ceiling 300 sec. max_uses: 2 per call.
// SDK timeout 240 sec, maxDuration 300 sec, gives 60 sec error-handling headroom.
//
// ARCHITECTURE: model returns a structured `listings` array of raw eBay sales it found via
// web_search. The backend filters by condition (raw vs graded), drops IQR outliers, computes
// median / low / high in USD, then converts to MYR (× 4.7). Model does NOT compute medians or
// do FX conversion — those are deterministic backend operations.
//
// CONDITION CASCADE: if the requested condition (e.g. HP/MP/DMG) returns < 2 listings AND it's
// a non-NM raw condition, the route automatically retries with condition="NM" and applies an
// industry-standard discount multiplier to derive the requested condition's value. Mirrors how
// Shiny App / TCGPlayer / PriceCharting handle thin-data condition tiers. Cascade response is
// labelled with `cascadeUsed: true`, `confidence: "low"`, and a transparent source string.
// If the cascade itself returns nothing usable (or condition is "Graded" with no fallback),
// the response carries `needsManualEntry: true` and the client falls back to manual mode.
//
// Operator should still verify against Shiny App for any high-value off-list card before showing customer.
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 300;

// ---------- USD → MYR ----------
const USD_MYR = 4.7;

// ---------- Condition multipliers ----------
// Industry-standard raw-condition discount factors relative to NM. Used only
// when the cascade fires (requested condition had < 2 listings, fell back to NM).
// Graded uses 1.00 since graded never cascades — graded comps require their
// own search and have no NM-derived equivalent.
const CONDITION_MULTIPLIER: Record<string, number> = {
  NM: 1.00,
  LP: 0.85,
  MP: 0.65,
  HP: 0.40,
  DMG: 0.20,
  Graded: 1.00,
};

// ---------- Types ----------

// One sold listing the model surfaced from web_search.
type Listing = {
  priceUSD: number;
  title: string;
  isGraded: boolean;
  gradeIfGraded: string | null;
  saleDate: string;
  url: string;
  soldFormat: string;
  shippingNotes: string | null;
};

// What the model returns as JSON (structured raw data — NOT computed stats).
type ModelOutput = {
  listings: Listing[];
  searchQueryUsed: string;
  venuesSearched: string[];
  variantWarning: string | null;
  diagnosticNote: string;
};

const SYSTEM_PROMPT = `You are a Pokemon TCG market researcher. The operator runs a card investigation booth. Your job is to use web_search to find real recent eBay sold listings for a specific card and condition, then return them as STRUCTURED DATA. The backend will compute medians and currency conversion — you do NOT compute these.

INPUTS you will receive in the user message:
- cardName, set, cardNumber, variant, language, condition

YOUR JOB:
1. Construct a precise eBay sold-listings search query
2. Use web_search (you have max_uses: 2) to find recent eBay sold listings
3. Return UP TO 10 individual listings as structured JSON
4. Do NOT compute median or range — backend handles this
5. Do NOT do currency conversion — backend handles this

CONSTRUCTING THE SEARCH QUERY:
- Always include: cardName + set + cardNumber + "sold"
- If condition is NM/LP/MP/HP/DMG (raw): add "-PSA -BGS -CGC -ACE -GMA -graded -slab"
- If condition is Graded: add "PSA" or "BGS" or "CGC" + grade tier if specified
- Filter to: site:ebay.com OR site:ebay.com.my, sold completed listings only

VARIANT VERIFICATION:
- For Tag Team Pokemon cards (Sun & Moon era): regular Holo has lower number (e.g., 130/214). Full Art is different number (e.g., 205/214). Alt/Rainbow Rare yet another (e.g., 225/214).
- If variant flag is "Full Art" but cardNumber is in regular Holo range (e.g., 130/214), trust the cardNumber. Treat as Regular Holo. Add note in variantWarning.

RETURN FORMAT — return ONLY a JSON object with this exact structure:

{
  "listings": [
    {
      "priceUSD": 40,
      "title": "Gardevoir Sylveon GX 130/214 Pokemon Unbroken Bonds NM",
      "isGraded": false,
      "gradeIfGraded": null,
      "saleDate": "2026-04-30",
      "url": "https://www.ebay.com/itm/...",
      "soldFormat": "auction",
      "shippingNotes": null
    }
  ],
  "searchQueryUsed": "Gardevoir Sylveon GX 130 214 sold -PSA -BGS -CGC",
  "venuesSearched": ["ebay.com", "ebay.com.my"],
  "variantWarning": null,
  "diagnosticNote": "Honest summary of what you found and any limitations."
}

CRITICAL RULES:
- DO NOT make up listings. If web_search returns nothing useful, return listings: [] and explain in diagnosticNote.
- DO NOT estimate prices from training data. ONLY return listings you actually saw in search results.
- DO NOT include graded listings if condition is raw. Filter at search time AND filter again before returning.
- All prices must be USD numbers. Backend converts to MYR.

JSON OUTPUT FORMAT (STRICTLY ENFORCED):
- Return JSON ONLY. The very first character of your response MUST be the opening { brace.
- DO NOT write any prose, planning, reasoning, or commentary before the JSON. NOT EVEN ONE WORD.
- DO NOT wrap the JSON in markdown code fences (no triple-backtick json or triple-backtick).
- DO NOT add explanation after the JSON.
- If you have analysis to share, put it in the diagnosticNote field WITHIN the JSON.
- Bad output: 'I found these listings. Here is the JSON:' followed by JSON → REJECTED
- Bad output: triple-backtick json then JSON then triple-backtick → REJECTED
- Good output: starts immediately with { and ends with the closing }`;

// ---------- JSON extraction ----------

function extractJson(text: string): unknown | null {
  const cleaned = text.trim();

  // Strategy 1: Direct parse (model followed instructions perfectly).
  try {
    return JSON.parse(cleaned);
  } catch { /* fall through */ }

  // Strategy 2: Strip markdown code fences if model wrapped output.
  const fenced = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenced) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch { /* fall through */ }
  }

  // Strategy 3: Brace-counting walk to find the outermost balanced { ... } block.
  // Handles cases where model writes prose preamble before/after the JSON,
  // or where prose contains stray { or } characters that would break naive
  // indexOf/lastIndexOf slicing.
  const firstBrace = cleaned.indexOf('{');
  if (firstBrace === -1) return null;

  let depth = 0;
  let inString = false;
  let escapeNext = false;
  for (let i = firstBrace; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (escapeNext) { escapeNext = false; continue; }
    if (ch === '\\' && inString) { escapeNext = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        const candidate = cleaned.slice(firstBrace, i + 1);
        try {
          return JSON.parse(candidate);
        } catch {
          return null;
        }
      }
    }
  }

  return null;
}

// ---------- Validation ----------

function isListing(x: unknown): x is Listing {
  if (!x || typeof x !== "object") return false;
  const li = x as Record<string, unknown>;
  return (
    typeof li.priceUSD === "number" &&
    typeof li.title === "string" &&
    typeof li.isGraded === "boolean" &&
    (li.gradeIfGraded === null || typeof li.gradeIfGraded === "string") &&
    typeof li.saleDate === "string" &&
    typeof li.url === "string" &&
    typeof li.soldFormat === "string" &&
    (li.shippingNotes === null || typeof li.shippingNotes === "string")
  );
}

function validateModelOutput(data: unknown): data is ModelOutput {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    Array.isArray(d.listings) &&
    d.listings.every(isListing) &&
    typeof d.searchQueryUsed === "string" &&
    Array.isArray(d.venuesSearched) &&
    d.venuesSearched.every((v) => typeof v === "string") &&
    (d.variantWarning === null || typeof d.variantWarning === "string") &&
    typeof d.diagnosticNote === "string"
  );
}

// ---------- Backend math (pure, deterministic) ----------

function medianOf(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function quantileOf(sortedAscending: number[], q: number): number {
  const idx = Math.floor(sortedAscending.length * q);
  return sortedAscending[Math.min(idx, sortedAscending.length - 1)];
}

// IQR outlier filter — keep prices within [Q1 − 1.5·IQR, Q3 + 1.5·IQR].
// Skipped when fewer than 4 listings (IQR isn't meaningful).
function dropOutliers(listings: Listing[]): Listing[] {
  if (listings.length < 4) return listings;
  const prices = listings.map((li) => li.priceUSD).sort((a, b) => a - b);
  const q1 = quantileOf(prices, 0.25);
  const q3 = quantileOf(prices, 0.75);
  const iqr = q3 - q1;
  const lo = q1 - 1.5 * iqr;
  const hi = q3 + 1.5 * iqr;
  return listings.filter((li) => li.priceUSD >= lo && li.priceUSD <= hi);
}

// ---------- Per-condition model call ----------

// One round-trip to the model for a single condition. Catches its own errors
// so the cascade pipeline in POST() can decide how to react without losing
// to a thrown exception. Error returns: { listings: [], modelOutput: null }.
async function searchConditionListings(
  client: Anthropic,
  cardName: string,
  set: string,
  cardNumber: string,
  variant: string,
  language: string,
  condition: string,
): Promise<{
  listings: Listing[];
  modelOutput: ModelOutput | null;
  rawText: string;
  toolUseCount: number;
}> {
  const userPrompt = [
    `Card: ${cardName}`,
    set ? `Set: ${set}` : null,
    cardNumber ? `Number: ${cardNumber}` : null,
    variant ? `Variant: ${variant}` : null,
    language ? `Language: ${language}` : null,
    `Condition: ${condition}`,
    ``,
    `Find recent sold comps and return the JSON object specified in the system prompt.`,
  ].filter(Boolean).join("\n");

  const t0 = Date.now();
  let response;
  try {
    response = await client.messages.create(
      {
        model: "claude-opus-4-7",
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
        tools: [
          {
            type: "web_search_20260209",
            name: "web_search",
            max_uses: 2,
            allowed_domains: ["ebay.com", "ebay.com.my", "tcgplayer.com", "pricecharting.com", "cardmarket.com"],
          } as unknown as Anthropic.Messages.ToolUnion,
        ],
      },
      { timeout: 240_000 },
    );
  } catch (err) {
    if (err instanceof Anthropic.APIConnectionTimeoutError) {
      console.error(`[get-comps] (${condition}) timeout after 240s`);
    } else if (err instanceof Anthropic.APIError) {
      console.error(`[get-comps] (${condition}) Anthropic API error:`, err.status, err.message);
    } else {
      console.error(`[get-comps] (${condition}) model call failed:`, err);
    }
    return { listings: [], modelOutput: null, rawText: "", toolUseCount: 0 };
  }

  const toolUseCount = (response.content || []).filter(
    (b) => b.type === "server_tool_use",
  ).length;
  console.log(
    `[get-comps] (${condition}) call complete in ${Date.now() - t0}ms, tools=${toolUseCount || "none"}, blocks=${response.content?.length || 0}, stop_reason=${response.stop_reason}`,
  );

  const textBlocks = response.content.filter(
    (b): b is Anthropic.TextBlock => b.type === "text",
  );
  const finalText = textBlocks.length ? textBlocks[textBlocks.length - 1].text : "";
  if (!finalText) {
    console.error(`[get-comps] (${condition}) no text block in response`);
    return { listings: [], modelOutput: null, rawText: "", toolUseCount };
  }

  const parsed = extractJson(finalText);
  if (!validateModelOutput(parsed)) {
    console.error(
      `[get-comps] (${condition}) model output failed schema validation:`,
      finalText.slice(0, 300),
    );
    return { listings: [], modelOutput: null, rawText: finalText, toolUseCount };
  }

  return {
    listings: parsed.listings,
    modelOutput: parsed,
    rawText: finalText,
    toolUseCount,
  };
}

// ---------- Route ----------

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

  // Build the eBay sold-listings verification URL from the request payload.
  // 183454 = Pokemon TCG Individual Cards category; LH_Sold=1 + LH_Complete=1 = sold listings only.
  // Constructed up-front so every response shape (manual-entry or computed) carries it.
  const set = (body.set ?? "").trim();
  const cardNumber = (body.cardNumber ?? "").trim();
  const variant = (body.variant ?? "").trim();
  const language = (body.language ?? "").trim();
  console.log("[get-comps] eBay URL inputs:", { cardName, set, cardNumber });
  const queryParts = [cardName, set, cardNumber].filter(Boolean);
  const queryString = queryParts.join(" ").trim();
  const ebayQuery = encodeURIComponent(queryString);
  const ebayVerifyUrl = `https://www.ebay.com/sch/i.html?_nkw=${ebayQuery}&_sacat=183454&LH_Sold=1&LH_Complete=1&_ipg=60`;

  const client = new Anthropic({ apiKey });

  console.log(
    "[get-comps] starting, payload:",
    JSON.stringify(body).slice(0, 200),
  );
  const t0 = Date.now();

  try {
    const isRawCondition = ["NM", "LP", "MP", "HP", "DMG"].includes(condition);

    // Pass 1 — search at the requested condition.
    const requestedResult = await searchConditionListings(
      client, cardName, set, cardNumber, variant, language, condition,
    );

    let finalListings = requestedResult.listings;
    let parsed = requestedResult.modelOutput;
    let cascadeUsed = false;
    let nmCount = 0;

    // Pass 2 (cascade) — if requested condition came back thin AND it's a
    // non-NM raw condition, retry as NM and apply the multiplier later.
    // Graded never cascades.
    if (finalListings.length < 2 && isRawCondition && condition !== "NM") {
      console.log(
        `[get-comps] cascade — ${condition} returned ${finalListings.length} listings, retrying as NM`,
      );
      const nmResult = await searchConditionListings(
        client, cardName, set, cardNumber, variant, language, "NM",
      );
      if (nmResult.listings.length >= 2) {
        finalListings = nmResult.listings;
        parsed = nmResult.modelOutput; // diagnosticNote / variantWarning come from NM call
        nmCount = nmResult.listings.length;
        cascadeUsed = true;
      }
    }

    const multiplier = cascadeUsed ? (CONDITION_MULTIPLIER[condition] ?? 1.00) : 1.00;
    console.log(
      `[get-comps] cascade decision: requested=${condition}, requestedListings=${requestedResult.listings.length}, cascadeUsed=${cascadeUsed}, nmListings=${nmCount}, multiplier=${multiplier}`,
    );

    // ---- Manual-entry early return: still nothing usable after cascade ----
    if (finalListings.length < 2) {
      console.log("[get-comps] needsManualEntry — no usable listings even after cascade");
      return NextResponse.json({
        needsManualEntry: true,
        reason: parsed?.diagnosticNote ?? "No usable listings returned by API.",
        operatorNote: "Live API returned insufficient comps. Manual Shiny App lookup recommended.",
        ebayVerifyUrl,
      });
    }

    // ---- Filter by condition (raw vs graded) ----
    let filtered = finalListings.filter((li) => li.priceUSD > 0);
    if (isRawCondition) {
      filtered = filtered.filter((li) => !li.isGraded);
    } else if (condition === "Graded") {
      filtered = filtered.filter((li) => li.isGraded);
    }
    console.log(`[get-comps] after condition filter (isRaw=${isRawCondition}): ${filtered.length}`);

    if (filtered.length === 0) {
      console.log("[get-comps] needsManualEntry — all listings filtered out by condition");
      return NextResponse.json({
        needsManualEntry: true,
        reason: `All listings filtered by condition (operator picked ${condition}, model returned only ${isRawCondition ? "graded" : "raw"} listings).`,
        operatorNote: "Live API returned insufficient comps after condition filter. Manual Shiny App lookup recommended.",
        ebayVerifyUrl,
      });
    }

    // ---- IQR outlier filter ----
    filtered = dropOutliers(filtered);
    console.log(`[get-comps] after IQR outlier filter: ${filtered.length}`);

    if (filtered.length === 0) {
      console.log("[get-comps] needsManualEntry — IQR dropped all listings");
      return NextResponse.json({
        needsManualEntry: true,
        reason: "All listings dropped as outliers — distribution too noisy for reliable median.",
        operatorNote: "Live API returned insufficient comps after outlier filter. Manual Shiny App lookup recommended.",
        ebayVerifyUrl,
      });
    }

    // ---- Compute USD stats, then apply multiplier (only if cascade fired) ----
    const prices = filtered.map((li) => li.priceUSD);
    const baseMedianUSD = medianOf(prices);
    const baseLowUSD = Math.min(...prices);
    const baseHighUSD = Math.max(...prices);
    const medianUSD = baseMedianUSD * multiplier;
    const lowUSD = baseLowUSD * multiplier;
    const highUSD = baseHighUSD * multiplier;

    // ---- Sanity check on the FINAL (post-multiplier) USD median ----
    if (medianUSD < 1 || medianUSD > 10000) {
      console.log(
        `[get-comps] needsManualEntry — implausible medianUSD=${medianUSD} (cascade=${cascadeUsed}, multiplier=${multiplier})`,
      );
      return NextResponse.json({
        needsManualEntry: true,
        reason: "Implausible USD median, manual review required",
        operatorNote: `Computed median (USD ${medianUSD.toFixed(2)}) falls outside plausible range — manual Shiny App review required.`,
        ebayVerifyUrl,
      });
    }

    // ---- Convert USD → MYR ----
    const medianMYR = Math.round(medianUSD * USD_MYR);
    const lowMYR = Math.round(lowUSD * USD_MYR);
    const highMYR = Math.round(highUSD * USD_MYR);

    console.log(
      `[get-comps] computed: medianUSD=${medianUSD.toFixed(2)}, medianMYR=${medianMYR}, range=[${lowMYR}, ${highMYR}], n=${filtered.length}, cascadeUsed=${cascadeUsed}, totalElapsed=${Date.now() - t0}ms`,
    );

    // ---- Source / operatorNote / confidence depend on whether we cascaded ----
    const source = cascadeUsed
      ? `estimated (NM × ${multiplier} — raw ${condition} comps thin on eBay, n=${nmCount})`
      : `eBay sold (live, n=${filtered.length})`;

    const cascadeNote = cascadeUsed
      ? ` | Computed from NM cluster (n=${nmCount}) × ${multiplier} adjustment for ${condition} condition. Industry-standard discount tier.`
      : "";

    const operatorNote =
      (parsed?.diagnosticNote ?? "")
      + (parsed?.variantWarning ? " | " + parsed.variantWarning : "")
      + cascadeNote;

    return NextResponse.json({
      needsManualEntry: false,
      medianMYR,
      lowMYR,
      highMYR,
      medianUSD,
      n: filtered.length,
      trend: "Stable",
      source,
      operatorNote,
      ebayVerifyUrl,
      rawListingsForAudit: filtered,
      confidence: cascadeUsed ? "low" : "high",
      cascadeUsed,
    });
  } catch (err) {
    // Defensive net — searchConditionListings catches its own errors, so this
    // only fires for unforeseen issues in the post-fetch pipeline.
    console.error("[get-comps] error:", err);
    console.error(`[get-comps] failed after ${Date.now() - t0}ms`);
    if (err instanceof Anthropic.APIConnectionTimeoutError) {
      console.error("[get-comps] timeout after 240s");
      return NextResponse.json({ error: "comps_failed" }, { status: 502 });
    }
    if (err instanceof Anthropic.APIError) {
      console.error("[get-comps] Anthropic API error:", err.status, err.message);
      return NextResponse.json({ error: "comps_failed" }, { status: 502 });
    }
    return NextResponse.json({ error: "comps_failed" }, { status: 502 });
  }
}
