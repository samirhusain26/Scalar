import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
    Entity,
    GameData,
    GameMode,
    GameSlot,
    GameStatus,
    DailyMeta,
    GuessResult,
} from '../types';
import {
    getFeedback,
    getRandomTarget,
    checkWinCondition,
} from '../utils/gameLogic';
import { trackGameEvent } from '../utils/analytics';
import { getLocalDateString, getDailyEntity } from '../utils/dailyUtils';
import gameDataRaw from '../assets/data/gameData.json';

const gameData = gameDataRaw as unknown as GameData;

// Bump this when schema/state shape changes to clear stale localStorage.
const STORE_VERSION = 14;

const DEFAULT_CATEGORY = 'countries';
const DEFAULT_CREDITS = 3;
const HINT_MOVE_COST = 3;

// ─── Internal helpers ────────────────────────────────────────────────────────

function makeDefaultSlot(entity: Entity): GameSlot {
    return {
        targetEntity: entity,
        guesses: [],
        gameStatus: 'PLAYING',
        moves: 0,
        credits: DEFAULT_CREDITS,
        majorHintAttributes: [],
    };
}

/** Sync the flat (legacy) top-level fields from a slot so existing components need no changes. */
function syncFlat(slot: GameSlot): {
    targetEntity: Entity;
    guesses: GuessResult[];
    gameStatus: GameStatus;
    moves: number;
    credits: number;
    majorHintAttributes: string[];
} {
    return {
        targetEntity: slot.targetEntity,
        guesses: slot.guesses,
        gameStatus: slot.gameStatus,
        moves: slot.moves,
        credits: slot.credits,
        majorHintAttributes: slot.majorHintAttributes,
    };
}

/** Build a Partial<ScalarState> that writes a slot and syncs the flat fields. */
function writeSlot(
    state: ScalarState,
    mode: GameMode,
    category: string,
    slot: GameSlot,
): Partial<ScalarState> {
    if (mode === 'daily') {
        return {
            daily: { ...state.daily, [category]: slot },
            ...syncFlat(slot),
        };
    }
    return {
        freeplay: { ...state.freeplay, [category]: slot },
        ...syncFlat(slot),
    };
}

/** Get or create a daily slot, reinitialising if the date has rolled over. */
function getOrInitDailySlot(
    daily: Record<string, GameSlot>,
    category: string,
    today: string,
): GameSlot {
    const existing = daily[category];
    if (existing && existing.dailyDate === today) return existing;
    const entities = gameData.categories[category] ?? [];
    const entity = getDailyEntity(category, entities, today);
    return { ...makeDefaultSlot(entity), dailyDate: today };
}

/** Get or create a freeplay slot. */
function getOrInitFreeplaySlot(
    freeplay: Record<string, GameSlot>,
    category: string,
): GameSlot {
    return freeplay[category] ?? makeDefaultSlot(getRandomTarget(gameData, category));
}

/** Compute "yesterday" as YYYY-MM-DD in local timezone. */
function yesterdayFrom(dateString: string): string {
    const parts = dateString.split('-');
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    d.setDate(d.getDate() - 1);
    return d.toLocaleDateString('sv');
}

// ─── State shape ─────────────────────────────────────────────────────────────

interface ScalarState {
    // Navigation
    activeCategory: string;
    activeMode: GameMode;

    // Nested slot storage (persisted), keyed by category
    daily: Record<string, GameSlot>;
    freeplay: Record<string, GameSlot>;

    // Streak tracking (persisted), keyed by category
    dailyMeta: Record<string, DailyMeta>;

    // ── Flat projection of the active slot ──
    // These mirror the original flat API so all existing components work unchanged.
    targetEntity: Entity;
    guesses: GuessResult[];
    gameStatus: GameStatus;
    moves: number;
    credits: number;
    majorHintAttributes: string[];

    // Actions
    setActiveCategory: (category: string) => void;
    setActiveMode: (mode: GameMode) => void;
    initializeApp: () => void;
    submitGuess: (guess: Entity) => void;
    revealMajorHint: (attributeIds: string | string[]) => void;
    revealAnswer: () => void;
    resetGame: () => void;
    startChallengeGame: (category: string, entity: Entity) => void;
}

// ─── Build initial state ──────────────────────────────────────────────────────

const _today = getLocalDateString();
const _defaultEntities = gameData.categories[DEFAULT_CATEGORY] ?? [];
const _defaultDailyEntity = getDailyEntity(DEFAULT_CATEGORY, _defaultEntities, _today);

const _defaultDailySlot: GameSlot = {
    ...makeDefaultSlot(_defaultDailyEntity),
    dailyDate: _today,
};

const _defaultFreeplaySlot: GameSlot = makeDefaultSlot(
    getRandomTarget(gameData, DEFAULT_CATEGORY),
);

// ─── Store ───────────────────────────────────────────────────────────────────

export const useGameStore = create<ScalarState>()(
    persist(
        (set, get) => {
            // Internal: update streak on daily win.
            const _updateDailyStreak = (category: string, today: string) => {
                const state = get();
                const meta: DailyMeta = state.dailyMeta[category] ?? {
                    lastCompletedDate: null,
                    currentStreak: 0,
                    maxStreak: 0,
                };

                if (meta.lastCompletedDate === today) return; // already credited today

                const newStreak =
                    meta.lastCompletedDate === yesterdayFrom(today)
                        ? meta.currentStreak + 1
                        : 1;
                const newMax = Math.max(newStreak, meta.maxStreak);

                set({
                    dailyMeta: {
                        ...state.dailyMeta,
                        [category]: {
                            lastCompletedDate: today,
                            currentStreak: newStreak,
                            maxStreak: newMax,
                        },
                    },
                });
            };

            return {
                // ── Initial state ──
                activeCategory: DEFAULT_CATEGORY,
                activeMode: 'daily',
                daily: { [DEFAULT_CATEGORY]: _defaultDailySlot },
                freeplay: { [DEFAULT_CATEGORY]: _defaultFreeplaySlot },
                dailyMeta: {},
                ...syncFlat(_defaultDailySlot),

                // ── Actions ──

                setActiveMode: (mode: GameMode) => {
                    const state = get();
                    if (mode === state.activeMode) return;

                    const today = getLocalDateString();
                    const slot =
                        mode === 'daily'
                            ? getOrInitDailySlot(state.daily, state.activeCategory, today)
                            : getOrInitFreeplaySlot(state.freeplay, state.activeCategory);

                    set({
                        activeMode: mode,
                        ...writeSlot(state, mode, state.activeCategory, slot),
                    });
                },

                setActiveCategory: (category: string) => {
                    const state = get();
                    if (!gameData.categories[category] || category === state.activeCategory) return;

                    const today = getLocalDateString();
                    const slot =
                        state.activeMode === 'daily'
                            ? getOrInitDailySlot(state.daily, category, today)
                            : getOrInitFreeplaySlot(state.freeplay, category);

                    set({
                        activeCategory: category,
                        ...writeSlot(state, state.activeMode, category, slot),
                    });
                },

                /**
                 * Called on app mount (and after onRehydrateStorage).
                 * Handles day rollovers and ensures flat state matches the active slot.
                 */
                initializeApp: () => {
                    const state = get();
                    const today = getLocalDateString();
                    const { activeMode, activeCategory } = state;

                    if (activeMode === 'daily') {
                        const existing = state.daily[activeCategory];
                        if (!existing || existing.dailyDate !== today) {
                            // New day — reinitialise the daily slot
                            const newSlot = getOrInitDailySlot(state.daily, activeCategory, today);
                            set({
                                daily: { ...state.daily, [activeCategory]: newSlot },
                                ...syncFlat(newSlot),
                            });
                        } else {
                            // Slot is current — sync flat from it (safety measure)
                            set(syncFlat(existing));
                        }
                        return;
                    }

                    // Freeplay: ensure slot exists and sync flat
                    const fpSlot = state.freeplay[activeCategory];
                    if (!fpSlot) {
                        const newSlot = makeDefaultSlot(getRandomTarget(gameData, activeCategory));
                        set({
                            freeplay: { ...state.freeplay, [activeCategory]: newSlot },
                            ...syncFlat(newSlot),
                        });
                    } else {
                        set(syncFlat(fpSlot));
                    }
                },

                submitGuess: (guess: Entity) => {
                    const state = get();
                    const { activeMode, activeCategory, guesses, moves } = state;

                    if (state.gameStatus !== 'PLAYING') return;

                    const currentSchema = gameData.schemaConfig[activeCategory];
                    if (!currentSchema) {
                        console.error('Missing schema for category:', activeCategory);
                        return;
                    }

                    const feedback = getFeedback(state.targetEntity, guess, currentSchema);
                    const newGuesses: GuessResult[] = [...guesses, { guess, feedback }];
                    const newMoves = moves + 1;
                    const newStatus: GameStatus = checkWinCondition(feedback)
                        ? 'SOLVED'
                        : 'PLAYING';

                    const existingSlot = state[activeMode][activeCategory];
                    const updatedSlot: GameSlot = {
                        ...existingSlot,
                        guesses: newGuesses,
                        moves: newMoves,
                        gameStatus: newStatus,
                    };

                    set(writeSlot(state, activeMode, activeCategory, updatedSlot));

                    if (newStatus === 'SOLVED') {
                        if (activeMode === 'daily') {
                            _updateDailyStreak(activeCategory, getLocalDateString());
                        }
                        const { credits, majorHintAttributes } = get();
                        trackGameEvent('game_completed', {
                            category: activeCategory,
                            moves: newMoves,
                            used_hints: credits < DEFAULT_CREDITS || majorHintAttributes.length > 0,
                        });
                    }
                },

                revealMajorHint: (attributeIds: string | string[]) => {
                    const state = get();
                    const { activeMode, activeCategory, majorHintAttributes, moves, credits } = state;

                    if (state.gameStatus !== 'PLAYING') return;

                    const ids = Array.isArray(attributeIds) ? attributeIds : [attributeIds];
                    const newIds = ids.filter(id => !majorHintAttributes.includes(id));
                    if (newIds.length === 0) return;

                    const allHintAttrs = [...majorHintAttributes, ...newIds];
                    const existingSlot = state[activeMode][activeCategory];

                    let updatedSlot: GameSlot;
                    if (credits > 0) {
                        updatedSlot = {
                            ...existingSlot,
                            majorHintAttributes: allHintAttrs,
                            credits: credits - 1,
                        };
                    } else {
                        updatedSlot = {
                            ...existingSlot,
                            majorHintAttributes: allHintAttrs,
                            moves: moves + HINT_MOVE_COST,
                        };
                    }

                    set(writeSlot(state, activeMode, activeCategory, updatedSlot));
                },

                revealAnswer: () => {
                    const state = get();
                    const { activeMode, activeCategory } = state;
                    if (state.gameStatus !== 'PLAYING') return;

                    const updatedSlot: GameSlot = {
                        ...state[activeMode][activeCategory],
                        gameStatus: 'REVEALED',
                    };

                    // Daily forfeit: dailyMeta is NOT updated — streak stalls but does not break.
                    set(writeSlot(state, activeMode, activeCategory, updatedSlot));
                },

                resetGame: () => {
                    const state = get();
                    const { activeMode, activeCategory } = state;

                    // Daily resets are not permitted.
                    if (activeMode === 'daily') return;

                    const newSlot = makeDefaultSlot(getRandomTarget(gameData, activeCategory));
                    set(writeSlot(state, 'freeplay', activeCategory, newSlot));
                },

                startChallengeGame: (category: string, entity: Entity) => {
                    const state = get();
                    const newSlot = makeDefaultSlot(entity);
                    set({
                        activeMode: 'freeplay',
                        activeCategory: category,
                        freeplay: { ...state.freeplay, [category]: newSlot },
                        ...syncFlat(newSlot),
                    });
                },
            };
        },
        {
            name: 'scalar-game-storage',
            storage: createJSONStorage(() => localStorage),
            version: STORE_VERSION,
            migrate: (_persistedState, version) => {
                if (version < STORE_VERSION) {
                    const today = getLocalDateString();
                    const dailyEntities = gameData.categories[DEFAULT_CATEGORY] ?? [];
                    const dailyEntity = getDailyEntity(DEFAULT_CATEGORY, dailyEntities, today);
                    const dailySlot: GameSlot = {
                        ...makeDefaultSlot(dailyEntity),
                        dailyDate: today,
                    };
                    const freeplaySlot = makeDefaultSlot(getRandomTarget(gameData, DEFAULT_CATEGORY));
                    return {
                        activeCategory: DEFAULT_CATEGORY,
                        activeMode: 'daily' as const,
                        daily: { [DEFAULT_CATEGORY]: dailySlot },
                        freeplay: { [DEFAULT_CATEGORY]: freeplaySlot },
                        dailyMeta: {},
                        ...syncFlat(dailySlot),
                    };
                }
                return _persistedState as ScalarState;
            },
            onRehydrateStorage: () => (state) => {
                // After hydration: handle day rollovers and sync flat state.
                state?.initializeApp();
            },
        }
    )
);
