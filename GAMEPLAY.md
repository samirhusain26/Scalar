# Scalar - Gameplay Logic & Scoring

## Overview

Scalar is a deductive logic guessing game. A secret target entity is chosen at random from a category (countries, movies, chemical elements, or animals). The player submits guesses and receives structured feedback on each attribute, using that feedback to narrow down the answer. The goal is to identify the target in as few **total moves** as possible.

---

## Game Flow

```
Game Start
  |
  v
Random target selected from active category
  |
  v
Player is PLAYING
  |
  +---> Submit Guess (+1 move)
  |       |
  |       +---> All attributes EXACT? ---> SOLVED (win)
  |       |
  |       +---> Not all EXACT ---> Continue PLAYING
  |
  +---> Use Hints (optional, costs moves or credits)
  |
  +---> Reveal Answer (forfeit) ---> REVEALED (no score)
```

**Game statuses:** `PLAYING` | `SOLVED` | `REVEALED`

---

## Scoring: Total Moves

The player's score is their **total move count** — lower is better.

| Action | Move Cost |
|--------|-----------|
| Submit a guess | +1 |
| Reveal a hidden column (with free credit) | 0 |
| Reveal a hidden column (no credits left) | +3 |
| Reveal a folded attribute (with free credit) | 0 |
| Reveal a folded attribute (no credits left) | +3 |
| Hint — reveal exact target value (with free credit) | 0 |
| Hint — reveal exact target value (no credits left) | +3 |
| Reveal answer (forfeit) | Game ends as REVEALED, no score awarded |

### Free Hint Credits

- Each game starts with **3 free hint credits**.
- Credits are consumed (one at a time) when revealing hidden columns, folded attributes, or using Eye icon hints.
- Credits reset to 3 on new game or category change.
- Displayed in the Scoreboard as 3 filled/empty squares.

---

## Feedback System

When a guess is submitted, every schema field (except `TARGET` and `NONE` types) produces a **Feedback** object:

```
Feedback {
  direction:     UP | DOWN | EQUAL | NONE
  status:        EXACT | HOT | NEAR | MISS
  value:         raw guess value
  displayValue:  formatted string for rendering
  distanceKm:    (optional) haversine distance
  percentageDiff:(optional) numeric % difference
  categoryMatch: (optional) whether linked category column matches
}
```

### Win Condition

The player wins when **every** feedback field has `status === 'EXACT'`.

---

## Feedback Logic Types

Each attribute in a category's schema has a `logicType` that determines how feedback is computed.

### 1. EXACT_MATCH

Binary equality check. Used for discrete attributes like "Landlocked?", "Driving Side", "Radioactive".

| Condition | Status |
|-----------|--------|
| Values equal (case-insensitive for strings, boolean comparison for booleans) | EXACT |
| Values differ | MISS |

- Direction is always `NONE`.
- Booleans display as "Yes" / "No".

### 2. CATEGORY_MATCH

String equality check. Used for categorical attributes like "Continent", "Subregion", "Phase (STP)".

| Condition | Status |
|-----------|--------|
| Values equal (case-insensitive) | EXACT |
| Values differ | MISS |

- Direction is always `NONE`.
- When the field has `uiColorLogic: 'DISTANCE_GRADIENT'`, the haversine distance is attached to the feedback for gradient coloring (even though the match logic is still binary string comparison).

### 3. HIGHER_LOWER

Numeric comparison with directional indicators. Used for quantitative attributes like "Population", "Area", "Atomic #", "Release Year".

| Condition | Status |
|-----------|--------|
| Guess equals target | EXACT |
| Linked category column matches | HOT |
| Otherwise | MISS |

**Direction indicators:**
- `UP` (arrow ↑) — target is higher than guess
- `DOWN` (arrow ↓) — target is lower than guess
- `EQUAL` — values are identical

**Percentage difference** is calculated as: `|guess - target| / target * 100`, then bucketed into display tiers:

| % Diff Range | Display |
|-------------|---------|
| 0 | Exact |
| 1-15% | ~10% |
| 16-37% | ~25% |
| 38-75% | ~50% |
| 76-150% | ~100% |
| 150%+ (< 5x factor) | 2x+ |
| 5x – 10x | 5x+ |
| 10x – 50x | 10x+ |
| 50x – 100x | 50x+ |
| 100x+ | 100x+ |

**Year fields** (Release Year, Discovered) use absolute year difference tiers instead:

| Year Diff | Display |
|-----------|---------|
| 0 | Exact |
| 1–2 years | ±2 yrs |
| 3–5 years | ±5 yrs |
| 6–10 years | ±10 yrs |
| 11–25 years | ±25 yrs |
| 26–50 years | ±50 yrs |
| 50+ years | 50+ yrs |

**Linked category columns** are hidden support fields (e.g., `population_cat`, `area_cat`) that group numeric values into categories. When the guess and target share the same category, the feedback shows `HOT` status (gold background) — indicating the player is in the right ballpark even if the exact number differs.

**Display formats by field type:**
- `PERCENTAGE_DIFF`: Shows "↑ ~25%" style tiers (or multiplier tiers for large diffs)
- `RELATIVE_PERCENTAGE`: Shows "↑ +34%" relative to the guess value (switches to multiplier tiers >150%)
- `CURRENCY`: Shows "↑ $1.2M" with dollar prefix
- `NUMBER`: Shows "↑ 42" raw value with arrow
- `ALPHA_POSITION`: Shows letter (A-Z) with horizontal arrows (←/→)

### 4. GEO_DISTANCE

Geographic proximity using the Haversine formula (great-circle distance between coordinates). Used for the "Distance" virtual field in the Countries category.

| Distance | Status |
|----------|--------|
| 0 km | EXACT |
| < 1,000 km | HOT |
| < 3,000 km | NEAR |
| >= 3,000 km | MISS |

- Direction is always `NONE`.
- Display value is formatted distance (e.g., "1,234 km", "1.5M km").

### 5. SET_INTERSECTION

Overlap ratio of comma-separated lists. Used for "Genre" and "Cast & Crew" in Hollywood.

The ratio is calculated as: `intersection.length / union.length`

| Ratio | Status |
|-------|--------|
| 1.0 (identical sets) | EXACT |
| > 0.5 | HOT |
| > 0 | NEAR |
| 0 | MISS |

- Direction is always `NONE`.
- Individual items are shown with per-item match coloring: green+bold for matches, gray for misses.
- Cast & Crew only shows matched items (hidden entirely if no matches).
- Display value shows matched items as comma-separated list, or "No match".

---

## Color System

Feedback colors communicate proximity visually. Each cell's color is determined by the field's `uiColorLogic`.

### Standard Status Colors (`uiColorLogic: 'STANDARD'`)

| Status | Color | Visual |
|--------|-------|--------|
| EXACT | Green (#22C55E) | Solid green background, white text |
| HOT | Orange (#F97316) | Solid orange background, white text |
| NEAR | Light Amber | Amber-100 background with dashed amber-400 border |
| MISS | White | White background, charcoal text |

### GEO_DISTANCE Cell Colors

For the Distance virtual field (Haversine km), uses `getGeoDistanceCellClass`:

| Distance | Color | Name |
|----------|-------|------|
| < 1,000 km (includes 0 km) | Green (#22C55E) | Thermal Green |
| < 3,000 km | Amber (#F59E0B) | Geo Warm |
| < 5,000 km | Yellow (#FACC15) | Geo Yellow |
| >= 5,000 km | White | — |

### DISTANCE_GRADIENT Text Fields

For location text fields (Continent, Subregion, Hemisphere) — binary coloring based on string match:

| Condition | Color |
|-----------|-------|
| Exact text match | Green (#22C55E) |
| No match | White |

### Category Match Colors (`uiColorLogic: 'CATEGORY_MATCH'`)

| Condition | Color |
|-----------|-------|
| EXACT | Green (#22C55E) |
| Category matches | Gold (#EAB308) |
| Category differs | White |

### Direction Indicators (Text Arrows)

Direction is shown as text arrows in the secondary text of HIGHER_LOWER cells:

- **UP** (target is higher): ↑ arrow
- **DOWN** (target is lower): ↓ arrow

For ALPHA_POSITION fields, horizontal arrows are used:
- **UP** (later in alphabet): → arrow
- **DOWN** (earlier in alphabet): ← arrow

---

## Hint Systems

### Folded Attributes

Some attributes are marked as `isFolded: true` in the schema. These appear in a collapsible "More clues" section at the bottom of each guess card.

- Expanding the section is free — it's purely a UI affordance.
- Each card manages its own expanded/collapsed state independently.
- Folded attributes show full feedback with all color logic when expanded.

### Column Reveal (Hidden Columns)

All non-folded display columns are visible by default in the current implementation. The `revealColumn` action exists in the store for revealing hidden columns:

- **With credits available:** Free (consumes 1 credit)
- **Without credits:** +3 moves

### Hints (Eye Icon)

Available on **all cells** — not just HIGHER_LOWER. Triggered via the Eye icon on guess cards.

- Reveals the **exact target value** for that attribute.
- **Cost:** Free if credits are available (consumes 1 credit), otherwise **+3 moves**.
- The merged Location cell (Continent/Subregion/Hemisphere) reveals all 3 attributes at once for a single credit/cost.
- Confirmation dialog (MajorHintModal) warns the player and shows cost before applying.
- Once revealed, the cell displays an inverted badge (bg-charcoal text-paper-white) showing the target value with a checkmark.

---

## Categories

The game ships with four categories, each with a unique schema defining which attributes are tracked and how feedback is computed.

### Countries
Guess world countries. Feedback includes geographic distance (haversine), continental/regional matching with distance gradient coloring, and numeric comparisons for population, area, GDP, and military size. Folded clues include landlocked status, timezones, population density, and Olympic history.

### Hollywood
Guess movies. Feedback includes release year, genre overlap (set intersection), cast & crew overlap, runtime, production company, and box office revenue. Folded clues include IMDb rating, MPAA rating, Oscars won, and source material.

### Chemicals
Guess chemical elements. Feedback includes atomic number, group, phase at STP, rarity, and discovery year. Folded clues include atomic mass, density, melting/boiling points, radioactivity, whether synthetic, neutron count, electronegativity, atomic radius, ionization energy, conductivity, and period.

### Animals
Guess animals. Feedback includes class, skin type, diet, weight, height, top speed, and lifespan. Folded clues include daily sleep hours, gestation period, activity pattern, and conservation status.

---

## Example Turn

1. **Category:** Countries. Target is secretly "Japan".
2. **Player guesses:** "Brazil"
3. **Feedback received:**
   - Location: "Southern • Americas • South America" — all MISS (white bg, gray text)
   - Distance: 17,362 km — MISS (white bg)
   - Area: 8.5M ↑ ~100% — MISS (white, different area category)
   - Population: 213M ↓ ~50% — MISS (white, different population category)
   - Landlocked: No — EXACT (green)
   - Timezones: 4 ↓ — MISS (white, different timezone category)
4. **Player uses this feedback** to narrow: target is in a different hemisphere, much smaller area, lower population, not landlocked, fewer timezones, and is far away from Brazil.
5. **Player guesses again** (+1 move), receiving new feedback that further narrows the possibilities.
6. **Eventually**, all fields show EXACT (green) — puzzle solved!
