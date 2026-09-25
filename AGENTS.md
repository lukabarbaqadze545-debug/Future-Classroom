<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Future Classroom — notes for contributors and agents

- Stack: Next.js 16 App Router + TypeScript + Tailwind v4, SQLite (better-sqlite3), Vitest, Playwright. See README.md.
- Service layer lives in `src/lib/services/*` (server-only); API routes in `src/app/api/**` are thin wrappers using `handler()` from `src/lib/http/api.ts` (same-origin check, zod validation, error mapping).
- Never send answer keys, unlocked-later hints or solutions to student clients; grade on the server.
- AI goes through `src/lib/ai` (`getAIProvider()`); every AI feature needs an offline path that is labelled honestly in the UI.
- UI strings: add to `src/lib/i18n/en.ts` first, then `ka.ts` (type-checked). Count strings use `{ one, other }` with `fmtCount()`.
- Before committing: `npm run check` (typecheck, lint, unit tests); for flow changes also `npm run test:e2e`.
