import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Tv, X } from 'lucide-react';
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

export function VisualizationModal({
    isOpen,
    onClose,
    activeCategory,
    guesses,
    targetEntity,
    gameStatus,
}: VisualizationModalProps) {
    const [adWatched, setAdWatched] = useState(false);

    // Reset ad state every time the modal is opened so each visit requires watching
    useEffect(() => {
        if (!isOpen) setAdWatched(false);
    }, [isOpen]);

    const title = activeCategory === 'countries' ? 'World Map' : 'Periodic Table';

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <Dialog.Content
                    className={cn(
                        "fixed z-50 focus:outline-none",
                        "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
                        "w-[95vw] max-w-4xl",
                        "flex flex-col max-h-[90vh]",
                        "border border-charcoal bg-paper-white shadow-hard",
                        "data-[state=open]:animate-in data-[state=closed]:animate-out",
                        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                    )}
                >
                    {/* Sticky header */}
                    <div className="sticky top-0 z-10 bg-charcoal text-paper-white shrink-0">
                        <div className="flex items-center justify-between px-6 py-4">
                            <Dialog.Title className="font-serif-display font-black text-2xl uppercase tracking-wider">
                                {title}
                            </Dialog.Title>
                            <Dialog.Close
                                onClick={onClose}
                                className="text-paper-white/70 hover:text-paper-white transition-colors touch-manipulation p-1 focus:outline-none"
                                aria-label="Close"
                            >
                                <X size={20} />
                            </Dialog.Close>
                        </div>
                    </div>

                    <Dialog.Description className="sr-only">
                        {activeCategory === 'countries'
                            ? 'A world map showing your guessed countries highlighted.'
                            : 'The periodic table showing your guessed elements highlighted.'}
                    </Dialog.Description>

                    {/* Scrollable body */}
                    <div className="overflow-y-auto flex-1 p-4">
                        {!adWatched ? (
                            /* ── Ad placeholder ─────────────────────────────────────── */
                            <div className="flex flex-col items-center gap-4">
                                <p className="text-xs font-mono text-charcoal/50 uppercase tracking-widest">
                                    Watch a short ad to unlock the {title.toLowerCase()}
                                </p>

                                {/* Ad slot */}
                                <div
                                    className="w-full max-w-sm border-2 border-dashed border-graphite bg-graphite/20 flex flex-col items-center justify-center gap-2 text-charcoal/40 font-mono"
                                    style={{ aspectRatio: '16/9' }}
                                >
                                    <Tv size={32} strokeWidth={1} />
                                    <span className="text-xs uppercase tracking-widest">Ad Placeholder</span>
                                    <span className="text-[10px]">Rewarded video will appear here</span>
                                </div>

                                {/* Unlock button — replace onClick with real ad SDK trigger later */}
                                <button
                                    onClick={() => setAdWatched(true)}
                                    className="w-full max-w-sm bg-charcoal text-paper-white py-3 font-mono font-bold text-sm uppercase tracking-widest hover:bg-paper-white hover:text-charcoal border border-charcoal transition-colors touch-manipulation focus:outline-none"
                                >
                                    Watch Ad to Unlock
                                </button>

                                <p className="text-[10px] font-mono text-charcoal/30">
                                    {/* Replace this note once real ads are wired up */}
                                    (Ad integration pending — clicking unlocks immediately for now)
                                </p>
                            </div>
                        ) : (
                            /* ── Visualization ──────────────────────────────────────── */
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
