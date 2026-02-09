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
| `thermal-gold` | `#EAB308` | Category match / linked bucket match | Charcoal |
| `thermal-orange` | `#F97316` | Hot / very close | White |
| `thermal-amber` | `#F59E0B` | Warm / medium proximity | Charcoal |
| `thermal-teal` | `#14B8A6` | Cool / far | White |
| White | `#FFFFFF` | Miss / no match | Charcoal |

### GEO_DISTANCE Cell Colors (Distance from Target)

Applied to the virtual Distance field in Countries (Haversine km):

| Range | Color | Class | Text |
|-------|-------|-------|------|
| < 1,000 km (includes 0 km) | Green `#22C55E` | `bg-thermal-green` | White |
| < 3,000 km | Amber `#F59E0B` | `bg-geo-warm` | Charcoal |
| < 5,000 km | Yellow `#FACC15` | `bg-geo-yellow` | Charcoal |
| >= 5,000 km | White | `bg-white` | Charcoal |

### DISTANCE_GRADIENT Text Fields (Location Fields)

Applied to Continent, Subregion, Hemisphere text cells — binary coloring based on string match:

| Condition | Color | Class | Text |
|-----------|-------|-------|------|
| Exact text match | Green `#22C55E` | `bg-thermal-green` | White |
| No match | White | `bg-white` | Charcoal |

### Category Match Colors

| State | Color | Class | Text |
|-------|-------|-------|------|
| Exact | Green `#22C55E` | `bg-thermal-green` | White |
| Category matches | Gold `#EAB308` | `bg-cat-match` | Charcoal |
| Miss | White | `bg-white` | Charcoal |

### Standard Feedback Status Colors

| Status | Background | Additional Styles |
|--------|-----------|------------------|
| EXACT | `bg-thermal-green` | White text |
| HOT | `bg-thermal-orange` | White text |
| NEAR | `bg-amber-100` | Dashed border in `border-amber-400`, charcoal text |
| MISS | `bg-white` | Charcoal text |

### Venn Logo Palette

Used for the logo SVG and decorative background elements:

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
| **Geist Mono** | `'Geist Mono', monospace` | Default body text, data values, clue labels, buttons, input fields — everything except display headings. Set on `body` in CSS. |
| **Fraunces Variable** | `'Fraunces Variable', Georgia, serif` | Display headings only — the main "SCALAR" title, modal titles. Applied via the `font-serif-display` utility class. |

### Type Scale & Treatments

| Element | Size | Weight | Style |
|---------|------|--------|-------|
| Main title "SCALAR" | `text-4xl` (mobile), `text-6xl` (desktop) | `font-light` | Uppercase, `tracking-[0.12em]`, `font-serif-display` |
| Modal titles | `text-2xl` | `font-black` | Uppercase, `tracking-wider`, `font-serif-display`, white text on charcoal background |
| Section headings (HowToPlay) | `text-xs` | `font-black` | Uppercase, `tracking-widest`, with `border-b border-charcoal/20` underline |
| Cell labels | `text-[10px]` | Normal | Uppercase, `opacity-60`, `tracking-wider` |
| Cell values | `text-sm` | `font-bold` | Truncated with overflow |
| Guess card entity name | `text-base` | `font-bold` | Uppercase, truncated |
| Guess index `#03` | `text-sm` | Normal | `text-charcoal/60` |
| Input placeholder | `text-sm` | Normal | Uppercase |
| Button text | `text-sm` | `font-bold` | Uppercase, `tracking-wide` |
| Scoreboard labels | `text-xs` | Normal | Uppercase, `text-charcoal/50` |
| Scoreboard values | `text-base` | Normal | `tabular-nums` for consistent digit widths |
| "How to Play" link | `text-[10px]` (mobile), `text-xs` (desktop) | `font-bold` | Uppercase, `tracking-widest`, underline, `text-charcoal/40` -> `text-charcoal/70` on hover |
| "Reveal Answer" link | `text-[10px]` | `font-bold` | Uppercase, `tracking-widest`, underline, `text-charcoal/40` -> `text-charcoal/70` on hover |
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

**All corners are sharp.** `--radius: 0px` is set globally. There are no rounded corners anywhere in the design. All derived radii (`--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`) are 0 or negative (effectively 0).

### Border Treatments

| Purpose | Style |
|---------|-------|
| Structural dividers | `border-graphite` (1px, `#E2E8F0`) |
| Interactive/card borders | `border-charcoal` (1px, `#18181B`) |
| Internal cell dividers | 1px `bg-charcoal` gap (achieved via `gap-px bg-charcoal` on grid parent) |
| Direction: target is higher | Text arrow "↑" in secondary text (no thick border) |
| Direction: target is lower | Text arrow "↓" in secondary text (no thick border) |
| Header separator | `border-b-venn` — gradient underline (teal -> gold -> pink, fading at edges) |
| NEAR status | `border-dashed border-amber-400` |
| Category tab active | `border-venn-active` — gradient border image (teal -> gold -> pink) |

### Shadows

Only hard-edge "paper cut" shadows are used — no soft blurs.

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

### Outline Button (default state)
```
border border-charcoal
bg-transparent (or bg-paper-white)
text-charcoal
font-bold uppercase text-sm tracking-wide
```
**Hover:** `bg-charcoal text-paper-white`

### Filled Button (primary action)
```
bg-charcoal text-paper-white
border border-charcoal
font-bold uppercase text-sm tracking-wide
```
**Hover:** `bg-paper-white text-charcoal`

### Button Sizing
- Standard: `px-4 py-3`
- Compact (modals): `px-4 py-2.5`
- Icon buttons: `p-0.5`, with `opacity-40 hover:opacity-100`

### Category Selector
```
<select> element
text-xs (mobile) / text-sm (desktop)
font-bold uppercase tracking-wide
bg-transparent border border-charcoal
px-2 py-1
```

---

## Component Visual Designs

### Header Bar

A responsive bar spanning the full container width. Uses separate mobile and desktop layouts.

**Desktop (md+) — single row with three sections:**
```
┌─────────────────────────────────────────────────────────────┐
│ [Category ▼]    [____Type your guess..._____]    Moves 3 │ Hints ■■ │ HOW TO PLAY │
└─────────────────────────────────── gradient underline ───────┘
```

- **Left:** Category `<select>` dropdown (charcoal border, uppercase, monospace, `shrink-0`)
- **Center:** Game input (absolutely positioned at `left-1/2 -translate-x-1/2`)
- **Right:** Scoreboard + graphite divider (`h-4 w-px bg-graphite`) + "How to Play" link (`shrink-0`)

**Mobile (< md) — stacked centered rows:**
```
┌─────────────────────┐
│    [Category ▼]     │  ← Row 1: category dropdown
│  [_Type guess..._]  │  ← Row 2: input
│  Moves 3 │ ■■ │ HTP │  ← Row 3: score + how to play
└── gradient underline ─┘
```

- All rows: `flex flex-col gap-3 items-center`
- Category: `text-xs` (mobile), `text-sm` (desktop)

**Shared properties:**
- **Bottom border:** Venn gradient underline (`border-b-venn`) — subtle teal-gold-pink gradient fading at edges
- Font: All monospace (`font-mono`)
- Spacing: `mb-6`, `pb-4`
- Z-index: `relative z-30`

### Title / Logo Area

Positioned above the header bar, centered:

```
         ┌───────────────────┐
         │   (Venn diagram   │
         │    logo, 50%      │
         │    opacity)        │
         │                   │
         │     SCALAR        │  ← Fraunces serif, font-light
         └───────────────────┘
```

- Logo: `ScalarLogo` SVG at 160px, positioned `absolute`, `opacity-50`
- Title: `relative` on top, `text-4xl md:text-6xl`, Fraunces serif, `font-light`, `tracking-[0.12em]`, uppercase
- Container: `height: 120px`, `mb-1`

### Scoreboard

Inline with header, right-aligned:

```
Moves 3 │ Hints ■ ■ ■
```

- "Moves" label: `text-xs uppercase text-charcoal/50`
- Moves value: `text-base tabular-nums` (shows "∞" for forfeit)
- Divider: `h-4 w-px bg-graphite`
- "Hints" label: `text-xs uppercase text-charcoal/50`
- Credit indicators: 3 × `w-2.5 h-2.5` squares with `border border-charcoal`
  - Filled (credit available): `bg-charcoal`
  - Empty (credit used): `bg-transparent`

### Game Input

An underline-style input with a downward-opening tag cloud suggestion dropdown:

```
Type your guess...
─────────────────────    ← 2px bottom border only

        ◇                ← small rotated square "caret" pointing up
    ┌──────────────────┐
    │ BRAZIL  BELGIUM  │  ← tag cloud layout (flex-wrap)
    │ BHUTAN  BOLIVIA  │
    └──────────────────┘
```

**Input field:**
- Width: `w-48` (mobile), `w-56` (desktop)
- Style: `border-0 border-b-2 border-b-charcoal`, no box, no shadow, `bg-transparent`, `px-0`
- Text: `uppercase text-sm`, monospace
- Disabled state: `cursor-not-allowed opacity-50`, placeholder changes to "Solved" or "Revealed"

**Suggestion dropdown:**
- Opens below the input (`top-full`), with `mt-3` gap
- Has a small rotated square pointing up: `w-4 h-4 bg-paper-white border-l border-t border-charcoal rotate-45`
- Container: `bg-paper-white border border-charcoal p-3 shadow-hard-sm`
- Suggestions render as `flex-wrap gap-2` tag buttons
- Each tag: `px-3 py-1.5 border font-mono text-sm uppercase`
  - Default: `bg-white text-charcoal border-charcoal/30`
  - Hover: `border-charcoal bg-gray-50`
  - Selected: `bg-charcoal text-paper-white border-charcoal scale-105 shadow-md`
  - Press: `active:scale-95`

**No matches state:**
- Centered below input: `"No match found"` in `text-gray-400 italic font-bold text-sm`

### Guess Card

A data card representing a single guess. No rounded corners, no soft shadows.

```
┌──────────────────────────────────┐
│ BRAZIL                       #03 │  ← Header
├──────────────────────────────────┤
│ LOCATION                     👁 │  ← Merged: Hemisphere • Continent • Subregion
│ Southern • Americas • S. America │     (green text on matches, gray on misses)
├──────────┬───────────────────────┤
│ AREA     │ POPULATION    👁      │  ← Eye icon on ALL cells
│ 8.5M  ↑~25% │ 213M    ↓~50%    │     (split: value left, arrow+tier right)
├──────────┼───────────────────────┤
│ LANDLOCKD│ TIMEZONES            │
│ No       │ 4                    │
├──────────┴───────────────────────┤
│ GENRE                            │  ← Full-width list row
│ Drama, Action, Thriller          │     (green+bold matches, gray misses)
├──────────────────────────────────┤
│         ▼ More clues             │  ← Expandable folded section toggle
├──────────┬───────────────────────┤
│ GDP/CAP  │ ARMED FORCES         │  ← Folded attributes (when expanded)
│ $10.2k ↓~100% │ 334k  ↑~10%    │
└──────────┴───────────────────────┘
```

**Card container:**
- `border border-charcoal bg-paper-white`
- No shadow, no rounded corners

**Header:**
- `flex items-center justify-between px-3 py-2 border-b border-charcoal`
- Entity name: `font-bold text-base uppercase truncate`
- Index: `text-sm text-charcoal/60`, format `#03` (zero-padded)

**Attribute grid:**
- `grid grid-cols-2 gap-px bg-charcoal` — the charcoal gap creates thin 1px dividers between cells
- Each cell: `px-2 py-2 font-mono` with feedback color background

**Cell anatomy:**
```
┌────────────────────────┐
│ LABEL          [👁]    │  ← text-[10px] uppercase opacity-60
│ Value                  │  ← text-sm font-bold
│ [✓ TargetVal]          │  ← only if major-hinted (inverted badge)
└────────────────────────┘
```

- **Label:** `text-[10px] uppercase opacity-60 tracking-wider leading-tight`
- **Value:** `text-sm font-bold leading-tight mt-0.5 truncate`
- **HIGHER_LOWER split layout:** `flex justify-between items-baseline` — value on left (`text-base font-bold`), arrow+tier on right (`text-xs font-mono opacity-80 min-w-[4rem] text-right`)
- **Eye icon (hint trigger on ALL cells):** `absolute top-1 right-1 p-0.5 opacity-40 hover:opacity-100`, `w-3 h-3`
- **Hint badge:** `inline-flex items-center gap-0.5 mt-1 px-1 py-0.5 bg-charcoal text-paper-white text-[9px] uppercase tracking-wider` with a Check icon (`w-2.5 h-2.5`)

**Expandable folded section:**
- Toggle button: `w-full flex items-center justify-center gap-1 px-3 py-1.5 border-t border-charcoal`
  - Text: `text-[11px] uppercase tracking-wider text-charcoal/50 hover:text-charcoal`
  - Hover background: `hover:bg-charcoal/5`
  - ChevronDown icon: `w-3 h-3`, rotates 180 degrees when expanded
- Expanded grid: same `grid grid-cols-2 gap-px bg-charcoal border-t border-charcoal` as main grid

**Empty state (no guesses):**
- `text-center py-8 font-mono text-charcoal/40 text-sm`
- Text: "Make a guess to get started"

### Answer Section

Positioned below the game grid, separated by a top border:

```
─────────────────────────
         ANSWER
        ??????             ← while PLAYING
   Reveal Answer           ← underlined link

         ANSWER
       BRAZIL              ← when SOLVED/REVEALED (truncated to 12 chars)
```

- Container: `flex flex-col items-center justify-center py-6 border-t border-graphite mt-6`
- "ANSWER" label: `text-[10px] font-bold uppercase tracking-widest text-charcoal/60 mb-1`
- Answer text: `text-xl tracking-widest font-black text-charcoal`
- "Reveal Answer" link: same styling as "How to Play" link

### Modals (Shared Pattern)

All modals use **Radix Dialog** and share a common responsive pattern:

**Overlay:**
- `fixed inset-0 bg-black/50 backdrop-blur-sm z-50`
- Fade in/out animation

**Mobile (< 768px) — Bottom Sheet:**
- `bottom-0 left-0 right-0 w-full`
- `border-t border-charcoal pb-10` (extra bottom padding for safe area)
- Slides in from bottom, slides out to bottom

**Desktop (768px+) — Centered Modal:**
- `top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`
- `border border-charcoal` (full border instead of just top)
- `pb-6` (standard padding)
- Scale + slide animation (zoom 95% -> 100%)

**Common modal properties:**
- `bg-paper-white shadow-hard p-6`
- No rounded corners
- Sharp edges everywhere

#### Game Over Modal (`max-w-md`)

```
┌──────────────────────────────────────┐
│ ████████████████████████████████  ✕ │
│ ██    PUZZLE COMPLETE    ██████████ │  ← charcoal bg, white text, serif
│ ████████████████████████████████████│
│                                      │
│            [flag image]              │
│              BRAZIL                  │  ← text-2xl font-black uppercase
│                                      │
│ ┌──────────────────────────────────┐ │
│ │          3 Moves                 │ │  ← text-3xl font-black
│ └──────────────────────────────────┘ │
│                                      │
│  [ Share Result ]  [ Play Again ]    │
│    (outline btn)   (filled btn)      │
└──────────────────────────────────────┘
```

- Title: `w-full text-2xl font-black uppercase tracking-wider py-4 border border-charcoal bg-charcoal text-paper-white font-serif-display`
- Entity name: `text-2xl font-black uppercase tracking-wide`
- Moves display: `text-3xl font-black` + `text-lg font-bold` for "Moves" label, inside a `border border-charcoal/20 py-3` container
- Entity image (if present): `w-16 h-16 object-contain border border-charcoal/20`
- Buttons: `flex-1` side by side with `gap-4 pt-4`
- Close button: `absolute top-4 right-4 text-paper-white opacity-70 hover:opacity-100`

#### Reveal Answer Modal (`max-w-md`)

```
┌──────────────────────────────────────┐
│ ████████████████████████████████████│
│ ██   ANSWER REVEALED   ████████████│
│ ████████████████████████████████████│
│                                      │
│              BRAZIL                  │
│                                      │
│  Continent        Americas           │
│  ──────────────────────────          │
│  Subregion        South America      │  ← scrollable list (max-h-60)
│  ──────────────────────────          │
│  Area             8,516k             │
│  ...                                 │
│                                      │
│  [        New Game        ]          │
└──────────────────────────────────────┘
```

- Attribute list: `max-h-60 overflow-y-auto border border-charcoal/20`
- Each row: `flex justify-between items-center px-4 py-2.5 font-mono text-sm`
- Label: `font-bold uppercase text-charcoal/60 text-xs tracking-wide`
- Value: `font-bold text-charcoal`
- Row divider: `border-b border-charcoal/10`

#### How To Play Modal (`max-w-lg`)

```
┌──────────────────────────────────────┐
│ ████████████████████████████████  ✕ │
│ ██     HOW TO PLAY     ████████████│
│ ████████████████████████████████████│
│                                      │
│  GOAL                                │
│  ─────────────────────               │
│  Guess the hidden entity...          │
│                                      │
│  HOW IT WORKS                        │
│  ─────────────────────               │
│  1. Pick a category...               │
│                                      │
│  FEEDBACK COLORS                     │
│  ─────────────────────               │
│  [■] Exact — matched perfectly       │
│  [■] Hot — very close                │
│  [□] Near — right ballpark           │  ← dashed border
│  [■] Miss — far from target          │
│                                      │
│  DIRECTION INDICATORS                │
│  ─────────────────────               │
│  [▔] Top border — target is higher   │
│  [▁] Bottom border — target lower    │
│                                      │
│  [          Got It          ]        │
└──────────────────────────────────────┘
```

- Content: `space-y-5 text-sm text-charcoal font-mono`
- Section headings: `font-black uppercase text-xs tracking-widest mb-2 border-b border-charcoal/20 pb-1`
- Color swatches: `w-5 h-5 border border-charcoal/30` with respective feedback color class
- Max height: `max-h-[85vh] overflow-y-auto`

#### Major Hint Modal (`max-w-sm`)

```
┌──────────────────────────────────┐
│  REVEAL EXACT VALUE?             │  ← Fraunces serif title
│                                  │
│  Reveal the exact value for      │
│  Population? This will use       │
│  1 free hint credit (3 left).    │  ← or "+3 moves" if no credits
│                                  │
│  [ Cancel ]  [ Reveal (Free) ]   │  ← or "Reveal (+3)"
└──────────────────────────────────┘
```

- Always centered (no bottom-sheet variant)
- `w-[90vw] max-w-sm`
- Title: `text-lg font-black uppercase tracking-wide font-serif-display`
- Description: `font-mono text-sm text-charcoal/70 mb-6` — dynamic text based on credits available
- Buttons: `flex-1` pair with `gap-3`

### Footer

Positioned below the main container, centered:

```
Built by Samir Husain · Privacy Policy
```

- Container: `py-4 text-center font-mono flex items-center justify-center gap-2`
- Links: Same styling as "How to Play" / "Reveal Answer" — `text-[10px] text-charcoal/40 hover:text-charcoal/70 font-bold uppercase tracking-widest underline underline-offset-2`
- Separator: `text-charcoal/30 text-[10px]` middle dot (`·`)
- "Built by Samir Husain" links to personal website (external)
- "Privacy Policy" opens PrivacyPolicyModal

### Share Challenge Button

Fixed position bottom-right:

```
┌──────────┐
│ 📤 Share │  ← fixed bottom-4 right-4 z-50
└──────────┘
```

- Position: `fixed bottom-4 right-4 z-50`
- Style: `flex items-center gap-1.5 border border-charcoal bg-paper-white px-3 py-1.5`
- Text: `text-[10px] font-bold uppercase tracking-widest text-charcoal`
- Hover: `hover:bg-charcoal hover:text-paper-white transition-colors`
- Icon: Share2 from Lucide at 12px

### Privacy Policy Modal (`max-w-2xl`)

```
┌──────────────────────────────────────┐
│ ████████████████████████████████  ✕ │
│ ██    PRIVACY POLICY    █████████  │  ← charcoal bg, white text, serif
│ ████████████████████████████████████│
│                                      │
│  Scalar runs entirely in your        │
│  browser...                          │
│                                      │
│  INFORMATION WE COLLECT              │
│  ─────────────────────               │
│  Local Storage...                    │
│  Analytics (Vercel Analytics)...     │
│                                      │
│  INFORMATION WE DO NOT COLLECT       │
│  ─────────────────────               │
│  • Names, emails...                  │
│                                      │
│  [          Got It          ]        │
└──────────────────────────────────────┘
```

- Always centered (no bottom-sheet variant)
- `w-[95vw] max-w-2xl`
- Content: `space-y-6 text-sm text-charcoal font-mono`
- Section headings: same as HowToPlayModal — `font-black uppercase text-xs tracking-widest mb-3 border-b border-charcoal/20 pb-1`
- Sub-headings: `font-bold text-xs mb-1`
- Body text: `text-xs text-charcoal/70 leading-relaxed`
- External links: `underline underline-offset-2 hover:text-charcoal transition-colors`
- Close button: filled `bg-charcoal text-paper-white` with standard hover invert

### Venn Background

A full-viewport decorative SVG layer behind all content:

- `fixed inset-0 pointer-events-none overflow-hidden -z-10`
- ViewBox: `0 0 1440 900`, `preserveAspectRatio="xMidYMid slice"`
- **Primary Venn pair (top-left):** Two overlapping circles (teal + pink, r=260) with gold intersection glow (r=120). Circles animate horizontally over 25s.
- **Secondary Venn pair (bottom-right):** Two overlapping circles (pink + teal, r=220) with gold intersection glow (r=100). Circles animate vertically over 30s.
- **Floating accent orbs:** Scattered teal and pink circles (r=130–180) with very subtle animation (20–28s cycles).
- **Decorative outlines:** Three small Venn circle pairs in charcoal at 4% opacity — top-right, bottom-left, center-left.
- All gradients are extremely subtle (opacity 3–7%) to avoid visual distraction.

### Scalar Logo

An SVG Venn diagram composed of two overlapping circles:

- Left circle: Teal gradient (`#7DD3C8` -> `#14B8A6`)
- Right circle: Pink gradient (`#F9A8B8` -> `#EC6B5E`)
- Intersection (vesica piscis): Golden gradient (`#FBBF24` -> `#D4A017`) with a subtle bright center highlight (`#FDE68A` at 40% opacity, gaussian blur)
- Thin white rim on the vesica piscis edge (1.2px, 50% opacity)
- Default size: 120px wide, aspect ratio 200:120

---

## Animations & Transitions

| Element | Animation |
|---------|-----------|
| Modal overlay | Fade in/out |
| Bottom-sheet modals (mobile) | Slide in from bottom / slide out to bottom |
| Centered modals (desktop) | Zoom from 95% + slide from center |
| Suggestion tags | `transition-all duration-150`, `active:scale-95` on press, `scale-105` when selected |
| Buttons | `transition-colors` on hover |
| "How to Play" link | `transition-colors` |
| ChevronDown (folded toggle) | `transition-transform` (rotate 180 degrees) |
| Win effect | Brief `invert` CSS class on `<html>` (200ms delay, 500ms duration) |
| Venn background orbs | SVG `<animate>` — slow positional drift (20–30s cycles, indefinite) |
| Folded section toggle | Hover: `text-charcoal/50` -> `text-charcoal`, `bg-charcoal/5` |

---

## Responsive Breakpoints Summary

| Breakpoint | Prefix | Key Changes |
|------------|--------|-------------|
| Default (< 640px) | — | 1-col grid, `text-4xl` title, `text-[10px]` HTP link, `w-48` input, bottom-sheet modals |
| sm (640px+) | `sm:` | `text-sm` category selector, `w-56` input |
| md (768px+) | `md:` | 2-col game grid, `text-6xl` title, `text-xs` HTP link, centered modals |
| lg (1024px+) | `lg:` | Container gets `p-8` padding |
| xl (1280px+) | `xl:` | 3-col game grid |

---

## Iconography

All icons from **Lucide React**, rendered at small sizes with monochrome charcoal:

| Icon | Component | Size | Usage |
|------|-----------|------|-------|
| Eye | `<Eye>` | `w-3 h-3` | Hint trigger on ALL cells (reveal exact target value) |
| Check | `<Check>` | `w-2.5 h-2.5` | Major-hinted value badge |
| ChevronDown | `<ChevronDown>` | `w-3 h-3` | Folded section expand/collapse toggle |
| Share2 | `<Share2>` | `12px` | Share challenge button (fixed bottom-right) |
| X (inline SVG) | Custom SVG | `20x20` | Modal close buttons |

---

## Key Design Rules

1. **No rounded corners** — `--radius: 0px` globally. All elements are sharp rectangles.
2. **No soft shadows** — Only `shadow-hard` (6px) and `shadow-hard-sm` (4px) paper-cut shadows.
3. **Monospace by default** — Geist Mono for all text; Fraunces serif only for display headings.
4. **Invert on hover** — Buttons flip between outline and filled states on hover.
5. **Charcoal borders for interactive elements** — Cards, buttons, inputs use `border-charcoal`.
6. **Graphite borders for structural elements** — Dividers, section separators use `border-graphite`.
7. **Thermal color language** — Green = exact, Orange = hot, Amber = warm, Gold = category match, White = miss.
8. **Direction via text arrows** — ↑ = target higher, ↓ = target lower, shown in secondary text alongside tier.
9. **Uppercase everywhere** — Labels, buttons, headings, entity names are all uppercase.
10. **Bottom sheet on mobile, centered on desktop** — All major modals follow this dual-layout pattern.
