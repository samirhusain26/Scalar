import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { Feature, Geometry, GeoJsonProperties } from 'geojson';
import type { Entity, GuessResult, GameStatus } from '../types';
import { M49_TO_ISO3 } from '../utils/countryCodeMap';
import worldTopology from '../assets/data/countries-110m.json';

interface WorldMapViewProps {
    guesses: GuessResult[];
    targetEntity: Entity;
    gameStatus: GameStatus;
}

const FILL_GUESSED = '#18181B';
const FILL_TARGET  = '#22C55E';
const FILL_DEFAULT = '#FAFAF9';
const STROKE       = '#E2E8F0';
const STROKE_HIT   = '#FAFAF9';

interface PathInfo {
    d: string;
    fill: string;
    stroke: string;
    strokeW: number;
    name: string;
}

interface TooltipState { name: string; x: number; y: number; }
interface ZoomState    { scale: number; tx: number; ty: number; }

export function WorldMapView({ guesses, targetEntity, gameStatus }: WorldMapViewProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef       = useRef<SVGSVGElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 450 });

    // Tooltip
    const [hoverTooltip,  setHoverTooltip]  = useState<TooltipState | null>(null);
    const [pinnedTooltip, setPinnedTooltip] = useState<TooltipState | null>(null);
    const shownTooltip = pinnedTooltip ?? hoverTooltip;

    // Zoom / pan
    const [zoom, setZoom] = useState<ZoomState>({ scale: 1, tx: 0, ty: 0 });
    const dragRef  = useRef<{ x: number; y: number; tx: number; ty: number; moved: boolean } | null>(null);
    const pinchRef = useRef<{ dist: number; midX: number; midY: number; scale: number; tx: number; ty: number } | null>(null);
    // Track whether the last pointer-down resulted in a drag, so we can suppress click
    const lastMoveRef = useRef(false);

    const MIN_SCALE = 1;
    const MAX_SCALE = 8;

    const zoomAt = useCallback((factor: number, ox: number, oy: number) => {
        setZoom(prev => {
            const s = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.scale * factor));
            const f = s / prev.scale;
            return { scale: s, tx: ox - (ox - prev.tx) * f, ty: oy - (oy - prev.ty) * f };
        });
    }, []);

    const resetZoom = () => setZoom({ scale: 1, tx: 0, ty: 0 });
    const zoomIn    = () => {
        const el = containerRef.current;
        if (el) zoomAt(1.5, el.clientWidth / 2, el.clientHeight / 2);
    };
    const zoomOut   = () => {
        const el = containerRef.current;
        if (el) zoomAt(1 / 1.5, el.clientWidth / 2, el.clientHeight / 2);
    };

    // ── ResizeObserver ──────────────────────────────────────────────────────────
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const observer = new ResizeObserver(entries => {
            const w = entries[0]?.contentRect.width ?? 800;
            const ratio = w < 500 ? 0.72 : 0.56;
            setDimensions({ width: Math.max(w, 200), height: Math.round(Math.max(w, 200) * ratio) });
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    // ── Non-passive wheel + touchmove on SVG ────────────────────────────────────
    useEffect(() => {
        const el = svgRef.current;
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

    // ── Memoised geo data ───────────────────────────────────────────────────────
    const guessedIds    = useMemo(() => new Set(guesses.map(g => g.guess.id)), [guesses]);
    const targetVisible = gameStatus === 'SOLVED' || gameStatus === 'REVEALED';

    const countries = useMemo<Feature<Geometry, GeoJsonProperties>[]>(() => {
        const topo = worldTopology as unknown as Topology;
        const col  = topo.objects['countries'] as GeometryCollection;
        return feature(topo, col).features as Feature<Geometry, GeoJsonProperties>[];
    }, []);

    const paths = useMemo<PathInfo[]>(() => {
        const { width, height } = dimensions;
        const projection = geoNaturalEarth1()
            .scale(width / 6.3)
            .translate([width / 2, height / 2]);
        const pathGen = geoPath(projection);

        return countries.map(f => {
            const m49  = String((f as { id?: string | number }).id ?? '').padStart(3, '0');
            const iso3 = M49_TO_ISO3[m49];
            const d    = pathGen(f as Parameters<typeof pathGen>[0]) ?? '';

            let fill   = FILL_DEFAULT;
            let stroke = STROKE;
            let strokeW = 0.5;

            if (iso3) {
                if (targetVisible && iso3 === targetEntity.id) {
                    fill = FILL_TARGET; stroke = STROKE_HIT; strokeW = 0.8;
                } else if (guessedIds.has(iso3)) {
                    fill = FILL_GUESSED; stroke = STROKE_HIT; strokeW = 0.8;
                }
            }

            const props = f.properties as Record<string, string> | null;
            return { d, fill, stroke, strokeW, name: props?.['name'] ?? '' };
        });
    }, [dimensions, countries, guessedIds, targetVisible, targetEntity.id]);

    // ── SVG mouse handlers ──────────────────────────────────────────────────────
    const onSvgMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
        if (e.button !== 0) return;
        lastMoveRef.current = false;
        dragRef.current = { x: e.clientX, y: e.clientY, tx: zoom.tx, ty: zoom.ty, moved: false };
    };

    const onSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        // Handle drag pan
        if (dragRef.current) {
            const dx = e.clientX - dragRef.current.x;
            const dy = e.clientY - dragRef.current.y;
            if (!dragRef.current.moved && Math.hypot(dx, dy) > 4) {
                dragRef.current.moved = true;
                lastMoveRef.current  = true;
            }
            if (dragRef.current.moved) {
                const { tx, ty } = dragRef.current;
                setZoom(prev => ({ ...prev, tx: tx + dx, ty: ty + dy }));
                setHoverTooltip(null);
                return;
            }
        }

        // Hover tooltip (path under cursor)
        const target = e.target as SVGElement;
        const name   = target.getAttribute?.('data-name') ?? '';
        if (name && !pinnedTooltip) {
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) setHoverTooltip({ name, x: e.clientX - rect.left, y: e.clientY - rect.top });
        } else if (!name && !pinnedTooltip) {
            setHoverTooltip(null);
        }
    };

    const onSvgMouseUp    = () => { dragRef.current = null; };
    const onSvgMouseLeave = () => { dragRef.current = null; setHoverTooltip(null); };

    const onSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
        const target = e.target as SVGElement;
        const name   = target.getAttribute?.('data-name') ?? '';

        if (lastMoveRef.current) {
            // Was a drag — don't treat as click
            lastMoveRef.current = false;
            return;
        }

        if (!name) {
            // Clicked ocean → dismiss pinned tooltip
            setPinnedTooltip(null);
            return;
        }

        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        setPinnedTooltip(prev =>
            prev?.name === name ? null : { name, x: e.clientX - rect.left, y: e.clientY - rect.top }
        );
    };

    // ── Touch handlers ──────────────────────────────────────────────────────────
    const onTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
        const rect = svgRef.current?.getBoundingClientRect();
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
            lastMoveRef.current = false;
            dragRef.current  = { x: e.touches[0].clientX, y: e.touches[0].clientY, tx: zoom.tx, ty: zoom.ty, moved: false };
            pinchRef.current = null;
        }
    };

    const onTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
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
            if (!dragRef.current.moved && Math.hypot(dx, dy) > 4) {
                dragRef.current.moved = true;
                lastMoveRef.current  = true;
            }
            const { tx, ty } = dragRef.current;
            setZoom(prev => ({ ...prev, tx: tx + dx, ty: ty + dy }));
        }
    };

    const onTouchEnd = (e: React.TouchEvent<SVGSVGElement>) => {
        if (e.touches.length === 1 && pinchRef.current) {
            // One finger lifted from a pinch — start tracking remaining finger as drag
            lastMoveRef.current = false;
            dragRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, tx: zoom.tx, ty: zoom.ty, moved: false };
        } else if (e.touches.length === 0) {
            dragRef.current = null;
        }
        pinchRef.current = null;
    };

    const isZoomed = zoom.scale !== 1 || zoom.tx !== 0 || zoom.ty !== 0;

    return (
        <div ref={containerRef} className="w-full select-none" style={{ position: 'relative' }}>
            <svg
                ref={svgRef}
                width={dimensions.width}
                height={dimensions.height}
                viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
                style={{ display: 'block', border: '1px solid #E2E8F0', backgroundColor: '#EFF6FF', cursor: 'grab', touchAction: 'none' }}
                onMouseDown={onSvgMouseDown}
                onMouseMove={onSvgMouseMove}
                onMouseUp={onSvgMouseUp}
                onMouseLeave={onSvgMouseLeave}
                onClick={onSvgClick}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                <g transform={`translate(${zoom.tx},${zoom.ty}) scale(${zoom.scale})`}>
                    {paths.map((p, i) => (
                        <path
                            key={i}
                            d={p.d}
                            fill={p.fill}
                            stroke={p.stroke}
                            strokeWidth={p.strokeW}
                            data-name={p.name || undefined}
                        />
                    ))}
                </g>
            </svg>

            {/* Country name tooltip */}
            {shownTooltip && (
                <div
                    style={{
                        position: 'absolute',
                        left: Math.min(shownTooltip.x + 12, dimensions.width - 160),
                        top: Math.max(shownTooltip.y - 30, 4),
                        pointerEvents: 'none',
                        zIndex: 10,
                    }}
                    className="bg-charcoal text-[#FAFAF9] font-mono text-[11px] px-2 py-1 border border-graphite whitespace-nowrap"
                >
                    {shownTooltip.name}
                </div>
            )}

            {/* Zoom controls */}
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

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-2 text-[10px] font-mono text-charcoal/70">
                <span className="flex items-center gap-1">
                    <span style={{ width: 12, height: 12, backgroundColor: FILL_GUESSED, display: 'inline-block', border: '1px solid #E2E8F0', flexShrink: 0 }} />
                    Guessed
                </span>
                {targetVisible && (
                    <span className="flex items-center gap-1">
                        <span style={{ width: 12, height: 12, backgroundColor: FILL_TARGET, display: 'inline-block', border: '1px solid #E2E8F0', flexShrink: 0 }} />
                        Answer
                    </span>
                )}
                <span className="flex items-center gap-1">
                    <span style={{ width: 12, height: 12, backgroundColor: FILL_DEFAULT, display: 'inline-block', border: '1px solid #E2E8F0', flexShrink: 0 }} />
                    Not guessed
                </span>
                <span className="opacity-40 ml-auto">scroll/pinch to zoom · drag to pan</span>
            </div>
        </div>
    );
}
