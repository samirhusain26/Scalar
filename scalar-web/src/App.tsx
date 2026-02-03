import { useEffect } from 'react';
import { GameGrid } from './components/GameGrid';
import { GameInput } from './components/GameInput';
import { GameOverModal } from './components/GameOverModal';
import { useGameStore } from './store/gameStore';
import gameDataRaw from './assets/data/gameData.json';
import { cn } from './utils/cn';
import type { GameMode } from './types';

const gameData = gameDataRaw as any;
const CATEGORIES = Object.keys(gameData.categories);
// const EXCLUDED_MODES: GameMode[] = []; // Can use to hide modes if needed
const GAME_MODES: GameMode[] = ['EASIER', 'EASY', 'REGULAR', 'HARD', 'HARDEST'];

function App() {
  const gameStatus = useGameStore(state => state.gameStatus);
  const resetGame = useGameStore(state => state.resetGame);
  const targetEntity = useGameStore(state => state.targetEntity);
  const activeCategory = useGameStore(state => state.activeCategory);
  const setActiveCategory = useGameStore(state => state.setActiveCategory);

  const guesses = useGameStore(state => state.guesses);
  const maxGuesses = useGameStore(state => state.maxGuesses);
  const gameMode = useGameStore(state => state.gameMode);
  const setGameMode = useGameStore(state => state.setGameMode);

  // Implement the "Win Effect" (invert colors)
  useEffect(() => {
    if (gameStatus === 'WON') {
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
      <h1 className="text-4xl md:text-6xl font-black text-charcoal tracking-tighter mb-6 uppercase select-none">
        SCALAR
      </h1>

      {/* Desktop Container: Simulates handheld device on larger screens */}
      <div className="w-full max-w-6xl lg:rounded-[2rem] lg:p-8 lg:bg-paper-white lg:shadow-2xl transition-all duration-300 min-h-[80vh] flex flex-col relative overflow-hidden">

        {/* Category Selector Tabs */}
        <div className="flex flex-col gap-4 mb-6">
          {/* Row 1: Categories */}
          <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-3 py-1 text-xs md:text-sm font-bold uppercase border-2 transition-all duration-200",
                  activeCategory === cat
                    ? "bg-charcoal text-paper-white border-charcoal"
                    : "bg-transparent text-charcoal border-transparent hover:border-gray-300"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Row 2: Game Modes */}
          <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
            <span className="text-xs font-bold uppercase text-charcoal/50 flex items-center mr-2">DIFFICULTY:</span>
            {GAME_MODES.map(mode => (
              <button
                key={mode}
                onClick={() => setGameMode(mode)}
                className={cn(
                  "px-2 py-0.5 text-[10px] md:text-xs font-bold uppercase border-2 transition-all duration-200",
                  gameMode === mode
                    ? "bg-charcoal text-paper-white border-charcoal"
                    : "bg-transparent text-charcoal border-transparent hover:border-gray-300"
                )}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Header / Top Bar */}
        <header className="mb-6 flex justify-between items-center border-b-4 border-charcoal pb-4 font-mono">
          {/* LEFT: CATEGORY */}
          <div className="flex-1 flex items-center justify-start">
            <span className="text-xs sm:text-sm font-bold uppercase text-charcoal mr-2">
              MODE:
            </span>
            <span className="text-sm sm:text-base font-bold text-charcoal relative">
              {activeCategory}
              <span className="animate-pulse inline-block w-2 h-4 bg-charcoal ml-1 align-middle"></span>
            </span>
          </div>

          {/* CENTER: TARGET */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-charcoal/60 mb-1">
              TARGET
            </span>
            <div className="text-xl tracking-widest font-black text-charcoal">
              {gameStatus !== 'PLAYING' ? targetEntity.name.substring(0, 8).toUpperCase() : '██████'}
            </div>
          </div>

          {/* RIGHT: BATTERY METER */}
          <div className="flex-1 flex flex-col items-end justify-center">
            <div className="flex space-x-1">
              <div className={`flex ${maxGuesses > 20 ? 'flex-wrap justify-end' : 'space-x-1'}`}>
                {gameMode === 'EASIER' ? (
                  <div className="font-bold text-charcoal text-lg">∞</div>
                ) : (
                  Array.from({ length: maxGuesses }).map((_, i) => {
                    const guessesUsed = guesses.length;
                    const isRemaining = i < (maxGuesses - guessesUsed);

                    return (
                      <div
                        key={i}
                        className={`w-3 h-5 sm:w-4 sm:h-6 border-2 border-charcoal ${isRemaining
                          ? 'bg-charcoal'
                          : 'bg-transparent'
                          } ${maxGuesses > 12 ? '!w-2 !h-4 sm:!w-3 sm:!h-5' : ''}`} // Smaller bars for high counts
                      />
                    );
                  })
                )}
              </div>
              <span className="text-[10px] font-bold uppercase mt-1 text-charcoal">
              </span>
            </div>
          </div>
        </header>

        {/* Main Game Area */}
        <main className="flex-1 flex flex-col w-full">
          <GameGrid />

          <div className="flex-1" /> {/* Spacer */}

          <GameInput />

          <GameOverModal
            isOpen={gameStatus !== 'PLAYING'}
            status={gameStatus === 'PLAYING' ? 'WON' : gameStatus} // Logic handles PLAYING check in isOpen, but strict type needs WON/LOST. 
            targetEntity={targetEntity}
            guesses={guesses}
            maxGuesses={maxGuesses}
            onReset={resetGame}
          />
        </main>

        {/* Decor elements for desktop 'Device' look */}
        <div className="hidden lg:block absolute bottom-4 right-4 w-4 h-4 bg-gray-400 rounded-full opacity-50"></div>
        <div className="hidden lg:block absolute bottom-4 left-4 w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>

      </div>

      {/* Background hint for desktop */}
      <div className="fixed bottom-4 right-4 text-xs font-mono text-gray-400 hidden lg:block">
        SCALAR WEB // E-LINK TERMINAL
      </div>
    </div>
  );
}

export default App;
