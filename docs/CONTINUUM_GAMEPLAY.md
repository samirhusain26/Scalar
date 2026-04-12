# Continuum — Gameplay Document

> Working doc for designing Continuum, the second game in the Scalar suite. Scalar is deduction; Continuum is calibration. This file captures the **current prototype** and is the scratchpad for **iterating toward a better core loop**.

---

## 1. Current Prototype (as built)

### The Pitch (one line)
> Cards come at you one by one. Slot each into a growing sorted list by a numeric attribute. One wrong placement ends the round.

### Core Loop
1. Player picks a **category** (countries / elements) and a **numeric attribute** (population, GDP, atomic number, density…).
2. Game deals 11 random entities from that category. The **first card is pre-placed** as an anchor.
3. Player is shown a **current card** (name only, no value) and must insert it into the sorted list at the correct index.
4. Placement is validated:
   - **Correct** → card locks in, next card is dealt, score +1.
   - **Wrong** → round ends instantly, correct position is revealed.
5. Round ends on **10 correct placements** (WON) or **first wrong placement** (LOST).

### What the Player Sees
- **Current card** — dark inverted card at top labeled "PLACE THIS CARD", only the entity name is visible.
- **Sorted sequence** — stacked placed cards with `▲ Lowest` → `▼ Highest` drop zones between each.
- **Progress bar + counter** — `score / targetScore` placed.
- **No values shown during play** — placed cards hide their numeric value. The player is ordering blind-ish, relying on knowledge.
- **Game over screen** — reveals the correct sorted order of all cards played that round, with values.

### What the Player Knows
- The **attribute label** (e.g. "Population")
- The **names** of placed cards and the current card
- **Nothing else.** No hints, no ranges, no feedback on "close."

### Failure Mode
- **Single-strike loss.** One wrong slot and the round is dead.
- No lives, no streak saves, no retries.

### Round Structure
- Fixed round size: **10 placements** (11 cards total, 1 anchor).
- No timer, no move counter, no scoring beyond "did you finish the round."
- No difficulty tiers. No daily mode. No persistence across refreshes.

### Input
- **Drag and drop** via `@dnd-kit` with mouse + touch sensors
- **Tap-to-place** fallback — tap any drop zone gap to place the current card there

### Known Limitations / Friction
- Ties between two entities are ambiguous; the current `>=` check lets either side be "correct" but the loss message only shows one canonical position.
- No persistence — a refresh kills the round.
- Value formatter ignores `displayFormat` from the schema (GDP shown as `1.2T` instead of `$1.2T`, area missing `km²`, etc.).
- The attribute filter (`logicType === 'HIGHER_LOWER' && dataType !== 'STRING'`) may miss or include wrong fields depending on how schemas are tagged.
- "Sort by X" is decided up-front and never changes within a round — all 10 placements use the same attribute. Gets monotonous.
- No feedback between rounds, no sense of progression.

---

## 2. The Design Question

**What is Continuum actually about?**

Scalar is about **deduction under uncertainty** — narrowing a target with each guess. Its feedback system is rich (distance, direction, percentage, set intersection).

The current Continuum prototype is about **recall + estimation of magnitudes**. But the gameplay doesn't really reward estimation — it rewards either knowing exactly or guessing and dying.

The core tension we want to design into: **you have fuzzy knowledge, and the game should reward being directionally correct, not punish being imprecise.**

---

## 3. Dimensions to Play With

Every variant below is a combination of choices across these axes:

### A. Information Revealed
- **A1 — Name only** (current): cards show entity name, no value
- **A2 — Value only**: show the number, hide the name (you're estimating what entity owns this number)
- **A3 — Both**: names and values visible on placed cards — game becomes about the current card only
- **A4 — Progressive reveal**: values appear after placement succeeds

### B. Failure Model
- **B1 — Single strike** (current)
- **B2 — Lives** (e.g. 3 strikes before round ends)
- **B3 — Soft fail with penalty** — wrong placements cost points but round continues
- **B4 — Streak-based** — round never "ends," but you're chasing a best streak

### C. Round Shape
- **C1 — Fixed N placements** (current: 10)
- **C2 — Endless** — deck keeps feeding until you die, chase high score
- **C3 — All-at-once** — given N cards up front, arrange them all, submit once
- **C4 — Time attack** — 60 seconds, place as many as possible

### D. Attribute Variety
- **D1 — Single attribute per round** (current)
- **D2 — Attribute changes each card** — every card announces "place me by GDP" then "place me by area"
- **D3 — Mystery attribute** — you have to figure out which attribute the sequence is sorted by
- **D4 — Multi-sort** — maintain two sorted lists in parallel (e.g. by population and by area)

### E. Feedback Granularity
- **E1 — Binary** (current: right or dead)
- **E2 — Thermal** — "close" (off by 1) vs "far" (off by 3+) with warning colors, mirrors Scalar's thermal design
- **E3 — Positional** — tells you which direction you were off (higher/lower)
- **E4 — Percentile** — shows how far off in % terms, not index terms

### F. Source Set
- **F1 — Random 11** (current)
- **F2 — Curated difficulty** — easy rounds pick widely-spaced entities, hard rounds pick adjacent ones (e.g. all European countries by GDP)
- **F3 — Themed rounds** — "top 10 by GDP" or "elements in period 3" — recognizable sets players can reason about

---

## 4. Variant Concepts (to rank / mix / cut)

> These are whole-game ideas, each a specific combination of the dimensions above. Read them as "what if Continuum were…"

### V1 — Endless Ladder (B2 + C2 + E2)
3 lives, endless deck, score = cards placed before you're out. Each wrong placement costs a life and shows you where it should have gone. Colors: green for correct, amber for off-by-one, red for off-by-several. Leaderboard-ready.

**Feels like:** arcade runner. High replay value. The current prototype + lives + endless + softer feedback.

### V2 — Perfect Ten (C3 + E1)
Deal 10 cards at once. Arrange them all into the correct order with drag. Submit. Score = how many are in the right *relative* position (or a Kendall-tau distance). No single-strike death — every round gives you a grade from 0–10.

**Feels like:** a daily puzzle. One round per day, one score per day, shareable. Closest cousin to Wordle's "finish every day."

### V3 — Mystery Attribute (D3)
You're shown an already-sorted sequence of 5 entities and must place a 6th. But you're **not told what attribute** they're sorted by. You have to infer from the existing sequence whether it's population, GDP, area, etc. Placement is based on your read.

**Feels like:** deduction + trivia. Very Scalar-adjacent but with a novel mechanic. Hardest to balance.

### V4 — Price Is Right (A2 + B3)
Cards show **values** with hidden names. You're guessing which entity fits each slot. Or reversed: you're shown a range (e.g. 80M–100M population) and asked to name an entity in it. Soft scoring, no single-strike death.

**Feels like:** Wits & Wagers / Price is Right. Very different from V1 but reuses the same data.

### V5 — Bisect (C1 + E3 + F2)
You're given **2 anchor cards** (the extremes) and must insert cards between them. The round gets harder as the gaps close — eventually you're placing a card between two that differ by 3%. Directional feedback (higher/lower) on wrong placements.

**Feels like:** a binary-search game. Tension builds over the round.

### V6 — Daily Continuum (V2 + Daily)
Same 10 cards for every player, same day, shareable emoji grid. Leans on Scalar's existing daily infrastructure (Mulberry32 PRNG, `dailyUtils.ts`). Best-fit if we pick V2 as the core mode.

### V7 — Continuum + Scalar Crossover (D2 + E2)
The current card tells you "place me by GDP" — you place it. Next card: "place me by area." The sequence re-sorts itself each turn by the new attribute. Chaotic but teaches you relationships between attributes.

**Feels like:** cognitively demanding, novel, possibly too confusing. High skill ceiling.

---

## 5. Evaluation Criteria (for picking the direction)

When comparing variants, score each on:

| Criterion | Question |
|---|---|
| **Clarity** | Can a new player understand it in 10 seconds? |
| **Fairness** | Does fuzzy / directional knowledge still let you do well? |
| **Replay value** | Do I want to play again after a loss? |
| **Daily fit** | Does it work as a one-per-day shareable puzzle? |
| **Differentiation** | Is it meaningfully different from Scalar? Different from existing games (Higher/Lower, Wordle)? |
| **Data reuse** | Does it work with both countries and elements (and future categories)? |
| **Build cost** | How much new tech vs. reusing Scalar's infra? |

---

## 6. Open Questions

1. **Is single-strike death ever the right call, or is it always too harsh?** Wordle gets away with 6 guesses, not 1. What's the "6" of Continuum?
2. **Should Continuum have a "daily" version, or is it a freeplay-only companion?** Scalar owns the daily slot.
3. **Is hiding the value during play the right call, or should values be visible and the challenge is just placing?**
4. **Should we reveal the correct *range* on loss, not just the index?** ("You were off by 3 slots / off by 30%")
5. **Is 10 cards the right round length?** Too long = frustrating on a miss. Too short = no sense of accomplishment.
6. **Does Continuum need its own schema of "difficulty-weighted" attributes?** E.g. population is easy, HDI is hard.
7. **Shared category/difficulty with Scalar, or Continuum-native settings?**

---

## 7. Ideation Queue

> This section is where new ideas land. Capture first, evaluate later.

- _(add ideas here as we brainstorm)_

---

## 8. Decision Log

> When we commit to something, write it here with a date and a one-line rationale.

- _(empty)_
