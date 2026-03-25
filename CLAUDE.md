# Scalar - Project Context

> **Maintenance rule**: When making significant changes (new files, new dependencies, architecture changes, new features), update this file to reflect those changes before committing.

## What Is This Project?
Scalar is a client-side deductive logic guessing game (similar to Wordle but with numerical attributes). Players guess entities (countries, chemical elements) and receive feedback via multiple logic systems — directional arrows, proximity tiers, geographic distance, category matching, and set intersection — to deduce the target. Features a "Total Moves" scoring system where players try to minimize their move count.

## Repository Layout
```
Scalar/
├── CLAUDE.md                        # THIS FILE
├── GAMEPLAY.md                      # Detailed gameplay logic & scoring documentation
├── STYLE_GUIDE.md                   # Visual design system & component specifications
├── fetch_data.py                    # Python: CSV files -> gameData.json
├── data/                            # Source CSVs (schema + entity data per category)
└── src/
    ├── main.tsx                     # Entry point
    ├── App.tsx                      # Root component: header, category/mode selectors, grid, input, modals
    ├── index.css                    # Tailwind v4 config + CSS custom properties + custom utilities
    ├── types.ts                     # All shared types
    ├── assets/data/
    │   ├── gameData.json            # Auto-generated game data (via fetch_data.py)
    │   └── countries-110m.json      # World TopoJSON for map visualization
    ├── store/
    │   └── gameStore.ts             # Zustand store: slot-based architecture, localStorage persistence (version 15)
    ├── utils/
    │   ├── gameLogic.ts             # Pure functions: getFeedback, checkWinCondition
    │   ├── feedbackColors.ts        # Color helpers: getCellColor, getStandardStatusClass, etc.
    │   ├── formatters.ts            # Number/distance/tier formatting
    │   ├── geo.ts                   # haversineDistance()
    │   ├── schemaParser.ts          # getDisplayColumns(schema, difficulty?, category?)
    │   ├── challengeUtils.ts        # Base64 challenge URL encoding/decoding
    │   ├── dailyUtils.ts            # Daily puzzle selection (Mulberry32 PRNG), share text generation
    │   ├── difficultyConfig.ts      # DIFFICULTY_CONFIG, DEFAULT_DIFFICULTY
    │   ├── changelog.ts             # RELEASES array, WHATS_NEW_VERSION
    │   ├── tutorialConfig.ts        # 6-step tutorial config
    │   ├── analytics.ts             # Vercel Analytics event wrapper
    │   ├── cn.ts                    # clsx + tailwind-merge
    │   └── countryCodeMap.ts        # M49 → ISO Alpha-3 mapping
    └── components/
        ├── ui/                      # Shadcn/UI primitives
        ├── CategoryToggle.tsx       # Category selection (countries/elements)
        ├── ModeToggle.tsx           # Daily/freeplay toggle
        ├── DifficultyDropdown.tsx   # Novice/Scholar/Prodigy selector
        ├── ColorLegend.tsx          # Exact/Hot/Near/Miss legend strip
        ├── GameGrid.tsx             # Responsive card grid with collapse management
        ├── GuessCard.tsx            # Individual guess card with feedback rendering
        ├── GameInput.tsx            # Autocomplete input with tag cloud suggestions
        ├── GameOverModal.tsx        # Win modal with entity card + share buttons
        ├── HowToPlayModal.tsx       # Instructions modal (auto-opens first visit)
        ├── MajorHintModal.tsx       # Hint confirmation dialog
        ├── WhatsNewModal.tsx        # Changelog modal for returning users
        ├── RevealAnswerModal.tsx    # Forfeit/reveal modal
        ├── TutorialOverlay.tsx      # First-time spotlight tutorial
        ├── Scoreboard.tsx           # Moves count + credit squares
        ├── ShareCard.tsx            # Hidden off-screen card for html-to-image capture
        ├── CountryDetailCard.tsx    # Passport-style country card (win/reveal)
        ├── ElementCellCard.tsx      # Periodic table cell card (win/reveal)
        ├── WorldMapView.tsx         # d3-geo SVG world map
        ├── PeriodicTableView.tsx    # CSS Grid periodic table
        └── VisualizationModal.tsx   # Map/table modal with ad placeholder gate
```

## Tech Stack
- **React 19** + **TypeScript ~5.9** (strict mode)
- **Vite 7** — `npm run dev` / `npm run build`
- **Tailwind CSS v4** — uses `@theme inline` in CSS, NOT `tailwind.config.js`
- **Zustand 5** — state management with localStorage persistence
- **Shadcn/UI** (Radix UI) for base components, **Lucide React** for icons
- **d3-geo** + **topojson-client** for world map
- **html-to-image** for share card capture
- **Vercel Analytics** for privacy-respecting usage tracking
- Fonts: **Fraunces Variable** (serif headings), **Geist Mono** (body/data)

## Key Commands
```bash
npm run dev       # Vite dev server at localhost:5173
npm run build     # tsc -b && vite build -> dist/
npm run lint      # ESLint v9 flat config
python fetch_data.py  # CSV files -> gameData.json
```

## Architecture Pattern
1. **Types** (`types.ts`) — All shared interfaces/types
2. **Pure Logic** (`gameLogic.ts`) — Game mechanics, NO state mutation
3. **State** (`gameStore.ts`) — Zustand store calls pure functions, updates state
4. **Components** — Consume state via `useGameStore`, render UI

**Data flow**: User action → Component dispatches store action → Store calls pure function → Store updates state → Components re-render → localStorage persisted automatically

## Type System (Key Types)

### LogicType (how feedback is computed per field)
| LogicType | Purpose |
|-----------|---------|
| `EXACT_MATCH` | Binary exact equality |
| `CATEGORY_MATCH` | String match, optionally with distance gradient coloring |
| `HIGHER_LOWER` | Numeric comparison with direction + percentage diff |
| `GEO_DISTANCE` | Haversine distance between coordinates |
| `SET_INTERSECTION` | Intersection of comma-separated lists |
| `TARGET` | Entity name (identification only) |
| `NONE` | Support/hidden column |

### UIColorLogic
| Logic | Coloring |
|-------|----------|
| `DISTANCE_GRADIENT` | Green if exact text match, white if miss |
| `CATEGORY_MATCH` | Green/gold/white |
| `STANDARD` | Thermal EXACT/HOT/NEAR/MISS colors |
| `NONE` | No special coloring |

### Key Interfaces
- **SchemaField**: `attributeKey`, `displayLabel`, `dataType`, `logicType`, `displayFormat`, `isFolded`, `isVirtual`, `linkedCategoryCol?`, `uiColorLogic?`
- **Feedback**: `direction`, `status`, `value`, `displayValue?`, `distanceKm?`, `percentageDiff?`, `categoryMatch?`, `matchedItems?`
- **DisplayFormat**: `HIDDEN`, `TEXT`, `DISTANCE`, `PERCENTAGE_DIFF`, `RELATIVE_PERCENTAGE`, `NUMBER`, `CURRENCY`, `LIST`, `ALPHA_POSITION`

## Store (gameStore.ts)

**Slot-based architecture** — state keyed by `(mode, category)` pairs. Flat top-level fields are a projection of the active slot for backward compat.

**Persisted state**: `activeCategory`, `activeMode`, `difficulty` (global), `daily` slots, `freeplay` slots, `dailyMeta` (streak tracking)

**Flat projection** (synced via `syncFlat()`): `targetEntity`, `guesses`, `gameStatus`, `moves`, `credits`, `majorHintAttributes`

**Key actions**: `setActiveMode`, `setActiveCategory`, `setDifficulty`, `initializeApp`, `submitGuess`, `revealMajorHint`, `revealAnswer`, `resetGame`, `startChallengeGame`

**Internal helpers**: `makeDefaultSlot`, `syncFlat`, `writeSlot`, `getOrInitDailySlot`, `getOrInitFreeplaySlot`, `_updateDailyStreak`, `yesterdayFrom`

Persisted to localStorage under `scalar-game-storage` (**version 15**).

## Game Logic (gameLogic.ts)

Dispatch pattern based on `logicType`: `getFeedback(target, guess, schema)` iterates schema fields, routing to `handleExactMatch`, `handleCategoryMatch`, `handleHigherLower`, `handleGeoDistance`, or `handleSetIntersection`.

**Feedback thresholds**:
- GEO_DISTANCE: EXACT (0km), HOT (<1000km), NEAR (<3000km), MISS (≥3000km)
- SET_INTERSECTION: EXACT (1.0), HOT (>0.5), NEAR (>0), MISS (0)
- HIGHER_LOWER: Symmetric percentage diff (max/min − 1)×100; status from `linkedCategoryCol`
- Percentage tiers: ~10% → ~25% → ~50% → ~2× → ~5× → ~10× → ~50× → ~100×
- Year diff tiers: ~5 yrs → ~15 yrs → ~30 yrs → 30+ yrs

## Scoring & Difficulty

**Scoring**: +1 move per guess. Hints: free if credits > 0 (consumes 1), else +3 moves. Forfeit: moves unchanged.

| Difficulty | Credits | Suggestions | Hidden Columns |
|-----------|---------|-------------|----------------|
| Novice | 5 | 12 | none |
| Scholar (default) | 3 | 6 | none |
| Prodigy | 0 | 0 | countries: govt_type, borders, first_letter, timezones; elements: AtomicNumber, StandardState |

Locked once `moves > 0`. Config in `difficultyConfig.ts`.

## Design System
- **"Thermal E-Paper / Scientific Journal"** aesthetic
- Background: `#FAFAF9` (paper-white), Foreground: `#18181B` (charcoal), Borders: `#E2E8F0` (graphite)
- **Sharp corners** (`--radius: 0px`), thin 1px borders, hard-edge shadows (no blurs)
- Thermal feedback: EXACT=green (#22C55E), HOT=orange (#F97316), NEAR=amber-dashed, MISS=white
- GEO_DISTANCE colors: green (<1000km) → amber (<3000km) → yellow (<5000km) → white
- Typography: Fraunces serif (`font-serif-display`) for headings, Geist Mono for everything else
- Tailwind tokens: `paper-white`, `charcoal`, `graphite`, `thermal-green`, `thermal-orange`
- Additional colors (`@utility` classes): `bg-geo-warm`, `bg-geo-yellow`, `bg-cat-match`

## Important Gotchas
- **Store version is 15** — bumping triggers migration that clears stale localStorage
- **Tailwind v4**: Uses `@theme inline` in CSS, NOT `tailwind.config.js`
- **No test framework** configured — `gameLogic.ts` pure functions are best candidates
- **localStorage keys**: `scalar-game-storage`, `scalar-htp-seen`, `scalar-tutorial-seen`, `scalar-whats-new-seen`
- **Difficulty is global** (not per-slot), locked mid-game
- **Game status flow**: PLAYING → SOLVED (win) or PLAYING → REVEALED (forfeit)
- `linkedCategoryCol` fields (NONE/HIDDEN) drive HIGHER_LOWER status coloring
- Virtual fields (`isVirtual: true`) like `distance_km` computed at feedback time
- **All hints use `revealMajorHint`** — no `revealColumn` or `revealFoldedAttribute` actions
- **Neither active category has folded fields** currently
- `revealAnswer()` does NOT modify moves; does NOT update `dailyMeta` (streak stalls, not broken)
- `resetGame()` is a **no-op in daily mode**
- **Daily modal dismissal**: Uses `dailyGameOverDismissed` / `dailyRevealDismissed` session state in App.tsx
- **Tutorial always runs in freeplay** to avoid polluting daily slot
- **Day rollover**: Handled in `onRehydrateStorage` → `initializeApp()` synchronously before first render
- **Daily entity**: Mulberry32 PRNG seeded from `hashString(dateString + ':' + category)`, entities sorted alphabetically for stability
- **Puzzle numbering**: Epoch = 2026-02-25, Puzzle #1 = 2026-02-26
- **Challenge URLs**: `encodeChallenge(cat, id, moves?)` → Base64 `{c, i, m?}` JSON. `m` optional for challenger score.
- `credentials.json` is gitignored (legacy Google Sheets access)

## Common Task Patterns

### Adding a new category
1. Create `data/{category}_schema_config.csv` + `data/{category}_enriched.csv`
2. Add to `CATEGORY_MAP` in `fetch_data.py`, run `python fetch_data.py`
3. UI auto-discovers — optionally add a category-specific win card to GameOverModal

### Adding a new logic type
1. Add to `LogicType` union in `types.ts`
2. Create handler in `gameLogic.ts`, add case to `getFeedback()`
3. Update `feedbackColors.ts` if new coloring needed
4. Update `GuessCard.tsx` if new cell rendering needed

### Shipping a major update (What's New modal)
1. Add a new `Release` object at the **top** of `RELEASES` array in `src/utils/changelog.ts`:
   ```ts
   { version: 'v1.X', date: 'YYYY-MM-DD', sections: [{ label: 'New Features', items: [{ text: '...', tag: 'new' }] }] }
   ```
2. `WHATS_NEW_VERSION` auto-derives from `RELEASES[0].date` — no other files need updating.
3. Tags: `new` = green dot, `fix` = orange dot, `improvement` = gray dot.
