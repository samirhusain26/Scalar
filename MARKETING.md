# Scalar — Marketing Reference Document

> Use this document to draft Reddit posts, social copy, and promotional material. It is a plain-language summary of the game for marketing purposes, not a technical guide.

---

## Elevator Pitches

### Ultra-short (tweet / title)
> "Wordle meets Geoguessr meets the periodic table. Guess the hidden country or chemical element using scientific attribute clues."

### Short (one paragraph)
> **Scalar** is a free, browser-based deductive logic puzzle where you guess a hidden entity — a world country or a chemical element — by analyzing attribute feedback after each guess. Instead of letter positions, you get direction arrows (↑ higher, ↓ lower), proximity tiers (~2×, ~25%), geographic distance in km, and color-coded hot/warm/cold signals. Every guess gives you information. Use it to zero in on the answer in as few moves as possible.

### Medium (Reddit body opening)
> I built **Scalar** — a deductive logic puzzle game that takes the satisfying feedback loop of Wordle and applies it to real-world knowledge categories: world countries and chemical elements. Instead of coloring letters, each guess reveals a full card of scientific clues — how far away the country is (in km!), whether the population is in the same ballpark, if it's landlocked, what continent you're in, and more. There's a daily challenge (one puzzle per day, Wordle-style streak) and unlimited free play. It's free, no login, no ads — just the puzzle.

---

## What Is Scalar?

Scalar is a **free, no-account, browser-based** deductive logic game. A secret target is randomly chosen from a category — right now either a **world country** or a **chemical element** from the periodic table. You make guesses, and each guess produces a detailed feedback card showing how close you are across multiple attributes simultaneously.

The name "Scalar" refers to the numerical/scalar nature of the clues — arrows, quantities, ratios, distances — as opposed to the pure text matching of games like Wordle.

**Plays like:** Wordle + Geoguessr + Sporcle
**Feels like:** A data journalism puzzle — The New York Times meets a scientific journal
**Platform:** Web (mobile-friendly, responsive, works offline after load)

---

## Core Loop (How It Plays)

1. **Pick a category** — Countries or Elements
2. **Type a guess** — autocomplete dropdown narrows your choices as you type
3. **Read the feedback card** — a card appears showing every attribute of your guess, color-coded by proximity to the target:
   - 🟩 **Green (Exact)** — perfect match on this attribute
   - 🟧 **Orange (Hot)** — same ballpark / same category bucket
   - 🟨 **Amber (Near)** — outside the ballpark but not far (dashed border)
   - ⬜ **White (Miss)** — no match
4. **Use arrows and tiers** — numeric fields show ↑/↓ and a proximity tier (~25%, ~2×, ~5×)
5. **Use hint credits** — tap the eye icon on any attribute to reveal the exact target value. First 3 hints are free; after that, each hint costs +3 moves
6. **Solve it** — when every attribute shows green, you win. Your score is your total move count — lower is better.

---

## Categories In Detail

### 🌍 Countries (current)
Guess any of ~200 world countries. Each guess reveals:

| Attribute | What it tells you |
|-----------|-------------------|
| **Location** | Hemisphere, Continent, Subregion (e.g., Northern • Asia • Eastern Asia) |
| **Distance** | Exact km between your capital and the target's capital, with a color gradient (green = within 1,000km) |
| **Area** | Are you within 25%? 2×? 10× the right size? |
| **Population** | Same — percentage tier + ↑/↓ direction |
| **Landlocked?** | Yes or No — simple binary |
| **Government Type** | Parliamentary Republic, Constitutional Monarchy, etc. |
| **Borders** | How many countries border it |
| **Timezones** | Number of time zones it spans |
| **1st Letter** | A-Z position with ←/→ arrows — useful early-game narrowing |

### ⚗️ Elements (current)
Guess any of 118 chemical elements from the periodic table. Each guess reveals:

| Attribute | What it tells you |
|-----------|-------------------|
| **Atomic Number** | Are you above or below? By how much? |
| **Group** | Which column of the periodic table (1-18) |
| **Period** | Which row (1-7) |
| **Phase at STP** | Solid, Liquid, or Gas at room temperature |
| **Element Family** | Alkali Metal, Noble Gas, Transition Metal, etc. |
| **Block** | s, p, d, or f block |
| **Radioactive?** | Yes or No |
| **Symbol matches name?** | e.g., Carbon → C (no match), Gold → Au (no match), Californium → Cf (yes match) |

---

## Scoring System

**Total Moves — lower is better.** There is no guess limit.

| Action | Cost |
|--------|------|
| Submit a guess | +1 move |
| Use a hint (Eye icon) — with free credits | 0 moves (uses 1 credit) |
| Use a hint — after credits run out | +3 moves |

You start each game with **3 free hint credits**, shown as filled squares in the header. There's no penalty for using them wisely. Once spent, hints become expensive — so the interesting decision is whether to burn a credit or keep guessing.

An expert player might solve Countries in 4-6 guesses. A casual player might take 10-15 guesses and a couple of hints.

---

## Key Features

### Gameplay
- **Daily challenge + unlimited free play** — one shared daily puzzle per category (Wordle-style streak tracking) plus unlimited free play any time
- **No guess limit** — not turn-based like Wordle; you can always make another guess
- **5 distinct feedback types** — higher/lower, exact match, geographic distance, category match, set intersection
- **Proximity tiers** — not just "wrong" but "wrong by ~2×" vs "wrong by ~100×"
- **Direction arrows** — ↑ means the target is bigger/later/higher; ↓ means smaller/earlier/lower
- **Geographic distance** — Countries tells you the exact km between capitals, with a 4-color gradient (green < 1,000km → amber < 3,000km → yellow < 5,000km → white = far)
- **First letter** — A-Z position for country names with left/right arrows; great for early narrowing
- **Eye-icon hints** — reveal any single attribute exactly, with a credit/cost system adding a strategic layer
- **Autocomplete input** — start typing; up to 8 suggestions appear; keyboard or tap to select
- **Card collapse** — older guess cards auto-collapse into a color-square summary strip to keep the board clean

### Presentation
- **Category-specific win cards** — when you solve Elements, you see a beautiful periodic-table-style square for the element; when you solve Countries, you see a "passport card" with flag-style layout and full country data
- **"Thermal E-Paper" aesthetic** — sharp corners, charcoal ink on paper-white, Geist Mono monospace font, Fraunces serif headings. Clean and readable, not flashy
- **Animated Venn diagram background** — subtle decorative orbs
- **Color legend** — always visible above the board; green/orange/amber/white explained at a glance

### Social / Sharing
- **Wordle-style emoji share** — after solving, "Share Result" generates a color-grid text (🟩🟧🟨⬜) with your move count; uses Web Share API (native mobile share sheet) or clipboard fallback
- **Daily share** — daily result links to the base site only (no spoilers). Free play share embeds a challenge link with your score
- **Challenge mode** — in free play, "Share" generates a link that lets a friend play the same hidden target and try to beat your move count
- **Share button** — fixed bottom-right, slides off screen when scrolling, returns on scroll-up; always visible on win

### Accessibility & Privacy
- **No login required** — open and play immediately
- **No ads** — free, clean
- **No cookies** — Vercel Analytics with daily-reset hash; no personal data collected; full privacy policy in-app
- **Game state saved** — browser localStorage; resume a game after closing the tab
- **Mobile-optimized** — header collapses when input is focused; hints are always-visible on mobile

---

## How Scalar Differs from Competitors

| | Scalar | Wordle | Geoguessr | Sporcle | Tradle |
|---|---|---|---|---|---|
| Knowledge domain | Countries + Elements | 5-letter words | World geography (map) | Trivia quizzes | World trade data |
| Feedback type | Multi-attribute scientific clues | Letter position colors | Map click, no structured feedback | Multiple choice | Bar chart + direction |
| No guess limit | ✅ | ❌ (6 tries) | ❌ | Varies | ❌ |
| Scoring | Total moves (lower better) | Tries to solve | Points by proximity | Correct/wrong | Guesses |
| Daily challenge | ✅ Daily + unlimited free play | ✅ Once per day | ✅ | ✅ | ❌ |
| Emoji grid share | ✅ (daily + free play) | ✅ | ❌ | ❌ | ❌ |
| Challenge sharing | ✅ Score-embedded link | ❌ | ✅ Score | ❌ | ✅ |
| Free hint system | ✅ 3 credits + cost | ❌ | ❌ | N/A | ❌ |
| Streak tracking | ✅ Per category | ✅ | ❌ | ❌ | ❌ |
| No account needed | ✅ | ✅ | ✅ | ✅ | ✅ |

**Key differentiators:**
1. **Multi-attribute simultaneous feedback** — every guess reveals many clues at once, not just one dimension
2. **Quantitative proximity** — you know *how wrong* you are (~25% off vs. ~10×), not just wrong/right
3. **Geographic distance** — km distance between capitals is a killer feature for Countries that map-based games handle differently
4. **Daily challenge + unlimited free play** — one shared daily puzzle per category (with streak tracking) and unlimited free play, no trade-off required
5. **Strategic hint system** — free credits + move-cost tradeoff creates genuine decisions
6. **Two categories with different mental models** — geography vs. chemistry, one game app

---

## Target Audiences

### Primary
- **Wordle / daily puzzle fans** — people who do NYT games, Connections, Worldle, Flagle, etc.
- **Geography nerds** — people who've played Geoguessr, love maps, remember capitals
- **Science / chemistry buffs** — people who still remember the periodic table, like chemistry trivia
- **Trivia enthusiasts** — Sporcle, QuizUp, pub quiz players

### Secondary
- **Strategy game fans** — the scoring system and hint cost tradeoff rewards efficient play
- **Educators** — could be used as a teaching tool for world geography or chemistry
- **Competitive puzzle solvers** — the challenge link system supports head-to-head comparison

### Psychographic
- Enjoys the satisfaction of narrowing down a mystery through logic
- Appreciates clean, distraction-free UI
- Comfortable with numbers and scientific thinking
- Likes building knowledge while playing

---

## Talking Points for Reddit Posts

### r/WebGames / r/IndieGaming / r/gamedev
- "I built a browser puzzle game that teaches you real geography and chemistry through Wordle-style deductive feedback"
- "Instead of letter colors, you get a scientific data card: exact km distance, ↑/↓ arrows, percentage tiers, continent/subregion — all at once"
- "No account, no ads — daily challenge with streak tracking + unlimited free play"
- "Challenge mode lets you send a link to friends with your score baked in — they play the same target and try to beat your move count"
- "Built with React 19 + Zustand, deployed on Vercel" (for r/webdev / r/reactjs)

### r/geography / r/MapPorn / r/geoguessr
- "I built a geography puzzle game where you guess countries using multi-attribute clues — distance in km, continent, population size, first letter position, and more"
- "The km distance between capitals gives you a compass; the population tier tells you the scale; the first letter arrow tells you where in the alphabet to look"
- "It's basically: if Geoguessr gave you a structured data card instead of a map photo"

### r/chemistry / r/chemicalreactiongifs / r/science
- "I built a periodic table guessing game — guess the element using atomic number direction, element family, block, phase, and radioactivity clues"
- "The 'symbol matches name?' attribute is a fun trivia hook — most elements don't (Au ≠ Gold, Fe ≠ Iron), but some do (Cf = Californium, Ne = Neon)"
- "You can actually use the periodic table's structure as a 2D search space — narrow by period (row) and group (column) simultaneously"

### r/puzzles / r/wordle
- "I built a Wordle-like game but instead of a word, you're guessing a country or chemical element — and instead of letter positions, you get multiple scientific attributes at once"
- "The feedback is richer than Wordle: you get direction (↑/↓) AND magnitude (~25% off vs. ~5× off) AND geographic distance AND category matching — all in one guess card"
- "There's no guess limit, but there's a scoring system — lower total moves wins. It rewards logical, efficient play rather than just 'did you get it or not'"

---

## What Makes a Great First Play Session

1. **Start with Countries** — more intuitive attributes (km distance is instantly readable, "landlocked?" is concrete)
2. **First guess: guess a large, central country** — something like France, Brazil, India, or China. Maximizes information across all attributes
3. **Use free hints strategically** — "1st Letter" reveals a key piece of info early, narrowing ~200 countries to ~8
4. **Watch the km distance drop** — the geographic distance with its color gradient is the most satisfying clue to watch collapse toward green

---

## Game Stats / Numbers to Know

- **~200** world countries in the Countries category
- **118** chemical elements in the Elements category
- **11** visible attributes per guess in Countries
- **8** visible attributes per guess in Elements
- **3** free hint credits per game
- **+3 moves** per hint after credits are spent
- **~4-6 moves** for an expert Countries solve
- **~3-5 moves** for an expert Elements solve (smaller search space)
- **0** accounts required, 0 ads, 0 cookies

---

## Visual Identity

The game has a distinctive "thermal e-paper" look:
- **Geist Mono** monospace everywhere (data, labels, inputs, buttons)
- **Fraunces** variable serif for display headings and modal titles
- Sharp corners (zero border radius) — stark, scientific
- **Color palette**: paper-white canvas, charcoal ink, thermal green/orange/amber/white feedback
- Animated Venn diagram background (soft teal/gold/pink orbs)
- Periodic table cell card on Elements win, passport-style card on Countries win

This aesthetic intentionally evokes: scientific journals, NYT data graphics, e-readers. Not game-y, not colorful-overload — precise and readable.

---

## Frequently Asked Questions (Pre-answers for Reddit)

**Q: Is there a daily puzzle?**
A: Yes! There's a daily challenge mode — one puzzle per day per category, the same puzzle for all players on that calendar day. Your streak is tracked across days. After completing the daily, you can switch to Free Play for unlimited additional rounds.

**Q: Does it save my progress?**
A: Yes — your current game is saved in your browser's local storage. Closing and reopening the tab resumes where you left off.

**Q: Are there more categories coming?**
A: The architecture supports adding categories easily (just CSV files). Animals, US States, and films are potential candidates.

**Q: Is there a way to compete with friends?**
A: Yes! After solving, use "Challenge a Friend" to generate a link. Your friend plays the same hidden target and tries to beat your score.

**Q: Is it mobile-friendly?**
A: Yes — fully responsive. The header collapses when you focus the input on mobile to maximize screen space.

**Q: Is it really free? No ads?**
A: Yes, completely free, no ads, no account required.

**Q: How do I share my result?**
A: The "Share Result" button in the win modal generates a Wordle-style emoji grid (🟩🟧🟨⬜) with your move count. On mobile it uses the native share sheet; on desktop it copies to clipboard. The fixed "Share" button (bottom-right) also works — it generates a challenge link in free play mode.

---

## Sample Reddit Post Templates

### Template 1 — r/WebGames (straightforward)
```
**Title:** I made a free browser puzzle game where you guess countries/elements using
scientific feedback clues (like Wordle but with arrows, km distances, and percentages)

I built Scalar — a deductive logic puzzle game. A hidden country or chemical element
is chosen at random. You guess, and each guess gives you a detailed feedback card:

- For countries: exact km distance between capitals, continent/subregion match,
  population size tier (↑ ~2×), landlocked?, first letter A-Z position
- For elements: atomic number direction, period, group, element family, block,
  phase at STP, radioactivity

Feedback is color-coded: green (exact), orange (hot/ballpark), amber (near), white (miss).
Direction arrows tell you which way to adjust. Proximity tiers tell you by how much.

There's no guess limit — your score is total moves (lower is better). 3 free hint
credits per game; hints cost +3 moves after that.

Daily challenge (one puzzle per day per category, with streak tracking) + unlimited
free play. No account, no ads. [link]

Happy to answer questions about the gameplay or how I built it!
```

### Template 2 — r/geography (geography angle)
```
**Title:** I built a geography puzzle where each country guess gives you km distance,
continent, population tier, first letter position, and more — all at once

[link]

Started as a Wordle clone for countries, grew into something with a richer feedback
system. The km distance between capitals with a green→amber→yellow→white color
gradient is the clue I'm most proud of — it acts like a compass as you get warmer.

Countries category: Location (hemisphere/continent/subregion), Distance, Area,
Population, Landlocked?, Govt. Type, Borders, Timezones, 1st Letter.

Would love feedback from geography fans on which clues feel most useful and which
feel redundant.
```

### Template 3 — r/chemistry (chemistry angle)
```
**Title:** I built a periodic table guessing game — narrow down the element using
atomic number, group, period, family, block, phase, and radioactivity clues

[link]

The elements category uses the periodic table's structure as your 2D search space:
- Period (row 1-7) and Group (column 1-18) with ↑/↓ arrows let you binary-search
  the table
- Element Family and Block are powerful categorizers early-game
- "Symbol matches name?" is a fun trivia fact: most don't (Fe ≠ Iron, Au ≠ Gold),
  but some do (Cf = Californium)

You can solve Gold in about 4 guesses if you work the transition metals systematically.
```

---

## Taglines

- "Guess smarter. Not harder."
- "The deductive logic puzzle for data nerds."
- "Wordle with direction arrows and a km counter."
- "Your country knowledge, put to the test."
- "Every guess is a clue. Use them well."
- "Not just wrong — wrong by ~50×. Now you know."
- "Free. No login. No ads. Just the puzzle."
