import type { Feedback, DisplayFormat, UIColorLogic } from '../types';
import { cn } from '../utils/cn';

interface GridCellProps {
    value?: string | number | boolean;
    feedback?: Feedback;
    isEmpty?: boolean;
    isHidden?: boolean;
    isFolded?: boolean;
    displayFormat?: DisplayFormat;
    uiColorLogic?: UIColorLogic;
    className?: string;
}

export function getDistanceGradientClass(distanceKm: number | undefined): string {
    if (distanceKm === undefined) return 'bg-gray-200 text-charcoal';
    if (distanceKm === 0) return 'bg-thermal-gold text-charcoal';
    if (distanceKm < 1000) return 'bg-geo-hot';
    if (distanceKm < 3000) return 'bg-geo-warm';
    if (distanceKm < 5000) return 'bg-geo-cool';
    return 'bg-geo-cold';
}

export function getCategoryMatchClass(categoryMatch: boolean | undefined): string {
    if (categoryMatch === true) return 'bg-cat-match';
    return 'bg-cat-miss';
}

export function getStandardStatusClass(status: string | undefined): string {
    if (status === 'EXACT') return 'bg-thermal-gold text-charcoal border-thermal-gold';
    if (status === 'HOT') return 'bg-thermal-orange text-white';
    if (status === 'NEAR') return 'bg-amber-100 text-charcoal border-dashed border-amber-400';
    return 'bg-gray-200 text-charcoal';
}

export function GridCell({
    value,
    feedback,
    isEmpty,
    isHidden,
    isFolded,
    uiColorLogic,
    className,
}: GridCellProps) {
    // Hidden state: Hatched pattern (column not yet revealed)
    if (isHidden) {
        return (
            <div className={cn(
                "w-full h-full border border-charcoal/15 bg-hidden-pattern",
                className
            )} />
        );
    }

    // Folded state: locked pattern (attribute not yet purchased)
    if (isFolded) {
        return (
            <div className={cn(
                "w-full h-full border border-charcoal/15 bg-folded-pattern",
                className
            )} />
        );
    }

    // Empty state
    if (isEmpty) {
        return (
            <div className={cn(
                "w-full h-full border border-dashed border-charcoal/50 flex items-center justify-center",
                className
            )} />
        );
    }

    const { status, direction } = feedback || {};

    // Determine background color based on uiColorLogic
    let colorClass: string;

    if (uiColorLogic === 'DISTANCE_GRADIENT') {
        colorClass = feedback?.status === 'EXACT'
            ? 'bg-thermal-gold text-charcoal'
            : getDistanceGradientClass(feedback?.distanceKm);
    } else if (uiColorLogic === 'CATEGORY_MATCH' || feedback?.categoryMatch !== undefined) {
        colorClass = feedback?.status === 'EXACT'
            ? 'bg-thermal-gold text-charcoal border-thermal-gold'
            : getCategoryMatchClass(feedback?.categoryMatch);
    } else {
        colorClass = getStandardStatusClass(status);
    }

    // Determine display value
    const displayValue = feedback?.displayValue ?? value;

    const cellClasses = cn(
        "relative flex items-center justify-center w-full h-full px-1 py-0.5 font-mono text-sm border border-graphite",
        colorClass,
        // Directional borders (only for HIGHER_LOWER / numeric)
        direction === 'UP' && "!border-t-[4px] !border-t-black",
        direction === 'DOWN' && "!border-b-[4px] !border-b-black",
        className
    );

    return (
        <div className={cellClasses}>
            <span className="truncate z-10">{String(displayValue ?? '')}</span>
        </div>
    );
}
