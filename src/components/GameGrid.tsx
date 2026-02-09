import { useGameStore } from '../store/gameStore';
import gameDataRaw from '../assets/data/gameData.json';
import type { GameData } from '../types';
import { GridRow } from './GridRow';
import { GridHeader } from './GridHeader';

const gameData = gameDataRaw as unknown as GameData;

export function GameGrid() {
    const guesses = useGameStore(state => state.guesses);
    const activeCategory = useGameStore(state => state.activeCategory);
    const columnVisibility = useGameStore(state => state.columnVisibility);
    const majorHintAttributes = useGameStore(state => state.majorHintAttributes);
    const targetEntity = useGameStore(state => state.targetEntity);
    const gameStatus = useGameStore(state => state.gameStatus);

    // Dynamic Row Count: always show at least 6 rows
    const totalRows = Math.max(guesses.length + 1, 6);

    // Dynamic Schema Handling
    const currentSchema = gameData.schema[activeCategory];
    const allKeys = Object.keys(currentSchema);
    // Show ALL columns (visible + hidden) — excluding id and name
    const allDisplayKeys = allKeys.filter(k => k !== 'id' && k !== 'name');

    return (
        <div className="w-full mx-auto p-4">
            {/* Headers */}
            <GridHeader
                displayKeys={allDisplayKeys}
                schema={currentSchema}
                columnVisibility={columnVisibility}
                majorHintAttributes={majorHintAttributes}
                targetEntity={targetEntity}
                gameStatus={gameStatus}
            />

            {/* Grid Rows */}
            <div className="flex flex-col">
                {Array.from({ length: totalRows }).map((_, rowIndex) => {
                    const guessData = guesses[rowIndex];

                    return (
                        <GridRow
                            key={rowIndex}
                            guess={guessData?.guess}
                            feedback={guessData?.feedback}
                            schema={currentSchema}
                            displayKeys={allDisplayKeys}
                            columnVisibility={columnVisibility}
                            className={!guessData ? "opacity-100" : ""}
                        />
                    );
                })}
            </div>
        </div>
    );
}
