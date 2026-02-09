import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '../utils/cn';
import type { Entity, Feedback } from '../types';

interface GameOverModalProps {
    isOpen: boolean;
    status: 'WON' | 'LOST';
    targetEntity: Entity;
    guesses: { guess: Entity; feedback: Record<string, Feedback> }[];
    maxGuesses: number;
    onReset: () => void;
}

export function GameOverModal({
    isOpen,
    status,
    targetEntity,
    guesses,
    maxGuesses,
    onReset,
}: GameOverModalProps) {
    const isWin = status === 'WON';

    const handleShare = async () => {
        const guessCount = guesses.length;
        const emoji = isWin ? '🟩' : '⬛';
        const text = `Scalar Web ${isWin ? 'Win' : 'Loss'}!\n${emoji} Target: ${targetEntity.name}\nGuesses: ${guessCount}/${maxGuesses}\n\nCan you beat my score?`;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'Scalar Web',
                    text: text,
                });
            } else {
                await navigator.clipboard.writeText(text);
                alert('Result copied to clipboard!');
            }
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onReset()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <Dialog.Content className={cn(
                    "fixed z-50 bg-paper-white shadow-2xl p-6 focus:outline-none transition-all duration-200",
                    // Mobile: Bottom Sheet
                    "bottom-0 left-0 right-0 w-full border-t-4 border-charcoal rounded-t-3xl pb-10",
                    "data-[state=open]:animate-in data-[state=closed]:animate-out",
                    "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",

                    // Desktop: Centered Modal
                    "md:top-1/2 md:left-1/2 md:bottom-auto md:right-auto md:w-full md:max-w-md md:-translate-x-1/2 md:-translate-y-1/2",
                    "md:border-2 md:rounded-xl md:pb-6",
                    "md:data-[state=open]:slide-in-from-top-[48%] md:data-[state=open]:slide-in-from-left-1/2",
                    "md:data-[state=closed]:slide-out-to-top-[48%] md:data-[state=closed]:slide-out-to-left-1/2",
                    "md:data-[state=closed]:zoom-out-95 md:data-[state=open]:zoom-in-95"
                )}>

                    <div className="flex flex-col items-center text-center space-y-6">
                        {/* Heading */}
                        <Dialog.Title className={cn(
                            "w-full text-3xl font-black uppercase tracking-wider py-4 border-2 border-charcoal",
                            isWin ? "bg-charcoal text-paper-white" : "bg-paper-white text-charcoal"
                        )}>
                            {isWin ? 'VICTORY' : 'FAILURE'}
                        </Dialog.Title>

                        <Dialog.Description className="sr-only">
                            Game Over Summary
                        </Dialog.Description>

                        {/* Summary Details */}
                        <div className="w-full space-y-4 font-mono">
                            <div className="flex justify-between items-end border-b-2 border-charcoal/20 pb-2">
                                <span className="text-sm font-bold uppercase text-charcoal/60">Target Entity</span>
                                <span className="text-xl font-bold bg-charcoal/10 px-2">{targetEntity.name}</span>
                            </div>

                            <div className="flex justify-between items-end border-b-2 border-charcoal/20 pb-2">
                                <span className="text-sm font-bold uppercase text-charcoal/60">Guesses Used</span>
                                <span className={cn(
                                    "text-xl font-bold px-2",
                                    isWin ? "text-green-600" : "text-red-500"
                                )}>
                                    {guesses.length} <span className="text-charcoal/40 text-sm">/ {maxGuesses}</span>
                                </span>
                            </div>


                        </div>

                        {/* Buttons */}
                        <div className="flex w-full gap-4 pt-4">
                            <button
                                onClick={handleShare}
                                className="flex-1 px-4 py-3 border-2 border-charcoal font-bold hover:bg-charcoal/10 transition-colors uppercase text-sm tracking-wide"
                            >
                                Share Result
                            </button>
                            <button
                                onClick={onReset}
                                className="flex-1 px-4 py-3 bg-charcoal text-paper-white font-bold border-2 border-charcoal hover:bg-charcoal/90 transition-colors uppercase text-sm tracking-wide"
                            >
                                Play Again
                            </button>
                        </div>
                    </div>

                    <Dialog.Close className="absolute top-4 right-4 text-charcoal opacity-50 hover:opacity-100 transition-opacity" aria-label="Close">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </Dialog.Close>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
