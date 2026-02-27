import { useCallback, useEffect, useRef, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { Share2 } from 'lucide-react';
import { GameGrid } from './components/GameGrid';
import { GameInput, type GameInputHandle } from './components/GameInput';
import { GameOverModal } from './components/GameOverModal';
import { RevealAnswerModal } from './components/RevealAnswerModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { TutorialOverlay } from './components/TutorialOverlay';
import { ColorLegend } from './components/ColorLegend';
import { Scoreboard } from './components/Scoreboard';
import { CategoryToggle } from './components/CategoryToggle';
import { ModeToggle } from './components/ModeToggle';
import { ScalarLogo } from './components/ScalarLogo';
import { VennBackground } from './components/VennBackground';
import { useGameStore } from './store/gameStore';
import { decodeChallenge, encodeChallenge } from './utils/challengeUtils';
import { getLocalDateString, formatToggleDateLabel } from './utils/dailyUtils';
import { TUTORIAL_STEPS } from './utils/tutorialConfig';
import { cn } from './utils/cn';
import gameDataRaw from './assets/data/gameData.json';
import type { GameData } from './types';

const gameData = gameDataRaw as unknown as GameData;
const CATEGORIES = Object.keys(gameData.categories);

const HTP_STORAGE_KEY = 'scalar-htp-seen';
const TUTORIAL_KEY = 'scalar-tutorial-seen';

function App() {
  const gameStatus = useGameStore(state => state.gameStatus);
  const resetGame = useGameStore(state => state.resetGame);
  const revealAnswer = useGameStore(state => state.revealAnswer);
  const startChallengeGame = useGameStore(state => state.startChallengeGame);
  const targetEntity = useGameStore(state => state.targetEntity);
  const activeCategory = useGameStore(state => state.activeCategory);
  const setActiveCategory = useGameStore(state => state.setActiveCategory);
  const moves = useGameStore(state => state.moves);
  const guesses = useGameStore(state => state.guesses);
  const activeMode = useGameStore(state => state.activeMode);
  const setActiveMode = useGameStore(state => state.setActiveMode);
  const dailyMeta = useGameStore(state => state.dailyMeta);
  const initializeApp = useGameStore(state => state.initializeApp);

  // Date helpers (stable per render — no state needed)
  const todayDateString = getLocalDateString();
  const toggleDateLabel = formatToggleDateLabel(todayDateString);

  // ── Tutorial state (localStorage only — no Zustand version bump needed) ──
  const [tutorialStep, setTutorialStep] = useState<number | null>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('challenge')) return null;
    const tutorialSeen = localStorage.getItem(TUTORIAL_KEY);
    const htpSeen = localStorage.getItem(HTP_STORAGE_KEY);
    return !tutorialSeen && !htpSeen ? 0 : null;
  });

  // Initialise on mount: handles day rollovers after hydration; also force
  // freeplay during tutorial so practice guesses never pollute the daily slot.
  useEffect(() => {
    if (tutorialStep === 0) {
      // Brand-new user — run tutorial in freeplay with a clean game
      setActiveMode('freeplay');
      resetGame();
    } else {
      initializeApp();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const completeTutorial = () => {
    localStorage.setItem(TUTORIAL_KEY, '1');
    localStorage.setItem(HTP_STORAGE_KEY, '1');
    setTutorialStep(null);
    setShowHtpPulse(false);
    resetGame();
  };

  const skipTutorial = () => {
    localStorage.setItem(TUTORIAL_KEY, 'skipped');
    setTutorialStep(null);
    resetGame();
  };

  // Jump to final tutorial step if game ends mid-tutorial
  useEffect(() => {
    if (
      tutorialStep !== null &&
      tutorialStep > 0 &&
      tutorialStep < TUTORIAL_STEPS.length - 1 &&
      (gameStatus === 'SOLVED' || gameStatus === 'REVEALED')
    ) {
      const t = setTimeout(() => setTutorialStep(TUTORIAL_STEPS.length - 1), 0);
      return () => clearTimeout(t);
    }
  }, [gameStatus, tutorialStep]);

  // ── Daily modal dismiss (session-only — resets on page reload = Wordle behaviour) ──
  // Without this, the GameOverModal/RevealAnswerModal would be uncloseble in daily mode
  // because gameStatus stays SOLVED/REVEALED and the modal's `isOpen` would never flip.
  const [dailyGameOverDismissed, setDailyGameOverDismissed] = useState(false);
  const [dailyRevealDismissed, setDailyRevealDismissed] = useState(false);

  // Reset dismiss flags whenever the user switches mode or category
  useEffect(() => {
    setDailyGameOverDismissed(false);
    setDailyRevealDismissed(false);
  }, [activeMode, activeCategory]);

  // ── HTP modal ──
  const [showHowToPlay, setShowHowToPlay] = useState(() => {
    const tutorialSeen = !!localStorage.getItem(TUTORIAL_KEY);
    const htpSeen = !!localStorage.getItem(HTP_STORAGE_KEY);
    return tutorialSeen && !htpSeen;
  });
  const [showHtpPulse, setShowHtpPulse] = useState(() => !localStorage.getItem(HTP_STORAGE_KEY));
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showShare, setShowShare] = useState(true);
  const [showRevealConfirm, setShowRevealConfirm] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [challengerMoves, setChallengerMoves] = useState<number | null>(null);
  const lastScrollY = useRef(0);
  const mobileInputRef = useRef<GameInputHandle>(null);
  const focusInput = useCallback(() => { mobileInputRef.current?.focus(); }, []);

  const handleCloseHowToPlay = () => {
    setShowHowToPlay(false);
    setShowHtpPulse(false);
    localStorage.setItem(HTP_STORAGE_KEY, '1');
  };

  const handleReset = () => {
    resetGame();
    setChallengerMoves(null);
    setShowRevealConfirm(false);
  };

  const handleSwitchToFreePlay = () => {
    setActiveMode('freeplay');
  };

  // Challenge URL detection
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const challengeHash = params.get('challenge');
    if (challengeHash) {
      const result = decodeChallenge(challengeHash);
      if (result) {
        startChallengeGame(result.category, result.entity);
        if (result.challengerMoves !== undefined) {
          setChallengerMoves(result.challengerMoves);
        }
      }
      const url = new URL(window.location.href);
      url.searchParams.delete('challenge');
      window.history.replaceState({}, '', url.pathname);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Share button auto-hide on scroll down, reveal on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY > lastScrollY.current + 10) setShowShare(false);
      else if (currentY < lastScrollY.current - 10) setShowShare(true);
      lastScrollY.current = currentY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const shareVisible = showShare || gameStatus === 'SOLVED';

  // Win effect (invert colors)
  useEffect(() => {
    if (gameStatus === 'SOLVED') {
      let innerTimer: ReturnType<typeof setTimeout>;
      const outerTimer = setTimeout(() => {
        document.documentElement.classList.add('invert');
        innerTimer = setTimeout(() => document.documentElement.classList.remove('invert'), 500);
      }, 200);
      return () => {
        clearTimeout(outerTimer);
        clearTimeout(innerTimer);
        document.documentElement.classList.remove('invert');
      };
    }
  }, [gameStatus]);

  return (
    <div className="min-h-screen bg-paper-white relative">
      <VennBackground />

      {/* Main container */}
      <div className="w-full max-w-5xl mx-auto px-4 lg:px-8 flex flex-col min-h-screen relative">

        {/* HEADER TITLE — collapses on mobile when input focused */}
        <div
          className={cn(
            "relative flex flex-col items-center justify-center overflow-hidden transition-all duration-200",
            isInputFocused
              ? "h-0 mb-0 opacity-0 md:h-[120px] md:mb-1 md:opacity-100"
              : "h-[120px] mb-1"
          )}
        >
          <div className="absolute opacity-50">
            <ScalarLogo size={160} />
          </div>
          <h1 className="relative text-4xl md:text-6xl font-light font-serif-display tracking-[0.12em] uppercase select-none text-charcoal">
            SCALAR
          </h1>
        </div>

        {/* Header / Top Bar */}
        <header className="sticky top-0 z-40 mb-2 min-h-[52px] border-b-venn md:[border-image:none] md:border-b-2 md:border-charcoal pb-4 font-mono bg-paper-white/95 backdrop-blur-sm" data-tutorial="game-header">

          {/* Mobile layout: stacked rows, all centered */}
          <div className="flex flex-col gap-2 items-center md:hidden">

            {/* Rows 1+2: Category + Mode toggles — hidden while input is focused */}
            <div className={cn(
              "flex flex-col gap-2 items-center overflow-hidden transition-all duration-200",
              isInputFocused ? "max-h-0 opacity-0" : "max-h-24 opacity-100"
            )}>
              <CategoryToggle
                categories={CATEGORIES}
                activeCategory={activeCategory}
                onChange={(cat) => { setActiveCategory(cat); setChallengerMoves(null); setShowRevealConfirm(false); }}
              />
              <ModeToggle
                activeMode={activeMode}
                dateLabel={toggleDateLabel}
                onChange={setActiveMode}
              />
            </div>

            {/* Row 3: Input */}
            <GameInput ref={mobileInputRef} onFocusChange={setIsInputFocused} />

            {/* Row 4: Score + How to Play — always visible */}
            <div className="overflow-hidden transition-all duration-200 max-h-16 opacity-100">
              <div className="flex items-center gap-3">
                <Scoreboard />
                <div className="h-4 w-px bg-graphite" />
                <div className="relative">
                  <button
                    onClick={() => setShowHowToPlay(true)}
                    className="w-7 h-7 border border-charcoal flex items-center justify-center text-[11px] font-black text-charcoal hover:bg-charcoal hover:text-paper-white transition-colors touch-manipulation shrink-0"
                    title="How to Play"
                    aria-label="How to Play"
                  >
                    ?
                  </button>
                  {showHtpPulse && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-thermal-orange rounded-full animate-pulse pointer-events-none" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Desktop layout: single row with centered input */}
          <div className="hidden md:flex items-center justify-between">
            {/* Left: CategoryToggle + ModeToggle stacked */}
            <div className="shrink-0 flex flex-col gap-1.5">
              <CategoryToggle
                categories={CATEGORIES}
                activeCategory={activeCategory}
                onChange={(cat) => { setActiveCategory(cat); setChallengerMoves(null); setShowRevealConfirm(false); }}
              />
              <ModeToggle
                activeMode={activeMode}
                dateLabel={toggleDateLabel}
                onChange={setActiveMode}
              />
            </div>

            {/* Center: Input (absolutely centered in the row) */}
            <div className="absolute left-1/2 -translate-x-1/2">
              <GameInput />
            </div>

            {/* Right: Scoreboard + HTP */}
            <div className="flex items-center gap-3 shrink-0">
              <Scoreboard />
              <div className="h-4 w-px bg-graphite" />
              <div className="relative">
                <button
                  onClick={() => setShowHowToPlay(true)}
                  className="w-7 h-7 border border-charcoal flex items-center justify-center text-[11px] font-black text-charcoal hover:bg-charcoal hover:text-paper-white transition-colors touch-manipulation shrink-0"
                  title="How to Play"
                  aria-label="How to Play"
                >
                  ?
                </button>
                {showHtpPulse && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-thermal-orange rounded-full animate-pulse pointer-events-none" />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Game Area */}
        <main className="flex-1 flex flex-col w-full">

          <div className="flex-1">
            {challengerMoves !== null && gameStatus === 'PLAYING' && (
              <div className="mb-3 border border-charcoal/30 bg-charcoal/5 px-4 py-2 text-center font-mono text-xs">
                Your friend solved this in <strong>{challengerMoves} move{challengerMoves !== 1 ? 's' : ''}</strong>. Can you beat them?
              </div>
            )}
            <ColorLegend />
            <GameGrid onEmptyStateClick={focusInput} />
          </div>

          {/* ANSWER */}
          <div className="mt-auto border-t-2 border-charcoal py-3 px-4 flex flex-col md:flex-row items-center justify-between md:justify-center md:gap-8" data-tutorial="answer-section">
            <span className="text-[10px] font-bold uppercase tracking-widest text-charcoal/60 mb-1 md:mb-0">
              ANSWER
            </span>
            <span className="text-xl tracking-widest font-black text-charcoal">
              {gameStatus !== 'PLAYING' ? targetEntity.name.toUpperCase() : '??????'}
            </span>
            {gameStatus === 'PLAYING' && !showRevealConfirm && (
              <button
                onClick={() => setShowRevealConfirm(true)}
                className="mt-2 md:mt-0 border border-charcoal px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-charcoal hover:bg-charcoal hover:text-paper-white transition-colors touch-manipulation min-h-[36px]"
              >
                Reveal Answer
              </button>
            )}
            {gameStatus === 'PLAYING' && showRevealConfirm && (
              <div className="mt-2 md:mt-0 flex items-center gap-2">
                <span className="text-[10px] font-mono text-charcoal/70">End your game?</span>
                <button
                  onClick={() => { revealAnswer(); setShowRevealConfirm(false); }}
                  className="border border-charcoal px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-charcoal hover:bg-charcoal hover:text-paper-white transition-colors touch-manipulation min-h-[36px]"
                >
                  Yes, Reveal
                </button>
                <button
                  onClick={() => setShowRevealConfirm(false)}
                  className="border border-charcoal/40 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-charcoal/60 hover:border-charcoal hover:text-charcoal transition-colors touch-manipulation min-h-[36px]"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <GameOverModal
            isOpen={
              gameStatus === 'SOLVED' &&
              tutorialStep === null &&
              !(activeMode === 'daily' && dailyGameOverDismissed)
            }
            targetEntity={targetEntity}
            moves={moves}
            activeCategory={activeCategory}
            activeMode={activeMode}
            guesses={guesses}
            schema={gameData.schemaConfig[activeCategory] || []}
            dailyMeta={dailyMeta[activeCategory]}
            dateString={todayDateString}
            onReset={handleReset}
            onSwitchToFreePlay={handleSwitchToFreePlay}
            onDismissDaily={() => setDailyGameOverDismissed(true)}
          />

          <RevealAnswerModal
            isOpen={
              gameStatus === 'REVEALED' &&
              tutorialStep === null &&
              !(activeMode === 'daily' && dailyRevealDismissed)
            }
            targetEntity={targetEntity}
            schema={gameData.schemaConfig[activeCategory] || []}
            activeMode={activeMode}
            onNewGame={handleReset}
            onSwitchToFreePlay={handleSwitchToFreePlay}
            onDismissDaily={() => setDailyRevealDismissed(true)}
          />

          <HowToPlayModal
            isOpen={showHowToPlay && tutorialStep === null}
            onClose={handleCloseHowToPlay}
          />

          <PrivacyPolicyModal
            isOpen={showPrivacyPolicy}
            onClose={() => setShowPrivacyPolicy(false)}
          />
        </main>

        {/* Footer */}
        <footer className="py-4 text-center font-mono flex items-center justify-center gap-2">
          <a
            href="https://www.samirhusain.info"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-3 py-2 -mx-3 -my-2 text-[10px] text-charcoal/40 hover:text-charcoal/70 font-bold uppercase tracking-widest transition-colors underline underline-offset-2"
          >
            Built by Samir Husain
          </a>
          <span className="text-charcoal/30 text-[10px]">&middot;</span>
          <button
            onClick={() => setShowPrivacyPolicy(true)}
            className="text-[10px] text-charcoal/40 hover:text-charcoal/70 font-bold uppercase tracking-widest transition-colors underline underline-offset-2"
          >
            Privacy Policy
          </button>
          <span className="text-charcoal/30 text-[10px]">&middot;</span>
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSeAPZsI6lxoo4WZIz3o5Vr0dpKqgPVK_GgDrYyVoGuHeSeyIg/viewform?usp=publish-editor"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-charcoal/40 hover:text-charcoal/70 font-bold uppercase tracking-widest transition-colors underline underline-offset-2"
          >
            Submit Feedback
          </a>
        </footer>

      </div>

      <Analytics debug={import.meta.env.DEV} />

      {/* Interactive tutorial overlay — shown only for first-time users */}
      {tutorialStep !== null && (
        <TutorialOverlay
          steps={TUTORIAL_STEPS}
          currentStep={tutorialStep}
          onNext={() => setTutorialStep(prev => Math.min((prev ?? 0) + 1, TUTORIAL_STEPS.length - 1))}
          onBack={() => setTutorialStep(prev => Math.max((prev ?? 1) - 1, 0))}
          onSkip={skipTutorial}
          onComplete={completeTutorial}
        />
      )}

      {/* Share Challenge Button — fixed bottom-right */}
      <button
        onClick={async () => {
          const hash = encodeChallenge(activeCategory, targetEntity.id, moves);
          const url = `${window.location.origin}${window.location.pathname}?challenge=${hash}`;
          const shareMessage = `Check out Scalar — a logic guessing game!`;
          const clipboardText = `Check out Scalar! ${url}`;
          try {
            if (navigator.share) {
              await navigator.share({ title: 'Scalar', text: shareMessage, url });
            } else {
              await navigator.clipboard.writeText(clipboardText);
              setShareCopied(true);
              setTimeout(() => setShareCopied(false), 2000);
            }
          } catch {
            // User cancelled share or clipboard denied — ignore
          }
        }}
        className={cn(
          "fixed bottom-4 right-4 z-50 flex items-center gap-1.5 border border-charcoal bg-paper-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-charcoal hover:bg-charcoal hover:text-paper-white transition-all duration-300",
          shareVisible ? "translate-y-0" : "translate-y-24"
        )}
      >
        <Share2 size={12} />
        {shareCopied ? 'Copied!' : 'Share'}
      </button>
    </div>
  );
}

export default App;
