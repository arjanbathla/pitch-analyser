# Pitch Analyser

Paste unstructured text about a company and get back a structured, validated analysis: sector, stage, a summary, strengths, risks, an investability score (0–100), and the reasoning behind it.

**Live demo:** https://pitch-analyser.vercel.app

## How it works

1. The browser sends the pasted text to a server-side route (`/api/analyze`).
2. That route calls Google's Gemini API (`gemini-2.5-flash`) with the system prompt, `temperature: 0`, and JSON response mode.
3. The model's output is parsed and validated against a Zod schema. If it doesn't match, the route re-prompts the model **once** with the validation errors; if it fails again, it returns a clean error.
4. The validated result is saved to Supabase and returned to the page, which renders it and refreshes the history list.

```
browser ──POST /api/analyze──▶ route handler ──▶ Gemini (JSON mode, temp 0)
                                     │
                                     ├─ strip fences ▶ JSON.parse ▶ Zod safeParse
                                     │      └─ on failure: re-prompt once with the errors
                                     │
                                     ├─ insert row ▶ Supabase
                                     └─ return validated data ▶ rendered on the page
browser ──GET /api/history──▶ route handler ──▶ Supabase (recent 20)
```

## Stack

- **Next.js 14** (App Router) + **TypeScript** + **React**
- **Tailwind CSS**
- **Google Gemini** via `@google/generative-ai` — called only from a server route, so the key never reaches the browser
- **Zod** for the output schema and validation
- **Supabase** (Postgres) for persistence and the history list

## Why these choices

- **`temperature: 0`** — this is a structured-extraction task, not a creative one. Low randomness gives near-reproducible output and keeps the model disciplined about the JSON-only format.
- **JSON mode + Zod, not one or the other** — Gemini's `responseMimeType: "application/json"` guarantees the output *parses*, but not that it matches our schema. Zod guarantees the *shape and types*. The Zod schema also generates the TypeScript type used on the client, so one schema validates the data and types the UI.
- **Single re-prompt, not a loop** — one well-informed retry fixes most schema mismatches; beyond that, retrying just burns tokens, so we fail cleanly.
- **Secret key, server-side only** — all database access happens in route handlers. The Supabase secret key has no `NEXT_PUBLIC_` prefix, so it stays on the server.

## Running locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the env template and fill it in:
   ```bash
   cp .env.example .env.local
   ```
   - `GEMINI_API_KEY` — free key from https://aistudio.google.com/app/apikey
   - `SUPABASE_URL` — your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` — your Supabase **secret** key (not the publishable one)
3. Create the table in the Supabase SQL editor:
   ```sql
   create table if not exists analyses (
     id uuid primary key default gen_random_uuid(),
     created_at timestamptz not null default now(),
     company_name text not null,
     sector text,
     stage text,
     summary text,
     strengths jsonb,
     risks jsonb,
     investability_score int,
     reasoning text,
     source_text text
   );
   alter table analyses enable row level security;
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```
   Open the URL it prints (http://localhost:3000 unless that port is taken).

## Project layout

```
src/
├── app/
│   ├── page.tsx              # input form + result + history
│   └── api/
│       ├── analyze/route.ts  # Gemini call + Zod guard + Supabase insert
│       └── history/route.ts  # recent analyses
├── components/
│   ├── Result.tsx            # renders one analysis
│   └── History.tsx           # the history list
└── lib/
    ├── prompt.ts             # the system prompt
    ├── schema.ts             # the Zod schema (and inferred type)
    └── supabase.ts           # server-side Supabase client
```

## Prompt iterations

See [PROMPTS.md](./PROMPTS.md) for the history of changes to the system prompt.
