import * as Dialog from '@radix-ui/react-dialog';
import { X, Sparkles } from 'lucide-react';
import { cn } from '../utils/cn';
import { RELEASES, type ChangeTag } from '../utils/changelog';

// Re-export so App.tsx can import from a single place
export { WHATS_NEW_VERSION, WHATS_NEW_STORAGE_KEY } from '../utils/changelog';

// ── Tag styles ────────────────────────────────────────────────────────────────

const TAG_STYLES: Record<ChangeTag, { dot: string; label: string }> = {
    new:         { dot: 'bg-thermal-green',   label: 'NEW' },
    fix:         { dot: 'bg-thermal-orange',   label: 'FIX' },
    improvement: { dot: 'bg-charcoal/40',      label: '' },
};

// ── Component ─────────────────────────────────────────────────────────────────

interface WhatsNewModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function WhatsNewModal({ isOpen, onClose }: WhatsNewModalProps) {
    const release = RELEASES[0];

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <Dialog.Content className={cn(
                    "fixed z-50 focus:outline-none",
                    "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-md",
                    "flex flex-col max-h-[85vh]",
                    "border border-charcoal bg-paper-white shadow-hard",
                    "data-[state=open]:animate-in data-[state=closed]:animate-out",
                    "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                    "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                )}>
                    {/* Sticky header */}
                    <div className="sticky top-0 z-10 bg-charcoal text-paper-white shrink-0 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <Sparkles size={16} className="text-thermal-orange shrink-0" />
                            <Dialog.Title className="font-serif-display font-black text-xl uppercase tracking-wider">
                                What's New
                            </Dialog.Title>
                            <span className="text-[10px] font-mono text-paper-white/40 border border-paper-white/20 px-1.5 py-0.5 uppercase tracking-widest">
                                {release.version}
                            </span>
                        </div>
                        <Dialog.Close
                            onClick={onClose}
                            className="text-paper-white/70 hover:text-paper-white transition-colors touch-manipulation p-1 focus:outline-none"
                            aria-label="Close"
                        >
                            <X size={20} />
                        </Dialog.Close>
                    </div>

                    <Dialog.Description className="sr-only">
                        What's new in Scalar {release.version}
                    </Dialog.Description>

                    {/* Scrollable body */}
                    <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
                        {release.sections.map((section) => (
                            <section key={section.label}>
                                <div className="border-b border-charcoal/20 pb-1.5 mb-3">
                                    <h3 className="font-black text-xs uppercase tracking-widest text-charcoal">
                                        {section.label}
                                    </h3>
                                </div>
                                <ul className="space-y-2.5">
                                    {section.items.map((item, i) => {
                                        const style = TAG_STYLES[item.tag];
                                        return (
                                            <li key={i} className="flex gap-2.5 items-start">
                                                <span className={cn("mt-1.5 w-1.5 h-1.5 shrink-0", style.dot)} />
                                                <span className="text-xs font-mono text-charcoal/80 leading-relaxed">
                                                    {style.label && (
                                                        <span className="font-black text-[10px] uppercase tracking-widest mr-1.5 text-charcoal/50">
                                                            {style.label}
                                                        </span>
                                                    )}
                                                    {item.text}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </section>
                        ))}

                        {/* Got It button */}
                        <button
                            onClick={onClose}
                            className="mt-2 w-full bg-charcoal text-paper-white py-3 font-bold uppercase text-sm tracking-wide hover:bg-paper-white hover:text-charcoal border border-charcoal transition-colors touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-charcoal"
                        >
                            Got It
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
