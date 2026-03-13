import { forwardRef } from 'react';
import type { Difficulty, Feedback, GameMode, GuessResult, SchemaField } from '../types';
import {
    CATEGORY_ICONS,
    LOCATION_KEY_SET,
    getLocationStatus,
    getPuzzleNumber,
} from '../utils/dailyUtils';
import { DIFFICULTY_CONFIG } from '../utils/difficultyConfig';
import { getDisplayColumns } from '../utils/schemaParser';

interface ShareCardProps {
    activeMode: GameMode;
    dateString: string;
    activeCategory: string;
    moves: number;
    guesses: GuessResult[];
    schema: SchemaField[];
    streak?: number;
    /** Freeplay only — shown as "Target: NAME". Omit for daily (hides the answer). */
    targetName?: string;
    difficulty?: Difficulty;
}

// Design tokens — hardcoded hex for html-to-image fidelity
const C = {
    canvasBg:      '#E2E8F0',  // graphite — separates canvas from card
    cardBg:        '#FAFAF9',  // paper-white
    cardBorder:    '#18181B',  // charcoal
    cardShadow:    '#18181B',  // charcoal hard-edge shadow
    divider:       '#E2E8F0',  // graphite
    charcoal:      '#18181B',
    green:         '#22C55E',
    orange:        '#F97316',
    amber:         '#F59E0B',
    missFill:      '#FAFAF9',  // paper-white — matches game grid MISS cells
    missBorder:    '#A1A1AA',  // medium grey — softer than pure charcoal
    emptyBorder:   '#C8D0DC',  // slightly darker graphite for empty rows
} as const;

const MONO  = '"Geist Mono", "Courier New", monospace';
const SERIF = '"Fraunces", Georgia, serif';

// 3-letter abbreviations matched to actual schema attributeKeys
const ATTR_ABBREV: Record<string, string> = {
    // Countries
    location:               'LOC',
    distance_km:            'DST',
    area:                   'ARA',
    population:             'POP',
    is_landlocked:          'LND',
    government_type:        'GOV',
    border_countries_count: 'BDR',
    timezone_count:         'TMZ',
    first_letter:           'ABC',
    // Elements
    AtomicNumber:           'NUM',
    group:                  'GRP',
    period:                 'PER',
    StandardState:          'PHS',
    element_family:         'FAM',
    block:                  'BLK',
    is_radioactive:         'RAD',
    symbol_match:           'SYM',
};

function getAbbrev(key: string): string {
    return ATTR_ABBREV[key] ?? key.slice(0, 3).toUpperCase();
}

const CATEGORY_NOUN: Record<string, string> = {
    countries: 'Country',
    elements:  'Element',
};

const SQ       = 15; // square size px
const GAP      = 3;  // gap between squares px
const MIN_ROWS = 6;  // always fill at least this many rows

function squareStyle(status: string | undefined, isEmpty = false): React.CSSProperties {
    if (isEmpty) {
        return {
            backgroundColor: 'transparent',
            border: `1px dashed ${C.emptyBorder}`,
        };
    }
    switch (status) {
        case 'EXACT':
            return { backgroundColor: C.green,  border: `1px solid ${C.green}` };
        case 'HOT':
            return { backgroundColor: C.orange, border: `1px solid ${C.orange}` };
        case 'NEAR':
        case 'PARTIAL':
            return { backgroundColor: 'transparent', border: `1.5px dashed ${C.amber}` };
        default:
            return { backgroundColor: C.missFill, border: `1px solid ${C.missBorder}` };
    }
}

interface SquareData { key: string; status: string; }

function buildRow(feedback: Record<string, Feedback>, displayFields: SchemaField[]): SquareData[] {
    const squares: SquareData[] = [];
    let locationInserted = false;
    for (const f of displayFields) {
        if (LOCATION_KEY_SET.has(f.attributeKey)) {
            if (!locationInserted) {
                squares.push({ key: 'location', status: getLocationStatus(feedback) });
                locationInserted = true;
            }
        } else {
            squares.push({ key: f.attributeKey, status: feedback[f.attributeKey]?.status ?? 'MISS' });
        }
    }
    return squares;
}

function buildHeaderKeys(displayFields: SchemaField[]): string[] {
    const keys: string[] = [];
    let locationInserted = false;
    for (const f of displayFields) {
        if (LOCATION_KEY_SET.has(f.attributeKey)) {
            if (!locationInserted) {
                keys.push('location');
                locationInserted = true;
            }
        } else {
            keys.push(f.attributeKey);
        }
    }
    return keys;
}

export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
    ({ activeMode, dateString, activeCategory, moves, guesses, schema, streak, targetName, difficulty }, ref) => {
        const displayFields = getDisplayColumns(schema, difficulty, activeCategory).filter(
            f => !f.isFolded && f.logicType !== 'TARGET' && f.logicType !== 'NONE',
        );
        const difficultyLabel = difficulty ? DIFFICULTY_CONFIG[difficulty].displayName.toUpperCase() : null;

        const icon    = CATEGORY_ICONS[activeCategory] ?? '🎮';
        const catName = activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1);
        const noun    = CATEGORY_NOUN[activeCategory] ?? catName;

        const headerTitle = activeMode === 'daily'
            ? `SCALAR DAILY #${getPuzzleNumber(dateString)}`
            : 'SCALAR FREEPLAY';

        const subtitle = activeMode === 'daily'
            ? `The Secret ${noun}`
            : targetName
                ? `Target: ${targetName.toUpperCase()}`
                : `${icon} ${catName}`;

        const allRows = guesses.map(({ feedback }) => buildRow(feedback, displayFields));
        const headerKeys = buildHeaderKeys(displayFields);
        const colCount = headerKeys.length;

        // >6 guesses: first 3 + dots + last. Otherwise pad to MIN_ROWS with empty rows.
        type GridRow = SquareData[] | 'dots' | 'empty';
        const paddedRows: GridRow[] = allRows.length > MIN_ROWS
            ? [...allRows.slice(0, 3), 'dots', allRows[allRows.length - 1]]
            : [
                ...allRows,
                ...Array<'empty'>(Math.max(0, MIN_ROWS - allRows.length)).fill('empty'),
            ];

        const showStreak = (streak ?? 0) > 0;

        return (
            <div
                ref={ref}
                style={{
                    position:        'fixed',
                    left:            '-9999px',
                    top:             0,
                    pointerEvents:   'none',
                    width:           '390px',
                    height:          '693px',
                    backgroundColor: C.canvasBg,
                    fontFamily:      MONO,
                    display:         'flex',
                    alignItems:      'center',
                    justifyContent:  'center',
                    userSelect:      'none',
                    overflow:        'hidden',
                }}
            >
                {/* ── Card ── */}
                <div style={{
                    width:           '330px',
                    backgroundColor: C.cardBg,
                    border:          `2px solid ${C.cardBorder}`,
                    borderRadius:    0,
                    boxShadow:       `6px 6px 0px ${C.cardShadow}`,
                    overflow:        'hidden',
                    display:         'flex',
                    flexDirection:   'column',
                }}>

                    {/* ── Header ── */}
                    <div style={{
                        backgroundColor: C.charcoal,
                        flexShrink:      0,
                        position:        'relative',
                        overflow:        'hidden',
                    }}>
                        <div style={{ padding: '16px 20px 14px' }}>
                            <div style={{
                                fontFamily:    SERIF,
                                fontSize:      '20px',
                                fontWeight:    900,
                                letterSpacing: '0.08em',
                                color:         C.cardBg,
                                textTransform: 'uppercase',
                                lineHeight:    1,
                            }}>
                                {headerTitle}
                            </div>
                            <div style={{
                                fontFamily:    MONO,
                                fontSize:      '10px',
                                color:         C.cardBg,
                                opacity:       0.55,
                                marginTop:     '5px',
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                            }}>
                                {subtitle}
                            </div>
                            {difficultyLabel && (
                                <div style={{
                                    display:         'inline-block',
                                    marginTop:       '8px',
                                    padding:         '2px 6px',
                                    border:          `1px solid ${C.cardBg}`,
                                    opacity:         0.45,
                                    fontFamily:      MONO,
                                    fontSize:        '7px',
                                    fontWeight:      700,
                                    letterSpacing:   '0.16em',
                                    color:           C.cardBg,
                                    textTransform:   'uppercase',
                                }}>
                                    {difficultyLabel}
                                </div>
                            )}
                        </div>

                        {/* ── Tone-on-tone category decoration ── */}
                        {activeCategory === 'elements' ? (
                            // Atom: nucleus + three orbital ellipses bleeding off top-right
                            <svg
                                width="88" height="88" viewBox="0 0 88 88" fill="none"
                                style={{ position: 'absolute', right: '-20px', top: '-20px', pointerEvents: 'none' }}
                            >
                                <circle cx="64" cy="24" r="5" fill="#2D2D30" />
                                <ellipse cx="64" cy="24" rx="38" ry="13" stroke="#2D2D30" strokeWidth="1.5" />
                                <ellipse cx="64" cy="24" rx="38" ry="13" stroke="#2D2D30" strokeWidth="1.5" transform="rotate(60 64 24)" />
                                <ellipse cx="64" cy="24" rx="38" ry="13" stroke="#2D2D30" strokeWidth="1.5" transform="rotate(-60 64 24)" />
                            </svg>
                        ) : (
                            // Globe: outer circle + meridians + latitude arcs bleeding off top-right
                            <svg
                                width="88" height="88" viewBox="0 0 88 88" fill="none"
                                style={{ position: 'absolute', right: '-20px', top: '-20px', pointerEvents: 'none' }}
                            >
                                <circle cx="60" cy="28" r="40" stroke="#2D2D30" strokeWidth="1.5" />
                                <line x1="20" y1="28" x2="100" y2="28" stroke="#2D2D30" strokeWidth="1.5" />
                                <ellipse cx="60" cy="28" rx="16" ry="40" stroke="#2D2D30" strokeWidth="1.5" />
                                <ellipse cx="60" cy="28" rx="30" ry="40" stroke="#2D2D30" strokeWidth="1" />
                                <ellipse cx="60" cy="12" rx="28" ry="7" stroke="#2D2D30" strokeWidth="1" />
                                <ellipse cx="60" cy="44" rx="28" ry="7" stroke="#2D2D30" strokeWidth="1" />
                            </svg>
                        )}
                    </div>

                    {/* ── Hero Stats — 2-column with divider ── */}
                    <div style={{
                        display:     'grid',
                        gridTemplateColumns: '1fr 1px 1fr',
                        borderBottom: `1px solid ${C.divider}`,
                    }}>
                        {/* Left: Total Moves */}
                        <div style={{
                            padding:       '16px 20px',
                            display:       'flex',
                            flexDirection: 'column',
                            gap:           '6px',
                        }}>
                            <div style={{
                                fontFamily:    MONO,
                                fontSize:      '8px',
                                color:         C.charcoal,
                                opacity:       0.40,
                                letterSpacing: '0.18em',
                                textTransform: 'uppercase',
                            }}>Total Moves</div>
                            <div style={{
                                fontFamily: MONO,
                                fontSize:   '42px',
                                fontWeight: 700,
                                color:      C.charcoal,
                                lineHeight: 1,
                            }}>{moves}</div>
                        </div>

                        {/* Vertical divider */}
                        <div style={{ backgroundColor: C.divider }} />

                        {/* Right: Streak or Guesses */}
                        <div style={{
                            padding:       '16px 20px',
                            display:       'flex',
                            flexDirection: 'column',
                            gap:           '6px',
                        }}>
                            <div style={{
                                fontFamily:    MONO,
                                fontSize:      '8px',
                                color:         showStreak ? C.green : C.charcoal,
                                opacity:       showStreak ? 0.70 : 0.40,
                                letterSpacing: '0.18em',
                                textTransform: 'uppercase',
                            }}>{showStreak ? 'Streak' : 'Guesses'}</div>
                            <div style={{
                                display:    'flex',
                                alignItems: 'flex-end',
                                gap:        '5px',
                                lineHeight: 1,
                            }}>
                                <div style={{
                                    fontFamily: MONO,
                                    fontSize:   '42px',
                                    fontWeight: 700,
                                    color:      showStreak ? C.green : C.charcoal,
                                    lineHeight: 1,
                                }}>{showStreak ? streak : guesses.length}</div>
                                {showStreak && (
                                    <svg
                                        viewBox="0 0 24 24"
                                        style={{ width: '18px', height: '18px', marginBottom: '5px', flexShrink: 0 }}
                                        fill={C.green}
                                    >
                                        <path d="M12 1C10 6.5 6 10.5 6 15c0 3.3 2.7 6 6 6s6-2.7 6-6c0-3-2-5.5-2.5-5.5C15.5 12 14 13.5 12.5 13c-1.5-.5-2.5-2.5 0-8 0 0-4 3.5-4.5 7-.3 2 .8 3.5 2 4-.5-1.5-.2-3.5 2-5z" />
                                    </svg>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Grid section ── */}
                    <div style={{
                        padding:       '14px 20px 18px',
                        display:       'flex',
                        flexDirection: 'column',
                        alignItems:    'center',
                        gap:           '6px',
                    }}>
                        {/* Column header abbreviations */}
                        <div style={{ display: 'flex', gap: `${GAP}px` }}>
                            {headerKeys.map((key) => (
                                <div key={key} style={{
                                    width:         `${SQ}px`,
                                    textAlign:     'center',
                                    fontFamily:    MONO,
                                    fontSize:      '6px',
                                    color:         C.charcoal,
                                    opacity:       0.35,
                                    letterSpacing: '0.01em',
                                    textTransform: 'uppercase',
                                    flexShrink:    0,
                                }}>
                                    {getAbbrev(key)}
                                </div>
                            ))}
                        </div>

                        {/* Guess rows (padded to MIN_ROWS) */}
                        {paddedRows.map((row, rowIdx) => {
                            if (row === 'dots') {
                                return (
                                    <div key="dots" style={{
                                        fontSize:      '10px',
                                        color:         C.charcoal,
                                        opacity:       0.25,
                                        letterSpacing: '0.3em',
                                        height:        `${SQ}px`,
                                        display:       'flex',
                                        alignItems:    'center',
                                    }}>
                                        · · ·
                                    </div>
                                );
                            }
                            if (row === 'empty') {
                                return (
                                    <div key={`empty-${rowIdx}`} style={{ display: 'flex', gap: `${GAP}px` }}>
                                        {Array.from({ length: colCount }, (_, i) => (
                                            <div key={i} style={{
                                                width:      `${SQ}px`,
                                                height:     `${SQ}px`,
                                                flexShrink: 0,
                                                ...squareStyle(undefined, true),
                                            }} />
                                        ))}
                                    </div>
                                );
                            }
                            return (
                                <div key={rowIdx} style={{ display: 'flex', gap: `${GAP}px` }}>
                                    {row.map((sq) => (
                                        <div key={sq.key} style={{
                                            width:      `${SQ}px`,
                                            height:     `${SQ}px`,
                                            flexShrink: 0,
                                            ...squareStyle(sq.status),
                                        }} />
                                    ))}
                                </div>
                            );
                        })}
                    </div>

                    {/* ── Divider ── */}
                    <div style={{
                        margin:    '0 20px',
                        borderTop: `1px dashed ${C.charcoal}`,
                        opacity:   0.15,
                        flexShrink: 0,
                    }} />

                    {/* ── Footer ── */}
                    <div style={{
                        padding:   '12px 20px',
                        textAlign: 'center',
                        flexShrink: 0,
                    }}>
                        <div style={{
                            fontFamily:    MONO,
                            fontSize:      '11px',
                            fontWeight:    700,
                            color:         C.charcoal,
                            opacity:       0.4,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                        }}>
                            scalargame.com
                        </div>
                    </div>
                </div>
            </div>
        );
    },
);

ShareCard.displayName = 'ShareCard';
