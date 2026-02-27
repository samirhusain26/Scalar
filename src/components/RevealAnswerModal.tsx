import { useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../utils/cn';
import { trackGameEvent } from '../utils/analytics';
import { useGameStore } from '../store/gameStore';
import { ElementCellCard } from './ElementCellCard';
import { CountryDetailCard } from './CountryDetailCard';
import type { Entity, CategorySchema, GameMode } from '../types';

interface RevealAnswerModalProps {
    isOpen: boolean;
    targetEntity: Entity;
    schema: CategorySchema;
    activeMode: GameMode;
    onNewGame: () => void;
    onSwitchToFreePlay: () => void;
    /** Called when the user closes the modal via X / overlay in daily mode. */
    onDismissDaily: () => void;
}

export function RevealAnswerModal({
    isOpen,
    targetEntity,
    schema,
    activeMode,
    onNewGame,
    onSwitchToFreePlay,
    onDismissDaily,
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

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            if (activeMode === 'daily') {
                onDismissDaily();
            } else {
                onNewGame();
            }
        }
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <Dialog.Content className={cn(
                    "fixed z-50 bg-paper-white shadow-hard focus:outline-none overflow-hidden flex flex-col",
                    "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-sm md:max-w-md border border-charcoal",
                    "data-[state=open]:animate-in data-[state=closed]:animate-out",
                    "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                    "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                )}>
                    {/* Close button — sits over the dark banner */}
                    <Dialog.Close
                        className="absolute right-3 top-3 z-50 p-1.5 text-paper-white hover:text-paper-white/70 transition-colors"
                        aria-label="Close"
                    >
                        <X size={18} />
                    </Dialog.Close>

                    {/* Title banner */}
                    <Dialog.Title className="text-2xl font-black uppercase tracking-wider py-4 bg-charcoal text-paper-white font-serif-display text-center shrink-0">
                        Answer Revealed
                    </Dialog.Title>

                    <Dialog.Description className="sr-only">
                        The answer and all its details
                    </Dialog.Description>

                    {/* Scrollable card body */}
                    <div className="overflow-y-auto max-h-[70vh] p-4">
                        {activeCategory === 'elements' ? (
                            <ElementCellCard entity={targetEntity} schema={schema} variant="modal" />
                        ) : activeCategory === 'countries' ? (
                            <CountryDetailCard entity={targetEntity} variant="modal" />
                        ) : (
                            <div className="text-center py-4">
                                <span className="text-2xl font-black uppercase tracking-wide">
                                    {targetEntity.name}
                                </span>
                            </div>
                        )}

                        {/* Daily forfeit note */}
                        {activeMode === 'daily' && (
                            <p className="mt-3 text-center font-mono text-[10px] text-charcoal/50 uppercase tracking-widest">
                                Streak not credited on forfeit
                            </p>
                        )}
                    </div>

                    {/* Action button — pinned to bottom */}
                    <div className="p-4 border-t border-charcoal shrink-0 flex flex-col gap-2">
                        {activeMode === 'daily' ? (
                            <button
                                onClick={onSwitchToFreePlay}
                                className="w-full px-4 py-3 bg-charcoal text-paper-white font-bold border border-charcoal hover:bg-paper-white hover:text-charcoal transition-colors uppercase text-sm tracking-wide"
                            >
                                Try Free Play →
                            </button>
                        ) : (
                            <button
                                onClick={onNewGame}
                                className="w-full px-4 py-3 bg-charcoal text-paper-white font-bold border border-charcoal hover:bg-paper-white hover:text-charcoal transition-colors uppercase text-sm tracking-wide"
                            >
                                New Game
                            </button>
                        )}
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
