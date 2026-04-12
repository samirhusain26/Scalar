import { useLocation, useNavigate } from 'react-router-dom';
import { Search, ArrowUpDown } from 'lucide-react';
import { cn } from '../utils/cn';

const NAV_ITEMS = [
  { path: '/', label: 'Scalar', icon: Search },
  { path: '/continuum', label: 'Continuum', icon: ArrowUpDown },
] as const;

export function GameNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="hidden md:block fixed bottom-0 left-0 right-0 z-50 bg-paper-white border-t-2 border-charcoal font-mono safe-area-bottom">
      <div className="flex items-stretch justify-around max-w-lg mx-auto">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                'flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors touch-manipulation',
                isActive
                  ? 'bg-charcoal text-paper-white'
                  : 'text-charcoal/50 hover:text-charcoal hover:bg-charcoal/5'
              )}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="text-[9px] font-bold uppercase tracking-[0.15em]">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
