export type DataType = 'INT' | 'FLOAT' | 'STRING' | 'CURRENCY';

export type GameMode = 'EASIER' | 'EASY' | 'REGULAR' | 'HARD' | 'HARDEST';

export interface SchemaField {
    label: string;
    type: DataType;
    unitPrefix?: string;
    unitSuffix?: string;
    tolerance: number | null;
}

export type CategorySchema = Record<string, SchemaField>;

export interface Entity {
    id: string;
    name: string;
    [key: string]: string | number;
}

export interface GameData {
    schema: Record<string, CategorySchema>;
    categories: Record<string, Entity[]>;
}

export type FeedbackDirection = 'UP' | 'DOWN' | 'EQUAL' | 'NONE';
export type FeedbackStatus = 'CRITICAL' | 'THERMAL' | 'NULL';

export interface Feedback {
    direction: FeedbackDirection;
    status: FeedbackStatus;
    value: string | number;
}
