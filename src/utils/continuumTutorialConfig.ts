import type { TutorialStep } from './tutorialConfig';

export const CONTINUUM_TUTORIAL_STEPS: TutorialStep[] = [
    {
        id: 'welcome',
        targetSelector: null,
        title: 'Welcome to Continuum',
        body: 'A daily ranking challenge. Cards appear one at a time — drag each into the correct position in a ranked list.',
        nextLabel: 'Show me around →',
    },
    {
        id: 'timeline',
        targetSelector: 'continuum-timeline',
        tooltipPosition: 'right',
        title: 'The Ranked List',
        body: 'These are your anchor cards — reference points that set the scale. Highest value is at the top, lowest at the bottom. Your placements slot in between.',
    },
    {
        id: 'card',
        targetSelector: 'continuum-card',
        tooltipPosition: 'left',
        title: 'The Incoming Card',
        body: 'This card needs a home. Drag it left onto the timeline and drop it in the gap where it belongs in the ranking.',
    },
    {
        id: 'lives',
        targetSelector: 'continuum-lives',
        tooltipPosition: 'bottom',
        title: 'Your Lives',
        body: 'You have 3 lives. Every wrong placement costs one. Lose all three and the round is over — your score is how many you placed correctly.',
    },
    {
        id: 'done',
        targetSelector: null,
        title: "You're Ready",
        body: 'Place as many cards correctly as possible. The sharper your intuition, the higher your score. Good luck!',
        nextLabel: 'Start Playing',
        skipHidden: true,
    },
];
