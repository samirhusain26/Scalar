# Scalar - Project Context

> **Maintenance rule**: When making significant changes (new files, new dependencies, architecture changes, new features), update this file to reflect those changes before committing.

## What Is This Project?
Scalar is a client-side deductive logic guessing game (similar to Wordle but with numerical attributes). Players guess entities (countries, movies, chemical elements, animals) and receive directional/proximity feedback on each attribute to deduce the target. Features a golf-style scoring system where players try to minimize their stroke count.

## Repository Layout
```
Scalar/                              # Git root
├── CLAUDE.md                        # THIS FILE - project context
├── README.md                        # Project documentation
├── .gitignore
├── credentials.json                 # Google Service Account (DO NOT COMMIT - gitignored)
├── fetch_data.py                    # Python script: Google Sheets -> gameData.json
├── package.json                     # npm package (scalar, private)
├── package-lock.json
├── vite.config.ts                   # Vite build config (@ alias -> src/)
├── tsconfig.json                    # TypeScript root config (references app/node)
├── tsconfig.app.json                # App TS config (ES2022, strict)
├── tsconfig.node.json               # Node TS config (ES2023)
├── eslint.config.js                 # ESLint flat config (v9)
├── postcss.config.js                # PostCSS: @tailwindcss/postcss + autoprefixer
├── components.json                  # Shadcn CLI config
├── index.html                       # HTML entry point
└── src/                             # React/TypeScript source
    ├── main.tsx                     # Entry point: StrictMode, imports Geist Mono font + index.css
    ├── App.tsx                      # Root component: header, category selector, scoreboard, grid, input, modals
    ├── App.css                      # Unused Vite boilerplate (safe to delete)
    ├── index.css                    # Tailwind v4 config + CSS custom properties (Editorial Paper & Ink theme)
    ├── types.ts                     # All shared types: DataType, ProximityConfig, SchemaField, Entity, Feedback, Rank, etc.
    ├── assets/
    │   └── data/gameData.json       # Static game data: schema definitions + entity data per category
    ├── store/
    │   └── gameStore.ts             # Zustand store: single source of truth, localStorage persistence (version 3)
    ├── utils/
    │   ├── gameLogic.ts             # Pure functions: getFeedback, checkWinCondition, calculateCategoryHint, calculateRank, etc.
    │   ├── formatters.ts            # formatNumber(): converts to k/M/B/T/P/E suffixed strings
    │   └── cn.ts                    # cn(): clsx + tailwind-merge utility
    ├── lib/
    │   └── utils.ts                 # Duplicate of cn.ts (from Shadcn init)
    └── components/
        ├── ui/                      # Shadcn/UI primitives (button, card, dialog, input)
        ├── GameGrid.tsx             # Main grid: dynamic columns from schema, column visibility, rows
        ├── GameInput.tsx            # Autocomplete input: tag cloud suggestions opening upward, keyboard nav
        ├── GameOverModal.tsx        # Radix Dialog: bottom-sheet on mobile, centered on desktop. Share + Play Again
        ├── GridHeader.tsx           # Column headers: hidden (+) / visible (label + eye) / major-hinted (value + check)
        ├── GridRow.tsx              # Single guess row: name column + data columns, number formatting
        ├── GridCell.tsx             # Individual cell: status colors, directional borders, hidden pattern
        ├── HowToPlayModal.tsx       # Radix Dialog: gameplay instructions, auto-opens on first visit (localStorage: scalar-htp-seen)
        ├── MajorHintModal.tsx       # Radix Dialog: confirmation for major hint (+5 strokes penalty)
        └── Scoreboard.tsx           # Header display: strokes, par offset (E/+X/-X), rank badge
```

## Tech Stack
- **React 19** with **TypeScript ~5.9** (strict mode, `noUnusedLocals`, `noUnusedParameters`)
- **Vite 7** for build/dev (`npm run dev` / `npm run build`)
- **Tailwind CSS v4** (uses `@theme inline` syntax in CSS, NOT `tailwind.config.js`)
- **Zustand 5** for state management with localStorage persistence
- **Shadcn/UI** (Radix UI primitives) for base components
- **Lucide React** for icons (Plus, Eye, Check, Trophy, Medal, Award, etc.)
- **Geist Mono** font everywhere (monospace aesthetic)

## Key Commands
All commands run from repo root:
```bash
npm run dev       # Vite dev server at http://localhost:5173
npm run build     # tsc -b && vite build -> dist/
npm run lint      # ESLint (flat config, v9)
npm run preview   # Preview production build
```

Data fetch (requires `.venv` with `gspread`):
```bash
source .venv/bin/activate && python fetch_data.py
```

## Architecture Pattern (Strict Separation of Concerns)
1. **Types** (`src/types.ts`) - All shared interfaces/types
2. **Pure Logic** (`src/utils/gameLogic.ts`) - Game mechanics as pure functions, NO state mutation
3. **State** (`src/store/gameStore.ts`) - Zustand store calls pure functions, updates state
4. **Components** (`src/components/`) - Consume state via `useGameStore`, render UI

**Data flow**: User action -> Component dispatches store action -> Store calls pure function from gameLogic -> Store updates state -> Components re-render -> localStorage persisted automatically

## Component Details

### App.tsx
- Derives `CATEGORIES` from `gameData.categories` keys
- Renders category tabs, header bar (category name, masked answer, Scoreboard)
- Subtitle: "Daily Logic"
- "How to Play" link opens HowToPlayModal (auto-opens on first visit via localStorage `scalar-htp-seen`)
- Win effect: briefly adds `invert` class to `<html>` on SOLVED status
- Answer display: shows `??????` while PLAYING, reveals name (truncated to 8 chars) when solved

### GameGrid.tsx
- Reads schema for active category, filters out `id` and `name` keys for display columns
- Dynamic row count: `max(guesses.length + 1, 6)` minimum rows
- Displays ALL columns (visible + hidden) via GridHeader and GridRow
- Children: GridHeader, array of GridRow components

### GridHeader.tsx
- Three column header states:
  - **Hidden**: Narrow (w-8), Plus icon, click to reveal (+1 stroke)
  - **Visible**: Full width, label text + Eye icon for numeric fields (triggers MajorHintModal)
  - **Major-hinted**: Inverted colors (bg-charcoal, text-paper-white), shows exact target value + Check icon
- Manages MajorHintModal open/close state internally

### GameInput.tsx
- Autocomplete with upward-opening tag cloud suggestions
- Keyboard navigation: ArrowUp/Down to navigate, Enter to select, Escape to close
- Disabled with "Solved" placeholder when game is SOLVED
- Suggestions limited to 8 items, deduplicated by name
- Shows current stroke count above input

### GameOverModal.tsx
- Radix Dialog with bottom-sheet animation on mobile, centered modal on desktop
- Title: "Puzzle Complete"
- Shows target entity name, score (strokes), par, rank badge
- Share button: builds emoji grid (green/yellow/black squares), uses Web Share API if available, falls back to clipboard
- "Play Again" button to reset

### GridRow.tsx
- Renders single guess row (name + data columns)
- Handles empty rows (placeholder structure with dashed borders)
- Conditional formatting based on columnVisibility (hidden columns render narrow)
- Formats values per field type (currency prefix, int, float, unit suffixes)

### GridCell.tsx
- Status backgrounds: EXACT = `bg-green-600 text-white`, HOT = `bg-yellow-200`, NEAR = `bg-amber-100 border-dashed border-amber-400`, MISS = `bg-gray-200`
- Direction borders: UP = `border-t-[4px] border-t-black`, DOWN = `border-b-[4px] border-b-black`
- Hidden state: `bg-hidden-pattern` (diagonal striped pattern from CSS utility)
- Empty state: `border-dashed border-charcoal`

### HowToPlayModal.tsx
- Auto-opens on first visit (localStorage key: `scalar-htp-seen`)
- Sections: Goal, How It Works, Feedback Colors (with swatches), Direction Indicators, Scoring, Ranks, Hints
- Responsive: bottom-sheet on mobile, centered modal on desktop

### MajorHintModal.tsx
- Simple confirmation dialog for major hint reveal
- Warns about +5 stroke penalty
- Buttons: Cancel, Reveal (+5)

### Scoreboard.tsx
- Right side of header bar
- Displays: Strokes count, par offset (E/+X/-X), Par value, Rank icon + label
- Rank icons: Trophy (GOLD), Medal (SILVER), Award (BRONZE)
- Rank label hidden on mobile (sm:inline)

## Store (gameStore.ts)
```
State:
  activeCategory: string              (default: 'countries')
  targetEntity: Entity                (random on init/reset)
  guesses: GuessResult[]
  gameStatus: 'PLAYING' | 'SOLVED'
  score: number                       (golf-style stroke count, lower is better)
  par: number                         (default: 4)
  columnVisibility: Record<string, boolean>  (2 random columns visible initially)
  majorHintAttributes: string[]       (tracks which attrs have been major-hinted)

Actions:
  setActiveCategory(cat) -> full reset with new target, new column visibility
  submitGuess(entity) -> computes feedback, increments score +1, checks win
  revealColumn(attr) -> makes hidden column visible, +1 stroke penalty
  revealMajorHint(attr) -> reveals exact target value in header, +5 stroke penalty
  resetGame() -> new target, clear guesses, keep category
```

Persisted to localStorage under key `scalar-game-storage` (version 3 with migration).

## Game Logic (gameLogic.ts) - Pure Functions

| Function | Purpose |
|----------|---------|
| `getFeedback(target, guess, schema)` | Compares target vs guess, returns feedback per field |
| `checkWinCondition(feedback)` | Returns true if ALL statuses are EXACT |
| `calculateCategoryHint(gameData, category, attribute, targetValue)` | Calculates percentile bracket hint for target attribute |
| `getSuggestions(entities, query, guessedIds)` | Fuzzy match for autocomplete (max 8) |
| `getRandomTarget(gameData, category)` | Random entity from category |
| `calculateRank(score, par)` | Returns RankInfo: GOLD (≤par), SILVER (≤par+3), BRONZE (>par+3) |
| `getInitialColumnVisibility(schema)` | Randomly picks 2 columns to start visible |

## Scoring System (Golf-Style)
- **+1 stroke** per guess submitted
- **+1 stroke** per hidden column revealed
- **+5 strokes** per major hint (exact value reveal)
- **Par**: 4 (default)
- **Ranks**:
  - GOLD "Editorial Choice" (score ≤ par)
  - SILVER "Subscriber" (score ≤ par + 3)
  - BRONZE "Casual Reader" (score > par + 3)

## Column Visibility System
- On game start, 2 random columns are visible; the rest are hidden
- Hidden columns appear as narrow collapsed headers with a `+` icon
- Hidden cells display a diagonal hatched pattern (`bg-hidden-pattern`)
- Revealing a hidden column costs +1 stroke
- Major hint (Eye icon on numeric visible columns) reveals the target's exact value in the header for +5 strokes

## Design System Rules
- **Minimalist Digital Paper / Editorial** aesthetic - high contrast, monochrome-leaning, clean and minimalist
- Background: `#F9F9F7` (paper-white), Foreground/Borders: `#1A1A1A` (charcoal)
- **Sharp corners** (`--radius: 0px`), thin borders (`border` / 1px)
- **Geist Mono** for ALL text
- Feedback colors: EXACT = green, HOT = yellow, NEAR = muted amber with dashed border, MISS = gray
- Direction indicators: UP = top border (4px), DOWN = bottom border (4px)
- Hidden cells: diagonal striped pattern via CSS `bg-hidden-pattern` utility
- When adding Shadcn/UI components: remove rounding, use thin borders to match theme

## TypeScript Conventions
- Use `import type` for type-only imports (enforced by `verbatimModuleSyntax`)
- Path alias: `@/` maps to `src/` (configured in vite.config.ts and tsconfig.app.json)
- Target: ES2022, strict mode enabled
- All React components are functional with typed props
- `gameData.json` is cast via `as unknown as GameData` or `as any` for dynamic access

## Important Gotchas
- `App.css` contains leftover Vite boilerplate styles (unused) - safe to ignore or clean up
- `credentials.json` is gitignored - needed only for the Python data fetch script
- No test framework is configured - `gameLogic.ts` pure functions are the best candidates for unit tests
- localStorage keys: `scalar-game-storage` (game state), `scalar-htp-seen` (how-to-play modal shown)
- `lib/utils.ts` is a duplicate of `utils/cn.ts` (from Shadcn init)
- Store version is 3 - bumping it triggers migration (clears stale localStorage)
- No difficulty modes exist - the game is a single difficulty with golf-style scoring
- No "LOST" state - game only ends when the target is found (status: PLAYING -> SOLVED)

## Game Concepts Reference
- **Categories**: countries, hollywood, chemicals, animals (driven by `gameData.json` schema)
- **Feedback statuses**: EXACT (exact match), HOT (within proximityConfig value), NEAR (outside HOT but within value * nearMultiplier), MISS (no proximity match)
- **ProximityConfig**: `{ type: 'PERCENT' | 'RANGE', value: number, nearMultiplier: number }` - PERCENT uses `value * |target|` as allowance, RANGE uses `value` as absolute allowance. `nearMultiplier` scales the range for the NEAR tier.
- **Feedback directions**: UP (target higher), DOWN (target lower), EQUAL, NONE (strings)
- **Column visibility**: 2 columns visible at start, others hidden. Reveal costs +1 stroke.
- **Major hint**: Reveals exact target value for a column header. Costs +5 strokes.
- **Win condition**: All feedback fields are EXACT
- **Ranks**: GOLD (Editorial Choice), SILVER (Subscriber), BRONZE (Casual Reader) based on score vs par

## Common Task Patterns

### Adding a new game mechanic
1. Add pure function to `src/utils/gameLogic.ts`
2. Add state/action to `src/store/gameStore.ts` that calls the pure function
3. Consume new state in the relevant component

### Adding a new category
1. Add schema + entity data to `gameData.json` (or update Google Sheet and run `fetch_data.py`)
2. UI auto-discovers - no code changes needed

### Adding a new UI component
1. Use Shadcn CLI or create manually in `src/components/`
2. Match editorial theme: sharp corners, `border border-charcoal`, Geist Mono font
3. Use `cn()` from `@/utils/cn` for conditional class merging

### Modifying theme
1. Edit CSS custom properties in `src/index.css` `:root` block
2. Colors use HSL format without `hsl()` wrapper (Tailwind v4 convention)

### Modifying scoring
1. Stroke costs are defined in `gameStore.ts` actions (`submitGuess` +1, `revealColumn` +1, `revealMajorHint` +5)
2. Par is hardcoded to 4 in store initial state and `resetGame`
3. Rank thresholds are in `calculateRank()` in `gameLogic.ts`
