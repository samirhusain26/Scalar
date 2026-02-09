import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Entity, Feedback, GameData, GameStatus } from '../types';
import {
    getFeedback,
    getRandomTarget,
    checkWinCondition,
} from '../utils/gameLogic';
import { trackGameEvent } from '../utils/analytics';
import gameDataRaw from '../assets/data/gameData.json';

const gameData = gameDataRaw as unknown as GameData;

// Bump this when schema changes to clear stale localStorage.
const STORE_VERSION = 12;

const DEFAULT_CATEGORY = 'countries';
const DEFAULT_CREDITS = 3;
const HINT_MOVE_COST = 3;

interface GuessResult {
    guess: Entity;
    feedback: Record<string, Feedback>;
}

interface GameState {
    activeCategory: string;
    targetEntity: Entity;
    guesses: GuessResult[];
    gameStatus: GameStatus;
    moves: number;
    credits: number;
    majorHintAttributes: string[];

    setActiveCategory: (category: string) => void;
    submitGuess: (guess: Entity) => void;
    revealMajorHint: (attributeIds: string | string[]) => void;
    revealAnswer: () => void;
    resetGame: () => void;
    startChallengeGame: (category: string, entity: Entity) => void;
}

export const useGameStore = create<GameState>()(
    persist(
        (set, get) => ({
            activeCategory: DEFAULT_CATEGORY,
            targetEntity: getRandomTarget(gameData, DEFAULT_CATEGORY),
            guesses: [],
            gameStatus: 'PLAYING',
            moves: 0,
            credits: DEFAULT_CREDITS,
            majorHintAttributes: [],

            setActiveCategory: (category: string) => {
                if (gameData.categories[category]) {
                    set({
                        activeCategory: category,
                        targetEntity: getRandomTarget(gameData, category),
                        guesses: [],
                        gameStatus: 'PLAYING',
                        moves: 0,
                        credits: DEFAULT_CREDITS,
                        majorHintAttributes: [],
                    });
                }
            },

            submitGuess: (guess: Entity) => {
                const { targetEntity, guesses, gameStatus, activeCategory, moves } = get();

                if (gameStatus !== 'PLAYING') return;

                const currentSchema = gameData.schemaConfig[activeCategory];
                if (!currentSchema) {
                    console.error('Missing schema for category:', activeCategory);
                    return;
                }

                const feedback = getFeedback(targetEntity, guess, currentSchema);
                const newGuesses = [...guesses, { guess, feedback }];
                const newMoves = moves + 1;

                const newStatus: GameStatus = checkWinCondition(feedback)
                    ? 'SOLVED'
                    : 'PLAYING';

                set({
                    guesses: newGuesses,
                    gameStatus: newStatus,
                    moves: newMoves,
                });

                if (newStatus === 'SOLVED') {
                    const { credits, majorHintAttributes } = get();
                    trackGameEvent('game_completed', {
                        category: activeCategory,
                        moves: newMoves,
                        used_hints: credits < DEFAULT_CREDITS || majorHintAttributes.length > 0,
                    });
                }
            },

            revealMajorHint: (attributeIds: string | string[]) => {
                const { majorHintAttributes, gameStatus, moves, credits } = get();

                if (gameStatus !== 'PLAYING') return;

                const ids = Array.isArray(attributeIds) ? attributeIds : [attributeIds];
                const newIds = ids.filter(id => !majorHintAttributes.includes(id));
                if (newIds.length === 0) return;

                if (credits > 0) {
                    set({
                        majorHintAttributes: [...majorHintAttributes, ...newIds],
                        credits: credits - 1,
                    });
                } else {
                    set({
                        majorHintAttributes: [...majorHintAttributes, ...newIds],
                        moves: moves + HINT_MOVE_COST,
                    });
                }
            },

            revealAnswer: () => {
                const { gameStatus, activeCategory } = get();
                if (gameStatus !== 'PLAYING') return;
                const entityCount = (gameData.categories[activeCategory] || []).length;
                set({ gameStatus: 'REVEALED', moves: entityCount });
            },

            resetGame: () => {
                const { activeCategory } = get();
                set({
                    targetEntity: getRandomTarget(gameData, activeCategory),
                    guesses: [],
                    gameStatus: 'PLAYING',
                    moves: 0,
                    credits: DEFAULT_CREDITS,
                    majorHintAttributes: [],
                });
            },

            startChallengeGame: (category: string, entity: Entity) => {
                set({
                    activeCategory: category,
                    targetEntity: entity,
                    guesses: [],
                    gameStatus: 'PLAYING',
                    moves: 0,
                    credits: DEFAULT_CREDITS,
                    majorHintAttributes: [],
                });
            },
        }),
        {
            name: 'scalar-game-storage',
            storage: createJSONStorage(() => localStorage),
            version: STORE_VERSION,
            migrate: (_persistedState, version) => {
                if (version < STORE_VERSION) {
                    return {
                        activeCategory: DEFAULT_CATEGORY,
                        targetEntity: getRandomTarget(gameData, DEFAULT_CATEGORY),
                        guesses: [],
                        gameStatus: 'PLAYING' as const,
                        moves: 0,
                        credits: DEFAULT_CREDITS,
                        majorHintAttributes: [],
                    };
                }
                return _persistedState as GameState;
            },
        }
    )
);
