import { Lock } from 'lucide-react';
import type { SchemaField, Entity, Feedback, GameStatus } from '../types';
import { formatNumber } from '../utils/formatters';
import { cn } from '../utils/cn';
import {
    getDistanceGradientClass,
    getCategoryMatchClass,
    getStandardStatusClass,
} from './GridCell';

interface MobileGuessCardProps {
    guess: Entity;
    feedback: Record<string, Feedback>;
    displayFields: SchemaField[];
    columnVisibility: Record<string, boolean>;
    revealedFoldedAttributes: string[];
    guessIndex: number;
    gameStatus: GameStatus;
    onRevealFolded: (attributeKey: string) => void;
}

export function MobileGuessCard({
    guess,
    feedback,
    displayFields,
    columnVisibility,
    revealedFoldedAttributes,
    guessIndex,
    gameStatus,
    onRevealFolded,
}: MobileGuessCardProps) {
    const isPlaying = gameStatus === 'PLAYING';

    // Show visible columns + folded columns (as locked or revealed). Skip hidden columns.
    const cardFields = displayFields.filter((field) => {
        const isVisible = columnVisibility[field.attributeKey] ?? false;
        return isVisible || field.isFolded;
    });

    function getCellColor(cellFeedback: Feedback | undefined, field: SchemaField): string {
        if (!cellFeedback) return 'bg-gray-200 text-charcoal';

        if (field.uiColorLogic === 'DISTANCE_GRADIENT') {
            return cellFeedback.status === 'EXACT'
                ? 'bg-thermal-gold text-charcoal'
                : getDistanceGradientClass(cellFeedback.distanceKm);
        }

        if (field.uiColorLogic === 'CATEGORY_MATCH' || cellFeedback.categoryMatch !== undefined) {
            return cellFeedback.status === 'EXACT'
                ? 'bg-thermal-gold text-charcoal'
                : getCategoryMatchClass(cellFeedback.categoryMatch);
        }

        return getStandardStatusClass(cellFeedback.status);
    }

    function getDisplayValue(field: SchemaField): string {
        const key = field.attributeKey;
        const cellFeedback = feedback[key];
        let displayValue: string | number | boolean | undefined = cellFeedback?.displayValue;

        if (displayValue === undefined || displayValue === '') {
            const rawValue = guess[key];
            if (typeof rawValue === 'number' && (field.dataType === 'INT' || field.dataType === 'FLOAT' || field.dataType === 'CURRENCY')) {
                displayValue = formatNumber(rawValue);
            } else if (typeof rawValue === 'boolean') {
                displayValue = rawValue ? 'Yes' : 'No';
            } else {
                displayValue = rawValue;
            }
        }

        return String(displayValue ?? '');
    }

    return (
        <div className="border border-charcoal bg-paper-white mb-3 shadow-hard-sm">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-charcoal">
                <span className="font-mono font-bold text-base text-charcoal truncate">
                    {guess.name}
                </span>
                <span className="font-mono text-sm text-charcoal/60 shrink-0 ml-2">
                    #{guessIndex + 1}
                </span>
            </div>

            {/* Attribute Grid — gap-px with parent bg creates thin dividers */}
            <div className="grid grid-cols-2 gap-px bg-charcoal/15">
                {cardFields.map((field) => {
                    const key = field.attributeKey;
                    const isFolded = field.isFolded && !revealedFoldedAttributes.includes(key);
                    const cellFeedback = feedback[key];

                    // Folded (locked) cell
                    if (isFolded) {
                        return (
                            <div
                                key={key}
                                className={cn(
                                    "bg-folded-pattern px-2 py-2.5 flex flex-col items-center justify-center gap-1",
                                    isPlaying && "cursor-pointer active:bg-charcoal/10"
                                )}
                                onClick={() => isPlaying && onRevealFolded(key)}
                            >
                                <Lock className="w-3.5 h-3.5 text-charcoal/40" />
                                <span className="font-mono text-[10px] uppercase text-charcoal/40 tracking-wider">
                                    {field.displayLabel}
                                </span>
                            </div>
                        );
                    }

                    // Visible cell with feedback
                    const colorClass = getCellColor(cellFeedback, field);
                    const value = getDisplayValue(field);
                    const direction = cellFeedback?.direction;

                    return (
                        <div
                            key={key}
                            className={cn(
                                "px-2 py-2 font-mono",
                                colorClass,
                                direction === 'UP' && "border-t-[3px] border-t-black",
                                direction === 'DOWN' && "border-b-[3px] border-b-black",
                            )}
                        >
                            <div className="text-[10px] uppercase opacity-60 tracking-wider leading-tight">
                                {field.displayLabel}
                            </div>
                            <div className="text-sm font-bold leading-tight mt-0.5 truncate">
                                {value}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
