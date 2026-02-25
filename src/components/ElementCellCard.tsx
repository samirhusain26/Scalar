import type { Entity, CategorySchema } from '../types';
import { formatNumber } from '../utils/formatters';
import { cn } from '../utils/cn';

interface ElementCellCardProps {
    entity: Entity;
    schema: CategorySchema;
    variant?: 'modal' | 'default';
}

/** Fields rendered in the 3-col data grid */
const DATA_PANEL_KEYS = [
    'group',
    'period',
    'YearDiscovered',
    'is_radioactive',
    'is_synthetic',
    'symbol_match',
    'broad_classification',
    'rarity_category',
    'conductivity_type',
    'Density',
    'Electronegativity',
    'AtomicRadius',
    'IonizationEnergy',
    'ElectronAffinity',
    'neutron_count',
    'MeltingPoint',
    'BoilingPoint',
] as const;

export function ElementCellCard({ entity, schema, variant = 'default' }: ElementCellCardProps) {
    const isModal = variant === 'modal';
    const symbol = String(entity.id ?? '');
    const name = entity.name;
    const atomicNumber = Number(entity.AtomicNumber ?? 0);
    const atomicMass = entity.AtomicMass;

    // Subtitle parts: Family · Block · Phase
    const family = String(entity.element_family ?? '');
    const block = String(entity.block ?? '');
    const phase = String(entity.StandardState ?? '');

    // Build data panel entries from schema
    const dataPanelFields = DATA_PANEL_KEYS
        .map(key => schema.find(f => f.attributeKey === key))
        .filter((f): f is NonNullable<typeof f> => f !== undefined);

    function formatAtomicMass(val: unknown): string {
        if (val === undefined || val === null) return '—';
        const num = Number(val);
        if (isNaN(num)) return String(val);
        if (num < 10) return num.toFixed(3);
        if (num < 100) return num.toFixed(2);
        return num.toFixed(1);
    }

    function formatFieldValue(key: string): string {
        const val = entity[key];
        if (val === undefined || val === null || val === -1 || val === '') return '—';
        if (typeof val === 'boolean') return val ? 'Yes' : 'No';
        if (typeof val === 'number') {
            if (/year|discovered/i.test(key)) {
                return val === 0 ? 'Ancient' : String(val);
            }
            if (key === 'neutron_count') return String(val);
            return formatNumber(val);
        }
        return String(val);
    }

    return (
        <div className="w-full max-w-[340px] mx-auto border-2 border-charcoal bg-paper-white">
            {/* Periodic Table Square */}
            <div className="relative px-4 pt-3 pb-2">
                {/* Top row: Atomic # (left) and Mass (right) */}
                <div className="flex justify-between items-start">
                    <span className="font-mono text-lg font-black text-charcoal leading-none">
                        {atomicNumber}
                    </span>
                    <span className="font-mono text-[11px] text-charcoal/50 leading-none">
                        {formatAtomicMass(atomicMass)}
                    </span>
                </div>

                {/* Center: Symbol */}
                <div className="relative text-center py-1">
                    {isModal && (
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{ background: 'radial-gradient(circle at center, rgba(34,197,94,0.07) 0%, transparent 70%)' }}
                        />
                    )}
                    <span className={cn("font-mono font-black text-charcoal leading-none tracking-tight", isModal ? "text-8xl" : "text-7xl")}>
                        {symbol}
                    </span>
                </div>

                {/* Bottom: Element Name */}
                <div className="text-center pb-1">
                    <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-charcoal">
                        {name}
                    </span>
                </div>

                {/* Subtitle: Family · Block · Phase */}
                <div className="text-center mt-1">
                    <span className="font-mono text-[10px] text-charcoal/50 tracking-wide">
                        {[family, block, phase].filter(Boolean).join(' · ')}
                    </span>
                </div>
            </div>

            {/* Data Panel — 3 columns */}
            {dataPanelFields.length > 0 && (
                <div className="grid grid-cols-3 gap-px bg-charcoal border-t-2 border-charcoal">
                    {dataPanelFields.map(field => (
                        <div key={field.attributeKey} className="bg-paper-white px-2 py-1.5">
                            <div className="text-[9px] uppercase opacity-60 tracking-wider leading-tight font-mono">
                                {field.displayLabel}
                            </div>
                            <div className="text-[11px] font-bold font-mono text-charcoal leading-tight mt-0.5 truncate">
                                {formatFieldValue(field.attributeKey)}
                            </div>
                        </div>
                    ))}
                    {dataPanelFields.length % 3 !== 0 && (
                        Array.from({ length: 3 - (dataPanelFields.length % 3) }).map((_, i) => (
                            <div key={`pad-${i}`} className="bg-paper-white" />
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
