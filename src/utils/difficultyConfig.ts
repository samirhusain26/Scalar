import type { Difficulty } from '../types';
export type { Difficulty };

interface DifficultyConfig {
    displayName: string;
    suggestionLimit: number;
    hiddenColumns: Record<string, string[]>;
    /** Move cost for opening the World Map / Periodic Table (charged once per session per category). */
    vizMoveCost: number;
}

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
    novice: {
        displayName: 'Novice',
        suggestionLimit: 12,
        hiddenColumns: {
            countries: [],
            elements: [],
        },
        vizMoveCost: 0,
    },
    scholar: {
        displayName: 'Scholar',
        suggestionLimit: 6,
        hiddenColumns: {
            countries: [],
            elements: [],
        },
        vizMoveCost: 3,
    },
    prodigy: {
        displayName: 'Prodigy',
        suggestionLimit: 0,
        hiddenColumns: {
            countries: ['government_type', 'border_countries_count', 'first_letter', 'timezones'],
            elements: ['AtomicNumber', 'StandardState'],
        },
        vizMoveCost: 10,
    },
};

export const DEFAULT_DIFFICULTY: Difficulty = 'scholar';
