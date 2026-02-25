# Channel Audit

Next.js 16 + React 19 + TypeScript + Tailwind 4 + Supabase + Gemini 2.5 Flash AI (DeepSeek fallback).
Custom domain: audit.youtubeproducer.app

## Frontend Design System

Follow the YouTube Producer design system: `~/.claude/projects/-Users-beckyisjwara/memory/youtube-producer-design.md`

**Brand**: Studio Clean — light mode, teal accent, Manrope, gradients for premium feel.
**Key rule**: Every YouTube Producer tool should feel like it belongs to the same family.

## Dev

- `npm run dev` → localhost:3000
- Env vars: YOUTUBE_API_KEY, GEMINI_API_KEY, DEEPSEEK_API_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY, STRIPE_SECRET_KEY, STRIPE_PRICE_ID, STRIPE_WEBHOOK_SECRET, RESEND_API_KEY

## Architecture

- 2-step API pipeline: /api/analyze (resolve channel + fetch all videos + run analysis) → /api/recommendations (AI-generated)
- Paywall: 1st audit anonymous, 2nd-3rd require sign-in, 4th+ require Pro ($19/mo shared with Packager + Carousel)
- Supabase table: `channel_audits` (jsonb for analysis_data and recommendations)
- Analysis engine: `src/lib/analysis.ts` — pure functions for performance tiers, title patterns, duration buckets, format split, upload cadence
- 60s timeout on analyze + recommendations routes (vercel.json)

## Key Files

- `src/lib/analysis.ts` — Core analysis engine (all quantitative analysis)
- `src/lib/ai.ts` — Gemini/DeepSeek with fallback, recommendation generation
- `src/lib/youtube.ts` — Channel resolution + full video pagination
- `src/app/page.tsx` — Main page with input → progress → report flow
- `src/components/AnalysisReport.tsx` — Container for all 8 report sections
