import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { Entity, GuessResult, GameStatus } from '../types';
import gameData from '../assets/data/gameData.json';

interface PeriodicTableViewProps {
    guesses: GuessResult[];
    targetEntity: Entity;
    gameStatus: GameStatus;
}

const FAMILY_BG: Record<string, string> = {
    'Alkali Metal':          '#fee2e2',
    'Alkaline Earth Metal':  '#ffedd5',
    'Transition Metal':      '#dbeafe',
    'Post-transition Metal': '#e2e8f0',
    'Metalloid':             '#ccfbf1',
    'Nonmetal':              '#fef9c3',
    'Halogen':               '#dcfce7',
    'Noble Gas':             '#f3e8ff',
    'Lanthanide':            '#fce7f3',
    'Actinide':              '#fecaca',
};

function getElementPosition(atomicNum: number, group: number, period: number): { row: number; col: number } {
    if (atomicNum >= 57 && atomicNum <= 71) return { row: 9,  col: atomicNum - 54 };
    if (atomicNum >= 89 && atomicNum <= 103) return { row: 10, col: atomicNum - 86 };
    return { row: period, col: group };
}

const CELL           = 44;
const NATURAL_WIDTH  = 18 * CELL;                  // 792 px
const NATURAL_HEIGHT = 7 * CELL + 12 + 2 * CELL;  // 408 px

interface ZoomState { scale: number; tx: number; ty: number; }

export function PeriodicTableView({ guesses, targetEntity, gameStatus }: PeriodicTableViewProps) {
    const elements = (gameData.categories as Record<string, Entity[]>).elements ?? [];

    const guessedIds    = new Set(guesses.map(g => g.guess.id));
    const targetVisible = gameStatus === 'SOLVED' || gameStatus === 'REVEALED';

    const containerRef = useRef<HTMLDivElement>(null);
    const [zoom, setZoom]                 = useState<ZoomState>({ scale: 1, tx: 0, ty: 0 });
    const [containerHeight, setContainerHeight] = useState(NATURAL_HEIGHT);
    const [fitScale, setFitScale]         = useState(1);

    const MIN_SCALE = 0.25;
    const MAX_SCALE = 4;

    const dragRef  = useRef<{ x: number; y: number; tx: number; ty: number; moved: boolean } | null>(null);
    const pinchRef = useRef<{ dist: number; midX: number; midY: number; scale: number; tx: number; ty: number } | null>(null);

    // Auto-fit on mount
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const s = Math.min(1, el.clientWidth / NATURAL_WIDTH);
        setFitScale(s);
        setZoom({ scale: s, tx: 0, ty: 0 });
        setContainerHeight(Math.ceil(NATURAL_HEIGHT * s));
    }, []);

    const zoomAt = useCallback((factor: number, ox: number, oy: number) => {
        setZoom(prev => {
            const s = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.scale * factor));
            const f = s / prev.scale;
            return { scale: s, tx: ox - (ox - prev.tx) * f, ty: oy - (oy - prev.ty) * f };
        });
    }, []);

    const resetZoom = () => setZoom({ scale: fitScale, tx: 0, ty: 0 });
    const zoomIn    = () => {
        const el = containerRef.current;
        if (el) zoomAt(1.5, el.clientWidth / 2, el.clientHeight / 2);
    };
    const zoomOut   = () => {
        const el = containerRef.current;
        if (el) zoomAt(1 / 1.5, el.clientWidth / 2, el.clientHeight / 2);
    };

    // Non-passive wheel + touchmove
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const rect = el.getBoundingClientRect();
            zoomAt(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX - rect.left, e.clientY - rect.top);
        };
        const blockTouchScroll = (e: TouchEvent) => { e.preventDefault(); };

        el.addEventListener('wheel', onWheel, { passive: false });
        el.addEventListener('touchmove', blockTouchScroll, { passive: false });
        return () => {
            el.removeEventListener('wheel', onWheel);
            el.removeEventListener('touchmove', blockTouchScroll);
        };
    }, [zoomAt]);

    // Mouse drag
    const onMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return;
        dragRef.current = { x: e.clientX, y: e.clientY, tx: zoom.tx, ty: zoom.ty, moved: false };
    };
    const onMouseMove = (e: React.MouseEvent) => {
        if (!dragRef.current) return;
        const dx = e.clientX - dragRef.current.x;
        const dy = e.clientY - dragRef.current.y;
        if (!dragRef.current.moved && Math.hypot(dx, dy) > 4) dragRef.current.moved = true;
        const { tx, ty } = dragRef.current;
        setZoom(prev => ({ ...prev, tx: tx + dx, ty: ty + dy }));
    };
    const onMouseUp    = () => { dragRef.current = null; };
    const onMouseLeave = () => { dragRef.current = null; };

    // Touch
    const onTouchStart = (e: React.TouchEvent) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        if (e.touches.length === 2) {
            const [t0, t1] = [e.touches[0], e.touches[1]];
            pinchRef.current = {
                dist: Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY),
                midX: (t0.clientX + t1.clientX) / 2 - rect.left,
                midY: (t0.clientY + t1.clientY) / 2 - rect.top,
                scale: zoom.scale, tx: zoom.tx, ty: zoom.ty,
            };
            dragRef.current = null;
        } else if (e.touches.length === 1) {
            dragRef.current  = { x: e.touches[0].clientX, y: e.touches[0].clientY, tx: zoom.tx, ty: zoom.ty, moved: false };
            pinchRef.current = null;
        }
    };
    const onTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length === 2 && pinchRef.current) {
            const p = pinchRef.current;
            const [t0, t1] = [e.touches[0], e.touches[1]];
            const newDist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
            const s = Math.min(MAX_SCALE, Math.max(MIN_SCALE, p.scale * (newDist / p.dist)));
            const f = s / p.scale;
            setZoom({ scale: s, tx: p.midX - (p.midX - p.tx) * f, ty: p.midY - (p.midY - p.ty) * f });
        } else if (e.touches.length === 1 && dragRef.current) {
            const dx = e.touches[0].clientX - dragRef.current.x;
            const dy = e.touches[0].clientY - dragRef.current.y;
            const { tx, ty } = dragRef.current;
            setZoom(prev => ({ ...prev, tx: tx + dx, ty: ty + dy }));
        }
    };
    const onTouchEnd = (e: React.TouchEvent) => {
        if (e.touches.length === 1 && pinchRef.current) {
            // One finger lifted from a pinch — start tracking remaining finger as drag
            dragRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, tx: zoom.tx, ty: zoom.ty, moved: false };
        } else if (e.touches.length === 0) {
            dragRef.current = null;
        }
        pinchRef.current = null;
    };

    const cells = elements.map(el => {
        const atomicNum = el.AtomicNumber as number;
        const group     = el.group        as number;
        const period    = el.period       as number;
        return { el, ...getElementPosition(atomicNum, group, period) };
    });

    function cellStyle(el: Entity): React.CSSProperties {
        if (targetVisible && el.id === targetEntity.id) {
            return { backgroundColor: '#22C55E', color: '#FAFAF9', border: '1px solid #18181B', width: CELL, height: CELL };
        }
        if (guessedIds.has(el.id)) {
            return { backgroundColor: '#18181B', color: '#FAFAF9', border: '1px solid #18181B', width: CELL, height: CELL };
        }
        const family = el.element_family as string | undefined;
        return {
            backgroundColor: family ? (FAMILY_BG[family] ?? '#FAFAF9') : '#FAFAF9',
            color: '#18181B',
            border: '1px solid #E2E8F0',
            width: CELL,
            height: CELL,
        };
    }

    const isZoomed = Math.abs(zoom.scale - fitScale) > 0.01 || zoom.tx !== 0 || zoom.ty !== 0;

    return (
        <div className="w-full select-none">
            {/* Zoom container */}
            <div
                ref={containerRef}
                style={{
                    position: 'relative',
                    overflow: 'hidden',
                    height: containerHeight,
                    cursor: 'grab',
                    touchAction: 'none',
                    border: '1px solid #E2E8F0',
                }}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseLeave}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                {/* Zoomable inner content */}
                <div
                    style={{
                        transform: `translate(${zoom.tx}px, ${zoom.ty}px) scale(${zoom.scale})`,
                        transformOrigin: '0 0',
                        willChange: 'transform',
                        display: 'inline-block',
                    }}
                >
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: `repeat(18, ${CELL}px)`,
                            gridTemplateRows: `repeat(7, ${CELL}px) 12px repeat(2, ${CELL}px)`,
                            gap: 0,
                        }}
                    >
                        {/* Lanthanide placeholder (period 6, group 3) */}
                        <div style={{ gridColumn: 3, gridRow: 6, width: CELL, height: CELL, backgroundColor: '#fce7f3', border: '1px dashed #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#9CA3AF', fontFamily: 'inherit' }}>
                            57–71
                        </div>

                        {/* Actinide placeholder (period 7, group 3) */}
                        <div style={{ gridColumn: 3, gridRow: 7, width: CELL, height: CELL, backgroundColor: '#fecaca', border: '1px dashed #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#9CA3AF', fontFamily: 'inherit' }}>
                            89–103
                        </div>

                        {/* Separator row (row 8) */}
                        <div style={{ gridColumn: '2 / span 16', gridRow: 8, display: 'flex', alignItems: 'center', paddingLeft: 4, fontSize: 8, color: '#9CA3AF', letterSpacing: '0.05em' }}>
                            LANTHANIDES &amp; ACTINIDES
                        </div>

                        {/* Element cells */}
                        {cells.map(({ el, row, col }) => (
                            <div
                                key={el.id}
                                style={{
                                    ...cellStyle(el),
                                    gridColumn: col,
                                    gridRow: row,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: 1,
                                    overflow: 'hidden',
                                    boxSizing: 'border-box',
                                }}
                                title={`${el.name} (${el.id}) — #${el.AtomicNumber}`}
                            >
                                <span style={{ fontSize: 7, lineHeight: 1, opacity: 0.7 }}>{el.AtomicNumber as number}</span>
                                <span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.1 }}>{el.id}</span>
                                <span style={{ fontSize: 6, lineHeight: 1, opacity: 0.8, textAlign: 'center', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{el.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Zoom controls — inside container, absolute */}
                <div
                    className="absolute bottom-2 right-2 flex items-center border border-graphite bg-[#FAFAF9] font-mono"
                    style={{ zIndex: 20 }}
                >
                    <button
                        onClick={zoomOut}
                        disabled={zoom.scale <= MIN_SCALE}
                        className="px-2 py-1 text-[13px] text-charcoal hover:bg-graphite disabled:opacity-30 disabled:cursor-default select-none"
                        aria-label="Zoom out"
                    >−</button>
                    <span className="px-1.5 text-[10px] text-charcoal/50 border-x border-graphite select-none min-w-[36px] text-center">
                        {Math.round(zoom.scale * 100)}%
                    </span>
                    <button
                        onClick={zoomIn}
                        disabled={zoom.scale >= MAX_SCALE}
                        className="px-2 py-1 text-[13px] text-charcoal hover:bg-graphite disabled:opacity-30 disabled:cursor-default select-none"
                        aria-label="Zoom in"
                    >+</button>
                    {isZoomed && (
                        <button
                            onClick={resetZoom}
                            className="px-2 py-1 text-[11px] text-charcoal hover:bg-graphite border-l border-graphite select-none"
                            aria-label="Reset zoom"
                        >↺</button>
                    )}
                </div>
            </div>

            {/* Legend — outside zoom container */}
            <div className="mt-3 px-1">
                <div className="flex flex-nowrap gap-3 overflow-x-auto pb-1 text-[10px] font-mono text-charcoal/70">
                    {Object.entries(FAMILY_BG).map(([family, color]) => (
                        <span key={family} className="flex items-center gap-1 shrink-0">
                            <span style={{ width: 10, height: 10, backgroundColor: color, border: '1px solid #E2E8F0', display: 'inline-block', flexShrink: 0 }} />
                            {family}
                        </span>
                    ))}
                    <span className="flex items-center gap-1 shrink-0">
                        <span style={{ width: 10, height: 10, backgroundColor: '#18181B', display: 'inline-block', flexShrink: 0 }} />
                        Guessed
                    </span>
                    {targetVisible && (
                        <span className="flex items-center gap-1 shrink-0">
                            <span style={{ width: 10, height: 10, backgroundColor: '#22C55E', display: 'inline-block', flexShrink: 0 }} />
                            Answer
                        </span>
                    )}
                </div>
                <p className="mt-1 text-[10px] font-mono text-charcoal/40 text-right">scroll/pinch to zoom · drag to pan</p>
            </div>
        </div>
    );
}
