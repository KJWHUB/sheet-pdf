# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start development server**: `npm run dev`
- **Build for production**: `npm run build` (runs TypeScript compilation then Vite build)
- **Lint code**: `npm run lint`
- **Preview production build**: `npm run preview`

## Project Architecture

This is a modern React + TypeScript application built with Vite, featuring:

**Build System**: Vite with TypeScript compilation configured via `tsconfig.app.json` and `tsconfig.node.json`

**Styling**: Tailwind CSS with the new v4 CSS-first approach via `@tailwindcss/vite`. No traditional config file - uses CSS imports and `@import "tailwindcss"` in `src/index.css`. Tailwind configuration is now CSS-based.

**UI Framework**: Implements shadcn/ui design system (New York style) configured via `components.json`. UI components use:
- Radix UI primitives (`@radix-ui/react-slot`)
- Class Variance Authority (`cva`) for component variants
- Tailwind utilities merged with `tailwind-merge` and `clsx` via `src/lib/utils.ts`
- Lucide React for icons

**Path Aliases**: Configured in `vite.config.ts` with `@/` pointing to `src/`
- `@/components` → UI components
- `@/lib` → Utilities
- `@/hooks` → React hooks

**TypeScript Configuration**: 
- Strict mode enabled
- Separate configs for app (`tsconfig.app.json`) and build tools (`tsconfig.node.json`)
- Linting via ESLint with TypeScript and React plugins

**Component Structure**: 
- Main app logic in `src/App.tsx` 
- UI components in `src/components/ui/`
- Utility functions in `src/lib/`
- Entry point at `src/main.tsx` with React 19 StrictMode

**Key Dependencies**:
- React 19 with TypeScript
- Tailwind CSS v4 with Vite integration
- shadcn/ui component system
- Radix UI primitives
- Lucide React icons

When adding new components, follow the shadcn/ui patterns established in the existing Button component using `cva` for variants and the `cn` utility for className merging.