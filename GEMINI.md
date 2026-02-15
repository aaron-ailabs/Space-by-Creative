# Space by Creative Project Context

## Project Overview
**Space by Creative** is an open-source platform for building React applications instantly using AI. It allows users to clone existing websites or generate new ones from natural language prompts. The project is developed by **Creative Labs Digital, Sarawak, Malaysia**.

### Core Technologies
- **Framework:** Next.js 15 (App Router) with React 19.
- **Styling:** Tailwind CSS (mandatory), Framer Motion for animations.
- **AI Integration:** Vercel AI SDK (`ai`), supporting OpenAI, Anthropic (Claude), Google (Gemini), and Groq.
- **Sandbox/Execution:** Vercel Sandbox and E2B for secure, live code execution and previews.
- **Data Acquisition:** Firecrawl for crawling and scraping websites to be cloned/reimagined.
- **State Management:** Jotai for atomic state management.

## Architecture & Structure
- `app/`: Next.js App Router pages and API routes.
  - `api/`: Backend logic for AI code generation, sandbox management, and package installation.
- `components/`: Organized into `app` (page-specific), `shared` (reusable logic/effects), and `ui` (base components).
- `lib/`: Core services including AI provider management (`ai/`), sandbox orchestration (`sandbox/`), and code application logic (`morph-fast-apply.ts`).
- `styles/`: Custom Tailwind configuration using `colors.json` and CSS variable mapping.
- `utils/`: Common utility functions like `cn` (class merging).

## Building and Running
- **Development:** `pnpm dev` (runs with `--turbopack`)
- **Production Build:** `pnpm build`
- **Start Production:** `pnpm start`
- **Linting:** `pnpm lint`
- **Testing:**
  - `pnpm test:api`: Tests API endpoints.
  - `pnpm test:code`: Tests code execution logic.
  - `pnpm test:all`: Runs all integration and unit tests.

## Development Conventions
### Frontend Rules (Mandatory)
- **Component Style:** Only functional components are allowed. Class components are forbidden.
- **Styling:** Strictly use **Tailwind CSS**. No inline styles, CSS-in-JS (styled-components), or external UI libraries besides `shadcn/ui`.
- **Responsive Design:** Mobile-first approach is mandatory.
- **File Naming:** Use `PascalCase.tsx` for components and `kebab-case.md` for documentation.

### AI & Sandbox Logic
- **Provider Management:** Use `lib/ai/provider-manager.ts` to add or configure AI models.
- **Code Application:** The system uses a "Fast Apply" pattern (Morph) to apply targeted edits to files in the sandbox without rewriting the entire file when possible.
- **Sandbox Integration:** All generated code is executed within an isolated sandbox environment managed via `lib/sandbox/sandbox-manager.ts`.

## Environment Configuration
The project requires several API keys for full functionality:
- `FIRECRAWL_API_KEY` (Scraping)
- `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, or `GROQ_API_KEY` (AI)
- `SANDBOX_PROVIDER` (`vercel` or `e2b`)
- `MORPH_API_KEY` (Optional, for faster code edits)
