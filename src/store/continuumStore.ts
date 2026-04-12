import { create } from 'zustand';
import type { Entity, GameData } from '../types';
import gameDataRaw from '../assets/data/gameData.json';
import { getLocalDateString } from '../utils/dailyUtils';
import { CONTINUUM_METRICS } from '../utils/continuumConfig';

const gameData = gameDataRaw as unknown as GameData;

// ── PRNG helpers ──

function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash * 31) + s.charCodeAt(i)) >>> 0;
  }
  return hash;
}

// ── Anchor selection ──

/**
 * Picks 3 anchor cards from a value-sorted entity array:
 *   [0] bottom — within bottom 5%
 *   [1] top    — within top 5%
 *   [2] mid    — within 40th–60th percentile
 * Returns them sorted ascending by attribute value.
 */
function pickAnchors(
  sorted: Entity[],
  attribute: string,
  rand: () => number,
): [Entity, Entity, Entity] {
  const n = sorted.length;
  const bot5Max = Math.max(0, Math.floor(n * 0.05));
  const top5Min = Math.min(n - 1, Math.floor(n * 0.95));
  const mid40 = Math.floor(n * 0.40);
  const mid60 = Math.min(n - 1, Math.floor(n * 0.60));

  const botIdx = Math.floor(rand() * (bot5Max + 1));
  const topIdx = top5Min + Math.floor(rand() * (n - top5Min));
  const midIdx = mid40 + Math.floor(rand() * (mid60 - mid40 + 1));

  const anchors = [sorted[botIdx], sorted[topIdx], sorted[midIdx]] as [Entity, Entity, Entity];
  anchors.sort((a, b) => (a[attribute] as number) - (b[attribute] as number));
  return anchors;
}

// ── Fuzzy bisection dealer ──

/**
 * Pre-computes the deal sequence by simulating bisection on an ideal board.
 * Each card targets the middle 50% of the largest gap between placed values.
 * Falls back to the full gap, then any remaining card if no match is found.
 */
function computeDealSequence(
  sorted: Entity[],
  anchorIds: Set<string>,
  attribute: string,
  rand: () => number,
  count: number,
): Entity[] {
  const pool = sorted.filter(e => !anchorIds.has(e.id));
  const placedValues = sorted
    .filter(e => anchorIds.has(e.id))
    .map(e => e[attribute] as number)
    .sort((a, b) => a - b);

  const sequence: Entity[] = [];

  while (pool.length > 0 && sequence.length < count) {
    // Find the largest internal gap
    let gapIdx = 0;
    let gapSize = -1;
    for (let i = 0; i < placedValues.length - 1; i++) {
      const size = placedValues[i + 1] - placedValues[i];
      if (size > gapSize) {
        gapSize = size;
        gapIdx = i;
      }
    }

    const gapLow = placedValues[gapIdx];
    const gapHigh = placedValues[gapIdx + 1];
    const wobbleLow = gapLow + 0.25 * (gapHigh - gapLow);
    const wobbleHigh = gapHigh - 0.25 * (gapHigh - gapLow);

    let candidates = pool.filter(e => {
      const v = e[attribute] as number;
      return v >= wobbleLow && v <= wobbleHigh;
    });

    if (candidates.length === 0) {
      candidates = pool.filter(e => {
        const v = e[attribute] as number;
        return v > gapLow && v < gapHigh;
      });
    }

    if (candidates.length === 0) {
      candidates = [...pool];
    }

    const picked = candidates[Math.floor(rand() * candidates.length)];
    sequence.push(picked);

    const idx = pool.findIndex(e => e.id === picked.id);
    pool.splice(idx, 1);

    const pickedVal = picked[attribute] as number;
    const insertAt = placedValues.findIndex(v => v > pickedVal);
    if (insertAt === -1) {
      placedValues.push(pickedVal);
    } else {
      placedValues.splice(insertAt, 0, pickedVal);
    }
  }

  return sequence;
}

// ── Store types ──

export type ContinuumStatus = 'IDLE' | 'PLAYING' | 'ERROR' | 'LOST';

export const MAX_LIVES = 3;

export interface ContinuumState {
  status: ContinuumStatus;
  category: string;
  attribute: string;
  attributeLabel: string;
  /** Cards in the sequence, sorted ascending by attribute value. */
  placedCards: Entity[];
  /** IDs of the 3 original anchor cards set at game start — never changes. */
  initialAnchorIds: Set<string>;
  /**
   * IDs of anchor cards during play.
   * Starts equal to initialAnchorIds; grows as auto-corrected error cards are
   * added (so future bisection gaps avoid re-targeting corrected positions).
   */
  anchorIds: Set<string>;
  /** IDs of cards the player placed incorrectly (later auto-corrected). */
  errorPlacedIds: Set<string>;
  /** Card the player must place next (name only shown). null during ERROR phase. */
  currentCard: Entity | null;
  /** Pre-computed deal sequence. */
  dealQueue: Entity[];
  /** Remaining lives (0 = game over). */
  lives: number;
  /** Running count of correct placements. */
  score: number;
  /**
   * ID of the card currently being error-animated.
   * Card is in placedCards at the wrong index; resolveError() will sort it.
   */
  errorCardId: string | null;
  /** Date string this round was seeded for (YYYY-MM-DD). */
  dateString: string;

  startGame: (category: string, attributeKey: string) => void;
  startDailyGame: () => void;
  startDailyGameForCategory: (category: string) => void;
  placeCard: (insertIndex: number) => void;
  /**
   * Called by the UI after the error flicker + slide animations complete.
   * Sorts the misplaced card to its correct position, adds it to anchors,
   * then deals the next card (or transitions to LOST if lives === 0).
   */
  resolveError: () => void;
  reset: () => void;
}

export const useContinuumStore = create<ContinuumState>((set, get) => ({
  status: 'IDLE',
  category: '',
  attribute: '',
  attributeLabel: '',
  placedCards: [],
  initialAnchorIds: new Set(),
  anchorIds: new Set(),
  errorPlacedIds: new Set(),
  currentCard: null,
  dealQueue: [],
  lives: MAX_LIVES,
  score: 0,
  errorCardId: null,
  dateString: '',

  startDailyGame: () => {
    // Default to the first available category (countries). Users can switch
    // to any other category via startDailyGameForCategory — each category
    // has its own independent daily game seeded by date + category.
    const availableCats = Object.keys(CONTINUUM_METRICS).filter(
      cat => gameData.categories[cat] && CONTINUUM_METRICS[cat].length > 0,
    );
    if (availableCats.length === 0) return;
    get().startDailyGameForCategory(availableCats[0]);
  },

  startDailyGameForCategory: (category: string) => {
    const dateString = getLocalDateString();
    const seed = hashString(`${dateString}:continuum:${category}:attr-picker`);
    const rand = mulberry32(seed);
    const attrs = CONTINUUM_METRICS[category];
    if (!attrs || attrs.length === 0) return;
    const attr = attrs[Math.floor(rand() * attrs.length)];
    get().startGame(category, attr);
  },

  startGame: (category: string, attributeKey: string) => {
    const entities = gameData.categories[category];
    if (!entities) return;

    const valid = entities.filter(e => {
      const val = e[attributeKey];
      return typeof val === 'number' && isFinite(val);
    });

    if (valid.length < MAX_LIVES + 3) return;

    const sorted = [...valid].sort(
      (a, b) => (a[attributeKey] as number) - (b[attributeKey] as number),
    );

    const dateString = getLocalDateString();
    const seed = hashString(`${dateString}:${category}:${attributeKey}`);
    const rand = mulberry32(seed);

    const [bot, mid, top] = pickAnchors(sorted, attributeKey, rand);
    const anchorIds = new Set([bot.id, mid.id, top.id]);

    // Pre-compute the full remaining pool so the round is truly endless
    const dealQueue = computeDealSequence(
      sorted,
      anchorIds,
      attributeKey,
      rand,
      valid.length, // pre-compute everything
    );

    const schema = gameData.schemaConfig[category];
    const field = schema?.find(f => f.attributeKey === attributeKey);
    const label = field?.displayLabel ?? attributeKey;

    set({
      status: 'PLAYING',
      category,
      attribute: attributeKey,
      attributeLabel: label,
      placedCards: [bot, mid, top],
      initialAnchorIds: new Set(anchorIds), // immutable snapshot of the 3 starting cards
      anchorIds,
      errorPlacedIds: new Set(),
      currentCard: dealQueue[0] ?? null,
      dealQueue: dealQueue.slice(1),
      lives: MAX_LIVES,
      score: 0,
      errorCardId: null,
      dateString,
    });
  },

  placeCard: (insertIndex: number) => {
    const { placedCards, currentCard, dealQueue, score, attribute, lives } = get();
    if (!currentCard || lives <= 0) return;

    const proposed = [...placedCards];
    proposed.splice(insertIndex, 0, currentCard);

    const isSorted = proposed.every((card, i) => {
      if (i === 0) return true;
      return (card[attribute] as number) >= (proposed[i - 1][attribute] as number);
    });

    if (isSorted) {
      // Correct — card locks in, deal next
      set({
        placedCards: proposed,
        currentCard: dealQueue[0] ?? null,
        dealQueue: dealQueue.slice(1),
        score: score + 1,
      });
    } else {
      // Wrong — deduct life, hold in ERROR phase for animation
      const newLives = lives - 1;
      set({
        placedCards: proposed,    // card sits at wrong index during animation
        currentCard: null,        // no new card until error is resolved
        errorCardId: currentCard.id,
        lives: newLives,
        status: 'ERROR',
      });
    }
  },

  resolveError: () => {
    const { placedCards, anchorIds, errorPlacedIds, dealQueue, attribute, lives, errorCardId } = get();

    // Sort placedCards to their correct positions (triggers Framer Motion slide)
    const sorted = [...placedCards].sort(
      (a, b) => (a[attribute] as number) - (b[attribute] as number),
    );

    // Error card becomes a permanent anchor for future bisection calibration
    const newAnchorIds = new Set(anchorIds);
    if (errorCardId) newAnchorIds.add(errorCardId);

    // Track which cards were placed incorrectly (for LOST screen Red Flag visuals)
    const newErrorPlacedIds = new Set(errorPlacedIds);
    if (errorCardId) newErrorPlacedIds.add(errorCardId);

    if (lives <= 0) {
      set({
        placedCards: sorted,
        anchorIds: newAnchorIds,
        errorPlacedIds: newErrorPlacedIds,
        errorCardId: null,
        currentCard: null,
        status: 'LOST',
      });
    } else {
      set({
        placedCards: sorted,
        anchorIds: newAnchorIds,
        errorPlacedIds: newErrorPlacedIds,
        errorCardId: null,
        currentCard: dealQueue[0] ?? null,
        dealQueue: dealQueue.slice(1),
        status: 'PLAYING',
      });
    }
  },

  reset: () => {
    set({
      status: 'IDLE',
      category: '',
      attribute: '',
      attributeLabel: '',
      placedCards: [],
      initialAnchorIds: new Set(),
      anchorIds: new Set(),
      errorPlacedIds: new Set(),
      currentCard: null,
      dealQueue: [],
      lives: MAX_LIVES,
      score: 0,
      errorCardId: null,
      dateString: '',
    });
  },
}));
