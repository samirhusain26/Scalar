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
    | 'LIST'
    | 'ALPHA_POSITION';

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
    /** For SET_INTERSECTION: individual items from the guess with match status */
    matchedItems?: { text: string; isMatch: boolean }[];
}

// --- Game Status ---
export type GameStatus = 'PLAYING' | 'SOLVED' | 'REVEALED';

// --- Game Mode ---
export type GameMode = 'daily' | 'freeplay';

// --- Guess Result (exported so dailyUtils and components can reference it) ---
export interface GuessResult {
    guess: Entity;
    feedback: Record<string, Feedback>;
}

// --- Game Slot (state for one mode + category combination) ---
export interface GameSlot {
    targetEntity: Entity;
    guesses: GuessResult[];
    gameStatus: GameStatus;
    moves: number;
    credits: number;
    majorHintAttributes: string[];
    /** YYYY-MM-DD; only set on daily slots, used to detect day rollovers. */
    dailyDate?: string;
}

// --- Daily Meta (streak tracking, keyed by category) ---
export interface DailyMeta {
    lastCompletedDate: string | null; // YYYY-MM-DD
    currentStreak: number;
    maxStreak: number;
}

