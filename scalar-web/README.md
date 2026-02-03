# SCALAR (Web)

> A deductive logic game where players guess entities based on attribute feedback — featuring a minimalist "E-ink" aesthetic.

![Scalar Game](https://img.shields.io/badge/Version-0.0.0-blue)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwind-css)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Game Mechanics](#game-mechanics)
  - [How It Works](#how-it-works)
  - [Feedback System](#feedback-system)
  - [Deep Scan System](#deep-scan-system)
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

The web version features a responsive design that adapts from a **"Diagnostic Terminal"** view on desktop to a full-screen mobile experience, all styled with a high-contrast, minimalist **"E-ink" / "Paper"** aesthetic.

---

## Features

### 🎮 Dynamic Game Engine
- **Data-Driven Architecture**: Game modes, categories, and entities are dynamically loaded from JSON configuration
- **Multiple Categories**: Countries, Hollywood movies, Chemical elements, Animals — each with unique schemas

### 📊 Multiple Difficulty Modes
| Mode       | Guesses |
|------------|---------|
| EASIER     | ∞ (Unlimited) |
| EASY       | 15 |
| REGULAR    | 10 |
| HARD       | 5 |
| HARDEST    | 3 |

### 🔍 Deep Scan System
Click column headers to reveal percentile rankings (e.g., *"Population is in the Top 10%"*) — use strategically to narrow down possibilities.

### 🎨 Premium "E-ink" Aesthetic
- Monospaced typography (Geist Mono)
- High-contrast "Charcoal on Paper" color palette
- Minimal animations and sharp corners
- "Win" state color inversion effect

### 📱 Responsive Design
- **Desktop**: Centered, fixed-width terminal container with keyboard controls
- **Mobile**: Full-width, touch-optimized layout

---

## Game Mechanics

### How It Works

1. **Select a Category**: Choose from available categories (countries, hollywood, chemicals, animals)
2. **Select Difficulty**: Pick your preferred number of guesses
3. **Make Guesses**: Type in the autocomplete input and select an entity
4. **Analyze Feedback**: Each guess reveals attribute feedback
5. **Deduce the Target**: Use feedback to narrow down and guess the target entity

### Feedback System

Each cell in the game grid displays feedback based on comparison:

#### Status Types
| Status | Visual | Meaning |
|--------|--------|---------|
| `CRITICAL` | 🟩 Green background | Exact match |
| `THERMAL` | 🟨 Yellow background | Close (within tolerance) |
| `NULL` | ⬜ Gray background | Miss |

#### Direction Indicators (Numeric Fields)
| Direction | Visual | Meaning |
|-----------|--------|---------|
| `UP` | Thick top border | Target value is **higher** than guess |
| `DOWN` | Thick bottom border | Target value is **lower** than guess |
| `EQUAL` | Normal border | Values match |

### Deep Scan System

**Deep Scan** is a strategic mechanic that reveals the **percentile ranking** of the target's attribute value.

- **How to Use**: Click on any numeric column header (marked with `?`)
- **Result**: Shows percentile (e.g., *"Population is in the Top 14%"*)
- **Limit**: Each attribute can only be scanned once per game
- **Strategy**: Use early to understand the general range, then make educated guesses

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| [React 19](https://react.dev/) | UI Framework |
| [Vite](https://vitejs.dev/) | Build Tool & Dev Server |
| [TypeScript](https://www.typescriptlang.org/) | Type Safety |
| [Tailwind CSS v4](https://tailwindcss.com/) | Styling |
| [Zustand](https://github.com/pmndrs/zustand) | State Management (with persistence) |
| [Radix UI](https://www.radix-ui.com/) | Accessible Dialog Primitives |
| [class-variance-authority](https://cva.style/docs) | Component Variants |
| [Geist Mono](https://vercel.com/font) | Typography |

---

## Project Architecture

### Directory Structure

```
scalar-web/
├── src/
│   ├── assets/
│   │   └── data/
│   │       └── gameData.json      # Game data (schema + entities)
│   ├── components/
│   │   ├── ui/                    # Shadcn/Radix UI primitives
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── input.tsx
│   │   ├── GameGrid.tsx           # Main grid component with headers
│   │   ├── GameInput.tsx          # Autocomplete input with suggestions
│   │   ├── GameOverModal.tsx      # Win/Loss modal dialog
│   │   ├── GridRow.tsx            # Single row of guess feedback
│   │   └── GridCell.tsx           # Individual cell with status/direction
│   ├── store/
│   │   └── gameStore.ts           # Zustand store for game state
│   ├── utils/
│   │   ├── cn.ts                  # Tailwind class name merger
│   │   ├── formatters.ts          # Number formatting (k, M, B suffixes)
│   │   └── gameLogic.ts           # Pure game logic functions
│   ├── App.tsx                    # Main application component
│   ├── App.css                    # Additional app styles
│   ├── index.css                  # Tailwind + theme configuration
│   ├── main.tsx                   # React entry point
│   └── types.ts                   # TypeScript interfaces
├── public/
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

### Core Type Definitions

Located in `src/types.ts`:

```typescript
// Data types for schema field definitions
type DataType = 'INT' | 'FLOAT' | 'STRING' | 'CURRENCY';

// Available difficulty levels
type GameMode = 'EASIER' | 'EASY' | 'REGULAR' | 'HARD' | 'HARDEST';

// Schema field definition (from gameData.json)
interface SchemaField {
    label: string;           // Display name (e.g., "Population")
    type: DataType;          // Data type for comparison logic
    unitPrefix?: string;     // Prefix (e.g., "$" for currency)
    unitSuffix?: string;     // Suffix (e.g., "km²" for area)
    tolerance: number | null; // Tolerance for THERMAL feedback (e.g., 0.2 = 20%)
}

// Feedback direction for numeric comparisons
type FeedbackDirection = 'UP' | 'DOWN' | 'EQUAL' | 'NONE';

// Proximity status
type FeedbackStatus = 'CRITICAL' | 'THERMAL' | 'NULL';

// Complete feedback for a single cell
interface Feedback {
    direction: FeedbackDirection;
    status: FeedbackStatus;
    value: string | number;
}
```

### State Management

The game uses **Zustand** with localStorage persistence (`src/store/gameStore.ts`):

```typescript
interface GameState {
    // Core State
    activeCategory: string;          // Current active category
    targetEntity: Entity;            // The entity to guess
    guesses: GuessResult[];          // Array of past guesses with feedback
    gameStatus: 'PLAYING' | 'WON' | 'LOST';
    gameMode: GameMode;              // Current difficulty
    maxGuesses: number;              // Derived from gameMode
    
    // Deep Scan
    deepScanResult: DeepScanResult | null;
    scannedAttributes: string[];     // Already scanned attributes
    
    // Actions
    setActiveCategory(category: string): void;
    setGameMode(mode: GameMode): void;
    submitGuess(guess: Entity): void;
    performDeepScan(attribute: string): void;
    resetGame(): void;
    clearDeepScan(): void;
}
```

**Key Behaviors:**
- Category/Mode changes trigger a full game reset with new target
- Game state persists to localStorage for session continuity
- Win condition checked after each guess (all fields `CRITICAL`)

### Game Logic

Pure functions in `src/utils/gameLogic.ts`:

| Function | Purpose |
|----------|---------|
| `getFeedback(target, guess, schema)` | Compares target vs guess and returns feedback for each field |
| `getGuessesForMode(mode)` | Returns max guesses for a difficulty mode |
| `getRandomTarget(gameData, category)` | Selects a random entity from a category |
| `checkWinCondition(feedback)` | Returns `true` if all feedback statuses are `CRITICAL` |
| `calculateDeepScan(gameData, category, attribute, targetValue)` | Calculates percentile ranking |
| `getSuggestions(entities, query, guessedIds)` | Filters entities for autocomplete (fuzzy match, deduplicated) |

**Feedback Calculation Logic:**

```typescript
// For STRING fields
if (target[key] === guess[key]) → status = 'CRITICAL'

// For numeric fields (INT, FLOAT, CURRENCY)
if (guess < target) → direction = 'UP'
if (guess > target) → direction = 'DOWN'
if (guess === target) → direction = 'EQUAL', status = 'CRITICAL'

// Proximity check (tolerance-based)
if (Math.abs(diff) <= tolerance * target) → status = 'THERMAL'
```

### Component Hierarchy

```
App
├── Header (inline)
│   ├── Category Selector Tabs
│   ├── Difficulty Mode Buttons
│   └── Guess Counter (Battery Meter)
├── GameGrid
│   ├── Column Headers (clickable for Deep Scan)
│   ├── GridRow (for each guess slot)
│   │   └── GridCell (for each attribute)
│   └── Deep Scan Result Modal
├── GameInput
│   ├── Command-line prefix (>)
│   ├── Autocomplete Input
│   └── Tag Cloud Suggestions (opens upward)
└── GameOverModal (Radix Dialog)
    ├── Victory/Failure Title
    ├── Summary (Target Entity, Guesses Used)
    └── Action Buttons (Share, Play Again)
```

---

## Data Pipeline

Game data is sourced from a **Google Sheet** and converted to JSON:

### Data Source
- **Google Sheet ID**: `1XhZ66tFCbJhcIN5CgObzcVc8J3WkXoz5B0-R4V6O3h0`
- **Schema Tab**: `schema_config` defines field types, labels, tolerances
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
- `credentials.json`: Google Service Account credentials
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
        "tolerance": 0.2
      },
      // ... more fields
    },
    // ... more categories
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
      },
      // ... more entities
    ],
    // ... more categories
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
cd Scalar/scalar-web

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
       "field1": { "label": "Field 1", "type": "STRING", "tolerance": null },
       "field2": { "label": "Field 2", "type": "INT", "tolerance": 0.1 }
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

3. The UI will automatically pick up the new category.

### Customizing the Theme

Edit `src/index.css` to modify CSS custom properties:

```css
:root {
  --background: 60 10% 95%;        /* Paper white */
  --foreground: 210 19% 26%;       /* Charcoal */
  --border: 210 19% 26%;
  --radius: 0px;                   /* Sharp corners */
}
```

---

## License

[MIT](LICENSE)

---

**Built with ❤️ using React, Vite, and Tailwind CSS**
