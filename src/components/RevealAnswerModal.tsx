import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '../utils/cn';
import type { Entity, CategorySchema } from '../types';
import { formatNumber } from '../utils/formatters';
import { getDisplayColumns } from '../utils/schemaParser';

interface RevealAnswerModalProps {
    isOpen: boolean;
    targetEntity: Entity;
    schema: CategorySchema;
    onNewGame: () => void;
}

export function RevealAnswerModal({
    isOpen,
    targetEntity,
    schema,
    onNewGame,
}: RevealAnswerModalProps) {
    const displayFields = getDisplayColumns(schema);

    return (
        <Dialog.Root open={isOpen}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <Dialog.Content className={cn(
                    "fixed z-50 bg-paper-white shadow-hard p-6 focus:outline-none transition-all duration-200",
                    "bottom-0 left-0 right-0 w-full border-t border-charcoal pb-10",
                    "data-[state=open]:animate-in data-[state=closed]:animate-out",
                    "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
                    "md:top-1/2 md:left-1/2 md:bottom-auto md:right-auto md:w-full md:max-w-md md:-translate-x-1/2 md:-translate-y-1/2",
                    "md:border md:pb-6",
                    "md:data-[state=open]:slide-in-from-top-[48%] md:data-[state=open]:slide-in-from-left-1/2",
                    "md:data-[state=closed]:slide-out-to-top-[48%] md:data-[state=closed]:slide-out-to-left-1/2",
                    "md:data-[state=closed]:zoom-out-95 md:data-[state=open]:zoom-in-95"
                )}>
                    <div className="flex flex-col items-center text-center space-y-6">
                        <Dialog.Title className="w-full text-2xl font-black uppercase tracking-wider py-4 border border-charcoal bg-charcoal text-paper-white font-serif-display">
                            Answer Revealed
                        </Dialog.Title>

                        <Dialog.Description className="sr-only">
                            The answer and all its details
                        </Dialog.Description>

                        {/* Entity Name */}
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-2xl font-black uppercase tracking-wide">{targetEntity.name}</span>
                        </div>

                        {/* Attribute Details */}
                        <div className="w-full border border-charcoal/20 max-h-60 overflow-y-auto">
                            {displayFields.map((field, i) => {
                                const value = targetEntity[field.attributeKey];
                                if (value === undefined || value === null) return null;

                                let displayVal: string;
                                if (typeof value === 'number') {
                                    displayVal = formatNumber(value);
                                } else if (typeof value === 'boolean') {
                                    displayVal = value ? 'Yes' : 'No';
                                } else {
                                    displayVal = String(value);
                                }

                                return (
                                    <div
                                        key={field.attributeKey}
                                        className={cn(
                                            "flex justify-between items-center px-4 py-2.5 font-mono text-sm",
                                            i < displayFields.length - 1 && "border-b border-charcoal/10"
                                        )}
                                    >
                                        <span className="font-bold uppercase text-charcoal/60 text-xs tracking-wide">
                                            {field.displayLabel}
                                        </span>
                                        <span className="font-bold text-charcoal">
                                            {displayVal}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* New Game Button */}
                        <div className="flex w-full pt-4">
                            <button
                                onClick={onNewGame}
                                className="flex-1 px-4 py-3 bg-charcoal text-paper-white font-bold border border-charcoal hover:bg-paper-white hover:text-charcoal transition-colors uppercase text-sm tracking-wide"
                            >
                                New Game
                            </button>
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
