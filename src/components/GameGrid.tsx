import { useGameStore } from '../store/gameStore';
import gameDataRaw from '../assets/data/gameData.json';
import type { GameData } from '../types';
import { getDisplayColumns } from '../utils/schemaParser';
import { GridRow } from './GridRow';
import { GridHeader } from './GridHeader';

const gameData = gameDataRaw as unknown as GameData;

export function GameGrid() {
    const guesses = useGameStore(state => state.guesses);
    const activeCategory = useGameStore(state => state.activeCategory);
    const columnVisibility = useGameStore(state => state.columnVisibility);
    const majorHintAttributes = useGameStore(state => state.majorHintAttributes);
    const revealedFoldedAttributes = useGameStore(state => state.revealedFoldedAttributes);
    const targetEntity = useGameStore(state => state.targetEntity);
    const gameStatus = useGameStore(state => state.gameStatus);

    const currentSchema = gameData.schemaConfig[activeCategory];
    const displayFields = getDisplayColumns(currentSchema);

    // Dynamic row count: always show at least 6 rows
    const totalRows = Math.max(guesses.length + 1, 6);

    return (
        <div className="w-full mx-auto p-4">
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
    );
}
