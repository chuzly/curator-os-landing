import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Survey closed May 24, 2026 (Founder ruling A2 Option A, 2026-07-04).
// Historical submissions preserved in Supabase `cardmania_submissions` (16 rows).
export async function POST() {
  return NextResponse.json(
    {
      error: "survey_closed",
      message:
        "The Card Mania 2026 survey closed on May 24, 2026 and no longer accepts submissions.",
    },
    { status: 410 }
  );
}

export async function GET() {
  return NextResponse.json(
    {
      error: "survey_closed",
      message:
        "The Card Mania 2026 survey closed on May 24, 2026 and no longer accepts submissions.",
    },
    { status: 410 }
  );
}
