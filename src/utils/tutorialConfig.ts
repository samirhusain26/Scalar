export interface TutorialStep {
    id: string;
    title: string;
    body: string;
    /** data-tutorial attribute value to spotlight; null = centered modal, no spotlight */
    targetSelector: string | null;
    tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
    /** Render an eye icon demo badge in the tooltip body */
    showEyeIcon?: boolean;
    /** Override CTA label; default: "Next →" */
    nextLabel?: string;
    /** Hide the "Skip Tutorial" link on the final step */
    skipHidden?: boolean;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
    {
        id: 'welcome',
        targetSelector: null,
        title: 'Welcome to Scalar',
        body: 'A mystery country or element is hidden. Make guesses — each one reveals structured clues to help you narrow it down.',
        nextLabel: "Show me around →",
    },
    {
        id: 'controls',
        targetSelector: 'game-header',
        tooltipPosition: 'bottom',
        title: 'Your Controls',
        body: 'Switch categories on the left, type a guess in the center, and track your moves and hint credits on the right.',
    },
    {
        id: 'legend',
        targetSelector: 'color-legend',
        tooltipPosition: 'bottom',
        title: 'Reading the Colors',
        body: 'Green = exact match. Orange = very close. Amber dashed = getting warmer. White = no match.',
    },
    {
        id: 'hints',
        targetSelector: null,
        title: 'Reveal Any Clue',
        body: "Tap the eye icon on any clue cell to instantly reveal that attribute's exact value. Free 3 times — after that it costs +3 moves each.",
        showEyeIcon: true,
    },
    {
        id: 'answer',
        targetSelector: 'answer-section',
        tooltipPosition: 'top',
        title: 'The Hidden Answer',
        body: 'The answer lives here — hidden until you solve it. You can also forfeit and reveal it at any time.',
    },
    {
        id: 'done',
        targetSelector: null,
        title: "You're Ready",
        body: 'Find the hidden entity in as few moves as possible. Tap ? any time to review the rules. Good luck!',
        nextLabel: 'Start Playing',
        skipHidden: true,
    },
];
