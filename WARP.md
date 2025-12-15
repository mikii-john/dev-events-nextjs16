# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Core Commands

This is a Next.js 16 App Router project created with `create-next-app`.

- Start dev server (hot reload on `app/**` and components):
  - `npm run dev`
- Production build:
  - `npm run build`
- Start production server (after `npm run build`):
  - `npm start`
- Lint the project (Next + TypeScript ESLint config):
  - `npm run lint`
- Run ESLint for specific files only (useful while iterating):
  - `npx eslint app components lib instrumentation-client.ts`

There are currently no test scripts defined in `package.json`.

## Project Structure and Architecture

### Framework and tooling

- **Runtime:** Next.js 16 with the **App Router** (`app/` directory present, no `pages/`).
- **Language:** TypeScript for app and components (`.tsx`, `.ts`).
- **Styling:** Tailwind CSS v4 (via `@tailwindcss/postcss`) plus a small custom CSS file for the light rays effect.
- **Fonts:** Google fonts via `next/font` (`Schibsted_Grotesk`, `Martian_Mono`).
- **Graphics:** Custom WebGL background built with **OGL** in a client component.
- **Analytics:** `posthog-js` client initialization in `instrumentation-client.ts`.

### High-level layout and routing

- **Root layout:** `app/layout.tsx`
  - Defines `<html>`/`<body>` shell, global fonts, global CSS import, and wraps `children` with:
    - `Navbar` from `components/Navbar.tsx`.
    - A full-screen `LightRays` background layer positioned absolutely behind the content.
  - All top-level pages render inside `<main>` which is styled in `app/globals.css` to be a centered container.
- **Home page:** `app/page.tsx`
  - Imports `ExploreBtn`, `EventCard`, and `events` data from `lib/constants.ts`.
  - Renders the hero (H1 + description), a CTA button, and a **Featured Events** section.
  - Maps over `events` to generate an `EventCard` for each item.
  - Note: `EventCard` links to `/events/[slug]`, but no corresponding dynamic route currently exists, so these links will 404 unless created.

### Components

All shared UI lives under `components/`:

- `Navbar.tsx`
  - Sticky, glass-style header configured via CSS utilities in `app/globals.css`.
  - Uses `next/link` and `next/image` to render the app logo and top-level nav items.
- `ExploreBtn.tsx`
  - Client component (`"use client"`) that renders a rounded CTA button.
  - On click, logs to the console and anchors to the `#events` section via an in-page `href`.
- `EventCard.tsx`
  - Typed via a `Props` interface (title, image, slug, date, location, description, time).
  - Uses `next/image` for event poster and small icon images.
  - Wraps the entire card in a `next/link` to `/events/[slug]`.
  - Layout (grid, poster sizing, typography) is controlled by `.events` and `.event-card` rules in `app/globals.css`.
- `LightRays.tsx`
  - Client-only background effect built on **OGL** (`Renderer`, `Program`, `Triangle`, `Mesh`).
  - Accepts configuration props for origin, color, speed, spread, ray length, pulsation, noise, distortion, and mouse following.
  - Uses an `IntersectionObserver` to only initialize WebGL when visible and a `requestAnimationFrame` loop to drive a custom fragment shader.
  - Handles WebGL resource cleanup, including `WEBGL_lose_context`, on unmount or visibility changes.
  - Mounted once in `app/layout.tsx` as a full-screen background layer; any additional usage should be mindful of GPU cost.
- `LightRays.css`
  - Legacy/basic CSS for a light-rays container; the current implementation primarily relies on Tailwind and inline classes instead.

### Styling and design system

- **Global theme:** Defined in `app/globals.css` using CSS custom properties for colors, radii, and semantic tokens (background, foreground, sidebar, charts, etc.).
- **Tailwind v4:**
  - `@import "tailwindcss";` and `@theme inline { ... }` define utility classes based on the design tokens.
  - Custom utilities: `flex-center`, `text-gradient`, `glass`, `card-shadow`.
  - Component-level styles for layout and UI constructs (e.g., `header`, `.events`, `.event-card`, `#explore-btn`, `#event`, `#book-event`).
- **Fonts:** CSS variables `--font-schibsted-grotesk` and `--font-martian-mono` set in `app/layout.tsx` and wired into Tailwind via `@theme inline`.

### Data and configuration

- **Static event data:** `lib/constants.ts`
  - Exports an `events` array of objects that drive the home page cards.
  - Each event contains `title`, `image`, `slug`, `date`, `location`, `description`, `time`.
- **Analytics client:** `instrumentation-client.ts`
  - Initializes `posthog-js` on the client when `window` is defined.
  - Uses `process.env.NEXT_PUBLIC_POSTHOG_KEY` and points to the default PostHog cloud host.
  - Any future client-side analytics should reuse this module rather than initializing PostHog independently.
- **Next.js config:** `next.config.ts` currently contains an empty `NextConfig` placeholder; future routing/feature flags should be centralized here.
- **TypeScript config:** `tsconfig.json`
  - Path alias `@/*` -> project root; used heavily in imports (`@/components/...`, `@/lib/...`).

## Working with and Extending the App

- When adding new pages, follow the **App Router** conventions under `app/` (e.g., `app/events/[slug]/page.tsx` for event details, `app/events/page.tsx` for a list view).
- Reuse the `events` data from `lib/constants.ts` where possible instead of duplicating event definitions.
- Prefer adding new shared UI under `components/` and wiring styles via Tailwind utilities and the existing design tokens in `app/globals.css`.
- If you add more GPU-heavy visual effects, be mindful of WebGL initialization/cleanup patterns already used in `LightRays.tsx` to avoid memory leaks.
