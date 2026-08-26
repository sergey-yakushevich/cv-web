# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Minimalist CV/Resume web application** built with Next.js 14, React, TypeScript, and Tailwind CSS. The app renders a clean, print-friendly CV layout with data configured in a single file.

## Commands

### Development
```bash
pnpm dev          # Start development server on http://localhost:3000
pnpm build        # Create production build
pnpm start        # Start production server
pnpm lint         # Run Biome linting checks
pnpm lint:fix     # Run Biome linting with auto-fix
pnpm format       # Check code formatting with Biome
pnpm format:fix   # Format code with Biome
pnpm check        # Run both linting and formatting checks
pnpm check:fix    # Run both linting and formatting with auto-fix
pnpm cv:import <userId>  # Load src/data CVs into one account (local only)
```

### Docker Deployment
```bash
docker compose build     # Build the container
docker compose up -d     # Run the container
docker compose down      # Stop the container
```

**Note**: The project uses **Biome.js** for linting and formatting instead of ESLint and Prettier. Always run `pnpm check:fix` before committing to ensure code quality.

## Architecture

### Project Structure
- **`/src/app/`** - Next.js App Router pages and layouts
- **`/src/components/`** - Reusable UI components (using shadcn/ui)
- **`/src/data/resume-data.tsx`** - Single configuration file for all CV content
- **`/src/apollo/`** - GraphQL server setup with resolvers and type definitions
- **`/src/images/logos/`** - Company logo components

### Key Technologies
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript with decorators enabled
- **Styling**: Tailwind CSS with custom theme extensions
- **UI Components**: shadcn/ui (Radix UI based)
- **GraphQL**: Apollo Server with type-graphql at `/graphql` endpoint
- **Command Palette**: cmdk library for keyboard navigation
- **Print Optimization**: Custom print styles in global CSS

### Important Files
- **`src/data/resume-data.tsx`** - Main configuration file containing all CV data (personal info, work experience, education, skills, projects)
- **`src/app/page.tsx`** - Main resume page component that renders the CV
- **`src/app/layout.tsx`** - Root layout with metadata and analytics
- **`src/components/command-menu.tsx`** - Keyboard shortcuts (Cmd+K) for navigation
- **`src/components/print-drawer.tsx`** - Print functionality component

## Development Notes

### Adding New Sections
CV content lives in the database, one JSON blob per CV. `src/lib/resume-json.ts` defines the editable shape; the renderer components read it directly.

### GraphQL API
The app exposes a GraphQL endpoint at `/graphql` that serves the resume data. This can be used to integrate the CV data with other applications.

### Print Optimization
The app includes special print styles to ensure the CV looks good when printed. Test print functionality when making layout changes.

### Users and storage

No sign-up. The first visit mints a UUIDv7 into an httpOnly `cv_uid` cookie and
creates a user with one starter CV. Data lives in SQLite (`better-sqlite3`),
two tables, at `DATABASE_PATH` — a mounted volume in production.

- **`src/lib/user.ts`** — reads the cookie, creates users. Cookies can only be
  *set* in a route handler, which is why `/api/session/start` exists; Next 14
  middleware runs on the edge, where better-sqlite3 cannot load.
- **`src/lib/db/queries.ts`** — every CV read takes `(userId, slug)` so a caller
  cannot reach another account by passing a slug alone.
- Writes take the owner from the cookie, never the URL or body.

Fingerprinting was rejected deliberately: 40–80% uniqueness means collisions,
and a collision would show one person another's CV. Do not reintroduce it as an
identity mechanism.

`src/data/*` are Sergey's real CVs and are **not** what new users get — that is
`src/data/starter-template.ts`. Keep it that way.

### PDF Generation

`CMD+J` → **Download PDF**, or the toolbar button, saves the current CV without
the print dialog. `/api/pdf/[userId]/[cvSlug]` drives headless Chrome over the
same page and the same `@media print` CSS.

- **`src/lib/pdf/render-resume.ts`** — the only place holding the render
  settings. Each is load-bearing and documented in the file; in particular it
  waits for `document.fonts.ready`, without which Chrome prints before the
  static faces load and falls back to Arial.
- **`src/lib/pdf/browser.ts`** — one reused Chrome, plus the `CHROME_PATH` lookup.
- The route prints over `http://127.0.0.1:$PORT`, never the request origin:
  behind the proxy that resolved to `https://localhost:3000` and every render
  failed with `ERR_SSL_PROTOCOL_ERROR`.
- Both Dockerfile stages are Alpine so the native module loads at runtime.

### Deployment
Kamal v2 to a shared VPS behind kamal-proxy, at buildcv.cc. See `config/deploy.yml`. The `cv_web_data` volume holds the SQLite file and must not be removed — it is the only copy of every user's CVs.