import { useState, useMemo, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import gameDataRaw from '../assets/data/gameData.json';
import type { Entity } from '../types';
import { cn } from '../utils/cn';
import { getSuggestions } from '../utils/gameLogic';
import { Input } from './ui/input';

const gameData = gameDataRaw as any;

export function GameInput() {
    const [query, setQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const activeCategory = useGameStore(state => state.activeCategory);
    const submitGuess = useGameStore(state => state.submitGuess);
    const guesses = useGameStore(state => state.guesses);
    const gameStatus = useGameStore(state => state.gameStatus);
    const maxGuesses = useGameStore(state => state.maxGuesses);

    const guessesRemaining = maxGuesses - guesses.length;
    const isGameActive = gameStatus === 'PLAYING' && guessesRemaining > 0;
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
        // Keep focus on input unless game over
        if (guessesRemaining > 1) { // >1 because this guess hasn't processed yet fully in this closure's derived value
            inputRef.current?.focus();
        }
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
                // Optional: Submit top match if user presses enter without selection? 
                // For now, let's enforce selection for precision, OR select first if exact match?
                // Let's stick to safe behavior: Do nothing unless selected, or maybe select first if only 1 match?
                // Let's just open suggestions if closed
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

    if (!isGameActive && gameStatus === 'PLAYING') {
        // Should not happen theoretically if logic matches store, unless maxGuesses reached but status not updated? 
        // Store updates status to LOST/WON. So just rely on isDisabled check for input.
    }

    return (
        <div className="w-full max-w-2xl mx-auto mt-4 relative z-40 px-4">
            <div className="relative group">
                {/* Status Indicator / Label */}
                <div className="absolute -top-6 left-0 text-xs font-mono font-bold text-charcoal/60 dark:text-paper-white/60 mb-1 flex justify-between w-full">
                    <span>INPUT // {activeCategory.toUpperCase()}</span>
                    <span>{guessesRemaining} GUESSES REMAINING</span>
                </div>

                <div className="relative w-full">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-muted-foreground select-none pointer-events-none">
                        &gt;
                    </span>
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
                        placeholder={isDisabled ? (gameStatus === 'WON' ? 'ACCESS GRANTED' : 'SYSTEM LOCKED') : "Type answer here"}
                        className={cn(
                            "pl-8 font-mono uppercase text-lg shadow-none",
                            "focus-visible:ring-0 focus-visible:ring-offset-0",
                            isDisabled && "cursor-not-allowed opacity-50"
                        )}
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck="false"
                    />
                </div>

                {/* Dropdown Menu - Now opening UPWARDS as Tag Cloud */}
                {showSuggestions && query && suggestions.length > 0 && !isDisabled && (
                    <>
                        {/* Backdrop to close on click outside, but valid clicks on items need to pass through */}
                        <div
                            className="fixed inset-0 z-40 bg-transparent"
                            onClick={() => setShowSuggestions(false)}
                        />

                        {/* Container positioned ABOVE input */}
                        <div
                            className="absolute bottom-full left-0 right-0 mb-3 z-50 flex flex-col items-start"
                        >
                            <div className="bg-paper-white border-2 border-charcoal p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)] flex flex-wrap gap-2 max-w-full">
                                {suggestions.map((entity, index) => (
                                    <button
                                        key={entity.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSubmit(entity);
                                        }}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                        className={cn(
                                            "lex items-center px-3 py-1.5 border-2 font-mono text-sm uppercase transition-all duration-150 transform active:scale-95",
                                            index === selectedIndex
                                                ? "bg-charcoal text-paper-white border-charcoal scale-105 shadow-md"
                                                : "bg-white text-charcoal border-charcoal/30 hover:border-charcoal hover:bg-gray-50"
                                        )}
                                    >
                                        <span className="font-bold">{entity.name}</span>
                                        {/* Optional: Show small ID or other info? strict to name for tag look */}
                                    </button>
                                ))}
                            </div>
                            {/* Connector Arrow/Triangle visual to link to input */}
                            <div className="w-4 h-4 bg-paper-white border-r-2 border-b-2 border-charcoal transform rotate-45 translate-x-8 translate-y-[-10px] z-50"></div>
                        </div>
                    </>
                )}

                {/* No Matches State - Also opening UP */}
                {showSuggestions && query && suggestions.length === 0 && !isDisabled && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 z-50 flex justify-center">
                        <div className="bg-paper-white border-2 border-charcoal p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)]">
                            <span className="font-mono text-gray-400 italic font-bold text-sm">NO MATCH FOUND</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Helper Text */}
            {!isDisabled && (
                <div className="mt-2 text-[10px] font-mono text-gray-400 text-right hidden sm:block">
                    [↑/↓] NAVIGATE • [ENTER] SELECT
                </div>
            )}
        </div>
    );
}
