# DP Creative OS — Architecture

DP Creative OS is a modular Next.js 14 application built to manage complex creative productions, specifically orchestrating workflows, intelligent memory structures, and AI generation pipelines.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS, Lucide Icons, Shadcn UI
- **Database**: PostgreSQL (Supabase) + Prisma ORM
- **State/Hooks**: React Server Components + Client Hooks

## Core Modules

1. **Workflow Engine**: A strict, stage-gated system (`Project -> Script -> Storyboard -> Scene -> Shot -> Asset`). Users cannot advance until prior stages are locked/approved.
2. **Progress Engine**: Recursively calculates completion status. An asset approval ripples up to update Shot -> Scene -> Storyboard -> Project completion percentages.
3. **Provider Framework**: An adapter-based pattern that abstracts AI vendors (OpenRouter, Runway, etc.) behind a standardized Job Engine. 
4. **Job Engine**: Orchestrates asynchronous AI generation requests. UIs dispatch a "Job" instead of calling an API directly.
5. **Creative Memory Engine**: Allows the OS to store persistent profiles (Characters, Brands, Styles) and auto-injects them invisibly into AI prompts to enforce production continuity.
6. **Creative Knowledge Graph**: The core intelligence layer `GraphEngine.ts`. A semantic wrapper over PostgreSQL that infers multi-directional relationships (e.g., "Which scenes use the Rolex Brand profile?") without needing a dedicated Graph Database.

## Directory Structure
- `src/app/` - Next.js App Router (Pages & Layouts)
- `src/components/` - Reusable UI Components
- `src/components/production/` - Domain-specific UI Modules (Generation Studio, Asset Library)
- `src/lib/` - Utility functions
- `src/lib/production/` - Core OS Engines (Workflow, Graph, Provider Framework)
- `src/api/v1/` - REST endpoints for Job dispatch and external integration.
