import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '../utils/cn';

interface HowToPlayModalProps {
    isOpen: boolean;
    onClose: () => void;
}

function FeedbackSwatch({ color, label }: { color: string; label: string }) {
    return (
        <div className="flex items-center gap-2">
            <div className={cn('w-5 h-5 border border-charcoal/30 shrink-0', color)} />
            <span>{label}</span>
        </div>
    );
}

export function HowToPlayModal({ isOpen, onClose }: HowToPlayModalProps) {
    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <Dialog.Content className={cn(
                    "fixed z-50 bg-paper-white shadow-hard p-6 focus:outline-none transition-all duration-200 overflow-y-auto max-h-[85vh]",
                    // Mobile: Bottom Sheet
                    "bottom-0 left-0 right-0 w-full border-t border-charcoal pb-10",
                    "data-[state=open]:animate-in data-[state=closed]:animate-out",
                    "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
                    // Desktop: Centered Modal
                    "md:top-1/2 md:left-1/2 md:bottom-auto md:right-auto md:w-full md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2",
                    "md:border md:pb-6",
                    "md:data-[state=open]:slide-in-from-top-[48%] md:data-[state=open]:slide-in-from-left-1/2",
                    "md:data-[state=closed]:slide-out-to-top-[48%] md:data-[state=closed]:slide-out-to-left-1/2",
                    "md:data-[state=closed]:zoom-out-95 md:data-[state=open]:zoom-in-95"
                )}>
                    {/* Title */}
                    <Dialog.Title className="w-full text-2xl font-black uppercase tracking-wider py-4 border border-charcoal bg-charcoal text-paper-white text-center mb-6 font-serif-display">
                        How to Play
                    </Dialog.Title>

                    <Dialog.Description className="sr-only">
                        Learn how to play Scalar
                    </Dialog.Description>

                    <div className="space-y-5 text-sm text-charcoal font-mono">
                        {/* Goal */}
                        <section>
                            <h3 className="font-black uppercase text-xs tracking-widest mb-2 border-b border-charcoal/20 pb-1">
                                Goal
                            </h3>
                            <p className="leading-relaxed">
                                Guess the hidden entity by deducing its attributes. Each round picks a mystery target from the active category &mdash; countries, hollywood, chemicals, or animals.
                            </p>
                        </section>

                        {/* How It Works */}
                        <section>
                            <h3 className="font-black uppercase text-xs tracking-widest mb-2 border-b border-charcoal/20 pb-1">
                                How It Works
                            </h3>
                            <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
                                <li>Pick a <strong>category</strong> from the tabs at the top.</li>
                                <li>Type a guess into the input field and press Enter.</li>
                                <li>Each attribute of your guess is compared to the target and color-coded.</li>
                                <li>Use the feedback to narrow down your next guess.</li>
                                <li>Keep guessing until every cell turns gold!</li>
                            </ol>
                        </section>

                        {/* Feedback Colors */}
                        <section>
                            <h3 className="font-black uppercase text-xs tracking-widest mb-2 border-b border-charcoal/20 pb-1">
                                Feedback Colors
                            </h3>
                            <div className="space-y-2">
                                <FeedbackSwatch color="bg-thermal-gold" label="Exact &mdash; you matched this attribute perfectly." />
                                <FeedbackSwatch color="bg-thermal-orange" label="Hot &mdash; you're very close to the target value." />
                                <FeedbackSwatch color="bg-amber-100 border-dashed !border-amber-400" label="Near &mdash; in the right ballpark, but not quite." />
                                <FeedbackSwatch color="bg-gray-200" label="Miss &mdash; far from the target value." />
                            </div>
                        </section>

                        {/* Direction Arrows */}
                        <section>
                            <h3 className="font-black uppercase text-xs tracking-widest mb-2 border-b border-charcoal/20 pb-1">
                                Direction Indicators
                            </h3>
                            <p className="leading-relaxed mb-2">
                                For numeric attributes, a thick border on the cell tells you which way to adjust:
                            </p>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 border-t-[4px] border-t-black bg-gray-200 border border-charcoal/30 shrink-0" />
                                    <span><strong>Top border</strong> &mdash; the target is higher.</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 border-b-[4px] border-b-black bg-gray-200 border border-charcoal/30 shrink-0" />
                                    <span><strong>Bottom border</strong> &mdash; the target is lower.</span>
                                </div>
                            </div>
                        </section>

                        {/* Scoring */}
                        <section>
                            <h3 className="font-black uppercase text-xs tracking-widest mb-2 border-b border-charcoal/20 pb-1">
                                Scoring
                            </h3>
                            <p className="leading-relaxed mb-2">
                                Scoring works like golf &mdash; lower is better.
                            </p>
                            <ul className="space-y-1.5 leading-relaxed">
                                <li><strong>+1 stroke</strong> for each guess submitted.</li>
                                <li><strong>+1 stroke</strong> for revealing a hidden column.</li>
                                <li><strong>+5 strokes</strong> for using a major hint.</li>
                            </ul>
                            <p className="leading-relaxed mt-2">
                                <strong>Par is 4.</strong> Try to solve each puzzle at or under par for the best rank.
                            </p>
                        </section>

                        {/* Ranks */}
                        <section>
                            <h3 className="font-black uppercase text-xs tracking-widest mb-2 border-b border-charcoal/20 pb-1">
                                Ranks
                            </h3>
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <span className="text-thermal-gold font-black">GOLD</span>
                                    <span>&mdash; Editorial Choice (at or under par)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-500 font-black">SILVER</span>
                                    <span>&mdash; Subscriber (up to 3 over par)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-orange-700 font-black">BRONZE</span>
                                    <span>&mdash; Casual Reader (more than 3 over par)</span>
                                </div>
                            </div>
                        </section>

                        {/* Hints */}
                        <section>
                            <h3 className="font-black uppercase text-xs tracking-widest mb-2 border-b border-charcoal/20 pb-1">
                                Hints
                            </h3>
                            <p className="leading-relaxed">
                                Some columns start hidden. Click a hidden column header to reveal it (+1 stroke). You can also request a major hint on numeric columns for a descriptive range clue (+5 strokes). Use hints strategically to stay under par.
                            </p>
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
