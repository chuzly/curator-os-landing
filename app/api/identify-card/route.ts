import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 30;

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

const SYSTEM_PROMPT = `You are a Pokemon TCG card identifier. Given a photo, identify the card. Return STRICTLY a JSON object with these fields: cardName, set, cardNumber, variant (Regular/Reverse Holo/Full Art/SIR/SAR/Promo), era, language (EN/JP/ZH-S/ZH-T/KR), variantFlag (empty string or 'Verify [feature]'), confidence (high/medium/low). If you cannot identify confidently, return confidence='low' but still return your best guess.`;

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

  try {
    const response = await client.messages.create(
      {
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
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
      { timeout: 20_000 },
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
    if (err instanceof Anthropic.APIConnectionTimeoutError) {
      console.error("[identify-card] timeout after 20s");
      return NextResponse.json({ error: "identification_failed" }, { status: 502 });
    }
    if (err instanceof Anthropic.APIError) {
      console.error("[identify-card] Anthropic API error:", err.status, err.message);
      return NextResponse.json({ error: "identification_failed" }, { status: 502 });
    }
    console.error("[identify-card] unexpected:", err);
    return NextResponse.json({ error: "identification_failed" }, { status: 502 });
  }
}
