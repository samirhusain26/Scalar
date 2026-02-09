import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '../utils/cn';
import type { Entity, Feedback, Rank } from '../types';
import { calculateRank } from '../utils/gameLogic';

interface GameOverModalProps {
    isOpen: boolean;
    targetEntity: Entity;
    guesses: { guess: Entity; feedback: Record<string, Feedback> }[];
    score: number;
    par: number;
    columnVisibility: Record<string, boolean>;
    onReset: () => void;
}

const RANK_STYLES: Record<Rank, { color: string; bg: string }> = {
    GOLD: { color: 'text-amber-600', bg: 'bg-amber-50 border-amber-300' },
    SILVER: { color: 'text-gray-500', bg: 'bg-gray-50 border-gray-300' },
    BRONZE: { color: 'text-orange-700', bg: 'bg-orange-50 border-orange-300' },
};

function RankBadge({ rank, label }: { rank: Rank; label: string }) {
    const style = RANK_STYLES[rank];
    return (
        <div className={cn('flex items-center gap-2 px-4 py-2 border', style.bg)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className={style.color}>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span className={cn('text-sm font-bold uppercase tracking-wide', style.color)}>{label}</span>
        </div>
    );
}

function buildShareGrid(
    guesses: { guess: Entity; feedback: Record<string, Feedback> }[],
    columnVisibility: Record<string, boolean>
): string {
    const keys = Object.keys(columnVisibility);
    return guesses.map(({ feedback }) => {
        return keys.map(key => {
            if (!columnVisibility[key]) return '\u2B1B';
            const status = feedback[key]?.status;
            if (status === 'EXACT') return '\uD83D\uDFE9';
            return '\uD83D\uDFE8';
        }).join('');
    }).join('\n');
}

export function GameOverModal({
    isOpen,
    targetEntity,
    guesses,
    score,
    par,
    columnVisibility,
    onReset,
}: GameOverModalProps) {
    const rankInfo = calculateRank(score, par);

    const handleShare = async () => {
        const emojiGrid = buildShareGrid(guesses, columnVisibility);
        const text = `Scalar | Score: ${score} (Par ${par}) | Rank: ${rankInfo.label}\n\n${emojiGrid}`;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'Scalar',
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
                    "bottom-0 left-0 right-0 w-full border-t border-charcoal pb-10",
                    "data-[state=open]:animate-in data-[state=closed]:animate-out",
                    "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",

                    // Desktop: Centered Modal
                    "md:top-1/2 md:left-1/2 md:bottom-auto md:right-auto md:w-full md:max-w-md md:-translate-x-1/2 md:-translate-y-1/2",
                    "md:border md:pb-6",
                    "md:data-[state=open]:slide-in-from-top-[48%] md:data-[state=open]:slide-in-from-left-1/2",
                    "md:data-[state=closed]:slide-out-to-top-[48%] md:data-[state=closed]:slide-out-to-left-1/2",
                    "md:data-[state=closed]:zoom-out-95 md:data-[state=open]:zoom-in-95"
                )}>

                    <div className="flex flex-col items-center text-center space-y-6">
                        {/* Heading */}
                        <Dialog.Title className="w-full text-2xl font-black uppercase tracking-wider py-4 border border-charcoal bg-charcoal text-paper-white">
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

                        {/* Score */}
                        <div className="w-full font-mono border border-charcoal/20 py-3">
                            <div className="text-3xl font-black">
                                {score} <span className="text-lg font-bold">Strokes</span>
                            </div>
                            <div className="text-sm text-charcoal/50 font-bold mt-1">
                                Par: {par}
                            </div>
                        </div>

                        {/* Rank Badge */}
                        <RankBadge rank={rankInfo.rank} label={rankInfo.label} />

                        {/* Buttons */}
                        <div className="flex w-full gap-4 pt-4">
                            <button
                                onClick={handleShare}
                                className="flex-1 px-4 py-3 border border-charcoal font-bold hover:bg-charcoal/10 transition-colors uppercase text-sm tracking-wide"
                            >
                                Share Result
                            </button>
                            <button
                                onClick={onReset}
                                className="flex-1 px-4 py-3 bg-charcoal text-paper-white font-bold border border-charcoal hover:bg-charcoal/90 transition-colors uppercase text-sm tracking-wide"
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
