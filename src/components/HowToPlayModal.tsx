import * as Dialog from '@radix-ui/react-dialog';
import { Eye, ChevronDown } from 'lucide-react';
import { cn } from '../utils/cn';

interface HowToPlayModalProps {
    isOpen: boolean;
    onClose: () => void;
}

/** Mini swatch block used in the color legend */
function Swatch({ className, children }: { className: string; children: React.ReactNode }) {
    return (
        <span className={cn('inline-flex items-center px-2 py-0.5 text-[11px] font-bold font-mono border border-charcoal/20 whitespace-nowrap', className)}>
            {children}
        </span>
    );
}

export function HowToPlayModal({ isOpen, onClose }: HowToPlayModalProps) {
    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <Dialog.Content className={cn(
                    "fixed z-50 bg-paper-white shadow-hard p-6 focus:outline-none overflow-y-auto max-h-[85vh]",
                    "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-2xl border border-charcoal",
                    "data-[state=open]:animate-in data-[state=closed]:animate-out",
                    "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                    "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                )}>
                    {/* Title */}
                    <Dialog.Title className="w-full text-2xl font-black uppercase tracking-wider py-4 border border-charcoal bg-charcoal text-paper-white text-center mb-6 font-serif-display">
                        How to Play
                    </Dialog.Title>

                    <Dialog.Description className="sr-only">
                        Learn how to play Scalar
                    </Dialog.Description>

                    <div className="space-y-6 text-sm text-charcoal font-mono">

                        {/* ── Goal ── */}
                        <p className="text-center leading-relaxed">
                            A mystery target is chosen from the active category.<br />
                            Guess entities and use the feedback to deduce the answer.
                        </p>

                        {/* ── Example Card ── */}
                        <section>
                            <h3 className="font-black uppercase text-xs tracking-widest mb-3 border-b border-charcoal/20 pb-1">
                                Reading a Guess Card
                            </h3>
                            <p className="text-xs text-charcoal/60 mb-2">Each guess shows your entity's attributes compared to the target:</p>

                            {/* Mini example card */}
                            <div className="border border-charcoal bg-paper-white max-w-md mx-auto">
                                {/* Card header */}
                                <div className="flex items-center justify-between px-3 py-1.5 border-b border-charcoal">
                                    <span className="font-bold text-xs uppercase">Brazil</span>
                                    <span className="text-xs text-charcoal/50">#01</span>
                                </div>
                                {/* Mini attribute grid */}
                                <div className="grid grid-cols-2 gap-px bg-charcoal text-[11px]">
                                    {/* Location - miss */}
                                    <div className="col-span-2 px-2 py-1.5 bg-white">
                                        <div className="text-[9px] uppercase opacity-50 tracking-wider">Location</div>
                                        <div className="font-bold">
                                            <span className="opacity-50">Southern</span>
                                            <span className="mx-1 opacity-30">•</span>
                                            <span className="opacity-50">Americas</span>
                                            <span className="mx-1 opacity-30">•</span>
                                            <span className="opacity-50">South America</span>
                                        </div>
                                    </div>
                                    {/* Distance - miss */}
                                    <div className="px-2 py-1.5 bg-white">
                                        <div className="text-[9px] uppercase opacity-50 tracking-wider">Distance</div>
                                        <div className="font-bold">17,362 km</div>
                                    </div>
                                    {/* Population - HIGHER_LOWER with arrow */}
                                    <div className="px-2 py-1.5 bg-thermal-orange text-white">
                                        <div className="text-[9px] uppercase opacity-70 tracking-wider">Population</div>
                                        <div className="flex justify-between items-baseline">
                                            <span className="font-bold">213M</span>
                                            <span className="text-[10px] opacity-80">↓ ~50%</span>
                                        </div>
                                    </div>
                                    {/* Landlocked - exact */}
                                    <div className="px-2 py-1.5 bg-thermal-green text-white">
                                        <div className="text-[9px] uppercase opacity-70 tracking-wider">Landlocked?</div>
                                        <div className="font-bold">No</div>
                                    </div>
                                    {/* Area - miss */}
                                    <div className="px-2 py-1.5 bg-white">
                                        <div className="text-[9px] uppercase opacity-50 tracking-wider">Area</div>
                                        <div className="flex justify-between items-baseline">
                                            <span className="font-bold">8.5M</span>
                                            <span className="text-[10px] opacity-70">↑ ~100%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* ── Color Legend ── */}
                        <section>
                            <h3 className="font-black uppercase text-xs tracking-widest mb-3 border-b border-charcoal/20 pb-1">
                                Cell Colors
                            </h3>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                <div className="flex items-center gap-2">
                                    <Swatch className="bg-thermal-green text-white">Exact</Swatch>
                                    <span className="text-xs">Perfect match</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Swatch className="bg-thermal-orange text-white">Hot</Swatch>
                                    <span className="text-xs">Very close</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Swatch className="bg-amber-100 border-dashed !border-amber-400">Near</Swatch>
                                    <span className="text-xs">Right ballpark</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Swatch className="bg-white">Miss</Swatch>
                                    <span className="text-xs">Far off</span>
                                </div>
                            </div>
                        </section>

                        {/* ── Arrows ── */}
                        <section>
                            <h3 className="font-black uppercase text-xs tracking-widest mb-3 border-b border-charcoal/20 pb-1">
                                Direction Arrows
                            </h3>
                            <p className="text-xs text-charcoal/60 mb-2">Numeric cells show an arrow and a proximity tier telling you how far off you are:</p>
                            <div className="flex flex-wrap gap-3">
                                <div className="flex items-center gap-2 border border-charcoal/20 px-3 py-1.5">
                                    <span className="text-base font-bold">↑</span>
                                    <span className="text-xs">Target is <strong>higher</strong></span>
                                </div>
                                <div className="flex items-center gap-2 border border-charcoal/20 px-3 py-1.5">
                                    <span className="text-base font-bold">↓</span>
                                    <span className="text-xs">Target is <strong>lower</strong></span>
                                </div>
                                <div className="flex items-center gap-2 border border-charcoal/20 px-3 py-1.5">
                                    <span className="text-xs font-mono opacity-70">~25%</span>
                                    <span className="text-xs">How far off (tier)</span>
                                </div>
                            </div>
                        </section>

                        {/* ── Scoring + Hints (merged for brevity) ── */}
                        <section>
                            <h3 className="font-black uppercase text-xs tracking-widest mb-3 border-b border-charcoal/20 pb-1">
                                Scoring &amp; Hints
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Scoring */}
                                <div>
                                    <p className="text-xs text-charcoal/60 mb-1.5">Lower moves = better score</p>
                                    <ul className="space-y-1 text-xs leading-relaxed">
                                        <li><strong>+1 move</strong> per guess</li>
                                        <li><strong>+3 moves</strong> per hint (after free credits)</li>
                                        <li><strong>Reveal Answer</strong> = forfeit (score &infin;)</li>
                                    </ul>
                                </div>

                                {/* Hints */}
                                <div>
                                    <p className="text-xs text-charcoal/60 mb-1.5">3 free hint credits per game</p>
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <div className="flex items-center gap-1">
                                            {[0, 1, 2].map(i => (
                                                <div
                                                    key={i}
                                                    className={`w-2.5 h-2.5 border border-charcoal ${i < 2 ? 'bg-charcoal' : 'bg-transparent'}`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-[10px] text-charcoal/50">2 credits left</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-charcoal/70">
                                        <Eye className="w-3 h-3 opacity-50" />
                                        <span>Tap the eye icon on any cell to reveal the target value</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* ── More Clues ── */}
                        <section>
                            <h3 className="font-black uppercase text-xs tracking-widest mb-3 border-b border-charcoal/20 pb-1">
                                More Clues
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-charcoal/70">
                                <div className="flex items-center gap-1 border border-charcoal/20 px-2 py-1 text-[10px] uppercase tracking-wider text-charcoal/50">
                                    <span>More clues</span>
                                    <ChevronDown className="w-3 h-3" />
                                </div>
                                <span>Each card has extra attributes in a collapsible section — free to expand.</span>
                            </div>
                        </section>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="w-full mt-6 px-4 py-3 bg-charcoal text-paper-white font-bold border border-charcoal hover:bg-paper-white hover:text-charcoal transition-colors uppercase text-sm tracking-wide"
                    >
                        Got It
                    </button>

                    <Dialog.Close className="absolute top-4 right-4 text-paper-white opacity-70 hover:opacity-100 transition-opacity" aria-label="Close">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </Dialog.Close>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
