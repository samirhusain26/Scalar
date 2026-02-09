import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '../utils/cn';
import type { Entity, CategorySchema } from '../types';
import { formatNumber } from '../utils/formatters';

interface RevealAnswerModalProps {
    isOpen: boolean;
    targetEntity: Entity;
    schema: CategorySchema;
    onNewGame: () => void;
}

function formatValue(value: string | number, key: string, schema: CategorySchema): string {
    const field = schema[key];
    if (!field) return String(value);

    if (typeof value === 'number') {
        const prefix = field.unitPrefix || '';
        const suffix = field.unitSuffix || '';
        return `${prefix}${formatNumber(value)}${suffix}`;
    }
    return String(value);
}

export function RevealAnswerModal({
    isOpen,
    targetEntity,
    schema,
    onNewGame,
}: RevealAnswerModalProps) {
    const attributeKeys = Object.keys(schema).filter(k => k !== 'id' && k !== 'name');

    return (
        <Dialog.Root open={isOpen}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <Dialog.Content className={cn(
                    "fixed z-50 bg-paper-white shadow-2xl p-6 focus:outline-none transition-all duration-200",
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
                        <Dialog.Title className="w-full text-2xl font-black uppercase tracking-wider py-4 border border-charcoal bg-charcoal text-paper-white">
                            Answer Revealed
                        </Dialog.Title>

                        <Dialog.Description className="sr-only">
                            The answer and all its details
                        </Dialog.Description>

                        {/* Entity Name */}
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

                        {/* Attribute Details */}
                        <div className="w-full border border-charcoal/20">
                            {attributeKeys.map((key, i) => {
                                const field = schema[key];
                                const value = targetEntity[key];
                                if (value === undefined || value === null) return null;
                                return (
                                    <div
                                        key={key}
                                        className={cn(
                                            "flex justify-between items-center px-4 py-2.5 font-mono text-sm",
                                            i < attributeKeys.length - 1 && "border-b border-charcoal/10"
                                        )}
                                    >
                                        <span className="font-bold uppercase text-charcoal/60 text-xs tracking-wide">
                                            {field?.label || key}
                                        </span>
                                        <span className="font-bold text-charcoal">
                                            {formatValue(value, key, schema)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* New Game Button */}
                        <div className="flex w-full pt-4">
                            <button
                                onClick={onNewGame}
                                className="flex-1 px-4 py-3 bg-charcoal text-paper-white font-bold border border-charcoal hover:bg-charcoal/90 transition-colors uppercase text-sm tracking-wide"
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
