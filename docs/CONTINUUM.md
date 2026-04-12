# Continuum — Design, Gameplay & Features

## What Is Continuum?

Continuum is a daily calibration game. Three reference cards are pre-placed on a ranked timeline. The player receives one new card at a time — name only, no value shown — and must drag it into the correct position in the ranking. The challenge is spatial reasoning about real-world data: "Is the Philippines more or less populous than Botswana?"

The game is **endless** — there is no win condition. Play continues until 3 lives are lost. The score is how many cards were placed correctly before losing.

---

## Route & Entry

- **URL:** `/continuum`
- **Navigation (desktop):** GameNav bottom bar (shared with Scalar)
- **Navigation (mobile):** Hamburger menu inside Scalar → "Play Continuum"; or GameNav if visible

---

## Daily Mode

Continuum is **daily-only** — no freeplay, no category or attribute selection by the player.

Each day's puzzle is deterministically seeded:

```
seed = hashString(dateString + ':continuum:daily-picker')
rand = mulberry32(seed)
category = random pick from CONTINUUM_METRICS keys
attribute = random pick from that category's metric list
```

The card deal sequence is then seeded separately:
```
seed = hashString(dateString + ':' + category + ':' + attribute)
```

This means everyone playing on the same day sees the same category, attribute, anchor cards, and deal order.

---

## Metrics

Only high-uniqueness, high-coverage numeric attributes are eligible. Defined in `src/utils/continuumConfig.ts`.

### Countries
| Attribute | Notes |
|-----------|-------|
| `population` | 100% unique across 195 countries |
| `area` | 99% unique |
| `gdp_per_capita` | 100% unique, 158/195 coverage |

### Elements
| Attribute | Notes |
|-----------|-------|
| `AtomicNumber` | 100% unique across 118 elements |
| `Density` | 77% unique, full coverage |
| `AtomicRadius` | 67% unique, 99/118 coverage |

---

## Game Mechanics

### Starting State

Three **anchor cards** are pre-placed at game start, chosen by PRNG:

| Anchor | Selection Range |
|--------|----------------|
| Low anchor | Bottom 5% of values |
| Mid anchor | 40th–60th percentile |
| High anchor | Top 5% of values |

Anchors are sorted ascending and placed in the timeline before the first card is dealt.

### Display Order

The timeline shows **highest value at top, lowest at bottom**. This is cosmetic — the store always sorts ascending internally. The component reverses for display and translates visual gap indices back to store insertion indices:

```
store_index = placedCards.length - visual_gap_index
```

### Dealing Cards

Each new card is chosen via **fuzzy bisection**: the algorithm finds the largest gap between currently placed values and targets a card whose value falls within the middle 50% of that gap. This ensures the game progressively fills in detail rather than clustering at extremes.

If no card fits the middle 50%, it falls back to any card in the full gap, then any remaining card.

The full deal sequence is pre-computed at game start and stored in `dealQueue`.

### Placing a Card

The player drags the incoming card (right panel) into a gap in the timeline (left panel).

- **Correct placement:** Card locks in, next card is dealt, score +1.
- **Wrong placement:** Life deducted. The card flickers (eink animation), then slides to its correct position. The misplaced card becomes a permanent anchor (calibrates future bisection gaps). Status transitions: `PLAYING → ERROR → PLAYING` (or `LOST` if lives reach 0).

### Lives

3 lives. Displayed as filled/empty squares in the header. No way to earn more.

### Score

Running count of correct placements. Shown in the header as `N placed`.

---

## Status Machine

```
IDLE ──(startDailyGame)──► PLAYING
                               │
              correct placement │ wrong placement
                 ▼              ▼
            PLAYING ◄── ERROR (animation)
                               │
                        lives === 0
                               ▼
                             LOST
```

`IDLE` is transient — the component auto-calls `startDailyGame()` in a `useEffect` whenever `status === 'IDLE'`, including after the "Again" button resets the store.

---

## Drag & Drop Interaction

Uses the **Pointer Events API** — works on both desktop (mouse) and mobile (touch). No HTML5 drag API (incompatible with mobile).

```
onPointerDown  → setPointerCapture, begin drag, compute initial gap
onPointerMove  → update ghost position, find nearest gap, haptic tick on gap change
onPointerUp    → place card at active gap, end drag
onPointerCancel → end drag, no placement
```

Gap detection: iterates `gapRefs` array, finds the gap element whose center Y is closest to the pointer's current Y. Allows ±80px tolerance outside the timeline bounds so fast drags don't lose the gap highlight.

### Drag Ghost

While dragging, the original card in the right panel fades to 30% opacity. A fixed-position ghost card (charcoal background, orange shadow) follows the cursor.

### Haptics (Android only — iOS blocks Vibration API)

| Event | Pattern |
|-------|---------|
| Crossing into a new gap | `8ms` single pulse |
| Wrong placement | `[60, 50, 60, 50, 120]ms` stutter-thud |

---

## Visual Design

### Layout

```
┌─────────────────────────────────────┐
│  continuum logo (ContinuumLogo)     │
├────────────────────┬────────────────┤
│  HEADER            │                │
│  Rank by: [attr]   │  [lives][score]│
│  [difficulty pills]│  [☰ mobile]   │
├────────────────────┴────────────────┤
│  LEFT (60%)        │ RIGHT (40%)    │
│  ▲ highest         │                │
│  · ─────────────── │  [current card]│
│  [card]            │  drag to place │
│  · ─────────────── │                │
│  [card]            │                │
│  ▼ lowest          │                │
├────────────────────┴────────────────┤
│  footer links                       │
└─────────────────────────────────────┘
```

- **Mobile:** `h-dvh`, hamburger navigation, `max-w-sm`
- **Desktop:** `h-[calc(100dvh-3.5rem)]` (accounts for GameNav), inline difficulty row, `max-w-md`, no hamburger

### ContinuumLogo

File: `src/components/ContinuumLogo.tsx`

- Font: `Geist Mono`, bold, lowercase
- A single decimal point `.` is randomly inserted between letters of "continuum" on each mount (`useMemo` with `[]` deps)
- The dot is teal (`#14B8A6`) at `0.9em` size — reads as a calibration value, not punctuation
- Superscript: `daily · calibration`
- Subscript rule: `rank · place · repeat`

Examples on refresh: `con.tinuum`, `continu.um`, `c.ontinuum`

### Drop Gaps

| State | Height | Line | Label |
|-------|--------|------|-------|
| Boundary (top/bottom), inactive | `h-8` | `h-px bg-charcoal/40` | Bordered pill: "▲ highest" / "▼ lowest" |
| Middle gap, inactive | `h-5` | `h-px bg-charcoal/20` | `·` dot |
| Any gap, active (dragging over) | `h-12` | `h-0.5 bg-thermal-green` | Green bordered pill: "▲ highest" / "▼ lowest" / "↓ drop here" |

### Placed Cards

- Compact row: `px-2.5 py-2`
- Name: `font-mono font-bold uppercase text-[10px]` left-aligned
- Value: `text-[10px] tabular-nums text-charcoal/55` right-aligned
- Cards placed **incorrectly** (auto-corrected) get a **red left border** (`border-l-2 border-l-red-500`) — permanent visual record of a mistake
- All other cards are identical — no REF tag, no special border

### LOST Screen

Inline reveal timeline sorted by value (ascending in the list, but displayed descending matches the game's high-at-top order in the LOST screen). Cards categorised:

| Type | Style |
|------|-------|
| Original anchor | `border-l-2 border-l-thermal-green` |
| Correctly placed | Plain |
| Incorrectly placed | `bg-folded-pattern` + Flag icon |

---

## Store (`continuumStore.ts`)

**Not persisted** — Zustand store with no localStorage. Each page load is fresh.

| Field | Type | Description |
|-------|------|-------------|
| `status` | `IDLE \| PLAYING \| ERROR \| LOST` | Game phase |
| `category` | `string` | Active category key |
| `attribute` | `string` | Active metric key |
| `attributeLabel` | `string` | Display name of the metric |
| `placedCards` | `Entity[]` | Sorted ascending by value |
| `initialAnchorIds` | `Set<string>` | The 3 starting anchor IDs — never changes |
| `anchorIds` | `Set<string>` | Grows as error cards are added for bisection calibration |
| `errorPlacedIds` | `Set<string>` | Cards placed wrong — used for LOST screen red styling |
| `currentCard` | `Entity \| null` | The card the player is currently placing |
| `dealQueue` | `Entity[]` | Pre-computed deal sequence |
| `lives` | `number` | Remaining lives (starts at `MAX_LIVES = 3`) |
| `score` | `number` | Correct placements so far |
| `errorCardId` | `string \| null` | ID of card being error-animated |
| `dateString` | `string` | Date this round was seeded for |

### Actions

| Action | Description |
|--------|-------------|
| `startDailyGame()` | Picks today's category + attribute via PRNG, calls `startGame()` |
| `startGame(category, attribute)` | Picks anchors, pre-computes deal sequence, sets status `PLAYING` |
| `placeCard(insertIndex)` | Validates placement, transitions to `ERROR` or stays `PLAYING` |
| `resolveError()` | Called after animation completes — sorts cards, deals next or transitions to `LOST` |
| `reset()` | Sets `IDLE` — component's `useEffect` immediately calls `startDailyGame()` |

---

## Navigation & Consistency with Scalar

| Concern | Scalar | Continuum |
|---------|--------|-----------|
| Desktop game switching | GameNav (bottom bar) | GameNav (bottom bar) |
| Mobile game switching | Hamburger → "Play Continuum" | Hamburger → "Play Scalar" |
| Desktop header | Inline difficulty + controls | Inline difficulty pills (placeholder) |
| Mobile header | Hamburger only | Hamburger only |
| Footer | Built by / Privacy / Feedback | Same footer, same links |
| Background | VennBackground | VennBackground |
| Header blur | `bg-paper-white/95 backdrop-blur-sm` | Same |

---

## Files

| File | Purpose |
|------|---------|
| `src/components/ContinuumGame.tsx` | Full game UI — layout, drag-drop, LOST screen |
| `src/components/ContinuumLogo.tsx` | Animated decimal-point wordmark |
| `src/store/continuumStore.ts` | Zustand store (not persisted) |
| `src/utils/continuumConfig.ts` | `CONTINUUM_METRICS` allowlist per category |

---

## Known Gaps / Future Work

- Difficulty modes (Novice / Scholar / Prodigy) — placeholder UI exists, not implemented
- Daily streak tracking — no persistence, no `dailyMeta` equivalent
- Share image — only text share implemented (`navigator.share` / clipboard fallback)
- iOS haptics — blocked by OS; would require native app wrapper
- Stats modal — games played, avg score, best score
- Countdown to next daily
