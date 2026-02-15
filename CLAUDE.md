# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Space by Creative is an AI-powered website builder that allows users to chat with AI to build React apps instantly. It's a Next.js application that integrates with various AI providers (OpenAI, Anthropic, Google, Groq) and sandbox providers (Vercel, E2B) to generate and deploy websites in real-time.

## Development Commands

### Core Development
- `pnpm dev` - Start development server with Turbopack (recommended)
- `npm run dev` - Alternative with npm
- `yarn dev` - Alternative with yarn

### Build & Production
- `pnpm build` - Build the Next.js application
- `pnpm start` - Start production server

### Code Quality
- `pnpm lint` - Run ESLint with Next.js configuration
- `npm run lint` - Alternative with npm

### Testing
- `npm run test:api` - Run API endpoint tests (requires test files in `tests/` directory)
- `npm run test:code` - Run code execution tests (requires test files in `tests/` directory)
- `npm run test:all` - Run all tests (integration + API + code)

**Note**: Test files referenced in package.json (`tests/api-endpoints.test.js`, `tests/code-execution.test.js`) are not present in the repository. These scripts are defined but require test files to be created.

## Architecture & Code Structure

### High-Level Architecture

The application follows a Next.js App Router architecture with the following key components:

1. **Frontend (Next.js 15 + React 19)**
   - App Router with pages in `app/` directory
   - Client components using `'use client'` directive
   - Server-side API routes in `app/api/`

2. **AI Integration Layer**
   - **Provider Manager** (`lib/ai/provider-manager.ts`) - Centralized AI provider management
   - Supports multiple providers: OpenAI, Anthropic, Google (Gemini), Groq
   - AI Gateway integration for unified API access
   - Model configuration in `config/app.config.ts`

3. **Sandbox System**
   - **Abstract Provider Pattern** (`lib/sandbox/types.ts`) - Base class for sandbox providers
   - **Vercel Sandbox** (`lib/sandbox/providers/vercel-provider.ts`) - Default provider
   - **E2B Sandbox** (`lib/sandbox/providers/e2b-provider.ts`) - Alternative provider
   - **Factory Pattern** (`lib/sandbox/factory.ts`) - Creates appropriate sandbox instances
   - **Manager** (`lib/sandbox/sandbox-manager.ts`) - Orchestrates sandbox operations

4. **Code Generation & Application**
   - **Edit Intent Analyzer** (`lib/edit-intent-analyzer.ts`) - Analyzes user requests for code changes
   - **Morph Fast Apply** (`lib/morph-fast-apply.ts`) - Fast code application using Morph LLM
   - **Build Validator** (`lib/build-validator.ts`) - Validates generated code
   - **File Parser** (`lib/file-parser.ts`) - Parses and manipulates file contents

5. **Web Scraping & Content Extraction**
   - **Firecrawl Integration** - Scrapes websites for content and structure
   - **Brand Style Extraction** - Extracts design patterns from target websites
   - **Screenshot Capture** - Captures visual references for design replication

### Key Directories

```
app/                    # Next.js App Router pages
├── api/               # API routes (server-side)
├── builder/           # Website builder interface
├── generation/        # AI code generation interface
├── landing.tsx        # Landing page
└── page.tsx           # Home page

components/             # React components
├── app/              # Application-specific components
├── shared/           # Shared components (effects, layout, header)
├── ui/               # UI components (shadcn/ui based)

lib/                    # Core business logic
├── ai/               # AI provider management
├── sandbox/          # Sandbox system (providers, factory, manager)
├── edit-intent-analyzer.ts  # Intent analysis
├── morph-fast-apply.ts      # Fast code application
├── build-validator.ts       # Code validation
└── file-parser.ts           # File parsing

config/                 # Application configuration
├── app.config.ts     # Main configuration (AI models, sandbox settings, etc.)

styles/                 # Styling system
├── main.css          # Main stylesheet
├── dashboard.css     # Dashboard-specific styles
├── components/       # Component-specific CSS
└── design-system/    # Design system utilities

packages/               # Monorepo packages
└── create-open-lovable/  # CLI tool for creating new projects
```

### API Routes Structure

The API routes handle various backend operations:

- **AI Code Generation**: `generate-ai-code-stream`, `apply-ai-code`, `apply-ai-code-stream`
- **Sandbox Management**: `create-ai-sandbox`, `create-ai-sandbox-v2`, `kill-sandbox`
- **Package Management**: `detect-and-install-packages`, `install-packages`, `install-packages-v2`
- **Web Scraping**: `scrape-website`, `scrape-url-enhanced`, `scrape-screenshot`
- **Build & Development**: `check-vite-errors`, `restart-vite`, `monitor-vite-logs`
- **File Operations**: `get-sandbox-files`, `create-zip`

### Design System

The project uses a fire-inspired design system with:

- **Color System**: Heat colors (`--heat-4` through `--heat-100`), accent colors, alpha variants
- **Typography**: SuisseIntl for display, system monospace for code
- **Utilities**: Custom CSS classes for gradients, layouts, effects, and animations
- **Component Styles**: Component-specific CSS in `styles/components/`
- **P3 Color Space**: Wide gamut colors with sRGB fallbacks

### State Management

- **Jotai** - Lightweight state management for global state
- **React Context** - For component-level state (HeaderContext)
- **useState/useEffect** - Local component state
- **Session Storage** - For persisting user selections across pages

## Environment Configuration

### Required Environment Variables

```env
# AI Provider API Keys (choose at least one)
FIRECRAWL_API_KEY=your_firecrawl_api_key
GEMINI_API_KEY=your_gemini_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
OPENAI_API_KEY=your_openai_api_key
GROQ_API_KEY=your_groq_api_key

# Sandbox Provider (choose one)
SANDBOX_PROVIDER=vercel  # or 'e2b'

# Vercel Sandbox (if using Vercel)
VERCEL_OIDC_TOKEN=auto_generated_by_vercel_env_pull
# OR
VERCEL_TEAM_ID=team_xxxxxxxxx
VERCEL_PROJECT_ID=prj_xxxxxxxxx
VERCEL_TOKEN=vercel_xxxxxxxxxxxx

# E2B Sandbox (if using E2B)
E2B_API_KEY=your_e2b_api_key

# Optional: Morph API for fast code application
MORPH_API_KEY=your_morphllm_api_key
```

### Configuration File

All application settings are centralized in `config/app.config.ts`:

- **AI Models**: Default model, available models, model display names
- **Sandbox Settings**: Timeouts, ports, working directories
- **Code Application**: Refresh delays, truncation recovery settings
- **UI Settings**: Animations, toast durations, message limits
- **Package Management**: Installation settings, auto-restart behavior
- **File Management**: Exclusion patterns, max file sizes

## Development Workflow

### Adding New Features

1. **API Routes**: Create new route in `app/api/[endpoint]/route.ts`
2. **Components**: Add to appropriate directory in `components/`
3. **Business Logic**: Add to `lib/` directory
4. **Configuration**: Update `config/app.config.ts` if needed
5. **Styling**: Add component-specific CSS to `styles/components/`

### Code Style & Patterns

- **TypeScript**: Full type safety throughout
- **React Server Components**: Use `'use client'` directive for client components
- **API Routes**: Use Next.js App Router API routes with proper HTTP methods
- **Error Handling**: Use try/catch with proper error messages
- **Environment Variables**: Access via `process.env` with proper validation

### Testing Strategy

- **API Tests**: Node.js test scripts (not yet implemented)
- **Code Execution Tests**: Node.js test scripts (not yet implemented)
- **Manual Testing**: Use the development server with various sandbox providers

## Important Notes

### Cursor Rules Integration

This repository includes Cursor rules in `.cursor/rules/` directory:

- **Home Page Components** (`components/app/.cursor/rules/home-page-components.md`)
- **Flame Effects** (`components/shared/effects/.cursor/rules/flame-effects.md`)
- **Component Styles** (`styles/components/.cursor/rules/component-styles.md`)
- **Design System** (`styles/design-system/.cursor/rules/design-system.md`)

### Kluster Code Verification

The repository uses Kluster for code verification (`.agent/rules/kluster-code-verify.md`):

- **Snapshot Session**: Must run before any code changes
- **Automatic Review**: Must run after any file modifications
- **Manual Review**: Triggered by specific phrases like "verify with kluster"
- **Dependency Check**: Required before package management operations

### Performance Considerations

- **Sandbox Timeouts**: Vercel (15 min), E2B (30 min)
- **Development Server**: Uses Turbopack for faster builds
- **Code Application**: Fast apply via Morph API when available
- **File Operations**: Size limits (1MB max), exclusion patterns for node_modules

### Common Development Tasks

1. **Start Development**: `pnpm dev`
2. **Add New AI Provider**: Update `lib/ai/provider-manager.ts` and `config/app.config.ts`
3. **Add New Sandbox Provider**: Create new provider in `lib/sandbox/providers/`
4. **Add New API Route**: Create route in `app/api/[endpoint]/route.ts`
5. **Update UI Components**: Add to `components/` directory with proper styling
6. **Configure Models**: Update `config/app.config.ts` AI section

### Troubleshooting

- **Build Errors**: Check `config/app.config.ts` for proper configuration
- **Sandbox Issues**: Verify environment variables for chosen provider
- **AI Integration**: Ensure API keys are set and valid
- **Package Installation**: Check `package.json` dependencies and scripts

## Dependencies

### Key Dependencies

- **Next.js 15.4.3** - React framework with App Router
- **React 19.1.0** - UI library
- **AI SDK** - Unified AI provider interface
- **Tailwind CSS 3.4.17** - Utility-first CSS
- **Shadcn/UI** - Component library (Radix UI based)
- **Jotai** - State management
- **Framer Motion** - Animations
- **Sonner** - Toast notifications

### Development Dependencies

- **TypeScript 5** - Type checking
- **ESLint 9** - Code linting
- **PostCSS** - CSS processing
- **Tailwind CSS** - CSS framework

## Deployment

The application is designed for Vercel deployment with:

- **Serverless Functions** for API routes
- **Edge Runtime** support
- **Environment Variables** for configuration
- **Sandbox Integration** for code execution

### Build Optimization

- **Turbopack** for fast development builds
- **PostCSS Optimization** for production
- **Tailwind Purging** via content paths
- **Font Preloading** for performance