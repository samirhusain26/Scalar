# Scalar — Share Card Design Reference

## Overview

The share image is generated client-side via `html-to-image` (captures an off-screen React component as a 2× PNG), then distributed via the Web Share API on mobile or downloaded on desktop. The component is `src/components/ShareCard.tsx` — rendered at `position: fixed; left: -9999px` and never visible to the user.

**Target format:** Instagram Stories (9:16). Instagram obscures the top and bottom ~20% of a story with the profile handle and reply box, so all critical game data is anchored to the center safe zone.

---

## Canvas & Card Dimensions

| Property | Value |
|----------|-------|
| Canvas (wrapper) | `390 × 693px` |
| Export resolution | `780 × 1386px` (pixelRatio: 2) |
| Card width | `330px` |
| Card height | Content-driven |
| Card shadow | `6px 6px 0px #18181B` (hard-edge, no blur) |
| Canvas background | `#E2E8F0` (graphite) |
| Card background | `#FAFAF9` (paper-white) |

---

## Design System

### Aesthetic
**Thermal E-Paper / Scientific Journal.** Structured like a physical instrument printout — sharp borders, deliberate whitespace, monospaced data, serif display headings. Zero decoration that isn't load-bearing information.

### Color Tokens
| Token | Hex | Usage |
|-------|-----|-------|
| `paper-white` | `#FAFAF9` | Card background, MISS cell fill |
| `charcoal` | `#18181B` | Text, borders, header fill, hard shadow |
| `graphite` | `#E2E8F0` | Canvas background, dividers, vertical stat separator |
| `green` | `#22C55E` | EXACT cells, streak number + flame, streak label |
| `orange` | `#F97316` | HOT cells |
| `amber` | `#F59E0B` | NEAR cells (dashed border) |
| `missBorder` | `#A1A1AA` | MISS cell border (softer than charcoal) |
| `emptyBorder` | `#C8D0DC` | Empty padding row border |

### Typography
| Role | Font | Size | Weight | Treatment |
|------|------|------|--------|-----------|
| Card title (`SCALAR DAILY #N`) | Fraunces Variable (serif) | 20px | 900 | Uppercase, `0.08em` tracking |
| Subtitle | Geist Mono | 10px | 400 | Uppercase, `0.08em` tracking, 55% opacity |
| Stat labels (`TOTAL MOVES`, `STREAK`) | Geist Mono | 8px | 400 | Uppercase, `0.18em` tracking, 40–70% opacity |
| Stat values (move count, streak) | Geist Mono | 42px | 700 | Charcoal or green |
| Column abbreviations | Geist Mono | 6px | 400 | Uppercase, 35% opacity |
| Footer URL | Geist Mono | 11px | 700 | Uppercase, 40% opacity |

**Rule:** No emoji anywhere. System emoji fonts are unreliable in `html-to-image` across OS/browser combinations. Use inline SVG paths for all iconography.

---

## Card Structure

```
┌──────────────────────────────────────┐  ← Graphite canvas #E2E8F0
│                                      │
│   ┌──────────────────────────────┐   │  ← Paper-white card, 2px charcoal border
│   │  SCALAR DAILY #42            │   │  ← Charcoal header, Fraunces 900
│   │  The Secret Country   [SVG]  │   │  ← Subtitle + tone-on-tone decoration
│   ├──────────────────┬───────────┤   │  ← 1px graphite border
│   │  TOTAL MOVES     │  STREAK   │   │  ← Labels: 8px Geist Mono, 40-70% opacity
│   │  56              │  3  [▲]   │   │  ← Values: 42px bold; streak = green + flame SVG
│   │                  │           │   │  ← 1px graphite vertical divider
│   ├──────────────────┴───────────┤   │
│   │  LOC  DST  ARA  POP  LND ... │   │  ← 3-letter headers, 6px, 35% opacity
│   │  ■    ■    □    ■    ■   ...  │   │  ← EXACT (green) / HOT (orange) squares
│   │  ■    □    ■    □    ■   ...  │   │
│   │  ·    ·    ·                  │   │  ← Truncation row (>6 guesses)
│   │  ■    ■    ■    ■    ■   ...  │   │  ← Last (winning) row
│   │  --   --   --   --   --  ...  │   │  ← Empty padding rows (dashed)
│   ├ ─  ─  ─  ─  ─  ─  ─  ─  ─  ─┤   │  ← Dashed charcoal divider
│   │          scalargame.com       │   │  ← 11px Geist Mono, 40% opacity
│   └──────────────────────────────┘   │
│                                      │
└──────────────────────────────────────┘
  390px wide, 693px tall (9:16)
```

---

## Section Details

### Header
- Full-width, `charcoal` background fill
- Title: `SCALAR DAILY #N` or `SCALAR FREEPLAY` — Fraunces 20px/900, paper-white, uppercase
- Subtitle: `The Secret Country` (daily) or `Target: NAME` (freeplay) — Geist Mono 10px, paper-white 55% opacity
- **Decoration:** tone-on-tone SVG (globe for countries, atom for elements), `position: absolute` top-right, `#2D2D30` fill/stroke, bleeds off the corner

### Hero Stats Row
Two equal columns separated by a `1px` graphite vertical divider. Grid layout: `1fr 1px 1fr`.

| Column | Label | Value |
|--------|-------|-------|
| Left | `TOTAL MOVES` | Move count, 42px charcoal |
| Right (streak > 0) | `STREAK` in green | Streak number in green + inline flame SVG |
| Right (no streak) | `GUESSES` | Number of guesses submitted, charcoal |

The flame is a `18×18px` inline SVG path (`fill: #22C55E`), bottom-aligned beside the number via `alignItems: 'flex-end'`.

### Guess Grid
- Minimum 6 visual rows always rendered (padded with dashed empty squares)
- If guesses > 6: show first 3 rows + `· · ·` dots row + final (winning) row
- Each square: `15×15px`, `3px` gap
- Column headers: 3-letter abbreviations, center-aligned above each column

**Square styles:**
| Status | Background | Border |
|--------|-----------|--------|
| EXACT | `#22C55E` | `1px solid #22C55E` |
| HOT | `#F97316` | `1px solid #F97316` |
| NEAR | transparent | `1.5px dashed #F59E0B` |
| MISS | `#FAFAF9` | `1px solid #A1A1AA` |
| Empty | transparent | `1px dashed #C8D0DC` |

**Location merge:** Continent + Subregion + Hemisphere collapse into a single `LOC` square per row, colored by the combined status from `getLocationStatus()`.

### Footer
- `1px dashed charcoal` separator (15% opacity) mimics a receipt tear line
- `scalargame.com` centered, Geist Mono 11px bold, 40% opacity

---

## Column Abbreviations

| Abbrev | Field | Category |
|--------|-------|----------|
| `LOC` | Location (merged: continent + subregion + hemisphere) | Countries |
| `DST` | Distance from target | Countries |
| `ARA` | Area | Countries |
| `POP` | Population | Countries |
| `LND` | Landlocked | Countries |
| `GOV` | Government type | Countries |
| `BDR` | Border country count | Countries |
| `TMZ` | Timezones | Countries |
| `ABC` | First letter (A–Z) | Countries |
| `NUM` | Atomic number | Elements |
| `GRP` | Group | Elements |
| `PER` | Period | Elements |
| `PHS` | Phase (STP) | Elements |
| `FAM` | Element family | Elements |
| `BLK` | Block (s/p/d/f) | Elements |
| `RAD` | Radioactive | Elements |
| `SYM` | Symbol matches name | Elements |

---

## Technical Constraints (html-to-image)

| Constraint | Rule |
|------------|------|
| **Styles** | All inline — Tailwind classes and CSS variables are not captured |
| **Emoji** | None — system emoji fonts render inconsistently; use inline SVG paths |
| **External images** | Not supported — remote URLs won't load in time |
| **Web fonts** | Reference by exact family name string; fonts must already be loaded by the page (Geist Mono and Fraunces are loaded via `@fontsource` in `main.tsx`) |
| **CSS Grid** | Supported — use `gridTemplateColumns` inline |
| **Opacity** | Use numeric `opacity` property directly, not hex alpha suffixes |

---

## Modes

| Mode | Title | Subtitle | Right stat column | URL |
|------|-------|----------|-------------------|-----|
| Daily | `SCALAR DAILY #N` | `The Secret Country/Element` | Streak (if > 0), else Guesses | `scalargame.com` |
| Freeplay | `SCALAR FREEPLAY` | `Target: NAME` | Guesses | Challenge URL with moves encoded |
