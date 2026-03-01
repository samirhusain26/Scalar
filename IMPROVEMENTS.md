# Scalar — Improvement Roadmap

Phases are ordered by complexity and dependency. Each phase is independently shippable. Items within a phase are grouped by concern and can be parallelized.

---

## Completed

> Items fully shipped and removed from their original phases.

- **Daily Challenge Mode** (Phase 4): Slot-based store (v14), Mulberry32 PRNG seeded by date+category, `ModeToggle` UI, daily/freeplay slots, day rollover handling.
- **Streak & Personal Best Tracking** (Phase 3): `DailyMeta` per category — `currentStreak`, `lastCompletedDate`, `bestMoves`. Displayed in `GameOverModal`.
- **Wordle-Style Emoji Grid Share** (Phase 2): `generateShareText()` in `dailyUtils.ts` — emoji grid (🟩🟧🟨⬜), >6 guess truncation, category-aware header.
- **Challenge URL: Score-to-Beat** (Phase 2): `encodeChallenge(cat, id, moves?)` encodes optional `m` field. `decodeChallenge` returns `challengerMoves`. Challenger banner in `App.tsx`: "Your friend solved this in N moves. Can you beat them?"
- **ShareCard + SharePopover** (Phase 2): `ShareCard.tsx` (off-screen 9:16 receipt, `html-to-image` PNG export) + `SharePopover.tsx` (Share Image / Copy Text buttons) in `GameOverModal`.
- **Category-Specific Share Messages** (Phase 1): `CATEGORY_ICONS` (🌍/⚗️) in `dailyUtils.ts`; `generateShareText()` uses category label + icon.
- **Input Refocus After Guess** (Phase 1): `GameInput.tsx` refocuses and scrolls to top after submission while PLAYING.
- **PWA Install Modal** (Phase 8): `PWAInstallModal.tsx` — intercepts `beforeinstallprompt`, shows on 2nd/3rd visit, platform-specific instructions (iOS vs Android).

---

## Phase 1 — Polish & Quick Wins

Small, self-contained improvements with no architecture changes. Each item is 1–4 hours.

### Visual Polish
- **Replace win invert effect** with a `canvas-confetti` burst (~3 kB). Remove the `document.documentElement.classList.add('invert')` hack in `App.tsx`. Target: confetti originates from the input/answer area.
- **Staggered guess card reveal**: Instead of all cells appearing at once, stagger cell fill-in left-to-right (~20 ms/cell) to build suspense. Mimics Wordle's letter-flip.
- **Input suggestion highlighting**: Bold/highlight the matched substring within each suggestion pill (e.g., typing "bra" shows **Bra**zil). Improves scan speed.

### Category Selector
- **Add icons to category toggle**: Globe (🌍) for Countries, Atom (⚗️) for Elements. (Icons are already in `dailyUtils.ts` as `CATEGORY_ICONS` — reuse there.)
- **Dropdown fallback for scale**: When there are more than 4 categories, switch the `CategoryToggle` from a segmented button group to a styled `<select>` or dropdown. Prevents the header from overflowing.

### Mobile UX
- **Larger touch targets in suggestion dropdown**: Increase pill minimum height to `2.5rem` for one-handed thumb use.

### Accessibility
- **Reduced motion support**: Add `@media (prefers-reduced-motion: reduce)` to suppress `animate-card-enter`, `animate-bounce-up`, and `card-body-enter` in `index.css`.
- **ARIA live region for guesses**: After a guess, announce: "Guess submitted: Brazil. 3 fields exact, 7 misses." Add an `aria-live="polite"` region in `App.tsx`.
- **Keyboard navigation for cards**: `Tab` to cycle expandable sections; `Space`/`Enter` on hint eye buttons to trigger `MajorHintModal`.
- **Focus management on modal close**: When `GameOverModal` closes via Play Again, return focus to the game input.

### Performance
- **Preload fonts**: Add `<link rel="preload">` tags in `index.html` for Geist Mono and Fraunces Variable to eliminate FOIT (Flash of Invisible Text).

---

## Phase 2 — Sharing & Social Layer

### Countdown Timer (Daily Mode)
- After solving/forfeiting a daily puzzle, show a countdown timer to the next daily reset (midnight local time).
- Render in `GameOverModal` / `RevealAnswerModal` footer or near the "Try Free Play" button.

### Open Graph Image Generation
`@vercel/og` is already installed. Add a Vercel Edge Function at `/api/og?challenge=...` that:
- Decodes the challenge hash
- Renders a React-based thermal-color OG card (category, moves, a redacted grid)

Dramatically improves link unfurling on iMessage, Twitter, Slack. (Meta tags in `index.html` exist; the `/api/og` endpoint needs to be created.)

---

## Phase 3 — Stats & Personal Records

All data stored in `localStorage`. No backend required.

### Stats Modal
- Add a "📊" icon button in the header (alongside the `?` button).
- Stats displayed per category:
  - Games Played, Win Rate %
  - Average Moves, Best Score (fewest ever) — `DailyMeta.bestMoves` already exists
  - Current Streak / Max Streak — `DailyMeta.currentStreak` already exists
  - Hints Used (total + avg/game)
  - Guess Distribution bar chart (1 move, 2 moves, 3 moves…) — like Wordle's histogram
- `StatsModal` is a centered Radix Dialog following the existing modal design system.
- **Note**: `DailyMeta` already tracks `currentStreak` and `bestMoves`; add `gamesPlayed`, `totalMoves`, `hintsUsed` fields to support full stats display.

---

## Phase 4 — Difficulty Modes & Settings

### Settings Modal
- Create a `SettingsModal` (gear icon in header) as a Radix Dialog.
- Houses: Difficulty selector, Dark Mode toggle, Reset Local Data (danger button).
- Dark mode: add `[data-theme="dark"]` overrides in `index.css` (`--paper-white: #18181B; --charcoal: #FAFAF9`). Toggle via `localStorage` preference + `prefers-color-scheme` auto-detection.

### Difficulty State
- Add `difficulty: 'NOVICE' | 'SCHOLAR' | 'GRANDMASTER'` to `GameState` in `gameStore.ts`.
- Persisted in `localStorage` with game state. Changing difficulty triggers a game reset.

### Novice Mode
- Widen HOT distance threshold: < 2,000 km (vs. current 1,000 km).
- Widen HOT numeric threshold: broader percentage range.
- Start game with 1 random attribute already revealed (free, no credit cost).
- Increase starting Hint Credits to 5.

### Scholar Mode (Default)
- Existing thresholds and 3 Hint Credits. No changes.

### Grandmaster Mode
- Starting Hint Credits: 0.
- Hint move cost: 5 moves (vs. current 3).
- Strict validation: prevent submitting a guess that contradicts a previously EXACT feedback (e.g., if Continent=EXACT Asia, can't guess a European country).

---

## Phase 5 — New Content & Categories

The architecture auto-discovers categories from `gameData.json`. New categories only require a schema CSV + data CSV + `python fetch_data.py`. No component changes needed unless special rendering is required.

### Country Flags
- Add flag emoji or `flagcdn.com` image URLs to `countries_enriched.csv` (or derive from ISO code at render time).
- Show flags in: suggestion pills, `CountryDetailCard`, `GameOverModal` header.

### Entity Difficulty Scoring
- Pre-compute a "distinctiveness score" per entity in `fetch_data.py` based on how unusual its attribute values are relative to the rest of the category.
- Store as a `difficulty_score` column in the enriched CSVs.
- Use for: difficulty mode filtering, daily challenge difficulty rotation (easy Mon → hard Fri).

### US States Category
- **Attributes**: Region, Division, Population, Area, Neighbors (border count), Statehood Year, Capital City, # House Representatives, GDP.
- **Virtual field**: Distance from target state capital (GEO_DISTANCE).
- ~50 entities — good for introductory / casual play.
- Add `states_schema_config.csv` + `states_enriched.csv`, add to `CATEGORY_MAP`.

### World Capitals / Cities Category
- **Attributes**: Country, Continent, Population, Elevation, Founded, UNESCO Sites, Distance from target, 1st Letter.
- Add `cities_schema_config.csv` + `cities_enriched.csv`.

### Future Categories (Data Research Required)
- **Companies**: Market Cap, CEO, Founded, HQ Country, Industry.
- **Athletes**: Sport, Team/Country, Age, Career Stats.
- Data sources need to be identified and scraped before a schema can be defined.

### Data Pipeline Improvements
- **Validation step in `fetch_data.py`**: Flag missing required fields (> 20% N/A rate), validate coordinate ranges, check unique IDs. Output a validation report.
- **Schema CSV validation script**: Pre-run check that `logicType`, `displayFormat`, `dataType` are valid enum values, and `linkedCategoryCol` references exist.

---

## Phase 6 — Engagement & Visual Depth

Higher-complexity features that add "juice" and replayability.

### "You're Getting Warmer" Aggregate Signal
After each guess, show a small aggregate row below the guess count: how many cells improved / worsened / stayed the same vs. the previous guess. Gives a meta-signal without revealing specific values.

### Collection / Archive ("Pokedex Mode")
- Create a `Collection` view accessible from the main nav.
- Design a compact `EntityCard` per category that reveals all attributes (unlocked on SOLVED).
- Track unlocked entities per category in `localStorage` (`scalar-collection`).
- Show progress: "Countries: 15 / 196 Collected" per category.

### Map Visualization (Countries)
- Integrate `react-simple-maps` to show a world map during gameplay.
- Highlight guessed countries with their feedback color (green/orange/amber/white).
- Display alongside or below the guess grid.

### Intel Dossier / Fun Facts
- Add a `fact_text` column to enriched CSVs for each category (one interesting sentence per entity).
- Add an "Intel" button (folder icon) that reveals a styled slide-out card with the fun fact.
- Costs 1 credit or +3 moves (same as existing hint system).

### Receipt Printer Animation
- Animate the `GameOverModal` body: results slide in from the top like a thermal receipt printing.
- CSS keyframe animation, respects `prefers-reduced-motion`.

---

## Phase 7 — Developer Experience & Infrastructure

Technical improvements that make the codebase more maintainable and performant. Can be parallelized with other phases.

### Testing
- Add `vitest` + `@vitest/ui` (`npm install -D vitest @vitest/ui`).
- Test coverage targets in `gameLogic.ts`:
  - `getFeedback()` for each `logicType`
  - `handleHigherLower()` edge cases (negative numbers, N/A, year fields)
  - `checkWinCondition()` true/false cases
  - `formatPercentageDiffTier()` boundary values
  - `haversineDistance()` known city pairs

### PWA: Offline Support
- The install modal (`PWAInstallModal.tsx`) is done. Complete offline support:
  - Add `vite-plugin-pwa` to generate service worker and `manifest.json` automatically.
  - Cache app shell and `gameData.json` for instant repeat loads.
  - Add icons (192×192, 512×512) to `public/`.

### TypeScript Strictness
- Replace `Entity = { [key: string]: string | number | boolean }` with a generic `Entity<T>` or discriminated union per category. Catches schema mismatches at compile time.

### ESLint
- Add `eslint-plugin-jsx-a11y` for accessibility linting.
- Add a rule banning direct `localStorage` access outside `gameStore.ts` and `App.tsx`.

### Performance
- **Lazy-load game data by category**: Split `gameData.json` into `gameData-countries.json`, `gameData-elements.json`, etc. Load each lazily when the category is first selected. Reduces initial bundle size.

### Maintenance
- **Changelog**: Add `CHANGELOG.md` and correlate `STORE_VERSION` bumps with meaningful schema changes. Helps debug "why did my state get cleared?"
- **Storybook** (optional): Develop `GuessCard`, `ElementCellCard`, `CountryDetailCard`, and modal components in isolation. Useful for QA'ing new categories.

---

## Phase 8 — Account System (Supabase)

Largest scope change. Requires a backend. Best tackled after Phases 1–6 are stable.

### Backend Setup
- Initialize Supabase project (Auth + PostgreSQL).
- Create tables:
  - `profiles` (id, email, username, avatar_url)
  - `game_stats` (user_id, category, total_games, wins, current_streak, max_streak, avg_moves)
  - `game_history` (user_id, category, entity_id, moves, hints_used, timestamp)

### Frontend Authentication
- Install `@supabase/supabase-js`.
- Create `useAuth` hook for session management.
- Build `LoginModal` (email/password + OAuth — Google, Apple).
- Update header: show "Login" button for guests, user avatar for logged-in users.

### Data Synchronization
- On login: merge `localStorage` stats with Supabase data. Conflict resolution: keep the higher value (wins, streaks) or most recent (game history).
- Add Zustand middleware that syncs game state changes to Supabase when a session is active.
- Guests continue to use localStorage-only — no forced login.

---

## Phase 9 — Mobile App (Exploratory)

Not a committed phase — revisit when the web product is stable. Capacitor wraps the existing web app for native iOS/Android distribution.

### Capacitor Setup
- Install Capacitor and add iOS platform.
- Update CSS to handle safe areas: `padding-top: env(safe-area-inset-top)`.

### Monetization (AdMob)
- Sign up for Google AdMob.
- Install AdMob Capacitor plugin.
- Create `AdManager` utility.
- Wire "Watch Ad for a Free Hint" option into `MajorHintModal` (alongside or replacing the credit system on native).
