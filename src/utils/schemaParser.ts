import type { CategorySchema, SchemaField } from '../types';

/** Get columns that should be displayed in the grid (displayFormat !== HIDDEN) */
export function getDisplayColumns(schema: CategorySchema): SchemaField[] {
    return schema.filter(f => f.displayFormat !== 'HIDDEN');
}
