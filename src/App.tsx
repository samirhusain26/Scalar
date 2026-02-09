import { useEffect, useState } from 'react';
import { GameGrid } from './components/GameGrid';
import { GameInput } from './components/GameInput';
import { GameOverModal } from './components/GameOverModal';
import { RevealAnswerModal } from './components/RevealAnswerModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { Scoreboard } from './components/Scoreboard';
import { useGameStore } from './store/gameStore';
import gameDataRaw from './assets/data/gameData.json';
import type { GameData } from './types';
import { cn } from './utils/cn';

const gameData = gameDataRaw as unknown as GameData;
const CATEGORIES = Object.keys(gameData.categories);

const HTP_STORAGE_KEY = 'scalar-htp-seen';

function App() {
  const gameStatus = useGameStore(state => state.gameStatus);
  const resetGame = useGameStore(state => state.resetGame);
  const revealAnswer = useGameStore(state => state.revealAnswer);
  const targetEntity = useGameStore(state => state.targetEntity);
  const activeCategory = useGameStore(state => state.activeCategory);
  const setActiveCategory = useGameStore(state => state.setActiveCategory);
  const guesses = useGameStore(state => state.guesses);
  const score = useGameStore(state => state.score);
  const par = useGameStore(state => state.par);
  const columnVisibility = useGameStore(state => state.columnVisibility);

  const [showHowToPlay, setShowHowToPlay] = useState(() => {
    return !localStorage.getItem(HTP_STORAGE_KEY);
  });

  const handleCloseHowToPlay = () => {
    setShowHowToPlay(false);
    localStorage.setItem(HTP_STORAGE_KEY, '1');
  };

  // Implement the "Win Effect" (invert colors)
  useEffect(() => {
    if (gameStatus === 'SOLVED') {
      const timer = setTimeout(() => {
        document.documentElement.classList.add('invert');
        setTimeout(() => document.documentElement.classList.remove('invert'), 500);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [gameStatus]);

  return (
    <div className="min-h-screen bg-paper-white flex flex-col items-center justify-center p-4 font-mono">
      {/* HEADER TITLE */}
      <h1 className="text-4xl md:text-6xl font-black text-charcoal tracking-tighter mb-1 uppercase select-none">
        SCALAR
      </h1>
      <p className="text-xs md:text-sm text-charcoal/50 font-bold uppercase tracking-widest mb-1">
        Daily Logic
      </p>
      <button
        onClick={() => setShowHowToPlay(true)}
        className="text-[10px] md:text-xs text-charcoal/40 hover:text-charcoal/70 font-bold uppercase tracking-widest mb-6 transition-colors underline underline-offset-2"
      >
        How to Play
      </button>

      {/* Desktop Container */}
      <div className="w-full max-w-6xl lg:p-8 lg:bg-paper-white transition-all duration-300 min-h-[80vh] flex flex-col relative overflow-hidden">

        {/* Category Selector */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-3 py-1 text-xs md:text-sm font-bold uppercase border transition-all duration-200",
                  activeCategory === cat
                    ? "bg-charcoal text-paper-white border-charcoal"
                    : "bg-transparent text-charcoal border-transparent hover:border-gray-300"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Header / Top Bar */}
        <header className="mb-6 flex justify-between items-center border-b border-charcoal pb-4 font-mono">
          {/* LEFT: CATEGORY */}
          <div className="flex-1 flex items-center justify-start">
            <span className="text-sm sm:text-base font-bold text-charcoal uppercase">
              {activeCategory}
            </span>
          </div>

          {/* CENTER: TARGET */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-charcoal/60 mb-1">
              ANSWER
            </span>
            <div className="text-xl tracking-widest font-black text-charcoal">
              {gameStatus !== 'PLAYING' ? targetEntity.name.substring(0, 8).toUpperCase() : '??????'}
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

          {/* RIGHT: SCORE */}
          <div className="flex-1 flex items-center justify-end">
            <Scoreboard />
          </div>
        </header>

        {/* Main Game Area */}
        <main className="flex-1 flex flex-col w-full">
          <GameGrid />

          <div className="flex-1" /> {/* Spacer */}

          <GameInput />

          <GameOverModal
            isOpen={gameStatus === 'SOLVED'}
            targetEntity={targetEntity}
            guesses={guesses}
            score={score}
            par={par}
            columnVisibility={columnVisibility}
            onReset={resetGame}
          />

          <RevealAnswerModal
            isOpen={gameStatus === 'REVEALED'}
            targetEntity={targetEntity}
            schema={gameData.schema[activeCategory] || {}}
            onNewGame={resetGame}
          />

          <HowToPlayModal
            isOpen={showHowToPlay}
            onClose={handleCloseHowToPlay}
          />
        </main>

      </div>
    </div>
  );
}

export default App;
