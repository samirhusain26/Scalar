import type { Feedback } from '../types';
import { cn } from '../utils/cn';

interface GridCellProps {
    value?: string | number;
    feedback?: Feedback;
    isEmpty?: boolean;
    className?: string;
}



export function GridCell({ value, feedback, isEmpty, className }: GridCellProps) {
    // Empty state: Transparent box with dashed charcoal border
    if (isEmpty) {
        return (
            <div className={cn(
                "w-full h-full border-2 border-dashed border-charcoal/50 flex items-center justify-center",
                className
            )} />
        );
    }

    const { status, direction } = feedback || {};

    // DEBUG LOG
    if (value && typeof value !== 'string') { // Log numeric cells mainly
        // console.log('GridCell', { value, status, direction });
    }
    if (direction) {
        console.log('GridCell Direction:', { value, direction, status });
    }

    // Determine background and text colors based on status
    const statusClasses = cn(
        "relative flex items-center justify-center w-full h-full px-1 py-0.5 font-mono text-sm border border-charcoal dark:border-paper-white",
        status === 'CRITICAL' && "bg-green-600 text-white border-green-700", // Green for correct
        status === 'THERMAL' && "bg-yellow-200 text-charcoal", // Close
        (status === 'NULL' || !status) && "bg-gray-200 text-charcoal", // Miss/Default (Light Grey)

        // Directional Borders (Thick Borders)
        // UP: Target > Guess -> Thick Top Border (Black)
        direction === 'UP' && "!border-t-[8px] !border-t-black",

        // DOWN: Target < Guess -> Thick Bottom Border (Black)
        direction === 'DOWN' && "!border-b-[8px] !border-b-black",

        className
    );

    return (
        <div className={statusClasses}>
            <span className="truncate z-10">{value}</span>
        </div>
    );
}
