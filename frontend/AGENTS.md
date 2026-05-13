<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Layout

- `src/app/` — Next.js 16 App Router entry
- `src/components/` — UI (shadcn/ui + Tailwind v4)
- `src/hooks/`, `src/lib/`, `src/types/` — shared logic
- `tests/` — Vitest + Testing Library + MSW

## Commands

```bash
pnpm install
pnpm dev                # next dev
pnpm test               # vitest run
pnpm check              # biome check --write (auto-runs on every Edit via hook)
pnpm format             # biome format --write
pnpm build              # next build (must pass before declaring done)
```

## Conventions

- Biome is the formatter + primary linter. ESLint (`eslint.config.mjs`) keeps Next.js / core-web-vitals rules.
- Both configs are harness-locked: do not edit `biome.json` or `eslint.config.mjs`.
- Tailwind v4 — no `tailwind.config.ts`; design tokens live in `src/app/globals.css`.
- API mocking in tests via MSW (`tests/mocks/`).
