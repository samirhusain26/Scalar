import * as Dialog from '@radix-ui/react-dialog';
import { Eye, X } from 'lucide-react';
import { cn } from '../utils/cn';

interface HowToPlayModalProps {
    isOpen: boolean;
    onClose: () => void;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
    return (
        <div className="border-b border-charcoal/20 pb-1.5 mb-3">
            <h3 className="font-black text-xs uppercase tracking-widest text-charcoal">
                {children}
            </h3>
        </div>
    );
}

const PROXIMITY_TIERS = ['~10%', '~25%', '~50%', '~2×', '~5×', '~10×', '~50×', '~100×'];

export function HowToPlayModal({ isOpen, onClose }: HowToPlayModalProps) {
    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <Dialog.Content className={cn(
                    "fixed z-50 focus:outline-none",
                    "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-2xl",
                    "flex flex-col max-h-[85vh]",
                    "border border-charcoal bg-paper-white shadow-hard",
                    "data-[state=open]:animate-in data-[state=closed]:animate-out",
                    "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                    "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                )}>
                    {/* Sticky header */}
                    <div className="sticky top-0 z-10 bg-charcoal text-paper-white flex items-center justify-between px-6 py-4 shrink-0">
                        <Dialog.Title className="font-serif-display font-black text-2xl uppercase tracking-wider">
                            How to Play
                        </Dialog.Title>
                        <Dialog.Close
                            onClick={onClose}
                            className="text-paper-white/70 hover:text-paper-white transition-colors touch-manipulation p-1 focus:outline-none"
                            aria-label="Close"
                        >
                            <X size={20} />
                        </Dialog.Close>
                    </div>

                    <Dialog.Description className="sr-only">
                        Learn how to play Scalar
                    </Dialog.Description>

                    {/* Scrollable body */}
                    <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6 text-sm text-charcoal font-mono">

                        {/* ── Intro ── */}
                        <div className="border-l-2 border-charcoal pl-4 py-1">
                            <p className="font-mono text-sm text-charcoal leading-relaxed">
                                A mystery entity is chosen at random.
                                <br />
                                Guess to get clues. Use the clues to find the answer.
                                <br />
                                <span className="text-charcoal/50 text-xs">
                                    Fewest moves wins — every guess costs +1 move.
                                </span>
                            </p>
                        </div>

                        {/* ── Reading a Guess Card ── */}
                        <section>
                            <SectionHeading>Reading a Guess Card</SectionHeading>

                            <div className="pointer-events-none w-[90%] md:w-4/5 mx-auto border border-charcoal/40 bg-paper-white">
                                {/* Card header */}
                                <div className="flex items-center justify-between px-3 py-1.5 border-b border-charcoal">
                                    <span className="font-bold text-xs uppercase">Brazil</span>
                                    <span className="text-xs text-charcoal/50">#01</span>
                                </div>

                                {/* Attribute grid */}
                                <div className="grid grid-cols-2 gap-px bg-charcoal text-[11px]">

                                    {/* Location — all miss */}
                                    <div className="col-span-2 px-2 py-1.5 bg-white">
                                        <div className="text-[9px] uppercase opacity-50 tracking-wider mb-0.5">
                                            Location (Hemisphere | Continent | Region)
                                        </div>
                                        <div className="font-bold">
                                            <span className="opacity-50">Southern</span>
                                            <span className="mx-1 opacity-30">•</span>
                                            <span className="opacity-50">Americas</span>
                                            <span className="mx-1 opacity-30">•</span>
                                            <span className="opacity-50">South America</span>
                                        </div>
                                    </div>

                                    {/* Distance — miss */}
                                    <div className="px-2 py-1.5 bg-white">
                                        <div className="text-[9px] uppercase opacity-50 tracking-wider mb-0.5">Distance</div>
                                        <div className="font-bold">17,362 km</div>
                                    </div>

                                    {/* Population — HOT */}
                                    <div className="px-2 py-1.5 bg-thermal-orange text-white">
                                        <div className="text-[9px] uppercase opacity-70 tracking-wider mb-0.5">Population</div>
                                        <div className="flex justify-between items-baseline">
                                            <span className="font-bold">213M</span>
                                            <span className="text-[10px] opacity-90">↑ ~5×</span>
                                        </div>
                                    </div>

                                    {/* Landlocked — EXACT */}
                                    <div className="px-2 py-1.5 bg-thermal-green text-white">
                                        <div className="text-[9px] uppercase opacity-70 tracking-wider mb-0.5">Landlocked?</div>
                                        <div className="font-bold">No ✓</div>
                                    </div>

                                    {/* Area — MISS */}
                                    <div className="px-2 py-1.5 bg-white">
                                        <div className="text-[9px] uppercase opacity-50 tracking-wider mb-0.5">Area</div>
                                        <div className="flex justify-between items-baseline">
                                            <span className="font-bold">8.5M km²</span>
                                            <span className="text-[10px] opacity-70">↓ ~50%</span>
                                        </div>
                                    </div>

                                    {/* Govt. Type — MISS */}
                                    <div className="col-span-2 px-2 py-1.5 bg-white">
                                        <div className="text-[9px] uppercase opacity-50 tracking-wider mb-0.5">Govt. Type</div>
                                        <div className="font-bold opacity-60">Federal Republic</div>
                                    </div>

                                </div>
                            </div>

                            {/* Annotations */}
                            <div className="w-[90%] md:w-4/5 mx-auto mt-2 space-y-1">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 bg-thermal-green shrink-0" />
                                    <span className="text-[10px] font-mono text-charcoal/50 italic">
                                        Green = exact match — target value confirmed
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 bg-thermal-orange shrink-0" />
                                    <span className="text-[10px] font-mono text-charcoal/50 italic">
                                        Orange = same tier as target (↑ means target is higher)
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 bg-white border border-charcoal/30 shrink-0" />
                                    <span className="text-[10px] font-mono text-charcoal/50 italic">
                                        White = miss — far from target value
                                    </span>
                                </div>
                            </div>
                        </section>

                        {/* ── Cell Colors ── */}
                        <section>
                            <SectionHeading>Cell Colors</SectionHeading>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[
                                    { bg: 'bg-thermal-green', text: 'text-white', label: 'Exact', desc: 'Perfect match' },
                                    { bg: 'bg-thermal-orange', text: 'text-white', label: 'Hot', desc: 'Same category tier' },
                                    { bg: 'bg-amber-100 border border-dashed border-amber-400', text: 'text-charcoal', label: 'Near', desc: 'Adjacent tier' },
                                    { bg: 'bg-white border border-charcoal/30', text: 'text-charcoal', label: 'Miss', desc: 'Far off' },
                                ].map(({ bg, text, label, desc }) => (
                                    <div key={label} className="flex flex-col items-center gap-1.5">
                                        <div className={`${bg} ${text} px-3 py-1.5 w-full text-center text-xs font-bold uppercase tracking-wide`}>
                                            {label}
                                        </div>
                                        <span className="text-[11px] font-mono text-charcoal/60 text-center">{desc}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* ── Direction & Proximity ── */}
                        <section>
                            <SectionHeading>Direction &amp; Proximity</SectionHeading>

                            {/* Direction pills */}
                            <div className="flex items-center gap-3 flex-wrap mb-4">
                                <div className="flex items-center gap-1.5 border border-charcoal px-3 py-1.5">
                                    <span className="text-base font-bold">↑</span>
                                    <span className="text-xs font-mono">Target is <strong>higher</strong></span>
                                </div>
                                <div className="flex items-center gap-1.5 border border-charcoal px-3 py-1.5">
                                    <span className="text-base font-bold">↓</span>
                                    <span className="text-xs font-mono">Target is <strong>lower</strong></span>
                                </div>
                                <div className="flex items-center gap-1.5 border border-charcoal px-3 py-1.5">
                                    <span className="text-base font-bold">→</span>
                                    <span className="text-xs font-mono">Later in alphabet</span>
                                </div>
                            </div>

                            {/* Proximity tier strip */}
                            <div className="space-y-2">
                                <p className="text-[11px] font-mono text-charcoal/50 uppercase tracking-wider">
                                    Proximity tiers for numeric attributes:
                                </p>
                                <div className="flex gap-px overflow-x-auto">
                                    {PROXIMITY_TIERS.map((tier, i) => {
                                        const opacity = 1 - (i / PROXIMITY_TIERS.length) * 0.75;
                                        return (
                                            <div
                                                key={tier}
                                                style={{ backgroundColor: `rgba(24, 24, 27, ${opacity * 0.12})` }}
                                                className="px-2 py-1.5 text-[10px] font-mono border border-charcoal/10 whitespace-nowrap shrink-0 text-charcoal"
                                            >
                                                {tier}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[10px] font-mono text-charcoal/40">← Closer</span>
                                    <span className="text-[10px] font-mono text-charcoal/40">Further →</span>
                                </div>
                            </div>
                        </section>

                        {/* ── Scoring & Hints ── */}
                        <section>
                            <SectionHeading>Scoring &amp; Hints</SectionHeading>
                            <div className="space-y-3">

                                {/* Move costs table */}
                                <div className="border border-charcoal/20 overflow-hidden">
                                    <div className="bg-charcoal/5 px-3 py-1.5 border-b border-charcoal/10">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-charcoal/60">
                                            Move Costs — Lower is Better
                                        </span>
                                    </div>
                                    {[
                                        { cost: '+1', action: 'Submit a guess' },
                                        { cost: '+0', action: 'Reveal a hint (using a free credit)' },
                                        { cost: '+3', action: 'Reveal a hint (no credits left)' },
                                        { cost: '—', action: 'Reveal Answer forfeits the game' },
                                    ].map(({ cost, action }) => (
                                        <div
                                            key={action}
                                            className="flex items-center gap-4 px-3 py-2 border-b border-charcoal/10 last:border-0"
                                        >
                                            <span className="text-sm font-black font-mono w-8 shrink-0 text-charcoal">
                                                {cost}
                                            </span>
                                            <span className="text-xs font-mono text-charcoal/70">
                                                {action}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Hint credits */}
                                <div className="flex items-start gap-3 px-3 py-2.5 border border-charcoal/20">
                                    <div className="flex items-center gap-1 shrink-0 pt-0.5">
                                        {[0, 1, 2].map(i => (
                                            <div key={i} className="w-3 h-3 bg-charcoal border border-charcoal" />
                                        ))}
                                    </div>
                                    <p className="text-xs font-mono text-charcoal leading-relaxed">
                                        <strong>3 free hint credits</strong> per game. Tap the{' '}
                                        <Eye className="inline w-3 h-3 mx-0.5" /> eye icon on any
                                        cell to reveal the exact target value. Credits reset on new game.
                                    </p>
                                </div>

                            </div>
                        </section>

                        {/* Got It button — inline at end of content */}
                        <button
                            onClick={onClose}
                            className="w-full bg-charcoal text-paper-white py-3 font-bold uppercase text-sm tracking-wide hover:bg-paper-white hover:text-charcoal border border-charcoal transition-colors touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-charcoal"
                        >
                            Got It
                        </button>

                    </div>

                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
