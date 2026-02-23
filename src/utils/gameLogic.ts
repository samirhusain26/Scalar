import type {
    Entity,
    CategorySchema,
    SchemaField,
    Feedback,
    FeedbackDirection,
    FeedbackStatus,
    GameData,
} from '../types';
import { haversineDistance } from './geo';
import { formatDistance, formatNumber, formatPercentageDiffTier, getDirectionSymbol, numberToLetter } from './formatters';

// ---------------------------------------------------------------------------
// Feedback Engine — dispatches by logicType
// ---------------------------------------------------------------------------

export function getFeedback(
    target: Entity,
    guess: Entity,
    schema: CategorySchema
): Record<string, Feedback> {
    const result: Record<string, Feedback> = {};

    // Pre-compute distance for DISTANCE_GRADIENT fields
    const distKm = computeDistance(target, guess);

    for (const field of schema) {
        const { attributeKey, logicType } = field;

        // Skip non-display / support columns
        if (logicType === 'TARGET' || logicType === 'NONE') continue;

        let feedback: Feedback;

        switch (logicType) {
            case 'EXACT_MATCH':
                feedback = handleExactMatch(target, guess, field);
                break;
            case 'CATEGORY_MATCH':
                feedback = handleCategoryMatch(target, guess, field, distKm);
                break;
            case 'HIGHER_LOWER':
                feedback = handleHigherLower(target, guess, field);
                break;
            case 'GEO_DISTANCE':
                feedback = handleGeoDistance(distKm);
                break;
            case 'SET_INTERSECTION':
                feedback = handleSetIntersection(target, guess, field);
                break;
        }

        result[attributeKey] = feedback;
    }

    return result;
}

// ---------------------------------------------------------------------------
// Logic Type Handlers
// ---------------------------------------------------------------------------

function handleExactMatch(target: Entity, guess: Entity, field: SchemaField): Feedback {
    const targetVal = target[field.attributeKey];
    const guessVal = guess[field.attributeKey];

    if (field.dataType === 'BOOLEAN') {
        const toBool = (v: string | number | boolean | undefined): boolean => {
            if (typeof v === 'boolean') return v;
            if (typeof v === 'number') return v !== 0;
            const s = String(v ?? '').toLowerCase().trim();
            return s === 'true' || s === '1' || s === 'yes';
        };
        const tBool = toBool(targetVal);
        const gBool = toBool(guessVal);
        return {
            direction: 'NONE',
            status: tBool === gBool ? 'EXACT' : 'MISS',
            value: gBool ? 'Yes' : 'No',
        };
    }

    const match =
        String(targetVal).toLowerCase() === String(guessVal).toLowerCase();

    return {
        direction: 'NONE',
        status: match ? 'EXACT' : 'MISS',
        value: guessVal ?? '',
    };
}

function handleCategoryMatch(
    target: Entity,
    guess: Entity,
    field: SchemaField,
    distanceKm: number
): Feedback {
    const targetVal = String(target[field.attributeKey] ?? '').toLowerCase();
    const guessVal = String(guess[field.attributeKey] ?? '').toLowerCase();
    const match = targetVal === guessVal;

    const feedback: Feedback = {
        direction: 'NONE',
        status: match ? 'EXACT' : 'MISS',
        value: guess[field.attributeKey] ?? '',
    };

    // Attach distance for DISTANCE_GRADIENT coloring
    if (field.uiColorLogic === 'DISTANCE_GRADIENT') {
        feedback.distanceKm = distanceKm;
    }

    return feedback;
}

function handleHigherLower(
    target: Entity,
    guess: Entity,
    field: SchemaField
): Feedback {
    const tNum = Number(target[field.attributeKey]);
    const gNum = Number(guess[field.attributeKey]);

    // Handle missing data
    if (isNaN(tNum) || isNaN(gNum)) {
        return {
            direction: 'NONE',
            status: 'MISS',
            value: guess[field.attributeKey] ?? '',
            displayValue: 'N/A',
        };
    }

    // Direction
    let direction: FeedbackDirection = 'EQUAL';
    if (gNum < tNum) direction = 'UP';
    else if (gNum > tNum) direction = 'DOWN';

    // Exact match
    if (gNum === tNum) {
        return {
            direction: 'EQUAL',
            status: 'EXACT',
            value: gNum,
            displayValue: 'Exact',
            percentageDiff: 0,
            categoryMatch: true,
        };
    }

    // Symmetric ratio: max(|a|,|b|) / min(|a|,|b|) - 1, so 10x off reads the same in both directions.
    // e.g. guess=10k target=1M → ratio=100 → 9900%, not capped at 99% like target-denominator math.
    const larger = Math.max(Math.abs(tNum), Math.abs(gNum));
    const smaller = Math.min(Math.abs(tNum), Math.abs(gNum));
    const safeDenom = smaller > 0 ? smaller : 1;
    const percentDiff = Math.round((larger / safeDenom - 1) * 100);

    // Category match (linked column or range-based fallback)
    let catMatch: boolean | undefined;
    if (field.linkedCategoryCol) {
        const tCat = String(target[field.linkedCategoryCol] ?? '').toLowerCase();
        const gCat = String(guess[field.linkedCategoryCol] ?? '').toLowerCase();
        catMatch = tCat === gCat;
    } else {
        // No linked category — use percentage-based range (within 25% = near)
        catMatch = percentDiff <= 25;
    }

    // Build display value based on display format
    const arrow = getDirectionSymbol(direction);
    const tier = formatPercentageDiffTier(percentDiff);
    let displayValue: string;
    if (field.displayFormat === 'PERCENTAGE_DIFF') {
        displayValue = `${arrow} ${tier}`;
    } else if (field.displayFormat === 'RELATIVE_PERCENTAGE') {
        // Relative to guess: ((target - guess) / guess) * 100
        const relDenom = gNum !== 0 ? Math.abs(gNum) : 1;
        const relPct = Math.round(((tNum - gNum) / relDenom) * 100);
        const sign = relPct > 0 ? '+' : '';
        displayValue = `${arrow} ${sign}${relPct}%`;
    } else if (field.displayFormat === 'CURRENCY') {
        displayValue = `${arrow} $${formatNumber(gNum)}`;
    } else if (field.displayFormat === 'ALPHA_POSITION') {
        displayValue = numberToLetter(gNum);
    } else {
        const isYearField = /year|discovered/i.test(field.displayLabel);
        if (isYearField && gNum === 0) {
            displayValue = `${arrow} Ancient`.trim();
        } else {
            displayValue = `${arrow} ${gNum}`;
        }
    }

    // Determine status from category match
    let status: FeedbackStatus = 'MISS';
    if (catMatch === true) status = 'HOT';

    return {
        direction,
        status,
        value: gNum,
        displayValue,
        percentageDiff: percentDiff,
        categoryMatch: catMatch,
    };
}

function handleGeoDistance(distanceKm: number): Feedback {
    let status: FeedbackStatus = 'MISS';
    if (distanceKm === 0) status = 'EXACT';
    else if (distanceKm < 1000) status = 'HOT';
    else if (distanceKm < 3000) status = 'NEAR';

    return {
        direction: 'NONE',
        status,
        value: distanceKm,
        displayValue: formatDistance(distanceKm),
        distanceKm: distanceKm,
    };
}

function handleSetIntersection(
    target: Entity,
    guess: Entity,
    field: SchemaField
): Feedback {
    const tRaw = String(target[field.attributeKey] ?? '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
    const gRaw = String(guess[field.attributeKey] ?? '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

    const tLower = tRaw.map(s => s.toLowerCase());

    // Find matched items preserving original case from the guess
    const matched = gRaw.filter(item => tLower.includes(item.toLowerCase()));

    const allLower = [...new Set([...tLower, ...gRaw.map(s => s.toLowerCase())])];

    let status: FeedbackStatus = 'MISS';
    if (allLower.length > 0) {
        const ratio = matched.length / allLower.length;
        if (ratio === 1) status = 'EXACT';
        else if (ratio > 0.5) status = 'HOT';
        else if (ratio > 0) status = 'NEAR';
    }

    // Build per-item match info for UI rendering
    const matchedItemsList = gRaw.map(item => ({
        text: item,
        isMatch: tLower.includes(item.toLowerCase()),
    }));

    return {
        direction: 'NONE',
        status,
        value: guess[field.attributeKey] ?? '',
        displayValue: matched.length > 0 ? matched.join(', ') : 'No match',
        matchedItems: matchedItemsList,
    };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeDistance(target: Entity, guess: Entity): number {
    const tLat = Number(target['Latitude']);
    const tLon = Number(target['Longitude']);
    const gLat = Number(guess['Latitude']);
    const gLon = Number(guess['Longitude']);

    if (isNaN(tLat) || isNaN(tLon) || isNaN(gLat) || isNaN(gLon)) return 99999;

    return haversineDistance(gLat, gLon, tLat, tLon);
}

// ---------------------------------------------------------------------------
// Game Utilities
// ---------------------------------------------------------------------------

export function getRandomTarget(gameData: GameData, category: string): Entity {
    const entities = gameData.categories[category] || [];
    if (entities.length === 0) {
        console.warn(`No entities found for category: ${category}`);
        return { id: 'error', name: 'Error' };
    }
    return entities[Math.floor(Math.random() * entities.length)];
}

export function checkWinCondition(feedback: Record<string, Feedback>): boolean {
    return Object.values(feedback).every(f => f.status === 'EXACT');
}

export function getSuggestions(
    entities: Entity[],
    query: string,
    guessedIds: Set<string>
): Entity[] {
    if (!query.trim()) return [];
    const lowerQ = query.toLowerCase();

    return entities
        .filter(
            e =>
                !guessedIds.has(e.id) &&
                (e.name.toLowerCase().includes(lowerQ) ||
                    e.id.toLowerCase().includes(lowerQ))
        )
        .filter(
            (entity, index, self) =>
                index === self.findIndex(t => t.name === entity.name)
        )
        .slice(0, 8);
}

