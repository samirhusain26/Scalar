import type { SchemaField, Feedback, Entity } from '../types';
import { formatNumber } from '../utils/formatters';
import { GridCell } from './GridCell';
import { cn } from '../utils/cn';

interface GridRowProps {
    guess?: Entity;
    feedback?: Record<string, Feedback>;
    displayFields: SchemaField[];
    columnVisibility: Record<string, boolean>;
    revealedFoldedAttributes: string[];
    className?: string;
}

export function GridRow({
    guess,
    feedback,
    displayFields,
    columnVisibility,
    revealedFoldedAttributes,
    className,
}: GridRowProps) {
    // Empty row (placeholder)
    if (!guess) {
        return (
            <div className={cn("flex w-full space-x-2 mb-1 h-9", className)}>
                <div className="flex-[1.5] min-w-0">
                    <GridCell isEmpty />
                </div>
                {displayFields.map((field) => {
                    const isVisible = columnVisibility[field.attributeKey] ?? false;
                    const isFolded = field.isFolded && !revealedFoldedAttributes.includes(field.attributeKey);

                    if (!isVisible && !field.isFolded) {
                        return (
                            <div key={field.attributeKey} className="flex-none w-8 min-w-0">
                                <GridCell isHidden />
                            </div>
                        );
                    }

                    return (
                        <div key={field.attributeKey} className="flex-1 min-w-0">
                            <GridCell isEmpty={!isFolded} isFolded={isFolded} />
                        </div>
                    );
                })}
            </div>
        );
    }

    // Filled row
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

            {displayFields.map((field) => {
                const key = field.attributeKey;
                const isVisible = columnVisibility[key] ?? false;
                const isFolded = field.isFolded && !revealedFoldedAttributes.includes(key);

                // Hidden column (not yet revealed via +1 stroke)
                if (!isVisible && !field.isFolded) {
                    return (
                        <div key={key} className="flex-none w-8 min-w-0">
                            <GridCell isHidden />
                        </div>
                    );
                }

                // Folded column (not yet purchased via +2 strokes)
                if (isFolded) {
                    return (
                        <div key={key} className="flex-1 min-w-0">
                            <GridCell isFolded />
                        </div>
                    );
                }

                const cellFeedback = feedback?.[key];

                // For PERCENTAGE_DIFF and DISTANCE, the displayValue in feedback
                // already contains the formatted string. For other formats, format the raw value.
                let displayValue: string | number | boolean | undefined = cellFeedback?.displayValue;

                if (displayValue === undefined || displayValue === '') {
                    const rawValue = guess[key];
                    if (typeof rawValue === 'number' && (field.dataType === 'INT' || field.dataType === 'FLOAT' || field.dataType === 'CURRENCY')) {
                        displayValue = formatNumber(rawValue);
                    } else if (typeof rawValue === 'boolean') {
                        displayValue = rawValue ? 'Yes' : 'No';
                    } else {
                        displayValue = rawValue;
                    }
                }

                return (
                    <div key={key} className="flex-1 min-w-0">
                        <GridCell
                            value={displayValue}
                            feedback={cellFeedback}
                            uiColorLogic={field.uiColorLogic}
                            displayFormat={field.displayFormat}
                        />
                    </div>
                );
            })}
        </div>
    );
}
