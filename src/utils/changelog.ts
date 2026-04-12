// ── Scalar Changelog ──────────────────────────────────────────────────────────
//
// HOW TO SHIP A NEW UPDATE:
//   1. Add a new Release object at the TOP of the RELEASES array below.
//   2. Set `date` to today's date (YYYY-MM-DD) — this is the unique version key
//      stored in localStorage to determine if the user has seen this release.
//   3. Fill in `version` (display label) and `sections` with your changes.
//   4. That's it. The What's New modal will automatically show the new entry
//      to all returning users on their next visit.
//
// SECTION LABELS: use 'New Features', 'Improvements', or 'Bug Fixes'.
// TAGS: 'new' | 'fix' | 'improvement' — controls the bullet style.

export type ChangeTag = 'new' | 'fix' | 'improvement';

export interface ChangeItem {
    text: string;
    tag: ChangeTag;
}

export interface ChangeSection {
    label: string;
    items: ChangeItem[];
}

export interface Release {
    /** Human-readable label shown in the modal header, e.g. "v1.1" */
    version: string;
    /** ISO date string (YYYY-MM-DD). Used as the localStorage version key. */
    date: string;
    sections: ChangeSection[];
}

// ── Add new releases at the TOP ───────────────────────────────────────────────

export const RELEASES: Release[] = [
    {
        version: 'v1.4',
        date: '2026-04-11',
        sections: [
            {
                label: 'New Features',
                items: [
                    {
                        text: 'Category icons — 🌍 and ⚗️ now appear on the category toggle so you always know what you\'re playing',
                        tag: 'new',
                    },
                ],
            },
            {
                label: 'Improvements',
                items: [
                    {
                        text: 'Hints simplified — revealing an attribute now always costs +1 move. No more free credit system.',
                        tag: 'improvement',
                    },
                    {
                        text: 'Map & Periodic Table move cost scales with difficulty — free on Novice, +3 on Scholar, +10 on Prodigy',
                        tag: 'improvement',
                    },
                ],
            },
        ],
    },
    {
        version: 'v1.3',
        date: '2026-03-24',
        sections: [
            {
                label: 'New Features',
                items: [
                    {
                        text: 'World Map — tap the map icon to see all your guessed countries highlighted on an interactive world map',
                        tag: 'new',
                    },
                    {
                        text: 'Periodic Table — tap the grid icon to see your guessed elements highlighted across the full periodic table',
                        tag: 'new',
                    },
                ],
            },
            {
                label: 'Improvements',
                items: [
                    {
                        text: 'Both views support pinch-to-zoom, drag to pan, and scroll-wheel zoom — fully optimised for mobile',
                        tag: 'improvement',
                    },
                    {
                        text: 'World Map upgraded to tile-based rendering — smoother navigation and a more familiar map style',
                        tag: 'improvement',
                    },
                    {
                        text: 'Periodic Table stays readable on phones — minimum zoom keeps cells legible with horizontal panning',
                        tag: 'improvement',
                    },
                    {
                        text: 'Win screen compacted — share and play-again buttons always reachable without scrolling',
                        tag: 'improvement',
                    },
                    {
                        text: 'Distance feedback colours now match the colour legend — Hot (gold) and Near (amber) are consistent throughout',
                        tag: 'improvement',
                    },
                ],
            },
        ],
    },
    {
        version: 'v1.2',
        date: '2026-03-13',
        sections: [
            {
                label: 'Improvements',
                items: [
                    {
                        text: 'Element symbols now appear in autocomplete suggestions — easier to scan at a glance',
                        tag: 'improvement',
                    },
                    {
                        text: 'Prodigy mode: you can now submit a guess by typing an element\'s chemical symbol (e.g. "Fe" for Iron)',
                        tag: 'improvement',
                    },
                ],
            },
            {
                label: 'Bug Fixes',
                items: [
                    {
                        text: 'Tapping the difficulty dropdown on mobile no longer causes a layout jump',
                        tag: 'fix',
                    },
                ],
            },
        ],
    },
    {
        version: 'v1.1',
        date: '2026-03-12',
        sections: [
            {
                label: 'New Features',
                items: [
                    {
                        text: 'Difficulty modes — choose Easy, Normal, or Hard to control how many attributes are visible per guess',
                        tag: 'new',
                    },
                    {
                        text: 'Share Image — the Share button in the win screen now lets you share a visual recap card alongside the emoji grid',
                        tag: 'new',
                    },
                ],
            },
            {
                label: 'Bug Fixes',
                items: [
                    {
                        text: 'Free play share card no longer reveals the answer name — the entity stays hidden until the game ends',
                        tag: 'fix',
                    },
                ],
            },
        ],
    },
    {
        version: 'v1.0',
        date: '2026-02-26',
        sections: [
            {
                label: 'Launch',
                items: [
                    { text: 'Daily Challenge Mode with streak tracking', tag: 'new' },
                    { text: 'Challenge links — share a specific puzzle for a friend to race against your score', tag: 'new' },
                    { text: 'Installable as a PWA on mobile and desktop', tag: 'new' },
                    { text: 'Interactive tutorial for first-time players', tag: 'new' },
                    { text: 'Guess cards auto-collapse older entries to keep the board clean', tag: 'improvement' },
                ],
            },
        ],
    },
];

// ── Derived constants (do not edit) ───────────────────────────────────────────

/** The unique key for the current release. Derived from the latest entry. */
export const WHATS_NEW_VERSION: string = RELEASES[0].date;

/** localStorage key used to track which release the user last acknowledged. */
export const WHATS_NEW_STORAGE_KEY = 'scalar-whats-new-seen';
