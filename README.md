<p align="center">
  <img src="public/mascot.png" width="160" alt="buildcv mascot">
</p>

<h1 align="center">buildcv</h1>

<p align="center"><b>A CV that lives as a web page and prints itself to PDF.</b><br>
One source of truth for the content, no hand-edited document to keep in sync —
and no sign-up: your first visit mints a workspace, every CV gets its own URL,
and the PDF is the page itself, printed by the same browser engine that renders it.</p>

<p align="center">
  <a href="https://buildcv.cc"><img src="https://img.shields.io/badge/live-buildcv.cc-blue" alt="Live at buildcv.cc"></a>
  <img src="https://img.shields.io/badge/Next.js-14-black" alt="Next.js 14">
  <img src="https://img.shields.io/badge/TypeScript-strict-blue" alt="TypeScript">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="MIT license">
</p>

## The screen

Three tabs plus a download button — `CMD+J` opens a command menu with the same
actions:

| Tab | What it does |
|---|---|
| 📄 **CV** | The CV itself, exactly as it will print. |
| ✏️ **Edit** | The same data as editable JSON. Save is enabled only when something changed and the JSON still parses; non-owners get a read-only editor and the API refuses their writes regardless. |
| 🗂 **My resumes** | Every version you own; selecting one opens it. |

## Features

- 🖨 **The PDF is the web page** — printed by headless Chrome from the same URL and the same `@media print` CSS, not a separate document and not a screenshot. What you see is what the recruiter's parser gets.
- 🔗 **No sign-up, no accounts** — the first visit mints a UUIDv7 into an httpOnly cookie and creates a workspace. The unguessable URL is the whole permission model: anyone holding a link can read and edit that CV.
- 📚 **Unlimited versions** — keep one CV per job target; each is served at its own URL and prints to its own PDF.
- 🔤 **A text layer that survives résumé parsers** — printing swaps variable fonts for pinned static faces, because Chrome embeds variable instances as Type 3 subsets that corrupt the PDF text layer. A test fails on any font file that regresses this.
- 🎨 **Themed pages, edge to edge** — Chrome clips all paint to inside the `@page` margins, so themed margins are painted into the PDF afterwards with pdf-lib.
- 🌱 **A worked example, not a skeleton** — new workspaces are seeded with a real, finished CV: achievement bullets with numbers, a headline stating the target title, badges per role.

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
| `pnpm test` | Run the vitest suite |
| `pnpm cv:import <userId>` | Loads the CVs in `src/data` into one account (local only) |

### Docker

```bash
docker compose build
docker compose up -d
```

The image installs Chromium and sets `CHROME_PATH`, so the PDF endpoint works
inside the container. Set `CHROME_PATH` yourself when running outside Docker
and Chrome is not in a standard location.

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

## How the PDF is made

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
settings, so nothing can drift apart. Every setting in it is load-bearing and
commented in place — in particular it waits for `document.fonts.ready`, without
which Chrome prints before the web fonts load and silently falls back to Arial.

`src/app/globals.css` holds the `@media print` block that decides what the PDF
looks like: page margins, root font size, page-break rules, and the swap from
variable to static font faces. It also keeps the tab panel free of transforms,
because a CSS transform on an ancestor becomes the containing block and stops
Chrome honouring the page-break rules.

`puppeteer-core` drives an already-installed Chrome rather than downloading its
own, so the output matches what `CMD+P` produces on the same machine.

## Storage

SQLite, one file, through `better-sqlite3`. Two tables: `users` and `cvs`. Only
the CV JSON is stored — PDFs are always rendered on demand and never persisted.

`DATABASE_PATH` points at the file; the deployed image sets it to a mounted
volume, so the data outlives the container. Both Dockerfile stages are Alpine
on purpose: the runtime reuses node_modules from the build stage, and a native
module built against glibc will not load on musl.

## The starter CV

A new visitor is seeded with a copy of `src/data/default-cv.tsx` — a real,
finished CV rather than an empty skeleton, because it demonstrates what good
looks like. To load the other CVs in `src/data` into an account:

```bash
pnpm dev
pnpm cv:import <userId>    # the cv_uid cookie value, also in your URL
```

Local only; the endpoint refuses in production.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS 3 · shadcn/ui · Biome ·
vitest · puppeteer-core · better-sqlite3

## License

MIT — started from Bartosz Jarocki's excellent
[cv](https://github.com/BartoszJarocki/cv) and rebuilt from there. Use it,
fork it, land the job.
