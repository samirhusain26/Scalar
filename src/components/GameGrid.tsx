import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import gameDataRaw from '../assets/data/gameData.json';
import type { GameData } from '../types';
import { getDisplayColumns } from '../utils/schemaParser';
import { GuessCard } from './GuessCard';
import { MajorHintModal } from './MajorHintModal';

const gameData = gameDataRaw as unknown as GameData;

export function GameGrid() {
    const guesses = useGameStore(state => state.guesses);
    const activeCategory = useGameStore(state => state.activeCategory);
    const majorHintAttributes = useGameStore(state => state.majorHintAttributes);
    const targetEntity = useGameStore(state => state.targetEntity);
    const gameStatus = useGameStore(state => state.gameStatus);
    const credits = useGameStore(state => state.credits);
    const revealMajorHint = useGameStore(state => state.revealMajorHint);

    const [pendingMajorHint, setPendingMajorHint] = useState<string | string[] | null>(null);

    const currentSchema = gameData.schemaConfig[activeCategory];
    const displayFields = getDisplayColumns(currentSchema);

    // Most recent guess first
    const reversedGuesses = [...guesses].reverse();

    const handleConfirmMajorHint = () => {
        if (pendingMajorHint) {
            revealMajorHint(pendingMajorHint);
            setPendingMajorHint(null);
        }
    };

    return (
        <div className="w-full mx-auto p-4">
            {guesses.length === 0 ? (
                <div className="text-center py-8 font-mono text-charcoal/40 text-sm">
                    Make a guess to get started
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
                    {reversedGuesses.map((guessData, idx) => (
                        <GuessCard
                            key={guesses.length - 1 - idx}
                            guess={guessData.guess}
                            feedback={guessData.feedback}
                            displayFields={displayFields}
                            majorHintAttributes={majorHintAttributes}
                            targetEntity={targetEntity}
                            guessIndex={guesses.length - idx}
                            gameStatus={gameStatus}
                            onRevealMajorHint={(key) => setPendingMajorHint(key)}
                        />
                    ))}
                </div>
            )}

            <MajorHintModal
                isOpen={pendingMajorHint !== null}
                attributeLabel={pendingMajorHint
                    ? (Array.isArray(pendingMajorHint)
                        ? 'Location'
                        : (displayFields.find(f => f.attributeKey === pendingMajorHint)?.displayLabel || pendingMajorHint))
                    : ''}
                credits={credits}
                onConfirm={handleConfirmMajorHint}
                onCancel={() => setPendingMajorHint(null)}
            />
        </div>
    );
}
