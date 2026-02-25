import { useState, useCallback, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import gameDataRaw from '../assets/data/gameData.json';
import type { GameData } from '../types';
import { getDisplayColumns } from '../utils/schemaParser';
import { GuessCard } from './GuessCard';
import { MajorHintModal } from './MajorHintModal';
import { cn } from '../utils/cn';

const gameData = gameDataRaw as unknown as GameData;

export function GameGrid() {
    const guesses = useGameStore(state => state.guesses);
    const activeCategory = useGameStore(state => state.activeCategory);
    const majorHintAttributes = useGameStore(state => state.majorHintAttributes);
    const targetEntity = useGameStore(state => state.targetEntity);
    const gameStatus = useGameStore(state => state.gameStatus);
    const credits = useGameStore(state => state.credits);
    const revealMajorHint = useGameStore(state => state.revealMajorHint);

    const [pendingMajorHint, setPendingMajorHint] = useState<string | string[] | null>(null);

    // Collapse state keyed by stable guess ID (position in guesses array, never shifts).
    // Initialized from localStorage state: guesses older than 3rd most recent start collapsed.
    const [collapsedByStableId, setCollapsedByStableId] = useState<Map<number, boolean>>(() => {
        const map = new Map<number, boolean>();
        for (let i = 0; i < guesses.length - 3; i++) {
            map.set(i, true);
        }
        return map;
    });

    // When a new guess is added, auto-collapse the guess that just slid into 4th position.
    // When all guesses are cleared (reset/category switch), wipe the map.
    useEffect(() => {
        if (guesses.length === 0) {
            setCollapsedByStableId(new Map());
            return;
        }
        const autoCollapseId = guesses.length - 4;
        if (autoCollapseId < 0) return;
        setCollapsedByStableId(prev => {
            if (prev.has(autoCollapseId)) return prev; // respect any manual override
            const next = new Map(prev);
            next.set(autoCollapseId, true);
            return next;
        });
    }, [guesses.length]);

    // Controls whether the empty-state overlay is mounted.
    // Stays true until the first guess has fully faded out (300ms after guesses.length > 0).
    const [showEmptyOverlay, setShowEmptyOverlay] = useState(() => guesses.length === 0);

    useEffect(() => {
        if (guesses.length > 0 && showEmptyOverlay) {
            const timer = setTimeout(() => setShowEmptyOverlay(false), 350);
            return () => clearTimeout(timer);
        }
    }, [guesses.length, showEmptyOverlay]);

    const toggleCard = useCallback((stableId: number) => {
        setCollapsedByStableId(prev => {
            const next = new Map(prev);
            next.set(stableId, !(prev.get(stableId) ?? false));
            return next;
        });
    }, []);

    const currentSchema = gameData.schemaConfig[activeCategory];
    const displayFields = getDisplayColumns(currentSchema);

    // Most recent guess first
    const reversedGuesses = [...guesses].reverse();

    const handleConfirmMajorHint = () => {
        if (pendingMajorHint) {
            revealMajorHint(pendingMajorHint);
            setPendingMajorHint(null);
        }
    };

    return (
        <div className="w-full mx-auto p-4 relative">
            {/* Empty-state overlay — fades out when first guess arrives, then unmounts */}
            {showEmptyOverlay && (
                <div className={cn(
                    'transition-opacity duration-300',
                    guesses.length > 0
                        ? 'opacity-0 pointer-events-none absolute inset-0 z-10'
                        : 'opacity-100',
                )}>
                    {/* Animated prompt with bouncing arrow — all screen sizes */}
                    <div className="flex flex-col items-center justify-center min-h-[200px] md:min-h-[300px] select-none pointer-events-none">
                        <div className="animate-bounce-up flex flex-col items-center gap-2 mb-6">
                            <svg
                                width="24" height="40" viewBox="0 0 24 40"
                                className="text-charcoal/20"
                                fill="none" stroke="currentColor" strokeWidth="2"
                                strokeLinecap="round" strokeLinejoin="round"
                            >
                                <line x1="12" y1="38" x2="12" y2="8" />
                                <polyline points="4,16 12,6 20,16" />
                            </svg>
                            <span className="text-[10px] font-mono uppercase tracking-widest text-charcoal/20">
                                Type above
                            </span>
                        </div>
                        <p className="font-serif-display font-light text-4xl md:text-5xl text-charcoal/20 uppercase tracking-[0.15em] text-center">
                            Make a Guess
                        </p>
                    </div>
                </div>
            )}

            {/* Real guess grid */}
            {guesses.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
                    {reversedGuesses.map((guessData, idx) => {
                        const stableId = guesses.length - 1 - idx;
                        return (
                            <GuessCard
                                key={stableId}
                                guess={guessData.guess}
                                feedback={guessData.feedback}
                                displayFields={displayFields}
                                majorHintAttributes={majorHintAttributes}
                                targetEntity={targetEntity}
                                guessIndex={guesses.length - idx}
                                index={idx}
                                gameStatus={gameStatus}
                                onRevealMajorHint={(key) => setPendingMajorHint(key)}
                                isNew={idx === 0}
                                collapsed={collapsedByStableId.get(stableId) ?? false}
                                onToggleCollapse={() => toggleCard(stableId)}
                            />
                        );
                    })}
                </div>
            )}

            <MajorHintModal
                isOpen={pendingMajorHint !== null}
                attributeLabel={pendingMajorHint
                    ? (Array.isArray(pendingMajorHint)
                        ? 'Location'
                        : (displayFields.find(f => f.attributeKey === pendingMajorHint)?.displayLabel || pendingMajorHint))
                    : ''}
                credits={credits}
                onConfirm={handleConfirmMajorHint}
                onCancel={() => setPendingMajorHint(null)}
            />
        </div>
    );
}
