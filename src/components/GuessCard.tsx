import { useState } from 'react';
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
    gameStatus: GameStatus;
    onRevealMajorHint: (attributeKeys: string | string[]) => void;
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

/** Keys that get merged into a single "Location" cell */
const LOCATION_KEYS = ['continent', 'subregion', 'hemisphere'] as const;

/** Keys that render as full-width list rows (SET_INTERSECTION) */
const LIST_FIELD_KEYS = ['Credits', 'Genre'] as const;

export function GuessCard({
    guess,
    feedback,
    displayFields,
    majorHintAttributes,
    targetEntity,
    guessIndex,
    gameStatus,
    onRevealMajorHint,
}: GuessCardProps) {
    const isPlaying = gameStatus === 'PLAYING';
    const [expanded, setExpanded] = useState(false);

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
                if (targetVal >= 1000 && targetVal <= 2029) return String(targetVal);
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
            if (rawValue >= 1000 && rawValue <= 2029) return String(rawValue);
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
        // RELATIVE_PERCENTAGE: exact % for small diffs, multiplier tiers for large diffs
        if (field.displayFormat === 'RELATIVE_PERCENTAGE') {
            const gNum = Number(guess[field.attributeKey]);
            const tNum = Number(targetEntity[field.attributeKey]);
            const arrow = getDirectionSymbol(cellFeedback.direction);
            if (!isNaN(gNum) && !isNaN(tNum) && gNum !== 0) {
                const relPct = Math.abs(((tNum - gNum) / gNum) * 100);
                if (relPct > 150) {
                    return `${arrow} ${formatPercentageDiffTier(relPct)}`.trim();
                }
            }
            return cellFeedback.displayValue ?? '';
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
        // All other formats: show tier-bucketed (e.g. "↑ ~25%")
        const tier = formatPercentageDiffTier(cellFeedback.percentageDiff ?? 0);
        return `${arrow} ${tier}`.trim();
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

    /** Render the merged Location cell (Hemisphere • Continent • Subregion) */
    function renderLocationCell() {
        if (locationFields.length === 0) return null;

        const locationKeys = locationFields.map(f => f.attributeKey);
        const allLocationHinted = locationKeys.every(k => majorHintAttributes.includes(k));
        const anyLocationHinted = locationKeys.some(k => majorHintAttributes.includes(k));

        // Build per-attribute feedback data
        const parts = locationFields.map(f => ({
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

        return (
            <div className={cn("relative col-span-2 px-3 py-2 font-mono", cellBg)}>
                <div className="text-[10px] uppercase opacity-60 tracking-wider leading-tight mb-1">
                    Location
                </div>
                <div className="flex items-baseline gap-0 text-sm font-bold leading-tight flex-wrap">
                    {parts.map((part, i) => (
                        <span key={part.field.attributeKey} className="flex items-baseline">
                            <span className={cn(
                                !allExact && part.isExact && 'text-green-600 font-extrabold',
                                !allExact && !part.isExact && 'opacity-50',
                            )}>
                                {part.value}
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
                        <span>{locationFields.map(f => String(targetEntity[f.attributeKey] ?? '')).join(' • ')}</span>
                    </div>
                )}

                {/* Hint trigger */}
                {isPlaying && !allLocationHinted && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onRevealMajorHint(locationKeys); }}
                        className="absolute top-1 right-1 p-0.5 opacity-40 hover:opacity-100 transition-opacity"
                        title="Reveal exact value"
                        aria-label="Reveal exact location values"
                    >
                        <Eye className="w-3 h-3" />
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

        return (
            <div key={key} className={cn("relative col-span-2 px-3 py-2 font-mono", cellBg)}>
                <div className="text-[10px] uppercase opacity-60 tracking-wider leading-tight mb-1">
                    {field.displayLabel}
                </div>
                <div className="text-sm leading-tight line-clamp-2">
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
                        className="absolute top-1 right-1 p-0.5 opacity-40 hover:opacity-100 transition-opacity"
                        title="Reveal exact value"
                        aria-label={`Reveal exact value for ${field.displayLabel}`}
                    >
                        <Eye className="w-3 h-3" />
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

        // HIGHER_LOWER cells get the split value/logic layout
        if (isHigherLower && secondaryText) {
            return (
                <div key={key} className={cn("relative px-2 py-2 font-mono", colorClass)}>
                    <div className="text-[10px] uppercase opacity-60 tracking-wider leading-tight">
                        {displayLabel}
                    </div>
                    <div className="flex justify-between items-baseline mt-0.5">
                        <span className="text-base font-bold leading-tight truncate">
                            {primaryText}
                        </span>
                        <span className="text-xs font-mono opacity-80 shrink-0 ml-2 min-w-[4rem] text-right">
                            {secondaryText}
                        </span>
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
                            className="absolute top-1 right-1 p-0.5 opacity-40 hover:opacity-100 transition-opacity"
                            title="Reveal exact value"
                            aria-label={`Reveal exact value for ${field.displayLabel}`}
                        >
                            <Eye className="w-3 h-3" />
                        </button>
                    )}
                </div>
            );
        }

        return (
            <div key={key} className={cn("relative px-2 py-2 font-mono", colorClass)}>
                <div className="text-[10px] uppercase opacity-60 tracking-wider leading-tight">
                    {displayLabel}
                </div>
                <div className={cn("text-sm font-bold leading-tight mt-0.5 truncate", isNA && "text-gray-400 font-normal italic")}>
                    {primaryText}
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
                        className="absolute top-1 right-1 p-0.5 opacity-40 hover:opacity-100 transition-opacity"
                        title="Reveal exact value"
                        aria-label={`Reveal exact value for ${field.displayLabel}`}
                    >
                        <Eye className="w-3 h-3" />
                    </button>
                )}
            </div>
        );
    }

    const paddedIndex = String(guessIndex).padStart(2, '0');

    return (
        <div className="border border-charcoal bg-paper-white">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-charcoal">
                <span className="font-mono font-bold text-base text-charcoal uppercase truncate">
                    {guess.name}
                </span>
                <span className="font-mono text-sm text-charcoal/60 shrink-0 ml-2">
                    #{paddedIndex}
                </span>
            </div>

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
                        className="w-full flex items-center justify-center gap-1 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-charcoal/50 hover:text-charcoal hover:bg-charcoal/5 transition-colors border-t border-charcoal"
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
    );
}
