import { useEffect, useState, useCallback } from 'react';
import { Eye } from 'lucide-react';
import type { TutorialStep } from '../utils/tutorialConfig';
import { cn } from '../utils/cn';

const SPOT_PADDING = 8;
const TOOLTIP_W = 300;
const TOOLTIP_H_EST = 230;
const GAP = 14;

interface SpotRect {
    top: number;
    bottom: number;
    left: number;
    right: number;
    width: number;
    height: number;
}

function getSpotRect(rect: DOMRect): SpotRect {
    return {
        top: rect.top - SPOT_PADDING,
        bottom: rect.bottom + SPOT_PADDING,
        left: rect.left - SPOT_PADDING,
        right: rect.right + SPOT_PADDING,
        width: rect.width + SPOT_PADDING * 2,
        height: rect.height + SPOT_PADDING * 2,
    };
}

function computeTooltipStyle(
    spot: SpotRect,
    preferred: 'top' | 'bottom' | 'left' | 'right' = 'bottom',
): React.CSSProperties {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const tw = Math.min(TOOLTIP_W, vw - 32);

    const centerH = Math.max(16, Math.min(vw - tw - 16, (spot.left + spot.right) / 2 - tw / 2));
    const centerV = Math.max(16, Math.min(vh - TOOLTIP_H_EST - 16, (spot.top + spot.bottom) / 2 - TOOLTIP_H_EST / 2));

    const fits = {
        below: spot.bottom + GAP + TOOLTIP_H_EST + 16 < vh,
        above: spot.top - GAP - TOOLTIP_H_EST - 16 > 0,
        right: spot.right + GAP + tw + 16 < vw,
        left: spot.left - GAP - tw - 16 > 0,
    };

    let top: number;
    let left: number;

    if (preferred === 'bottom' && fits.below) { top = spot.bottom + GAP; left = centerH; }
    else if (preferred === 'top' && fits.above) { top = spot.top - GAP - TOOLTIP_H_EST; left = centerH; }
    else if (preferred === 'right' && fits.right) { top = centerV; left = spot.right + GAP; }
    else if (preferred === 'left' && fits.left) { top = centerV; left = spot.left - GAP - tw; }
    else if (fits.below) { top = spot.bottom + GAP; left = centerH; }
    else if (fits.above) { top = spot.top - GAP - TOOLTIP_H_EST; left = centerH; }
    else { top = Math.max(16, vh - TOOLTIP_H_EST - 80); left = vw / 2 - tw / 2; }

    return { top, left, width: tw };
}

interface TutorialOverlayProps {
    steps: TutorialStep[];
    currentStep: number;
    onNext: () => void;
    onBack: () => void;
    onSkip: () => void;
    onComplete: () => void;
}

export function TutorialOverlay({
    steps,
    currentStep,
    onNext,
    onBack,
    onSkip,
    onComplete,
}: TutorialOverlayProps) {
    const step = steps[currentStep];
    const isLast = currentStep === steps.length - 1;
    const isFirst = currentStep === 0;
    const isCentered = step.targetSelector === null;
    const isWaiting = !!step.waitForGuesses;

    const [spotRect, setSpotRect] = useState<SpotRect | null>(null);
    const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});

    const measureTarget = useCallback(() => {
        if (!step.targetSelector) return;
        // Use querySelectorAll + find the first visible instance.
        // App.tsx renders some elements twice (mobile + desktop layouts) —
        // the hidden copy returns a zero-width rect, so we skip it.
        const elements = document.querySelectorAll(`[data-tutorial="${step.targetSelector}"]`);
        const el = Array.from(elements).find(e => {
            const r = (e as HTMLElement).getBoundingClientRect();
            return r.width > 0 && r.height > 0;
        }) as HTMLElement | undefined;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const spot = getSpotRect(rect);
        setSpotRect(spot);
        setTooltipStyle(computeTooltipStyle(spot, step.tooltipPosition));
    }, [step.targetSelector, step.tooltipPosition]);

    // On step change: scroll to target, then measure after scroll settles.
    // For centered steps, defer-clear old spotlight to avoid synchronous setState-in-effect.
    useEffect(() => {
        if (!step.targetSelector) {
            const t = setTimeout(() => setSpotRect(null), 0);
            return () => clearTimeout(t);
        }

        const elements = document.querySelectorAll(`[data-tutorial="${step.targetSelector}"]`);
        const el = Array.from(elements).find(e => {
            const r = (e as HTMLElement).getBoundingClientRect();
            return r.width > 0 && r.height > 0;
        }) as HTMLElement | undefined;
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        const timer = setTimeout(measureTarget, 350);
        return () => clearTimeout(timer);
    }, [currentStep]); // eslint-disable-line react-hooks/exhaustive-deps

    // Re-measure on window resize
    useEffect(() => {
        window.addEventListener('resize', measureTarget);
        return () => window.removeEventListener('resize', measureTarget);
    }, [measureTarget]);

    // Apply / remove the cell highlight class
    useEffect(() => {
        if (!step.highlightCell) return;
        const cell = document.querySelector(`[data-tutorial-cell="${step.highlightCell}"]`);
        cell?.classList.add('tutorial-cell-highlight');
        return () => cell?.classList.remove('tutorial-cell-highlight');
    }, [step.highlightCell, currentStep]);

    const handleNext = () => (isLast ? onComplete() : onNext());

    // ── Shared tooltip inner content (JSX element, not a nested component) ──
    const cardInner = (
        <>
            {/* Step counter */}
            <div className="text-[10px] font-mono uppercase tracking-widest text-charcoal/40">
                Step {currentStep + 1}&thinsp;/&thinsp;{steps.length}
            </div>

            {/* Title */}
            <h3 className="font-serif-display font-light text-lg leading-tight text-charcoal">
                {step.title}
            </h3>

            {/* Eye icon demo (shown on the hints step) */}
            {step.showEyeIcon && (
                <div className="flex items-center gap-3 bg-charcoal/5 border border-charcoal/20 px-3 py-2.5">
                    <div className="w-8 h-8 border border-charcoal flex items-center justify-center shrink-0">
                        <Eye size={16} />
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-charcoal/60 leading-tight">
                        Eye icon appears on<br />every clue cell
                    </span>
                </div>
            )}

            {/* Body */}
            <p className="font-mono text-sm text-charcoal/80 leading-relaxed">
                {step.body}
            </p>

            {/* Action hint shown when step waits for user input */}
            {isWaiting && (
                <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-charcoal/50 border-t border-graphite pt-2">
                    <span className="text-charcoal/30">↑</span>
                    <span>Type a country name above to continue</span>
                </div>
            )}

            {/* Footer: Skip · Back · Next */}
            <div className="flex items-center justify-between border-t border-graphite pt-2">
                {!step.skipHidden ? (
                    <button
                        onClick={onSkip}
                        className="text-[10px] font-mono uppercase tracking-wider text-charcoal/40 underline underline-offset-2 hover:text-charcoal/70 transition-colors"
                    >
                        Skip Tutorial
                    </button>
                ) : (
                    <div />
                )}

                <div className="flex items-center gap-2">
                    {!isFirst && (
                        <button
                            onClick={onBack}
                            className="px-3 py-1.5 border border-charcoal text-[11px] font-mono font-bold uppercase tracking-wider text-charcoal hover:bg-charcoal hover:text-paper-white transition-colors"
                        >
                            ← Back
                        </button>
                    )}
                    {!isWaiting && (
                        <button
                            onClick={handleNext}
                            className="px-4 py-1.5 bg-charcoal text-paper-white text-[11px] font-mono font-bold uppercase tracking-wider hover:bg-charcoal/80 transition-colors"
                        >
                            {step.nextLabel || 'Next →'}
                        </button>
                    )}
                </div>
            </div>
        </>
    );

    const cardBaseClass = 'animate-tutorial-tooltip border border-charcoal bg-paper-white shadow-hard p-4 flex flex-col gap-3';

    // ── Centered mode (steps without a spotlight target) ────────────────────
    if (isCentered) {
        return (
            <div className="fixed inset-0 z-[9000] flex items-center justify-center p-6">
                <div className="absolute inset-0 bg-charcoal/65 pointer-events-auto" />
                <div key={currentStep} className={cn('relative z-[9001] w-full max-w-sm', cardBaseClass)}>
                    {cardInner}
                </div>
            </div>
        );
    }

    // ── Spotlight mode — waiting for measurement ─────────────────────────────
    if (!spotRect) {
        return (
            <div className="fixed inset-0 z-[9000] pointer-events-none">
                <div className="absolute inset-0 bg-charcoal/50 pointer-events-auto" />
            </div>
        );
    }

    // ── Spotlight mode — active ──────────────────────────────────────────────
    const { top: sTop, bottom: sBottom, left: sLeft, right: sRight, width: sWidth, height: sHeight } = spotRect;

    return (
        // pointer-events-none on container so the spotlight hole is passthrough
        <div className="fixed inset-0 z-[9000] pointer-events-none">

            {/* 4-panel spotlight (pointer-events-auto so they block background clicks) */}
            <div className="absolute inset-x-0 top-0 bg-charcoal/65 pointer-events-auto"
                style={{ height: Math.max(0, sTop) }} />
            <div className="absolute inset-x-0 bottom-0 bg-charcoal/65 pointer-events-auto"
                style={{ top: Math.max(0, sBottom) }} />
            <div className="absolute bg-charcoal/65 pointer-events-auto"
                style={{ top: sTop, height: sHeight, left: 0, width: Math.max(0, sLeft) }} />
            <div className="absolute bg-charcoal/65 pointer-events-auto"
                style={{ top: sTop, height: sHeight, left: Math.max(0, sRight), right: 0 }} />

            {/* Highlight ring */}
            <div className="absolute pointer-events-none"
                style={{ top: sTop, left: sLeft, width: sWidth, height: sHeight, outline: '2px solid #18181B' }} />

            {/* Positioned tooltip */}
            <div
                key={currentStep}
                className={cn('fixed z-[9001] pointer-events-auto', cardBaseClass)}
                style={tooltipStyle}
            >
                {cardInner}
            </div>
        </div>
    );
}
