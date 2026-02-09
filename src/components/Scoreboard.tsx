import { useGameStore } from '../store/gameStore';

export function Scoreboard() {
    const moves = useGameStore(state => state.moves);
    const credits = useGameStore(state => state.credits);

    return (
        <div className="flex items-center gap-3 font-mono text-sm font-bold text-charcoal">
            {/* Moves */}
            <div className="flex items-center gap-1">
                <span className="text-charcoal/50 uppercase text-xs">Moves</span>
                <span className="text-base tabular-nums">{moves}</span>
            </div>

            {/* Divider */}
            <div className="h-4 w-px bg-graphite" />

            {/* Free Hint Credits */}
            <div className="flex items-center gap-1.5">
                <span className="text-charcoal/50 uppercase text-xs">Hints</span>
                <div className="flex items-center gap-1">
                    {[0, 1, 2].map(i => (
                        <div
                            key={i}
                            className={`w-2.5 h-2.5 border border-charcoal ${
                                i < credits ? 'bg-charcoal' : 'bg-transparent'
                            }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
