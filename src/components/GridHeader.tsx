import { useState } from 'react';
import { Plus, Eye, Check, Lock } from 'lucide-react';
import type { SchemaField, Entity, GameStatus } from '../types';
import { useGameStore } from '../store/gameStore';
import { formatNumber } from '../utils/formatters';
import { cn } from '../utils/cn';
import { MajorHintModal } from './MajorHintModal';
import { FoldedHintModal } from './FoldedHintModal';

interface GridHeaderProps {
    displayFields: SchemaField[];
    columnVisibility: Record<string, boolean>;
    majorHintAttributes: string[];
    revealedFoldedAttributes: string[];
    targetEntity: Entity;
    gameStatus: GameStatus;
}

export function GridHeader({
    displayFields,
    columnVisibility,
    majorHintAttributes,
    revealedFoldedAttributes,
    targetEntity,
    gameStatus,
}: GridHeaderProps) {
    const revealColumn = useGameStore(state => state.revealColumn);
    const revealMajorHint = useGameStore(state => state.revealMajorHint);
    const revealFoldedAttribute = useGameStore(state => state.revealFoldedAttribute);
    const [pendingMajorHint, setPendingMajorHint] = useState<string | null>(null);
    const [pendingFoldedReveal, setPendingFoldedReveal] = useState<string | null>(null);

    const isPlaying = gameStatus === 'PLAYING';

    const handleConfirmMajorHint = () => {
        if (pendingMajorHint) {
            revealMajorHint(pendingMajorHint);
            setPendingMajorHint(null);
        }
    };

    const handleConfirmFoldedReveal = () => {
        if (pendingFoldedReveal) {
            revealFoldedAttribute(pendingFoldedReveal);
            setPendingFoldedReveal(null);
        }
    };

    const formatTargetValue = (field: SchemaField) => {
        const targetVal = targetEntity[field.attributeKey];
        if (typeof targetVal === 'number') {
            return formatNumber(targetVal);
        }
        if (typeof targetVal === 'boolean') {
            return targetVal ? 'Yes' : 'No';
        }
        return String(targetVal ?? '');
    };

    return (
        <>
            <div className="flex w-full space-x-2 mb-1">
                {/* Name column header */}
                <div className="flex-[1.5] text-center font-bold font-mono text-sm uppercase text-charcoal bg-gray-100 border-b border-charcoal/50 pb-1 select-none">
                    NAME
                </div>

                {displayFields.map((field) => {
                    const key = field.attributeKey;
                    const isVisible = columnVisibility[key] ?? false;
                    const isMajorHinted = majorHintAttributes.includes(key);
                    const isFolded = field.isFolded;
                    const isFoldedRevealed = revealedFoldedAttributes.includes(key);
                    const isNumericHigherLower = field.logicType === 'HIGHER_LOWER';

                    // HIDDEN column header (not yet revealed, costs +1)
                    if (!isVisible && !isFolded) {
                        return (
                            <div
                                key={key}
                                className={cn(
                                    "flex-none w-8 flex items-center justify-center border-b border-charcoal/50 bg-gray-100",
                                    isPlaying
                                        ? "cursor-pointer hover:bg-charcoal/10"
                                        : "opacity-40 pointer-events-none"
                                )}
                                onClick={() => isPlaying && revealColumn(key)}
                                title="Reveal Column (+1 Stroke)"
                                role="button"
                                aria-label={`Reveal ${field.displayLabel} column, adds 1 stroke`}
                            >
                                <Plus className="w-4 h-4 text-charcoal/60" />
                            </div>
                        );
                    }

                    // FOLDED column header (locked, costs +2 to reveal)
                    if (isFolded && !isFoldedRevealed) {
                        return (
                            <div
                                key={key}
                                className={cn(
                                    "flex-1 text-center font-bold font-mono text-xs sm:text-sm uppercase flex items-center justify-center gap-1 select-none border-b pb-1 bg-gray-100 text-charcoal/40",
                                    isPlaying
                                        ? "cursor-pointer hover:bg-charcoal/10"
                                        : "opacity-40 pointer-events-none"
                                )}
                                onClick={() => isPlaying && setPendingFoldedReveal(key)}
                                title="Reveal Clue (+2 Strokes)"
                                role="button"
                                aria-label={`Reveal ${field.displayLabel} clue, adds 2 strokes`}
                            >
                                <Lock className="w-3 h-3 shrink-0" />
                                <span className="truncate">{field.displayLabel}</span>
                            </div>
                        );
                    }

                    // MAJOR-HINTED column header (exact value revealed)
                    if (isMajorHinted) {
                        return (
                            <div
                                key={key}
                                className="flex-1 text-center font-bold font-mono text-xs sm:text-sm uppercase flex items-center justify-center gap-1 select-none border-b pb-1 bg-charcoal text-paper-white"
                            >
                                <Check className="w-3 h-3 shrink-0" />
                                <span className="truncate">{formatTargetValue(field)}</span>
                            </div>
                        );
                    }

                    // VISIBLE column header (normal)
                    return (
                        <div
                            key={key}
                            className="flex-1 text-center font-bold font-mono text-xs sm:text-sm uppercase flex items-center justify-center gap-1 select-none border-b pb-1 text-charcoal border-charcoal/50 bg-gray-100 cursor-default"
                        >
                            <span className="truncate">{field.displayLabel}</span>
                            {isNumericHigherLower && isPlaying && (
                                <button
                                    onClick={() => setPendingMajorHint(key)}
                                    title="Reveal Exact Value (+5 Strokes)"
                                    aria-label={`Reveal exact value for ${field.displayLabel}, adds 5 strokes`}
                                    className="ml-0.5 p-0.5 hover:bg-charcoal/10 transition-colors shrink-0"
                                >
                                    <Eye className="w-3 h-3 text-charcoal/40 hover:text-charcoal" />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            <MajorHintModal
                isOpen={pendingMajorHint !== null}
                attributeLabel={pendingMajorHint
                    ? (displayFields.find(f => f.attributeKey === pendingMajorHint)?.displayLabel || pendingMajorHint)
                    : ''}
                onConfirm={handleConfirmMajorHint}
                onCancel={() => setPendingMajorHint(null)}
            />

            <FoldedHintModal
                isOpen={pendingFoldedReveal !== null}
                attributeLabel={pendingFoldedReveal
                    ? (displayFields.find(f => f.attributeKey === pendingFoldedReveal)?.displayLabel || pendingFoldedReveal)
                    : ''}
                onConfirm={handleConfirmFoldedReveal}
                onCancel={() => setPendingFoldedReveal(null)}
            />
        </>
    );
}
