import { Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { ScalarGame } from './pages/ScalarGame';
import { ContinuumGame } from './components/ContinuumGame';
import { GameNav } from './components/GameNav';

function App() {
  return (
    <div className="min-h-screen bg-paper-white relative overflow-x-hidden pb-14">
      <Routes>
        <Route path="/" element={<ScalarGame />} />
        <Route path="/continuum" element={<ContinuumGame />} />

      </Routes>

      <GameNav />
      <Analytics debug={import.meta.env.DEV} />
    </div>
  );
}

export default App;
