import { useEffect, useState } from 'react';
import { GameGrid } from './components/GameGrid';
import { GameInput } from './components/GameInput';
import { GameOverModal } from './components/GameOverModal';
import { RevealAnswerModal } from './components/RevealAnswerModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { Scoreboard } from './components/Scoreboard';
import { ScalarLogo } from './components/ScalarLogo';
import { VennBackground } from './components/VennBackground';
import { useGameStore } from './store/gameStore';
import gameDataRaw from './assets/data/gameData.json';
import type { GameData } from './types';

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

  // Win effect (invert colors)
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
        <header className="mb-6 flex justify-between items-center border-b-venn pb-4 font-mono">
          {/* LEFT: CATEGORY TABS */}
          <div className="flex-1 flex items-center justify-start gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => cat !== activeCategory && setActiveCategory(cat)}
                className={`text-xs sm:text-sm font-bold uppercase tracking-wide transition-colors ${
                  cat === activeCategory
                    ? 'text-charcoal border-b-2 border-charcoal pb-0.5'
                    : 'text-charcoal/40 hover:text-charcoal/70 pb-0.5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* CENTER: TARGET */}
          <div className="flex-1 flex flex-col items-center justify-center">
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

          {/* RIGHT: SCORE + HOW TO PLAY */}
          <div className="flex-1 flex items-center justify-end gap-3">
            <Scoreboard />
            <div className="h-4 w-px bg-graphite" />
            <button
              onClick={() => setShowHowToPlay(true)}
              className="text-[10px] md:text-xs text-charcoal/40 hover:text-charcoal/70 font-bold uppercase tracking-widest transition-colors underline underline-offset-2"
            >
              How to Play
            </button>
          </div>
        </header>

        {/* Main Game Area */}
        <main className="flex-1 flex flex-col w-full">
          <GameGrid />

          <div className="flex-1" />

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
            schema={gameData.schemaConfig[activeCategory] || []}
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
