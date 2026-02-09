import type {
    Entity,
    CategorySchema,
    SchemaField,
    Feedback,
    FeedbackDirection,
    FeedbackStatus,
    GameData,
    RankInfo,
} from '../types';
import { haversineDistance } from './geo';
import { formatDistance, formatNumber, formatPercentageDiffTier, getDirectionSymbol } from './formatters';

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
            default:
                feedback = {
                    direction: 'NONE',
                    status: 'MISS',
                    value: guess[attributeKey] ?? '',
                };
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
        const tBool = Boolean(targetVal);
        const gBool = Boolean(guessVal);
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

    // Percentage diff
    const percentDiff =
        tNum !== 0
            ? Math.round(Math.abs((gNum - tNum) / tNum) * 100)
            : Math.abs(gNum - tNum);

    // Category match (linked column)
    let catMatch: boolean | undefined;
    if (field.linkedCategoryCol) {
        const tCat = String(target[field.linkedCategoryCol] ?? '').toLowerCase();
        const gCat = String(guess[field.linkedCategoryCol] ?? '').toLowerCase();
        catMatch = tCat === gCat;
    }

    // Build display value based on display format
    const arrow = getDirectionSymbol(direction);
    const tier = formatPercentageDiffTier(percentDiff);
    let displayValue: string;
    if (field.displayFormat === 'PERCENTAGE_DIFF') {
        displayValue = `${arrow} ${tier}`;
    } else if (field.displayFormat === 'RELATIVE_PERCENTAGE') {
        // Relative to guess: ((target - guess) / guess) * 100
        const relPct = gNum !== 0
            ? Math.round(((tNum - gNum) / gNum) * 100)
            : 0;
        const sign = relPct > 0 ? '+' : '';
        displayValue = `${arrow} ${sign}${relPct}%`;
    } else if (field.displayFormat === 'CURRENCY') {
        displayValue = `${arrow} $${formatNumber(gNum)}`;
    } else {
        displayValue = `${arrow} ${gNum}`;
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
    const tList = String(target[field.attributeKey] ?? '')
        .split(',')
        .map(s => s.trim().toLowerCase())
        .filter(Boolean);
    const gList = String(guess[field.attributeKey] ?? '')
        .split(',')
        .map(s => s.trim().toLowerCase())
        .filter(Boolean);

    const intersection = gList.filter(item => tList.includes(item));
    const union = [...new Set([...tList, ...gList])];

    let status: FeedbackStatus = 'MISS';
    if (union.length > 0) {
        const ratio = intersection.length / union.length;
        if (ratio === 1) status = 'EXACT';
        else if (ratio > 0.5) status = 'HOT';
        else if (ratio > 0) status = 'NEAR';
    }

    return {
        direction: 'NONE',
        status,
        value: guess[field.attributeKey] ?? '',
        displayValue: `${intersection.length}/${tList.length}`,
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
                !guessedIds.has(e.id as string) &&
                (e.name.toLowerCase().includes(lowerQ) ||
                    (e.id as string).toLowerCase().includes(lowerQ))
        )
        .filter(
            (entity, index, self) =>
                index === self.findIndex(t => t.name === entity.name)
        )
        .slice(0, 8);
}

export function calculateRank(score: number, par: number): RankInfo {
    if (score <= par) {
        return { rank: 'GOLD', label: 'Editorial Choice' };
    } else if (score <= par + 3) {
        return { rank: 'SILVER', label: 'Subscriber' };
    } else {
        return { rank: 'BRONZE', label: 'Casual Reader' };
    }
}

export function getInitialColumnVisibility(
    schema: CategorySchema
): Record<string, boolean> {
    // Only non-folded display columns are candidates for random visibility
    const candidates = schema.filter(
        f => f.displayFormat !== 'HIDDEN' && !f.isFolded
    );

    const visibility: Record<string, boolean> = {};
    for (const field of candidates) {
        visibility[field.attributeKey] = false;
    }

    // Randomly select 2 columns to be visible
    const shuffled = [...candidates].sort(() => Math.random() - 0.5);
    for (let i = 0; i < Math.min(2, shuffled.length); i++) {
        visibility[shuffled[i].attributeKey] = true;
    }

    return visibility;
}
