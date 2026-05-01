// Opus 4.7 — escalated from Sonnet 4.6 for identification accuracy diagnostic.
// Hypothesis: Sonnet hallucinated "Cosmic Eclipse" for Unbroken Bonds Gardevoir & Sylveon,
// "Paradox Rift" for Prismatic Evolutions Pikachu ex 179/131 PRE. Testing if Opus reasoning
// improves recent-set disambiguation.
// If Opus matches Sonnet exactly across 3+ test cards, revert to Sonnet for cost (claude-sonnet-4-6).
// If Opus is meaningfully more accurate on set names, keep Opus despite 5x cost over Sonnet, ~25x over Haiku.
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 60;

type IdentifyResult = {
  cardName: string;
  set: string;
  cardNumber: string;
  variant: string;
  era: string;
  language: string;
  variantFlag: string;
  confidence: "high" | "medium" | "low";
};

const cardSchema = {
  type: "object",
  properties: {
    cardName: { type: "string" },
    set: { type: "string" },
    cardNumber: { type: "string" },
    variant: { type: "string" },
    era: { type: "string" },
    language: { type: "string" },
    variantFlag: { type: "string" },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
  },
  required: ["cardName", "set", "cardNumber", "variant", "era", "language", "variantFlag", "confidence"],
  additionalProperties: false,
} as const;

const SYSTEM_PROMPT = `You are a Pokemon TCG card identifier. Given a photo, identify the card. Return STRICTLY a JSON object with these fields: cardName, set, cardNumber, variant (Regular/Reverse Holo/Full Art/SIR/SAR/Promo), era, language (EN/JP/ZH-S/ZH-T/KR), variantFlag (empty string or 'Verify [feature]'), confidence (high/medium/low). If you cannot identify confidently, return confidence='low' but still return your best guess.

VARIANT DETECTION RULES — CRITICAL:

The card's printed NUMBER is the truth source for variant, NOT visual style.

For Sun & Moon era Pokemon TCG (sets like Unbroken Bonds /214, Cosmic Eclipse /236, Team Up /181, Hidden Fates /68a, Detective Pikachu /18, etc.):

DECISION RULE based on the printed number (format: X/Y where X is print number, Y is set total):
1. If X is significantly less than Y (ratio X/Y < 0.95): variant is 'Regular Holo' or 'Non-Holo' (the standard print). Example: 130/214 → ratio 0.61 → Regular Holo.
2. If X is at or just below Y (ratio X/Y between 0.95 and 1.0): variant MAY be 'Full Art'. Example: 205/214 → ratio 0.96 → Full Art.
3. If X is GREATER than Y (X > Y): variant is 'Secret Rare' / 'Rainbow Rare' / 'Alt Art' / 'Gold'. Example: 225/214 → X > Y → Rainbow Rare.

WARNING — DO NOT BE FOOLED BY VISUAL STYLE:
- Modern Tag Team Regular Holo prints have dynamic borderless artwork that LOOKS like Full Art
- Holo shimmer, dynamic poses, full-character bleed = NOT diagnostic of Full Art
- The PRINTED NUMBER on the card is the only reliable variant signal
- A 'TAG TEAM' label on the card does not mean 'Full Art' — Tag Team cards exist in Regular Holo, Full Art, and Alt Art prints with different numbers

EXAMPLES:
- Gardevoir & Sylveon GX 130/214 (Unbroken Bonds): variant='Regular Holo' (NOT Full Art, despite dynamic art)
- Gardevoir & Sylveon GX 205/214 (Unbroken Bonds): variant='Full Art'
- Gardevoir & Sylveon GX 225/214 (Unbroken Bonds): variant='Rainbow Rare'
- Reshiram & Charizard GX 020/214 (Unbroken Bonds): variant='Regular Holo'
- Reshiram & Charizard GX 217/214 (Unbroken Bonds): variant='Rainbow Rare'

If you cannot clearly read the card number from the image, set variant to 'Unknown' rather than guessing from visual style.`;

function inferMediaType(b64: string): "image/jpeg" | "image/png" | "image/webp" | "image/gif" {
  // base64 magic bytes: /9j/ = JPEG, iVBOR = PNG, UklGR = WEBP, R0lGOD = GIF
  if (b64.startsWith("/9j/")) return "image/jpeg";
  if (b64.startsWith("iVBOR")) return "image/png";
  if (b64.startsWith("UklGR")) return "image/webp";
  if (b64.startsWith("R0lGOD")) return "image/gif";
  return "image/jpeg";
}

export async function POST(req: Request) {
  let body: { imageBase64?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const raw = (body.imageBase64 ?? "").trim();
  if (!raw) {
    return NextResponse.json({ error: "missing_image" }, { status: 400 });
  }
  const imageBase64 = raw.includes(",") ? raw.split(",", 2)[1].trim() : raw;
  const mediaType = inferMediaType(imageBase64);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[identify-card] ANTHROPIC_API_KEY missing");
    return NextResponse.json({ error: "identification_failed" }, { status: 502 });
  }

  const client = new Anthropic({ apiKey });

  console.log(
    "[identify-card] starting, payload:",
    JSON.stringify({ imageBytes: imageBase64.length, mediaType }).slice(0, 200),
  );
  const t0 = Date.now();

  try {
    const response = await client.messages.create(
      {
        model: "claude-opus-4-7",
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: mediaType, data: imageBase64 },
              },
              { type: "text", text: "Identify this Pokemon TCG card." },
            ],
          },
        ],
        output_config: {
          format: { type: "json_schema", schema: cardSchema },
        },
      },
      { timeout: 55_000 },
    );

    console.log(
      `[identify-card] Anthropic call complete in ${Date.now() - t0}ms, stop_reason=${response.stop_reason}`,
    );

    const textBlock = response.content.find(
      (b): b is Anthropic.TextBlock => b.type === "text",
    );
    if (!textBlock?.text) {
      console.error("[identify-card] no text block in response");
      return NextResponse.json({ error: "identification_failed" }, { status: 502 });
    }

    let parsed: IdentifyResult;
    try {
      parsed = JSON.parse(textBlock.text);
    } catch (e) {
      console.error("[identify-card] JSON parse failed:", textBlock.text.slice(0, 200));
      return NextResponse.json({ error: "identification_failed" }, { status: 502 });
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[identify-card] error:", err);
    console.error(`[identify-card] failed after ${Date.now() - t0}ms`);
    if (err instanceof Anthropic.APIConnectionTimeoutError) {
      console.error("[identify-card] timeout after 55s");
      return NextResponse.json({ error: "identification_failed" }, { status: 502 });
    }
    if (err instanceof Anthropic.APIError) {
      console.error("[identify-card] Anthropic API error:", err.status, err.message);
      return NextResponse.json({ error: "identification_failed" }, { status: 502 });
    }
    return NextResponse.json({ error: "identification_failed" }, { status: 502 });
  }
}
