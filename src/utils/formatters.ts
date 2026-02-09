import type { FeedbackDirection } from '../types';

/**
 * Formats a number with suffixes (k, M, B) for better readability.
 * Pass fieldLabel to suppress suffix for year-like fields (Year, Discovered).
 */
export function formatNumber(num: number, digits = 1, fieldLabel?: string): string {
    // Year-like fields: don't apply suffix for values in typical year range
    if (fieldLabel && /year|discovered/i.test(fieldLabel)) {
        if (num === 0) return 'Ancient';
        if (num >= 1000 && num <= 2029) return String(num);
    }

    const lookup = [
        { value: 1, symbol: "" },
        { value: 1e3, symbol: "k" },
        { value: 1e6, symbol: "M" },
        { value: 1e9, symbol: "B" },
        { value: 1e12, symbol: "T" },
        { value: 1e15, symbol: "P" },
        { value: 1e18, symbol: "E" }
    ];
    const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
    const absNum = Math.abs(num);
    const sign = num < 0 ? "-" : "";
    const item = lookup.slice().reverse().find(function (item) {
        return absNum >= item.value;
    });
    return item ? sign + (absNum / item.value).toFixed(digits).replace(rx, "$1") + item.symbol : "0";
}

/** Format distance in km for display */
export function formatDistance(km: number): string {
    if (km === 0) return '0 km';
    if (km < 1000) return `${Math.round(km).toLocaleString()} km`;
    return `${formatNumber(km)} km`;
}

/** Format percentage diff into display tiers (small diffs as %, large diffs as multipliers) */
export function formatPercentageDiffTier(percentDiff: number): string {
    if (percentDiff === 0) return 'Exact';
    if (percentDiff <= 15) return '~10%';
    if (percentDiff <= 37) return '~25%';
    if (percentDiff <= 75) return '~50%';
    if (percentDiff <= 150) return '~100%';

    // For large differences, switch to multiplier tiers
    const factor = percentDiff / 100 + 1; // e.g. 200% diff = 3x factor
    if (factor < 5) return '2x+';
    if (factor < 10) return '5x+';
    if (factor < 50) return '10x+';
    if (factor < 100) return '50x+';
    return '100x+';
}

/** Format absolute year difference into human-readable range tiers */
export function formatYearDiffTier(absDiff: number): string {
    if (absDiff === 0) return 'Exact';
    if (absDiff <= 2) return '±2 yrs';
    if (absDiff <= 5) return '±5 yrs';
    if (absDiff <= 10) return '±10 yrs';
    if (absDiff <= 25) return '±25 yrs';
    if (absDiff <= 50) return '±50 yrs';
    return '50+ yrs';
}

/** Expand IUCN conservation status codes to full labels */
const CONSERVATION_STATUS_MAP: Record<string, string> = {
    'LC': 'Least Concern',
    'NT': 'Near Threatened',
    'VU': 'Vulnerable',
    'EN': 'Endangered',
    'CR': 'Critically Endangered',
    'EW': 'Extinct in Wild',
    'EX': 'Extinct',
    'NE': 'Not Evaluated',
    'DD': 'Data Deficient',
};

export function expandConservationStatus(code: string): string {
    return CONSERVATION_STATUS_MAP[code.toUpperCase()] ?? code;
}

/** Get arrow symbol for direction */
export function getDirectionSymbol(direction: FeedbackDirection): string {
    if (direction === 'UP') return '↑';
    if (direction === 'DOWN') return '↓';
    return '';
}

/** Get horizontal arrow for alphabetical position direction.
 *  UP (target number higher) = later in alphabet → right arrow.
 *  DOWN (target number lower) = earlier in alphabet → left arrow. */
export function getAlphaDirectionSymbol(direction: FeedbackDirection): string {
    if (direction === 'UP') return '\u2192';   // →
    if (direction === 'DOWN') return '\u2190'; // ←
    return '';
}

/** Convert a 1-26 integer to its letter character (A-Z) */
export function numberToLetter(num: number): string {
    if (num >= 1 && num <= 26) return String.fromCharCode(64 + num);
    return String(num);
}
