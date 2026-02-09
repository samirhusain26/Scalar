import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Entity, Feedback, GameData, GameStatus } from '../types';
import {
    getFeedback,
    getRandomTarget,
    checkWinCondition,
    getInitialColumnVisibility
} from '../utils/gameLogic';
import gameDataRaw from '../assets/data/gameData.json';

// Cast to ensure type safety with our interfaces
const gameData = gameDataRaw as unknown as GameData;

// Bump this when schema changes to clear stale localStorage.
const STORE_VERSION = 3;

interface GuessResult {
    guess: Entity;
    feedback: Record<string, Feedback>;
}

interface GameState {
    activeCategory: string;
    targetEntity: Entity;
    guesses: GuessResult[];
    gameStatus: GameStatus;
    score: number;
    par: number;
    columnVisibility: Record<string, boolean>;
    majorHintAttributes: string[];

    setActiveCategory: (category: string) => void;
    submitGuess: (guess: Entity) => void;
    revealColumn: (attributeId: string) => void;
    revealMajorHint: (attributeId: string) => void;
    revealAnswer: () => void;
    resetGame: () => void;
}

export const useGameStore = create<GameState>()(
    persist(
        (set, get) => ({
            activeCategory: 'countries',
            targetEntity: getRandomTarget(gameData, 'countries'),
            guesses: [],
            gameStatus: 'PLAYING',
            score: 0,
            par: 4,
            columnVisibility: getInitialColumnVisibility(
                gameData.schema['countries']
            ),
            majorHintAttributes: [],

            setActiveCategory: (category: string) => {
                if (gameData.categories[category]) {
                    set({
                        activeCategory: category,
                        targetEntity: getRandomTarget(gameData, category),
                        guesses: [],
                        gameStatus: 'PLAYING',
                        score: 0,
                        par: 4,
                        columnVisibility: getInitialColumnVisibility(
                            gameData.schema[category]
                        ),
                        majorHintAttributes: [],
                    });
                }
            },

            submitGuess: (guess: Entity) => {
                const { targetEntity, guesses, gameStatus, activeCategory, score } = get();

                if (gameStatus !== 'PLAYING') return;

                const currentSchema = gameData.schema[activeCategory];
                if (!currentSchema) {
                    console.error('Missing schema for category:', activeCategory);
                    return;
                }

                const feedback = getFeedback(targetEntity, guess, currentSchema);
                const newGuesses = [...guesses, { guess, feedback }];
                const newScore = score + 1;

                const newStatus: GameStatus = checkWinCondition(feedback)
                    ? 'SOLVED'
                    : 'PLAYING';

                set({
                    guesses: newGuesses,
                    gameStatus: newStatus,
                    score: newScore,
                });
            },

            revealColumn: (attributeId: string) => {
                const { columnVisibility, gameStatus, score } = get();

                if (gameStatus !== 'PLAYING') return;
                if (columnVisibility[attributeId]) return; // already visible

                set({
                    columnVisibility: {
                        ...columnVisibility,
                        [attributeId]: true,
                    },
                    score: score + 1,
                });
            },

            revealMajorHint: (attributeId: string) => {
                const { majorHintAttributes, gameStatus, score } = get();

                if (gameStatus !== 'PLAYING') return;
                if (majorHintAttributes.includes(attributeId)) return; // already revealed

                set({
                    majorHintAttributes: [...majorHintAttributes, attributeId],
                    score: score + 5,
                });
            },

            revealAnswer: () => {
                const { gameStatus } = get();
                if (gameStatus !== 'PLAYING') return;
                set({ gameStatus: 'REVEALED' });
            },

            resetGame: () => {
                const { activeCategory } = get();
                set({
                    targetEntity: getRandomTarget(gameData, activeCategory),
                    guesses: [],
                    gameStatus: 'PLAYING',
                    score: 0,
                    par: 4,
                    columnVisibility: getInitialColumnVisibility(
                        gameData.schema[activeCategory]
                    ),
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
                        activeCategory: 'countries',
                        targetEntity: getRandomTarget(gameData, 'countries'),
                        guesses: [],
                        gameStatus: 'PLAYING' as const,
                        score: 0,
                        par: 4,
                        columnVisibility: getInitialColumnVisibility(
                            gameData.schema['countries']
                        ),
                        majorHintAttributes: [],
                    };
                }
                return _persistedState as GameState;
            },
        }
    )
);
