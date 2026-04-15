import type { Entity, Feedback, GameMode } from '../types';
import { encodeChallenge } from './challengeUtils';

/** Returns YYYY-MM-DD in the user's local timezone (Swedish locale = ISO 8601 format). */
export function getLocalDateString(): string {
    return new Date().toLocaleDateString('sv');
}

/** Converts "2026-02-26" → "2/26" for use in share text headers. */
export function formatDateLabel(dateString: string): string {
    const parts = dateString.split('-');
    return `${parseInt(parts[1])}/${parseInt(parts[2])}`;
}

/** Converts "2026-02-26" → "Feb 26" for display in the mode toggle. */
export function formatToggleDateLabel(dateString: string): string {
    const parts = dateString.split('-');
    const date = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
    const monthStr = date.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
    return `${monthStr} ${parseInt(parts[2])}`;
}

/**
 * Epoch for puzzle numbering. Puzzle #1 = 2026-03-01 (launch day).
 * The epoch is the day before launch so that the 1-indexed count starts on launch.
 */
const EPOCH_DATE_STRING = '2026-02-28';

/**
 * Returns the sequential puzzle number for a given date string.
 * Puzzle #1 = 2026-03-01. Uses local-timezone date arithmetic so the number
 * matches what the user sees on their clock regardless of DST offsets.
 */
export function getPuzzleNumber(dateString: string): number {
    const [ey, em, ed] = EPOCH_DATE_STRING.split('-').map(Number);
    const [y, m, d] = dateString.split('-').map(Number);
    const epochMs = new Date(ey, em - 1, ed).getTime();
    const dateMs = new Date(y, m - 1, d).getTime();
    return Math.round((dateMs - epochMs) / (1000 * 60 * 60 * 24));
}

/** Mulberry32 PRNG — returns a function that produces floats in [0, 1). */
function mulberry32(seed: number): () => number {
    return function () {
        let t = (seed += 0x6D2B79F5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** djb2-style string hash → unsigned 32-bit int. */
function hashString(s: string): number {
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
        hash = ((hash * 31) + s.charCodeAt(i)) >>> 0;
    }
    return hash;
}

/**
 * Deterministically selects an entity for a given category and date string.
 * Sorts entities alphabetically by id before selection to guarantee stability
 * even if the source JSON order changes (e.g. from re-running fetch_data.py).
 */
export function getDailyEntity(category: string, entities: Entity[], dateString: string): Entity {
    const seed = hashString(`${dateString}:${category}`);
    const rand = mulberry32(seed);
    const sorted = [...entities].sort((a, b) => a.id.localeCompare(b.id));
    const index = Math.floor(rand() * sorted.length);
    return sorted[index];
}

export const CATEGORY_ICONS: Record<string, string> = {
    countries: '🌍',
    elements: '⚗️',
};

/**
 * The three location attribute keys that the UI merges into a single "Location"
 * cell in GuessCard. We consolidate them into one emoji in the share grid to
 * prevent line-wrapping on narrow screens (11 cols → 9 cols for countries).
 */
export const LOCATION_KEYS = ['hemisphere', 'continent', 'subregion'] as const;
export const LOCATION_KEY_SET = new Set<string>(LOCATION_KEYS);

/**
 * Returns the consolidated status for the merged Location cell.
 * Used by ShareCard (colored-div rendering) instead of emoji.
 */
export function getLocationStatus(feedback: Record<string, Feedback>): 'EXACT' | 'PARTIAL' | 'MISS' {
    const exactCount = LOCATION_KEYS.filter(key => feedback[key]?.status === 'EXACT').length;
    if (exactCount === 3) return 'EXACT';
    if (exactCount > 0)   return 'PARTIAL';
    return 'MISS';
}

/**
 * Generates share text for Scalar daily and free play modes.
 *
 * Daily:    "SCALAR Daily (2/26) • 🌍 Countries • 7 Moves"
 * Freeplay: "SCALAR • 🌍 Countries • 5 Moves"
 */
export function generateShareText(
    mode: GameMode,
    dateString: string,
    category: string,
    moves: number,
    entityId: string,
): string {
    const icon = CATEGORY_ICONS[category] ?? '🎮';
    const catName = category.charAt(0).toUpperCase() + category.slice(1);

    const header = mode === 'daily'
        ? `SCALAR Daily (${formatDateLabel(dateString)}) • ${icon} ${catName} • ${moves} Moves`
        : `SCALAR • ${icon} ${catName} • ${moves} Moves`;

    const url = mode === 'daily'
        ? 'https://scalargame.com'
        : `https://scalargame.com/?challenge=${encodeChallenge(category, entityId, moves)}`;

    return [header, url].join('\n');
}

/**
 * Generates share text for Continuum daily mode.
 *
 * Format: "CONTINUUM Daily (2/26) • 🌍 Countries • 12 Placed"
 */
export function generateContinuumShareText(
    dateString: string,
    category: string,
    score: number,
): string {
    const icon = CATEGORY_ICONS[category] ?? '🎮';
    const catName = category.charAt(0).toUpperCase() + category.slice(1);
    const header = `CONTINUUM Daily (${formatDateLabel(dateString)}) • ${icon} ${catName} • ${score} Placed`;
    return [header, 'https://scalargame.com/continuum'].join('\n');
}
