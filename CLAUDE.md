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
pnpm cv:pdf       # Write every CV version to generated-cvs/ (needs the app running)
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
To add new sections to the CV, modify the `RESUME_DATA` object in `src/data/resume-data.tsx`. The layout automatically adjusts based on the data provided.

### GraphQL API
The app exposes a GraphQL endpoint at `/graphql` that serves the resume data. This can be used to integrate the CV data with other applications.

### Print Optimization
The app includes special print styles to ensure the CV looks good when printed. Test print functionality when making layout changes.

### PDF Generation
`CMD+J` → **Download PDF** saves the current CV version without the print dialog. The request goes to `/api/pdf/[variant]`, which drives headless Chrome over the same page and the same `@media print` CSS, so the result matches `CMD+P`.

- **`src/lib/pdf/render-resume.ts`** — the only place that holds the render settings. Both the API route and `pnpm cv:pdf` call it, so they cannot drift apart. Each setting is load-bearing and documented in the file; in particular it waits for `document.fonts.ready`, without which Chrome prints before the Inter Static faces load and silently falls back to Arial.
- **`src/lib/pdf/browser.ts`** — one reused Chrome instance, and the `CHROME_PATH` lookup. Uses `puppeteer-core`, so it drives an installed Chrome instead of downloading a second one.
- The route must stay `runtime = "nodejs"` and `dynamic = "force-dynamic"`.

### Editing (JSON tab)

`PUT /api/resumes/[variant]` overwrites a version's data file; `POST /api/resumes` creates one and registers it in `resumes.ts`. Both go through `src/lib/resume-file.ts`, which owns validation, file rendering and the registry splice.

These write into the source tree, so `editingEnabled()` refuses them in production unless `CV_ENABLE_EDITING=1`. Do not remove that guard.

`summary` round-trips as a string, not JSX, and `avatarUrl` is not part of the editable JSON — see the note on `EditableResume` in `src/lib/resume-json.ts`.

**Font warning**: the CV body uses Tailwind's `font-serif`, which resolves to the *generic* serif family, not to a self-hosted font. The printed body is therefore whatever serif the host provides — Times on macOS. Any container must supply a serif that Chrome can embed as TrueType. The Dockerfile installs `font-liberation` for this reason; `ttf-freefont` produces a Type 3 font and corrupts the text layer for CV parsers.

### Deployment
The app is optimized for Vercel deployment but can be deployed anywhere that supports Next.js applications. Docker support is included for containerized deployments.