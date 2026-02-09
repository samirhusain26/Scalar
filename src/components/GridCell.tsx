import type { Feedback } from '../types';
import { cn } from '../utils/cn';

interface GridCellProps {
    value?: string | number;
    feedback?: Feedback;
    isEmpty?: boolean;
    isHidden?: boolean;
    className?: string;
}

export function GridCell({ value, feedback, isEmpty, isHidden, className }: GridCellProps) {
    // Hidden state: Hatched pattern cell (column not yet revealed)
    if (isHidden) {
        return (
            <div className={cn(
                "w-full h-full border border-charcoal/15 bg-hidden-pattern",
                className
            )} />
        );
    }

    // Empty state: Transparent box with dashed charcoal border
    if (isEmpty) {
        return (
            <div className={cn(
                "w-full h-full border border-dashed border-charcoal/50 flex items-center justify-center",
                className
            )} />
        );
    }

    const { status, direction } = feedback || {};

    // Determine background and text colors based on status
    const statusClasses = cn(
        "relative flex items-center justify-center w-full h-full px-1 py-0.5 font-mono text-sm border border-charcoal",
        status === 'EXACT' && "bg-green-600 text-white border-green-700",
        status === 'HOT' && "bg-yellow-200 text-charcoal",
        status === 'NEAR' && "bg-amber-100 text-charcoal border-dashed border-amber-400",
        (status === 'MISS' || !status) && "bg-gray-200 text-charcoal",

        // Directional Borders
        direction === 'UP' && "!border-t-[4px] !border-t-black",
        direction === 'DOWN' && "!border-b-[4px] !border-b-black",

        className
    );

    return (
        <div className={statusClasses}>
            <span className="truncate z-10">{value}</span>
        </div>
    );
}
