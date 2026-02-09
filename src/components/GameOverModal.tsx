import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '../utils/cn';
import { encodeChallenge } from '../utils/challengeUtils';
import { trackGameEvent } from '../utils/analytics';
import type { Entity } from '../types';

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
        const hash = encodeChallenge(activeCategory, targetEntity.id);
        const url = `${window.location.origin}${window.location.pathname}?challenge=${hash}`;
        const text = `Can you beat my score of ${moves} moves? Play Scalar: ${url}`;

        try {
            if (navigator.share) {
                await navigator.share({ title: 'Scalar Challenge', text, url });
            } else {
                await navigator.clipboard.writeText(text);
            }
            setChallengeCopied(true);
            trackGameEvent('challenge_shared', { category: activeCategory, moves });
            setTimeout(() => setChallengeCopied(false), 2000);
        } catch {
            // User cancelled share or clipboard denied — ignore
        }
    };


    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onReset()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <Dialog.Content
                    onInteractOutside={(e) => e.preventDefault()}
                    className={cn(
                    "fixed z-50 bg-paper-white shadow-hard p-6 focus:outline-none",
                    "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-md border border-charcoal",
                    "data-[state=open]:animate-in data-[state=closed]:animate-out",
                    "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                    "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                )}>

                    <div className="flex flex-col items-center text-center space-y-6">
                        {/* Heading */}
                        <Dialog.Title className="w-full text-2xl font-black uppercase tracking-wider py-4 border border-charcoal bg-charcoal text-paper-white font-serif-display">
                            Puzzle Complete
                        </Dialog.Title>

                        <Dialog.Description className="sr-only">
                            Puzzle completion summary
                        </Dialog.Description>

                        {/* Target Entity */}
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

                        {/* Total Moves */}
                        <div className="w-full font-mono border border-charcoal/20 py-3">
                            <div className="text-3xl font-black">
                                {moves} <span className="text-lg font-bold">Moves</span>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex flex-col w-full gap-3 pt-4">
                            <button
                                onClick={handleChallenge}
                                className="w-full px-4 py-3 bg-charcoal text-paper-white font-bold border border-charcoal hover:bg-paper-white hover:text-charcoal transition-colors uppercase text-sm tracking-wide animate-glow"
                            >
                                {challengeCopied ? 'Link Copied!' : 'Challenge a Friend'}
                            </button>
                            <button
                                onClick={onReset}
                                className="w-full px-4 py-3 border border-charcoal font-bold hover:bg-charcoal hover:text-paper-white transition-colors uppercase text-sm tracking-wide"
                            >
                                Play Again
                            </button>
                        </div>
                    </div>

                    <Dialog.Close className="absolute top-4 right-4 text-paper-white opacity-70 hover:opacity-100 transition-opacity" aria-label="Close">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </Dialog.Close>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
