import type { CategorySchema, Feedback, Entity } from '../types';
import { formatNumber } from '../utils/formatters';
import { GridCell } from './GridCell';
import { cn } from '../utils/cn';

interface GridRowProps {
    guess?: Entity;
    feedback?: Record<string, Feedback>;
    schema: CategorySchema;
    displayKeys: string[];
    columnVisibility: Record<string, boolean>;
    className?: string;
}

export function GridRow({ guess, feedback, schema, displayKeys, columnVisibility, className }: GridRowProps) {
    const renderCellContent = (key: string) => {
        if (!guess) return { value: undefined, feedback: undefined };

        let value = guess[key];
        const fieldDef = schema[key];
        const itemFeedback = key === 'name' ? undefined : feedback?.[key]; // Name typically has no feedback or handled differently

        // Format value
        if (fieldDef) {
            if (typeof value === 'number') {
                if (fieldDef.type === 'CURRENCY' || fieldDef.type === 'INT' || fieldDef.type === 'FLOAT') {
                    value = `${fieldDef.unitPrefix || ''}${formatNumber(value)}${fieldDef.unitSuffix || ''}`;
                } else if (fieldDef.unitSuffix) {
                    value = `${value}${fieldDef.unitSuffix}`;
                }
            }
        }

        return { value, feedback: itemFeedback };
    };

    // If no guess, we render empty cells for structure
    if (!guess) {
        return (
            <div className={cn("flex w-full space-x-2 mb-1 h-9", className)}>
                {/* Name Column */}
                <div className="flex-[1.5] min-w-0">
                    <GridCell isEmpty />
                </div>
                {/* Data Columns */}
                {displayKeys.map((key) => {
                    const isVisible = columnVisibility[key];
                    return (
                        <div key={key} className={isVisible ? "flex-1 min-w-0" : "flex-none w-8 min-w-0"}>
                            <GridCell isEmpty={isVisible} isHidden={!isVisible} />
                        </div>
                    );
                })}
            </div>
        );
    }

    // Render Filled Row
    return (
        <div className={cn("flex w-full space-x-2 mb-2 h-10", className)}>
            {/* Name Column */}
            <div className="flex-[1.5] min-w-0">
                <GridCell
                    value={guess.name}
                    feedback={feedback?.['name']}
                    className="font-bold"
                />
            </div>
            {displayKeys.map((key) => {
                const isVisible = columnVisibility[key];

                if (!isVisible) {
                    return (
                        <div key={key} className="flex-none w-8 min-w-0">
                            <GridCell isHidden />
                        </div>
                    );
                }

                const { value, feedback: cellFeedback } = renderCellContent(key);
                return (
                    <div key={key} className="flex-1 min-w-0">
                        <GridCell
                            value={value}
                            feedback={cellFeedback}
                        />
                    </div>
                );
            })}
        </div>
    );
}
