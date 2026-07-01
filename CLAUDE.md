# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fuwari-based static blog built with **Astro 6.4 + Svelte + Tailwind CSS**. Posts are authored directly as Markdown under `src/content/posts/`. The site language is `zh_CN`.

## Commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Dev server at `localhost:4321` |
| `pnpm build` | Production build + Pagefind indexing → `dist/` |
| `pnpm preview` | Preview production build locally |
| `pnpm type-check` | TypeScript type checking (`tsc --noEmit`) |
| `pnpm lint` | Biome lint + auto-fix on `src/` |
| `pnpm format` | Biome format on `src/` |
| `pnpm check` | Astro diagnostic check |
| `pnpm new-post <filename>` | Scaffold a new post in `src/content/posts/` |
| `pnpm localize:images` | Download remote images referenced in posts to local assets |
| `pnpm scan:public` | Scan published content for leaked secrets/PII |
| `pnpm verify` | Full pipeline: type-check → build → scan |

Package manager is **pnpm** (enforced via `preinstall` script). Node.js >= 20 required.

## Architecture

### Content Pipeline

Posts live in `src/content/posts/` as `index.md` files inside named directories (e.g. `blog/notes/09-jdbc-mybatis/index.md`). The content collection schema is defined in [src/content.config.ts](src/content.config.ts) using Astro's glob loader with a custom slug generator that strips `index.md` and normalizes path separators.

Two collections exist:
- **posts** — Blog posts with full frontmatter schema
- **spec** — Special pages (e.g. `about.md`) with minimal schema

Frontmatter schema (from [src/content.config.ts](src/content.config.ts)):
- `title` (required), `published` (required date), `draft` (default false)
- `description`, `image`, `tags[]`, `category`, `lang` (optional)
- `updated`, `prevTitle/prevSlug/nextTitle/nextSlug` (internal, auto-populated)

Draft posts are excluded in production builds (`import.meta.env.PROD`).

### Maintenance Scripts (scripts/)

- **[scripts/scan-public.mjs](scripts/scan-public.mjs)** — Post-build scanner that checks `src/content/posts/` and `dist/` for leaked secrets, emails, phone numbers, IPs.
- **[scripts/localize-remote-images.mjs](scripts/localize-remote-images.mjs)** — Downloads remote images referenced in posts to local assets.
- **[scripts/new-post.js](scripts/new-post.js)** — Scaffolds a new post in `src/content/posts/`.

### Page Routing

- [`[...page].astro`](src/pages/%5B...page%5D.astro) — Homepage with paginated post list (PAGE_SIZE = 8)
- [`posts/[...slug].astro`](src/pages/posts/%5B...slug%5D.astro) — Individual post pages (static paths from `getSortedPosts()`)
- [archive.astro](src/pages/archive.astro) — Archive page with tag/category filtering
- [about.astro](src/pages/about.astro) — About page (content from `src/content/spec/about.md`)

### Layout System

- [Layout.astro](src/layouts/Layout.astro) — Base HTML shell (head, body, global styles)
- [MainGridLayout.astro](src/layouts/MainGridLayout.astro) — Main grid with navbar, sidebar, banner, TOC, footer

### Component Structure

- **Interactive components** use Svelte (`.svelte`): [ArchivePanel](src/components/ArchivePanel.svelte), [LightDarkSwitch](src/components/LightDarkSwitch.svelte), [Search](src/components/Search.svelte), [DisplaySettings](src/components/widget/DisplaySettings.svelte)
- **Static components** use Astro (`.astro`): PostCard, Navbar, Sidebar widgets, Footer
- **Widgets** in [src/components/widget/](src/components/widget/): Profile, Categories, Tags, TOC, SideBar

### Custom Remark/Rehype Plugins (src/plugins/)

- `remark-reading-time.mjs` — Injects `minutes` and `words` into frontmatter
- `remark-excerpt.js` — Extracts first paragraph as `excerpt` for post cards
- `remark-directive-rehype.js` — Converts remark directives to rehype components
- `rehype-component-admonition.mjs` — Renders admonition boxes (note/tip/warning/caution/important)
- `rehype-component-github-card.mjs` — Renders GitHub repository cards
- `expressive-code/language-badge.ts` — Language badge on code blocks
- `expressive-code/custom-copy-button.ts` — Custom copy button for code blocks

### Styling

Tailwind CSS 3 with `@tailwindcss/typography`. Stylus (`.styl`) for component-level styles. CSS custom properties for theming (e.g. `--primary`, `--codeblock-bg`, `--radius-large`). Theme hue is configurable in `src/config.ts`.

### Path Aliases (tsconfig.json)

`@components/*`, `@assets/*`, `@constants/*`, `@utils/*`, `@i18n/*`, `@layouts/*`, `@/*` → `src/*`

### i18n

Translation files in [src/i18n/languages/](src/i18n/languages/). Site language set in `src/config.ts` → `siteConfig.lang` (currently `zh_CN`). Per-post language override via `lang` frontmatter. Translation lookup via `i18n(I18nKey.xxx)`.

## Code Style

- **Formatter/Linter**: Biome (not ESLint/Prettier). Config in [biome.json](biome.json).
- **Indentation**: Tabs (Biome `indentStyle: "tab"`)
- **Quotes**: Double quotes in JS/TS
- **Svelte/Astro overrides**: Biome relaxes `useConst`, `useImportType`, `noUnusedVariables` for `.svelte` and `.astro` files

## Key Config Files

- [src/config.ts](src/config.ts) — Site metadata, navbar, profile, license, code theme
- [astro.config.mjs](astro.config.mjs) — Astro integrations, markdown plugins, Vite config
