import { useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { PathOptions } from 'leaflet';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { Feature, GeoJsonProperties, Geometry } from 'geojson';
import type { Entity, GuessResult, GameStatus } from '../types';
import { M49_TO_ISO3 } from '../utils/countryCodeMap';
import worldAtlas50m from 'world-atlas/countries-50m.json';

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

// Convert once at module level — no need to redo per render
const countriesGeoJson = (() => {
    const topo = worldAtlas50m as unknown as Topology;
    const col  = topo.objects['countries'] as GeometryCollection;
    return feature(topo, col);
})();

export function WorldMapView({ guesses, targetEntity, gameStatus }: WorldMapViewProps) {
    const guessedIds    = useMemo(() => new Set(guesses.map(g => g.guess.id)), [guesses]);
    const targetVisible = gameStatus === 'SOLVED' || gameStatus === 'REVEALED';

    // Changing the key forces GeoJSON layer to remount and re-apply styles
    const geoKey = `${guesses.length}-${gameStatus}`;

    const styleFeature = (f?: Feature<Geometry, GeoJsonProperties>): PathOptions => {
        if (!f) return {};
        const m49  = String((f as unknown as { id?: string | number }).id ?? '').padStart(3, '0');
        const iso3 = M49_TO_ISO3[m49];
        if (iso3) {
            if (targetVisible && iso3 === targetEntity.id) {
                return { fillColor: FILL_TARGET, fillOpacity: 0.85, color: STROKE_HIT, weight: 1 };
            }
            if (guessedIds.has(iso3)) {
                return { fillColor: FILL_GUESSED, fillOpacity: 0.85, color: STROKE_HIT, weight: 0.5 };
            }
        }
        return { fillColor: FILL_DEFAULT, fillOpacity: 0.5, color: STROKE, weight: 0.5 };
    };

    return (
        <div className="w-full flex flex-col gap-2">
            <div style={{ height: '55dvh', minHeight: 300 }}>
                <MapContainer
                    center={[20, 0]}
                    zoom={2}
                    minZoom={1}
                    maxZoom={10}
                    style={{ width: '100%', height: '100%', border: '1px solid #E2E8F0' }}
                    worldCopyJump
                >
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        subdomains="abcd"
                        maxZoom={20}
                    />
                    <GeoJSON
                        key={geoKey}
                        data={countriesGeoJson}
                        style={styleFeature}
                    />
                </MapContainer>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 text-[10px] font-mono text-charcoal/70">
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
