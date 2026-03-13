import type { CategorySchema, Difficulty, SchemaField } from '../types';
import { DIFFICULTY_CONFIG } from './difficultyConfig';

/** Get columns that should be displayed in the grid (displayFormat !== HIDDEN, and not hidden by difficulty). */
export function getDisplayColumns(schema: CategorySchema, difficulty?: Difficulty, category?: string): SchemaField[] {
    const hiddenKeys = difficulty && category
        ? (DIFFICULTY_CONFIG[difficulty].hiddenColumns[category] ?? [])
        : [];
    return schema.filter(f => f.displayFormat !== 'HIDDEN' && !hiddenKeys.includes(f.attributeKey));
}
