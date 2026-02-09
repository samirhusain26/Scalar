import type { FeedbackDirection } from '../types';

/**
 * Formats a number with suffixes (k, M, B) for better readability.
 */
export function formatNumber(num: number, digits = 1): string {
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

/** Format percentage diff into display tiers */
export function formatPercentageDiffTier(percentDiff: number): string {
    if (percentDiff === 0) return 'Exact';
    if (percentDiff <= 15) return '~10%';
    if (percentDiff <= 37) return '~25%';
    if (percentDiff <= 75) return '~50%';
    if (percentDiff <= 150) return '~100%';
    return '200%+';
}

/** Get arrow symbol for direction */
export function getDirectionSymbol(direction: FeedbackDirection): string {
    if (direction === 'UP') return '↑';
    if (direction === 'DOWN') return '↓';
    return '';
}
