import type { Feedback, SchemaField } from '../types';

// ---------------------------------------------------------------------------
// Feedback Color Helpers
// ---------------------------------------------------------------------------

/**
 * Distance-based coloring for the GEO_DISTANCE cell (Distance from Target).
 * Green for close, amber for medium, yellow for far, gray for very far.
 */
export function getGeoDistanceCellClass(distanceKm: number | undefined): string {
    if (distanceKm === undefined) return 'bg-white text-charcoal';
    if (distanceKm < 1000) return 'bg-thermal-green text-white';   // green (includes 0km)
    if (distanceKm < 3000) return 'bg-geo-warm';                   // amber
    if (distanceKm < 5000) return 'bg-geo-yellow';                 // yellow
    return 'bg-white text-charcoal';                               // white (cold)
}

export function getCategoryMatchClass(categoryMatch: boolean | undefined): string {
    if (categoryMatch === true) return 'bg-cat-match';
    return 'bg-white text-charcoal';
}

export function getStandardStatusClass(status: string | undefined): string {
    if (status === 'EXACT') return 'bg-thermal-green text-white';
    if (status === 'HOT') return 'bg-thermal-orange text-white';
    if (status === 'NEAR') return 'bg-amber-100 text-charcoal border-dashed border-amber-400';
    return 'bg-white text-charcoal';
}

export function getCellColor(cellFeedback: Feedback | undefined, field: SchemaField): string {
    if (!cellFeedback) return 'bg-white text-charcoal';

    // GEO_DISTANCE (Distance from Target cell) — own gradient with green for close
    if (field.logicType === 'GEO_DISTANCE') {
        return getGeoDistanceCellClass(cellFeedback.distanceKm);
    }

    // DISTANCE_GRADIENT (Continent, Subregion, Hemisphere) — green for exact text match, white otherwise
    if (field.uiColorLogic === 'DISTANCE_GRADIENT') {
        return cellFeedback.status === 'EXACT'
            ? 'bg-thermal-green text-white'
            : 'bg-white text-charcoal';
    }

    // CATEGORY_MATCH / linked-category HIGHER_LOWER — green for exact, gold for same bucket
    if (field.uiColorLogic === 'CATEGORY_MATCH' || cellFeedback.categoryMatch !== undefined) {
        return cellFeedback.status === 'EXACT'
            ? 'bg-thermal-green text-white'
            : getCategoryMatchClass(cellFeedback.categoryMatch);
    }

    // STANDARD fallback — green for exact, orange/amber/gray for rest
    return getStandardStatusClass(cellFeedback.status);
}
