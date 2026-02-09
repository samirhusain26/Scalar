# SCALAR

> A deductive logic game where players guess entities based on attribute feedback — featuring golf-style scoring, geographic distance, set intersection, and a minimalist editorial aesthetic.

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
  - [Column Visibility, Folded Clues & Major Hints](#column-visibility-folded-clues--major-hints)
  - [Scoring](#scoring)
  - [Winning, Forfeiting & Sharing](#winning-forfeiting--sharing)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Architecture](#project-architecture)
  - [Directory Structure](#directory-structure)
  - [Core Type Definitions](#core-type-definitions)
  - [State Management](#state-management)
  - [Game Logic — Feedback Engine](#game-logic--feedback-engine)
  - [Component Hierarchy](#component-hierarchy)
- [Data Pipeline](#data-pipeline)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Development](#development)
  - [Production Build](#production-build)
- [Extending the Game](#extending-the-game)
- [License](#license)

---

## Overview

**Scalar** is a deductive logic game inspired by games like Wordle, but instead of guessing words, players guess **entities** (countries, movies, chemical elements, animals) based on a feedback loop of attribute comparisons. Each guess reveals feedback via five different logic systems — higher/lower arrows, proximity tiers, geographic distance gradients, category matching, and set intersection — enabling players to narrow down the target entity through logical deduction.

The game uses a **golf-style scoring system** — every action costs strokes, and players aim for the lowest score possible. Only some columns are visible at the start; revealing hidden columns, unlocking folded clues, and using major hints all add to your stroke count.

The web version features a responsive design with a high-contrast, minimalist **editorial / paper** aesthetic, powered by the Geist Mono typeface.

---

## Gameplay & Rules

### Objective

A hidden target entity is selected at random from the active category. Identify the target by submitting guesses and interpreting the feedback on each attribute. Every action costs strokes — find the answer with the fewest strokes to earn the best rank.

### How to Play

1. **Select a category** — Countries, Hollywood, Chemicals, or Animals. Each has its own attribute schema with unique feedback logic.
2. **Survey the grid** — Only 2 random columns are visible at the start. Hidden columns show a hatched pattern; folded clues show a locked pattern. Decide whether to reveal more information (at a cost) or start guessing.
3. **Submit a guess** — Type in the input field. An autocomplete menu surfaces up to 8 matching entities. Arrow keys to navigate, Enter to confirm. Each guess costs **+1 stroke**.
4. **Read the feedback** — A new row populates the grid with color-coded feedback per attribute:
   - **Arrows** (↑/↓) indicate direction for numeric fields
   - **Colors** indicate proximity — green for exact, yellow/red for close, gray for far
   - **Distance** shows geographic distance in km (Countries category)
   - **Overlap** shows set intersection ratios for list fields (e.g., Genre "2/3")
5. **Use hints strategically** — Reveal hidden columns (+1 stroke), unlock folded clues (+2 strokes), or use major hints to see exact target values (+5 strokes).
6. **Solve** — Match every attribute exactly. Your final stroke count determines your rank.
7. **Give up** — If stuck, click "Reveal Answer" in the header to see the target entity and all its attributes. This ends the game as a forfeit with no rank awarded.

### Feedback System

Each attribute is evaluated by its **logic type** and returns feedback signals including **status** (proximity), **direction** (adjustment vector), and optionally a **display value** (formatted representation).

#### Logic Types

Scalar uses five distinct feedback logic types, each suited to a different kind of data:

**EXACT_MATCH** — Binary equality for strings and booleans.
- Compares values case-insensitively
- Returns EXACT (green) or MISS (gray)
- Used for: Driving Side, Diet, Landlocked?, Radioactive, Conservation Status

**CATEGORY_MATCH** — String equality with optional distance-based coloring.
- Compares category strings case-insensitively
- When paired with `DISTANCE_GRADIENT` coloring, cells are colored by geographic distance between guess and target (red = close, blue = far)
- Returns EXACT or MISS
- Used for: Continent, Subregion, Hemisphere, Production Co., Phase, MPAA Rating

**HIGHER_LOWER** — Numeric comparison with direction arrows and percentage difference.
- Shows ↑ (target is higher) or ↓ (target is lower) direction arrows
- Displays percentage difference in tiers (~10%, ~25%, ~50%, ~100%, 200%+)
- Status determined by **linked category column**: HOT (yellow) if the guess and target share the same category bucket, MISS (gray) otherwise
- Alternate display formats: relative percentage (e.g., "+34%"), currency ("↑ $1.2B"), or raw number
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

#### Status Colors

| Status | Standard Color | Meaning |
|--------|---------------|---------|
| **EXACT** | Green | Exact match. This attribute matches the target. |
| **HOT** | Yellow | Close. Within the inner proximity range or category match. |
| **NEAR** | Amber (dashed border) | Nearby. Outside HOT but within the extended range. |
| **MISS** | Gray | No match. Outside all proximity ranges. |

#### Distance Gradient Colors (Countries)

For fields with distance-gradient coloring (Continent, Subregion, Hemisphere), the cell background reflects geographic distance rather than standard status colors:

| Distance | Color | Hex |
|----------|-------|-----|
| 0 km | Green | Standard green |
| < 1,000 km | Red | #FF6B6B |
| < 3,000 km | Yellow | #FFD93D |
| < 5,000 km | Blue | #B8D4E3 |
| >= 5,000 km | Gray | #E5E7EB |

#### Category Match Colors (Linked Columns)

For HIGHER_LOWER fields with a linked category column, the cell background indicates whether the guess falls in the same category bucket as the target:

| Match | Color | Hex |
|-------|-------|-----|
| Same category | Green | #16a34a |
| Different category | Gray | #E5E7EB |

#### Direction Indicators (Numeric Fields Only)

Numeric cells display a **directional border** indicating which way to adjust:

| Indicator | Visual | Meaning |
|-----------|--------|---------|
| **UP** | Thick top border (4px) | Target is **higher** than your guess. |
| **DOWN** | Thick bottom border (4px) | Target is **lower** than your guess. |
| **EQUAL** | No thick border | Exact match. |

Direction is independent of status. A HOT cell with an UP border means you are close but still need to go higher.

#### Percentage Difference Tiers

For HIGHER_LOWER fields with PERCENTAGE_DIFF display format, the percentage difference is bucketed into readable tiers:

| Actual % Diff | Displayed Tier |
|---------------|----------------|
| 0% | Exact |
| 1–15% | ~10% |
| 16–37% | ~25% |
| 38–75% | ~50% |
| 76–150% | ~100% |
| 150%+ | 200%+ |

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
| Landlocked? | Exact Match | Yes/No | *Folded* (+2 to unlock) |
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

### Column Visibility, Folded Clues & Major Hints

Not all information is available from the start. The game uses a three-tier information reveal system:

#### Hidden Columns (Regular)
- 2 random non-folded columns are visible at game start; the rest are hidden behind a hatched pattern
- Hidden column headers show a **+** icon in a narrow collapsed width
- Click to reveal the column and all its data for past and future guesses
- **Cost: +1 stroke**

#### Folded Clues (Locked)
- Schema fields marked as "folded" start locked with a darker diagonal pattern
- Folded column headers display at full width with a **lock** icon + the attribute label
- Click to open a confirmation dialog, then unlock to reveal all data for past and future guesses
- **Cost: +2 strokes**
- Folded columns are separate from column visibility — they have their own reveal tracking

#### Major Hints
- Visible HIGHER_LOWER column headers show an **eye** icon
- Click to reveal the **exact target value** for that attribute in the column header
- A confirmation dialog warns about the cost before proceeding
- **Cost: +5 strokes**
- Revealed headers display the value with a checkmark icon and inverted styling

### Scoring

Scalar uses a **golf-style scoring system** where lower is better:

| Action | Stroke Cost |
|--------|-------------|
| Submit a guess | +1 |
| Reveal a hidden column | +1 |
| Unlock a folded clue | +2 |
| Use a major hint | +5 |

**Par** is set to **4** strokes. Your final rank is determined by how your score compares to par:

| Rank | Condition | Label |
|------|-----------|-------|
| GOLD | Score <= Par | Editorial Choice |
| SILVER | Score <= Par + 3 | Subscriber |
| BRONZE | Score > Par + 3 | Casual Reader |

The Scoreboard in the header displays your current strokes, par offset (E for even, +X over, -X under), and rank badge in real time.

### Winning, Forfeiting & Sharing

**Win condition:** All attributes in a single guess return EXACT status — every field is an exact match. On win:
- The display briefly inverts (screen flash effect)
- A "Puzzle Complete" modal shows the target entity, your score, par, and rank

**Reveal answer (forfeit):** Players can choose to reveal the answer at any time by clicking "Reveal Answer" in the header:
- A "Answer Revealed" modal shows the target entity with all its attribute values in a scrollable list
- The game transitions to the REVEALED state (distinct from SOLVED)
- No rank is awarded — this is a forfeit, not a win
- A "New Game" button starts a fresh round

**Sharing results:**
- The **Share** button generates an emoji grid representation of your game
- Green squares for EXACT, yellow for HOT, black for hidden columns
- Includes score, par, and rank in the shared text
- Uses Web Share API if available, falls back to clipboard

---

## Features

- **Five feedback logic types** — Higher/Lower, Exact Match, Category Match, Geographic Distance, and Set Intersection provide rich, varied feedback across categories.
- **Golf-style scoring** — Every action costs strokes. Balance information gathering against score impact.
- **Three-tier hint system** — Hidden columns (+1), folded clues (+2), and major hints (+5) give you strategic options at different costs.
- **Geographic distance** — Countries category uses Haversine distance with gradient coloring (red to blue) for geographic proximity.
- **Set intersection** — Hollywood category uses overlap ratios for multi-value fields like Genre and Cast.
- **Linked category matching** — Numeric fields can reference category columns, turning HOT when your guess falls in the same bucket as the target.
- **Data-driven architecture** — Categories, schemas, and entities loaded from JSON. Adding a new category requires zero code changes.
- **4 categories** — Countries, Hollywood movies, Chemical elements, Animals — each with unique attribute schemas and logic configurations.
- **Autocomplete input** — Fuzzy-matching search with keyboard navigation and up to 8 suggestions.
- **Persistent state** — Game progress saved to localStorage automatically. Refresh and pick up where you left off.
- **Share results** — Share your result via native share sheet or clipboard with an emoji grid summary.
- **Editorial aesthetic** — Monospaced Geist Mono typography, high-contrast "charcoal on paper" palette, sharp corners, and a screen-inversion effect on win.
- **Reveal answer** — Stuck? Reveal the target entity and all its attributes to learn and move on.
- **Responsive design** — Centered layout on desktop, full-width touch-optimized layout on mobile with bottom-sheet modals.

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| [React 19](https://react.dev/) | UI Framework |
| [Vite 7](https://vitejs.dev/) | Build Tool & Dev Server |
| [TypeScript ~5.9](https://www.typescriptlang.org/) | Type Safety (strict mode) |
| [Tailwind CSS v4](https://tailwindcss.com/) | Styling (CSS-first config) |
| [Zustand 5](https://github.com/pmndrs/zustand) | State Management (with localStorage persistence) |
| [Radix UI](https://www.radix-ui.com/) | Accessible Dialog Primitives |
| [Lucide React](https://lucide.dev/) | Icon Library |
| [class-variance-authority](https://cva.style/docs) | Component Variants |
| [Geist Mono](https://vercel.com/font) | Typography |

---

## Project Architecture

### Directory Structure

```
Scalar/
├── fetch_data.py                    # Python: CSV -> gameData.json
├── data/                            # Source data (schema configs + enriched CSVs)
│   ├── {category}_schema_config.csv # Schema definitions per category
│   └── {category}_enriched.csv      # Entity data per category
├── package.json
├── vite.config.ts                   # Vite config (@ alias -> src/)
├── tsconfig.json                    # Root TS config
├── tsconfig.app.json                # App TS config (ES2022, strict)
├── eslint.config.js                 # ESLint flat config (v9)
├── postcss.config.js                # PostCSS + Tailwind v4
├── components.json                  # Shadcn CLI config
├── index.html
├── src/
│   ├── assets/data/
│   │   └── gameData.json            # Game data (auto-generated by fetch_data.py)
│   ├── components/
│   │   ├── ui/                      # Shadcn/Radix UI primitives (button, card, dialog, input)
│   │   ├── GameGrid.tsx             # Main grid component
│   │   ├── GridHeader.tsx           # Column headers (hidden/folded/visible/hinted states)
│   │   ├── GridRow.tsx              # Single row of guess feedback
│   │   ├── GridCell.tsx             # Individual cell with status/direction/gradient/hidden/folded
│   │   ├── GameInput.tsx            # Autocomplete input with tag cloud suggestions
│   │   ├── GameOverModal.tsx        # Win modal with share & play again
│   │   ├── HowToPlayModal.tsx       # Instructions modal (auto-opens first visit)
│   │   ├── MajorHintModal.tsx       # Confirmation dialog for major hints (+5)
│   │   ├── FoldedHintModal.tsx      # Confirmation dialog for folded clues (+2)
│   │   ├── RevealAnswerModal.tsx    # Reveal answer modal (forfeit/give up)
│   │   └── Scoreboard.tsx           # Strokes, par, rank display
│   ├── store/
│   │   └── gameStore.ts             # Zustand store with localStorage persistence
│   ├── utils/
│   │   ├── gameLogic.ts             # Feedback engine (dispatch by logicType) + game utilities
│   │   ├── formatters.ts            # Number, distance, percentage formatting
│   │   ├── geo.ts                   # Haversine distance calculation
│   │   ├── schemaParser.ts          # Schema query utilities
│   │   └── cn.ts                    # Tailwind class name merger
│   ├── lib/
│   │   └── utils.ts                 # cn() duplicate (from Shadcn init)
│   ├── App.tsx                      # Main application component
│   ├── index.css                    # Tailwind v4 + theme + custom utilities
│   ├── main.tsx                     # React entry point
│   └── types.ts                     # TypeScript interfaces
└── public/
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
    | 'LIST';               // Intersection count (X/Y)

// UI color logic (how cell background is determined)
type UIColorLogic =
    | 'DISTANCE_GRADIENT'   // Color by haversine distance
    | 'CATEGORY_MATCH'      // Green/gray by category match
    | 'STANDARD'            // Traditional EXACT/HOT/NEAR/MISS
    | 'NONE';

// Schema field definition (from CSV schema config)
interface SchemaField {
    attributeKey: string;
    displayLabel: string;
    dataType: DataType;
    logicType: LogicType;
    displayFormat: DisplayFormat;
    isFolded: boolean;            // Starts locked, costs +2 to reveal
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

// Rank tiers
type Rank = 'GOLD' | 'SILVER' | 'BRONZE';
interface RankInfo { rank: Rank; label: string; }
```

### State Management

The game uses **Zustand** with localStorage persistence (`src/store/gameStore.ts`):

```typescript
interface GameState {
    // Core State
    activeCategory: string;                    // Current category
    targetEntity: Entity;                      // Entity to guess
    guesses: GuessResult[];                    // Past guesses with feedback
    gameStatus: 'PLAYING' | 'SOLVED' | 'REVEALED';

    // Scoring
    score: number;                             // Total strokes (lower is better)
    par: number;                               // Par value (default: 4)

    // Column Visibility
    columnVisibility: Record<string, boolean>; // Which non-folded columns are visible
    majorHintAttributes: string[];             // Columns with revealed exact values
    revealedFoldedAttributes: string[];        // Folded columns that have been unlocked

    // Actions
    setActiveCategory(category: string): void; // Reset with new category
    submitGuess(guess: Entity): void;          // +1 stroke, check win
    revealColumn(attributeId: string): void;   // +1 stroke
    revealFoldedAttribute(key: string): void;  // +2 strokes
    revealMajorHint(attributeId: string): void;// +5 strokes
    revealAnswer(): void;                      // Forfeit: show answer, set REVEALED
    resetGame(): void;                         // New target, keep category
}
```

**Key Behaviors:**
- Category changes trigger a full game reset with new target and fresh column visibility
- 2 random non-folded columns are visible at game start; the rest are hidden
- Folded attributes are tracked separately from column visibility
- Game state persists to localStorage (key: `scalar-game-storage`, version 4)
- Win condition checked after each guess (all fields `EXACT`)
- Players can forfeit via `revealAnswer()`, which transitions to the REVEALED state
- No loss state — players keep guessing until they solve it or choose to reveal

### Game Logic — Feedback Engine

The feedback system in `src/utils/gameLogic.ts` uses a **dispatch pattern** based on each schema field's `logicType`:

```
getFeedback(target, guess, schema)
  ├── Pre-computes haversine distance (for DISTANCE_GRADIENT fields)
  └── For each schema field:
      ├── EXACT_MATCH    → handleExactMatch()
      ├── CATEGORY_MATCH → handleCategoryMatch()
      ├── HIGHER_LOWER   → handleHigherLower()
      ├── GEO_DISTANCE   → handleGeoDistance()
      └── SET_INTERSECTION → handleSetIntersection()
```

**Handler Summary:**

| Handler | Logic | Status Rules |
|---------|-------|-------------|
| `handleExactMatch` | Binary equality (case-insensitive strings, boolean) | EXACT or MISS |
| `handleCategoryMatch` | String equality; attaches distance for gradient coloring | EXACT or MISS |
| `handleHigherLower` | Numeric comparison; percentage diff; linked category status | EXACT (equal), HOT (category match), MISS |
| `handleGeoDistance` | Haversine distance in km | EXACT (0km), HOT (<1000km), NEAR (<3000km), MISS |
| `handleSetIntersection` | List intersection-over-union ratio | EXACT (1.0), HOT (>0.5), NEAR (>0), MISS (0) |

**Supporting Utility Functions:**

| Function | Purpose |
|----------|---------|
| `getRandomTarget(gameData, category)` | Random entity from category |
| `checkWinCondition(feedback)` | True if all statuses are EXACT |
| `getSuggestions(entities, query, guessedIds)` | Fuzzy autocomplete (max 8, deduplicated) |
| `calculateRank(score, par)` | GOLD (<=par), SILVER (<=par+3), BRONZE (>par+3) |
| `getInitialColumnVisibility(schema)` | 2 random non-folded columns visible |
| `haversineDistance(lat1, lon1, lat2, lon2)` | Great-circle distance in km (geo.ts) |
| `formatNumber(num)` | k/M/B/T/P/E suffixed strings (formatters.ts) |
| `formatDistance(km)` | Formatted distance display (formatters.ts) |
| `formatPercentageDiffTier(pct)` | Percentage buckets (formatters.ts) |
| `getDisplayColumns(schema)` | Non-hidden schema fields (schemaParser.ts) |
| `getFoldedColumns(schema)` | Folded schema fields (schemaParser.ts) |

### Component Hierarchy

```
App
├── Header (inline)
│   ├── "SCALAR" title + "Daily Logic" subtitle
│   ├── "How to Play" link
│   ├── Category Selector Tabs
│   └── Header Bar
│       ├── Category Label (left)
│       ├── Answer Display + "Reveal Answer" link (center)
│       └── Scoreboard (strokes, par, rank) (right)
├── GameGrid
│   ├── GridHeader
│   │   ├── Name Column Header
│   │   ├── Hidden Column Headers (+ icon, narrow)
│   │   ├── Folded Column Headers (lock icon + label, full width)
│   │   ├── Visible Column Headers (label + eye icon)
│   │   └── Major-Hinted Headers (value + check icon, inverted)
│   └── GridRow (for each guess slot)
│       ├── Name Cell
│       ├── Hidden Cells (hatched pattern)
│       ├── Folded Cells (locked pattern)
│       └── GridCell (for each visible attribute)
├── GameInput
│   ├── Stroke Counter
│   ├── Text Input
│   └── Tag Cloud Suggestions (opens upward)
├── GameOverModal (Radix Dialog)
│   ├── "Puzzle Complete" Title
│   ├── Target Entity Name
│   ├── Score + Par + Rank Badge
│   └── Share / Play Again Buttons
├── RevealAnswerModal (Radix Dialog)
│   ├── "Answer Revealed" Title
│   ├── Target Entity Name
│   ├── All Attribute Values (scrollable list)
│   └── New Game Button
├── HowToPlayModal (Radix Dialog)
│   ├── Goal, How It Works
│   ├── Feedback Colors + Direction Indicators
│   ├── Scoring Rules + Ranks
│   └── Hint System Explanation
├── MajorHintModal (Radix Dialog)
│   ├── Warning: +5 Strokes
│   └── Cancel / Reveal Buttons
└── FoldedHintModal (Radix Dialog)
    ├── Warning: +2 Strokes
    └── Cancel / Reveal Buttons
```

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
4. Cleans values (strips `$`, commas; treats null/-1 as missing)
5. Outputs `src/assets/data/gameData.json`

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
| `npm run lint` | Run ESLint |

---

## Extending the Game

### Adding a New Category

1. Create `data/{category}_schema_config.csv` with columns: `category`, `attribute_key`, `display_label`, `data_type`, `logic_type`, `display_format`, `is_folded`, `is_virtual`, `linked_category_col`, `ui_color_logic`
2. Create `data/{category}_enriched.csv` with entity data matching the schema attribute keys
3. Add entry to `CATEGORY_MAP` in `fetch_data.py`
4. Run `python fetch_data.py` to regenerate `gameData.json`
5. The UI will automatically pick up the new category — no code changes needed

### Adding a New Logic Type

1. Add the type to `LogicType` union in `src/types.ts`
2. Create a handler function in `src/utils/gameLogic.ts`
3. Add the case to the switch in `getFeedback()`
4. Update `GridCell.tsx` if new coloring logic is needed
5. Add custom CSS utilities to `src/index.css` if needed

### Customizing the Theme

Edit `src/index.css` to modify CSS custom properties and utilities:

```css
:root {
  --background: 60 14% 97%;         /* Paper white */
  --foreground: 0 0% 10%;           /* Charcoal */
  --border: 0 0% 10%;
  --radius: 0px;                    /* Sharp corners */
}
```

Custom utility colors are defined via `@utility` blocks for distance gradients, category match, and cell patterns.

---

## License

[MIT](LICENSE)
