import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Difficulty } from '../types';
import { DIFFICULTY_CONFIG } from '../utils/difficultyConfig';

interface DifficultyDropdownProps {
    difficulty: Difficulty;
    locked: boolean; // true when a game is actively in progress
    onChange: (difficulty: Difficulty) => void;
}

const TIERS: { value: Difficulty; description: string }[] = [
    { value: 'novice', description: '5 hints · 12 suggestions · all columns' },
    { value: 'scholar', description: '3 hints · 6 suggestions · all columns' },
    { value: 'prodigy', description: '0 hints · no suggestions · fewer columns' },
];

export function DifficultyDropdown({ difficulty, locked, onChange }: DifficultyDropdownProps) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') setOpen(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [open]);

    const label = DIFFICULTY_CONFIG[difficulty].displayName;

    return (
        <div ref={containerRef} className="relative shrink-0">
            <button
                onClick={() => !locked && setOpen(o => !o)}
                disabled={locked}
                title={locked ? 'Cannot change difficulty mid-game' : undefined}
                className={[
                    'flex items-center gap-1.5 px-3 py-1.5',
                    'border border-charcoal font-mono text-xs font-bold uppercase tracking-wide',
                    'transition-colors touch-manipulation',
                    locked
                        ? 'opacity-40 cursor-not-allowed bg-transparent text-charcoal'
                        : 'bg-transparent text-charcoal hover:bg-charcoal hover:text-paper-white cursor-pointer',
                ].join(' ')}
            >
                <span>{label}</span>
                <ChevronDown
                    size={11}
                    className={['transition-transform duration-150', open ? 'rotate-180' : ''].join(' ')}
                />
            </button>

            {open && (
                <div className="absolute left-0 top-full z-50 mt-0.5 border border-charcoal bg-paper-white shadow-hard-sm min-w-[200px]">
                    {TIERS.map(({ value, description }) => (
                        <button
                            key={value}
                            onClick={() => {
                                onChange(value);
                                setOpen(false);
                            }}
                            className={[
                                'w-full text-left px-3 py-2 font-mono text-xs touch-manipulation',
                                'transition-colors border-b border-charcoal/20 last:border-b-0',
                                value === difficulty
                                    ? 'bg-charcoal text-paper-white'
                                    : 'bg-transparent text-charcoal hover:bg-charcoal/10',
                            ].join(' ')}
                        >
                            <div className="font-bold uppercase tracking-wide">{DIFFICULTY_CONFIG[value].displayName}</div>
                            <div className="opacity-60 mt-0.5 normal-case font-normal tracking-normal">{description}</div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
