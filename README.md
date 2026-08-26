# CV

A CV that lives as a web page and prints itself to PDF, so there is one source
of truth for the content and no hand-edited document to keep in sync.

Anyone can use it. There is no sign-up: a visitor gets a workspace on their
first visit, keeps as many versions of their CV as they like, and each one is
served at its own URL.

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
| `pnpm cv:import <userId>` | Loads the CVs in `src/data` into one account (local only) |

## The screen

Three tabs plus a download button:

- **CV** — the CV itself
- **Edit** — the same data as editable JSON (read-only for non-owners)
- **My resumes** — every version you own; selecting one opens it

`CMD+J` opens a command menu with the same actions.

## Users, and who owns what

There is no sign-up. The first visit mints a UUIDv7, stores it in a first-party
httpOnly cookie, and creates a user row with one starter CV. Everything that
visitor writes belongs to that id.

    /                        landing; returning visitors are redirected in
    /:userId/:cvSlug         one CV
    /api/pdf/:userId/:cvSlug its PDF

**Fingerprinting was considered and rejected.** The open-source libraries offer
40–80% uniqueness, which means different people collide — and a collision here
would show one person another person's CV, phone number included. A cookie is
exact. The cost is that clearing cookies, or switching browser, loses access;
that is the honest trade, and the alternative silently leaks data.

**The URL is the credential — for reading *and* writing.** Anyone holding a
link can read that CV, download its PDF, edit it, and add CVs to that
workspace. That is the deliberate trade for having no registration: the
unguessable id in the path is the whole permission model.

    PUT  /api/cvs/:userId/:cvSlug   overwrite that CV
    POST /api/cvs/:userId           add one to that workspace

The cookie confers nothing. It only remembers which workspace to send a
returning visitor back to.

What follows from that, and is worth keeping in mind:

- A link shared with anyone is edit access granted to anyone. There is no undo
  and no history — an overwrite is final.
- CV pages are `noindex` and absent from the sitemap.
- The Referrer-Policy is `strict-origin-when-cross-origin` and outbound links
  carry `noreferrer`, so the path never travels to another site. Without that,
  clicking a GitHub link on a CV would hand GitHub's logs an edit-capable URL.
- The visit tracker reports `/:workspace/my-cv`, not the real path, so
  credentials do not end up in the analytics store beside an IP address.

## Editing through the JSON tab

The JSON tab is a text field, not a viewer. Editing it enables **Save** and
**Save as new CV**; neither is enabled until something changes and the JSON
still parses. Non-owners get a read-only editor and no buttons — and the API
refuses them regardless, because hiding controls is presentation, not security.

`summary` is the one field that changes shape: the seed files write it as JSX
and it is stored as a string, so a JSX summary does not come back as JSX.

## How the PDF is made

The point of this project is that the PDF is the web page, printed by the same
browser engine that renders it — not a separate document, and not a screenshot.

```
  browser                          server
  ───────                          ──────
  Download button
  or CMD+J → Download PDF
        │
        │  GET /api/pdf/<userId>/<slug>
        ├───────────────────────────────►  src/app/api/pdf/[userId]/[cvSlug]/route.ts
        │                                    │ looks the CV up by (user, slug)
        │                                    │
        │                                    ▼
        │                                  src/lib/pdf/render-resume.ts
        │                                    │ drives headless Chrome over
        │                                    │ http://127.0.0.1:<port>/<userId>/<slug>
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
settings, so nothing can drift apart. Every setting in it is load-bearing and commented in place — in particular it waits
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

It also keeps the tab panel free of transforms, because a CSS transform on an
ancestor makes it the containing block and stops Chrome honouring the
page-break rules.

### Fonts on the server

`puppeteer-core` drives an already-installed Chrome rather than downloading its
own, so the output matches what `CMD+P` produces on the same machine. Set
`CHROME_PATH` if it is not in a standard location.

The body is set in Source Serif 4, self-hosted, with static faces swapped in for
print for the same Type 3 reason as Inter. `font-liberation` is still installed
in the image as the fallback if that ever fails to load — the more common
`ttf-freefont` yields a Type 3 font and breaks the text layer.

## Storage

SQLite, one file, through `better-sqlite3`. Two tables: `users` and `cvs`. Only
the CV JSON is stored — PDFs are always rendered on demand and never persisted.

`DATABASE_PATH` points at the file; the deployed image sets it to a mounted
volume, so the data outlives the container. Without that volume every deploy
would silently start everyone from scratch.

Note that both Dockerfile stages are Alpine on purpose: the runtime reuses
node_modules from the build stage, and a native module built against glibc will
not load on musl.

## Your own CVs

The files under `src/data` are personal résumés, not the starter template — a
new visitor gets `src/data/starter-template.ts`, which is deliberately nobody's
CV. Seeding strangers with a real one would hand them somebody's email, phone
number and employment history on a public URL.

To load the real ones into an account:

```bash
pnpm dev
pnpm cv:import <userId>    # the cv_uid cookie value, also in your URL
```

Local only; the endpoint refuses in production.

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
