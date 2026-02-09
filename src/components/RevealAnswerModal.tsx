import { useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '../utils/cn';
import { trackGameEvent } from '../utils/analytics';
import { useGameStore } from '../store/gameStore';
import type { Entity, CategorySchema } from '../types';
import { formatNumber, numberToLetter } from '../utils/formatters';
import { getDisplayColumns } from '../utils/schemaParser';

interface RevealAnswerModalProps {
    isOpen: boolean;
    targetEntity: Entity;
    schema: CategorySchema;
    onNewGame: () => void;
}

export function RevealAnswerModal({
    isOpen,
    targetEntity,
    schema,
    onNewGame,
}: RevealAnswerModalProps) {
    const activeCategory = useGameStore(state => state.activeCategory);
    const hasFiredRef = useRef(false);

    useEffect(() => {
        if (isOpen && !hasFiredRef.current) {
            hasFiredRef.current = true;
            trackGameEvent('game_forfeit', { category: activeCategory });
        }
        if (!isOpen) {
            hasFiredRef.current = false;
        }
    }, [isOpen, activeCategory]);

    const displayFields = getDisplayColumns(schema);

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onNewGame()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <Dialog.Content className={cn(
                    "fixed z-50 bg-paper-white shadow-hard p-6 focus:outline-none",
                    "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-md border border-charcoal",
                    "data-[state=open]:animate-in data-[state=closed]:animate-out",
                    "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                    "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                )}>
                    <div className="flex flex-col items-center text-center space-y-6">
                        <Dialog.Title className="w-full text-2xl font-black uppercase tracking-wider py-4 border border-charcoal bg-charcoal text-paper-white font-serif-display">
                            Answer Revealed
                        </Dialog.Title>

                        <Dialog.Description className="sr-only">
                            The answer and all its details
                        </Dialog.Description>

                        {/* Entity Name */}
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-2xl font-black uppercase tracking-wide">{targetEntity.name}</span>
                        </div>

                        {/* Attribute Details */}
                        <div className="w-full border border-charcoal/20 max-h-60 overflow-y-auto">
                            {displayFields.map((field, i) => {
                                const value = targetEntity[field.attributeKey];
                                if (value === undefined || value === null) return null;

                                let displayVal: string;
                                if (field.displayFormat === 'ALPHA_POSITION' && typeof value === 'number') {
                                    displayVal = numberToLetter(value);
                                } else if (typeof value === 'number') {
                                    displayVal = formatNumber(value);
                                } else if (typeof value === 'boolean') {
                                    displayVal = value ? 'Yes' : 'No';
                                } else {
                                    displayVal = String(value);
                                }

                                return (
                                    <div
                                        key={field.attributeKey}
                                        className={cn(
                                            "flex justify-between items-center px-4 py-2.5 font-mono text-sm",
                                            i < displayFields.length - 1 && "border-b border-charcoal/10"
                                        )}
                                    >
                                        <span className="font-bold uppercase text-charcoal/60 text-xs tracking-wide">
                                            {field.displayLabel}
                                        </span>
                                        <span className="font-bold text-charcoal">
                                            {displayVal}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* New Game Button */}
                        <div className="flex w-full pt-4">
                            <button
                                onClick={onNewGame}
                                className="flex-1 px-4 py-3 bg-charcoal text-paper-white font-bold border border-charcoal hover:bg-paper-white hover:text-charcoal transition-colors uppercase text-sm tracking-wide"
                            >
                                New Game
                            </button>
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
