import type { CategorySchema, SchemaField } from '../types';

/** Get columns that should be displayed in the grid (displayFormat !== HIDDEN) */
export function getDisplayColumns(schema: CategorySchema): SchemaField[] {
    return schema.filter(f => f.displayFormat !== 'HIDDEN');
}

/** Get columns that are folded (is_folded === true) */
export function getFoldedColumns(schema: CategorySchema): SchemaField[] {
    return schema.filter(f => f.isFolded);
}

/**
 * Get columns eligible for initial column visibility randomization.
 * These are display columns that are NOT folded — folded columns have
 * their own reveal mechanic separate from column visibility.
 */
export function getVisibleCandidateColumns(schema: CategorySchema): SchemaField[] {
    return schema.filter(f => f.displayFormat !== 'HIDDEN' && !f.isFolded);
}

/** Look up a schema field by its attributeKey */
export function getFieldByKey(schema: CategorySchema, key: string): SchemaField | undefined {
    return schema.find(f => f.attributeKey === key);
}
