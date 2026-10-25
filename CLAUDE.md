# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Personal resume/portfolio site (in Russian) built with Astro 7, deployed to GitHub Pages. The main ongoing work is adding project cases. Communicate with the user in Russian.

## Commands

- `npm run dev` — dev server at http://localhost:4321 (per AGENTS.md, prefer `npx astro dev --background`, then `astro dev stop|status|logs`)
- `npm run build` — static build to `dist/`
- `npm run preview` — serve the built `dist/`
- `npm run preview:404` — serve `dist/` like GitHub Pages (unknown paths get `dist/404.html` with a 404 status) on port 4322
- `npm run check` — type-check `.astro`/TS files and validate content collection schemas
- `npm run favicon` — regenerate `public/favicon.svg`, `favicon.ico` (32 and 48 px), `apple-touch-icon.png` (180 px); there is deliberately no 16 px asset

There are no tests. A successful `build` + `check` is the verification step. A wrong case frontmatter field fails the build with a schema error.

Astro 7 requires Node `>=22.23.4` (`.nvmrc` = 22). If the local Node is older, run through a newer one: `npx -y node@22 node_modules/astro/bin/astro.mjs build`.

To test the GitHub Pages sub-path locally, set `BASE_PATH=/resume/`. In Git Bash also set `MSYS_NO_PATHCONV=1`, otherwise MSYS rewrites `/resume/` into a Windows path and image generation fails.

## Git and publishing

Never run `git commit`, `git push`, `git tag`, `git merge`, `gh pr create`, `gh release`, or any deploy/publish command without the user's explicit approval for that exact action in the current conversation. The repository owner approves every commit and push themselves; approval to edit, build, or stage is not approval to commit or push. Read-only git commands are fine. Prepare and verify the change (`npm run check` + `npm run build`), show what will be committed, then ask.

## Model choice

Save tokens without lowering quality: pick the cheapest model that fits the task. The user does not run git by hand, so git work is done by Claude.

- Git (status, diff, log, staging, summarizing changes, drafting a commit message) → an Agent with `model: "haiku"`, unless the main session is already on Haiku (then run it inline: a subagent adds overhead with no saving). Commit/push still need approval as above.
- Broad repo searches and digesting long output (build logs, many files) → Explore/agent with `model: "haiku"`, returning a short summary.
- One-line edits (`profile.ts` text, a CSS value) → inline, no agent.
- Astro components, SCSS, motion scripts, cover generation, case texts in Russian → main session (Sonnet or stronger).
- Review before a commit → `/code-review` or an agent with `model: "opus"`.

Don't spawn an agent for a single command; the brief and fresh context cost more than the command.

## Architecture

- **Cases** are a content collection: `src/content/cases/*.md`, schema in `src/content.config.ts`. The file name is the URL slug (`/cases/<slug>/`). Frontmatter: `title`, `summary`, `type` (enum: ecommerce/corporate/catalog/landing/service/pet), `cover` (relative path to an image in `src/assets/cases/`, optimized by `astro:assets`), optional `company`, `role`, `year`, `url` (live site), `source` (agency case page), `repo`, `tags`, `order` (ascending sort on the home page), `draft`. The body uses `## Задача` / `## Решение` / `## Результат` sections.
- Adding a new `type` means updating both the zod enum in `src/content.config.ts` and the `caseTypes` labels in `src/data/profile.ts`. Home page filter buttons are generated only for types in use.
- **Personal data** (name, about, skills, experience, contacts) lives in `src/data/profile.ts`, not in the pages. Fields marked `TODO` are still unfilled placeholders.
- Pages: `src/pages/index.astro` (hero, AI, experience/about, filterable case grid with a small inline script, tools, contacts — the nav order follows the page order) and `src/pages/cases/[slug].astro`. Both share `src/layouts/Base.astro`. Styles live in `src/styles/global.scss` (SCSS, `sass` is a devDependency): use nesting and the `pressable` mixin for hover/active/touch, and put responsive rules inside the element they change via `@include mq('(max-width: …)')` — there is no separate adaptive section at the bottom. Keep theme tokens as CSS custom properties in `:root` — do not add SCSS variables for colors or sizes, the light theme switches at runtime. Dark theme is the default, light via `prefers-color-scheme`.
- **SEO**: `Base.astro` emits canonical, Open Graph/Twitter tags and JSON-LD (Person on the index, CreativeWork + BreadcrumbList on case pages). Case OG images (1200×630) are generated at build from the cover via `getImage`; the home card `/og.jpg` is the static endpoint `src/pages/og.jpg.ts`, built from `profile.ts` and `src/assets/photo.jpg`: satori renders the text with Manrope (`@fontsource/manrope`, as paths, so CI without the font gives the same image), sharp composites it with the background and avatar. `src/pages/sitemap.xml.ts` and `robots.txt.ts` are static endpoints; `404.astro` is served by GitHub Pages. `<ClientRouter>` only swaps `<title>`, so `Base.astro` re-syncs canonical/OG meta from the `data-page-meta` attribute on `astro:after-swap`.
- **Dev 404**: Astro dev already renders `src/pages/404.astro` for unknown paths with a trailing slash (`/no-such-page/`, `/12/`). A path without the slash gets Astro's own hint ("Do you want to go to `/12/` instead?"), because the dev server handles `trailingSlash` before any app code — expected, no middleware can intercept it. Production: GitHub Pages serves `dist/404.html`; `npm run preview:404` reproduces that locally.
- **Mobile nav**: links live in a `.nav-links` wrapper; `initNavFades()` in `Base.astro` toggles `can-left`/`can-right`, and `.nav-fade` gradients (`--nav-bg`) fade only the clipped side — the left one is hidden at `scrollLeft = 0`. Keep the wrapper and the script in sync if the header markup changes.
- **Motion**: `Base.astro` uses Astro `<ClientRouter />` (View Transitions). Links with `data-circle="<title>"` (case cards, "next case") use the circle transition in `src/scripts/page-transition.ts`: an accent fill grows from the click point with the case title, then `navigate()` runs and the new page opens as a circle from the center (`html[data-vt="circle"]` in CSS). There is no cover morph any more; don't add `transition:name` to covers, the two effects clash. The nav is `transition:persist`. The cursor ring is not: `transition:persist` did not keep it, so `cursor.ts` rebinds to the new `.cursor` element on `astro:after-swap`. `src/scripts/motion.ts` runs Lenis smooth scroll + GSAP/ScrollTrigger reveals: it inits on `astro:page-load` and tears down on `astro:before-swap`, so any new page script must follow the same events. Reveal hooks: `data-reveal` (fade-up blocks, batched), `<Split>` component (word-by-word heading reveal), `data-intro`/`data-intro-item`/`data-intro-media`/`data-count` (hero timeline). Their hidden initial states live in CSS under `prefers-reduced-motion: no-preference`. When navigating back to the index, everything is marked `data-shown` in `astro:after-swap` so the intro and reveals don't replay. The back link (`data-back`) uses `history.back()` only when the current case was opened directly from the index (tracked in `astro:before-preparation`); otherwise it navigates to `/#cases`. Same-page anchor clicks are intercepted in capture phase and scrolled by Lenis with a nav offset, because the router and Lenis otherwise fight each other. `html[data-vt="back"]` makes the return-to-index transition faster. `src/scripts/cursor.ts` is the follower ring; elements with `data-cursor="Label"` enlarge it and show the label. No blur in reveals, and no WebGL background (the user rejected both).
- **Base path**: `astro.config.mjs` reads `SITE_URL`/`BASE_PATH` from the environment (set by `actions/configure-pages` in `.github/workflows/deploy.yml`, which deploys on push to `main`). Internal links and assets must be prefixed with `import.meta.env.BASE_URL`, never hard-coded `/`. `trailingSlash: 'always'` is on, so internal links end with `/`.

## Covers

Covers imported from penbrain.ru are the agency's own photo mockups (16:9) and stay as-is. Every other cover is a generated device mockup, 2000×1250 (16:10, the card's ratio): a laptop showing the desktop screenshot (1600×900) and a phone showing the mobile screenshot (iPhone 13 emulation), on a background tinted with the site's dominant color. They are rendered as an HTML scene with Playwright and converted with sharp. Hide cookie/consent banners before taking screenshots (common selectors: `.note-panel`, `.popup-block`, `.gw-privacy-panel`, `.cookie-panel`). New cases should get the same kind of mockup, not a raw screenshot, because raw screenshots crop badly in the cards.

## Content rules

- Cases from penbrain.ru (agency Pen&Brain, where the user worked) were imported with `company: "Pen&Brain"` and a `source` link. Keep only facts stated on the source pages. Don't invent metrics, years, tech stack or the user's role; leave those fields empty until the user provides them.
- Future cases will come from the user's private GitHub repos (via `gh`). Don't publish repo links or code details from private repos without the user's consent.
- The user did both frontend and backend on these projects. A case's `year` = creation year of the project's earliest repo. Only include projects from roughly the last 6 years; older ones get `draft: true`.
- Repo naming in the `webag` account: `-v` = HTML/CSS markup, `-b` = Bitrix site, `-z` = temporary placeholder page, `-lp` = landing page, `.loc` = local/current version. Repos sharing a root name are one project.
