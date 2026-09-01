# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**buildcv** — a free, no-sign-up CV builder (Next.js 14, React, TypeScript, Tailwind CSS). Every visitor gets their own workspace of CVs, edits them in place on the page, and downloads a PDF rendered by headless Chrome from the same page.

## Commands

### Development
```bash
pnpm dev          # Start development server on http://localhost:3000
pnpm build        # Create production build
pnpm start        # Start production server
pnpm test         # Run the vitest suite (test/)
pnpm lint         # Run Biome linting checks
pnpm check:fix    # Biome lint + format with auto-fix
pnpm cv:import <userId>  # Load src/data CVs into one account (local only)
```

### Docker Deployment
```bash
docker compose build     # Build the container
docker compose up -d     # Run the container
```

**Note**: The project uses **Biome.js** for linting and formatting instead of ESLint and Prettier. Always run `pnpm check:fix` before committing, and `pnpm test` to run the suite.

## Architecture

### Project Structure
- **`/src/app/`** - App Router pages, layout, API routes
- **`/src/components/resume/`** - The CV renderer sections (Header, Summary, WorkExperience, Education, Skills)
- **`/src/components/workspace/`** - Guides/edit-mode machinery: `use-page-guides` (page overlay + contenteditable), `dom-edit` (direct DOM edits)
- **`/src/components/`** - Workspace shell, dialogs, command menu, shadcn/ui pieces
- **`/src/lib/edit/`** - Pure edit logic: `collect-resume` (DOM → JSON), `set-by-path`, `page-boundaries` (pagination math). Covered by tests.
- **`/src/lib/db/`** - SQLite access (`index.ts` connection + schema, `queries.ts` all reads/writes)
- **`/src/lib/pdf/`** - PDF pipeline (`render-resume.ts` settings, `browser.ts` Chrome, `filename.ts`)
- **`/test/`** - vitest suite (pure logic, DOM collection via happy-dom, db queries against a temp SQLite file)

### Key Technologies
- Next.js 14 App Router · TypeScript · Tailwind CSS 3 · shadcn/ui (Radix) · Biome · vitest · puppeteer-core · better-sqlite3

## Development Notes

### Adding New Sections
CV content lives in the database, one JSON blob per CV. `src/lib/resume-json.ts` defines the editable shape; the renderer components read it directly.

### Fonts and first paint

The screen fonts are self-hosted variable WOFF2 files (`public/fonts`), declared in `globals.css` and **preloaded from the root layout** (`PRELOADED_FONTS`), so the first paint is already in the final fonts. `Inter Fallback` / `Source Serif Fallback` are metric-matched local fallbacks (size-adjust etc. computed with fontTools) so nothing shifts even when the swap happens. Do not add a route-level `loading.tsx` skeleton back — the page must render once, in its final style. If you replace a font file, recompute the fallback metrics.

### Print Optimization
The app includes special print styles (`@media print` in globals.css) to ensure the CV looks good when printed. Test print functionality when making layout changes.

### Users and storage

No sign-up. The first visit mints a UUIDv7 into an httpOnly `cv_uid` cookie and
creates a user with one starter CV. Data lives in SQLite (`better-sqlite3`),
at `DATABASE_PATH` — a mounted volume in production.

- **`src/lib/user.ts`** — reads the cookie, creates users. Cookies can only be
  *set* in a route handler, which is why `/api/session/start` exists; Next 14
  middleware runs on the edge, where better-sqlite3 cannot load.
- **`src/lib/db/queries.ts`** — every read and write takes `(userId, slug)`, so
  a caller cannot reach another workspace by passing a slug alone.
- **Anyone holding the URL may read and write.** No registration, so the id in
  the path is the whole credential; the cookie confers nothing. Do not add an
  ownership check to the write routes — that is the intended model.
- Because the path is a credential it must not leak: keep the `noreferrer` on
  outbound links, the `strict-origin-when-cross-origin` policy, and the
  `redactPath` call in `src/components/visit-tracker.tsx`. Structured data and
  the OG image must never contain the real path either.

Fingerprinting was rejected deliberately: 40–80% uniqueness means collisions,
and a collision would show one person another's CV. Do not reintroduce it as an
identity mechanism. (FingerprintJS in the visit tracker is analytics grouping
only — never identity.)

New users are seeded with two CVs via `src/data/starter-template.ts`: the cat
CV (`src/data/cocks-cv.ts`, slug `cocks`, the default) and the human example
(`src/data/default-cv.tsx`, slug `human`) — a real CV, contact details
included. Chosen deliberately over a placeholder skeleton; do not "fix" it by
blanking the contact fields without asking.

### PDF Generation

`CMD+J` → **Download PDF**, or the toolbar button, saves the current CV without
the print dialog. `/api/pdf/[userId]/[cvSlug]` drives headless Chrome over the
same page and the same `@media print` CSS.

- **`src/lib/pdf/render-resume.ts`** — the only place holding the render
  settings. Each is load-bearing and documented in the file; in particular it
  waits for `document.fonts.ready`, without which Chrome prints before the
  static faces load and falls back to Arial.
- **`src/lib/pdf/browser.ts`** — one reused Chrome, plus the `CHROME_PATH` lookup.
- **`src/lib/pdf/page-background.ts`** — paints the @page margins in the CV's
  theme color after the render. Chrome clips every paint (canvas background
  included) to the area inside the @page margins, so no CSS can color them; a
  themed CV came out framed in printer-white until the PDF was post-processed
  with pdf-lib.
- The route prints over `http://127.0.0.1:$PORT`, never the request origin:
  behind the proxy that resolved to `https://localhost:3000` and every render
  failed with `ERR_SSL_PROTOCOL_ERROR`.
- Both Dockerfile stages are Alpine so the native module loads at runtime.
- Printing swaps the variable fonts for static faces (`Inter Static`,
  `Source Serif Static`): Chrome embeds a variable font instance as Type 3
  subsets whose encodings collide and corrupt the PDF text layer.

### Testing

`pnpm test` runs vitest. The suite covers the pure logic (`lib/edit/*`,
`validate-resume`, `resume-json`, `pdf/filename`), the DOM→JSON collection
with happy-dom, and `lib/db/queries` against a real SQLite file in a temp dir
(`DATABASE_PATH` is read at first import — set it before importing). The
`server-only` package is aliased to a stub in `vitest.config.ts`.

### Deployment
Kamal v2 to a shared VPS behind kamal-proxy, at buildcv.cc. See `config/deploy.yml`. The `cv_web_data` volume holds the SQLite file and must not be removed — it is the only copy of every user's CVs.
