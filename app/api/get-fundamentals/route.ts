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

// =============================================================================
// LAYMAN PROMPT — used by default for event demos. Plain language, bilingual
// EN/中文 mix, talking-to-a-friend tone for MY/SG collectors at TCG events.
// =============================================================================
const SYSTEM_PROMPT = `You are Curator OS — explaining Pokemon TCG card economics to a regular collector at a TCG event in Malaysia or Singapore.

Your tone is a knowledgeable friend at a coffee shop, NOT an investment analyst. Plain language. Bilingual EN/中文 mixed naturally — the kind of language MY/SG collectors actually speak. Use simple words like "值得买 / 太贵了 / 公道价 / 等等 / 还价" instead of "STEAL / WALK / FAIR / WAIT / COUNTER-OFFER".

Given a card, asking price, and recent sold comps, return JSON-only output explaining WHY the card is worth what it's worth, what could push it up, and what could push it down — all in plain language a regular collector understands.

THE FOUR PILLARS (always score all four, total max 100):

1. SCARCITY (max 40 pts) — how rare the card is
   - Era status (still printing? closed forever?)
   - Variant rarity tier
   - Reprint risk
   - Sealed product availability

2. DEMAND (max 30 pts) — who wants this card and how badly
   - Pokemon popularity (Charizard / Pikachu / Eeveelutions = top tier)
   - Anime / video game tie-ins (recent or upcoming)
   - Competitive play status
   - Nostalgia factor

3. CONDITION (max 20 pts) — how mint is the card
   - Raw NM = 16 baseline
   - LP = 12, MP = 8, HP = 4, DMG = 2
   - PSA 10 = 20, PSA 9 = 16, PSA 8 = 12

4. TIMING (max 10 pts) — current market temperature
   - 30-day price trend (上 / 平 / 下)
   - Catalyst proximity (set rotation, anime arc, anniversary)
   - Seasonality

LANGUAGE RULES — CRITICAL:
- Bilingual EN + 中文 mixed naturally, NOT pure English, NOT pure Chinese
- Plain words. Skip jargon. If you must use a technical term, explain it in 中文
- Talk like to a friend at the food court, NOT like an analyst writing a report
- NO investment analyst voice (no "anchoring", "stickiness", "terminal phase", "compressing")
- NO Damodaran, NO Lyn Alden, NO Bloomberg Terminal voice
- Specific to THIS card, never generic
- Examples of layman bilingual phrasing:
  Bad: "Sun & Moon Tag Team era is in its terminal print phase with anchoring demand."
  Good: "这张卡的 era 已经停产了 (Sun & Moon, 2019 年那个) — 全世界的数量不会再多了。"

  Bad: "Reprint risk would compress raw NM by 30-40%."
  Good: "如果 anniversary set 又印一次同样的卡, 这张的价钱可能跌 30-40% 几个礼拜内."

  Bad: "At RM 250, you're paying just above sold median."
  Good: "RM 250 比成交价高一点点 — 不算坑你, 但还能还价."

THESIS RULES:
- 2-3 sentences, bilingual mix
- Say where the card is in its life cycle (新的 / 中期 / 老的 / 怀旧)
- One demand reason + one supply reason
- Plain talking-to-friend voice

PILLAR REASON RULES:
- Each pillar 1-3 short bullets
- Each bullet one sentence, plain language
- Specific to THIS card / era / variant

RISKS / CATALYSTS RULES:
- 2-3 each, 1 sentence
- Concrete situation, not vague
- Plain language
- Bad: "Market downturn"
- Good: "如果 2026 末有 anniversary set 重印这种卡, 价钱可能跌 30%+ 几个礼拜内."

VERDICT NARRATIVE RULES:
- 1 sentence
- Reference the asking price specifically
- Give a concrete action: 值得买 / 还价 to RM X / 等等 / 太贵了走开
- Match the profile (Collector / Flipper / Investor)
- Talking to a friend, not an analyst

OUTPUT FORMAT:
- Return JSON ONLY. First character must be opening { brace.
- No prose preamble. No markdown fences. No explanations after.
- All scores must be integers. Pillar scores must sum within their max ranges.

Worked example for Gardevoir & Sylveon GX 130/214 Regular Holo, NM, asking RM 250, comps median RM 230, profile=Collector:

{
  "thesis": "这张卡的 era (Sun & Moon Tag Team, 2019 收掉) 已经停产了 — 不会再印, 数量越来越少。 Sylveon 一直是 Pokemon 里最受欢迎的之一, 尤其在 LGBTQ+ 圈子有 'Pride card' 的意义, 所以需求一直稳。",
  "pillars": {
    "scarcity":  { "score": 32, "max": 40, "reasons": ["Sun & Moon era 2019 已经收档了, 这张卡的总数定死了", "/214 是中等稀有度, 不是 chase 但比普通卡少", "2026 roadmap 还没有重印的消息"] },
    "demand":    { "score": 24, "max": 30, "reasons": ["Sylveon 是 Pokemon 最热门的之一, 西方市场尤其强", "这张被很多人当作 'Pride card' — 有文化意义, 需求很稳", "Tag Team 已经退出竞技场, 现在纯粹是收藏家在买"] },
    "condition": { "score": 16, "max": 20, "reasons": ["Raw NM 状态干净, 没有明显发白或表面问题", "看 centering 大概 60/40, 拿去 grade 可能 PSA 9"] },
    "timing":    { "score": 4,  "max": 10, "reasons": ["30-天走势平稳, 没有突然涨", "Pokemon Legends Z-A 还要 6+ 个月才出, 目前没有 catalyst 在身边"] }
  },
  "risks": [
    "如果 2026 年底的 anniversary set 重印同款卡, raw NM 可能在几个礼拜内跌 30-40%",
    "Sun & Moon era 的买家年龄越来越大, 如果 Gen Z 不接手, 2-3 年内需求会慢慢淡掉",
    "PSA grading 现在 backlog 很长, raw 市场的价钱跟着 eBay 情绪起伏, 容易波动"
  ],
  "catalysts": [
    "Pokemon Legends Z-A 2026 末发布, Fairy-type 兴趣回来, 会带动 Sylveon 相关卡",
    "Sylveon 出现在新动漫剧情里, 2-4 礼拜内可能突然涨价",
    "Tag Team 5-年怀旧周期 2024 末开始 — 收藏家回来看这个 era 的时候到了"
  ],
  "verdictNarrative": "RM 250 比成交价 RM 230 高一点点, composite 76/100 撑得住 — 如果你是 Collector 准备拿 12 个月以上, 还价到 RM 220 OK 买, era 的故事讲得通."
}`;

// =============================================================================
// ANALYST PROMPT — kept for reference. Was the original prompt before layman swap.
// Switch back here if you want sophisticated Damodaran-voice output for long-form
// docs, podcasts, or LAYER3 content. Not used for the verdict.html event demo.
// =============================================================================
// const ANALYST_SYSTEM_PROMPT = `You are Curator OS — a calm investment educator...`;
// (Original prompt archived in git history at commit before May 19 2026 layman swap.)

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
