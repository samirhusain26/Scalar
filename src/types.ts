// --- Data Types ---
export type DataType = 'INT' | 'FLOAT' | 'STRING' | 'CURRENCY' | 'BOOLEAN' | 'LIST';

// --- Logic Types (how feedback is computed) ---
export type LogicType =
    | 'EXACT_MATCH'
    | 'CATEGORY_MATCH'
    | 'HIGHER_LOWER'
    | 'GEO_DISTANCE'
    | 'SET_INTERSECTION'
    | 'TARGET'
    | 'NONE';

// --- Display Format (how the cell renders its value) ---
export type DisplayFormat =
    | 'HIDDEN'
    | 'TEXT'
    | 'DISTANCE'
    | 'PERCENTAGE_DIFF'
    | 'RELATIVE_PERCENTAGE'
    | 'NUMBER'
    | 'CURRENCY'
    | 'LIST';

// --- UI Color Logic (how the cell background is determined) ---
export type UIColorLogic =
    | 'DISTANCE_GRADIENT'
    | 'CATEGORY_MATCH'
    | 'STANDARD'
    | 'NONE';

// --- Schema Field (driven by schema_config CSV) ---
export interface SchemaField {
    attributeKey: string;
    displayLabel: string;
    dataType: DataType;
    logicType: LogicType;
    displayFormat: DisplayFormat;
    isFolded: boolean;
    isVirtual: boolean;
    linkedCategoryCol?: string;
    uiColorLogic?: UIColorLogic;
}

// Ordered array (preserves CSV column order)
export type CategorySchema = SchemaField[];

// --- Entity (a single data row) ---
export interface Entity {
    id: string;
    name: string;
    [key: string]: string | number | boolean;
}

// --- Game Data (loaded from gameData.json) ---
export interface GameData {
    schemaConfig: Record<string, CategorySchema>;
    categories: Record<string, Entity[]>;
}

// --- Feedback ---
export type FeedbackDirection = 'UP' | 'DOWN' | 'EQUAL' | 'NONE';
export type FeedbackStatus = 'EXACT' | 'HOT' | 'NEAR' | 'MISS';

export interface Feedback {
    direction: FeedbackDirection;
    status: FeedbackStatus;
    value: string | number | boolean;
    displayValue?: string;
    distanceKm?: number;
    percentageDiff?: number;
    categoryMatch?: boolean;
}

// --- Game Status ---
export type GameStatus = 'PLAYING' | 'SOLVED' | 'REVEALED';

// --- Scoring / Ranks ---
export type Rank = 'GOLD' | 'SILVER' | 'BRONZE';

export interface RankInfo {
    rank: Rank;
    label: string;
}
