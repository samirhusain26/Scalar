# SCALAR

> A deductive logic game where players guess entities based on attribute feedback — featuring a Total Moves scoring system, geographic distance, set intersection, and a minimalist thermal e-paper aesthetic.

![Scalar Game](https://img.shields.io/badge/Version-0.0.0-blue)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwind-css)

---

## Table of Contents

- [Overview](#overview)
- [Gameplay & Rules](#gameplay--rules)
  - [Objective](#objective)
  - [How to Play](#how-to-play)
  - [Feedback System](#feedback-system)
  - [Categories & Attributes](#categories--attributes)
  - [Folded Clues & Major Hints](#folded-clues--major-hints)
  - [Scoring](#scoring)
  - [Winning, Forfeiting & Sharing](#winning-forfeiting--sharing)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Architecture](#project-architecture)
  - [Directory Structure](#directory-structure)
  - [Core Type Definitions](#core-type-definitions)
  - [State Management](#state-management)
  - [Game Logic — Feedback Engine](#game-logic--feedback-engine)
  - [Feedback Color System](#feedback-color-system)
  - [Component Hierarchy](#component-hierarchy)
- [Data Pipeline](#data-pipeline)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Development](#development)
  - [Production Build](#production-build)
- [Extending the Game](#extending-the-game)
- [Design System](#design-system)
- [License](#license)

---

## Overview

**Scalar** is a deductive logic game inspired by games like Wordle, but instead of guessing words, players guess **entities** (countries, movies, chemical elements, animals) based on a feedback loop of attribute comparisons. Each guess reveals feedback via five different logic systems — higher/lower arrows, proximity tiers, geographic distance gradients, category matching, and set intersection — enabling players to narrow down the target entity through logical deduction.

The game uses a **Total Moves scoring system** — every guess costs +1 move, and players start with 3 free hint credits. Once credits are spent, hints cost additional moves. The goal is to solve the puzzle in as few total moves as possible.

The web version features a responsive card-based layout with a high-contrast, minimalist **"Thermal E-Paper / Scientific Journal"** aesthetic — charcoal ink on paper-white canvas, sharp corners, monospaced typography, and thermal feedback colors (green, orange, amber, white).

---

## Gameplay & Rules

### Objective

A hidden target entity is selected at random from the active category. Identify the target by submitting guesses and interpreting the feedback on each attribute. Every action costs moves — find the answer with the fewest total moves.

### How to Play

1. **Select a category** — Countries, Hollywood, Chemicals, or Animals. Each has its own attribute schema with unique feedback logic.
2. **Submit a guess** — Type in the input field. An autocomplete dropdown surfaces up to 8 matching entities. Arrow keys to navigate, Enter to confirm. Each guess costs **+1 move**.
3. **Read the feedback** — A new card appears in the grid with color-coded feedback per attribute:
   - **Arrows** (↑/↓) and tier text indicate direction and distance for numeric fields
   - **Thermal colors** indicate proximity — green for exact, orange for hot, amber for near, white for miss
   - **Distance** shows geographic distance in km (Countries category)
   - **Overlap** shows set intersection with per-item match coloring for list fields (e.g., Genre, Cast & Crew)
4. **Expand "More clues"** — Each card has a collapsible section with additional folded attributes. Tap the chevron to expand and see more feedback at no cost.
5. **Use hints strategically** — Tap the Eye icon on any attribute to reveal the exact target value (free with credits, else +3 moves).
6. **Solve** — Match every attribute exactly. Your final move count is your score.
7. **Give up** — If stuck, click "Reveal Answer" at the bottom to see the target entity and all its attributes. This ends the game as a forfeit with no score.

### Feedback System

Each attribute is evaluated by its **logic type** and returns feedback signals including **status** (proximity), **direction** (adjustment vector), and optionally a **display value** (formatted representation).

#### Logic Types

Scalar uses five distinct feedback logic types, each suited to a different kind of data:

**EXACT_MATCH** — Binary equality for strings and booleans.
- Compares values case-insensitively
- Returns EXACT (green) or MISS (white)
- Used for: Driving Side, Diet, Landlocked?, Radioactive, Conservation Status, Activity

**CATEGORY_MATCH** — String equality with optional distance-based coloring.
- Compares category strings case-insensitively
- When paired with `DISTANCE_GRADIENT` coloring, cells show green for exact text match, white for miss (binary coloring, no intermediate gradient)
- Returns EXACT or MISS
- Used for: Continent, Subregion, Hemisphere, Production Co., Phase, MPAA Rating

**HIGHER_LOWER** — Numeric comparison with direction arrows and percentage difference.
- Shows ↑ (target is higher) or ↓ (target is lower) as text arrows in a split cell layout (value left, arrow+tier right)
- Displays percentage difference in tiers (~10%, ~25%, ~50%, ~100%) or multiplier tiers for large diffs (2x+, 5x+, 10x+, 50x+, 100x+)
- Year fields use absolute year difference tiers (±2 yrs, ±5 yrs, ±10 yrs, ±25 yrs, ±50 yrs, 50+ yrs) instead of percentages
- Status determined by **linked category column**: HOT (orange) if the guess and target share the same category bucket, MISS (white) otherwise
- Alternate display formats: relative percentage (e.g., "+34%"), currency ("↑ $1.2B"), alpha position (A-Z letters), or raw number
- Used for: Population, Area, GDP, Atomic #, Release Year, IMDb Rating, Weight, Lifespan

**GEO_DISTANCE** — Haversine great-circle distance between geographic coordinates.
- Pre-computes distance in km using latitude/longitude
- Status tiers: EXACT (0 km), HOT (<1,000 km), NEAR (<3,000 km), MISS (>=3,000 km)
- Displays formatted distance (e.g., "1,234 km")
- Used for: Distance column in Countries (virtual computed field)

**SET_INTERSECTION** — Overlap of comma-separated lists.
- Splits both target and guess values by comma, computes intersection-over-union ratio
- Status tiers: EXACT (ratio = 1.0), HOT (> 0.5), NEAR (> 0), MISS (0)
- Displays "X/Y" where X = matching items, Y = target item count
- Used for: Genre, Cast & Crew in Hollywood

#### Status Colors (Thermal Palette)

| Status | Color | Hex | Meaning |
|--------|-------|-----|---------|
| **EXACT** | Green | `#22C55E` | Exact match. This attribute matches the target. |
| **HOT** | Orange | `#F97316` | Close. Within the inner proximity range or category match. |
| **NEAR** | Muted Amber | `#FEF3C7` | Nearby. Outside HOT but within the extended range. Dashed border. |
| **MISS** | White | `#FFFFFF` | No match. Outside all proximity ranges. |

#### GEO_DISTANCE Colors (Distance Cell)

For the Distance field in Countries (computed via Haversine formula):

| Distance | Color | Hex |
|----------|-------|-----|
| < 1,000 km (includes 0 km) | Green | `#22C55E` |
| < 3,000 km | Amber | `#F59E0B` |
| < 5,000 km | Yellow | `#FACC15` |
| >= 5,000 km | White | — |

#### Location Text Colors (DISTANCE_GRADIENT)

For text fields with distance-gradient coloring (Continent, Subregion, Hemisphere), coloring is binary:

| Condition | Color | Hex |
|-----------|-------|-----|
| Exact text match | Green | `#22C55E` |
| No match | White | — |

#### Category Match Colors (Linked Columns)

For HIGHER_LOWER fields with a linked category column, the cell background indicates whether the guess falls in the same category bucket as the target:

| Match | Color | Hex |
|-------|-------|-----|
| Exact match | Green | `#22C55E` |
| Same category | Gold | `#EAB308` |
| Different category | White | — |

#### Direction Indicators (Numeric Fields Only)

Numeric cells display **text arrows** indicating which way to adjust, shown in the secondary text alongside the tier:

| Indicator | Symbol | Meaning |
|-----------|--------|---------|
| **UP** | ↑ | Target is **higher** than your guess. |
| **DOWN** | ↓ | Target is **lower** than your guess. |
| **EQUAL** | (none) | Exact match. |

For ALPHA_POSITION fields, horizontal arrows (←/→) indicate earlier/later in the alphabet.

Direction is independent of status. A HOT cell with ↑ means you are close but still need to go higher.

#### Percentage Difference Tiers

For HIGHER_LOWER fields with PERCENTAGE_DIFF display format, the percentage difference is bucketed into readable tiers:

| Actual % Diff | Displayed Tier |
|---------------|----------------|
| 0% | Exact |
| 1–15% | ~10% |
| 16–37% | ~25% |
| 38–75% | ~50% |
| 76–150% | ~100% |
| 150%+ (< 5x) | 2x+ |
| 5x – 10x | 5x+ |
| 10x – 50x | 10x+ |
| 50x – 100x | 50x+ |
| 100x+ | 100x+ |

For **year fields** (Release Year, Discovered), absolute year difference tiers are used instead:

| Year Diff | Displayed Tier |
|-----------|----------------|
| 0 | Exact |
| 1–2 years | ±2 yrs |
| 3–5 years | ±5 yrs |
| 6–10 years | ±10 yrs |
| 11–25 years | ±25 yrs |
| 26–50 years | ±50 yrs |
| 50+ years | 50+ yrs |

### Categories & Attributes

Each category defines its own schema with specific logic types, display formats, and folded/visible states.

#### Countries
| Attribute | Logic | Display | Notes |
|-----------|-------|---------|-------|
| Continent | Category Match | Text | Distance gradient coloring |
| Subregion | Category Match | Text | Distance gradient coloring |
| Hemisphere | Category Match | Text | Distance gradient coloring |
| Distance | Geo Distance | Distance (km) | Virtual: computed from lat/lon coordinates |
| Area (sq km) | Higher/Lower | % Diff Tier | Linked to area category |
| Population | Higher/Lower | % Diff Tier | Linked to population category |
| GDP / Capita | Higher/Lower | % Diff Tier | Linked to GDP category |
| Armed Forces | Higher/Lower | % Diff Tier | Linked to armed forces category |
| Landlocked? | Exact Match | Yes/No | *Folded* (expandable) |
| Timezones | Higher/Lower | Number | *Folded*, linked to timezone category |
| Pop. Density | Higher/Lower | Number | *Folded*, linked to density category |
| Olympics Hosted | Higher/Lower | Number | *Folded* |
| Last Olympics | Higher/Lower | Number | *Folded* |

#### Hollywood
| Attribute | Logic | Display | Notes |
|-----------|-------|---------|-------|
| Release Year | Higher/Lower | Number | Linked to year category |
| Genre | Set Intersection | X/Y overlap | Comma-separated list |
| Cast & Crew | Set Intersection | X/Y overlap | Comma-separated list |
| Runtime (mins) | Higher/Lower | Number | Linked to duration category |
| Production Co. | Category Match | Text | |
| Box Office | Higher/Lower | Currency ($) | Linked to box office category |
| IMDb Rating | Higher/Lower | Number | *Folded*, linked to rating category |
| MPAA Rating | Category Match | Text | *Folded* |
| Oscars Won | Higher/Lower | Number | *Folded* |
| Source Material | Category Match | Text | *Folded* |

#### Chemicals
| Attribute | Logic | Display | Notes |
|-----------|-------|---------|-------|
| Atomic # | Higher/Lower | Number | |
| Group | Higher/Lower | Number | Linked to group block name |
| Phase (STP) | Category Match | Text | Solid, Liquid, or Gas |
| Rarity | Category Match | Text | |
| Discovered | Higher/Lower | Number | Linked to year range |
| Atomic Mass | Higher/Lower | Number | *Folded*, linked to mass range |
| Density | Higher/Lower | Number | *Folded*, linked to density range |
| Melt Point (K) | Higher/Lower | Number | *Folded*, linked to melt range |
| Boil Point (K) | Higher/Lower | Number | *Folded*, linked to boil range |
| Radioactive | Exact Match | Yes/No | *Folded* |
| Synthetic | Exact Match | Yes/No | *Folded* |
| Neutrons | Higher/Lower | Number | *Folded* |
| Electronegativity | Higher/Lower | Number | *Folded* |
| Atomic Radius | Higher/Lower | Number | *Folded* |
| Ionization | Higher/Lower | Number | *Folded* |
| Conductivity | Category Match | Text | *Folded* |
| Period | Higher/Lower | Number | *Folded* |

#### Animals
| Attribute | Logic | Display | Notes |
|-----------|-------|---------|-------|
| Class | Exact Match | Text | Mammal, Reptile, Bird, etc. |
| Skin Type | Exact Match | Text | Fur, Scales, Feathers, etc. |
| Diet | Exact Match | Text | Herbivore, Carnivore, Omnivore |
| Weight | Higher/Lower | Relative % | Linked to weight class |
| Height (cm) | Higher/Lower | Relative % | Linked to height class |
| Top Speed | Higher/Lower | Number | Linked to speed class |
| Lifespan | Higher/Lower | Number | Linked to lifespan class |
| Daily Sleep | Higher/Lower | Number | *Folded*, linked to sleep class |
| Gestation | Higher/Lower | Number | *Folded* |
| Activity | Exact Match | Text | *Folded* (Diurnal, Nocturnal, etc.) |
| Status | Exact Match | Text | *Folded* (conservation status) |

### Folded Clues & Major Hints

The game uses a two-tier information reveal system beyond the standard visible attributes:

#### Folded Clues (Expandable)
- Schema fields marked as "folded" are placed in a collapsible **"More clues"** section at the bottom of each guess card
- Tap the chevron toggle to expand/collapse — **no move penalty** to view
- Folded fields render with full feedback coloring, direction borders, and all logic types when expanded
- Each card tracks its own expanded/collapsed state independently (default: collapsed)

#### Hints (Eye Icon)
- **All cells** show a small **Eye** icon in the top-right corner (opacity-40, visible on hover)
- Click to reveal the **exact target value** for that attribute, displayed as an inverted badge (charcoal background, paper-white text, Check icon)
- A confirmation dialog warns about the cost before proceeding
- **Cost:** Free if credits are available (consumes 1 credit), otherwise **+3 moves**
- The Location cell (merged Continent/Subregion/Hemisphere) reveals all 3 attributes at once for a single credit/cost
- Once revealed, the badge appears on that cell across all guess cards

### Scoring

Scalar uses a **Total Moves** scoring system where lower is better:

| Action | Move Cost |
|--------|-----------|
| Submit a guess | +1 |
| Reveal a hidden column | Free (with credit) or +3 |
| Reveal a folded attribute | Free (with credit) or +3 |
| Use a hint (Eye icon) | Free (with credit) or +3 |

#### Free Hint Credits
- Players start each game with **3 free hint credits**
- Credits are consumed (one at a time) when revealing columns, folded attributes, or using Eye icon hints (0 move cost)
- Once credits are spent, the same actions cost **+3 moves** each
- Credits are displayed in the Scoreboard as 3 filled/empty squares
- Credits reset to 3 on new game or category change

The Scoreboard in the header displays your current move count and remaining hint credits in real time.

### Winning, Forfeiting & Sharing

**Win condition:** All feedback fields in a single guess return EXACT status — every attribute is an exact match. On win:
- The display briefly inverts (screen flash effect via `invert` class on `<html>`)
- A "Puzzle Complete" modal shows the target entity name and total moves

**Reveal answer (forfeit):** Players can choose to reveal the answer at any time by clicking "Reveal Answer" at the bottom:
- An "Answer Revealed" modal shows the target entity with all its attribute values in a scrollable list
- The game transitions to the REVEALED state (distinct from SOLVED)
- No score is retained — this is a forfeit
- A "New Game" button starts a fresh round

**Sharing results:**
- The **Share Result** button generates an emoji grid representation of your game
- Green squares for EXACT, yellow for HOT/NEAR, black for MISS
- Includes total move count in the shared text
- Uses Web Share API if available, falls back to clipboard copy

---

## Features

- **Five feedback logic types** — Higher/Lower, Exact Match, Category Match, Geographic Distance, and Set Intersection provide rich, varied feedback across categories.
- **Total Moves scoring** — Every action costs moves. Balance information gathering against move count to minimize your total.
- **Free hint credits** — Start with 3 free credits per game. Use them to reveal attributes at no move cost.
- **Hints** — Tap the Eye icon on any attribute to reveal the exact target value. Free with credits, +3 moves without.
- **Card-based responsive layout** — Each guess renders as an individual data card with header, attribute grid, and expandable folded section. Responsive CSS Grid: 1 column (mobile), 2 columns (tablet), 3 columns (desktop).
- **Geographic distance** — Countries category uses Haversine distance with thermal gradient coloring (green → amber → yellow → white) for geographic proximity.
- **Set intersection** — Hollywood category uses overlap ratios for multi-value fields like Genre and Cast.
- **Linked category matching** — Numeric fields can reference category columns, turning HOT (orange) when your guess falls in the same bucket as the target.
- **Data-driven architecture** — Categories, schemas, and entities loaded from JSON. Adding a new category requires zero code changes.
- **4 categories** — Countries, Hollywood movies, Chemical elements, Animals — each with unique attribute schemas and logic configurations.
- **Autocomplete input** — Fuzzy-matching search with keyboard navigation, tag-cloud dropdown, and up to 8 suggestions.
- **Persistent state** — Game progress saved to localStorage automatically. Refresh and pick up where you left off.
- **Share results** — Share your result via native share sheet or clipboard with an emoji grid summary.
- **Merged Location cell** — Countries category merges Continent, Subregion, and Hemisphere into a single "Location" row with per-attribute match coloring.
- **Thermal e-paper aesthetic** — Monospaced Geist Mono typography, Fraunces Variable serif for headings, high-contrast "charcoal on paper" palette, sharp corners, hard-edge shadows, and a screen-inversion effect on win.
- **Venn diagram visual identity** — SVG logo with overlapping teal/pink circles and golden intersection, plus animated background orbs.
- **Reveal answer** — Stuck? Reveal the target entity and all its attributes to learn and move on.
- **Responsive design** — Card grid layout on desktop, single-column on mobile with bottom-sheet modals.

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| [React](https://react.dev/) | 19 | UI Framework |
| [Vite](https://vitejs.dev/) | 7 | Build Tool & Dev Server |
| [TypeScript](https://www.typescriptlang.org/) | ~5.9 | Type Safety (strict mode) |
| [Tailwind CSS](https://tailwindcss.com/) | 4 | Styling (CSS-first `@theme inline` config) |
| [Zustand](https://github.com/pmndrs/zustand) | 5 | State Management (with localStorage persistence) |
| [Radix UI](https://www.radix-ui.com/) | — | Accessible Dialog Primitives |
| [Lucide React](https://lucide.dev/) | — | Icon Library (Eye, Check, ChevronDown) |
| [class-variance-authority](https://cva.style/docs) | — | Component Variants |
| [tailwindcss-animate](https://github.com/jamiebuilds/tailwindcss-animate) | — | Animation Utilities |
| [Geist Mono](https://vercel.com/font) | — | Body/data monospace font |
| [Fraunces Variable](https://fonts.google.com/specimen/Fraunces) | — | Serif display font for headings |

---

## Project Architecture

### Directory Structure

```
Scalar/
├── CLAUDE.md                        # Project context for AI assistants
├── README.md                        # This file
├── .gitignore
├── fetch_data.py                    # Python: CSV -> gameData.json
├── package.json                     # npm package (scalar, private)
├── package-lock.json
├── vite.config.ts                   # Vite config (@ alias -> src/)
├── tsconfig.json                    # Root TS config (references app/node)
├── tsconfig.app.json                # App TS config (ES2022, strict)
├── tsconfig.node.json               # Node TS config (ES2023)
├── eslint.config.js                 # ESLint flat config (v9)
├── postcss.config.js                # PostCSS: @tailwindcss/postcss + autoprefixer
├── components.json                  # Shadcn CLI config
├── index.html                       # HTML entry point
├── data/                            # Source data (schema configs + enriched CSVs)
│   ├── {category}_schema_config.csv # Schema definitions per category
│   └── {category}_enriched.csv      # Entity data per category
└── src/
    ├── main.tsx                     # Entry point: StrictMode, Geist Mono + Fraunces imports
    ├── App.tsx                      # Root: header bar, category selector, game grid, modals
    ├── index.css                    # Tailwind v4 @theme config + CSS custom utilities
    ├── types.ts                     # All shared types/interfaces
    ├── assets/data/
    │   └── gameData.json            # Static game data (auto-generated by fetch_data.py)
    ├── store/
    │   └── gameStore.ts             # Zustand store: state + actions, localStorage persistence (v11)
    ├── utils/
    │   ├── gameLogic.ts             # Feedback engine (dispatch by logicType) + game utilities
    │   ├── feedbackColors.ts        # Cell color logic: geo distance, category match, standard status
    │   ├── formatters.ts            # formatNumber(), formatDistance(), formatPercentageDiffTier(), formatYearDiffTier(), expandConservationStatus(), getDirectionSymbol(), getAlphaDirectionSymbol(), numberToLetter()
    │   ├── geo.ts                   # haversineDistance(): great-circle distance in km
    │   ├── schemaParser.ts          # getDisplayColumns(), getFoldedColumns(), getVisibleCandidateColumns(), getFieldByKey()
    │   └── cn.ts                    # cn(): clsx + tailwind-merge utility
    ├── lib/
    │   └── utils.ts                 # cn() duplicate (from Shadcn init)
    └── components/
        ├── ui/                      # Shadcn/UI primitives (button, card, dialog, input)
        ├── GameGrid.tsx             # Responsive card grid: CSS Grid container, manages MajorHintModal
        ├── GuessCard.tsx            # Individual guess card: header, attribute grid, expandable folded section
        ├── GameInput.tsx            # Autocomplete input: downward tag cloud dropdown, keyboard nav
        ├── GameOverModal.tsx        # Radix Dialog: "Puzzle Complete" — share + play again
        ├── RevealAnswerModal.tsx    # Radix Dialog: shows target entity + all attributes on forfeit
        ├── HowToPlayModal.tsx       # Radix Dialog: gameplay instructions, auto-opens first visit
        ├── MajorHintModal.tsx       # Radix Dialog: confirmation for hint reveal (free with credits, +3 moves without)
        ├── Scoreboard.tsx           # Header display: moves count, free hint credit indicators
        ├── ScalarLogo.tsx           # Venn diagram SVG logo component (teal/pink circles, golden intersection)
        └── VennBackground.tsx       # Animated decorative background with venn orbs
```

### Core Type Definitions

Located in `src/types.ts`:

```typescript
// Data types for schema field definitions
type DataType = 'INT' | 'FLOAT' | 'STRING' | 'CURRENCY' | 'BOOLEAN' | 'LIST';

// Logic types (how feedback is computed per field)
type LogicType =
    | 'EXACT_MATCH'       // Binary equality
    | 'CATEGORY_MATCH'    // String match with optional distance gradient
    | 'HIGHER_LOWER'      // Numeric comparison with direction + percentage
    | 'GEO_DISTANCE'      // Haversine distance between coordinates
    | 'SET_INTERSECTION'  // Comma-separated list intersection
    | 'TARGET'            // Entity name (identification only)
    | 'NONE';             // Support column (not displayed)

// Display formats (how the cell renders its value)
type DisplayFormat =
    | 'HIDDEN'              // Not shown in grid
    | 'TEXT'                // Raw string
    | 'DISTANCE'            // Formatted km distance
    | 'PERCENTAGE_DIFF'     // Arrow + % tier (↑ ~25%)
    | 'RELATIVE_PERCENTAGE' // Arrow + relative % (↑ +34%)
    | 'NUMBER'              // Raw number
    | 'CURRENCY'            // Arrow + $value
    | 'LIST'                // Intersection count (X/Y)
    | 'ALPHA_POSITION';     // Letter (1→A, 2→B, ..., 26→Z) with horizontal arrows

// UI color logic (how cell background is determined)
type UIColorLogic =
    | 'DISTANCE_GRADIENT'   // Color by haversine distance
    | 'CATEGORY_MATCH'      // Gold/gray by category match
    | 'STANDARD'            // Traditional EXACT/HOT/NEAR/MISS
    | 'NONE';

// Schema field definition (from CSV schema config)
interface SchemaField {
    attributeKey: string;
    displayLabel: string;
    dataType: DataType;
    logicType: LogicType;
    displayFormat: DisplayFormat;
    isFolded: boolean;            // Placed in expandable "More clues" section
    isVirtual: boolean;           // Computed field (e.g., distance_km)
    linkedCategoryCol?: string;   // Category column for status coloring
    uiColorLogic?: UIColorLogic;  // Override cell color logic
}

// Feedback for a single cell
interface Feedback {
    direction: FeedbackDirection;     // UP, DOWN, EQUAL, NONE
    status: FeedbackStatus;           // EXACT, HOT, NEAR, MISS
    value: string | number | boolean;
    displayValue?: string;            // Formatted display string
    distanceKm?: number;              // For GEO_DISTANCE / DISTANCE_GRADIENT
    percentageDiff?: number;          // For HIGHER_LOWER
    categoryMatch?: boolean;          // For linked category coloring
}

// Game states
type GameStatus = 'PLAYING' | 'SOLVED' | 'REVEALED';
```

### State Management

The game uses **Zustand** with localStorage persistence (`src/store/gameStore.ts`):

```typescript
interface GameState {
    // Core State
    activeCategory: string;                    // Current category (default: 'countries')
    targetEntity: Entity;                      // Entity to guess (random on init)
    guesses: GuessResult[];                    // Past guesses with feedback
    gameStatus: 'PLAYING' | 'SOLVED' | 'REVEALED';

    // Scoring
    moves: number;                             // Total moves (lower is better)
    credits: number;                           // Free hint credits (default: 3)

    // Visibility
    columnVisibility: Record<string, boolean>; // Which non-folded columns are visible
    majorHintAttributes: string[];             // Columns with revealed exact target values

    // Actions
    setActiveCategory(category: string): void; // Full reset with new category
    submitGuess(guess: Entity): void;          // +1 move, compute feedback, check win
    revealColumn(attributeId: string): void;   // Free (credit) or +3 moves
    revealFoldedAttribute(key: string): void;  // Free (credit) or +3 moves
    revealMajorHint(attributeId: string | string[]): void; // Free (credit) or +3 moves
    revealAnswer(): void;                      // Forfeit: set status to REVEALED
    resetGame(): void;                         // New target, keep category, reset moves/credits
}
```

**Key Behaviors:**
- All non-folded display columns are **visible by default** — `getInitialColumnVisibility()` sets all non-folded, non-hidden fields to `true`
- Category changes trigger a full game reset: new target, cleared guesses, fresh column visibility, moves reset to 0, credits reset to 3
- Hint credit system: 3 free credits per game. `revealColumn`, `revealFoldedAttribute`, and `revealMajorHint` all consume a credit (0 moves) if available, otherwise cost +3 moves
- Game state persists to localStorage (key: `scalar-game-storage`, version 11, with migration that clears stale state)
- Win condition checked after each guess — all feedback fields must be `EXACT`
- Players can forfeit via `revealAnswer()`, transitioning to the REVEALED state
- No loss state — players keep guessing until they solve it or choose to reveal
- Store constants: `HINT_MOVE_COST = 3`, `DEFAULT_CREDITS = 3`

### Game Logic — Feedback Engine

The feedback system in `src/utils/gameLogic.ts` uses a **dispatch pattern** based on each schema field's `logicType`:

```
getFeedback(target, guess, schema)
  ├── Pre-computes haversine distance (for DISTANCE_GRADIENT fields)
  └── For each schema field (skipping TARGET and NONE):
      ├── EXACT_MATCH    → handleExactMatch()
      ├── CATEGORY_MATCH → handleCategoryMatch()
      ├── HIGHER_LOWER   → handleHigherLower()
      ├── GEO_DISTANCE   → handleGeoDistance()
      └── SET_INTERSECTION → handleSetIntersection()
```

**Handler Summary:**

| Handler | Logic | Status Rules |
|---------|-------|-------------|
| `handleExactMatch` | Binary equality (case-insensitive strings, boolean→Yes/No) | EXACT or MISS |
| `handleCategoryMatch` | String equality; attaches `distanceKm` when `uiColorLogic === 'DISTANCE_GRADIENT'` | EXACT or MISS |
| `handleHigherLower` | Numeric comparison; computes `percentageDiff`; checks `linkedCategoryCol` for status; builds display value by `displayFormat` (PERCENTAGE_DIFF, RELATIVE_PERCENTAGE, CURRENCY, or raw) | EXACT (equal), HOT (linked category matches), MISS |
| `handleGeoDistance` | Uses pre-computed haversine distance in km | EXACT (0km), HOT (<1000km), NEAR (<3000km), MISS |
| `handleSetIntersection` | Comma-separated list intersection-over-union ratio | EXACT (1.0), HOT (>0.5), NEAR (>0), MISS (0) |

**Game Utility Functions:**

| Function | Location | Purpose |
|----------|----------|---------|
| `getRandomTarget(gameData, category)` | gameLogic.ts | Random entity from category |
| `checkWinCondition(feedback)` | gameLogic.ts | Returns true if all statuses are EXACT |
| `getSuggestions(entities, query, guessedIds)` | gameLogic.ts | Fuzzy autocomplete (max 8, deduplicated by name) |
| `getInitialColumnVisibility(schema)` | gameLogic.ts | Sets all non-folded display columns to visible |
| `haversineDistance(lat1, lon1, lat2, lon2)` | geo.ts | Great-circle distance in km using Haversine formula |
| `formatNumber(num, digits)` | formatters.ts | Converts to k/M/B/T/P/E suffixed strings |
| `formatDistance(km)` | formatters.ts | Formatted distance (e.g., "1,234 km") |
| `formatPercentageDiffTier(percentDiff)` | formatters.ts | Buckets into tiers: "Exact", "~10%", "~25%", "~50%", "~100%", then multiplier tiers: "2x+", "5x+", "10x+", "50x+", "100x+" |
| `formatYearDiffTier(absDiff)` | formatters.ts | Absolute year difference tiers: "Exact", "±2 yrs", "±5 yrs", "±10 yrs", "±25 yrs", "±50 yrs", "50+ yrs" |
| `expandConservationStatus(code)` | formatters.ts | Expands IUCN codes to full labels (LC→Least Concern, EN→Endangered, etc.) |
| `getDirectionSymbol(direction)` | formatters.ts | Returns "↑" for UP, "↓" for DOWN, "" otherwise |
| `getAlphaDirectionSymbol(direction)` | formatters.ts | Returns "→" for UP (later in alphabet), "←" for DOWN (earlier) |
| `numberToLetter(num)` | formatters.ts | Converts 1-26 to A-Z letter character |
| `getDisplayColumns(schema)` | schemaParser.ts | Fields where `displayFormat !== 'HIDDEN'` |
| `getFoldedColumns(schema)` | schemaParser.ts | Fields where `isFolded === true` |
| `getVisibleCandidateColumns(schema)` | schemaParser.ts | Display fields that are NOT folded |
| `getFieldByKey(schema, key)` | schemaParser.ts | Lookup by `attributeKey` |

### Feedback Color System

Color logic is centralized in `src/utils/feedbackColors.ts` with a composite dispatcher:

```
getCellColor(feedback, field)
  ├── GEO_DISTANCE logicType → getGeoDistanceCellClass(distanceKm)
  │   └── <1000km: green, <3000km: amber, <5000km: yellow, else: white
  ├── DISTANCE_GRADIENT uiColorLogic → binary: green if EXACT, white if miss
  ├── CATEGORY_MATCH uiColorLogic (or categoryMatch present)
  │   └── EXACT: green, match: bg-cat-match (gold), miss: white
  └── Default → getStandardStatusClass(status)
      └── EXACT: green, HOT: orange, NEAR: amber+dashed, MISS: white
```

All color functions return Tailwind CSS class strings. EXACT status always returns green (`bg-thermal-green text-white`) regardless of the color logic branch.

### Component Hierarchy

```
App
├── VennBackground                   # Animated decorative SVG orbs (fixed, behind content)
├── ScalarLogo                       # Venn diagram logo (centered, semi-transparent)
├── Header (inline in App.tsx)
│   ├── Category Selector (<select>) # Dropdown for countries/hollywood/chemicals/animals
│   ├── GameInput                    # Autocomplete text input
│   │   ├── Shadcn Input             # Underline-style (bottom border only)
│   │   ├── Tag Cloud Dropdown       # Opens downward with arrow caret
│   │   └── No Match State           # "No match found" message
│   ├── Scoreboard                   # Moves count + hint credit squares
│   └── "How to Play" link
├── GameGrid
│   ├── Empty State                  # "Make a guess to get started"
│   ├── GuessCard (for each guess, most recent first)
│   │   ├── Card Header              # Entity name (bold uppercase) + index (#01)
│   │   ├── Main Attribute Grid      # grid-cols-2 gap-px bg-charcoal
│   │   │   ├── Location Cell        # Merged: Hemisphere • Continent • Subregion (col-span-2)
│   │   │   ├── Standard Cell        # Label + value with feedback color
│   │   │   │   ├── Label            # text-[10px] uppercase opacity-60
│   │   │   │   ├── Value            # text-sm font-bold (HIGHER_LOWER: split value/tier layout)
│   │   │   │   ├── Eye Icon         # Hint trigger (all cells)
│   │   │   │   └── Hint Badge       # Inverted target value (if revealed)
│   │   │   └── List Cell            # Full-width (col-span-2) for Genre/Cast & Crew
│   │   └── Expandable Section       # "More clues" / "Hide clues" toggle + folded fields grid
│   └── MajorHintModal               # Confirmation: "Free" or "+3 moves" warning
├── Answer Section (inline in App.tsx)
│   ├── "??????" (while PLAYING) / Entity name (when solved/revealed)
│   └── "Reveal Answer" button
├── GameOverModal                    # "Puzzle Complete" — entity, moves, share + play again
├── RevealAnswerModal                # "Answer Revealed" — entity + all attribute values
└── HowToPlayModal                   # Instructions — auto-opens first visit (localStorage)
```

**Component Details:**

| Component | Description |
|-----------|-------------|
| **App.tsx** | Root component. Renders header bar (category selector, GameInput, Scoreboard, How to Play link), GameGrid, answer section, and all modals. Drives category tabs from `gameData.categories` keys. Win effect: adds `invert` class to `<html>` for 500ms. Answer shows `??????` while PLAYING, entity name (truncated to 12 chars) when solved/revealed. |
| **GameGrid.tsx** | Responsive CSS Grid container: `grid-cols-1` / `md:grid-cols-2` / `xl:grid-cols-3`. Renders GuessCard for each guess in reverse order (most recent first). Manages MajorHintModal state (`pendingMajorHint`). Shows empty-state message when no guesses. |
| **GuessCard.tsx** | Individual guess card with: header (entity name + `#XX` index), 2-column attribute grid. Features merged Location cell (Continent/Subregion/Hemisphere), HIGHER_LOWER split layout (value + arrow/tier), full-width list rows (Genre/Cast & Crew with per-item match coloring), Olympics merging, conservation status expansion, ALPHA_POSITION letter rendering, year diff tiers, N/A handling, and animal unit suffixes. Eye icon on ALL cells for hint reveal. Uses `getCellColor()` for all color logic. Card styling: `border border-charcoal bg-paper-white`, no rounding, no shadows. |
| **GameInput.tsx** | Autocomplete with downward-opening tag cloud dropdown (with arrow caret pointing up). Keyboard nav: ArrowUp/Down to navigate, Enter to select, Escape to close. Disabled with "Solved"/"Revealed" placeholder when game is over. Max 8 suggestions, deduplicated by name. Underline-style input (bottom border only, `w-48` mobile / `w-56` desktop). |
| **GameOverModal.tsx** | Radix Dialog — bottom-sheet on mobile, centered on desktop. Title: "Puzzle Complete" (inverted charcoal banner). Shows entity name (+ image if available), total moves count. Share button builds emoji grid; Play Again resets game. |
| **RevealAnswerModal.tsx** | Radix Dialog — bottom-sheet on mobile, centered on desktop. Title: "Answer Revealed". Uses `getDisplayColumns()` to show all target entity attributes in a scrollable list. Formats numbers/booleans/strings. "New Game" button resets. |
| **HowToPlayModal.tsx** | Radix Dialog — auto-opens on first visit (localStorage key: `scalar-htp-seen`). Sections: Goal, How It Works, Feedback Colors (thermal swatches: gold/orange/amber/gray), Direction Indicators, Scoring (Total Moves + credits), Hints (credits + major hints). |
| **MajorHintModal.tsx** | Centered Radix Dialog. Shows dynamic cost: "Free" if credits available (with count), "+3 moves" otherwise. Cancel / Reveal (Free) / Reveal (+3) buttons. |
| **Scoreboard.tsx** | Inline in header. Displays: "Moves" label + count (tabular-nums), divider, "Hints" label + 3 squares (filled if credit available, empty if spent). |
| **ScalarLogo.tsx** | SVG Venn diagram: two overlapping circles (teal left, pink right) with golden vesica piscis intersection. Configurable size. Rendered behind the title at 50% opacity. |
| **VennBackground.tsx** | Fixed full-screen SVG with animated decorative orbs: primary Venn pair (top-left), secondary pair (bottom-right), floating accent orbs, and subtle vesica piscis outlines. All very low opacity (3-7%). Gentle CSS animations on circle positions. |

---

## Data Pipeline

Game data is sourced from **CSV files** in the `data/` directory and converted to JSON:

### Data Source
- **Schema configs**: `data/{category}_schema_config.csv` — define field types, logic types, display formats, folded status, virtual flags, linked columns, and UI color logic
- **Enriched data**: `data/{category}_enriched.csv` — entity rows with all attribute values
- **Categories**: countries, hollywood, chemicals, animals

### Fetching Script (`fetch_data.py`)

```bash
# Run data pipeline (no virtual env needed for basic usage)
python fetch_data.py
```

The script:
1. Reads schema config CSVs to build `SchemaField` definitions
2. Reads enriched data CSVs and cleans values by declared data type
3. Handles data types: INT, FLOAT, STRING, CURRENCY, BOOLEAN, LIST
4. Cleans values (strips `$`, commas; treats null/empty/`-1` as missing)
5. Identifies entity name from the `TARGET` logicType field; uses `id` column or entity name as ID
6. Outputs `src/assets/data/gameData.json`

### Data Format (`gameData.json`)

```json
{
  "schemaConfig": {
    "countries": [
      {
        "attributeKey": "continent",
        "displayLabel": "Continent",
        "dataType": "STRING",
        "logicType": "CATEGORY_MATCH",
        "displayFormat": "TEXT",
        "isFolded": false,
        "isVirtual": false,
        "uiColorLogic": "DISTANCE_GRADIENT"
      }
    ]
  },
  "categories": {
    "countries": [
      {
        "id": "USA",
        "name": "United States",
        "continent": "Americas",
        "Latitude": 37.0902,
        "Longitude": -95.7129,
        "population": 334914895,
        "area": 9831510
      }
    ]
  }
}
```

---

## Getting Started

### Prerequisites

- **Node.js** v18+ (recommended)
- **npm** (included with Node.js)
- **Python 3** (for data pipeline only)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd Scalar

# Install dependencies
npm install
```

### Development

Start the local development server with Hot Module Replacement:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

```bash
# Build for production
npm run build

# Preview the production build locally
npm run preview
```

The production build outputs to the `dist/` directory.

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | TypeScript compile + Vite production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint (flat config, v9) |

---

## Extending the Game

### Adding a New Category

1. Create `data/{category}_schema_config.csv` with columns: `attribute_key`, `display_label`, `data_type`, `logic_type`, `display_format`, `is_folded`, `is_virtual`, `linked_category_col`, `ui_color_logic`
2. Create `data/{category}_enriched.csv` with entity data matching the schema attribute keys
3. Add entry to `CATEGORY_MAP` in `fetch_data.py`
4. Run `python fetch_data.py` to regenerate `gameData.json`
5. The UI will automatically pick up the new category — no code changes needed

### Adding a New Logic Type

1. Add the type to `LogicType` union in `src/types.ts`
2. Create a handler function in `src/utils/gameLogic.ts`
3. Add the case to the switch in `getFeedback()`
4. Update `src/utils/feedbackColors.ts` if new coloring logic is needed
5. Update `GuessCard.tsx` if new cell rendering is needed
6. Add custom CSS utilities to `src/index.css` if needed

### Customizing the Theme

Edit `src/index.css` to modify CSS custom properties and Tailwind theme tokens:

```css
:root {
  --background: 40 33% 98%;         /* Paper white */
  --foreground: 240 6% 10%;         /* Charcoal */
  --border: 214 32% 91%;            /* Graphite */
  --radius: 0px;                    /* Sharp corners */
}

@theme inline {
  --color-paper-white: #FAFAF9;
  --color-charcoal: #18181B;
  --color-graphite: #E2E8F0;
  --color-thermal-gold: #EAB308;
  --color-thermal-orange: #F97316;
  --color-thermal-teal: #14B8A6;
  --color-thermal-amber: #F59E0B;
}
```

Custom utility colors are defined via `@utility` blocks for distance gradients, category match, patterns, shadows, and fonts.

---

## Design System

Scalar follows a **"Thermal E-Paper / Scientific Journal"** aesthetic — *The New York Times* data journalism meets a high-end e-reader.

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `paper-white` | `#FAFAF9` | Canvas background |
| `charcoal` | `#18181B` | Primary text/ink |
| `graphite` | `#E2E8F0` | Structural borders |
| `thermal-gold` | `#EAB308` | Category match / linked bucket match |
| `thermal-orange` | `#F97316` | Hot / close |
| `thermal-amber` | `#F59E0B` | Warm / medium |
| `thermal-teal` | `#14B8A6` | Cool / far |
| `thermal-green` | `#22C55E` | Exact match / win |
| `venn-teal` | `#14B8A6` | Logo/background teal |
| `venn-pink` | `#F472B6` | Logo/background pink |
| `venn-gold` | `#EAB308` | Logo/background intersection |

### Typography
- **Fraunces Variable** (`font-serif-display`) — Serif display font for headings, titles, and modal banners
- **Geist Mono** — Monospace font for body text, data values, labels, and all interactive elements

### Visual Rules
- **Sharp corners** (`--radius: 0px`) — No border radius anywhere
- **Thin borders** — `border border-charcoal` for interactive/card elements, `border border-graphite` for structural dividers
- **Hard-edge shadows** — `shadow-hard` (6px 6px) for modals, `shadow-hard-sm` (4px 4px) for dropdowns — no soft blurs
- **Buttons** — Invert on hover (outline → filled, filled → outline)
- **Input** — Underline-style (bottom border only, no box)
- **Patterns** — `bg-hidden-pattern` (45deg diagonal stripes), `bg-folded-pattern` (-45deg, darker)
- **Gradients** — `border-b-venn` (teal → gold → pink gradient border), `border-venn-active` (gradient border image)

### Custom CSS Utilities

| Utility | Purpose |
|---------|---------|
| `bg-hidden-pattern` | 45deg diagonal stripes on light background |
| `bg-folded-pattern` | -45deg diagonal stripes on slightly darker background |
| `bg-geo-hot` | Solar Orange (`#F97316`), white text |
| `bg-geo-warm` | Amber (`#F59E0B`), charcoal text |
| `bg-geo-cool` | Glacial Teal (`#14B8A6`), white text |
| `bg-geo-yellow` | Yellow (`#FACC15`), charcoal text |
| `bg-geo-cold` | Graphite (`#E2E8F0`), charcoal text |
| `bg-cat-match` | Success Gold (`#EAB308`), charcoal text |
| `bg-cat-miss` | Graphite (`#E2E8F0`), charcoal text |
| `font-serif-display` | Fraunces Variable serif font family |
| `shadow-hard` | 6px 6px hard-edge shadow for modals |
| `shadow-hard-sm` | 4px 4px hard-edge shadow for dropdowns |
| `border-venn-active` | Teal → Gold → Pink gradient border |
| `border-b-venn` | Subtle gradient underline (header separator) |

### Actual Color Behavior (Code Reality)

Note: The thermal colors have evolved from the original gold-based system. The actual code uses:
- **EXACT** → `bg-thermal-green text-white` (green `#22C55E`) — not gold
- **HOT** → `bg-thermal-orange text-white` (orange `#F97316`)
- **NEAR** → `bg-amber-100 text-charcoal border-dashed border-amber-400`
- **MISS** → `bg-white text-charcoal` (white background) — not gray
- **GEO_DISTANCE gradient** → green (<1000km) → amber (<3000km) → yellow (<5000km) → white (>=5000km)
- **DISTANCE_GRADIENT text fields** → green (exact match) / white (miss) — binary, no intermediate distance gradient
- **Category match** → green (exact) / gold (bucket match) / white (miss)

---

## License

[MIT](LICENSE)
