import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import gameDataRaw from '../assets/data/gameData.json';
import type { GameData } from '../types';
import { getDisplayColumns } from '../utils/schemaParser';
import { GridRow } from './GridRow';
import { GridHeader } from './GridHeader';
import { MobileGuessCard } from './MobileGuessCard';
import { FoldedHintModal } from './FoldedHintModal';

const gameData = gameDataRaw as unknown as GameData;

export function GameGrid() {
    const guesses = useGameStore(state => state.guesses);
    const activeCategory = useGameStore(state => state.activeCategory);
    const columnVisibility = useGameStore(state => state.columnVisibility);
    const majorHintAttributes = useGameStore(state => state.majorHintAttributes);
    const revealedFoldedAttributes = useGameStore(state => state.revealedFoldedAttributes);
    const targetEntity = useGameStore(state => state.targetEntity);
    const gameStatus = useGameStore(state => state.gameStatus);
    const revealFoldedAttribute = useGameStore(state => state.revealFoldedAttribute);

    const [pendingFoldedReveal, setPendingFoldedReveal] = useState<string | null>(null);

    const currentSchema = gameData.schemaConfig[activeCategory];
    const displayFields = getDisplayColumns(currentSchema);

    // Dynamic row count: always show at least 6 rows
    const totalRows = Math.max(guesses.length + 1, 6);

    const handleConfirmFoldedReveal = () => {
        if (pendingFoldedReveal) {
            revealFoldedAttribute(pendingFoldedReveal);
            setPendingFoldedReveal(null);
        }
    };

    return (
        <div className="w-full mx-auto p-4">
            {/* Desktop: Table View */}
            <div className="hidden md:block">
                <GridHeader
                    displayFields={displayFields}
                    columnVisibility={columnVisibility}
                    majorHintAttributes={majorHintAttributes}
                    revealedFoldedAttributes={revealedFoldedAttributes}
                    targetEntity={targetEntity}
                    gameStatus={gameStatus}
                />

                <div className="flex flex-col">
                    {Array.from({ length: totalRows }).map((_, rowIndex) => {
                        const guessData = guesses[rowIndex];

                        return (
                            <GridRow
                                key={rowIndex}
                                guess={guessData?.guess}
                                feedback={guessData?.feedback}
                                displayFields={displayFields}
                                columnVisibility={columnVisibility}
                                revealedFoldedAttributes={revealedFoldedAttributes}
                                className={!guessData ? "opacity-100" : ""}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Mobile: Card View */}
            <div className="block md:hidden">
                {guesses.length === 0 && (
                    <div className="text-center py-8 font-mono text-charcoal/40 text-sm">
                        Make a guess to get started
                    </div>
                )}

                {guesses.map((guessData, idx) => (
                    <MobileGuessCard
                        key={idx}
                        guess={guessData.guess}
                        feedback={guessData.feedback}
                        displayFields={displayFields}
                        columnVisibility={columnVisibility}
                        revealedFoldedAttributes={revealedFoldedAttributes}
                        guessIndex={idx}
                        gameStatus={gameStatus}
                        onRevealFolded={(key) => setPendingFoldedReveal(key)}
                    />
                ))}

                <FoldedHintModal
                    isOpen={pendingFoldedReveal !== null}
                    attributeLabel={pendingFoldedReveal
                        ? (displayFields.find(f => f.attributeKey === pendingFoldedReveal)?.displayLabel || pendingFoldedReveal)
                        : ''}
                    onConfirm={handleConfirmFoldedReveal}
                    onCancel={() => setPendingFoldedReveal(null)}
                />
            </div>
        </div>
    );
}
