import gameDataRaw from '../assets/data/gameData.json';
import type { Entity, GameData } from '../types';

const gameData = gameDataRaw as unknown as GameData;

interface ChallengePayload {
    c: string;
    i: string;
    m?: number;
}

interface ChallengeResult {
    category: string;
    entity: Entity;
    challengerMoves?: number;
}

export function encodeChallenge(categoryId: string, entityId: string, moves?: number): string {
    const payload: ChallengePayload = { c: categoryId, i: entityId };
    if (moves !== undefined) payload.m = moves;
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

        return { category: payload.c, entity, challengerMoves: payload.m };
    } catch {
        return null;
    }
}
