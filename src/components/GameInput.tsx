import { useState, useMemo, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import gameDataRaw from '../assets/data/gameData.json';
import type { Entity, GameData } from '../types';
import { cn } from '../utils/cn';
import { getSuggestions } from '../utils/gameLogic';
import { Input } from './ui/input';

const gameData = gameDataRaw as unknown as GameData;

export function GameInput() {
    const [query, setQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const activeCategory = useGameStore(state => state.activeCategory);
    const submitGuess = useGameStore(state => state.submitGuess);
    const guesses = useGameStore(state => state.guesses);
    const gameStatus = useGameStore(state => state.gameStatus);
    const score = useGameStore(state => state.score);

    const isGameActive = gameStatus === 'PLAYING';
    const isDisabled = !isGameActive;

    const entities: Entity[] = gameData.categories[activeCategory] || [];

    // Filter suggestions
    const suggestions = useMemo(() => {
        const guessedIds = new Set(guesses.map(g => g.guess.id));
        return getSuggestions(entities, query, guessedIds);
    }, [query, entities, guesses]);

    // Reset selected index when suggestions change
    useEffect(() => {
        setSelectedIndex(-1);
    }, [suggestions]);

    const handleSubmit = (entity: Entity) => {
        if (!isGameActive) return;
        submitGuess(entity);
        setQuery('');
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isGameActive) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (!showSuggestions) {
                setShowSuggestions(true);
                return;
            }
            setSelectedIndex(prev => (prev + 1) % suggestions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (!showSuggestions) return;
            setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (showSuggestions && selectedIndex >= 0 && suggestions[selectedIndex]) {
                handleSubmit(suggestions[selectedIndex]);
            } else if (suggestions.length > 0 && selectedIndex === -1 && query.length > 0) {
                if (!showSuggestions) setShowSuggestions(true);
            }
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
            setSelectedIndex(-1);
            inputRef.current?.blur();
        }
    };

    // Scroll selected item into view
    useEffect(() => {
        if (selectedIndex >= 0 && listRef.current) {
            const listItems = listRef.current.children;
            if (listItems[selectedIndex]) {
                listItems[selectedIndex].scrollIntoView({ block: 'nearest' });
            }
        }
    }, [selectedIndex]);

    return (
        <div className="w-full max-w-2xl mx-auto mt-4 relative z-40 px-4">
            <div className="relative group">
                {/* Status Label */}
                <div className="absolute -top-6 left-0 text-xs font-mono font-bold text-charcoal/60 mb-1 flex justify-between w-full">
                    <span>{activeCategory.toUpperCase()}</span>
                    <span>Strokes: {score}</span>
                </div>

                <div className="relative w-full">
                    <Input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        onKeyDown={handleKeyDown}
                        disabled={isDisabled}
                        placeholder={isDisabled ? (gameStatus === 'REVEALED' ? 'Revealed' : 'Solved') : "Type your guess..."}
                        className={cn(
                            "font-mono uppercase text-lg shadow-none",
                            "border-0 border-b-2 border-b-charcoal rounded-none bg-transparent px-0",
                            "focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-b-charcoal",
                            isDisabled && "cursor-not-allowed opacity-50"
                        )}
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck="false"
                    />
                </div>

                {/* Suggestion Dropdown - Opening upward */}
                {showSuggestions && query && suggestions.length > 0 && !isDisabled && (
                    <>
                        <div
                            className="fixed inset-0 z-40 bg-transparent"
                            onClick={() => setShowSuggestions(false)}
                        />

                        <div
                            className="absolute bottom-full left-0 right-0 mb-3 z-50 flex flex-col items-start"
                        >
                            <div ref={listRef} className="bg-paper-white border border-charcoal p-3 shadow-hard-sm flex flex-wrap gap-2 max-w-full">
                                {suggestions.map((entity, index) => (
                                    <button
                                        key={entity.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSubmit(entity);
                                        }}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                        className={cn(
                                            "flex items-center px-3 py-1.5 border font-mono text-sm uppercase transition-all duration-150 transform active:scale-95",
                                            index === selectedIndex
                                                ? "bg-charcoal text-paper-white border-charcoal scale-105 shadow-md"
                                                : "bg-white text-charcoal border-charcoal/30 hover:border-charcoal hover:bg-gray-50"
                                        )}
                                    >
                                        <span className="font-bold">{entity.name}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="w-4 h-4 bg-paper-white border-r border-b border-charcoal transform rotate-45 translate-x-8 translate-y-[-10px] z-50"></div>
                        </div>
                    </>
                )}

                {/* No Matches State */}
                {showSuggestions && query && suggestions.length === 0 && !isDisabled && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 z-50 flex justify-center">
                        <div className="bg-paper-white border border-charcoal p-3 shadow-hard-sm">
                            <span className="font-mono text-gray-400 italic font-bold text-sm">No match found</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Helper Text */}
            {!isDisabled && (
                <div className="mt-2 text-[10px] font-mono text-gray-400 text-right hidden sm:block">
                    Use arrow keys to navigate, Enter to select
                </div>
            )}
        </div>
    );
}
