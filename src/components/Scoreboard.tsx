import { Trophy, Medal, Award } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { calculateRank } from '../utils/gameLogic';
import type { Rank } from '../types';

const rankIcons: Record<Rank, { icon: typeof Trophy; colorClass: string }> = {
    GOLD: { icon: Trophy, colorClass: 'text-yellow-600' },
    SILVER: { icon: Medal, colorClass: 'text-gray-400' },
    BRONZE: { icon: Award, colorClass: 'text-amber-700' },
};

export function Scoreboard() {
    const score = useGameStore(state => state.score);
    const par = useGameStore(state => state.par);

    const rankInfo = calculateRank(score, par);
    const scoreDiff = score - par;
    const scoreLabel = scoreDiff === 0 ? 'E' : (scoreDiff > 0 ? `+${scoreDiff}` : `${scoreDiff}`);

    const { icon: RankIcon, colorClass } = rankIcons[rankInfo.rank];

    return (
        <div className="flex items-center gap-3 font-mono text-sm font-bold text-charcoal">
            {/* Score */}
            <div className="flex items-center gap-1">
                <span className="text-charcoal/50 uppercase text-xs">Strokes</span>
                <span className="text-base tabular-nums">{score}</span>
                <span className="text-charcoal/40 text-xs">({scoreLabel})</span>
            </div>

            {/* Divider */}
            <div className="h-4 w-px bg-charcoal/20" />

            {/* Par */}
            <div className="flex items-center gap-1">
                <span className="text-charcoal/50 uppercase text-xs">Par</span>
                <span className="text-base tabular-nums">{par}</span>
            </div>

            {/* Divider */}
            <div className="h-4 w-px bg-charcoal/20" />

            {/* Rank */}
            <div className="flex items-center gap-1">
                <RankIcon className={`w-4 h-4 ${colorClass}`} />
                <span className="text-xs uppercase hidden sm:inline">{rankInfo.label}</span>
            </div>
        </div>
    );
}
