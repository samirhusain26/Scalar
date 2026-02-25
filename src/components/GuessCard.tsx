import { useState, useRef, useEffect } from 'react';
import { Eye, Check, ChevronDown } from 'lucide-react';
import type { SchemaField, Entity, Feedback, GameStatus } from '../types';
import { formatNumber, formatPercentageDiffTier, formatYearDiffTier, getDirectionSymbol, getAlphaDirectionSymbol, numberToLetter, expandConservationStatus } from '../utils/formatters';
import { cn } from '../utils/cn';
import { getCellColor } from '../utils/feedbackColors';

interface GuessCardProps {
    guess: Entity;
    feedback: Record<string, Feedback>;
    displayFields: SchemaField[];
    majorHintAttributes: string[];
    targetEntity: Entity;
    guessIndex: number;
    index: number;
    gameStatus: GameStatus;
    onRevealMajorHint: (attributeKeys: string | string[]) => void;
    isNew: boolean;
    collapsed: boolean;
    onToggleCollapse: () => void;
}

const OLYMPICS_HOSTED_KEY = 'olympics_hosted_count';
const OLYMPICS_YEAR_KEY = 'olympics_latest_year';
const SCRABBLE_SCORE_KEY = 'scrabble_score';
const NAME_WORD_COUNT_KEY = 'name_word_count';

/** Unit suffixes for Animals category fields */
const UNIT_MAP: Record<string, string> = {
    weight_kg: ' kg',
    height_cm: ' cm',
    lifespan_years: ' yrs',
    speed_kmh: ' km/h',
};

/** Keys that get merged into a single "Location" cell (rendered in this order) */
const LOCATION_KEYS = ['hemisphere', 'continent', 'subregion'] as const;

const TRUNCATE_THRESHOLD = 14;
const SUBREGION_TRUNCATE_THRESHOLD = 16;

/** Inline text that truncates beyond `threshold` chars and expands on tap/click. */
function TruncatableText({ value, threshold = TRUNCATE_THRESHOLD }: { value: string; threshold?: number }) {
    const [expanded, setExpanded] = useState(false);
    const needsTruncation = value.length > threshold;
    if (!needsTruncation) return <span>{value}</span>;
    return (
        <button
            onClick={(e) => { e.stopPropagation(); setExpanded(prev => !prev); }}
            className="text-left touch-manipulation"
            title={value}
        >
            <span className={expanded ? '' : 'truncate block max-w-full'}>
                {expanded ? value : value.slice(0, threshold) + '…'}
            </span>
        </button>
    );
}

/** Keys that render as full-width list rows (SET_INTERSECTION) */
const LIST_FIELD_KEYS = ['Credits', 'Genre'] as const;

export function GuessCard({
    guess,
    feedback,
    displayFields,
    majorHintAttributes,
    targetEntity,
    guessIndex,
    index,
    gameStatus,
    onRevealMajorHint,
    isNew,
    collapsed,
    onToggleCollapse,
}: GuessCardProps) {
    const isPlaying = gameStatus === 'PLAYING';
    const [expanded, setExpanded] = useState(false);

    // Track previous collapsed state to detect expand transitions for animation
    const prevCollapsedRef = useRef(collapsed);
    useEffect(() => {
        prevCollapsedRef.current = collapsed;
    }, [collapsed]);
    const isExpandingFromCollapsed = prevCollapsedRef.current && !collapsed;

    // Hide olympics_latest_year (merged into Olympics Hosted); keep N/A cells visible
    const isAvailable = (f: SchemaField) =>
        f.attributeKey !== OLYMPICS_YEAR_KEY;

    // Separate location fields, list fields, and standard fields
    const isLocationField = (f: SchemaField) => LOCATION_KEYS.includes(f.attributeKey as typeof LOCATION_KEYS[number]);
    const isListField = (f: SchemaField) => LIST_FIELD_KEYS.includes(f.attributeKey as typeof LIST_FIELD_KEYS[number]);
    const locationFields = displayFields.filter(f => !f.isFolded && isAvailable(f) && isLocationField(f));
    const listFields = displayFields.filter(f => !f.isFolded && isAvailable(f) && isListField(f));
    const mainFields = displayFields.filter(f => !f.isFolded && isAvailable(f) && !isLocationField(f) && !isListField(f));
    const foldedFields = displayFields.filter(f => f.isFolded && isAvailable(f));

    function formatTargetValue(field: SchemaField): string {
        const targetVal = targetEntity[field.attributeKey];
        if (field.displayFormat === 'ALPHA_POSITION' && typeof targetVal === 'number') {
            return numberToLetter(targetVal);
        }
        if (typeof targetVal === 'number') {
            const isYearField = /year|discovered/i.test(field.displayLabel);
            if (isYearField) {
                if (targetVal === 0) return 'Ancient';
                if (targetVal >= 1000 && targetVal <= new Date().getFullYear() + 10) return String(targetVal);
            }
            return formatNumber(targetVal);
        }
        if (typeof targetVal === 'boolean') return targetVal ? 'Yes' : 'No';
        return String(targetVal ?? '');
    }

    function getDisplayValue(field: SchemaField): string {
        const key = field.attributeKey;
        const cellFeedback = feedback[key];

        // Virtual fields (e.g. distance_km) don't exist on the entity — use computed feedback
        const rawValue = guess[key];
        if (field.isVirtual && cellFeedback?.displayValue) {
            return String(cellFeedback.displayValue);
        }

        // Handle null/-1 as N/A
        if (rawValue === null || rawValue === undefined || rawValue === -1 || rawValue === '-1' || rawValue === '') {
            return 'N/A';
        }

        let displayValue: string | number | boolean | undefined = cellFeedback?.displayValue;

        if (displayValue === undefined || displayValue === '') {
            if (typeof rawValue === 'number' && (field.dataType === 'INT' || field.dataType === 'FLOAT' || field.dataType === 'CURRENCY')) {
                displayValue = formatNumber(rawValue);
            } else if (typeof rawValue === 'boolean') {
                displayValue = rawValue ? 'Yes' : 'No';
            } else {
                displayValue = rawValue;
            }
        }

        const text = String(displayValue ?? '');

        // Expand conservation status codes to full labels
        if (field.attributeKey === 'conservation_status') {
            return expandConservationStatus(text);
        }

        return text;
    }

    /** Format the raw guess value for HIGHER_LOWER primary display */
    function getHigherLowerPrimary(field: SchemaField, cellFeedback: Feedback): string {
        const rawValue = cellFeedback.value as number;
        if (field.displayFormat === 'ALPHA_POSITION') return numberToLetter(rawValue);
        const isYearField = /year|discovered/i.test(field.displayLabel);
        if (isYearField) {
            if (rawValue === 0) return 'Ancient';
            if (rawValue >= 1000 && rawValue <= new Date().getFullYear() + 10) return String(rawValue);
        }
        if (field.displayFormat === 'CURRENCY') return `$${formatNumber(rawValue)}`;
        // Scrabble score: show "14 pts" or "14 pts · 2w" when multi-word
        if (field.attributeKey === SCRABBLE_SCORE_KEY) {
            const wordCount = Number(guess[NAME_WORD_COUNT_KEY]);
            const pts = `${rawValue} pts`;
            return wordCount > 1 ? `${pts} · ${wordCount}w` : pts;
        }
        const unit = UNIT_MAP[field.attributeKey] ?? '';
        return formatNumber(rawValue) + unit;
    }

    /** Get arrow + tier secondary text for HIGHER_LOWER */
    function getHigherLowerSecondary(cellFeedback: Feedback, field: SchemaField): string {
        // ALPHA_POSITION: horizontal arrow only, no percentage/tier
        if (field.displayFormat === 'ALPHA_POSITION') {
            return getAlphaDirectionSymbol(cellFeedback.direction);
        }
        const arrow = getDirectionSymbol(cellFeedback.direction);
        // Year-like fields: use absolute year difference tiers instead of percentage
        const isYearField = /year|discovered/i.test(field.displayLabel);
        if (isYearField) {
            const guessVal = Number(guess[field.attributeKey] ?? 0);
            const targetVal = Number(targetEntity[field.attributeKey] ?? 0);
            const tier = formatYearDiffTier(Math.abs(guessVal - targetVal));
            return `${arrow} ${tier}`.trim();
        }
        // All HIGHER_LOWER formats (including RELATIVE_PERCENTAGE): use symmetric percentDiff tier.
        // percentageDiff is now stored as a symmetric ratio, so both directions give the same reading.
        const tier = formatPercentageDiffTier(cellFeedback.percentageDiff ?? 0);
        return `${arrow} ${tier}`.trim();
    }

    /** Render secondary text with the direction arrow in a larger font than the tier label */
    function renderSecondaryText(text: string, isOnColoredBg = false) {
        if (!text) return null;
        const ARROW_CHARS = ['↑', '↓', '→', '←'];
        const spaceIdx = text.indexOf(' ');
        const firstChar = text[0];
        const arrowColor = isOnColoredBg ? 'text-white/80' : 'text-charcoal/70';
        const tierColor = isOnColoredBg ? 'text-white/60' : 'text-charcoal/50';
        if (ARROW_CHARS.includes(firstChar) && spaceIdx > -1) {
            const arrowPart = text.slice(0, spaceIdx);
            const tierPart = text.slice(spaceIdx + 1);
            return (
                <>
                    <span className={cn("text-sm font-bold leading-none", arrowColor)}>{arrowPart}</span>
                    {' '}
                    <span className={cn("text-[10px] font-mono tracking-tight", tierColor)}>{tierPart}</span>
                </>
            );
        }
        // Arrow-only (ALPHA_POSITION) or no arrow (e.g. "Exact")
        if (ARROW_CHARS.includes(firstChar)) {
            return <span className={cn("text-sm font-bold leading-none", arrowColor)}>{text}</span>;
        }
        return <span className={cn("text-[10px] font-mono", tierColor)}>{text}</span>;
    }

    /** Custom color for Olympics Hosted cell */
    function getOlympicsColor(cellFeedback: Feedback): string {
        if (cellFeedback.status === 'EXACT') return 'bg-thermal-green text-white';

        const targetLastYear = Number(targetEntity[OLYMPICS_YEAR_KEY]);
        const guessLastYear = Number(guess[OLYMPICS_YEAR_KEY]);
        if (!isNaN(targetLastYear) && !isNaN(guessLastYear) &&
            targetLastYear > 0 && guessLastYear > 0 &&
            Math.abs(targetLastYear - guessLastYear) <= 8) {
            return 'bg-geo-warm';  // amber
        }

        return 'bg-white text-charcoal';
    }

    /** Render the collapsed summary strip: one colored square per visible field */
    function renderSummaryStrip() {
        const squares = displayFields.map(field => {
            const fb = feedback[field.attributeKey];
            const status = fb?.status ?? 'MISS';
            let squareClass: string;
            switch (status) {
                case 'EXACT': squareClass = 'bg-thermal-green'; break;
                case 'HOT': squareClass = 'bg-thermal-orange'; break;
                case 'NEAR': squareClass = 'bg-amber-200'; break;
                default: squareClass = 'bg-white border border-charcoal/20'; break;
            }
            return <div key={field.attributeKey} className={cn('w-2.5 h-2.5 shrink-0', squareClass)} />;
        });

        return (
            <button
                onClick={onToggleCollapse}
                className="w-full flex items-center gap-1 px-3 py-1.5 border-t border-charcoal hover:bg-zinc-100 transition-colors"
            >
                {squares}
                <ChevronDown className="w-3.5 h-3.5 text-charcoal/40 ml-auto shrink-0" />
            </button>
        );
    }

    /** Render the merged Location cell (Hemisphere • Continent • Subregion) */
    function renderLocationCell() {
        if (locationFields.length === 0) return null;

        const locationKeys = locationFields.map(f => f.attributeKey);
        const allLocationHinted = locationKeys.every(k => majorHintAttributes.includes(k));
        const anyLocationHinted = locationKeys.some(k => majorHintAttributes.includes(k));

        // Build per-attribute feedback data in LOCATION_KEYS order (Hemisphere → Continent → Subregion)
        const parts = LOCATION_KEYS
            .map(key => locationFields.find(f => f.attributeKey === key))
            .filter((f): f is SchemaField => f !== undefined)
            .map(f => ({
                field: f,
                value: getDisplayValue(f),
                isExact: feedback[f.attributeKey]?.status === 'EXACT',
            }));

        const exactCount = parts.filter(p => p.isExact).length;
        const allExact = exactCount === parts.length;

        // Full match: green bg, white text
        // Partial match: white bg, green text on matches
        // No match: white bg, standard text
        const cellBg = allExact
            ? 'bg-thermal-green text-white'
            : 'bg-white text-charcoal';

        const locationHoverClass = !allExact && isPlaying ? 'md:hover:bg-zinc-100' : '';

        return (
            <div className={cn("relative group col-span-2 px-3 py-2 font-mono transition-colors duration-100", cellBg, locationHoverClass)}>
                <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] uppercase opacity-60 tracking-wider leading-tight">
                        Location
                    </span>
                    <span className="text-[9px] uppercase opacity-30 tracking-wider leading-tight hidden md:block">
                        Hemisphere · Continent · Region
                    </span>
                </div>
                <div className="flex items-baseline gap-0 text-sm font-bold leading-tight flex-wrap">
                    {parts.map((part, i) => (
                        <span key={part.field.attributeKey} className="flex items-baseline">
                            <span className={cn(
                                !allExact && part.isExact && 'text-green-600 font-extrabold',
                                !allExact && !part.isExact && 'opacity-50',
                            )}>
                                {part.field.attributeKey === 'subregion'
                                    ? <TruncatableText value={part.value} threshold={SUBREGION_TRUNCATE_THRESHOLD} />
                                    : part.value}
                            </span>
                            {i < parts.length - 1 && (
                                <span className={cn("mx-1.5", allExact ? 'opacity-60' : 'opacity-30')}>•</span>
                            )}
                        </span>
                    ))}
                </div>

                {/* Hint badge */}
                {anyLocationHinted && (
                    <div className="inline-flex items-center gap-0.5 mt-1 px-1 py-0.5 bg-charcoal text-paper-white text-[9px] uppercase tracking-wider">
                        <Check className="w-2.5 h-2.5" />
                        <span>{parts.map(p => String(targetEntity[p.field.attributeKey] ?? '')).join(' • ')}</span>
                    </div>
                )}

                {/* Hint trigger */}
                {isPlaying && !allLocationHinted && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onRevealMajorHint(locationKeys); }}
                        className="absolute top-0.5 right-0.5 w-7 h-7 flex items-center justify-center p-1.5 touch-manipulation opacity-50 md:opacity-0 md:group-hover:opacity-70 md:hover:opacity-100 transition-opacity duration-150 group/eye"
                        title="Reveal exact value"
                        aria-label="Reveal exact location values"
                    >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden md:block absolute bottom-full right-0 mb-1 bg-charcoal text-paper-white text-[9px] uppercase tracking-wider px-1.5 py-0.5 whitespace-nowrap pointer-events-none opacity-0 group-hover/eye:opacity-100 transition-opacity duration-100">
                            Reveal
                        </span>
                    </button>
                )}
            </div>
        );
    }

    /** Render a full-width list cell (Genre, Cast & Crew) with per-item match coloring */
    function renderListCell(field: SchemaField) {
        const key = field.attributeKey;
        const cellFeedback = feedback[key];
        const isMajorHinted = majorHintAttributes.includes(key);
        const items = cellFeedback?.matchedItems ?? [];
        const allExact = cellFeedback?.status === 'EXACT';

        // Cast & Crew: only show matched items, hide cell entirely if no matches
        const isCastCrew = key === 'Credits';
        const displayItems = isCastCrew ? items.filter(item => item.isMatch) : items;

        if (isCastCrew && displayItems.length === 0 && !isMajorHinted) {
            return null;
        }

        const cellBg = allExact
            ? 'bg-thermal-green text-white'
            : 'bg-white text-charcoal';

        const listHoverClass = !allExact && isPlaying ? 'md:hover:bg-zinc-100' : '';

        return (
            <div key={key} className={cn("relative group col-span-2 px-3 py-2 font-mono transition-colors duration-100", cellBg, listHoverClass)}>
                <div className="text-[11px] uppercase opacity-60 tracking-wider leading-tight mb-1">
                    {field.displayLabel}
                </div>
                <div className="text-sm leading-tight line-clamp-2" title={displayItems.map(i => i.text).join(', ')}>
                    {displayItems.map((item, i) => (
                        <span key={i}>
                            <span className={cn(
                                item.isMatch
                                    ? 'text-green-600 font-bold'
                                    : 'text-gray-400',
                            )}>
                                {item.text}
                            </span>
                            {i < displayItems.length - 1 && (
                                <span className="text-gray-300">, </span>
                            )}
                        </span>
                    ))}
                    {displayItems.length === 0 && (
                        <span className="text-gray-400 italic">No match</span>
                    )}
                </div>

                {/* Hint badge */}
                {isMajorHinted && (
                    <div className="inline-flex items-center gap-0.5 mt-1 px-1 py-0.5 bg-charcoal text-paper-white text-[9px] uppercase tracking-wider">
                        <Check className="w-2.5 h-2.5" />
                        <span>{formatTargetValue(field)}</span>
                    </div>
                )}

                {/* Hint trigger */}
                {isPlaying && !isMajorHinted && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onRevealMajorHint(key); }}
                        className="absolute top-0.5 right-0.5 w-7 h-7 flex items-center justify-center p-1.5 touch-manipulation opacity-50 md:opacity-0 md:group-hover:opacity-70 md:hover:opacity-100 transition-opacity duration-150 group/eye"
                        title="Reveal exact value"
                        aria-label={`Reveal exact value for ${field.displayLabel}`}
                    >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden md:block absolute bottom-full right-0 mb-1 bg-charcoal text-paper-white text-[9px] uppercase tracking-wider px-1.5 py-0.5 whitespace-nowrap pointer-events-none opacity-0 group-hover/eye:opacity-100 transition-opacity duration-100">
                            Reveal
                        </span>
                    </button>
                )}
            </div>
        );
    }

    function renderCell(field: SchemaField) {
        const key = field.attributeKey;
        const cellFeedback = feedback[key];
        const isMajorHinted = majorHintAttributes.includes(key);
        const displayLabel = field.logicType === 'GEO_DISTANCE' ? 'Distance from Target' : field.displayLabel;
        const isHigherLower = field.logicType === 'HIGHER_LOWER';
        const isOlympicsHosted = key === OLYMPICS_HOSTED_KEY;

        // --- Compute color, primary text, secondary text ---
        let colorClass: string;
        let primaryText: string;
        let secondaryText = '';

        if (isOlympicsHosted && cellFeedback) {
            colorClass = getOlympicsColor(cellFeedback);
            const hostedCount = Number(cellFeedback.value);
            const lastYear = Number(guess[OLYMPICS_YEAR_KEY]);
            const hasLastYear = !isNaN(lastYear) && lastYear > 0;
            primaryText = hasLastYear ? `${hostedCount} (${lastYear})` : `${hostedCount}`;
            const arrow = getDirectionSymbol(cellFeedback.direction);
            if (arrow) secondaryText = arrow;
        } else if (isHigherLower && cellFeedback) {
            colorClass = getCellColor(cellFeedback, field);
            primaryText = getHigherLowerPrimary(field, cellFeedback);
            secondaryText = getHigherLowerSecondary(cellFeedback, field);
        } else {
            colorClass = getCellColor(cellFeedback, field);
            primaryText = getDisplayValue(field);
        }

        // Override for N/A values: white background, gray text
        const isNA = primaryText === 'N/A' || cellFeedback?.displayValue === 'N/A';
        if (isNA) {
            colorClass = 'bg-white';
            primaryText = 'N/A';
            secondaryText = '';
        }

        const isColored = cellFeedback?.status === 'EXACT' || cellFeedback?.status === 'HOT';
        const cellHoverClass = !isColored && isPlaying ? 'md:hover:bg-zinc-100' : '';

        // HIGHER_LOWER cells get the split value/logic layout
        if (isHigherLower && secondaryText) {
            return (
                <div key={key} className={cn("relative group px-2 py-2 font-mono transition-colors duration-100", colorClass, cellHoverClass)}>
                    <div className="text-[11px] uppercase opacity-60 tracking-wider leading-tight">
                        {displayLabel}
                    </div>
                    <div className="flex justify-between items-baseline mt-0.5">
                        <span className="text-base font-bold leading-tight truncate" title={primaryText}>
                            {primaryText}
                        </span>
                        <div className="flex items-baseline gap-0.5 shrink-0 ml-2">
                            {renderSecondaryText(secondaryText, cellFeedback.status === 'EXACT' || cellFeedback.status === 'HOT')}
                        </div>
                    </div>

                    {/* Hint badge */}
                    {isMajorHinted && (
                        <div className="inline-flex items-center gap-0.5 mt-1 px-1 py-0.5 bg-charcoal text-paper-white text-[9px] uppercase tracking-wider">
                            <Check className="w-2.5 h-2.5" />
                            <span>{formatTargetValue(field)}</span>
                        </div>
                    )}

                    {/* Hint trigger */}
                    {isPlaying && !isMajorHinted && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onRevealMajorHint(key); }}
                            className="absolute top-0.5 right-0.5 w-7 h-7 flex items-center justify-center p-1.5 touch-manipulation opacity-50 md:opacity-0 md:group-hover:opacity-70 md:hover:opacity-100 transition-opacity duration-150 group/eye"
                            title="Reveal exact value"
                            aria-label={`Reveal exact value for ${field.displayLabel}`}
                        >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden md:block absolute bottom-full right-0 mb-1 bg-charcoal text-paper-white text-[9px] uppercase tracking-wider px-1.5 py-0.5 whitespace-nowrap pointer-events-none opacity-0 group-hover/eye:opacity-100 transition-opacity duration-100">
                                Reveal
                            </span>
                        </button>
                    )}
                </div>
            );
        }

        const canTruncate = !isNA && field.logicType === 'CATEGORY_MATCH';

        return (
            <div key={key} className={cn("relative group px-2 py-2 font-mono transition-colors duration-100", colorClass, cellHoverClass)}>
                <div className="text-[10px] uppercase opacity-60 tracking-wider leading-tight">
                    {displayLabel}
                </div>
                <div className={cn("text-sm font-bold leading-tight mt-0.5", !canTruncate && "truncate", isNA && "text-gray-400 font-normal italic")} title={primaryText}>
                    {canTruncate
                        ? <TruncatableText value={primaryText} />
                        : primaryText}
                    {secondaryText && (
                        <span className="text-[10px] font-normal opacity-70 ml-1">{secondaryText}</span>
                    )}
                </div>

                {/* Hint badge */}
                {isMajorHinted && (
                    <div className="inline-flex items-center gap-0.5 mt-1 px-1 py-0.5 bg-charcoal text-paper-white text-[9px] uppercase tracking-wider">
                        <Check className="w-2.5 h-2.5" />
                        <span>{formatTargetValue(field)}</span>
                    </div>
                )}

                {/* Hint trigger */}
                {isPlaying && !isMajorHinted && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onRevealMajorHint(key); }}
                        className="absolute top-0.5 right-0.5 w-7 h-7 flex items-center justify-center p-1.5 touch-manipulation opacity-50 md:opacity-0 md:group-hover:opacity-70 md:hover:opacity-100 transition-opacity duration-150 group/eye"
                        title="Reveal exact value"
                        aria-label={`Reveal exact value for ${field.displayLabel}`}
                    >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden md:block absolute bottom-full right-0 mb-1 bg-charcoal text-paper-white text-[9px] uppercase tracking-wider px-1.5 py-0.5 whitespace-nowrap pointer-events-none opacity-0 group-hover/eye:opacity-100 transition-opacity duration-100">
                            Reveal
                        </span>
                    </button>
                )}
            </div>
        );
    }

    const paddedIndex = String(guessIndex).padStart(2, '0');

    const opacityClass = index === 0 ? 'opacity-100' : index === 1 ? 'opacity-95' : 'opacity-[0.85]';
    const scaleClass = index >= 2 ? 'scale-[0.99]' : 'scale-100';

    return (
        <div className={cn(
            "border border-charcoal bg-paper-white w-full max-w-[420px] mx-auto xl:max-w-none",
            "transition-opacity",
            opacityClass,
            scaleClass,
            isNew && "animate-card-enter",
        )}>
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-charcoal">
                <span className="font-mono font-bold text-base text-charcoal uppercase truncate" title={guess.name}>
                    {guess.name}
                </span>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="font-mono text-sm text-charcoal/60">
                        #{paddedIndex}
                    </span>
                    {!collapsed && (
                        <button
                            onClick={onToggleCollapse}
                            className="md:hidden w-7 h-7 flex items-center justify-center text-charcoal/40 active:text-charcoal transition-colors touch-manipulation"
                            aria-label="Collapse card"
                        >
                            <ChevronDown className="w-4 h-4 rotate-180" />
                        </button>
                    )}
                </div>
            </div>

            {collapsed ? (
                renderSummaryStrip()
            ) : (
                <div className={isExpandingFromCollapsed ? 'card-body-enter' : undefined}>
                    {/* Main Attribute Grid (with merged Location row at top) */}
                    <div className="grid grid-cols-2 gap-px bg-charcoal">
                        {renderLocationCell()}
                        {mainFields.map(renderCell)}
                        {mainFields.length % 2 !== 0 && (
                            <div className="bg-paper-white" />
                        )}
                        {listFields.map(renderListCell)}
                    </div>

                    {/* Expandable section for folded attributes */}
                    {foldedFields.length > 0 && (
                        <>
                            <button
                                onClick={() => setExpanded(prev => !prev)}
                                className="w-full flex items-center justify-center gap-1 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-charcoal/50 hover:text-charcoal hover:bg-zinc-100 transition-colors border-t border-charcoal"
                            >
                                <span>{expanded ? 'Hide' : 'More'} clues</span>
                                <ChevronDown className={cn("w-3 h-3 transition-transform", expanded && "rotate-180")} />
                            </button>
                            {expanded && (
                                <div className="grid grid-cols-2 gap-px bg-charcoal border-t border-charcoal">
                                    {foldedFields.map(renderCell)}
                                    {foldedFields.length % 2 !== 0 && (
                                        <div className="bg-paper-white" />
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
