# Scalar - Gameplay Logic & Scoring

## Overview

Scalar is a deductive logic guessing game. A secret target entity is chosen at random from a category (countries or chemical elements). The player submits guesses and receives structured feedback on each attribute, using that feedback to narrow down the answer. The goal is to identify the target in as few **total moves** as possible.

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
  +---> Use Hints (Eye icon, costs moves or credits)
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
| Reveal exact value (Eye icon hint, with free credit) | 0 |
| Reveal exact value (Eye icon hint, no credits left) | +3 |
| Reveal answer (forfeit) | Game ends as REVEALED — moves set to entity count |

### Free Hint Credits

- Each game starts with **3 free hint credits**
- Credits are consumed (one at a time) when using the Eye icon hint
- Credits reset to 3 on new game or category change
- Displayed in the header Scoreboard as 3 filled/empty squares

---

## Feedback System

When a guess is submitted, every schema field (except `TARGET` and `NONE` types) produces a **Feedback** object:

```
Feedback {
  direction:     UP | DOWN | EQUAL | NONE
  status:        EXACT | HOT | NEAR | MISS
  value:         raw guess value
  displayValue:  formatted string for rendering
  distanceKm:    (optional) haversine distance in km
  percentageDiff:(optional) symmetric numeric % difference
  categoryMatch: (optional) whether linked category column matches
  matchedItems:  (optional) per-item match array for SET_INTERSECTION
}
```

### Win Condition

The player wins when **every** feedback field has `status === 'EXACT'`.

---

## Feedback Logic Types

Each attribute in a category's schema has a `logicType` that determines how feedback is computed.

### 1. EXACT_MATCH

Binary equality check. Used for discrete attributes like "Landlocked?", "Radioactive", "Symbol matches name?".

| Condition | Status |
|-----------|--------|
| Values equal (case-insensitive strings, boolean comparison) | EXACT |
| Values differ | MISS |

- Direction is always `NONE`.
- Booleans display as "Yes" / "No".

### 2. CATEGORY_MATCH

String equality check. Used for categorical attributes like "Continent", "Subregion", "Phase (STP)", "Element Family", "Block", "Govt. Type".

| Condition | Status |
|-----------|--------|
| Values equal (case-insensitive) | EXACT |
| Values differ | MISS |

- Direction is always `NONE`.
- When the field has `uiColorLogic: 'DISTANCE_GRADIENT'`, the haversine distance is attached to the feedback for gradient coloring (even though the match logic is binary string comparison). This is used for Continent, Subregion, and Hemisphere in Countries.

### 3. HIGHER_LOWER

Numeric comparison with directional indicators. Used for quantitative attributes like "Population", "Area", "Atomic #", "Group", "Period", "Timezones", "Borders", "1st Letter".

| Condition | Status |
|-----------|--------|
| Guess equals target | EXACT |
| Linked category column matches | HOT |
| Otherwise | MISS |

**Direction indicators:**
- `UP` (arrow ↑) — target is higher than guess
- `DOWN` (arrow ↓) — target is lower than guess
- `EQUAL` — values are identical

**Percentage difference** is calculated symmetrically: `(max(|a|, |b|) / min(|a|, |b|) − 1) × 100`

This is symmetric — the tier displayed is the same magnitude regardless of which direction the miss is in.

| Effective Ratio (max/min) | Displayed Tier |
|--------------------------|----------------|
| 1.0 (exact) | Exact |
| < 1.15 | ~10% |
| < 1.37 | ~25% |
| < 1.75 | ~50% |
| < 3× | ~2× |
| < 7× | ~5× |
| < 15× | ~10× |
| < 60× | ~50× |
| ≥ 60× | ~100× |

**Year fields** (Release Year, Discovered) use absolute year difference tiers instead:

| Year Diff | Displayed Tier |
|-----------|----------------|
| 0 | Exact |
| ≤ 5 years | ~5 yrs |
| ≤ 15 years | ~15 yrs |
| ≤ 30 years | ~30 yrs |
| > 30 years | 30+ yrs |

**Linked category columns** are hidden support fields (e.g., `population_cat`, `area_cat`, `GroupBlock`) that group numeric values into named buckets. When the guess and target share the same bucket, the feedback shows `HOT` status (orange background) — indicating the player is in the right ballpark even if the exact number differs.

**Display formats by field type:**
- `PERCENTAGE_DIFF`: "↑ ~25%" style tiers (or multiplier tiers for large diffs)
- `RELATIVE_PERCENTAGE`: "↑ +34%" relative to the guess value
- `CURRENCY`: "↑ $1.2M" with dollar prefix
- `NUMBER`: "↑ 42" raw value with arrow
- `ALPHA_POSITION`: Letter (A-Z) with horizontal arrows (← earlier in alphabet, → later)

**Cell layout:** Value is shown on the left in a larger font; the arrow + tier is shown on the right in a smaller font. Arrow and tier text are white/muted on EXACT/HOT backgrounds, charcoal/muted on white backgrounds.

**Long text values** in CATEGORY_MATCH cells (>14 chars) and Subregion (>16 chars) are auto-truncated with an ellipsis. Tapping/clicking the cell expands the full text inline.

### 4. GEO_DISTANCE

Geographic proximity using the Haversine formula (great-circle distance between coordinates). Used for the "Distance from Target" virtual field in the Countries category, computed from the capital city coordinates.

| Distance | Status |
|----------|--------|
| 0 km | EXACT |
| < 1,000 km | HOT |
| < 3,000 km | NEAR |
| ≥ 3,000 km | MISS |

- Direction is always `NONE`.
- Display value is formatted distance (e.g., "1,234 km", "1.5M km").
- Cell color also encodes distance directly (see Color System below).

### 5. SET_INTERSECTION

Overlap ratio of comma-separated lists. Used for "Genre" and "Cast & Crew" in Hollywood (when that category is active).

The ratio is calculated as: `intersection.length / union.length`

| Ratio | Status |
|-------|--------|
| 1.0 (identical sets) | EXACT |
| > 0.5 | HOT |
| > 0 | NEAR |
| 0 | MISS |

- Direction is always `NONE`.
- Individual items are shown with per-item match coloring: green+bold for matches, gray for misses.
- Cast & Crew (`Credits` key) only shows matched items; hidden entirely if no matches.

---

## Color System

Feedback colors communicate proximity visually. Each cell's color is determined by the field's `uiColorLogic` and feedback status.

### Standard Status Colors (`uiColorLogic: 'STANDARD'`)

| Status | Background | Text | Extra |
|--------|-----------|------|-------|
| EXACT | Green `#22C55E` | White | — |
| HOT | Orange `#F97316` | White | — |
| NEAR | Amber-100 `#FEF3C7` | Charcoal | Dashed `border-amber-400` |
| MISS | White | Charcoal | — |

### GEO_DISTANCE Cell Colors (Distance from Target)

For the virtual Distance field in Countries:

| Distance | Color | Notes |
|----------|-------|-------|
| 0 km (EXACT) | Green `#22C55E` | Same as standard EXACT |
| < 1,000 km | Green `#22C55E` | HOT — very close |
| < 3,000 km | Amber `#F59E0B` | NEAR — moderate distance |
| < 5,000 km | Yellow `#FACC15` | Beyond NEAR but still warm |
| ≥ 5,000 km | White | MISS — far |

### DISTANCE_GRADIENT Text Fields (Location Fields)

For Continent, Subregion, and Hemisphere in Countries — binary coloring based on string match:

| Condition | Color |
|-----------|-------|
| Exact text match | Green `#22C55E` |
| No match | White |

### Category Match Colors (`uiColorLogic: 'CATEGORY_MATCH'`)

| Condition | Color |
|-----------|-------|
| EXACT | Green `#22C55E` |
| Same category bucket (HOT) | Gold `#EAB308` |
| Different category (MISS) | White |

### Direction Indicators

Direction is shown as text arrows in the secondary text of HIGHER_LOWER cells:

- **UP** (target is higher): ↑ arrow (larger font)
- **DOWN** (target is lower): ↓ arrow (larger font)
- Tier label ("~25%", "~5×") rendered in smaller font to the right of the arrow

For ALPHA_POSITION fields (1st Letter in Countries):
- **UP** (target letter comes later in alphabet): → arrow
- **DOWN** (target letter comes earlier): ← arrow

---

## Hint System

### Eye Icon Hints

Available on **all cells** while the game is PLAYING. Triggered via the Eye icon in the top-right corner of each cell (`w-7 h-7` touch target).

- **Mobile**: Eye icon always visible (opacity-50).
- **Desktop**: Eye icon hidden until cell hover; shows "Reveal" tooltip on hover.
- Reveals the **exact target value** for that attribute as an inverted badge (charcoal background, paper-white text, checkmark icon)
- **Cost:** Free if credits are available (consumes 1 credit, 0 moves), otherwise **+3 moves**
- A confirmation dialog (MajorHintModal) shows the cost and attribute name before applying
- The merged Location cell (Continent/Subregion/Hemisphere) reveals all 3 attributes at once for a single credit/cost
- Once revealed, the badge persists across all guess cards for that attribute

### Folded Attributes (Expandable Section)

Some schema fields can be marked as `isFolded: true`, placing them in a collapsible "More clues" section at the bottom of each guess card.

- Expanding the section is free — it's a UI affordance only
- Each card manages its own expanded/collapsed state independently
- Revealing the target value for a folded attribute uses the same Eye icon / credit / move cost system
- **Currently: neither active category (countries, elements) has folded fields** — the "More clues" section does not appear in the current game

---

## Guess Card Collapse System

To reduce visual clutter as guesses accumulate, older cards can be collapsed to a compact **summary strip**.

### Auto-Collapse Rules
- The **3 most recent** guess cards are always expanded by default.
- When a new guess is submitted, the card that slides into the **4th position** is automatically collapsed (unless the player has manually expanded it).
- On initial load from localStorage (game in progress), all guesses older than the 3rd-most-recent start collapsed.

### Summary Strip
When collapsed, a card shows a single row of **colored squares** (one per visible field), using the same thermal color system:
- Green square = EXACT
- Orange square = HOT
- Amber square = NEAR
- White/outlined square = MISS

A chevron icon on the right side indicates the card is expandable.

### Manual Toggle
- **Mobile**: A collapse/expand chevron button appears in the card header (top-right of the name row) while the card is expanded.
- **Any**: Clicking the summary strip re-expands the card.
- Players can freely collapse/expand any card; manual toggles override the auto-collapse behavior.

---

## UI / Navigation

### Category Toggle
Category selection uses a segmented toggle button (not a dropdown). The active category is shown with an inverted (charcoal-filled) style. Switching category resets the game.

### Color Legend
A persistent **Color Legend** strip is displayed above the guess grid at all times. It shows the four thermal feedback colors (Exact / Hot / Near / Miss) for quick reference.

### Sticky Header
The header bar is sticky (`top-0`) with a frosted-glass backdrop. On mobile it collapses the logo and hides the category toggle + scoreboard rows when the input field is focused, maximizing screen space for typing.

### How to Play Button
The "How to Play" link has been replaced with a `?` icon button (7×7 bordered square). On first visit, an orange pulse dot appears on it to guide new players. The dot disappears after the modal is opened once and the localStorage key is set.

### Share Button (Fixed Bottom-Right)
The "Share" button in the bottom-right corner:
- **Hides** (slides off-screen) when the player scrolls down more than 10px.
- **Reappears** when the player scrolls back up.
- **Always visible** when the game status is SOLVED.

### Answer Footer
The bottom-of-page answer area shows:
- `??????` while PLAYING.
- The full target entity name (uppercase, no truncation) when SOLVED or REVEALED.
- A bordered "Reveal Answer" button (not an underline link) for forfeiting.

### GameOverModal
The modal is always centered. It has a scrollable body (for tall entity cards) with a **sticky header** (title + close button) and **sticky footer** (action buttons). Clicking the overlay closes the modal.

### RevealAnswerModal
The modal is always centered on all screen sizes (no bottom-sheet). Shows the same category-specific entity card as GameOverModal (ElementCellCard for elements, CountryDetailCard for countries) rather than a plain attribute list. A "New Game" button is pinned to the bottom.

---

## Categories

### Countries
Guess world countries. Active attributes (all visible by default, none folded):
- **Location** (merged cell): Hemisphere, Continent, Subregion — binary color per part (green if match, gray if miss)
- **Distance from Target**: Haversine km between capital cities — 4-tier color gradient
- **Area**: Square km — percentage diff tier, linked to area category bucket
- **Population**: Linked to population category bucket
- **Landlocked?**: Yes/No exact match
- **Govt. Type**: Government type string match
- **Borders**: Number of bordering countries
- **Timezones**: Linked to timezone category bucket
- **1st Letter**: First letter of country name, rendered A-Z with horizontal arrows

### Elements
Guess chemical elements (from the periodic table). Active attributes (all visible by default, none folded):
- **Atomic #**: Sequential numeric comparison
- **Group**: Periodic table group number, linked to GroupBlock name
- **Period**: Periodic table row number
- **Phase (STP)**: Standard state — Solid, Liquid, or Gas
- **Element Family**: Alkali Metal, Noble Gas, Transition Metal, etc.
- **Block**: s, p, d, or f block
- **Radioactive**: Yes/No — exact match
- **Symbol matches name?**: Whether the chemical symbol is a direct abbreviation of the element name

---

## Example Turn: Countries

1. **Category:** Countries. Target is secretly "Japan".
2. **Player guesses:** "Brazil"
3. **Feedback received:**
   - Location: "Northern • Asia • Eastern Asia" (target) vs "Southern • Americas • South America" (guess) — all parts MISS (white bg, gray text)
   - Distance: 17,362 km — MISS (white bg), far
   - Area: 8.5M ↓ ~5× — MISS (different area bucket, white bg) — target (377k km²) is much smaller
   - Population: 213M ↑ ~2× — MISS (different population bucket) — target (125M) is somewhat less
   - Landlocked?: No — EXACT (green)
   - Govt. Type: "Federal Republic" vs target "Constitutional Monarchy" — MISS
   - Borders: 10 ↓ ~2× — MISS — Japan has 0 borders (island nation)
   - Timezones: 4 ↑ ~2× — MISS — Japan has 1
   - 1st Letter: J (10) vs B (2) → J is later in alphabet → ↑, different range
4. **Player uses this feedback**: Target is in Asia (not Americas), Northern hemisphere, smaller area, fewer people, no land borders, 1 timezone, letter J
5. **Player guesses "China"** → gets HOT on some attributes, narrows further
6. **Eventually**: All fields show EXACT (green) — puzzle solved!

---

## Example Turn: Elements

1. **Category:** Elements. Target is secretly "Gold" (Au, #79).
2. **Player guesses:** "Iron" (Fe, #26)
3. **Feedback received:**
   - Atomic #: 26 ↑ ~2× — HOT (target 79 is in same group-block? depends on linked category) — arrow ↑ tells you to guess higher
   - Group: 8 ↑ — target group 11, different GroupBlock → MISS
   - Period: 4 ↑ — target period 6 → MISS (different period)
   - Phase (STP): Solid — EXACT (green) — Gold is also Solid
   - Element Family: Transition Metal — EXACT (green) — both Transition Metals
   - Block: d-block — EXACT (green) — both d-block
   - Radioactive: No — EXACT (green) — Gold is not radioactive
   - Symbol matches name?: No — EXACT — both Fe and Au don't match their full names
4. **Player knows**: Target is a d-block Transition Metal, Solid, not radioactive, symbol doesn't match name, higher atomic number (↑ from 26), higher period (↑ from 4), different group
5. **Player narrows** to late transition metals in period 5-6, eventually guesses Gold
6. **All EXACT** — puzzle solved!
