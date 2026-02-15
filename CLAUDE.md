# CLAUDE.md

> Single source of truth for developers, contributors, and maintainers of **Space by Creative**.
> This file provides guidance to Claude Code (claude.ai/code) and human contributors when working with this repository.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Core Modules](#core-modules)
4. [API Reference](#api-reference)
5. [Design System](#design-system)
6. [Development Guide](#development-guide)
7. [Coding Conventions](#coding-conventions)
8. [Testing](#testing)
9. [Deployment](#deployment)
10. [Environment Variables](#environment-variables)
11. [UI/UX Recommendations](#uiux-recommendations)
12. [Troubleshooting](#troubleshooting)

---

## Project Overview

**Space by Creative** is an AI-powered website builder developed by **Creative Labs Digital, Sarawak, Malaysia**. Users chat with AI to generate, modify, and deploy React applications in real-time. The platform scrapes target websites via Firecrawl, generates code using multiple AI providers, and executes it inside isolated sandboxes (Vercel or E2B).

| Attribute | Value |
|---|---|
| Framework | Next.js 15.4.3 (App Router) |
| Runtime | React 19.1.0 |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS 3.4.17 + custom design system |
| State | Jotai (global), React Context (scoped), sessionStorage (cross-page) |
| Package Manager | pnpm (preferred), npm/yarn supported |
| Module System | ESM (`"type": "module"`) |

### Branding

Configured in `config/branding.ts`:

- **App Name**: Space by Creative
- **Tagline**: "Space: Skills on Demand, Clarity in Collapse."
- **Builder**: Creative Labs Digital, Sarawak, Malaysia

---

## Architecture

### High-Level Data Flow

```
User Input (URL / prompt)
    |
    v
Home Page (app/page.tsx)
    |-- URL detected --> Firecrawl scrape --> Brand style extraction
    |-- Search term --> Search API --> Result carousel
    |
    v
Generation Page (app/generation/page.tsx)
    |
    |-- Create sandbox (Vercel / E2B)
    |-- Stream AI code generation
    |-- Apply code to sandbox files
    |-- Live preview via iframe
    |
    v
Builder Page (app/builder/page.tsx)  [legacy demo route]
```

### Directory Structure

```
Space-by-Creative/
|
|-- app/                          # Next.js App Router
|   |-- api/                      # 29 API route handlers (server-side)
|   |-- builder/page.tsx          # Builder interface (legacy demo)
|   |-- generation/page.tsx       # Main AI generation workspace
|   |-- page.tsx                  # Home / landing page
|   |-- layout.tsx                # Root layout (fonts, theme, toaster, command palette)
|   |-- globals.css               # Imports styles/main.css
|   +-- fonts/                    # Local font files (Geist Sans/Mono)
|
|-- components/                   # React components
|   |-- app/                      # Page-specific components
|   |   +-- (home)/sections/      # Hero, badge, title, pixi, input sections
|   |   +-- generation/           # Generation page sidebar, inputs
|   |-- shared/                   # Cross-page components
|   |   |-- effects/flame/        # HeroFlame, AsciiExplosion visual effects
|   |   |-- header/               # Header, BrandKit, Dropdown, Github
|   |   +-- layout/               # CurvyRect connectors
|   |-- ui/                       # Base UI primitives
|   |   |-- shadcn/               # Radix-based shadcn/ui components
|   |   +-- BrutalistCard.tsx     # Brutalist-styled card component
|   |-- CommandPalette.tsx         # Ctrl+K command palette
|   |-- CompanionChat.tsx          # AI companion chat overlay
|   |-- HeroInput.tsx              # Reusable hero-style input
|   |-- CodeApplicationProgress.tsx # Code application state display
|   +-- ThemeProvider.tsx          # next-themes dark mode provider
|
|-- lib/                          # Core business logic
|   |-- ai/
|   |   +-- provider-manager.ts   # Multi-provider AI management (OpenAI, Anthropic, Google, Groq)
|   |-- sandbox/
|   |   |-- types.ts              # Abstract SandboxProvider base class
|   |   |-- factory.ts            # Factory pattern for sandbox creation
|   |   |-- sandbox-manager.ts    # Sandbox lifecycle orchestration
|   |   |-- spaceSandboxManager.ts # Extended sandbox manager
|   |   +-- providers/
|   |       |-- vercel-provider.ts # Vercel Sandbox implementation (default)
|   |       +-- e2b-provider.ts   # E2B Sandbox implementation
|   |-- skills/
|   |   |-- types.ts              # Skill interface definitions
|   |   |-- registry.ts           # Skill discovery and registration
|   |   |-- audit.ts              # Security/performance audit skill
|   |   +-- supabase.ts           # Supabase integration skill
|   |-- mcp/
|   |   +-- client.ts             # MCP (Model Context Protocol) client
|   |-- edit-intent-analyzer.ts   # Classifies user edit requests
|   |-- morph-fast-apply.ts       # Fast code application via Morph LLM
|   |-- build-validator.ts        # Validates generated code before applying
|   |-- file-parser.ts            # File content parsing and manipulation
|   |-- context-awareness.ts      # Sandbox context understanding
|   |-- context-selector.ts       # Context window selection for AI prompts
|   |-- file-search-executor.ts   # File search within sandboxes
|   |-- spaceApplyService.ts      # Orchestrates code application workflow
|   |-- companion.ts              # Companion chat logic
|   |-- logger.ts                 # Structured logging system
|   |-- errors.ts                 # Custom error classes and handling
|   |-- validations.ts            # Zod validation schemas for API routes
|   |-- edit-examples.ts          # Few-shot examples for edit intent
|   |-- icons.ts                  # Centralized icon re-exports (avoids Turbopack chunk issues)
|   +-- utils.ts                  # General utilities (cn, etc.)
|
|-- config/
|   |-- app.config.ts             # Central configuration (AI, sandbox, UI, packages, files, API)
|   +-- branding.ts               # App name, tagline, builder attribution
|
|-- styles/                       # Styling system
|   |-- main.css                  # Entry point (imports all partials)
|   |-- dashboard.css             # Dashboard-specific styles
|   |-- components/               # Component-scoped CSS
|   +-- design-system/            # Design tokens, utilities, effects
|
|-- packages/
|   +-- create-space-by-creative/ # CLI scaffolding tool
|       +-- templates/            # Vercel and E2B project templates
|
|-- utils/
|   +-- cn.ts                     # Tailwind class merging utility
|
+-- colors.json                   # Design token color definitions (consumed by Tailwind config)
```

---

## Core Modules

### 1. AI Provider Manager (`lib/ai/provider-manager.ts`)

Centralised abstraction over multiple AI providers using the Vercel AI SDK.

| Provider | Model | Key |
|---|---|---|
| OpenAI | GPT-5 | `OPENAI_API_KEY` |
| Anthropic | Claude Sonnet 4 | `ANTHROPIC_API_KEY` |
| Google | Gemini 3 Pro (Preview) | `GEMINI_API_KEY` |
| Groq | Kimi K2 Instruct | `GROQ_API_KEY` |
| AI Gateway | All of the above | `AI_GATEWAY_API_KEY` |

Default model: `google/gemini-3-pro-preview` (configurable in `config/app.config.ts`).

### 2. Sandbox System (`lib/sandbox/`)

Provides isolated code execution environments using the abstract provider pattern.

- **`types.ts`** -- Defines the `SandboxProvider` abstract base class with methods for file operations, command execution, and lifecycle management.
- **`factory.ts`** -- Factory that instantiates the correct provider based on `SANDBOX_PROVIDER` env var.
- **`sandbox-manager.ts`** -- Orchestrates sandbox creation, code application, and teardown.
- **`spaceSandboxManager.ts`** -- Extended manager with Space-specific workflows.
- **`providers/vercel-provider.ts`** -- Vercel Sandbox (default). 15-min timeout, port 3000, `node22` runtime.
- **`providers/e2b-provider.ts`** -- E2B Sandbox. 30-min timeout, Vite on port 5173.

### 3. Code Generation Pipeline

| Module | Purpose |
|---|---|
| `edit-intent-analyzer.ts` | Classifies whether a prompt is a new page, component edit, style change, etc. |
| `morph-fast-apply.ts` | Applies code diffs using Morph LLM API for fast, targeted edits |
| `build-validator.ts` | Validates generated code syntax and structure before sandbox application |
| `file-parser.ts` | Parses file contents, extracts sections, handles multi-file outputs |
| `spaceApplyService.ts` | Orchestrates the full apply workflow: validate, parse, write, refresh |
| `edit-examples.ts` | Few-shot examples used by the edit intent analyzer |

### 4. Skills System (`lib/skills/`)

Modular plugin architecture for extending Space capabilities.

- **`types.ts`** -- Skill interface (name, description, execute method).
- **`registry.ts`** -- Discovers and registers available skills.
- **`audit.ts`** -- Security and performance analysis skill (RLS detection, OWASP checks).
- **`supabase.ts`** -- Supabase schema generation and edge function scaffolding.

Skills are surfaced in the home page UI and accessible via the `/api/skills` endpoint.

### 5. Context & Intelligence

| Module | Purpose |
|---|---|
| `context-awareness.ts` | Builds awareness of sandbox file structure and state |
| `context-selector.ts` | Selects relevant context windows for AI prompts (token-aware) |
| `file-search-executor.ts` | Searches sandbox files by pattern or content |
| `companion.ts` | Powers the floating companion chat (always-available AI assistant) |
| `mcp/client.ts` | MCP (Model Context Protocol) client for tool integration |

### 6. Infrastructure

| Module | Purpose |
|---|---|
| `logger.ts` | Structured logging with levels, timestamps, and context |
| `errors.ts` | Custom error classes (`AppError`, `ValidationError`, `SandboxError`) |
| `validations.ts` | Zod schemas for API request/response validation |
| `icons.ts` | Centralised icon re-exports to prevent Turbopack chunking issues |
| `utils.ts` | `cn()` class name merge utility |

---

## API Reference

### AI & Code Generation

| Endpoint | Method | Description |
|---|---|---|
| `/api/generate-ai-code-stream` | POST | Streams AI-generated code from selected model |
| `/api/apply-ai-code` | POST | Applies generated code to sandbox files |
| `/api/apply-ai-code-stream` | POST | Streaming variant of code application |
| `/api/analyze-edit-intent` | POST | Classifies user edit intent (new page, style change, etc.) |
| `/api/chat` | POST | Conversational AI chat with sandbox context |

### Sandbox Management

| Endpoint | Method | Description |
|---|---|---|
| `/api/create-ai-sandbox` | POST | Creates a new sandbox instance |
| `/api/create-ai-sandbox-v2` | POST | V2 sandbox creation with enhanced options |
| `/api/kill-sandbox` | POST | Terminates a running sandbox |
| `/api/sandbox-status` | GET/POST | Returns sandbox health and status |
| `/api/sandbox-logs` | GET/POST | Retrieves sandbox runtime logs |
| `/api/get-sandbox-files` | POST | Lists files in the sandbox |
| `/api/run-command` | POST | Executes a command in the sandbox |
| `/api/run-command-v2` | POST | V2 command execution with streaming |

### Package Management

| Endpoint | Method | Description |
|---|---|---|
| `/api/detect-and-install-packages` | POST | Detects missing packages from error output and installs them |
| `/api/install-packages` | POST | Installs specific npm packages |
| `/api/install-packages-v2` | POST | V2 with progress streaming |

### Web Scraping & Content

| Endpoint | Method | Description |
|---|---|---|
| `/api/scrape-website` | POST | Scrapes a website via Firecrawl |
| `/api/scrape-url-enhanced` | POST | Enhanced scraping with structure extraction |
| `/api/scrape-screenshot` | POST | Captures a visual screenshot of a URL |
| `/api/extract-brand-styles` | POST | Extracts brand colors, fonts, and design patterns |
| `/api/search` | POST | Web search for site discovery |

### Build & Error Monitoring

| Endpoint | Method | Description |
|---|---|---|
| `/api/check-vite-errors` | POST | Checks for Vite build errors in sandbox |
| `/api/report-vite-error` | POST | Reports a Vite error for tracking |
| `/api/clear-vite-errors-cache` | POST | Clears cached Vite error state |
| `/api/restart-vite` | POST | Restarts the Vite dev server in sandbox |
| `/api/monitor-vite-logs` | POST | Streams Vite log output |

### Utility

| Endpoint | Method | Description |
|---|---|---|
| `/api/create-zip` | POST | Creates a ZIP archive of sandbox files for download |
| `/api/skills` | GET/POST | Lists available skills / executes a skill |
| `/api/conversation-state` | GET/POST | Persists/retrieves conversation state |

---

## Design System

### Identity: Brutalist + Fire-Inspired

The UI uses a **brutalist design language** with fire-themed colors, sharp borders, uppercase headings, monospace typography, and raw interactive patterns.

### Color System

Defined in `colors.json` and exposed as CSS custom properties:

| Token Pattern | Example | Usage |
|---|---|---|
| `--heat-{4..100}` | `--heat-100` | Primary fire-gradient accent scale |
| `--accent-black`, `--accent-white` | - | High-contrast foreground/background |
| `--black-alpha-{4..72}` | `--black-alpha-48` | Semi-transparent overlays |
| `--background-base` | - | Page background |
| `--border-faint` | - | Subtle dividers |
| HSL variables | `--primary`, `--secondary`, etc. | shadcn/ui semantic colors |

P3 wide-gamut colors are used with sRGB fallbacks (e.g., the orange accent `color(display-p3 0.9059 0.3294 0.0784)` falls back to `#FA4500`).

### Typography

| Font | Variable | Usage |
|---|---|---|
| Inter | `--font-inter` | UI labels, body text |
| Geist Sans | `--font-geist-sans` | Primary sans-serif |
| Geist Mono | `--font-geist-mono` | Code, monospace UI |
| Space Mono | `--font-space-mono` | Brutalist display text |
| Roboto Mono | `--font-roboto-mono` | ASCII art effects |

The body class uses `font-mono` by default, reinforcing the brutalist aesthetic. Tailwind config defines a complete type scale:

- **Titles**: `title-h1` (60px) through `title-h5` (24px)
- **Body**: `body-x-large` (20px) through `body-small` (13px)
- **Labels**: `label-x-large` (20px) through `label-x-small` (12px)
- **Mono**: `mono-medium` (14px), `mono-small` (13px), `mono-x-small` (12px)

### Breakpoints

| Name | Min | Max variant |
|---|---|---|
| `xs` | 390px | `xs-max` < 389px |
| `sm` | 576px | `sm-max` < 575px |
| `md` | 768px | `md-max` < 767px |
| `lg` | 996px | `lg-max` < 995px |
| `xl` | 1200px | `xl-max` < 1199px |

Container max-width: `1400px` (2xl), centered with `2rem` padding.

### Custom Tailwind Utilities

Defined in `tailwind.config.ts` plugin:

| Utility | Effect |
|---|---|
| `.center-x` | Absolute, horizontally centered |
| `.center-y` | Absolute, vertically centered |
| `.center` | Absolute, fully centered |
| `.flex-center` | `flex items-center justify-center` |
| `.overlay` | Full-size absolute overlay with inherited border-radius |
| `.text-gradient` | Clips background as text gradient |
| `.mask-border` | Inside-border mask effect |
| `cw-{n}` | Centered width (absolute, sized + positioned) |
| `ch-{n}` | Centered height |
| `cs-{n}` | Centered square |
| `cmw-{n}` | Centered max-width |
| `mw-{n}` | Max-width with optional padding |

### CSS Architecture

```
styles/main.css              # Entry point
  |-- design-system/         # Tokens, utilities, effects
  +-- components/            # Component-scoped styles (brutalist-toast, etc.)
```

PostCSS pipeline: `postcss-import` -> `postcss-nesting` -> `tailwindcss` -> `autoprefixer`.

### Theme

Dark mode is **forced** (`forcedTheme="dark"` in `ThemeProvider`). The `darkMode: "class"` strategy is configured in Tailwind but currently locked to dark.

---

## Development Guide

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/aaron-ailabs/Space-by-Creative.git
cd Space-by-Creative

# 2. Install dependencies
pnpm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local with your API keys (see Environment Variables section)

# 4. Start development server
pnpm dev
```

The dev server runs on `http://localhost:3000` with Turbopack enabled.

### Commands

| Command | Description |
|---|---|
| `pnpm dev` | Start dev server with Turbopack |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint (next/core-web-vitals + next/typescript) |
| `pnpm test` | Placeholder (no test suite configured yet) |

### Adding Features

1. **New API route**: Create `app/api/<endpoint>/route.ts`. Use Zod schemas from `lib/validations.ts` for request validation. Use structured error responses from `lib/errors.ts`.
2. **New component**: Add to appropriate directory under `components/`. Follow the brutalist design language. Use `cn()` from `utils/cn.ts` for conditional class merging.
3. **New business logic**: Add to `lib/`. Keep modules focused and testable.
4. **New skill**: Create a file in `lib/skills/`, implement the skill interface from `types.ts`, and register it in `registry.ts`.
5. **Configuration changes**: Update `config/app.config.ts`. Do not scatter config across files.
6. **New styles**: Add component CSS to `styles/components/`. Import via `styles/main.css`.

### Branching Strategy

The repository uses a trunk-based workflow:

| Branch | Purpose |
|---|---|
| `main` | Production-ready code |
| `claude/*` | AI-assisted feature branches |
| `feature/*` | Manual feature branches |

All work merges back to `main` via pull requests.

### CI/CD Status

**Not yet configured.** No GitHub Actions, GitLab CI, or other pipeline definitions exist. The following is recommended:

1. **Lint check** on all PRs (`pnpm lint`)
2. **Type check** on all PRs (`pnpm build` or `tsc --noEmit`)
3. **Automated Vercel preview deployments** on PR creation
4. **Production deployment** on merge to `main`

---

## Coding Conventions

### TypeScript

- Strict mode enabled (`"strict": true` in `tsconfig.json`)
- Target: ES2017
- Module resolution: bundler
- Path alias: `@/*` maps to project root
- `tsconfig.json` excludes: `node_modules`, `examples`, `tests`, `lib/e2b-backends/archive`, `styles`

### ESLint Rules

Configured in `eslint.config.mjs`:

| Rule | Setting | Rationale |
|---|---|---|
| `@typescript-eslint/no-explicit-any` | off | Pragmatic -- AI-generated code often uses `any` |
| `@typescript-eslint/no-unused-vars` | off | Avoids noise during iterative development |
| `react-hooks/exhaustive-deps` | warn | Catches missing deps without blocking |
| `react/no-unescaped-entities` | off | Common in dynamic text |
| `prefer-const` | warn | Encourages immutability |
| `@next/next/no-img-element` | off (live-preview-frame.tsx only) | WebSocket stream images require `<img>` |

### Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Files (components) | PascalCase | `CommandPalette.tsx` |
| Files (lib) | kebab-case | `edit-intent-analyzer.ts` |
| Files (API routes) | kebab-case directory | `app/api/generate-ai-code-stream/route.ts` |
| React components | PascalCase | `BrutalistCard` |
| Hooks | camelCase with `use` prefix | `useSearchParams` |
| Constants | UPPER_SNAKE_CASE | `APP_NAME` |
| CSS classes | kebab-case / Tailwind | `brutalist-toast` |
| Config keys | camelCase nested objects | `appConfig.ai.defaultModel` |

### Code Patterns

- **Client components**: Always start with `'use client'` directive.
- **API routes**: Export named HTTP method handlers (`GET`, `POST`, etc.) from `route.ts`.
- **Error handling**: Wrap API handlers in try/catch. Return structured JSON errors with appropriate status codes. Use Zod for input validation.
- **Imports**: Use `@/` path alias for all project imports.
- **Icons**: Import from `@/lib/icons` (centralized re-exports) to avoid Turbopack chunk issues.
- **State**: Prefer Jotai atoms for shared state. Use `sessionStorage` for cross-page data (target URL, selected model, etc.).

### Commit Style

Recent history follows conventional commits:

- `feat:` -- New features
- `fix:` -- Bug fixes
- `refactor:` -- Code restructuring
- `docs:` -- Documentation changes

---

## Testing

### Current State

The project has no automated test suite. The `test` script in `package.json` is a no-op placeholder:

```json
"test": "echo \"Error: no test specified\" && exit 0"
```

### Recommended Test Strategy

| Layer | Tool | Priority |
|---|---|---|
| API routes | Vitest + supertest | High -- validate Zod schemas, error handling |
| Core lib modules | Vitest | High -- unit test edit-intent-analyzer, file-parser, build-validator |
| React components | Vitest + React Testing Library | Medium -- test CommandPalette, CompanionChat interactions |
| E2E workflows | Playwright | Low -- full generation flow end-to-end |

To set up:

```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom happy-dom
```

Add to `package.json`:

```json
"scripts": {
  "test": "vitest",
  "test:run": "vitest run",
  "test:coverage": "vitest run --coverage"
}
```

---

## Deployment

### Platform: Vercel (Recommended)

Space by Creative is designed for Vercel deployment. The Next.js App Router, serverless API routes, and Vercel Sandbox integration are native to the platform.

### Prerequisites

1. A Vercel account with a team (for sandbox features)
2. API keys for at least one AI provider
3. A Firecrawl API key for web scraping
4. (Optional) Morph API key for fast code application

### Step-by-Step Deployment

#### 1. Connect Repository

```bash
# Install Vercel CLI
npm i -g vercel

# Link to your Vercel project
vercel link

# Pull environment configuration
vercel env pull .env.local
```

Or connect via the Vercel Dashboard: **New Project** > **Import Git Repository**.

#### 2. Configure Environment Variables

In the Vercel Dashboard (**Settings > Environment Variables**), set:

| Variable | Required | Notes |
|---|---|---|
| `SANDBOX_PROVIDER` | Yes | `vercel` (recommended) or `e2b` |
| `FIRECRAWL_API_KEY` | Yes | Web scraping |
| `AI_GATEWAY_API_KEY` | Recommended | Vercel AI Gateway (replaces individual keys) |
| `ANTHROPIC_API_KEY` | If no gateway | Anthropic Claude |
| `OPENAI_API_KEY` | If no gateway | OpenAI GPT-5 |
| `GEMINI_API_KEY` | If no gateway | Google Gemini |
| `GROQ_API_KEY` | If no gateway | Groq (Kimi K2) |
| `VERCEL_OIDC_TOKEN` | Auto | Auto-generated when using `vercel env pull` |
| `VERCEL_TEAM_ID` | Alt auth | Manual Vercel auth (if OIDC unavailable) |
| `VERCEL_PROJECT_ID` | Alt auth | Manual Vercel auth |
| `VERCEL_TOKEN` | Alt auth | Personal access token |
| `E2B_API_KEY` | If using E2B | E2B sandbox provider |
| `MORPH_API_KEY` | Optional | Morph LLM fast apply |

#### 3. Build Settings

Vercel auto-detects Next.js. Verify these settings:

| Setting | Value |
|---|---|
| Framework Preset | Next.js |
| Build Command | `pnpm build` (or `next build`) |
| Output Directory | `.next` (default) |
| Install Command | `pnpm install` |
| Node.js Version | 20.x or 22.x |

#### 4. Deploy

```bash
# Preview deployment
vercel

# Production deployment
vercel --prod
```

Or push to `main` for automatic production deployment (once Git integration is enabled).

### Build Optimization Notes

- **Turbopack**: Used in development only (`next dev --turbopack`). Production builds use the standard Next.js compiler.
- **PostCSS**: Pipeline processes `postcss-import` > `postcss-nesting` > `tailwindcss` > `autoprefixer`.
- **Tailwind Purge**: Content paths include `pages/`, `components/`, `app/`, and `components-new/`.
- **Font Preloading**: Local Geist fonts are preloaded via `next/font/local`. Google fonts (Inter, Space Mono, Roboto Mono) are loaded via `next/font/google`.
- **Image Optimization**: Remote patterns configured for `www.google.com` in `next.config.ts`. Add additional domains as needed.

### No vercel.json Required

The project works with Vercel defaults. If you need custom configuration (rewrites, headers, cron), create `vercel.json` at the project root.

---

## Environment Variables

### Complete Reference

Copy `.env.example` to `.env.local` and fill in values:

```env
# ---- App ----
SPACE_BY_CREATIVE_API_KEY=your_api_key_here
SPACE_BY_CREATIVE_ENV=development           # development | production

# ---- Web Scraping (required) ----
FIRECRAWL_API_KEY=your_firecrawl_api_key    # https://firecrawl.dev

# ---- Sandbox Provider (choose one) ----
SANDBOX_PROVIDER=vercel                     # vercel | e2b

# Vercel Sandbox - Method A: OIDC (recommended for dev)
VERCEL_OIDC_TOKEN=auto_generated            # Run `vercel link && vercel env pull`

# Vercel Sandbox - Method B: Personal Access Token
# VERCEL_TEAM_ID=team_xxxxxxxxx
# VERCEL_PROJECT_ID=prj_xxxxxxxxx
# VERCEL_TOKEN=vercel_xxxxxxxxxxxx

# E2B Sandbox (if SANDBOX_PROVIDER=e2b)
# E2B_API_KEY=your_e2b_api_key             # https://e2b.dev

# ---- AI Providers (need at least one) ----
AI_GATEWAY_API_KEY=your_gateway_key         # Vercel AI Gateway (recommended)

# Individual keys (used when AI_GATEWAY_API_KEY is not set)
ANTHROPIC_API_KEY=your_anthropic_key        # https://console.anthropic.com
OPENAI_API_KEY=your_openai_key              # https://platform.openai.com
GEMINI_API_KEY=your_gemini_key              # https://aistudio.google.com/app/apikey
GROQ_API_KEY=your_groq_key                 # https://console.groq.com

# ---- Optional ----
MORPH_API_KEY=your_morph_key                # https://morphllm.com/ (fast apply)
```

### Configuration Constants

All runtime configuration is in `config/app.config.ts`. Key values:

| Path | Default | Description |
|---|---|---|
| `ai.defaultModel` | `google/gemini-3-pro-preview` | Default AI model |
| `ai.defaultTemperature` | `0.7` | Temperature for non-reasoning models |
| `ai.maxTokens` | `8000` | Max tokens for code generation |
| `vercelSandbox.timeoutMinutes` | `15` | Vercel sandbox timeout |
| `e2b.timeoutMinutes` | `30` | E2B sandbox timeout |
| `codeApplication.defaultRefreshDelay` | `2000` | Delay (ms) before iframe refresh |
| `ui.maxChatMessages` | `100` | Max chat messages in memory |
| `ui.maxRecentMessagesContext` | `20` | Recent messages sent as AI context |
| `packages.useLegacyPeerDeps` | `true` | Use `--legacy-peer-deps` for npm |
| `files.maxFileSize` | `1048576` (1MB) | Max file size for read operations |

---

## UI/UX Recommendations

The following recommendations are based on the current codebase audit and industry best practices.

### Layout

1. **Consistent container widths**: The home page uses multiple width strategies (`cmw-container`, `max-w-[900px]`, `max-w-552`, `container`). Standardize on a single container utility for predictable margins across breakpoints.
2. **Sticky header z-index layering**: The header uses `z-[101]` while other elements use various z-indices. Define a z-index scale in the design system (e.g., `--z-header: 100`, `--z-modal: 200`, `--z-toast: 300`).
3. **Mobile-first hero section**: The hero has separate mobile/desktop layouts using `lg:` breakpoints with negative margins (`-mt-90`, `-mt-30`). Consider simplifying with CSS Grid or Flexbox gap-based spacing for cleaner responsiveness.

### Typography

4. **Font loading optimization**: Five font families are loaded on every page. Consider loading Roboto Mono only on pages that use ASCII effects to reduce initial payload.
5. **Body text readability**: The default `font-mono` on the body works for the brutalist aesthetic but reduces readability for longer content. Consider switching body text blocks to `font-sans` (Inter) while keeping monospace for UI chrome and code.

### Color & Theming

6. **Dark mode flexibility**: Dark mode is currently forced. Consider allowing user preference with `forcedTheme` removed and system detection via `defaultTheme="system"`, preserving dark as the flagship experience while supporting light mode.
7. **Contrast ratios**: Semi-transparent text like `text-black-alpha-48` on dark backgrounds may not meet WCAG AA (4.5:1). Audit all alpha-based text colors against their backgrounds.

### Accessibility

8. **Keyboard navigation**: The search carousel relies on mouse hover for clone/instructions interactions. Add keyboard-navigable alternatives (focus states, arrow key navigation, Enter to select).
9. **ARIA labels**: The hero input, search results carousel, and style selector buttons lack `aria-label` and `role` attributes. Add semantic roles (`role="search"`, `role="listbox"`, `aria-label` on icon-only buttons).
10. **Focus indicators**: Ensure all interactive elements have visible focus outlines. The current `focus:outline-none` on inputs removes the default indicator without always providing a visible alternative.
11. **Skip navigation**: Add a "Skip to content" link before the header for screen reader users.

### Interactive Features

12. **Command Palette enhancements**: The Ctrl+K palette is present. Extend it with recently-used commands, search history, and keyboard shortcut hints for discoverability.
13. **Loading state improvements**: The search skeleton uses CSS animation. Consider adding `aria-busy="true"` and `aria-live="polite"` for screen reader announcements.
14. **Error boundaries**: Add React error boundaries around the generation page and sandbox preview iframe to prevent full-page crashes from sandbox errors.

### Performance

15. **Image optimization**: Search result screenshots use `next/image` with `loading="lazy"`, which is correct. Ensure all carousel images have explicit `width` and `height` or `fill` with `sizes` to prevent layout shift.
16. **Bundle size**: The project imports both `framer-motion` and `motion` packages. Consolidate to one. Also, `react-icons` and `@tabler/icons-react` and `lucide-react` are all installed -- consider standardizing on one icon library to reduce bundle size.
17. **Code splitting**: The generation page is large (~46K tokens). Split it into smaller components (sidebar, preview, chat panel, file tree) that can be lazy-loaded.
18. **Inline styles**: The home page uses several inline `style` objects for box-shadows and backgrounds. Extract these to CSS classes or Tailwind utilities for better caching and maintainability.

### Responsive Design

19. **Touch targets**: Some buttons (style selectors, model dropdown) are small at mobile sizes. Ensure all touch targets are at least 44x44px per WCAG guidelines.
20. **Carousel on mobile**: The infinite-scroll carousel has fixed 400px-wide items. On mobile screens, items should shrink or the carousel should switch to a swipeable single-card view.
21. **Generation page mobile**: The builder sidebar (`w-80`) and preview layout assume desktop widths. Add a mobile layout with a bottom sheet or tab-based navigation.

---

## Troubleshooting

### Common Issues

| Problem | Solution |
|---|---|
| Build fails with missing env vars | Ensure `.env.local` exists with required keys. Check `config/app.config.ts` for defaults. |
| Sandbox won't create | Verify `SANDBOX_PROVIDER` is set and corresponding auth keys are valid. For Vercel, run `vercel link && vercel env pull`. |
| AI returns empty responses | Check that at least one AI provider key is set. Verify the selected model matches a configured provider. |
| Turbopack chunk errors on icons | Import icons from `@/lib/icons` (centralized exports), not directly from icon packages. |
| Vite errors in sandbox | Use `/api/check-vite-errors` to diagnose. Try `/api/restart-vite` to recover. |
| Package install failures | The app uses `--legacy-peer-deps` by default. Check `config/app.config.ts` > `packages.useLegacyPeerDeps`. |
| CORS issues with scraping | Firecrawl handles CORS server-side. Ensure `FIRECRAWL_API_KEY` is valid. |

### Useful Debug Steps

1. Enable debug logging: `appConfig.dev.enableDebugLogging` is `true` by default.
2. Check structured logs: The `lib/logger.ts` module provides leveled logging.
3. Inspect sandbox state: Call `/api/sandbox-status` with the sandbox ID.
4. View sandbox logs: Call `/api/sandbox-logs` with the sandbox ID.
5. Test API routes directly: Use `curl` or a tool like Bruno/Insomnia against `http://localhost:3000/api/<endpoint>`.

---

## Dependencies

### Runtime

| Package | Version | Purpose |
|---|---|---|
| next | 15.4.3 | React framework (App Router) |
| react / react-dom | 19.1.0 | UI library |
| ai | ^5.0.0 | Vercel AI SDK |
| @ai-sdk/openai | ^2.0.4 | OpenAI provider |
| @ai-sdk/anthropic | ^2.0.1 | Anthropic provider |
| @ai-sdk/google | ^2.0.4 | Google provider |
| @ai-sdk/groq | ^2.0.0 | Groq provider |
| @vercel/sandbox | ^0.0.17 | Vercel sandbox runtime |
| @e2b/code-interpreter | ^2.0.0 | E2B sandbox runtime |
| @mendable/firecrawl-js | ^4.3.3 | Web scraping |
| tailwindcss | ^3.4.17 | Utility-first CSS |
| @radix-ui/* | various | Headless UI primitives (shadcn/ui) |
| framer-motion / motion | ^12.23.12 | Animations |
| jotai | ^2.14.0 | Atomic state management |
| zod | ^3.25.76 | Schema validation |
| sonner | ^2.0.7 | Toast notifications |
| next-themes | ^0.4.6 | Theme management |
| pixi.js | ^8.13.1 | WebGL effects (hero section) |
| nanoid | ^5.1.5 | ID generation |

### Development

| Package | Version | Purpose |
|---|---|---|
| typescript | ^5 | Type checking |
| eslint | ^9 | Linting |
| eslint-config-next | 15.4.3 | Next.js ESLint rules |
| postcss | ^8.5.6 | CSS processing |
| postcss-import | ^16.1.1 | CSS @import resolution |
| postcss-nesting | ^13.0.2 | CSS nesting support |

---

*Last updated: 2026-02-15. Generated from a comprehensive audit of the repository.*
