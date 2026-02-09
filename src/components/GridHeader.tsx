import { useState } from 'react';
import { Plus, Eye, Check } from 'lucide-react';
import type { CategorySchema, Entity, GameStatus } from '../types';
import { useGameStore } from '../store/gameStore';
import { formatNumber } from '../utils/formatters';
import { cn } from '../utils/cn';
import { MajorHintModal } from './MajorHintModal';

interface GridHeaderProps {
    displayKeys: string[];
    schema: CategorySchema;
    columnVisibility: Record<string, boolean>;
    majorHintAttributes: string[];
    targetEntity: Entity;
    gameStatus: GameStatus;
}

export function GridHeader({
    displayKeys,
    schema,
    columnVisibility,
    majorHintAttributes,
    targetEntity,
    gameStatus,
}: GridHeaderProps) {
    const revealColumn = useGameStore(state => state.revealColumn);
    const revealMajorHint = useGameStore(state => state.revealMajorHint);
    const [pendingMajorHint, setPendingMajorHint] = useState<string | null>(null);

    const isPlaying = gameStatus === 'PLAYING';

    const handleConfirmMajorHint = () => {
        if (pendingMajorHint) {
            revealMajorHint(pendingMajorHint);
            setPendingMajorHint(null);
        }
    };

    const formatTargetValue = (key: string) => {
        const fieldDef = schema[key];
        const targetVal = targetEntity[key];
        if (typeof targetVal === 'number') {
            return `${fieldDef?.unitPrefix || ''}${formatNumber(targetVal)}${fieldDef?.unitSuffix || ''}`;
        }
        return String(targetVal);
    };

    return (
        <>
            <div className="flex w-full space-x-2 mb-1">
                {/* Name column header */}
                <div className="flex-[1.5] text-center font-bold font-mono text-sm uppercase text-charcoal bg-gray-100 border-b border-charcoal/50 pb-1 select-none">
                    NAME
                </div>

                {displayKeys.map((key) => {
                    const fieldDef = schema[key];
                    const isVisible = columnVisibility[key];
                    const isMajorHinted = majorHintAttributes.includes(key);
                    const isNumeric = fieldDef?.type !== 'STRING';

                    // HIDDEN column header
                    if (!isVisible) {
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
                                aria-label={`Reveal ${fieldDef?.label || key} column, adds 1 stroke`}
                            >
                                <Plus className="w-4 h-4 text-charcoal/60" />
                            </div>
                        );
                    }

                    // MAJOR-HINTED column header
                    if (isMajorHinted) {
                        return (
                            <div
                                key={key}
                                className="flex-1 text-center font-bold font-mono text-xs sm:text-sm uppercase flex items-center justify-center gap-1 select-none border-b pb-1 bg-charcoal text-paper-white"
                            >
                                <Check className="w-3 h-3 shrink-0" />
                                <span className="truncate">{formatTargetValue(key)}</span>
                            </div>
                        );
                    }

                    // VISIBLE column header (normal)
                    return (
                        <div
                            key={key}
                            className="flex-1 text-center font-bold font-mono text-xs sm:text-sm uppercase flex items-center justify-center gap-1 select-none border-b pb-1 text-charcoal border-charcoal/50 bg-gray-100 cursor-default"
                        >
                            <span className="truncate">{fieldDef?.label || key}</span>
                            {isNumeric && isPlaying && (
                                <button
                                    onClick={() => setPendingMajorHint(key)}
                                    title="Reveal Exact Value (+5 Strokes)"
                                    aria-label={`Reveal exact value for ${fieldDef?.label || key}, adds 5 strokes`}
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
                attributeLabel={pendingMajorHint ? (schema[pendingMajorHint]?.label || pendingMajorHint) : ''}
                onConfirm={handleConfirmMajorHint}
                onCancel={() => setPendingMajorHint(null)}
            />
        </>
    );
}
