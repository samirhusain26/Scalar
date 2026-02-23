import { useEffect, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { Share2 } from 'lucide-react';
import { GameGrid } from './components/GameGrid';
import { GameInput } from './components/GameInput';
import { GameOverModal } from './components/GameOverModal';
import { RevealAnswerModal } from './components/RevealAnswerModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { Scoreboard } from './components/Scoreboard';
import { ScalarLogo } from './components/ScalarLogo';
import { VennBackground } from './components/VennBackground';
import { useGameStore } from './store/gameStore';
import { decodeChallenge, encodeChallenge } from './utils/challengeUtils';
import gameDataRaw from './assets/data/gameData.json';
import type { GameData } from './types';

const gameData = gameDataRaw as unknown as GameData;
const CATEGORIES = Object.keys(gameData.categories);

const HTP_STORAGE_KEY = 'scalar-htp-seen';

function App() {
  const gameStatus = useGameStore(state => state.gameStatus);
  const resetGame = useGameStore(state => state.resetGame);
  const revealAnswer = useGameStore(state => state.revealAnswer);
  const startChallengeGame = useGameStore(state => state.startChallengeGame);
  const targetEntity = useGameStore(state => state.targetEntity);
  const activeCategory = useGameStore(state => state.activeCategory);
  const setActiveCategory = useGameStore(state => state.setActiveCategory);
  const moves = useGameStore(state => state.moves);
  const [showHowToPlay, setShowHowToPlay] = useState(() => {
    return !localStorage.getItem(HTP_STORAGE_KEY);
  });
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

  const handleCloseHowToPlay = () => {
    setShowHowToPlay(false);
    localStorage.setItem(HTP_STORAGE_KEY, '1');
  };

  // Challenge URL detection
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const challengeHash = params.get('challenge');
    if (challengeHash) {
      const result = decodeChallenge(challengeHash);
      if (result) {
        startChallengeGame(result.category, result.entity);
      }
      // Clean up URL to prevent re-triggering on refresh
      const url = new URL(window.location.href);
      url.searchParams.delete('challenge');
      window.history.replaceState({}, '', url.pathname);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    <div className="min-h-screen bg-paper-white flex flex-col items-center justify-center p-4 font-mono relative">
      <VennBackground />

      {/* HEADER TITLE */}
      <div className="relative flex items-center justify-center mb-1" style={{ height: '120px' }}>
        <ScalarLogo size={160} className="absolute opacity-50" />
        <h1 className="relative text-4xl md:text-6xl text-charcoal tracking-[0.12em] uppercase select-none font-serif-display font-light">
          SCALAR
        </h1>
      </div>

      {/* Desktop Container */}
      <div className="w-full max-w-6xl lg:p-8 lg:bg-paper-white transition-all duration-300 min-h-[80vh] flex flex-col relative overflow-hidden">

        {/* Header / Top Bar */}
        <header className="mb-6 border-b-venn pb-4 font-mono relative z-30">
          {/* Mobile layout: stacked rows, all centered */}
          <div className="flex flex-col gap-3 items-center md:hidden">
            {/* Row 1: Category dropdown */}
            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              className="text-xs font-bold uppercase tracking-wide bg-transparent border border-charcoal px-2 py-1 text-charcoal cursor-pointer font-mono focus:outline-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Row 2: Input */}
            <GameInput />

            {/* Row 3: Score + How to Play */}
            <div className="flex items-center gap-3">
              <Scoreboard />
              <div className="h-4 w-px bg-graphite" />
              <button
                onClick={() => setShowHowToPlay(true)}
                className="text-[10px] text-charcoal/40 hover:text-charcoal/70 font-bold uppercase tracking-widest transition-colors underline underline-offset-2"
              >
                How to Play
              </button>
            </div>
          </div>

          {/* Desktop layout: single row with centered input */}
          <div className="hidden md:flex items-center justify-between">
            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              className="text-sm font-bold uppercase tracking-wide bg-transparent border border-charcoal px-2 py-1 text-charcoal cursor-pointer font-mono focus:outline-none shrink-0"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <div className="absolute left-1/2 -translate-x-1/2">
              <GameInput />
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Scoreboard />
              <div className="h-4 w-px bg-graphite" />
              <button
                onClick={() => setShowHowToPlay(true)}
                className="text-xs text-charcoal/40 hover:text-charcoal/70 font-bold uppercase tracking-widest transition-colors underline underline-offset-2"
              >
                How to Play
              </button>
            </div>
          </div>
        </header>

        {/* Main Game Area */}
        <main className="flex-1 flex flex-col w-full">

          <GameGrid />

          <div className="flex-1" />

          {/* ANSWER */}
          <div className="flex flex-col items-center justify-center py-6 border-t border-graphite mt-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-charcoal/60 mb-1">
              ANSWER
            </span>
            <div className="text-xl tracking-widest font-black text-charcoal">
              {gameStatus !== 'PLAYING' ? targetEntity.name.substring(0, 12).toUpperCase() : '??????'}
            </div>
            {gameStatus === 'PLAYING' && (
              <button
                onClick={revealAnswer}
                className="mt-1 text-[10px] text-charcoal/40 hover:text-charcoal/70 font-bold uppercase tracking-widest transition-colors underline underline-offset-2"
              >
                Reveal Answer
              </button>
            )}
          </div>

          <GameOverModal
            isOpen={gameStatus === 'SOLVED'}
            targetEntity={targetEntity}
            moves={moves}
            activeCategory={activeCategory}
            onReset={resetGame}
          />

          <RevealAnswerModal
            isOpen={gameStatus === 'REVEALED'}
            targetEntity={targetEntity}
            schema={gameData.schemaConfig[activeCategory] || []}
            onNewGame={resetGame}
          />

          <HowToPlayModal
            isOpen={showHowToPlay}
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
        </footer>

      </div>

      <Analytics debug={import.meta.env.DEV} />

      {/* Share Challenge Button — fixed bottom-right */}
      <button
        onClick={async () => {
          const hash = encodeChallenge(activeCategory, targetEntity.id);
          const url = `${window.location.origin}${window.location.pathname}?challenge=${hash}`;
          try {
            if (navigator.share) {
              await navigator.share({ title: 'Scalar Challenge', url });
            } else {
              await navigator.clipboard.writeText(url);
            }
          } catch {
            // User cancelled share or clipboard denied — ignore
          }
        }}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 border border-charcoal bg-paper-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-charcoal hover:bg-charcoal hover:text-paper-white transition-colors"
      >
        <Share2 size={12} />
        Share
      </button>
    </div>
  );
}

export default App;
