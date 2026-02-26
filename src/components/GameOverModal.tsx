import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../utils/cn';
import { encodeChallenge } from '../utils/challengeUtils';
import { trackGameEvent } from '../utils/analytics';
import { useGameStore } from '../store/gameStore';
import { ElementCellCard } from './ElementCellCard';
import { CountryDetailCard } from './CountryDetailCard';
import gameDataRaw from '../assets/data/gameData.json';
import type { Entity, GameData } from '../types';

const gameData = gameDataRaw as unknown as GameData;

interface GameOverModalProps {
    isOpen: boolean;
    targetEntity: Entity;
    moves: number;
    activeCategory: string;
    onReset: () => void;
}


export function GameOverModal({
    isOpen,
    targetEntity,
    moves,
    activeCategory,
    onReset,
}: GameOverModalProps) {
    const [challengeCopied, setChallengeCopied] = useState(false);

    const handleChallenge = async () => {
        const hash = encodeChallenge(activeCategory, targetEntity.id, moves);
        const url = `${window.location.origin}${window.location.pathname}?challenge=${hash}`;
        // Keep URL out of text when using navigator.share (url field handles the link separately)
        const shareMessage = `Can you beat my score of ${moves} moves? Play Scalar!`;
        const clipboardText = `Can you beat my score of ${moves} moves? ${url}`;

        try {
            if (navigator.share) {
                await navigator.share({ title: 'Scalar Challenge', text: shareMessage, url });
            } else {
                await navigator.clipboard.writeText(clipboardText);
            }
            setChallengeCopied(true);
            trackGameEvent('challenge_shared', { category: activeCategory, moves });
            setTimeout(() => setChallengeCopied(false), 2000);
        } catch {
            // User cancelled share or clipboard denied — ignore
        }
    };


    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => {
            // Only reset if the game is still SOLVED — prevents double-reset when a
            // category switch already reset the game and just closed the modal externally.
            if (!open && useGameStore.getState().gameStatus === 'SOLVED') onReset();
        }}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <Dialog.Content
                    className={cn(
                    "fixed z-50 bg-paper-white shadow-hard focus:outline-none",
                    "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-md border border-charcoal",
                    "max-h-[85dvh] flex flex-col",
                    "data-[state=open]:animate-in data-[state=closed]:animate-out",
                    "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                    "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                )}>

                    {/* Sticky header */}
                    <div className="shrink-0 relative">
                        <Dialog.Title className="w-full text-2xl font-black uppercase tracking-wider py-3 px-4 border-b border-charcoal bg-charcoal text-paper-white font-serif-display text-center">
                            Puzzle Complete
                        </Dialog.Title>
                        <Dialog.Close className="absolute right-3 top-1/2 -translate-y-1/2 z-50 p-2 text-paper-white hover:text-paper-white/70 transition-colors" aria-label="Close">
                            <X size={20} />
                        </Dialog.Close>
                    </div>

                    <Dialog.Description className="sr-only">
                        Puzzle completion summary
                    </Dialog.Description>

                    {/* Scrollable body */}
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center gap-4">
                        {/* Target Entity */}
                        {activeCategory === 'elements' ? (
                            <ElementCellCard
                                entity={targetEntity}
                                schema={gameData.schemaConfig[activeCategory] || []}
                            />
                        ) : activeCategory === 'countries' ? (
                            <CountryDetailCard entity={targetEntity} />
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                {typeof targetEntity.image === 'string' && targetEntity.image && (
                                    <img
                                        src={targetEntity.image}
                                        alt={targetEntity.name}
                                        className="w-16 h-16 object-contain border border-charcoal/20"
                                    />
                                )}
                                <span className="text-2xl font-black uppercase tracking-wide">{targetEntity.name}</span>
                            </div>
                        )}

                        {/* Total Moves */}
                        <div className="w-full font-mono border border-charcoal/20 py-3 text-center">
                            <div className="text-3xl font-black">
                                {moves} <span className="text-lg font-bold">Moves</span>
                            </div>
                        </div>
                    </div>

                    {/* Sticky footer buttons */}
                    <div className="shrink-0 flex flex-col gap-3 p-4 border-t border-charcoal/20">
                        <button
                            onClick={handleChallenge}
                            className="w-full px-4 py-3 bg-charcoal text-paper-white font-bold border border-charcoal hover:bg-paper-white hover:text-charcoal transition-colors uppercase text-sm tracking-wide"
                        >
                            {challengeCopied ? 'Link Copied!' : 'Challenge a Friend'}
                        </button>
                        <button
                            onClick={onReset}
                            className="w-full px-4 py-3 border border-charcoal font-bold hover:bg-charcoal hover:text-paper-white transition-colors uppercase text-sm tracking-wide"
                        >
                            Play Again
                        </button>
                        <a
                            href="https://docs.google.com/forms/d/e/1FAIpQLSeAPZsI6lxoo4WZIz3o5Vr0dpKqgPVK_GgDrYyVoGuHeSeyIg/viewform?usp=publish-editor"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-center text-[10px] font-bold uppercase tracking-widest text-charcoal/40 hover:text-charcoal/70 transition-colors underline underline-offset-2"
                        >
                            Submit Feedback
                        </a>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
