import type { Feedback, SchemaField } from '../types';

// ---------------------------------------------------------------------------
// Feedback Color Helpers
// ---------------------------------------------------------------------------

function getCategoryMatchClass(categoryMatch: boolean | undefined): string {
    if (categoryMatch === true) return 'bg-cat-match';
    return 'bg-white text-charcoal';
}

function getStandardStatusClass(status: string | undefined): string {
    if (status === 'EXACT') return 'bg-thermal-green text-white';
    if (status === 'HOT') return 'bg-thermal-orange text-white';
    if (status === 'NEAR') return 'bg-amber-100 text-charcoal border-dashed border-amber-400';
    return 'bg-white text-charcoal';
}

export function getCellColor(cellFeedback: Feedback | undefined, field: SchemaField): string {
    if (!cellFeedback) return 'bg-white text-charcoal';

    // GEO_DISTANCE — 3-tier: green (exact), gold (hot <1000km), amber-dashed (near <3000km), white (miss)
    if (field.logicType === 'GEO_DISTANCE') {
        if (cellFeedback.status === 'EXACT') return 'bg-thermal-green text-white';
        if (cellFeedback.status === 'HOT') return 'bg-cat-match';
        if (cellFeedback.status === 'NEAR') return 'bg-amber-100 text-charcoal border border-dashed border-amber-400';
        return 'bg-white text-charcoal';
    }

    // DISTANCE_GRADIENT (Continent, Subregion, Hemisphere) — green for exact text match, white otherwise
    if (field.uiColorLogic === 'DISTANCE_GRADIENT') {
        return cellFeedback.status === 'EXACT'
            ? 'bg-thermal-green text-white'
            : 'bg-white text-charcoal';
    }

    // CATEGORY_MATCH / linked-category HIGHER_LOWER — green for exact, amber for near, gold for same bucket
    if (field.uiColorLogic === 'CATEGORY_MATCH' || cellFeedback.categoryMatch !== undefined) {
        if (cellFeedback.status === 'EXACT') return 'bg-thermal-green text-white';
        if (cellFeedback.status === 'NEAR') return 'bg-amber-100 text-charcoal border border-dashed border-amber-400';
        return getCategoryMatchClass(cellFeedback.categoryMatch);
    }

    // STANDARD fallback — green for exact, orange/amber/gray for rest
    return getStandardStatusClass(cellFeedback.status);
}
