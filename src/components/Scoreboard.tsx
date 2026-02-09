import { useGameStore } from '../store/gameStore';

export function Scoreboard() {
    const score = useGameStore(state => state.score);
    const par = useGameStore(state => state.par);

    const scoreDiff = score - par;
    const scoreLabel = scoreDiff === 0 ? 'E' : (scoreDiff > 0 ? `+${scoreDiff}` : `${scoreDiff}`);

    return (
        <div className="flex items-center gap-3 font-mono text-sm font-bold text-charcoal">
            {/* Score */}
            <div className="flex items-center gap-1">
                <span className="text-charcoal/50 uppercase text-xs">Strokes</span>
                <span className="text-base tabular-nums">{score}</span>
                <span className="text-charcoal/40 text-xs">({scoreLabel})</span>
            </div>

            {/* Divider */}
            <div className="h-4 w-px bg-graphite" />

            {/* Par */}
            <div className="flex items-center gap-1">
                <span className="text-charcoal/50 uppercase text-xs">Par</span>
                <span className="text-base tabular-nums">{par}</span>
            </div>
        </div>
    );
}
