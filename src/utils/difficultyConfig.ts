import type { Difficulty } from '../types';
export type { Difficulty };

interface DifficultyConfig {
    displayName: string;
    credits: number;
    suggestionLimit: number;
    hiddenColumns: Record<string, string[]>;
}

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
    novice: {
        displayName: 'Novice',
        credits: 5,
        suggestionLimit: 12,
        hiddenColumns: {
            countries: [],
            elements: [],
        },
    },
    scholar: {
        displayName: 'Scholar',
        credits: 3,
        suggestionLimit: 6,
        hiddenColumns: {
            countries: [],
            elements: [],
        },
    },
    prodigy: {
        displayName: 'Prodigy',
        credits: 0,
        suggestionLimit: 0,
        hiddenColumns: {
            countries: ['government_type', 'border_countries_count', 'first_letter', 'timezones'],
            elements: ['AtomicNumber', 'StandardState'],
        },
    },
};

export const DEFAULT_DIFFICULTY: Difficulty = 'scholar';
