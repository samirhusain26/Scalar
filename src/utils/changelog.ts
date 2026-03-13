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
