# CV

A résumé that lives as a web page and prints itself to PDF, so there is one
source of truth for the content and no hand-edited document to keep in sync.

Several versions of the CV are kept side by side — one aimed at Go roles, one
hardened against automated screening, one older payments-focused version — and
each is served at its own URL.

## Running it

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

| Command | What it does |
| --- | --- |
| `pnpm dev` | Development server |
| `pnpm build` / `pnpm start` | Production build and server |
| `pnpm check:fix` | Lint and format (Biome, not ESLint/Prettier) |
| `pnpm cv:pdf` | Writes every version to `generated-cvs/` (needs the app running) |

## Editing the content

Each version is one file under `src/data/`, exporting a `RESUME_DATA` object.
`src/data/resumes.ts` is the registry: it lists the versions, their URL slugs,
and a `note` describing what makes each one different. That note is what the
**My resumes** tab shows.

Adding a version means adding a data file and one entry in the registry. The
route, the sitemap, the version list and the PDF endpoint all read from it.

## The screen

Three tabs plus a download button:

- **CV** — the résumé
- **JSON** — the same data as JSON
- **My resumes** — every version; selecting one opens it

`CMD+J` opens a command menu with the same actions.

## How the PDF is made

The point of this project is that the PDF is the web page, printed by the same
browser engine that renders it — not a separate document, and not a screenshot.

```
  browser                          server
  ───────                          ──────
  Download button
  or CMD+J → Download PDF
        │
        │  GET /api/pdf/<slug>
        ├───────────────────────────────►  src/app/api/pdf/[variant]/route.ts
        │                                    │ validates the slug against the registry
        │                                    │
        │                                    ▼
        │                                  src/lib/pdf/render-resume.ts
        │                                    │ drives headless Chrome over
        │                                    │ http://<origin>/<slug>
        │                                    │ with print CSS applied
        │                                    ▼
        │                                  src/lib/pdf/browser.ts
        │  200, application/pdf              │ one reused Chrome instance
        │  Content-Disposition: attachment   │
        ◄───────────────────────────────┘
        │
  blob → <a download> → file saved
```

`src/lib/pdf/render-resume.ts` is the only place that holds the render
settings, so the download endpoint and `pnpm cv:pdf` cannot drift apart. Every
setting in it is load-bearing and commented in place — in particular it waits
for `document.fonts.ready`, without which Chrome prints before the web fonts
load and silently falls back to Arial.

On the browser side, `useCvDownload` in `src/components/download-cv-button.tsx`
is the single client of that endpoint, shared by the toolbar button and the
command menu.

### Print CSS

`src/app/globals.css` holds an `@media print` block that decides what the PDF
looks like: page margins, root font size, page-break rules, and a swap from the
variable Inter to static Inter faces. That swap is not cosmetic — Chrome cannot
embed a variable font instance as ordinary TrueType and falls back to Type 3
subsets whose encodings collide, which corrupts the text layer for résumé
parsers. The reasoning is written out in the file.

The block also neutralises the tab panel's animation, because a CSS transform on
an ancestor makes it the containing block and stops Chrome honouring the
page-break rules.

### Fonts on the server

`puppeteer-core` drives an already-installed Chrome rather than downloading its
own, so the output matches what `CMD+P` produces on the same machine. Set
`CHROME_PATH` if it is not in a standard location.

The CV body uses Tailwind's `font-serif`, which resolves to the *generic* serif
family — so the printed body uses a system font, not a self-hosted one. Any
container therefore has to supply a serif that Chrome can embed as TrueType.
The Dockerfile installs `font-liberation` for exactly this reason; the more
common `ttf-freefont` yields a Type 3 font and breaks the text layer.

## Docker

```bash
docker compose build
docker compose up -d
```

The image installs Chromium and sets `CHROME_PATH`, so the PDF endpoint works
inside the container.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS 3 · shadcn/ui · Biome ·
puppeteer-core · Apollo Server (a read-only GraphQL view of the data at
`/graphql`)
