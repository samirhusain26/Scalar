export type DataType = 'INT' | 'FLOAT' | 'STRING' | 'CURRENCY';

export type ProximityConfigType = 'PERCENT' | 'RANGE';

export interface ProximityConfig {
    type: ProximityConfigType;
    value: number;
    nearMultiplier: number;
}

export interface SchemaField {
    label: string;
    type: DataType;
    unitPrefix?: string;
    unitSuffix?: string;
    proximityConfig: ProximityConfig | null;
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
export type FeedbackStatus = 'EXACT' | 'HOT' | 'NEAR' | 'MISS';

export interface Feedback {
    direction: FeedbackDirection;
    status: FeedbackStatus;
    value: string | number;
}

export type GameStatus = 'PLAYING' | 'SOLVED' | 'REVEALED';

export type Rank = 'GOLD' | 'SILVER' | 'BRONZE';

export interface RankInfo {
    rank: Rank;
    label: string;
}
