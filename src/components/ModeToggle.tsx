import { CalendarDays } from 'lucide-react';
import type { GameMode } from '../types';

interface ModeToggleProps {
    activeMode: GameMode;
    dateLabel: string; // e.g. "Feb 26"
    onChange: (mode: GameMode) => void;
}

export function ModeToggle({ activeMode, dateLabel, onChange }: ModeToggleProps) {
    return (
        <div className="flex items-center border border-charcoal shrink-0">
            <button
                onClick={() => onChange('daily')}
                className={[
                    'flex items-center gap-1 px-3 py-1.5 text-xs font-bold uppercase tracking-wide',
                    'transition-colors touch-manipulation font-mono border-r border-charcoal',
                    activeMode === 'daily'
                        ? 'bg-charcoal text-paper-white'
                        : 'bg-transparent text-charcoal hover:bg-charcoal/10',
                ].join(' ')}
            >
                <CalendarDays size={11} />
                <span>Daily · {dateLabel}</span>
            </button>
            <button
                onClick={() => onChange('freeplay')}
                className={[
                    'px-3 py-1.5 text-xs font-bold uppercase tracking-wide',
                    'transition-colors touch-manipulation font-mono',
                    activeMode === 'freeplay'
                        ? 'bg-charcoal text-paper-white'
                        : 'bg-transparent text-charcoal hover:bg-charcoal/10',
                ].join(' ')}
            >
                Free Play
            </button>
        </div>
    );
}
