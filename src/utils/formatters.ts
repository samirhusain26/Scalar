import type { FeedbackDirection } from '../types';

/**
 * Formats a number with suffixes (k, M, B) for better readability.
 * Pass fieldLabel to suppress suffix for year-like fields (Year, Discovered).
 */
/** Upper bound for year detection: current year + 10 */
const MAX_YEAR = new Date().getFullYear() + 10;

export function formatNumber(num: number, digits = 1, fieldLabel?: string): string {
    // Year-like fields: don't apply suffix for values in typical year range
    if (fieldLabel && /year|discovered/i.test(fieldLabel)) {
        if (num === 0) return 'Ancient';
        if (num >= 1000 && num <= MAX_YEAR) return String(num);
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

export type DistanceUnit = 'km' | 'mi';

/** Format distance with unit selection — supports km or miles */
export function formatDistanceInUnit(km: number, unit: DistanceUnit): string {
    if (unit === 'mi') {
        const miles = km * 0.621371;
        if (miles === 0) return '0 mi';
        if (miles < 1000) return `${Math.round(miles).toLocaleString()} mi`;
        return `${formatNumber(miles)} mi`;
    }
    return formatDistance(km);
}

/** Format area (sq km) with unit selection — converts using 0.621371² ≈ 0.386102 */
export function formatAreaInUnit(sqKm: number, unit: DistanceUnit): string {
    if (unit === 'mi') return formatNumber(sqKm * 0.386102);
    return formatNumber(sqKm);
}

/**
 * Format a symmetric percentDiff (from max/min ratio) into approximate tier labels.
 * percentDiff = (max(|a|,|b|) / min(|a|,|b|) - 1) * 100, so it's always ≥ 0 and
 * reflects the same magnitude regardless of which direction the miss is in.
 *
 * Tier thresholds by effective ratio:
 *   ratio < 1.15  (~10%)  →  "~10%"
 *   ratio < 1.37  (~25%)  →  "~25%"
 *   ratio < 1.75  (~50%)  →  "~50%"
 *   ratio < 3     (~2×)   →  "~2×"
 *   ratio < 7     (~5×)   →  "~5×"
 *   ratio < 15    (~10×)  →  "~10×"
 *   ratio < 60    (~50×)  →  "~50×"
 *   ratio ≥ 60    (~100×) →  "~100×"
 */
export function formatPercentageDiffTier(percentDiff: number): string {
    if (percentDiff === 0) return 'Exact';
    const ratio = percentDiff / 100 + 1;
    if (ratio < 1.15) return '~10%';
    if (ratio < 1.37) return '~25%';
    if (ratio < 1.75) return '~50%';
    if (ratio < 3)    return '~2×';
    if (ratio < 7)    return '~5×';
    if (ratio < 15)   return '~10×';
    if (ratio < 60)   return '~50×';
    return '~100×';
}

/** Format absolute year difference into human-readable range tiers */
export function formatYearDiffTier(absDiff: number): string {
    if (absDiff === 0) return 'Exact';
    if (absDiff <= 5)  return '~5 yrs';
    if (absDiff <= 15) return '~15 yrs';
    if (absDiff <= 30) return '~30 yrs';
    return '30+ yrs';
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
