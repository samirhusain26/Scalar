import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '../utils/cn';

interface MajorHintModalProps {
    isOpen: boolean;
    attributeLabel: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export function MajorHintModal({ isOpen, attributeLabel, onConfirm, onCancel }: MajorHintModalProps) {
    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onCancel()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <Dialog.Content className={cn(
                    "fixed z-50 bg-paper-white shadow-2xl p-6 focus:outline-none",
                    "top-1/2 left-1/2 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2",
                    "border border-charcoal",
                    "data-[state=open]:animate-in data-[state=closed]:animate-out",
                    "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                    "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                )}>
                    <Dialog.Title className="text-lg font-black uppercase tracking-wide text-charcoal mb-4">
                        Reveal Exact Value?
                    </Dialog.Title>
                    <Dialog.Description className="font-mono text-sm text-charcoal/70 mb-6">
                        Revealing the exact value for <strong>{attributeLabel}</strong> will add <strong>+5 strokes</strong> to your score.
                    </Dialog.Description>
                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-4 py-2.5 border border-charcoal font-bold font-mono text-sm uppercase hover:bg-charcoal/10 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 px-4 py-2.5 bg-charcoal text-paper-white font-bold font-mono text-sm uppercase border border-charcoal hover:bg-charcoal/90 transition-colors"
                        >
                            Reveal (+5)
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
