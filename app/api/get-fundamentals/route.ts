// Sonnet 4.6 — synthesis-only (no web_search). Returns market analysis JSON
// for one card: thesis + 4 pillars (scarcity / demand / condition / timing) +
// risks + catalysts + verdict narrative. Pure prompt-driven reasoning from
// training data, no live data dependency. Frontend renders in the fundamentals
// panel below the comps grid.
//
// SDK timeout 30s, maxDuration 60s. Sonnet typically lands in 8–15s for ~1k token output.
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 60;

// ---------- Types ----------

type Pillar = {
  score: number;
  max: number;
  reasons: string[];
};

type FundamentalsOutput = {
  thesis: string;
  pillars: {
    scarcity: Pillar;
    demand: Pillar;
    condition: Pillar;
    timing: Pillar;
  };
  risks: string[];
  catalysts: string[];
  verdictNarrative: string;
};

const SYSTEM_PROMPT = `You are Curator OS — a calm investment educator analyzing Pokemon TCG cards. Your tone is Damodaran or Lyn Alden applied to Pokemon: anti-hype, framework-driven, specific not generic.

Given a card, asking price, and recent sold comps, return JSON-only output explaining WHY the card is worth what it's worth, what could push it up (catalysts), and what could push it down (risks).

Your audience is a serious collector or vendor at a TCG event in Malaysia. They already know prices. They want to understand the underlying drivers.

THE FOUR PILLARS (always score all four, total max 100):

1. SCARCITY (max 40 pts) — supply-side analysis
   - Set print size, era cohort, variant rarity tier
   - Reprint risk (announced reprints? Era closing?)
   - Sealed product availability
   - Examples of high-scarcity signals: discontinued era + Tag Team format retired + low pop graded
   - Examples of low-scarcity signals: actively printed era + bulk variant + reprint announced

2. DEMAND (max 30 pts) — collector + player side
   - Pokemon popularity tier (Charizard, Pikachu, Eeveelutions = top tier; obscure Pokemon = lower)
   - Anime/media catalysts (recent appearances, upcoming arcs)
   - Competitive playability (banned? meta? casual?)
   - Generational nostalgia signals
   - Tag Team partner appeal if applicable

3. CONDITION (max 20 pts) — state side
   - Raw NM = baseline 16 pts
   - LP = 12, MP = 8, HP = 4, DMG = 2
   - Graded with PSA 10 = 20, PSA 9 = 16, PSA 8 = 12, others scale
   - Adjust ±2 for surface quality red flags noted in operator data

4. TIMING (max 10 pts) — market context
   - 30-day trend (Up = high; Stable = mid; Down = low)
   - Catalyst proximity (set rotation announcement nearby? anime arc?)
   - Cyclical seasonality (Q4 = up; post-Christmas = down)

PILLAR REASON RULES:
- Each pillar's reasons array contains 1-3 specific bullets
- Each bullet is one sentence, no fluff
- Reference the SPECIFIC card / era / variant — never generic
- Bad: 'This is a popular card.'
- Good: 'Sylveon is a top-3 fanbase Pokemon, anchoring Tag Team era demand even as the format retires.'

THESIS RULES:
- 2-3 sentences max
- State where the card sits in its era cycle (early collection / mid / terminal / nostalgic)
- One specific demand driver and one specific scarcity driver
- No hype language ('moon', 'fire', 'banger')
- Calm Damodaran voice

RISKS / CATALYSTS RULES:
- Each is 1 sentence, specific to this card
- Risks: things that could compress price 20%+
- Catalysts: things that could expand price 20%+
- 2-3 items each
- Bad: 'Market could go down.'
- Good: 'A reprint announcement in late 2026 Cosmic Eclipse anniversary would compress raw NM by 30-40% within weeks.'

VERDICT NARRATIVE RULES:
- 1 sentence
- Reference the asking price specifically
- Reference profile (Collector / Flipper / Investor) — adjust risk tolerance accordingly
- End with a concrete action verb
- Bad: 'This is a fair price for this card.'
- Good: 'At RM 250, you're paying composite-fair value with limited downside; for a Collector profile, negotiate to RM 220 or take it.'

OUTPUT FORMAT:
- Return JSON ONLY. First character must be opening { brace.
- No prose preamble. No markdown fences. No explanations after.
- All scores must be integers. Pillar scores must sum within their max ranges.

Worked example for Gardevoir & Sylveon GX 130/214 Regular Holo, NM, asking RM 250, comps median RM 230, profile=Collector:

{
  "thesis": "Sun & Moon Tag Team era is in its terminal print phase with no announced reprints, and Sylveon's status as a top-tier fanbase Pokemon — particularly within the LGBTQ+ collector community — provides demand stickiness even as Tag Team format retires from competitive play. Floor hardening, ceiling pending broader Gen 6 Fairy-type revival.",
  "pillars": {
    "scarcity":  { "score": 32, "max": 40, "reasons": ["Sun & Moon era closed in late 2019 — fixed historical print run", "Tag Team /214 mid-tier rarity slot, not the chase variant but scarcer than commons", "No reprint announced for 2026 Pokemon TCG roadmap"] },
    "demand":    { "score": 24, "max": 30, "reasons": ["Sylveon is a top-3 fanbase Pokemon, especially in Western markets", "Card has cultural resonance as 'Pride card' due to Sylveon community symbolism", "Tag Team format retired from competitive — pure collector demand now"] },
    "condition": { "score": 16, "max": 20, "reasons": ["Raw NM with no obvious whitening or surface issues", "Centering visible in image looks 60/40, PSA 9-likely if graded"] },
    "timing":    { "score": 4,  "max": 10, "reasons": ["30-day trend stable to slightly up, no parabolic move", "No imminent catalyst — Pokemon Legends Z-A still 6+ months out"] }
  },
  "risks": [
    "A reprint announcement in late 2026 anniversary set could compress raw NM by 30-40% within weeks",
    "Sun & Moon era buyers aging out without Gen Z pickup risks slow demand erosion over 2-3 years",
    "PSA grading bottleneck means raw market remains the primary liquidity venue — sensitive to eBay sentiment swings"
  ],
  "catalysts": [
    "Pokemon Legends Z-A launch (late 2026) reignites Fairy-type interest, lifting Sylveon adjacency",
    "Sylveon featured in upcoming anime arc would create acute pump within 2-4 weeks",
    "5-year Tag Team retro nostalgia cycle starting late 2024 — collector revisit window opening"
  ],
  "verdictNarrative": "At RM 250, you're paying just above sold median with composite score 76/100 supporting the price; for a Collector profile holding 12+ months, negotiate to RM 220 or accept at ask — the era thesis is sound."
}`;

// ---------- JSON extraction (duplicated from get-comps for isolation) ----------

function extractJson(text: string): unknown | null {
  const cleaned = text.trim();

  try {
    return JSON.parse(cleaned);
  } catch { /* fall through */ }

  const fenced = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenced) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch { /* fall through */ }
  }

  // Brace-counting walk for the outermost balanced { ... } block.
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
        try { return JSON.parse(candidate); }
        catch { return null; }
      }
    }
  }
  return null;
}

// ---------- Validation ----------

function isPillar(x: unknown, expectedMax: number): x is Pillar {
  if (!x || typeof x !== "object") return false;
  const p = x as Record<string, unknown>;
  if (typeof p.score !== "number" || !Number.isInteger(p.score)) return false;
  if (typeof p.max !== "number" || p.max !== expectedMax) return false;
  if (p.score < 0 || p.score > expectedMax) return false;
  if (!Array.isArray(p.reasons)) return false;
  if (p.reasons.length < 1 || p.reasons.length > 3) return false;
  return p.reasons.every((r) => typeof r === "string");
}

function validateFundamentalsOutput(data: unknown): data is FundamentalsOutput {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;

  if (typeof d.thesis !== "string" || d.thesis.length < 50) return false;

  if (!d.pillars || typeof d.pillars !== "object") return false;
  const pl = d.pillars as Record<string, unknown>;
  if (!isPillar(pl.scarcity, 40)) return false;
  if (!isPillar(pl.demand, 30)) return false;
  if (!isPillar(pl.condition, 20)) return false;
  if (!isPillar(pl.timing, 10)) return false;

  if (!Array.isArray(d.risks) || d.risks.length < 2 || d.risks.length > 3) return false;
  if (!d.risks.every((r) => typeof r === "string")) return false;

  if (!Array.isArray(d.catalysts) || d.catalysts.length < 2 || d.catalysts.length > 3) return false;
  if (!d.catalysts.every((c) => typeof c === "string")) return false;

  if (typeof d.verdictNarrative !== "string" || d.verdictNarrative.length < 30) return false;

  return true;
}

// ---------- Route ----------

export async function POST(req: Request) {
  let body: {
    cardName?: string;
    set?: string;
    cardNumber?: string;
    variant?: string;
    era?: string;
    language?: string;
    condition?: string;
    askingPrice?: number;
    comps?: {
      medianMYR?: number;
      lowMYR?: number;
      highMYR?: number;
      n?: number;
      source?: string;
    };
    profile?: string;
    compositeScore?: number;
  };
  try {
    body = await req.json();
  } catch (err) {
    console.error("[get-fundamentals] error: invalid JSON body:", err);
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const cardName = (body.cardName ?? "").trim();
  const condition = (body.condition ?? "").trim();
  if (!cardName || !condition) {
    return NextResponse.json({ error: "missing_required" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[get-fundamentals] ANTHROPIC_API_KEY missing");
    return NextResponse.json({ error: "fundamentals_failed" }, { status: 502 });
  }

  console.log("[get-fundamentals] starting, payload:", {
    cardName,
    condition,
    asking: body.askingPrice,
    profile: body.profile,
  });

  const compsLine = body.comps && body.comps.medianMYR != null
    ? `Comps: median RM ${body.comps.medianMYR}, range RM ${body.comps.lowMYR ?? "?"}–${body.comps.highMYR ?? "?"}, n=${body.comps.n ?? "?"}, source=${body.comps.source ?? "?"}`
    : `Comps: not available`;

  const userPrompt = [
    `Card: ${cardName}`,
    body.set ? `Set: ${body.set}` : null,
    body.cardNumber ? `Number: ${body.cardNumber}` : null,
    body.variant ? `Variant: ${body.variant}` : null,
    body.era ? `Era: ${body.era}` : null,
    body.language ? `Language: ${body.language}` : null,
    `Condition: ${condition}`,
    body.askingPrice != null ? `Asking price: RM ${body.askingPrice}` : `Asking price: (not entered)`,
    compsLine,
    `Profile: ${body.profile ?? "Collector"}`,
    body.compositeScore != null ? `Educator-panel composite score: ${body.compositeScore}/100` : null,
    ``,
    `Return the fundamentals JSON object specified in the system prompt.`,
  ].filter(Boolean).join("\n");

  const client = new Anthropic({ apiKey });
  const t0 = Date.now();

  let response;
  try {
    response = await client.messages.create(
      {
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      },
      { timeout: 30_000 },
    );
  } catch (err) {
    if (err instanceof Anthropic.APIConnectionTimeoutError) {
      console.error("[get-fundamentals] timeout after 30s");
    } else if (err instanceof Anthropic.APIError) {
      console.error("[get-fundamentals] Anthropic API error:", err.status, err.message);
    } else {
      console.error("[get-fundamentals] error:", err);
    }
    return NextResponse.json({ error: "fundamentals_failed" }, { status: 502 });
  }

  console.log(
    `[get-fundamentals] Anthropic call complete in ${Date.now() - t0}ms, stop_reason=${response.stop_reason}`,
  );

  const textBlocks = response.content.filter(
    (b): b is Anthropic.TextBlock => b.type === "text",
  );
  const finalText = textBlocks.length ? textBlocks[textBlocks.length - 1].text : "";
  if (!finalText) {
    console.error("[get-fundamentals] no text block in response");
    return NextResponse.json({ error: "fundamentals_failed" }, { status: 502 });
  }

  const parsed = extractJson(finalText);
  if (!validateFundamentalsOutput(parsed)) {
    console.error(
      "[get-fundamentals] schema validation failed:",
      finalText.slice(0, 300),
    );
    return NextResponse.json({ error: "fundamentals_failed" }, { status: 502 });
  }

  console.log("[get-fundamentals] returning success: thesis len:", parsed.thesis.length, ", pillar scores:", {
    scarcity: parsed.pillars.scarcity.score,
    demand: parsed.pillars.demand.score,
    condition: parsed.pillars.condition.score,
    timing: parsed.pillars.timing.score,
  });

  return NextResponse.json(parsed);
}
