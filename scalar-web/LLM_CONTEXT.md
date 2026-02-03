# Scalar Project Context

This file provides comprehensive context for Large Language Models (LLMs) working on the **Scalar** project. It outlines the technology stack, project structure, architectural patterns, design system, and key conventions.

## 1. Project Overview
**Scalar** is a data-driven web guessing game where users guess entities (e.g., Countries) to find a target entity based on numerical attributes. It features a minimalist "E-ink" / "Paper & Charcoal" aesthetic.

## 2. Technology Stack
- **Framework**: React 19 (Vite)
- **Language**: TypeScript (~5.9)
- **State Management**: Zustand (with persistence middleware)
- **Styling**: Tailwind CSS v4
- **UI Components**: Shadcn/UI (Radix UI primitives)
- **Icons**: Lucide React
- **Font**: Geist Mono

## 3. Project Structure
```plaintext
/src
├── components/       # UI Components
│   └── ui/           # Shadcn/UI primitives (Button, Input, etc.)
├── store/            # State Management (Zustand)
│   └── gameStore.ts  # CENTRAL STATE HUB
├── utils/            # Pure Game Logic & Helpers
│   └── gameLogic.ts  # CORE MECHANICS (Pure functions)
├── lib/              # Utility libraries (cn, etc.)
├── assets/           # Static assets (gameData.json)
├── types.ts          # Shared TypeScript interfaces
└── App.tsx           # Main application entry
```

## 4. Architecture & State Management
The project enforces a strict Separation of Concerns (SoC):

### A. State (`src/store/gameStore.ts`)
- **Role**: The "Bridge" between UI and Logic.
- **Responsibility**: Holds the "Source of Truth" for game state (`guesses`, `activeCategory`, `gameStatus`).
- **Pattern**: Actions in the store call pure functions from `utils/gameLogic.ts` and update state.
- **Usage**: Components consume state via `useGameStore`.

### B. Logic (`src/utils/gameLogic.ts`)
- **Role**: Pure Game Mechanics.
- **Responsibility**: Calculates results given inputs. DOES NOT modify state directly.
- **Key Functions**:
  - `getFeedback(target, guess, schema)`: Returns directional/proximity feedback.
  - `checkWinCondition(feedback)`: Determines win state.
  - `calculateDeepScan(...)`: Computes percentile ranks.

### C. Types (`src/types.ts`)
- **Key Models**:
  - `Entity`: `{ id: string, name: string, [key: string]: string|number }`
  - `Feedback`: `{ direction: 'UP'|'DOWN'|'EQUAL', status: 'CRITICAL'|'THERMAL'|'NULL' }`
  - `GameData`: Schema-driven data structure.

## 5. Design System (Aesthetic)
The design follows a strict **"E-ink" / "Paper"** aesthetic.

- **Theme**: High contrast, monochrome-leaning.
  - **Background**: `#F5F5F0` (Paper-like off-white)
  - **Foreground/Border**: `#36454F` (Charcoal)
- **Typography**: `Geist Mono` for everything.
- **Shapes**: Sharp corners (`rounded-none` / `--radius: 0px`).
- **Borders**: Heavy styling `border-2`.
- **Feedback UI (`GridCell`)**:
  - **Notch System**: Uses triangular notches on cell borders to indicate 'UP' or 'DOWN' instead of arrows.
  - **Status Colors**:
    - **CRITICAL** (Correct): Green/Bold styling.
    - **THERMAL** (Close): Yellow/Warning styling.
    - **NULL** (Incorrect): Standard styling.

## 6. Development Conventions
- **Tailwind v4**: Use the new syntax (e.g., `@theme inline` in CSS). Avoid `tailwind.config.js` unless necessary.
- **Components**: Functional components with Typed props.
- **Shadcn/UI**: Customized primitives in `src/components/ui`. When adding new ones, ensure they match the E-ink theme (remove rounding, add thick borders).
- **Imports**: modifying imports? Check if `import type` is appropriate.

## 7. Key Features
- **Deep Scan**: Reveal the percentile rank of a specific attribute for the target.
- **Autocomplete**: Custom input component supporting fuzzy search and keyboard navigation.
- **Game Modes**: Difficulty settings (`EASIER` to `HARDEST`) controlling check limits.

## 8. Common Tasks & Snippets

### Adding a new Game Logic Rule
1. update `src/utils/gameLogic.ts` (Pure function).
2. update `src/store/gameStore.ts` to utilize the new logic.

### Modifying UI Theme
1. Edit `src/index.css` CSS variables (`--background`, `--foreground`).
2. Ensure `tailwinds` theme block reflects changes.

---
*Created automatically to assist LLM agents in maintaining context excellence.*
