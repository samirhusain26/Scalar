import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Entity, Feedback, GameData, GameMode } from '../types';
import {
    getFeedback,
    getRandomTarget,
    getGuessesForMode,
    checkWinCondition,
    calculateDeepScan
} from '../utils/gameLogic';
import gameDataRaw from '../assets/data/gameData.json';

// Cast to ensure type safety with our interfaces
const gameData = gameDataRaw as unknown as GameData;

interface GuessResult {
    guess: Entity;
    feedback: Record<string, Feedback>;
}

interface DeepScanResult {
    attribute: string;
    percentile: number;
    visible: boolean;
}

interface GameState {
    activeCategory: string;
    targetEntity: Entity;
    guesses: GuessResult[];
    gameStatus: 'PLAYING' | 'WON' | 'LOST';
    gameMode: GameMode;
    maxGuesses: number;
    deepScanResult: DeepScanResult | null;
    setActiveCategory: (category: string) => void;
    setGameMode: (mode: GameMode) => void;
    submitGuess: (guess: Entity) => void;
    performDeepScan: (attribute: string) => void;
    resetGame: () => void;
    clearDeepScan: () => void;
    scannedAttributes: string[];
}

export const useGameStore = create<GameState>()(
    persist(
        (set, get) => ({
            activeCategory: 'countries',
            targetEntity: getRandomTarget(gameData, 'countries'),
            guesses: [],
            gameStatus: 'PLAYING',
            gameMode: 'REGULAR',
            maxGuesses: 10,
            deepScanResult: null,
            scannedAttributes: [],

            setActiveCategory: (category: string) => {
                if (gameData.categories[category]) {
                    set({
                        activeCategory: category,
                        targetEntity: getRandomTarget(gameData, category),
                        guesses: [],
                        gameStatus: 'PLAYING',
                        maxGuesses: getGuessesForMode(get().gameMode),
                        deepScanResult: null,
                        scannedAttributes: []
                    });
                }
            },

            setGameMode: (mode: GameMode) => {
                const { activeCategory } = get();
                set({
                    gameMode: mode,
                    maxGuesses: getGuessesForMode(mode),
                    guesses: [],
                    gameStatus: 'PLAYING',
                    deepScanResult: null,
                    scannedAttributes: [],
                    targetEntity: getRandomTarget(gameData, activeCategory)
                });
            },

            submitGuess: (guess: Entity) => {
                const { targetEntity, guesses, maxGuesses, gameStatus, activeCategory } = get();

                if (gameStatus !== 'PLAYING') return;

                // Safety check for max guesses (though UI should prevent it, logic must be robust)
                if (guesses.length >= maxGuesses) {
                    set({ gameStatus: 'LOST' });
                    return;
                }

                const currentSchema = gameData.schema[activeCategory];
                if (!currentSchema) {
                    console.error('Missing schema for category:', activeCategory);
                    return;
                }

                const feedback = getFeedback(targetEntity, guess, currentSchema);
                const newGuesses = [...guesses, { guess, feedback }];

                let newStatus: 'PLAYING' | 'WON' | 'LOST' = 'PLAYING';

                if (checkWinCondition(feedback)) {
                    newStatus = 'WON';
                } else if (newGuesses.length >= maxGuesses) {
                    newStatus = 'LOST';
                }

                set({
                    guesses: newGuesses,
                    gameStatus: newStatus
                });
            },

            performDeepScan: (attribute: string) => {
                const { targetEntity, gameStatus, activeCategory, scannedAttributes } = get();

                // Prevent re-scanning
                if (scannedAttributes.includes(attribute)) return;
                if (gameStatus !== 'PLAYING') return;

                const result = calculateDeepScan(
                    gameData,
                    activeCategory,
                    attribute,
                    targetEntity[attribute] as string | number // Casting as value extraction is dynamic
                );

                if (result) {
                    set({
                        deepScanResult: {
                            attribute: result.attributeLabel,
                            percentile: result.percentile,
                            visible: true
                        },
                        scannedAttributes: [...scannedAttributes, attribute],
                        gameStatus: 'PLAYING'
                    });
                }
            },

            clearDeepScan: () => set({ deepScanResult: null }),

            resetGame: () => {
                const { activeCategory, gameMode } = get();
                set({
                    targetEntity: getRandomTarget(gameData, activeCategory),
                    guesses: [],
                    gameStatus: 'PLAYING',
                    maxGuesses: getGuessesForMode(gameMode),
                    deepScanResult: null,
                    scannedAttributes: []
                });
            }
        }),
        {
            name: 'scalar-game-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
