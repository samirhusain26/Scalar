import { useMemo, useRef, useEffect, useState } from 'react';
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

// Colours
const FILL_GUESSED = '#18181B';   // charcoal
const FILL_TARGET  = '#22C55E';   // thermal-green
const FILL_DEFAULT = '#FAFAF9';   // paper-white
const STROKE       = '#E2E8F0';   // graphite
const STROKE_HIT   = '#FAFAF9';

interface PathInfo {
    d: string;
    fill: string;
    stroke: string;
    strokeW: number;
    name: string;
}

export function WorldMapView({ guesses, targetEntity, gameStatus }: WorldMapViewProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 450 });

    // Observe container width and resize the projection accordingly
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const observer = new ResizeObserver(entries => {
            const w = entries[0]?.contentRect.width ?? 800;
            setDimensions({ width: Math.max(w, 200), height: Math.round(Math.max(w, 200) * 0.56) });
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const guessedIds = useMemo(() => new Set(guesses.map(g => g.guess.id)), [guesses]);
    const targetVisible = gameStatus === 'SOLVED' || gameStatus === 'REVEALED';

    // Convert TopoJSON → GeoJSON features once
    const countries = useMemo<Feature<Geometry, GeoJsonProperties>[]>(() => {
        const topo = worldTopology as unknown as Topology;
        const col  = topo.objects['countries'] as GeometryCollection;
        return feature(topo, col).features as Feature<Geometry, GeoJsonProperties>[];
    }, []);

    // Build SVG path strings for current dimensions
    const paths = useMemo<PathInfo[]>(() => {
        const { width, height } = dimensions;
        const projection = geoNaturalEarth1()
            .scale(width / 6.3)
            .translate([width / 2, height / 2]);
        const pathGen = geoPath(projection);

        return countries.map((f: Feature<Geometry, GeoJsonProperties>) => {
            const m49  = String((f as { id?: string | number }).id ?? '').padStart(3, '0');
            const iso3 = M49_TO_ISO3[m49];
            const d    = pathGen(f as Parameters<typeof pathGen>[0]) ?? '';

            let fill   = FILL_DEFAULT;
            let stroke = STROKE;
            let strokeW = 0.5;

            if (iso3) {
                if (targetVisible && iso3 === targetEntity.id) {
                    fill    = FILL_TARGET;
                    stroke  = STROKE_HIT;
                    strokeW = 0.8;
                } else if (guessedIds.has(iso3)) {
                    fill    = FILL_GUESSED;
                    stroke  = STROKE_HIT;
                    strokeW = 0.8;
                }
            }

            const props = f.properties as Record<string, string> | null;
            return { d, fill, stroke, strokeW, name: props?.['name'] ?? '' };
        });
    }, [dimensions, countries, guessedIds, targetVisible, targetEntity.id]);

    return (
        <div ref={containerRef} className="w-full">
            <svg
                width={dimensions.width}
                height={dimensions.height}
                viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
                style={{ display: 'block', border: '1px solid #E2E8F0', backgroundColor: '#EFF6FF' }}
            >
                {paths.map((p, i) => (
                    <path
                        key={i}
                        d={p.d}
                        fill={p.fill}
                        stroke={p.stroke}
                        strokeWidth={p.strokeW}
                    >
                        {p.name && <title>{p.name}</title>}
                    </path>
                ))}
            </svg>

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
            </div>
        </div>
    );
}
