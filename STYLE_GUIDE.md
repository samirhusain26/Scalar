# Scalar Visual Style Guide

## Design Philosophy

**"Thermal E-Paper / Scientific Journal"** — The New York Times data journalism meets a high-end e-reader. The entire UI is built on a paper-white canvas with charcoal ink, sharp corners, thin borders, monospace data, and a serif display typeface for headings. Feedback is communicated through a thermal color gradient rather than conventional red/green palettes.

---

## Color Palette

### Core Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `paper-white` | `#FAFAF9` | Canvas background, card backgrounds, button text on filled buttons |
| `charcoal` | `#18181B` | Primary text/ink, card borders, filled button backgrounds, header text |
| `graphite` | `#E2E8F0` | Structural/decorative borders, dividers, scoreboard separators |

### Thermal Feedback Colors

| Token | Hex | Meaning | Text Color |
|-------|-----|---------|------------|
| `thermal-green` | `#22C55E` | Exact match / win / perfect | White |
| `thermal-gold` | `#EAB308` | Category bucket match (HIGHER_LOWER HOT) | Charcoal |
| `thermal-orange` | `#F97316` | Hot / very close | White |
| `thermal-amber` | `#F59E0B` | GEO_DISTANCE <3000km tier | Charcoal |
| White | `#FFFFFF` | Miss / no match | Charcoal |

### GEO_DISTANCE Cell Colors (Countries: Distance from Target)

Applied to the virtual Distance field (Haversine km between capital cities):

| Range | Color | Class | Text |
|-------|-------|-------|------|
| 0 km (EXACT) + < 1,000 km (HOT) | Green `#22C55E` | `bg-thermal-green` | White |
| < 3,000 km (NEAR) | Amber `#F59E0B` | `bg-geo-warm` | Charcoal |
| < 5,000 km | Yellow `#FACC15` | `bg-geo-yellow` | Charcoal |
| ≥ 5,000 km (MISS) | White | `bg-white` | Charcoal |

### DISTANCE_GRADIENT Text Fields (Countries: Location Fields)

Applied to Continent, Subregion, Hemisphere — binary coloring based on string match:

| Condition | Color | Class | Text |
|-----------|-------|-------|------|
| Exact text match | Green `#22C55E` | `bg-thermal-green` | White |
| No match | White | `bg-white` | Charcoal |

### Category Match Colors

| State | Color | Class | Text |
|-------|-------|-------|------|
| Exact | Green `#22C55E` | `bg-thermal-green` | White |
| Same category bucket | Gold `#EAB308` | `bg-cat-match` | Charcoal |
| Miss | White | `bg-white` | Charcoal |

### Standard Feedback Status Colors

| Status | Background | Additional Styles |
|--------|-----------|------------------|
| EXACT | `bg-thermal-green` | White text |
| HOT | `bg-thermal-orange` | White text |
| NEAR | `bg-amber-100` | Dashed border `border-amber-400`, charcoal text |
| MISS | `bg-white` | Charcoal text |

### Venn Logo Palette

| Color | Hex | Element |
|-------|-----|---------|
| Teal | `#14B8A6` | Left Venn circle |
| Pink | `#F472B6` | Right Venn circle |
| Gold | `#EAB308` | Intersection (vesica piscis) |

---

## Typography

### Font Families

| Font | Family | Usage |
|------|--------|-------|
| **Geist Mono** | `'Geist Mono', monospace` | Default — body text, data values, clue labels, buttons, input fields, and everything except display headings. Set on `body` in CSS. |
| **Fraunces Variable** | `'Fraunces Variable', Georgia, serif` | Display headings only — the main "SCALAR" title and modal title banners. Applied via the `font-serif-display` utility class. |

### Type Scale & Treatments

| Element | Size | Weight | Style |
|---------|------|--------|-------|
| Main title "SCALAR" | `text-4xl` (mobile), `text-6xl` (desktop) | `font-light` | Uppercase, `tracking-[0.12em]`, `font-serif-display` |
| Modal titles | `text-2xl` | `font-black` | Uppercase, `tracking-wider`, `font-serif-display`, white text on charcoal background |
| Section headings (HowToPlay) | `text-xs` | `font-black` | Uppercase, `tracking-widest`, with `border-b border-charcoal/20` underline |
| Cell labels | `text-[10px]` | Normal | Uppercase, `opacity-60`, `tracking-wider` |
| Cell values (standard) | `text-sm` | `font-bold` | Truncated with overflow |
| Cell values (HIGHER_LOWER primary) | `text-base` | `font-bold` | Left side of split layout |
| Cell values (HIGHER_LOWER secondary) | `text-[11px]` font-mono | Normal | Right side: tier label; arrow in `text-base font-bold` |
| Guess card entity name | `text-base` | `font-bold` | Uppercase, truncated |
| Guess index `#03` | `text-sm` | Normal | `text-charcoal/60` |
| Input placeholder | `text-sm` | Normal | Uppercase |
| Button text | `text-sm` | `font-bold` | Uppercase, `tracking-wide` |
| Scoreboard labels | `text-xs` | Normal | Uppercase, `text-charcoal/50` |
| Scoreboard values | `text-base` | Normal | `tabular-nums` for consistent digit widths |
| "How to Play" link | `text-[10px]` (mobile), `text-xs` (desktop) | `font-bold` | Uppercase, `tracking-widest`, underline, `text-charcoal/40` → `text-charcoal/70` on hover |
| "Reveal Answer" link | `text-[10px]` | `font-bold` | Uppercase, `tracking-widest`, underline |
| Body text (modal content) | `text-sm` | Normal | `leading-relaxed` |
| Suggestion tags | `text-sm` | `font-bold` | Uppercase |

---

## Spacing & Layout

### Global Layout

- Page: `min-h-screen`, `p-4`, centered column (`flex flex-col items-center justify-center`)
- Desktop container: `max-w-6xl`, `lg:p-8`, `min-h-[80vh]`, flex column
- Background: `bg-paper-white` on both page and container

### Responsive Grid (GameGrid)

| Breakpoint | Columns | Class |
|------------|---------|-------|
| Mobile (< 768px) | 1 column | `grid-cols-1` |
| Tablet (768px+) | 2 columns | `md:grid-cols-2` |
| Desktop (1280px+) | 3 columns | `xl:grid-cols-3` |

Grid gap: `gap-4`, items aligned to start (`items-start`).

---

## Corners, Borders & Shadows

### Corners

**All corners are sharp.** `--radius: 0px` is set globally. No rounded corners anywhere.

### Border Treatments

| Purpose | Style |
|---------|-------|
| Structural dividers | `border-graphite` (1px, `#E2E8F0`) |
| Interactive/card borders | `border-charcoal` (1px, `#18181B`) |
| Internal cell dividers | 1px `bg-charcoal` gap (via `gap-px bg-charcoal` on grid parent) |
| Direction: target is higher | Text arrow "↑" in secondary text (no thick border) |
| Direction: target is lower | Text arrow "↓" in secondary text |
| Header separator | `border-b-venn` — gradient underline (teal → gold → pink, fading at edges) |
| NEAR status | `border-dashed border-amber-400` |

### Shadows

Only hard-edge "paper cut" shadows — no soft blurs.

| Utility | CSS | Usage |
|---------|-----|-------|
| `shadow-hard` | `6px 6px 0px 0px rgba(24,24,27,0.15)` | Modals |
| `shadow-hard-sm` | `4px 4px 0px 0px rgba(24,24,27,0.15)` | Suggestion dropdown |

---

## Background Patterns

### Hidden Column Pattern (`bg-hidden-pattern`)
- 45-degree diagonal stripes
- Stripe: `rgba(24,24,27,0.06)` (1px width, 4px spacing)
- Base: `#F8FAFC`

### Folded Column Pattern (`bg-folded-pattern`)
- -45-degree diagonal stripes (opposite direction)
- Stripe: `rgba(24,24,27,0.08)` (1px width, 3px spacing) — slightly darker than hidden
- Base: `#F1F5F9`

---

## Button Styles

All buttons use the **invert on hover** pattern:

### Filled Button (primary action)
```
bg-charcoal text-paper-white
border border-charcoal
font-bold uppercase text-sm tracking-wide
```
**Hover:** `bg-paper-white text-charcoal`

### Outline Button (secondary action)
```
border border-charcoal
bg-transparent (or bg-paper-white)
text-charcoal
font-bold uppercase text-sm tracking-wide
```
**Hover:** `bg-charcoal text-paper-white`

### Button Sizing
- Standard: `px-4 py-3`
- Compact (modal secondary): `px-4 py-2.5`
- Icon buttons: `p-0.5`, with `opacity-40 hover:opacity-100`

### Category Selector (CategoryToggle)
```
Segmented button group: div.flex border border-charcoal
Each button: px-3 py-1.5 text-xs font-bold uppercase tracking-wide font-mono
Active:   bg-charcoal text-paper-white
Inactive: bg-transparent text-charcoal hover:bg-charcoal/10
Divider between buttons: border-r border-charcoal
```

---

## Component Visual Designs

### Header Bar

**Sticky** (`sticky top-0 z-40`, `bg-paper-white/95 backdrop-blur-sm`).

**Desktop (md+) — single row:**
```
┌──────────────────────────────────────────────────────────────────┐
│ [Countries | Elements]   [____Type your guess..._____]   Moves 3 │ ■■■ │ [?] │
└──────────────── solid 2px charcoal border ───────────────────────┘
```
- **Left:** `CategoryToggle` segmented button group (`shrink-0`)
- **Center:** GameInput (`w-48 md:w-72 lg:w-80`, absolutely positioned)
- **Right:** Scoreboard + graphite divider + `?` How to Play button (`w-7 h-7 border border-charcoal`)
- Bottom border: `border-b-2 border-charcoal` (solid, not gradient)

**Mobile (< md) — stacked centered rows:**
```
┌──────────────────────┐
│ [Countries | Elements]│  ← Row 1: CategoryToggle (hides on input focus)
│  [_Type guess..._]   │  ← Row 2: input
│  Moves 3 │ ■■■ │ [?] │  ← Row 3: score + ? button (hides on input focus)
└── venn gradient line ─┘
```
- Bottom border: `border-b-venn` gradient
- Category toggle row and score row collapse (`max-h-0 opacity-0`) when input is focused

**`?` How to Play button:**
- `w-7 h-7 border border-charcoal flex items-center justify-center text-[11px] font-black`
- Hover: `hover:bg-charcoal hover:text-paper-white`
- Orange pulse dot (`w-2 h-2 bg-thermal-orange rounded-full animate-pulse`) for new visitors until HTP modal opened

**Shared:**
- Font: All monospace
- Spacing: `mb-6`, `pb-4`

### Title / Logo Area

Positioned above the header, centered:

```
         ┌───────────────────┐
         │   (Venn diagram   │
         │    logo, 50%      │
         │    opacity)       │
         │                   │
         │     SCALAR        │  ← Fraunces serif, font-light
         └───────────────────┘
```

- Logo: `ScalarLogo` SVG at 160px, `absolute opacity-50`
- Title: `relative text-4xl md:text-6xl font-light font-serif-display tracking-[0.12em] uppercase`
- Container: `height: 120px`, `mb-1`

### Scoreboard

Inline with header, right-aligned:

```
Moves 3 │ ■ ■ ■
```

- "Moves" label: `text-xs uppercase text-charcoal/50`
- Moves value: `text-base tabular-nums`
- Divider: `h-4 w-px bg-graphite`
- Credit squares: 3 × `w-2.5 h-2.5 border border-charcoal` (no "Hints" label)
  - Filled (credit available): `bg-charcoal`
  - Empty (credit used): `bg-transparent`

### Color Legend

Persistent strip displayed **above the game grid** at all times:

```
● Exact  ● Hot  ◌ Near  □ Miss
```

- Container: `flex items-center justify-center gap-3 py-0 pb-1 mb-1 border-b border-graphite opacity-70`
- Each item: `flex items-center gap-1` — square swatch (`w-3 h-3`) + label (`text-[10px] font-mono uppercase tracking-wider text-charcoal/50`)
- Swatches: `bg-thermal-green` / `bg-thermal-orange` / `bg-amber-100 border border-dashed border-amber-400` / `bg-white border border-charcoal/20`

---

### Game Input

Underline-style input with a downward-opening tag cloud suggestion dropdown:

```
Type your guess...
─────────────────────    ← 2px bottom border only

        ◇                ← small rotated square caret pointing up
    ┌──────────────────┐
    │ BRAZIL  BELGIUM  │  ← tag cloud layout (flex-wrap)
    │ BHUTAN  BOLIVIA  │
    └──────────────────┘
```

**Input field:**
- Width: `w-48 md:w-72 lg:w-80`
- Style: `border-0 border-b-2 border-b-charcoal`, no box, `bg-transparent`, `px-0`
- Text: `uppercase text-sm`, monospace
- Disabled: `cursor-not-allowed opacity-50`, placeholder "Solved" or "Revealed"
- On focus: scrolls page to top (`window.scrollTo({ top: 0, behavior: 'smooth' })`), triggers mobile header collapse via `onFocusChange` prop

**Suggestion dropdown:**
- Opens below (`top-full`), `mt-3` gap
- Small rotated square caret: `w-4 h-4 bg-paper-white border-l border-t border-charcoal rotate-45`
- Container: `bg-paper-white border border-charcoal p-3 shadow-hard-sm`
- Tags: `flex-wrap gap-2`; each tag `px-3 py-1.5 border font-mono text-sm uppercase`
  - Default: `bg-white text-charcoal border-charcoal/30`
  - Hover: `border-charcoal bg-gray-50`
  - Selected: `bg-charcoal text-paper-white border-charcoal scale-105`

### Guess Card

A data card representing a single guess. No rounded corners, no soft shadows.

```
┌──────────────────────────────────────┐
│ BRAZIL                           #03 │  ← Header
├──────────────────────────────────────┤
│ LOCATION (HEMISPHERE | CONTINENT | REGION)   👁 │
│ Southern • Americas • South America          │  ← merged row
├─────────────────┬────────────────────┤
│ AREA            │ POPULATION     👁  │  ← Eye icon on ALL cells
│ 8.5M  ↑ ~5×    │ 213M   ↓ ~2×      │  ← split: value left, arrow+tier right
├─────────────────┼────────────────────┤
│ LANDLOCKED?     │ GOVT. TYPE         │
│ No              │ Federal Republic   │
├─────────────────┼────────────────────┤
│ BORDERS         │ TIMEZONES          │
│ 10  ↓ ~2×      │ 4  ↑ ~2×           │
├─────────────────┴────────────────────┤
│ 1ST LETTER                           │
│ B  →                                 │  ← ALPHA_POSITION: letter + horizontal arrow
└──────────────────────────────────────┘
```

**Collapse behavior:**
- When collapsed: renders a summary strip — `flex gap-1 px-3 py-1.5 border-t border-charcoal hover:bg-zinc-100` with colored squares (green/orange/amber-200/white) + ChevronDown at far right
- When expanding: `card-body-enter` animation (max-height 0→800px, 0.2s)
- New card entry: `animate-card-enter` (translateY -16px→0, opacity 0→1, 0.25s)
- Older cards: `opacity-95` (idx=1) or `opacity-[0.85] scale-[0.99]` (idx≥2)

**Card container:** `border border-charcoal bg-paper-white`, no shadow, no rounding

**Header:** `flex items-center justify-between px-3 py-2 border-b border-charcoal`
- Entity name: `font-mono font-bold text-base uppercase truncate`
- Index: `font-mono text-sm text-charcoal/60 shrink-0`, format `#03` (zero-padded to 2 digits)
- Mobile collapse chevron: `md:hidden w-7 h-7`, rotated 180° (pointing up) when expanded

**Attribute grid:** `grid grid-cols-2 gap-px bg-charcoal` — charcoal gap creates 1px dividers

**Cell anatomy:**
```
┌────────────────────────┐
│ LABEL          [👁]    │  ← text-[10px] uppercase opacity-60 tracking-wider
│ Value       ↑ tier     │  ← HIGHER_LOWER: value left, arrow+tier right
│ [✓ TargetVal]          │  ← only if hinted (inverted badge)
└────────────────────────┘
```

- **Label:** `text-[10px] uppercase opacity-60 tracking-wider leading-tight`
- **Standard value:** `text-sm font-bold leading-tight mt-0.5 truncate`
- **HIGHER_LOWER split:** `flex justify-between items-baseline` — value `text-base font-bold`, secondary `opacity-80 shrink-0 ml-2 min-w-[3.5rem] text-right`
  - Arrow rendered as `text-base font-bold leading-none`; tier label as `text-[11px] font-mono`
- **Eye icon (hint trigger):** `absolute top-0.5 right-0.5 w-7 h-7 p-1.5` button. Mobile: `opacity-50` always. Desktop: `md:opacity-0 md:group-hover:opacity-70 md:hover:opacity-100`. Shows "Reveal" tooltip on desktop hover. Only while PLAYING.
- **Hint badge:** `inline-flex items-center gap-0.5 mt-1 px-1 py-0.5 bg-charcoal text-paper-white text-[9px] uppercase tracking-wider` with Check icon (`w-2.5 h-2.5`)
- **N/A values:** `bg-white` with `text-gray-400 font-normal italic`

**Location cell (Countries):**
- `col-span-2 px-3 py-2`
- Label: "Location (Hemisphere | Continent | Region)"
- All exact → `bg-thermal-green text-white`; partial/miss → `bg-white text-charcoal`
- Matching parts: `text-green-600 font-extrabold`; misses: `opacity-50`
- Dot separators: `mx-1.5 opacity-30` (or `opacity-60` when all exact)

**List fields (Genre, Cast & Crew):**
- `col-span-2 px-3 py-2`
- Matches: `text-green-600 font-bold`; misses: `text-gray-400`
- `line-clamp-2` to cap height; title attribute for full list on hover
- Cast & Crew hidden entirely if no matching items

**Expandable folded section:**
- Toggle: `w-full flex items-center justify-center gap-1 px-3 py-1.5 border-t border-charcoal`
  - `text-[11px] uppercase tracking-wider text-charcoal/50 hover:text-charcoal hover:bg-charcoal/5`
  - ChevronDown icon rotates 180° when expanded
- Expanded grid: same `grid grid-cols-2 gap-px bg-charcoal border-t border-charcoal`

**Empty state (no guesses):**
- `text-center py-8 font-mono text-charcoal/40 text-sm`
- Text: "Make a guess to get started"

### Answer Section

Below the game grid, separated by a top border:

```
──────────────────────────────────────────
ANSWER   ??????   [ Reveal Answer ]        ← while PLAYING (flex row on md)

ANSWER   BRAZIL                            ← when SOLVED/REVEALED (full name)
```

- Container: `mt-auto border-t-2 border-charcoal py-3 px-4 flex flex-col md:flex-row items-center justify-between md:justify-center md:gap-8`
- "ANSWER" label: `text-[10px] font-bold uppercase tracking-widest text-charcoal/60`
- Answer text: `text-xl tracking-widest font-black text-charcoal` — **full name, no truncation**
- "Reveal Answer": bordered button (`border border-charcoal px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-charcoal hover:text-paper-white`), not a link

---

## Modal System

All modals use **Radix Dialog** with a common visual pattern.

**Overlay:** `fixed inset-0 bg-black/50 backdrop-blur-sm z-50` with fade animation

**Common properties:** `bg-paper-white shadow-hard p-6`, no rounded corners, sharp edges everywhere

### Layout Variants

All modals are **always centered** on all screen sizes (no bottom-sheet variants):

| Modal | Layout |
|-------|--------|
| Game Over | Centered, scrollable body, sticky header + footer |
| Reveal Answer | Centered, scrollable body, pinned New Game button |
| How to Play | Centered, sticky header, scrollable body |
| Major Hint | Centered |
| Privacy Policy | Centered |

**Centered:**
- `top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`
- `border border-charcoal`
- Zoom + slide animation (95% → 100%)

**Title banner (shared):**
```css
w-full text-2xl font-black uppercase tracking-wider py-4
border border-charcoal bg-charcoal text-paper-white
font-serif-display text-center
```

---

### Game Over Modal (`max-w-md`) — Always Centered

`max-h-[85dvh] flex flex-col` — scrollable body with sticky header + sticky footer.

```
┌──────────────────────────────────────────┐  ← sticky header (shrink-0)
│ ██      PUZZLE COMPLETE      ██████  ✕  │  ← charcoal bg, Fraunces serif, close X
├──────────────────────────────────────────┤
│  ┌────────────────────────────────────┐  │  ← scrollable body (flex-1 overflow-y-auto)
│  │   79         196.97                │  │  ← ElementCellCard (elements)
│  │           Au                       │  │
│  │           GOLD                     │  │
│  │   Transition Metal · d · Solid     │  │
│  │  [3-col data panel]                │  │
│  └────────────────────────────────────┘  │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │           7 Moves                    │ │  ← text-3xl font-black
│ └──────────────────────────────────────┘ │
├──────────────────────────────────────────┤
│  [ Challenge a Friend ]                  │  ← sticky footer (shrink-0)
│  [ Play Again         ]                  │
└──────────────────────────────────────────┘
```

For Countries, the entity card is `<CountryDetailCard>` instead:

```
┌──────────────────────────────────────────┐
│  ┌────────────────────────────────────┐  │
│  │ Japan                         JPN  │  │  ← name (Fraunces serif) + ISO watermark
│  │ NORTH • ASIA • EASTERN ASIA        │  │  ← location breadcrumb
│  │ ◉ Tokyo                            │  │  ← capital
│  │  ┌──────┬──────┬──────┐            │  │
│  │  │Area  │Pop   │Dens. │            │  │  ← 3-col data grid
│  │  │377k  │125M  │330.8 │            │  │
│  │  └──────┴──────┴──────┘            │  │
│  │  (etc. for all 14 data fields)     │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

- Overlay click **can** close modal (no `onInteractOutside` prevention)
- Close button: Lucide `<X>` icon in sticky header, `absolute right-3 top-1/2 -translate-y-1/2`

---

### ElementCellCard Component

Periodic table square aesthetic for the elements category win state:

```
┌──────────────────────────────────────┐
│ 79                          196.97   │  ← Atomic # (font-black) | Mass (text-[11px])
│                                      │
│               Au                     │  ← Symbol (text-7xl font-black)
│              GOLD                    │  ← Name (text-xs uppercase tracking-[0.2em])
│  Transition Metal · d-block · Solid  │  ← Family · Block · Phase (text-[10px])
├──────────────────────────────────────┤
│  Group  Period  Year    Radio  Synth  │
│   11      6     Ancient  No     No   │  ← 3-col data panel (gap-px bg-charcoal)
│  Class  Rarity  Conduct  Dens   ...  │
│  ...                                  │
└──────────────────────────────────────┘
```

- `border-2 border-charcoal bg-paper-white max-w-[340px] mx-auto`
- Data panel: `grid grid-cols-3 gap-px bg-charcoal border-t-2 border-charcoal`
- Each data cell: `bg-paper-white px-2 py-1.5`; label `text-[9px] uppercase opacity-60`; value `text-[11px] font-bold`

---

### CountryDetailCard Component

Passport / data card aesthetic for the countries category win state:

```
┌──────────────────────────────────────┐
│ Japan                           JPN  │  ← Name (Fraunces font-light text-2xl) | ISO watermark
│ NORTH • ASIA • EASTERN ASIA          │  ← text-[10px] uppercase tracking-widest charcoal/50
│ ◉ Tokyo                              │  ← text-[10px] charcoal/40
├──────────────────────────────────────┤
│  Area (km²) │ Population │ Dens /km² │
│    377k     │    125M    │   330.8   │  ← 3-col data grid (gap-px bg-charcoal)
│  GDP        │ GDP/Capita │ Armed     │
│  $4.2T      │  $33k      │  247k     │
│  Landlocked?│ Drive Side │ Govt Type │
│  No         │  Left      │ Const Mon │
│  Timezones  │ Borders    │ Olympics  │
│  1          │  0         │  3        │
│  Last Olym  │ UNESCO     │           │
│  2021       │  25        │  (pad)    │
└──────────────────────────────────────┘
```

- `border border-charcoal bg-paper-white w-full`
- Passport header: `px-4 pt-4 pb-3 border-b border-charcoal`
- ISO code watermark: `text-xl font-black text-charcoal/[0.12] tracking-widest` (very faint)
- Data grid: `grid grid-cols-3 gap-px bg-charcoal`; each cell: `bg-paper-white px-2 py-1.5`
- Label: `text-[9px] uppercase opacity-50 tracking-wider font-mono`; value: `text-[11px] font-bold font-mono`

---

### Reveal Answer Modal (`max-w-sm md:max-w-md`) — Always Centered

```
┌──────────────────────────────────────┐
│ ✕  ████  ANSWER REVEALED  ██████████│  ← charcoal bg, close button
│                                      │
│  [ElementCellCard or CountryDetailCard│  ← scrollable body max-h-[70vh]
│   same as GameOverModal]             │
│                                      │
│  [        New Game        ]          │  ← pinned bottom, border-t border-charcoal
└──────────────────────────────────────┘
```

- Always centered (no bottom-sheet), `w-[95vw] max-w-sm md:max-w-md`
- Shows `ElementCellCard` (elements) or `CountryDetailCard` (countries) with `variant="modal"` prop
- Tracks `game_forfeit` analytics event on open

---

### How To Play Modal (`max-w-2xl`) — Always Centered

```
┌──────────────────────────────────────────┐
│ ██████████  HOW TO PLAY  ██████████  ✕  │  ← sticky header
│                                          │
│  ╔═══════════════════════════════════╗  │  ← border-l-2 intro block
│  ║  A mystery entity is chosen...    ║  │
│  ╚═══════════════════════════════════╝  │
│                                          │
│  READING A GUESS CARD                    │  ← Section heading style
│  ─────────────────────────               │
│  [Mini Brazil card: Location / Distance  │
│   / Population (HOT ↑~5×) / Landlocked  │
│   (EXACT) / Area (↓~50%) / Govt. Type]  │
│  [annotation swatches below]             │
│                                          │
│  CELL COLORS                             │
│  ─────────────────────────               │
│  [■] Exact  [■] Hot  [·] Near  [□] Miss  │
│                                          │
│  DIRECTION & PROXIMITY                   │
│  ─────────────────────────               │
│  [↑ Target higher] [↓ Target lower]      │
│  [→ Later in alphabet]                   │
│                                          │
│  Proximity tiers:                        │
│  ┌────┬────┬────┬────┬────┬────┬────┬───┐│
│  │~10%│~25%│~50%│~2× │~5× │~10×│~50×│~100×││
│  └────┴────┴────┴────┴────┴────┴────┴───┘│
│  ← Closer                   Further →    │
│                                          │
│  SCORING & HINTS                         │
│  ─────────────────────────               │
│  [move costs table: +1/+0/+3/—]          │
│  [credit squares + Eye icon description] │
│                                          │
│  [          Got It          ]            │  ← inline at end of content
└──────────────────────────────────────────┘
```

- `SectionHeading` helper: `font-black uppercase text-xs tracking-widest border-b border-charcoal/20 pb-1.5 mb-3`
- Tier strip: `flex gap-px overflow-x-auto` — each chip `px-2 py-1.5 text-[10px] font-mono border border-charcoal/10 whitespace-nowrap`; background uses inline style gradient (rgba from ~0.12 → ~0.02 left to right)
- Sticky header: `bg-charcoal text-paper-white flex items-center justify-between px-6 py-4`
- Scrollable body: `overflow-y-auto flex-1 px-6 py-5 space-y-6`
- "Got It" button inline at end of scrollable content (not a sticky footer)
- No "Extra Clues" section

---

### Major Hint Modal (`max-w-sm`) — Always Centered

```
┌──────────────────────────────────┐
│  REVEAL EXACT VALUE?             │  ← Fraunces serif, font-black uppercase
│                                  │
│  Reveal the exact value for      │
│  Population? This will use       │
│  1 free hint credit (3 left).    │  ← or "+3 moves" if no credits
│                                  │
│  [ Cancel ]  [ Reveal (Free) ]   │  ← or "Reveal (+3 moves)"
└──────────────────────────────────┘
```

- `w-[90vw] max-w-sm`
- Title: `text-lg font-black uppercase tracking-wide font-serif-display`
- Description: `font-mono text-sm text-charcoal/70 mb-6`

---

### Footer

```
Built by Samir Husain · Privacy Policy
```

- Container: `py-4 text-center font-mono flex items-center justify-center gap-2`
- Links: `text-[10px] text-charcoal/40 hover:text-charcoal/70 font-bold uppercase tracking-widest underline underline-offset-2`
- Separator: `text-charcoal/30 text-[10px]` middle dot `·`

---

### Share Button (Fixed)

```
┌──────────┐
│ ↗ Share  │  ← fixed bottom-4 right-4 z-50
└──────────┘
```

- `fixed bottom-4 right-4 z-50 flex items-center gap-1.5 border border-charcoal bg-paper-white px-3 py-1.5`
- Text: `text-[10px] font-bold uppercase tracking-widest text-charcoal`
- Hover: `hover:bg-charcoal hover:text-paper-white transition-colors`
- Icon: `<Share2>` from Lucide at 12px

---

### Privacy Policy Modal (`max-w-2xl`) — Always Centered

- Sections: Information We Collect, Information We Do Not Collect, Third-Party Services, Data Retention, Contact
- Content: `space-y-6 text-sm text-charcoal font-mono`
- Section headings: same `font-black uppercase text-xs tracking-widest` style
- Sub-headings: `font-bold text-xs mb-1`
- Body: `text-xs text-charcoal/70 leading-relaxed`
- "Got It" close button (filled style)

---

### Venn Background

Full-viewport fixed decorative SVG:

- `fixed inset-0 pointer-events-none overflow-hidden -z-10`
- ViewBox `0 0 1440 900`, `preserveAspectRatio="xMidYMid slice"`
- **Primary Venn pair (top-left):** Two overlapping circles (teal + pink, r=260) with gold intersection glow. Circles animate horizontally over 25s.
- **Secondary Venn pair (bottom-right):** Two overlapping circles (pink + teal, r=220). Animate vertically over 30s.
- **Floating accent orbs:** Scattered teal and pink circles (r=130–180) with subtle 20–28s animation.
- **Decorative outlines:** Three small charcoal Venn circle pairs at 4% opacity.
- All gradients at opacity 3–7% — subtle, non-distracting.

---

### Scalar Logo

SVG Venn diagram composed of two overlapping circles:

- Left circle: Teal gradient (`#7DD3C8` → `#14B8A6`)
- Right circle: Pink gradient (`#F9A8B8` → `#EC6B5E`)
- Intersection (vesica piscis): Golden gradient (`#FBBF24` → `#D4A017`) with highlight (`#FDE68A` at 40% opacity, gaussian blur)
- Thin white rim on vesica piscis edge (1.2px, 50% opacity)
- Default size: 120px wide, aspect ratio 200:120

---

## Animations & Transitions

| Element | Animation |
|---------|-----------|
| Modal overlay | Fade in/out |
| Centered modals | Zoom from 95% + slide from center |
| New guess card | `animate-card-enter` — translateY(-16px)→0 + opacity 0→1, 0.25s ease-out |
| Card expand from collapsed | `card-body-enter` — max-height 0→800px + opacity 0→1, 0.2s ease-out |
| Mobile title area | `transition-all duration-200` — collapses to h-0 when input focused |
| Mobile category/score rows | `max-h-0 opacity-0` → `max-h-16 opacity-100` on focus change |
| Suggestion tags | `transition-all duration-150`, `active:scale-95` press, `scale-105` selected |
| Buttons | `transition-colors` on hover |
| ChevronDown (folded/collapse) | `transition-transform` — rotates 180° |
| Win effect | Brief `invert` CSS class on `<html>` (200ms delay, 500ms duration) |
| Empty-state arrow | `animate-bounce-up` — translateY oscillation, 2s loop |
| Empty-state fade | `transition-opacity duration-300` — fades to opacity-0 when first guess arrives |
| Share button hide/show | `transition-all duration-300` — `translate-y-24` (hidden) or `translate-y-0` (shown) |
| HTP pulse dot | `animate-pulse bg-thermal-orange rounded-full` |
| Venn background orbs | SVG `<animate>` — slow positional drift (20–30s cycles, indefinite) |

---

## Responsive Breakpoints

| Breakpoint | Prefix | Key Changes |
|------------|--------|-------------|
| Default (< 640px) | — | 1-col grid, `text-4xl` title, `text-[10px]` HTP link, `w-48` input, bottom-sheet modals |
| sm (640px+) | `sm:` | `text-sm` category selector, `w-56` input |
| md (768px+) | `md:` | 2-col game grid, `text-6xl` title, `text-xs` HTP link, centered modals |
| lg (1024px+) | `lg:` | Container gets `p-8` padding |
| xl (1280px+) | `xl:` | 3-col game grid |

---

## Iconography

All icons from **Lucide React**, rendered small with monochrome charcoal:

| Icon | Component | Size | Usage |
|------|-----------|------|-------|
| Eye | `<Eye>` | `w-3 h-3` | Hint trigger on ALL cells |
| Check | `<Check>` | `w-2.5 h-2.5` | Hinted value badge |
| ChevronDown | `<ChevronDown>` | `w-3 h-3` | Folded section toggle |
| Share2 | `<Share2>` | `12px` | Share button (fixed bottom-right) |
| X | `<X>` | `20px` | Modal close button (Game Over) |
| X (inline SVG) | Custom `<svg>` | `20×20` | Modal close button (other modals) |

---

## Key Design Rules

1. **No rounded corners** — `--radius: 0px` globally. All elements are sharp rectangles.
2. **No soft shadows** — Only `shadow-hard` (6px) and `shadow-hard-sm` (4px) paper-cut shadows.
3. **Monospace by default** — Geist Mono for all text; Fraunces serif only for display headings and modal title banners.
4. **Invert on hover** — Buttons flip between outline and filled states on hover.
5. **Charcoal borders for interactive elements** — Cards, buttons, inputs use `border-charcoal`.
6. **Graphite borders for structural elements** — Dividers, section separators use `border-graphite`.
7. **Thermal color language** — Green = exact, Orange = hot, Amber-dashed = near, Gold = category bucket match, White = miss.
8. **Direction via text arrows** — ↑ = target higher, ↓ = target lower; arrow rendered larger than tier label.
9. **Uppercase everywhere** — Labels, buttons, headings, entity names are all uppercase.
10. **All modals are always centered** — No bottom-sheet variants on any screen size.
11. **Category-specific win/forfeit cards** — Elements gets `ElementCellCard` (periodic table aesthetic); Countries gets `CountryDetailCard` (passport aesthetic). Used in both GameOverModal and RevealAnswerModal.
12. **Proximity tier strip** — HowToPlayModal renders tiers as a horizontal scrollable strip (~10% → ~100×) with a dark-to-light gradient conveying "closer to further".
13. **Color legend always visible** — `ColorLegend` strip above the game grid; `opacity-70`, `border-b border-graphite`.
14. **Segmented category toggle** — `CategoryToggle` with charcoal-filled active state replaces `<select>` dropdown.
15. **Eye icon tooltip** — Desktop only: "Reveal" text badge appears above Eye icon on hover (`absolute bottom-full` tooltip).
