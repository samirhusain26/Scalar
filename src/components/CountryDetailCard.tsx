import type { Entity } from '../types';
import { formatNumber } from '../utils/formatters';
import { cn } from '../utils/cn';

interface CountryDetailCardProps {
    entity: Entity;
    variant?: 'modal' | 'default';
}

interface DataField {
    key: string;
    label: string;
    /** If true, render 0 as "—" */
    zeroAsDash?: boolean;
}

/** Fields shown verbatim as integers, not formatted with k/M/B suffix */
const INT_VERBATIM_KEYS = new Set([
    'timezone_count',
    'border_countries_count',
    'olympics_hosted_count',
    'olympics_latest_year',
    'unesco_sites',
]);

const DATA_FIELDS: DataField[] = [
    { key: 'area',                  label: 'Area (km²)' },
    { key: 'population',            label: 'Population' },
    { key: 'pop_density',           label: 'Density /km²' },
    { key: 'GDP',                   label: 'GDP' },
    { key: 'gdp_per_capita',        label: 'GDP / Capita' },
    { key: 'Armed Forces size',     label: 'Armed Forces' },
    { key: 'is_landlocked',         label: 'Landlocked?' },
    { key: 'driving_side',          label: 'Driving Side' },
    { key: 'government_type',       label: 'Govt. Type' },
    { key: 'timezone_count',        label: 'Timezones' },
    { key: 'border_countries_count',label: 'Borders' },
    { key: 'olympics_hosted_count', label: 'Olympics Hosted', zeroAsDash: true },
    { key: 'olympics_latest_year',  label: 'Last Olympics',   zeroAsDash: true },
    { key: 'unesco_sites',          label: 'UNESCO Sites' },
];

/** Pad cells needed to fill the last grid row */
const PAD_COUNT = DATA_FIELDS.length % 3 === 0 ? 0 : 3 - (DATA_FIELDS.length % 3);

export function CountryDetailCard({ entity, variant = 'default' }: CountryDetailCardProps) {
    const isModal = variant === 'modal';
    const isoCode  = String(entity.id   ?? '');
    const name     = String(entity.name ?? '');
    const continent = String(entity.continent  ?? '');
    const subregion = String(entity.subregion  ?? '');
    const hemisphere = String(entity.hemisphere ?? '');
    const capital   = String(entity['Capital/Major City'] ?? '');

    function formatVal(field: DataField): string {
        const raw = entity[field.key];

        if (raw === null || raw === undefined || raw === -1 || raw === '') return '—';
        if (field.zeroAsDash && raw === 0) return '—';

        if (typeof raw === 'boolean') return raw ? 'Yes' : 'No';

        // Coerce string-encoded numbers (happens when a numeric field was missing from
        // schema_config so fetch_data.py stored it as STRING instead of INT/FLOAT)
        const num = typeof raw === 'string' ? Number(raw) : NaN;
        const val = typeof raw === 'number' ? raw : (!isNaN(num) ? num : raw);

        if (typeof val === 'number') {
            if (field.zeroAsDash && val === 0) return '—';
            if (INT_VERBATIM_KEYS.has(field.key)) return String(val);
            if (field.key === 'pop_density')    return val.toFixed(1);
            if (field.key === 'gdp_per_capita') return `$${formatNumber(val)}`;
            if (field.key === 'GDP')            return `$${formatNumber(val)}`;
            return formatNumber(val);
        }

        return String(val);
    }

    const locationStr = [hemisphere, continent, subregion].filter(Boolean).join(' • ');

    return (
        <div className={cn("w-full bg-paper-white", isModal ? "border-2 border-charcoal" : "border border-charcoal")}>

            {/* ── Passport Header ─────────────────────────────── */}
            <div className="px-4 pt-4 pb-3 border-b border-charcoal">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        {/* Country name */}
                        <div className="font-serif-display text-2xl font-light text-charcoal leading-tight truncate">
                            {isModal && <span className="mr-1.5 opacity-40">◎</span>}
                            {name}
                        </div>
                        {/* Location breadcrumb */}
                        <div className="font-mono text-[10px] uppercase tracking-widest text-charcoal/50 mt-1 leading-tight">
                            {locationStr}
                        </div>
                        {/* Capital */}
                        {capital && (
                            <div className="font-mono text-[10px] text-charcoal/40 mt-0.5">
                                ◉ {capital}
                            </div>
                        )}
                    </div>
                    {/* ISO code watermark */}
                    <div className={cn("font-mono text-xl font-black tracking-widest shrink-0 select-none", isModal ? "text-charcoal/[0.18]" : "text-charcoal/[0.12]")}>
                        {isoCode}
                    </div>
                </div>
            </div>

            {/* ── Data Grid ───────────────────────────────────── */}
            <div className="grid grid-cols-3 gap-px bg-charcoal">
                {DATA_FIELDS.map((field) => (
                    <div key={field.key} className={cn("bg-paper-white px-2", isModal ? "py-2" : "py-1.5")}>
                        <div className="text-[9px] uppercase opacity-50 tracking-wider leading-tight font-mono truncate">
                            {field.label}
                        </div>
                        <div className="text-[11px] font-bold font-mono text-charcoal leading-tight mt-0.5 truncate">
                            {formatVal(field)}
                        </div>
                    </div>
                ))}
                {/* Padding to fill last row */}
                {Array.from({ length: PAD_COUNT }).map((_, i) => (
                    <div key={`pad-${i}`} className="bg-paper-white" />
                ))}
            </div>
        </div>
    );
}
