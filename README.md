# Curator OS — landing page

Next.js 14 + TypeScript + Tailwind landing page for Curator OS, an AI-powered Pokemon TCG market intelligence platform for collectors and vendors across Asia-Pacific (MY / SG / JP / HK / TW).

## Stack

- Next.js 14 App Router, TypeScript
- Tailwind CSS, Inter via `next/font`
- Resend for email capture
- Deploy target: Vercel

## Local development

```bash
cp .env.local.example .env.local
# fill in RESEND_API_KEY, NOTIFY_EMAIL, FROM_EMAIL
npm install
npm run dev
```

Open http://localhost:3000.

### Environment variables

| Name             | Purpose                                                    |
| ---------------- | ---------------------------------------------------------- |
| `RESEND_API_KEY` | Resend API key (`re_...`)                                  |
| `NOTIFY_EMAIL`   | Where waitlist signups are forwarded                       |
| `FROM_EMAIL`     | Verified sender on Resend (e.g. `Curator OS <hi@host.tld>`) |

If `RESEND_API_KEY` or `NOTIFY_EMAIL` is unset, the API route returns 500 and logs a clear server-side message — the form will surface a generic error to the user.

## Project layout

```
app/
  api/waitlist/route.ts    POST handler — validates + emails via Resend
  globals.css              Tailwind + design tokens
  layout.tsx               Root layout (Inter font)
  page.tsx                 Single-page composition
components/
  Hero.tsx                 Headline + email + segment buttons
  Pillars.tsx              Three-pillar row
  VerdictDemo.tsx          Same card, two verdicts
  Founder.tsx              Curator note (navy block)
  SegmentForms.tsx         Tabbed collector / vendor forms
  Footer.tsx               Disclaimer + coverage
tailwind.config.ts         Bloomberg-terminal palette
```

## Scripts

- `npm run dev` — local dev server
- `npm run build` — production build
- `npm run start` — run production build
- `npm run lint` — Next/ESLint
- `npm run typecheck` — `tsc --noEmit`

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import the repo on [vercel.com/new](https://vercel.com/new).
3. Add the three env vars (`RESEND_API_KEY`, `NOTIFY_EMAIL`, `FROM_EMAIL`) in **Project Settings → Environment Variables**.
4. Deploy. The default build command and output directory work as-is.

## Design notes

The visual direction is Bloomberg Terminal, not Pokemon Center: navy `#1F2A44` primary, off-white `#F5F5F0` surface, accent red `#C44536` used sparingly. Sentence case throughout — no all-caps shouting, no emoji UI, no mascots. Mobile-first responsive grid.
