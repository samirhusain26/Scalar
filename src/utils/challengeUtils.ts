import gameDataRaw from '../assets/data/gameData.json';
import type { Entity, GameData } from '../types';

const gameData = gameDataRaw as unknown as GameData;

interface ChallengePayload {
    c: string;
    i: string;
}

interface ChallengeResult {
    category: string;
    entity: Entity;
}

export function encodeChallenge(categoryId: string, entityId: string): string {
    const payload: ChallengePayload = { c: categoryId, i: entityId };
    return btoa(JSON.stringify(payload));
}

export function decodeChallenge(hash: string): ChallengeResult | null {
    try {
        const json = atob(hash);
        const payload: ChallengePayload = JSON.parse(json);

        if (!payload.c || !payload.i) return null;

        const entities = gameData.categories[payload.c];
        if (!entities) return null;

        const entity = entities.find((e) => e.id === payload.i);
        if (!entity) return null;

        return { category: payload.c, entity };
    } catch {
        return null;
    }
}
