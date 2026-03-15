import type { Entity, GuessResult, GameStatus } from '../types';
import gameData from '../assets/data/gameData.json';

interface PeriodicTableViewProps {
    guesses: GuessResult[];
    targetEntity: Entity;
    gameStatus: GameStatus;
}

// Subtle background tints per element family (unguessed cells only)
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
    // Lanthanides: La(57) → col 3, Ce(58) → col 4, …, Lu(71) → col 17 — displayed in row 9
    if (atomicNum >= 57 && atomicNum <= 71) return { row: 9, col: atomicNum - 54 };
    // Actinides: Ac(89) → col 3, Th(90) → col 4, …, Lr(103) → col 17 — displayed in row 10
    if (atomicNum >= 89 && atomicNum <= 103) return { row: 10, col: atomicNum - 86 };
    return { row: period, col: group };
}

export function PeriodicTableView({ guesses, targetEntity, gameStatus }: PeriodicTableViewProps) {
    const elements = (gameData.categories as Record<string, Entity[]>).elements ?? [];

    const guessedIds = new Set(guesses.map(g => g.guess.id));
    const targetVisible = gameStatus === 'SOLVED' || gameStatus === 'REVEALED';

    // Cell size in px — compact enough to fit when scrolled
    const CELL = 44;

    const cells = elements.map(el => {
        const atomicNum = el.AtomicNumber as number;
        const group     = el.group     as number;
        const period    = el.period    as number;
        const pos = getElementPosition(atomicNum, group, period);
        return { el, ...pos };
    });

    const isTarget   = (el: Entity) => el.id === targetEntity.id;
    const isGuessed  = (el: Entity) => guessedIds.has(el.id);

    function cellStyle(el: Entity): React.CSSProperties {
        if (targetVisible && isTarget(el)) {
            return { backgroundColor: '#22C55E', color: '#FAFAF9', border: '1px solid #18181B', width: CELL, height: CELL };
        }
        if (isGuessed(el)) {
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

    // Total grid: 18 cols × 10 rows (rows 1-7 main, row 8 gap, rows 9-10 f-block)
    const totalWidth = 18 * CELL;

    return (
        <div className="overflow-x-auto w-full">
            <div style={{ minWidth: totalWidth, position: 'relative' }}>
                {/* Main grid + f-block separator label */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(18, ${CELL}px)`,
                        gridTemplateRows: `repeat(7, ${CELL}px) 12px repeat(2, ${CELL}px)`,
                        gap: 0,
                    }}
                >
                    {/* Lanthanide placeholder in main grid (period 6, group 3) */}
                    <div
                        style={{
                            gridColumn: 3,
                            gridRow: 6,
                            width: CELL,
                            height: CELL,
                            backgroundColor: '#fce7f3',
                            border: '1px dashed #E2E8F0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 9,
                            color: '#9CA3AF',
                            fontFamily: 'inherit',
                        }}
                    >
                        57–71
                    </div>

                    {/* Actinide placeholder in main grid (period 7, group 3) */}
                    <div
                        style={{
                            gridColumn: 3,
                            gridRow: 7,
                            width: CELL,
                            height: CELL,
                            backgroundColor: '#fecaca',
                            border: '1px dashed #E2E8F0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 9,
                            color: '#9CA3AF',
                            fontFamily: 'inherit',
                        }}
                    >
                        89–103
                    </div>

                    {/* Separator row (row 8) — span group label */}
                    <div
                        style={{
                            gridColumn: '2 / span 16',
                            gridRow: 8,
                            display: 'flex',
                            alignItems: 'center',
                            paddingLeft: 4,
                            fontSize: 8,
                            color: '#9CA3AF',
                            letterSpacing: '0.05em',
                        }}
                    >
                        LANTHANIDES &amp; ACTINIDES
                    </div>

                    {/* All element cells */}
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
                                cursor: 'default',
                                boxSizing: 'border-box',
                            }}
                            title={`${el.name} (${el.id}) — #${el.AtomicNumber}`}
                        >
                            <span style={{ fontSize: 7, lineHeight: 1, opacity: 0.7 }}>
                                {el.AtomicNumber as number}
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.1 }}>
                                {el.id}
                            </span>
                            <span style={{ fontSize: 6, lineHeight: 1, opacity: 0.8, textAlign: 'center', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {el.name}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-3 mt-3 px-1 text-[10px] font-mono text-charcoal/70">
                    {Object.entries(FAMILY_BG).map(([family, color]) => (
                        <span key={family} className="flex items-center gap-1">
                            <span style={{ width: 10, height: 10, backgroundColor: color, border: '1px solid #E2E8F0', display: 'inline-block', flexShrink: 0 }} />
                            {family}
                        </span>
                    ))}
                    <span className="flex items-center gap-1">
                        <span style={{ width: 10, height: 10, backgroundColor: '#18181B', display: 'inline-block', flexShrink: 0 }} />
                        Guessed
                    </span>
                    {targetVisible && (
                        <span className="flex items-center gap-1">
                            <span style={{ width: 10, height: 10, backgroundColor: '#22C55E', display: 'inline-block', flexShrink: 0 }} />
                            Answer
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
