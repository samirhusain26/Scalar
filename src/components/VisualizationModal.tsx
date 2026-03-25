import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../utils/cn';
import type { Entity, GuessResult, GameStatus } from '../types';
import { WorldMapView } from './WorldMapView';
import { PeriodicTableView } from './PeriodicTableView';

interface VisualizationModalProps {
    isOpen: boolean;
    onClose: () => void;
    activeCategory: string;
    guesses: GuessResult[];
    targetEntity: Entity;
    gameStatus: GameStatus;
}

// Tracks which categories have been confirmed this session (resets on page refresh)
const sessionConfirmed = new Set<string>();

export function VisualizationModal({
    isOpen,
    onClose,
    activeCategory,
    guesses,
    targetEntity,
    gameStatus,
}: VisualizationModalProps) {
    const [confirmed, setConfirmed] = useState(false);

    // Re-sync whenever the modal opens or the category changes
    useEffect(() => {
        setConfirmed(sessionConfirmed.has(activeCategory));
    }, [isOpen, activeCategory]);

    const title = activeCategory === 'countries' ? 'World Map' : 'Periodic Table';
    const description = activeCategory === 'countries'
        ? 'Opens an interactive world map with your guessed countries highlighted. Scroll or pinch to zoom, drag to pan.'
        : 'Opens an interactive periodic table with your guessed elements highlighted. Scroll or pinch to zoom, drag to pan.';

    const handleConfirm = () => {
        sessionConfirmed.add(activeCategory);
        setConfirmed(true);
    };

    const showConfirmation = isOpen && !confirmed;

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <Dialog.Content
                    className={cn(
                        "fixed z-50 focus:outline-none",
                        "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
                        "w-[95vw] max-w-4xl",
                        "flex flex-col max-h-[85dvh]",
                        "border border-charcoal bg-paper-white shadow-hard",
                        "data-[state=open]:animate-in data-[state=closed]:animate-out",
                        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                    )}
                >
                    {/* Slim header banner */}
                    <div className="sticky top-0 z-10 bg-paper-white border-b border-graphite shrink-0">
                        <div className="flex items-center justify-between px-3 py-2">
                            <Dialog.Title className="font-mono text-[11px] uppercase tracking-widest text-charcoal/60">
                                {title}
                            </Dialog.Title>
                            <Dialog.Close
                                onClick={onClose}
                                className="text-charcoal/50 hover:text-charcoal transition-colors touch-manipulation p-1 focus:outline-none"
                                aria-label="Close"
                            >
                                <X size={16} />
                            </Dialog.Close>
                        </div>
                    </div>

                    <Dialog.Description className="sr-only">
                        {activeCategory === 'countries'
                            ? 'A world map showing your guessed countries highlighted.'
                            : 'The periodic table showing your guessed elements highlighted.'}
                    </Dialog.Description>

                    {/* Body */}
                    <div className="overflow-y-auto flex-1 p-2 md:p-4">
                        {showConfirmation ? (
                            <div className="flex flex-col items-center gap-6 py-4">
                                <p className="text-sm font-mono text-charcoal/70 text-center max-w-sm leading-relaxed">
                                    {description}
                                </p>
                                <button
                                    onClick={handleConfirm}
                                    className="w-full max-w-sm bg-charcoal text-paper-white py-3 font-mono font-bold text-sm uppercase tracking-widest hover:bg-paper-white hover:text-charcoal border border-charcoal transition-colors touch-manipulation focus:outline-none"
                                >
                                    Open {title}
                                </button>
                            </div>
                        ) : (
                            activeCategory === 'countries' ? (
                                <WorldMapView
                                    guesses={guesses}
                                    targetEntity={targetEntity}
                                    gameStatus={gameStatus}
                                />
                            ) : (
                                <PeriodicTableView
                                    guesses={guesses}
                                    targetEntity={targetEntity}
                                    gameStatus={gameStatus}
                                />
                            )
                        )}
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
