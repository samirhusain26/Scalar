import { CalendarDays } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

export function Scoreboard() {
    const moves = useGameStore(state => state.moves);
    const activeMode = useGameStore(state => state.activeMode);

    return (
        <div className="flex items-center gap-3 font-mono text-sm font-bold text-charcoal" data-tutorial="scoreboard">
            {/* Moves — calendar icon shown in daily mode */}
            <div className="flex items-center gap-1">
                {activeMode === 'daily' && (
                    <CalendarDays size={12} className="text-charcoal/60" />
                )}
                <span className="text-charcoal/50 uppercase text-xs">Moves</span>
                <span className="text-base tabular-nums">{moves}</span>
            </div>
        </div>
    );
}
