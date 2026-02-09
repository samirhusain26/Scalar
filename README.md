# SCALAR

> A deductive logic game where players guess entities based on attribute feedback — featuring golf-style scoring and a minimalist editorial aesthetic.

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
  - [Column Visibility & Hints](#column-visibility--hints)
  - [Scoring](#scoring)
  - [Winning & Sharing](#winning--sharing)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Architecture](#project-architecture)
  - [Directory Structure](#directory-structure)
  - [Core Type Definitions](#core-type-definitions)
  - [State Management](#state-management)
  - [Game Logic](#game-logic)
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

**Scalar** is a deductive logic game inspired by games like Wordle, but instead of guessing words, players guess **entities** (countries, movies, chemical elements, animals) based on a feedback loop of attribute comparisons. Each guess reveals directional hints (higher/lower) and proximity feedback for numeric fields, enabling players to narrow down the target entity through logical deduction.

The game uses a **golf-style scoring system** — every action costs strokes, and players aim for the lowest score possible. Only some columns are visible at the start; revealing hidden columns and using hints all add to your stroke count.

The web version features a responsive design with a high-contrast, minimalist **editorial / paper** aesthetic, powered by the Geist Mono typeface.

---

## Gameplay & Rules

### Objective

A hidden target entity is selected at random from the active category. Identify the target by submitting guesses and interpreting the feedback on each attribute. Every action costs strokes — find the answer with the fewest strokes to earn the best rank.

### How to Play

1. **Select a category** — Countries, Hollywood, Chemicals, or Animals. Each has its own attribute schema.
2. **Survey the grid** — Only 2 random columns are visible at the start. Hidden columns show a hatched pattern. Decide whether to reveal more columns (at a cost) or start guessing.
3. **Submit a guess** — Type in the input field. An autocomplete menu surfaces up to 8 matching entities. Arrow keys to navigate, Enter to confirm. Each guess costs **+1 stroke**.
4. **Read the feedback** — A new row populates the grid, comparing your guess to the target across every visible attribute with color-coded proximity and directional indicators.
5. **Use hints strategically** — Reveal hidden columns (+1 stroke each) or use major hints to see exact target values (+5 strokes each).
6. **Solve** — Match every attribute exactly. Your final stroke count determines your rank.
7. **Give up** — If stuck, click "Reveal Answer" in the header to see the target entity and all its attributes. This ends the game without a win.

### Feedback System

Each attribute is evaluated independently and returns two signals: a **status** (proximity) and a **direction** (adjustment vector).

#### Status Tiers

| Status | Color | Meaning |
|--------|-------|---------|
| **EXACT** | Green | **Exact match.** This attribute matches the target. |
| **HOT** | Yellow | **Close.** Within the inner proximity range of the target value. Numeric fields only. |
| **NEAR** | Amber (dashed border) | **Nearby.** Outside HOT but within the extended range. Numeric fields only. |
| **MISS** | Gray | **No match.** Outside all proximity ranges. |

- **String attributes** (e.g., Continent, Genre, Diet) — binary evaluation. EXACT or MISS only.
- **Numeric attributes** (e.g., Population, IMDb Score, Atomic #) — evaluated against a two-tier proximity zone defined by the attribute's proximity configuration.

#### Proximity Calculation (Numeric Fields)

Each numeric attribute defines a **proximity configuration** that controls its proximity zones. Two calculation modes exist:

**PERCENT mode** — The allowance scales with the target value.
`allowance = proximityConfig.value * |target|`

**RANGE mode** — The allowance is a fixed absolute value.
`allowance = proximityConfig.value`

The inner zone (HOT) and outer zone (NEAR) are then derived:
- If `|guess - target| == 0` — **EXACT**
- If `|guess - target| <= allowance` — **HOT**
- If `|guess - target| <= allowance * nearMultiplier` — **NEAR**
- Otherwise — **MISS**

**Example (PERCENT):** Population in Countries uses `value: 0.2, nearMultiplier: 2.0`. If the target is 50,000,000:
- Allowance = 0.2 * 50,000,000 = 10,000,000
- A guess of 45,000,000 (diff 5M) — **HOT** (within 10M)
- A guess of 35,000,000 (diff 15M) — **NEAR** (within 20M)
- A guess of 20,000,000 (diff 30M) — **MISS** (outside 20M)
- A guess of 50,000,000 — **EXACT**

**Example (RANGE):** Release Year in Hollywood uses `value: 5, nearMultiplier: 3.0`. If the target year is 2000:
- Allowance = 5 (absolute)
- A guess of 2003 (diff 3) — **HOT** (within 5)
- A guess of 2012 (diff 12) — **NEAR** (within 15)
- A guess of 1980 (diff 20) — **MISS** (outside 15)

Attributes with no proximity configuration (e.g., Atomic #, Period) have no proximity zones — only an exact match registers as EXACT.

#### Direction Indicators (Numeric Fields Only)

Numeric cells display a **directional border** indicating which way to adjust:

| Indicator | Visual | Meaning |
|-----------|--------|---------|
| **UP** | Thick top border (4px) | Target is **higher** than your guess. |
| **DOWN** | Thick bottom border (4px) | Target is **lower** than your guess. |
| **EQUAL** | No thick border | Exact match. |

Direction is independent of status. A HOT cell with an UP border means you are close but still need to go higher.

String attributes do not produce direction indicators.

### Categories & Attributes

Each category defines its own schema. Numeric attributes specify a proximity configuration with a calculation mode, value, and near multiplier.

#### Countries
| Attribute | Type | Proximity Config | Notes |
|-----------|------|------------------|-------|
| Population | Numeric | PERCENT 20%, x2.0 | HOT within 20% of target, NEAR within 40% |
| Continent | Text | — | Exact match only |
| GDP / Capita | Currency ($) | PERCENT 15%, x2.0 | HOT within 15%, NEAR within 30% |
| Driving Side | Text | — | "left" or "right" |
| Area | Numeric (km^2) | PERCENT 20%, x2.0 | HOT within 20%, NEAR within 40% |
| Sub Region | Text | — | e.g., "Western Europe", "Southern Asia" |

#### Hollywood
| Attribute | Type | Proximity Config | Notes |
|-----------|------|------------------|-------|
| Release Year | Numeric | RANGE +/-5, x3.0 | HOT within 5 years, NEAR within 15 years |
| IMDb Score | Float | RANGE +/-1.0, x2.0 | HOT within 1.0 points, NEAR within 2.0 |
| Genre | Text | — | Exact match only |
| Budget | Currency ($) | PERCENT 20%, x2.0 | HOT within 20%, NEAR within 40% |
| Rating | Text | — | MPAA rating (PG, PG-13, R, etc.) |

#### Chemicals
| Attribute | Type | Proximity Config | Notes |
|-----------|------|------------------|-------|
| Atomic # | Numeric | — | **No proximity** — exact match only |
| Phase (Room Temp) | Text | — | Solid, Liquid, or Gas |
| Discovery Year | Numeric | RANGE +/-100, x3.0 | HOT within 100 years, NEAR within 300 |
| Density | Float (g/cm^3) | PERCENT 15%, x2.0 | HOT within 15%, NEAR within 30% |
| Period | Numeric | — | **No proximity** — exact match only |

#### Animals
| Attribute | Type | Proximity Config | Notes |
|-----------|------|------------------|-------|
| Max Weight | Numeric (kg) | PERCENT 20%, x2.0 | HOT within 20%, NEAR within 40% |
| Lifespan | Numeric (yrs) | PERCENT 20%, x2.0 | HOT within 20%, NEAR within 40% |
| Diet | Text | — | e.g., Herbivore, Carnivore, Omnivore |
| Class | Text | — | e.g., Mammal, Reptile, Bird |
| Gestation | Numeric (days) | PERCENT 15%, x2.0 | HOT within 15%, NEAR within 30% |

### Column Visibility & Hints

Not all information is available from the start. The game begins with only **2 random columns visible** — the rest are hidden behind a hatched pattern.

#### Revealing Columns
- Hidden column headers show a **+** icon
- Click to reveal the column and all its data for past and future guesses
- **Cost: +1 stroke**

#### Major Hints
- Visible numeric column headers show an **eye** icon
- Click to reveal the **exact target value** for that attribute in the column header
- A confirmation dialog warns about the cost before proceeding
- **Cost: +5 strokes**
- Revealed headers display the value with a checkmark and inverted styling

### Scoring

Scalar uses a **golf-style scoring system** where lower is better:

| Action | Stroke Cost |
|--------|-------------|
| Submit a guess | +1 |
| Reveal a hidden column | +1 |
| Use a major hint | +5 |

**Par** is set to **4** strokes. Your final rank is determined by how your score compares to par:

| Rank | Condition | Label |
|------|-----------|-------|
| GOLD | Score <= Par | Editorial Choice |
| SILVER | Score <= Par + 3 | Subscriber |
| BRONZE | Score > Par + 3 | Casual Reader |

The Scoreboard in the header displays your current strokes, par offset (E for even, +X over, -X under), and rank badge in real time.

### Winning & Sharing

**Win condition:** All attributes in a single guess return EXACT status — every field is an exact match. On win:
- The display briefly inverts (screen flash effect)
- A "Puzzle Complete" modal shows the target entity, your score, par, and rank

**Reveal answer:** Players can also choose to reveal the answer at any time by clicking "Reveal Answer" in the header:
- A "Reveal Answer" modal shows the target entity with all its attribute values
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

- **Golf-style scoring** — Every action costs strokes. Balance information gathering against score impact.
- **Column visibility system** — Only 2 columns visible at start. Strategically reveal more to narrow down the answer.
- **Major hints** — Reveal exact target values at a steep cost (+5 strokes) when you need a lifeline.
- **Data-driven architecture** — Categories, schemas, and entities loaded from JSON. Adding a new category requires zero code changes.
- **4 categories** — Countries, Hollywood movies, Chemical elements, Animals — each with unique attribute schemas and proximity configurations.
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
├── fetch_data.py                    # Python: Google Sheets -> gameData.json
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
│   │   └── gameData.json            # Game data (schema + entities)
│   ├── components/
│   │   ├── ui/                      # Shadcn/Radix UI primitives (button, card, dialog, input)
│   │   ├── GameGrid.tsx             # Main grid component
│   │   ├── GridHeader.tsx           # Column headers (hidden/visible/hinted states)
│   │   ├── GridRow.tsx              # Single row of guess feedback
│   │   ├── GridCell.tsx             # Individual cell with status/direction/hidden
│   │   ├── GameInput.tsx            # Autocomplete input with tag cloud suggestions
│   │   ├── GameOverModal.tsx        # Win modal with share & play again
│   │   ├── HowToPlayModal.tsx       # Instructions modal (auto-opens first visit)
│   │   ├── MajorHintModal.tsx       # Confirmation dialog for major hints
│   │   ├── RevealAnswerModal.tsx    # Reveal answer modal (forfeit/give up)
│   │   └── Scoreboard.tsx           # Strokes, par, rank display
│   ├── store/
│   │   └── gameStore.ts             # Zustand store with localStorage persistence
│   ├── utils/
│   │   ├── gameLogic.ts             # Pure game logic functions
│   │   ├── formatters.ts            # Number formatting (k, M, B, T suffixes)
│   │   └── cn.ts                    # Tailwind class name merger
│   ├── lib/
│   │   └── utils.ts                 # cn() duplicate (from Shadcn init)
│   ├── App.tsx                      # Main application component
│   ├── index.css                    # Tailwind v4 + theme configuration
│   ├── main.tsx                     # React entry point
│   └── types.ts                     # TypeScript interfaces
└── public/
```

### Core Type Definitions

Located in `src/types.ts`:

```typescript
// Data types for schema field definitions
type DataType = 'INT' | 'FLOAT' | 'STRING' | 'CURRENCY';

// Proximity calculation modes
type ProximityConfigType = 'PERCENT' | 'RANGE';

// Proximity configuration for numeric fields
interface ProximityConfig {
    type: ProximityConfigType;
    value: number;          // Base allowance (percentage or absolute)
    nearMultiplier: number; // Multiplier for NEAR tier
}

// Schema field definition (from gameData.json)
interface SchemaField {
    label: string;
    type: DataType;
    unitPrefix?: string;           // e.g., "$" for currency
    unitSuffix?: string;           // e.g., "km²" for area
    proximityConfig: ProximityConfig | null;
}

// Feedback direction for numeric comparisons
type FeedbackDirection = 'UP' | 'DOWN' | 'EQUAL' | 'NONE';

// Proximity status tiers
type FeedbackStatus = 'EXACT' | 'HOT' | 'NEAR' | 'MISS';

// Complete feedback for a single cell
interface Feedback {
    direction: FeedbackDirection;
    status: FeedbackStatus;
    value: string | number;
}

// Game states: playing, solved (win), or revealed (forfeit)
type GameStatus = 'PLAYING' | 'SOLVED' | 'REVEALED';

// Rank tiers based on score vs par
type Rank = 'GOLD' | 'SILVER' | 'BRONZE';

interface RankInfo {
    rank: Rank;
    label: string;  // "Editorial Choice", "Subscriber", "Casual Reader"
}
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
    columnVisibility: Record<string, boolean>; // Which columns are visible
    majorHintAttributes: string[];             // Columns with revealed exact values

    // Actions
    setActiveCategory(category: string): void; // Reset with new category
    submitGuess(guess: Entity): void;          // +1 stroke, check win
    revealColumn(attributeId: string): void;   // +1 stroke
    revealMajorHint(attributeId: string): void;// +5 strokes
    revealAnswer(): void;                      // Forfeit: show answer, set REVEALED
    resetGame(): void;                         // New target, keep category
}
```

**Key Behaviors:**
- Category changes trigger a full game reset with new target and fresh column visibility
- 2 random columns are visible at game start; the rest are hidden
- Game state persists to localStorage (key: `scalar-game-storage`, version 3)
- Win condition checked after each guess (all fields `EXACT`)
- Players can forfeit via `revealAnswer()`, which transitions to the REVEALED state
- No loss state — players keep guessing until they solve it or choose to reveal

### Game Logic

Pure functions in `src/utils/gameLogic.ts`:

| Function | Purpose |
|----------|---------|
| `getFeedback(target, guess, schema)` | Compares target vs guess, returns feedback for each field |
| `getRandomTarget(gameData, category)` | Selects a random entity from a category |
| `checkWinCondition(feedback)` | Returns `true` if all feedback statuses are `EXACT` |
| `calculateCategoryHint(gameData, category, attribute, targetValue)` | Calculates percentile bracket for a target attribute |
| `getSuggestions(entities, query, guessedIds)` | Filters entities for autocomplete (fuzzy match, max 8, deduplicated) |
| `calculateRank(score, par)` | Returns rank info (GOLD/SILVER/BRONZE) based on score vs par |
| `getInitialColumnVisibility(schema)` | Randomly selects 2 columns to be visible at game start |

**Feedback Calculation Logic:**

```typescript
// For STRING fields
if (target[key] === guess[key]) -> status = 'EXACT'
else -> status = 'MISS'

// For numeric fields (INT, FLOAT, CURRENCY)
if (guess < target) -> direction = 'UP'
if (guess > target) -> direction = 'DOWN'
if (guess === target) -> direction = 'EQUAL', status = 'EXACT'

// Proximity check (if proximityConfig exists)
allowance = (PERCENT mode) ? value * |target| : value
if (diff <= allowance) -> status = 'HOT'
if (diff <= allowance * nearMultiplier) -> status = 'NEAR'
else -> status = 'MISS'
```

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
│   │   ├── Hidden Column Headers (+ icon)
│   │   ├── Visible Column Headers (label + eye icon)
│   │   └── Major-Hinted Headers (value + check icon)
│   └── GridRow (for each guess slot)
│       ├── Name Cell
│       ├── Hidden Cells (hatched pattern)
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
├── HowToPlayModal (Radix Dialog)
│   ├── Goal, How It Works
│   ├── Feedback Colors + Direction Indicators
│   ├── Scoring Rules + Ranks
│   └── Hint System Explanation
├── MajorHintModal (Radix Dialog)
│   ├── Warning: +5 Strokes
│   └── Cancel / Reveal Buttons
└── RevealAnswerModal (Radix Dialog)
    ├── Target Entity Name + Image (if available)
    ├── All Attribute Values (formatted table)
    └── New Game Button
```

---

## Data Pipeline

Game data is sourced from a **Google Sheet** and converted to JSON:

### Data Source
- **Google Sheet ID**: `1XhZ66tFCbJhcIN5CgObzcVc8J3WkXoz5B0-R4V6O3h0`
- **Schema Tab**: `schema_config` defines field types, labels, proximity configs
- **Data Tabs**: `Data_countries`, `Data_hollywood`, `Data_chemicals`, `Data_animals`

### Fetching Script (`fetch_data.py`)

```bash
# Setup (requires Python 3.8+)
cd /path/to/Scalar
python3 -m venv .venv
source .venv/bin/activate
pip install gspread

# Run data fetch
python fetch_data.py
```

**Requirements:**
- `credentials.json`: Google Service Account credentials (gitignored)
- Sheet must be shared with the service account email

### Data Format (`gameData.json`)

```json
{
  "schema": {
    "countries": {
      "population": {
        "label": "Population",
        "type": "INT",
        "unitPrefix": "",
        "unitSuffix": "",
        "proximityConfig": {
          "type": "PERCENT",
          "value": 0.2,
          "nearMultiplier": 2.0
        }
      }
    }
  },
  "categories": {
    "countries": [
      {
        "id": "USA",
        "name": "United States",
        "population": 334914895,
        "continent": "Americas",
        "gdp_per_capita": 81695.0,
        "driving_side": "right",
        "area": 9831510,
        "subregion": "Northern America"
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

1. **Add schema definition** in `gameData.json`:
   ```json
   "schema": {
     "newcategory": {
       "field1": {
         "label": "Field 1",
         "type": "STRING",
         "proximityConfig": null
       },
       "field2": {
         "label": "Field 2",
         "type": "INT",
         "unitSuffix": "kg",
         "proximityConfig": { "type": "PERCENT", "value": 0.2, "nearMultiplier": 2.0 }
       }
     }
   }
   ```

2. **Add entity data** in `gameData.json`:
   ```json
   "categories": {
     "newcategory": [
       { "id": "entity1", "name": "Entity 1", "field1": "value", "field2": 100 }
     ]
   }
   ```

3. The UI will automatically pick up the new category — no code changes needed.

### Customizing the Theme

Edit `src/index.css` to modify CSS custom properties:

```css
:root {
  --background: 60 14% 97%;         /* Paper white */
  --foreground: 0 0% 10%;           /* Charcoal */
  --border: 0 0% 10%;
  --radius: 0px;                    /* Sharp corners */
}
```

---

## License

[MIT](LICENSE)
