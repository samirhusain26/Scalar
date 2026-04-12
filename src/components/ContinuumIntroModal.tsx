import * as Dialog from '@radix-ui/react-dialog';
import { useNavigate } from 'react-router-dom';
import { X, ArrowUpDown } from 'lucide-react';
import { cn } from '../utils/cn';

export const CONTINUUM_INTRO_KEY = 'scalar-continuum-intro-count';
const MAX_SHOWS = 2;

export function getContinuumIntroCount(): number {
    return parseInt(localStorage.getItem(CONTINUUM_INTRO_KEY) ?? '0', 10);
}

export function shouldShowContinuumIntro(): boolean {
    return getContinuumIntroCount() < MAX_SHOWS;
}

export function incrementContinuumIntroCount(): void {
    const next = getContinuumIntroCount() + 1;
    localStorage.setItem(CONTINUUM_INTRO_KEY, String(next));
}

interface ContinuumIntroModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const FEATURES = [
    { icon: '📏', text: 'Three anchor cards set the scale — rank incoming cards between them' },
    { icon: '🃏', text: 'Drag each card to the right position in the ranked timeline' },
    { icon: '❤️', text: '3 lives — place wrong and you lose one. Keep going until they\'re gone' },
    { icon: '📅', text: 'One new puzzle every day, across Countries and Elements' },
];

export function ContinuumIntroModal({ isOpen, onClose }: ContinuumIntroModalProps) {
    const navigate = useNavigate();

    const handlePlay = () => {
        onClose();
        navigate('/continuum');
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <Dialog.Content className={cn(
                    "fixed z-50 focus:outline-none",
                    "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-md",
                    "flex flex-col",
                    "border-2 border-[#14B8A6] bg-paper-white shadow-[6px_6px_0px_0px_rgba(20,184,166,0.3)]",
                    "data-[state=open]:animate-in data-[state=closed]:animate-out",
                    "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                    "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                )}>
                    {/* Header — teal, distinct from Scalar's charcoal */}
                    <div className="bg-[#14B8A6] px-6 py-5 flex items-start justify-between shrink-0">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <ArrowUpDown size={18} className="text-white/80 shrink-0" />
                                <Dialog.Title className="font-mono font-black text-xl uppercase tracking-widest text-white">
                                    Continuum
                                </Dialog.Title>
                                <span className="text-[10px] font-mono font-bold text-white/50 border border-white/30 px-1.5 py-0.5 uppercase tracking-widest">
                                    NEW GAME
                                </span>
                            </div>
                            <p className="font-mono text-sm text-white/70 leading-snug">
                                A second daily game — now live on Scalar
                            </p>
                        </div>
                        <Dialog.Close
                            onClick={onClose}
                            className="text-white/60 hover:text-white transition-colors touch-manipulation p-1 focus:outline-none shrink-0 mt-0.5"
                            aria-label="Close"
                        >
                            <X size={18} />
                        </Dialog.Close>
                    </div>

                    <Dialog.Description className="sr-only">
                        Continuum is a new daily ranking game on Scalar
                    </Dialog.Description>

                    {/* Feature list */}
                    <div className="px-6 py-5 flex flex-col gap-3">
                        {FEATURES.map(({ icon, text }) => (
                            <div key={text} className="flex items-start gap-3">
                                <span className="text-lg leading-none shrink-0 mt-0.5">{icon}</span>
                                <span className="font-mono text-sm text-charcoal/80 leading-relaxed">{text}</span>
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="px-6 pb-6 flex flex-col gap-3">
                        <button
                            onClick={handlePlay}
                            className="w-full py-3 bg-[#14B8A6] text-white font-mono font-black text-sm uppercase tracking-widest hover:bg-[#0F9688] transition-colors touch-manipulation focus:outline-none"
                        >
                            Play Continuum →
                        </button>
                        <button
                            onClick={onClose}
                            className="text-center text-[10px] font-bold uppercase tracking-widest text-charcoal/40 hover:text-charcoal/70 transition-colors"
                        >
                            Maybe later
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
