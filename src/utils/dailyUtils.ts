import type { Entity, Feedback, GameMode, GuessResult, SchemaField } from '../types';
import { encodeChallenge } from './challengeUtils';
import { getDisplayColumns } from './schemaParser';

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
 * Epoch for puzzle numbering. Puzzle #1 = 2026-02-26 (launch day).
 * The epoch is the day before launch so that the 1-indexed count starts on launch.
 */
const EPOCH_DATE_STRING = '2026-02-25';

/**
 * Returns the sequential puzzle number for a given date string.
 * Puzzle #1 = 2026-02-01. Uses local-timezone date arithmetic so the number
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

const CATEGORY_ICONS: Record<string, string> = {
    countries: '🌍',
    elements: '⚗️',
};

/**
 * The three location attribute keys that the UI merges into a single "Location"
 * cell in GuessCard. We consolidate them into one emoji in the share grid to
 * prevent line-wrapping on narrow screens (11 cols → 9 cols for countries).
 */
const LOCATION_KEYS = ['hemisphere', 'continent', 'subregion'] as const;
const LOCATION_KEY_SET = new Set<string>(LOCATION_KEYS);

function getStatusEmoji(status: string | undefined): string {
    switch (status) {
        case 'EXACT': return '🟩';
        case 'HOT':   return '🟧';
        case 'NEAR':  return '🟨';
        default:      return '⬜';
    }
}

/**
 * Computes the single consolidated emoji for the merged Location cell.
 * All 3 EXACT → 🟩 (green). 1–2 EXACT → 🟨 (partial). 0 EXACT → ⬜ (miss).
 */
function getLocationEmoji(feedback: Record<string, Feedback>): string {
    const exactCount = LOCATION_KEYS.filter(key => feedback[key]?.status === 'EXACT').length;
    if (exactCount === 3) return '🟩';
    if (exactCount > 0)   return '🟨';
    return '⬜';
}

/**
 * Generates Wordle-style share text for both daily and free play modes.
 *
 * Daily:    "SCALAR Daily #26 (Feb 26, 2026) • 🌍 Countries • 7 Moves"
 * Freeplay: "SCALAR • 🌍 Countries • 5 Moves"
 *
 * Followed by an emoji grid (one row per guess, one square per visible field).
 * For the countries category, the 3 location fields (Hemisphere, Continent,
 * Subregion) are consolidated into a single emoji — matching the merged
 * "Location" cell in GuessCard — so the grid fits on narrow mobile screens
 * without wrapping (11 cols → 9 cols).
 *
 * If the user took more than 6 guesses, only the first 3 rows, '...', and the
 * last row are shown.
 *
 * URL appended at the end:
 *   - Daily mode   → base domain only (no challenge hash; avoids spoiling the puzzle)
 *   - Freeplay mode → full challenge link with encoded entity + moves
 */
export function generateShareText(
    mode: GameMode,
    dateString: string,
    category: string,
    moves: number,
    guesses: GuessResult[],
    schema: SchemaField[],
    entityId: string,
): string {
    const displayFields = getDisplayColumns(schema).filter(
        f => !f.isFolded && f.logicType !== 'TARGET' && f.logicType !== 'NONE',
    );

    const icon = CATEGORY_ICONS[category] ?? '🎮';
    const catName = category.charAt(0).toUpperCase() + category.slice(1);

    const header = mode === 'daily'
        ? `SCALAR Daily #${getPuzzleNumber(dateString)} (${formatDateLabel(dateString)}) • ${icon} ${catName} • ${moves} Moves`
        : `SCALAR • ${icon} ${catName} • ${moves} Moves`;

    const allRows = guesses.map(({ feedback }) => {
        const emojis: string[] = [];
        let locationInserted = false;
        for (const f of displayFields) {
            if (LOCATION_KEY_SET.has(f.attributeKey)) {
                if (!locationInserted) {
                    emojis.push(getLocationEmoji(feedback));
                    locationInserted = true;
                }
                // Skip the remaining location fields — merged into one emoji above
            } else {
                emojis.push(getStatusEmoji(feedback[f.attributeKey]?.status));
            }
        }
        return emojis.join('');
    });

    let gridRows: string[];
    if (allRows.length > 6) {
        gridRows = [...allRows.slice(0, 3), '...', allRows[allRows.length - 1]];
    } else {
        gridRows = allRows;
    }

    const url = mode === 'daily'
        ? 'https://scalargame.com'
        : `${window.location.origin}${window.location.pathname}?challenge=${encodeChallenge(category, entityId, moves)}`;

    return [header, ...gridRows, url].join('\n');
}
