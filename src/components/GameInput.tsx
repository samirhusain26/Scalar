import { useState, useMemo, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import gameDataRaw from '../assets/data/gameData.json';
import type { Entity, GameData } from '../types';
import { cn } from '../utils/cn';
import { getSuggestions } from '../utils/gameLogic';
import { Input } from './ui/input';

const gameData = gameDataRaw as unknown as GameData;

interface GameInputProps {
    onFocusChange?: (focused: boolean) => void;
}

export function GameInput({ onFocusChange }: GameInputProps) {
    const [query, setQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const activeCategory = useGameStore(state => state.activeCategory);
    const submitGuess = useGameStore(state => state.submitGuess);
    const guesses = useGameStore(state => state.guesses);
    const gameStatus = useGameStore(state => state.gameStatus);

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
        // Scroll to top + re-focus if still playing, otherwise blur for modal focus
        if (useGameStore.getState().gameStatus === 'PLAYING') {
            setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                inputRef.current?.focus();
            }, 150);
        } else {
            inputRef.current?.blur();
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
            if (suggestions.length === 0) return;
            setSelectedIndex(prev => (prev + 1) % suggestions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (!showSuggestions || suggestions.length === 0) return;
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
        <div className="w-48 md:w-72 lg:w-80 relative z-40">
            <div className="relative group">
                <div className="relative w-full">
                    <Input
                        ref={inputRef}
                        type="search"
                        id="scalar-guess"
                        name="scalar-guess"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setShowSuggestions(true);
                        }}
                        onFocus={() => {
                            setShowSuggestions(true);
                            onFocusChange?.(true);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        onBlur={() => {
                            setTimeout(() => {
                                if (document.activeElement !== inputRef.current) {
                                    onFocusChange?.(false);
                                }
                            }, 150);
                        }}
                        onKeyDown={handleKeyDown}
                        disabled={isDisabled}
                        placeholder={isDisabled ? (gameStatus === 'REVEALED' ? 'Revealed' : 'Solved') : "Type your guess..."}
                        className={cn(
                            "font-mono uppercase text-sm shadow-none h-8",
                            "border-0 border-b-2 border-b-charcoal rounded-none bg-transparent px-0",
                            "focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-b-charcoal",
                            "[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
                            isDisabled && "cursor-not-allowed opacity-50"
                        )}
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                        autoCapitalize="none"
                        enterKeyHint="search"
                        data-1p-ignore="true"
                        data-lpignore="true"
                        data-form-type="other"
                    />
                </div>

                {/* Suggestion Dropdown - Opening downward */}
                {showSuggestions && query && suggestions.length > 0 && !isDisabled && (
                    <>
                        <div
                            className="fixed inset-0 z-40 bg-transparent"
                            onClick={() => setShowSuggestions(false)}
                        />

                        <div
                            className="absolute top-full left-0 right-0 mt-3 z-50 flex flex-col items-start"
                        >
                            <div className="w-4 h-4 bg-paper-white border-l border-t border-charcoal transform rotate-45 translate-x-8 translate-y-[10px] z-50"></div>
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
                        </div>
                    </>
                )}

                {/* No Matches State */}
                {showSuggestions && query && suggestions.length === 0 && !isDisabled && (
                    <div className="absolute top-full left-0 right-0 mt-2 z-50 flex justify-center">
                        <div className="bg-paper-white border border-charcoal p-3 shadow-hard-sm">
                            <span className="font-mono text-gray-400 italic font-bold text-sm">No match found</span>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
}
