import type { Entity, CategorySchema, Feedback, FeedbackDirection, FeedbackStatus, GameData, RankInfo } from '../types';

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
        let status: FeedbackStatus = 'MISS';

        if (field.type === 'STRING') {
            // String comparison
            if (String(targetVal).toLowerCase() === String(guessVal).toLowerCase()) {
                status = 'EXACT';
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
                status = 'EXACT';
            } else if (field.proximityConfig) {
                const diff = Math.abs(gNum - tNum);
                const allowance = field.proximityConfig.type === 'RANGE'
                    ? field.proximityConfig.value
                    : field.proximityConfig.value * Math.abs(tNum);

                if (diff <= allowance) {
                    status = 'HOT';
                } else {
                    const nearAllowance = allowance * field.proximityConfig.nearMultiplier;
                    if (diff <= nearAllowance) {
                        status = 'NEAR';
                    }
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
    return Object.values(feedback).every(f => f.status === 'EXACT');
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

export const calculateRank = (score: number, par: number): RankInfo => {
    if (score <= par) {
        return { rank: 'GOLD', label: 'Editorial Choice' };
    } else if (score <= par + 3) {
        return { rank: 'SILVER', label: 'Subscriber' };
    } else {
        return { rank: 'BRONZE', label: 'Casual Reader' };
    }
};

export const getInitialColumnVisibility = (
    schema: CategorySchema
): Record<string, boolean> => {
    const keys = Object.keys(schema).filter(k => k !== 'id' && k !== 'name');
    const visibility: Record<string, boolean> = {};
    for (const key of keys) {
        visibility[key] = false;
    }

    // Randomly select 2 "Core" attributes to be visible by default
    const shuffled = [...keys].sort(() => Math.random() - 0.5);
    for (let i = 0; i < Math.min(2, shuffled.length); i++) {
        visibility[shuffled[i]] = true;
    }

    return visibility;
};
