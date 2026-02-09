import type { Entity, CategorySchema, Feedback, FeedbackDirection, FeedbackStatus, GameData, GameMode } from '../types';

export const getFeedback = (
    target: Entity,
    guess: Entity,
    schema: CategorySchema
): Record<string, Feedback> => {
    const result: Record<string, Feedback> = {};

    for (const key in schema) {
        const field = schema[key];
        const targetVal = target[key];
        const guessVal = guess[key];

        let direction: FeedbackDirection = 'NONE';
        let status: FeedbackStatus = 'NULL';

        if (field.type === 'STRING') {
            // String comparison
            if (String(targetVal).toLowerCase() === String(guessVal).toLowerCase()) {
                status = 'CRITICAL';
            }
        } else {
            // Numeric comparison (INT, FLOAT, CURRENCY)
            const tNum = Number(targetVal);
            const gNum = Number(guessVal);

            // Direction Logic
            if (gNum < tNum) {
                direction = 'UP';
            } else if (gNum > tNum) {
                direction = 'DOWN';
            } else {
                direction = 'EQUAL';
            }

            // Proximity Logic
            if (gNum === tNum) {
                status = 'CRITICAL';
            } else if (field.tolerance !== null) {
                const diff = Math.abs(gNum - tNum);
                const allowance = field.tolerance * tNum;
                if (diff <= allowance) {
                    status = 'THERMAL';
                }
            }
        }

        result[key] = {
            direction,
            status,
            value: guessVal,
        };
    }

    return result;
};

export const getGuessesForMode = (mode: GameMode): number => {
    switch (mode) {
        case 'EASIER': return 999; // Effectively unlimited
        case 'EASY': return 15;
        case 'REGULAR': return 10;
        case 'HARD': return 5;
        case 'HARDEST': return 3;
        default: return 10;
    }
};

export const getRandomTarget = (gameData: GameData, category: string): Entity => {
    const entities = gameData.categories[category] || [];
    if (entities.length === 0) {
        console.warn(`No entities found for category: ${category}`);
        return { id: 'error', name: 'Error' };
    }
    const randomIndex = Math.floor(Math.random() * entities.length);
    return entities[randomIndex];
};

export const checkWinCondition = (feedback: Record<string, Feedback>): boolean => {
    return Object.values(feedback).every(f => f.status === 'CRITICAL');
};

export interface DeepScanCalculationResult {
    percentile: number;
    attributeLabel: string;
}

export const calculateDeepScan = (
    gameData: GameData,
    activeCategory: string,
    attribute: string,
    targetValue: string | number
): DeepScanCalculationResult | null => {
    const currentSchema = gameData.schema[activeCategory];
    const fieldDef = currentSchema?.[attribute];

    if (!fieldDef || (fieldDef.type !== 'INT' && fieldDef.type !== 'FLOAT' && fieldDef.type !== 'CURRENCY')) {
        return null;
    }

    if (typeof targetValue !== 'number') return null;

    const entities = gameData.categories[activeCategory] || [];
    const numericValues = entities
        .map(e => e[attribute])
        .filter(v => typeof v === 'number') as number[];

    if (numericValues.length === 0) return null;

    // Sort ascending to find rank
    numericValues.sort((a, b) => a - b);

    const total = numericValues.length;
    const rankIndex = numericValues.indexOf(targetValue);

    if (rankIndex === -1) return null;

    const rankFromTop = total - rankIndex;
    const percentTop = (rankFromTop / total) * 100;

    return {
        percentile: percentTop,
        attributeLabel: fieldDef.label || attribute
    };
};

export const getSuggestions = (
    entities: Entity[],
    query: string,
    guessedIds: Set<string>
): Entity[] => {
    if (!query.trim()) return [];
    const lowerQ = query.toLowerCase();

    return entities
        .filter(e => !guessedIds.has(e.id) && (
            e.name.toLowerCase().includes(lowerQ) ||
            e.id.toLowerCase().includes(lowerQ)
        ))
        // Deduplicate by name
        .filter((entity, index, self) =>
            index === self.findIndex((t) => (
                t.name === entity.name
            ))
        )
        .slice(0, 8); // Limit to 8 for better UI
};
