# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fuwari-based static blog built with **Astro 6.4 + Svelte + Tailwind CSS**. Content is authored in an Obsidian vault and synced into the site via import scripts. The site language is `zh_CN`.

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
| `pnpm test:guards` | Run import security guard tests |
| `pnpm sync:notes` | Import vault drafts into `src/content/posts/` |
| `pnpm import:drafts:fresh` | Clean import (removes existing imports first) |
| `pnpm import:quarantine` | Import notes that failed security checks for manual review |
| `pnpm localize:images` | Download remote images referenced in posts to local assets |
| `pnpm normalize:posts` | Normalize post directory names to consistent slug format |
| `pnpm scan:public` | Scan published content for leaked secrets/PII |
| `pnpm verify` | Full pipeline: guards → sync → type-check → build → scan |
| `pnpm build:fresh` | Sync notes then build |

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

### Import Scripts (scripts/)

The vault-to-site pipeline imports notes from an external Obsidian vault (`export-manifest.json` → `sourceVault`) into `src/content/posts/`:

- **[scripts/import-vault-drafts.mjs](scripts/import-vault-drafts.mjs)** — Main importer. Reads `export-manifest.json` for policy (private paths, blocked extensions, credential patterns), scans the vault, applies security guards (credential detection, path traversal prevention, personal note exclusion), copies notes + images with slug normalization.
- **[scripts/import-quarantine-notes.mjs](scripts/import-quarantine-notes.mjs)** — Imports notes that failed security checks into a quarantine area for manual review.
- **[scripts/scan-public.mjs](scripts/scan-public.mjs)** — Post-build scanner that checks `src/content/posts/` and `dist/` for leaked secrets, emails, phone numbers, IPs.
- **[scripts/test-guards.mjs](scripts/test-guards.mjs)** — Unit tests for import policy functions (credential detection, slug generation, path safety).
- **[scripts/localize-remote-images.mjs](scripts/localize-remote-images.mjs)** — Downloads remote images referenced in posts to local assets.
- **[scripts/normalize-post-directories.mjs](scripts/normalize-post-directories.mjs)** — Normalizes post directory names to consistent slug format.
- **[scripts/export-vault-notes.mjs](scripts/export-vault-notes.mjs)** — Exports processed notes back to vault format.

### Vault Import Policy (export-manifest.json)

The import pipeline enforces security via `export-manifest.json`:
- **privatePaths** — Directories excluded from import (e.g. `.obsidian`, `.trash`, `密码`, `密钥`, `日记`)
- **blockedExtensions** — File types that cannot be imported (e.g. `.pem`, `.key`, `.env`, `.pdf`)
- **reviewTerms** — Keywords that trigger quarantine review (e.g. `密码`, `token`, `secret`)
- **entries[]** — Per-path overrides with `status: "private"` to explicitly block sensitive content

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
- [export-manifest.json](export-manifest.json) — Vault import policy (private paths, blocked extensions, entry statuses)
- [astro.config.mjs](astro.config.mjs) — Astro integrations, markdown plugins, Vite config
