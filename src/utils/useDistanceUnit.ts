import { useSyncExternalStore } from 'react';
import type { DistanceUnit } from './formatters';

export type { DistanceUnit };

const STORAGE_KEY = 'scalar-distance-unit';

/**
 * Countries where miles are the conventional unit for distances.
 * Uses ISO 3166-1 alpha-2 region codes.
 */
const MILE_REGIONS = new Set(['US', 'LR', 'MM', 'GB']);

/** Infer default unit from browser locale using Likely Subtags maximization.
 *  e.g. 'en' → 'en-Latn-US' → 'US' → 'mi', 'hi' → 'hi-Deva-IN' → 'IN' → 'km' */
function getUnitFromLocale(): DistanceUnit {
    try {
        const region = new Intl.Locale(navigator.language ?? 'en').maximize().region;
        if (region && MILE_REGIONS.has(region)) return 'mi';
    } catch {
        // Intl.Locale or maximize() unsupported — fall through to default
    }
    return 'km';
}

function getInitialUnit(): DistanceUnit {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'km' || stored === 'mi') return stored;
    } catch {
        // localStorage unavailable (e.g. SSR)
    }
    return getUnitFromLocale();
}

let _unit: DistanceUnit = getInitialUnit();
const _listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
    _listeners.add(listener);
    return () => { _listeners.delete(listener); };
}

function getSnapshot(): DistanceUnit {
    return _unit;
}

export function toggleDistanceUnit(): void {
    _unit = _unit === 'km' ? 'mi' : 'km';
    try {
        localStorage.setItem(STORAGE_KEY, _unit);
    } catch {
        // ignore
    }
    _listeners.forEach(l => l());
}

/**
 * Returns the current distance display unit and a toggle function.
 * All components using this hook share the same module-level state,
 * so toggling from one cell updates every distance cell simultaneously.
 */
export function useDistanceUnit(): [DistanceUnit, () => void] {
    const unit = useSyncExternalStore(subscribe, getSnapshot);
    return [unit, toggleDistanceUnit];
}
