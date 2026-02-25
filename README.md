# SCALAR

> A deductive logic game where players guess entities based on attribute feedback — featuring a Total Moves scoring system, geographic distance, and a minimalist thermal e-paper aesthetic.

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
  - [Hints](#hints)
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
- [Extending the Game](#extending-the-game)
- [Design System](#design-system)
- [Privacy & Analytics](#privacy--analytics)
- [License](#license)

---

## Overview

**Scalar** is a deductive logic game inspired by Wordle, but instead of words, players guess **entities** (countries, chemical elements) based on a rich feedback loop of attribute comparisons. Each guess reveals feedback via five logic systems — higher/lower arrows, proximity tiers, geographic distance gradients, category matching, and set intersection — enabling players to narrow down the target through logical deduction.

The game uses a **Total Moves scoring system** — every guess costs +1 move, and players start with 3 free hint credits. Once credits are spent, hints cost additional moves. The goal is to solve the puzzle in as few total moves as possible.

The UI features a responsive card-based layout with a high-contrast **"Thermal E-Paper / Scientific Journal"** aesthetic — charcoal ink on paper-white canvas, sharp corners, monospaced typography, and thermal feedback colors (green, orange, amber, white).

---

## Gameplay & Rules

### Objective

A hidden target entity is selected at random from the active category. Identify the target by submitting guesses and interpreting the feedback on each attribute. Every action costs moves — find the answer with the fewest total moves.

### How to Play

1. **Select a category** — Countries or Elements. Each has its own attribute schema with unique feedback logic.
2. **Submit a guess** — Type in the input field. An autocomplete dropdown surfaces up to 8 matching entities. Arrow keys to navigate, Enter to confirm. Each guess costs **+1 move**.
3. **Read the feedback** — A new card appears in the grid with color-coded feedback per attribute:
   - **Arrows** (↑/↓) and proximity tier text for numeric fields
   - **Thermal colors** — green for exact, orange for hot, amber for near, white for miss
   - **Distance** shows geographic distance in km (Countries only)
4. **Use hints strategically** — Tap the Eye icon on any attribute to reveal the exact target value (free with credits, else +3 moves).
5. **Solve** — When every attribute is an exact match, the puzzle is complete. Your final move count is your score.
6. **Give up** — Click "Reveal Answer" to see the target entity and all its attributes. This ends the game as a forfeit.

### Feedback System

Each attribute is evaluated by its **logic type** and returns feedback with **status** (proximity), **direction** (adjustment vector), and a **display value** (formatted representation).

#### Logic Types

**EXACT_MATCH** — Binary equality for strings and booleans.
- Returns EXACT (green) or MISS (white)
- Used for: Landlocked?, Radioactive, Symbol matches name?

**CATEGORY_MATCH** — String equality with optional distance-based coloring.
- When paired with `DISTANCE_GRADIENT` coloring: green for exact text match, white for miss (binary)
- Used for: Continent, Subregion, Hemisphere, Phase (STP), Element Family, Block, Govt. Type

**HIGHER_LOWER** — Numeric comparison with direction arrows and proximity tiers.
- Shows ↑ (target higher) or ↓ (target lower) in a split cell layout (value left, arrow+tier right)
- Displays percentage difference in tiers: ~10%, ~25%, ~50%, then multiplier tiers for large diffs: ~2×, ~5×, ~10×, ~50×, ~100×
- Year fields use absolute year difference tiers: ~5 yrs, ~15 yrs, ~30 yrs, 30+ yrs
- Status determined by **linked category column**: HOT (orange) if the guess falls in the same category bucket as the target, MISS (white) otherwise
- Used for: Population, Area, Atomic #, Group, Period, Timezones, Borders, 1st Letter

**GEO_DISTANCE** — Haversine great-circle distance between geographic coordinates.
- Status tiers: EXACT (0 km), HOT (<1,000 km), NEAR (<3,000 km), MISS (≥3,000 km)
- Cell color also encodes distance: green (<1000km) → amber (<3000km) → yellow (<5000km) → white
- Used for: Distance column in Countries (virtual computed field between capitals)

**SET_INTERSECTION** — Overlap of comma-separated lists.
- Status tiers: EXACT (ratio = 1.0), HOT (> 0.5), NEAR (> 0), MISS (0)
- Displays "X/Y" overlap count with per-item match coloring (green+bold for matches, gray for misses)

#### Status Colors (Thermal Palette)

| Status | Color | Hex | Meaning |
|--------|-------|-----|---------|
| **EXACT** | Green | `#22C55E` | Perfect match |
| **HOT** | Orange | `#F97316` | Same category bucket / within inner range |
| **NEAR** | Muted Amber | `#FEF3C7` | Outside HOT but within extended range. Dashed border. |
| **MISS** | White | `#FFFFFF` | No match |

#### Percentage Difference Tiers

For HIGHER_LOWER fields with PERCENTAGE_DIFF display format (symmetric ratio: max/min − 1):

| Ratio | Displayed Tier |
|-------|----------------|
| 1.0 (equal) | Exact |
| < 1.15 | ~10% |
| < 1.37 | ~25% |
| < 1.75 | ~50% |
| < 3× | ~2× |
| < 7× | ~5× |
| < 15× | ~10× |
| < 60× | ~50× |
| ≥ 60× | ~100× |

#### Year Difference Tiers

For year-like fields (Release Year, Discovered), absolute year difference is used:

| Year Diff | Displayed Tier |
|-----------|----------------|
| 0 | Exact |
| ≤ 5 years | ~5 yrs |
| ≤ 15 years | ~15 yrs |
| ≤ 30 years | ~30 yrs |
| > 30 years | 30+ yrs |

### Categories & Attributes

#### Countries
Guess world countries. Feedback includes geographic distance, location matching, and numeric comparisons.

| Attribute | Logic | Display | Notes |
|-----------|-------|---------|-------|
| Continent | Category Match | Text | Binary color: green (match) / white (miss) |
| Subregion | Category Match | Text | Binary color |
| Hemisphere | Category Match | Text | Binary color |
| Distance | Geo Distance | Distance (km) | Virtual: haversine between capitals |
| Area (sq km) | Higher/Lower | % Diff Tier | Linked to area category |
| Population | Higher/Lower | % Diff Tier | Linked to population category |
| Landlocked? | Exact Match | Yes/No | |
| Govt. Type | Category Match | Text | |
| Borders | Higher/Lower | Number | Number of bordering countries |
| Timezones | Higher/Lower | Number | Linked to timezone category |
| 1st Letter | Higher/Lower | A–Z Letter | Horizontal arrows ←/→ |

#### Elements
Guess chemical elements. Feedback includes atomic properties and classification matching.

| Attribute | Logic | Display | Notes |
|-----------|-------|---------|-------|
| Atomic # | Higher/Lower | Number | |
| Group | Higher/Lower | Number | Linked to group name block |
| Period | Higher/Lower | Number | |
| Phase (STP) | Category Match | Text | Solid, Liquid, or Gas |
| Element Family | Category Match | Text | Alkali Metal, Noble Gas, etc. |
| Block | Category Match | Text | s, p, d, or f block |
| Radioactive | Exact Match | Yes/No | |
| Symbol matches name? | Exact Match | Yes/No | e.g., Carbon → C (No), Gold → Au (Yes reversed) |

### Hints

- **Eye icon** appears on every attribute cell while the game is PLAYING (top-right corner, opacity-40)
- Tap to reveal the **exact target value** for that attribute
- A confirmation dialog shows the cost before applying
- **Cost:** Free if hint credits are available (consumes 1 credit), otherwise **+3 moves**
- The Location cell (merged Continent/Subregion/Hemisphere) reveals all 3 attributes at once for a single credit/cost
- Once revealed, an inverted badge (charcoal background, white text, checkmark) shows the target value on that cell

### Scoring

Scalar uses a **Total Moves** scoring system — lower is better:

| Action | Move Cost |
|--------|-----------|
| Submit a guess | +1 |
| Reveal a hint (Eye icon) | Free (with credit) or +3 |
| Reveal answer (forfeit) | Game ends as REVEALED |

#### Free Hint Credits
- Players start each game with **3 free hint credits**
- Credits are consumed one at a time when using the Eye icon hint
- Once spent, hints cost **+3 moves** each
- Credits are displayed in the header as 3 filled/empty squares
- Credits reset to 3 on new game or category change

### Winning, Forfeiting & Sharing

**Win condition:** All feedback fields return EXACT status in a single guess. On win:
- Screen briefly inverts (win flash effect)
- A "Puzzle Complete" modal shows a category-specific entity card (periodic table cell for Elements, passport card for Countries) plus total moves

**Reveal answer (forfeit):** Click "Reveal Answer" at the bottom:
- An "Answer Revealed" modal shows the target entity with all attribute values
- No score is retained — the game transitions to the REVEALED state
- A "New Game" button starts a fresh round

**Sharing results:**
- **"Challenge a Friend"** in the Game Over modal: generates a challenge URL with your score, uses Web Share API or clipboard
- **"Share" button** (fixed bottom-right): generates a challenge URL for the current target at any time during play

---

## Features

- **Five feedback logic types** — Higher/Lower, Exact Match, Category Match, Geographic Distance, and Set Intersection
- **Total Moves scoring** — balance information gathering against move count
- **3 free hint credits** per game — reveal any attribute at no move cost
- **Eye icon hints** — tap any attribute to reveal the exact target value (mobile: always visible; desktop: shown on hover with tooltip)
- **Guess card collapse/expand** — older cards auto-collapse to a colored summary strip to reduce clutter
- **Color legend** — persistent Exact/Hot/Near/Miss swatch strip always visible above the grid
- **Segmented category toggle** — charcoal-filled active state, no dropdown
- **Category-specific win/forfeit cards** — periodic table cell (Elements) or passport card (Countries)
- **Card-based responsive layout** — 1 col (mobile), 2 col (tablet), 3 col (desktop)
- **Geographic distance** — Countries uses Haversine distance with 4-tier color gradient
- **Linked category matching** — numeric fields show HOT when guess is in the same size bucket as the target
- **Data-driven architecture** — zero code changes needed to add a new category
- **Autocomplete input** — fuzzy-matching with keyboard navigation, up to 8 suggestions
- **Persistent state** — game progress saved to localStorage automatically
- **Challenge sharing** — shareable URLs encode category + target entity in Base64
- **Thermal e-paper aesthetic** — Geist Mono + Fraunces Variable serif, sharp corners, hard-edge shadows
- **Venn diagram visual identity** — SVG logo and animated background
- **Privacy-respecting analytics** — Vercel Analytics, no cookies, no personal data
- **Privacy policy** — accessible from the footer

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| [React](https://react.dev/) | 19 | UI Framework |
| [Vite](https://vitejs.dev/) | 7 | Build Tool & Dev Server |
| [TypeScript](https://www.typescriptlang.org/) | ~5.9 | Type Safety (strict mode) |
| [Tailwind CSS](https://tailwindcss.com/) | 4 | Styling (CSS-first `@theme inline` config) |
| [Zustand](https://github.com/pmndrs/zustand) | 5 | State Management (localStorage persistence) |
| [Radix UI](https://www.radix-ui.com/) | — | Accessible Dialog Primitives |
| [Lucide React](https://lucide.dev/) | — | Icons (Eye, Check, ChevronDown, Share2, X) |
| [Vercel Analytics](https://vercel.com/analytics) | — | Privacy-respecting analytics (no cookies) |
| [Geist Mono](https://vercel.com/font) | — | Body/data monospace font |
| [Fraunces Variable](https://fonts.google.com/specimen/Fraunces) | — | Serif display font for headings |

---

## Project Architecture

### Directory Structure

```
Scalar/
├── CLAUDE.md                        # Project context for AI assistants
├── README.md                        # This file
├── GAMEPLAY.md                      # Detailed gameplay logic & scoring
├── STYLE_GUIDE.md                   # Visual design system & component specs
├── fetch_data.py                    # Python: CSV -> gameData.json
├── package.json
├── data/
│   ├── countries_schema_config.csv
│   ├── countries_enriched.csv
│   ├── elements_schema_config.csv
│   └── elements_enriched.csv
└── src/
    ├── main.tsx                     # Entry point
    ├── App.tsx                      # Root: header, category selector, grid, modals
    ├── index.css                    # Tailwind v4 @theme config + custom utilities
    ├── types.ts                     # All shared types/interfaces
    ├── assets/data/
    │   └── gameData.json            # Auto-generated by fetch_data.py
    ├── store/
    │   └── gameStore.ts             # Zustand store (version 13, localStorage)
    ├── utils/
    │   ├── gameLogic.ts             # Feedback engine + game utilities
    │   ├── feedbackColors.ts        # Cell color logic
    │   ├── formatters.ts            # Number/distance/tier formatting
    │   ├── geo.ts                   # Haversine distance
    │   ├── schemaParser.ts          # Schema field helpers
    │   ├── challengeUtils.ts        # Challenge URL encode/decode
    │   ├── analytics.ts             # Vercel Analytics wrapper
    │   └── cn.ts                    # clsx + tailwind-merge
    └── components/
        ├── ui/                      # Shadcn/UI primitives
        ├── CategoryToggle.tsx       # Segmented button group for category selection
        ├── ColorLegend.tsx          # Persistent color legend strip above game grid
        ├── GameGrid.tsx             # Responsive card grid + collapse state management
        ├── GuessCard.tsx            # Individual guess card + collapse/expand strip
        ├── GameInput.tsx            # Autocomplete input + mobile focus collapse support
        ├── GameOverModal.tsx        # "Puzzle Complete" modal (always centered, scrollable)
        ├── RevealAnswerModal.tsx    # "Answer Revealed" forfeit modal (always centered)
        ├── HowToPlayModal.tsx       # Instructions (auto-opens first visit)
        ├── MajorHintModal.tsx       # Hint cost confirmation
        ├── PrivacyPolicyModal.tsx   # Privacy policy
        ├── Scoreboard.tsx           # Moves + hint credit squares display
        ├── ScalarLogo.tsx           # Venn diagram SVG logo
        ├── VennBackground.tsx       # Animated decorative background
        ├── CountryDetailCard.tsx    # Passport-style country card (win/forfeit modals)
        └── ElementCellCard.tsx      # Periodic table cell card (win/forfeit modals)
```

### Core Type Definitions

Located in `src/types.ts`:

```typescript
type LogicType =
    | 'EXACT_MATCH'       // Binary equality
    | 'CATEGORY_MATCH'    // String match with optional distance gradient
    | 'HIGHER_LOWER'      // Numeric comparison with direction + percentage
    | 'GEO_DISTANCE'      // Haversine distance between coordinates
    | 'SET_INTERSECTION'  // Comma-separated list intersection
    | 'TARGET'            // Entity name (identification only)
    | 'NONE';             // Support column (not displayed)

type DisplayFormat =
    | 'HIDDEN'              // Not shown in grid
    | 'TEXT'                // Raw string
    | 'DISTANCE'            // Formatted km distance
    | 'PERCENTAGE_DIFF'     // Arrow + % tier (↑ ~25%)
    | 'RELATIVE_PERCENTAGE' // Arrow + relative % (↑ +34%)
    | 'NUMBER'              // Raw number
    | 'CURRENCY'            // Arrow + $value
    | 'LIST'                // Intersection count (X/Y)
    | 'ALPHA_POSITION';     // Letter (1→A ... 26→Z) with horizontal arrows

interface SchemaField {
    attributeKey: string;
    displayLabel: string;
    dataType: 'INT' | 'FLOAT' | 'STRING' | 'CURRENCY' | 'BOOLEAN' | 'LIST';
    logicType: LogicType;
    displayFormat: DisplayFormat;
    isFolded: boolean;
    isVirtual: boolean;
    linkedCategoryCol?: string;
    uiColorLogic?: 'DISTANCE_GRADIENT' | 'CATEGORY_MATCH' | 'STANDARD' | 'NONE';
}

interface Feedback {
    direction: 'UP' | 'DOWN' | 'EQUAL' | 'NONE';
    status: 'EXACT' | 'HOT' | 'NEAR' | 'MISS';
    value: string | number | boolean;
    displayValue?: string;
    distanceKm?: number;
    percentageDiff?: number;
    categoryMatch?: boolean;
    matchedItems?: { text: string; isMatch: boolean }[];
}

type GameStatus = 'PLAYING' | 'SOLVED' | 'REVEALED';
```

### State Management

The game uses **Zustand** with localStorage persistence (`src/store/gameStore.ts`, version 13):

```typescript
interface GameState {
    activeCategory: string;
    targetEntity: Entity;
    guesses: GuessResult[];
    gameStatus: GameStatus;
    moves: number;
    credits: number;
    majorHintAttributes: string[];

    setActiveCategory(category: string): void;
    submitGuess(guess: Entity): void;
    revealMajorHint(attributeId: string | string[]): void;
    revealAnswer(): void;
    resetGame(): void;
    startChallengeGame(category: string, entity: Entity): void;
}
```

**Key behaviors:**
- All display columns are **visible by default** — no hidden-column UI mechanic
- Category changes trigger a full reset: new target, cleared guesses, moves 0, credits 3
- `revealMajorHint` is the **only** hint action — uses 1 credit (0 moves) if available, else +3 moves
- `revealAnswer()` sets moves to the entity count of the active category (not ∞)
- Store persisted to localStorage key `scalar-game-storage`, version 13 (version bump clears stale state)

### Game Logic — Feedback Engine

Located in `src/utils/gameLogic.ts`, uses a **dispatch pattern**:

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

| Handler | Status Rules |
|---------|-------------|
| `handleExactMatch` | EXACT or MISS |
| `handleCategoryMatch` | EXACT or MISS |
| `handleHigherLower` | EXACT (equal), HOT (linked category matches), MISS |
| `handleGeoDistance` | EXACT (0km), HOT (<1000km), NEAR (<3000km), MISS |
| `handleSetIntersection` | EXACT (ratio=1), HOT (>0.5), NEAR (>0), MISS (0) |

### Feedback Color System

Centralized in `src/utils/feedbackColors.ts`:

```
getCellColor(feedback, field)
  ├── GEO_DISTANCE → distance-based 4-tier gradient (green/amber/yellow/white)
  ├── DISTANCE_GRADIENT uiColorLogic → binary: green (EXACT) / white (miss)
  ├── CATEGORY_MATCH uiColorLogic → green (EXACT) / gold (bucket match) / white
  └── Default (STANDARD) → green (EXACT) / orange (HOT) / amber+dashed (NEAR) / white
```

### Component Hierarchy

```
App
├── VennBackground               # Fixed animated SVG orbs
├── ScalarLogo                   # Venn diagram SVG (inside title area)
├── Sticky Header
│   ├── CategoryToggle           # Segmented button group (left)
│   ├── GameInput                # Autocomplete + tag cloud dropdown (center)
│   ├── Scoreboard               # Moves + 3 credit squares (right)
│   └── "?" How to Play button   # With orange pulse dot for new visitors
├── Main
│   ├── ColorLegend              # Persistent Exact/Hot/Near/Miss swatch strip
│   └── GameGrid
│       └── GuessCard (per guess, newest first)
│           ├── Card Header      # Entity name + #index + mobile collapse chevron
│           ├── Summary Strip    # Colored squares (when collapsed)
│           ├── Location Cell    # Merged Hemisphere • Continent • Subregion
│           ├── Standard Cells   # HIGHER_LOWER split, EXACT_MATCH, CATEGORY_MATCH
│           └── Expandable Section # Folded attributes (none in current categories)
├── Answer Section               # ?????? / entity name + Reveal Answer button
├── GameOverModal                # "Puzzle Complete" — ElementCellCard / CountryDetailCard
├── RevealAnswerModal            # "Answer Revealed" — ElementCellCard / CountryDetailCard
├── HowToPlayModal               # Instructions
├── MajorHintModal               # Hint cost confirmation
├── PrivacyPolicyModal           # Privacy policy
├── Footer                       # Built by Samir Husain · Privacy Policy
├── Share Button                 # Fixed bottom-right, auto-hides on scroll
└── Analytics                    # Vercel Analytics
```

---

## Data Pipeline

Game data is sourced from **CSV files** in the `data/` directory:

```bash
python fetch_data.py
```

**Active categories** (`CATEGORY_MAP` in `fetch_data.py`):
- `countries` → `countries_schema_config.csv` + `countries_enriched.csv`
- `elements` → `elements_schema_config.csv` + `elements_enriched.csv`

**Output** (`src/assets/data/gameData.json`):
```json
{
  "schemaConfig": {
    "countries": [ { "attributeKey": "...", "logicType": "...", ... } ]
  },
  "categories": {
    "countries": [ { "id": "USA", "name": "United States", "continent": "Americas", ... } ]
  }
}
```

---

## Getting Started

### Prerequisites

- **Node.js** v18+
- **npm** (included with Node.js)
- **Python 3** (for data pipeline only)

### Installation

```bash
git clone <repository-url>
cd Scalar
npm install
```

### Development

```bash
npm run dev
# Open http://localhost:5173
```

### Production Build

```bash
npm run build
npm run preview
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | TypeScript compile + Vite build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint (flat config, v9) |

---

## Extending the Game

### Adding a New Category

1. Create `data/{category}_schema_config.csv` with columns: `attribute_key`, `display_label`, `data_type`, `logic_type`, `display_format`, `is_folded`, `is_virtual`, `linked_category_col`, `ui_color_logic`
2. Create `data/{category}_enriched.csv` with entity data
3. Add entry to `CATEGORY_MAP` in `fetch_data.py`
4. Run `python fetch_data.py`
5. UI auto-discovers the new category
6. Optionally add a category-specific entity card to `GameOverModal.tsx`

### Adding a New Logic Type

1. Add to `LogicType` union in `src/types.ts`
2. Create handler in `src/utils/gameLogic.ts`, add case to `getFeedback()`
3. Update `src/utils/feedbackColors.ts` if new coloring needed
4. Update `GuessCard.tsx` if new cell rendering needed
5. Add CSS utilities to `src/index.css` if needed

### Customizing the Theme

Edit `src/index.css` to modify CSS custom properties and Tailwind theme tokens:

```css
@theme inline {
  --color-paper-white: #FAFAF9;
  --color-charcoal: #18181B;
  --color-graphite: #E2E8F0;
  --color-thermal-green: #22C55E;
  --color-thermal-orange: #F97316;
  --color-thermal-gold: #EAB308;
}
```

---

## Design System

**"Thermal E-Paper / Scientific Journal"** — *The New York Times* data journalism meets a high-end e-reader.

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `paper-white` | `#FAFAF9` | Canvas background |
| `charcoal` | `#18181B` | Primary text/ink |
| `graphite` | `#E2E8F0` | Structural borders |
| `thermal-green` | `#22C55E` | Exact match / win |
| `thermal-orange` | `#F97316` | Hot / close |
| `thermal-gold` | `#EAB308` | Category bucket match |
| `thermal-amber` | `#F59E0B` | Warm / medium proximity |
| `thermal-teal` | `#14B8A6` | Cool / far |
| `venn-teal` / `venn-pink` / `venn-gold` | — | Logo/background identity |

### Typography

- **Fraunces Variable** (`font-serif-display`) — serif headings, titles, modal banners
- **Geist Mono** — body text, data values, labels, buttons, inputs

### Visual Rules

- **Sharp corners** (`--radius: 0px`) — zero border radius everywhere
- **Hard-edge shadows** — `shadow-hard` (6px) for modals, `shadow-hard-sm` (4px) for dropdowns — no soft blurs
- **Buttons** — invert on hover (outline → filled, filled → outline)
- **Input** — underline-style (bottom border only, no box)
- **Uppercase everywhere** — labels, buttons, headings, entity names

---

## Privacy & Analytics

Scalar uses **Vercel Analytics** for privacy-respecting usage tracking:

- **No cookies** — visitors identified via a daily-reset hash that cannot track across sessions
- **No personal data** — no names, emails, or precise geolocation
- **Events tracked**: `game_completed` (category, move count, hints used) and `challenge_shared` (category, moves)
- **Page views**: standard anonymized tracking (device type, browser, country-level location)

All game state is stored in **browser localStorage** only and never transmitted to any server.

A full privacy policy is accessible in-app via the footer "Privacy Policy" link.

---

## License

[MIT](LICENSE)
