// import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
// import { cn } from '../utils/cn';
import gameDataRaw from '../assets/data/gameData.json';
import { GridRow } from './GridRow';

const gameData = gameDataRaw as any; // Type assertion
// const ROWS = 6; // REMOVED fixed rows

export function GameGrid() {
    const guesses = useGameStore(state => state.guesses);
    const maxGuesses = useGameStore(state => state.maxGuesses);
    const activeCategory = useGameStore(state => state.activeCategory);
    const deepScanResult = useGameStore(state => state.deepScanResult);
    const performDeepScan = useGameStore(state => state.performDeepScan);
    const clearDeepScan = useGameStore(state => state.clearDeepScan);

    const scannedAttributes = useGameStore(state => state.scannedAttributes);
    const gameMode = useGameStore(state => state.gameMode);

    // Dynamic Row Count
    // For EASIER (unlimited), show guesses + 1 empty row (min 6 for aesthetics)
    // For others, show exactly maxGuesses rows
    const totalRows = gameMode === 'EASIER'
        ? Math.max(guesses.length + 1, 6)
        : maxGuesses;



    // Dynamic Schema Handling
    const currentSchema = gameData.schema[activeCategory];
    // Filter out 'id' and 'name' (name is handled specially as col 0).
    const allKeys = Object.keys(currentSchema);
    // User requested dynamic columns for active schema, e.g. Name, Population, Area, Driving Side.
    // We only exclude 'id' and 'name'. 'subregion' was executed before but usually is part of the hint data.
    // If 'subregion' is not desired it should be filtered, but based on "render a cell for every key", I'll include it.
    // The prompt only explicitly mentioned excluding Name (handled separately).
    // const displayKeys = allKeys.filter(k => k !== 'id' && k !== 'name' && k !== 'subregion');
    // Added subregion back to exclusion if it is not desired, but "Driving Side" suggests broadly including fields.
    // Let's stick to the previous exclusion of 'subregion' strictly if it wasn't requested, OR include it.
    // "e.g., Name, Population, Area, Driving Side" -> These are the visible ones.
    // I will exclude 'subregion' for now as it might be a text hint rather than a comparison field, or just clutter.
    // Re-reading: "The Row should render a cell for every key in the active Schema".
    // I'll assume standard excludes: id, name.

    // Actually, let's keep it simple: Filter only id and name.
    // If subregion causes issues I can filter it later.
    const finalDisplayKeys = allKeys.filter(k => k !== 'id' && k !== 'name');

    return (
        <div className="w-full mx-auto p-4">
            {/* Headers */}
            <div className="flex w-full space-x-2 mb-1">
                <div className="flex-[1.5] text-center font-bold font-mono text-sm uppercase text-charcoal dark:text-paper-white bg-gray-100 dark:bg-charcoal/20 border-b-2 border-charcoal/50 pb-1">
                    NAME
                </div>
                {finalDisplayKeys.map((key) => {
                    const fieldDef = currentSchema[key];
                    const isNumeric = fieldDef?.type === 'INT' || fieldDef?.type === 'FLOAT' || fieldDef?.type === 'CURRENCY';
                    const isScanned = scannedAttributes.includes(key);
                    // const canScan = !isScanned && isNumeric && maxGuesses > 2 && guesses.length < maxGuesses; // OLD LOGIC
                    // New logic: Can scan if not scanned and is numeric. No cost.
                    const canScan = !isScanned && isNumeric;

                    // Handler for Deep Scan
                    const handleHeaderClick = () => {
                        if (isScanned) return; // Already scanned

                        if (!isNumeric) {
                            // Maybe toast "Cannot scan non-numeric attribute"
                            return;
                        }

                        // COST CHECK REMOVED
                        // if (maxGuesses <= 2) { ... }

                        performDeepScan(key);
                    };

                    return (
                        <div
                            key={key}
                            onClick={handleHeaderClick}
                            className={`flex-1 text-center font-bold font-mono text-xs sm:text-sm uppercase flex items-center justify-center transition-all duration-200 select-none border-b-2 pb-1
                                ${isScanned
                                    ? 'bg-charcoal text-paper-white border-charcoal dark:bg-paper-white dark:text-charcoal'
                                    : 'text-charcoal dark:text-paper-white border-charcoal/50 bg-gray-100 dark:bg-charcoal/20'
                                }
                                ${canScan ? 'cursor-pointer hover:bg-charcoal hover:text-white' : 'cursor-default'}
                                ${!isNumeric && !isScanned ? '' : ''}
                            `}
                            title={isScanned ? "Deep Scan Complete" : (canScan ? "Click to Deep Scan" : "Scan Unavailable")}
                        >
                            {fieldDef?.label || key}
                            {isScanned && <span className="ml-1 text-[10px]">✓</span>}
                            {!isScanned && isNumeric && canScan && <span className="ml-1 text-[10px] opacity-50">?</span>}
                        </div>
                    );
                })}
            </div>

            {/* Grid Rows */}
            <div className="flex flex-col">
                {Array.from({ length: totalRows }).map((_, rowIndex) => {
                    const guessData = guesses[rowIndex];
                    // const isBlocked = rowIndex >= maxGuesses; // Handled by GridRow logic if needed, but styling is via isEmpty

                    return (
                        <GridRow
                            key={rowIndex}
                            guess={guessData?.guess}
                            feedback={guessData?.feedback}
                            schema={currentSchema}
                            displayKeys={finalDisplayKeys}
                            className={!guessData ? "opacity-100" : ""}
                        />
                    );
                })}
            </div>

            {/* Only Result Modal remains, cleaner style */}
            {deepScanResult?.visible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
                    <div className="bg-paper-white border-4 border-charcoal p-8 w-full max-w-sm shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center">
                        <h3 className="font-mono text-xl font-black mb-4 uppercase tracking-tighter border-b-2 border-charcoal w-full text-center pb-2">SCAN RESULT</h3>
                        <p className="font-mono text-center mb-6 text-lg">
                            {deepScanResult.attribute} is in the <br />
                            <span className="font-black text-3xl">TOP {deepScanResult.percentile.toFixed(0)}%</span>
                        </p>
                        <button
                            onClick={clearDeepScan}
                            className="w-full py-3 bg-charcoal text-white font-mono font-bold text-lg hover:bg-black transition-transform active:scale-95"
                        >
                            ACKNOWLEDGE
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
