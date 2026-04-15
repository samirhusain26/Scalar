import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Dialog from '@radix-ui/react-dialog';
import { Flag, RotateCcw, Share2, Menu, X, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useContinuumStore, MAX_LIVES } from '../store/continuumStore';
import type { Entity, GameData, SchemaField } from '../types';
import gameDataRaw from '../assets/data/gameData.json';
import { cn } from '../utils/cn';
import { formatNumber } from '../utils/formatters';
import { CATEGORY_ICONS, generateContinuumShareText } from '../utils/dailyUtils';
import { CONTINUUM_METRICS } from '../utils/continuumConfig';
import { CONTINUUM_TUTORIAL_STEPS } from '../utils/continuumTutorialConfig';
import { VennBackground } from './VennBackground';
import { ContinuumLogo } from './ContinuumLogo';
import { PrivacyPolicyModal } from './PrivacyPolicyModal';
import { TutorialOverlay } from './TutorialOverlay';

const TUTORIAL_KEY = 'continuum-tutorial-seen';

const gameData = gameDataRaw as unknown as GameData;

const FLICKER_MS = 420;
const SLIDE_MS   = 320;

const FEEDBACK_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSeAPZsI6lxoo4WZIz3o5Vr0dpKqgPVK_GgDrYyVoGuHeSeyIg/viewform?usp=publish-editor';

// ── Shared footer ─────────────────────────────────────────────────────────────

function ContinuumFooter({ onPrivacy }: { onPrivacy: () => void }) {
  return (
    <footer className="shrink-0 py-2 text-center font-mono flex items-center justify-center gap-2 bg-paper-white/80">
      <a
        href="https://www.samirhusain.info"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[9px] text-charcoal/35 hover:text-charcoal/60 font-bold uppercase tracking-widest transition-colors underline underline-offset-2"
      >
        Built by Samir Husain
      </a>
      <span className="text-charcoal/25 text-[9px]">&middot;</span>
      <button
        onClick={onPrivacy}
        className="text-[9px] text-charcoal/35 hover:text-charcoal/60 font-bold uppercase tracking-widest transition-colors underline underline-offset-2"
      >
        Privacy Policy
      </button>
      <span className="text-charcoal/25 text-[9px]">&middot;</span>
      <a
        href={FEEDBACK_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[9px] text-charcoal/35 hover:text-charcoal/60 font-bold uppercase tracking-widest transition-colors underline underline-offset-2"
      >
        Submit Feedback
      </a>
    </footer>
  );
}

// ── Logo strip ────────────────────────────────────────────────────────────────

function ContinuumLogoStrip() {
  return (
    <div className="shrink-0 flex flex-col items-center pt-4 pb-2">
      <ContinuumLogo />
    </div>
  );
}

// ── Haptics ───────────────────────────────────────────────────────────────────

const vibrate = (pattern: number | number[]) => {
  try { navigator.vibrate?.(pattern); } catch { /* unsupported */ }
};

// ── Value formatting ──────────────────────────────────────────────────────────

function getField(category: string, key: string): SchemaField | undefined {
  return (gameData.schemaConfig[category] as SchemaField[] | undefined)
    ?.find(f => f.attributeKey === key);
}

function fmtVal(val: number, key: string, category: string): string {
  const f = getField(category, key);
  const n = formatNumber(val, 2, f?.displayLabel ?? key);
  return f?.displayFormat === 'CURRENCY' ? `$${n}` : n;
}

// ── Lives indicator ───────────────────────────────────────────────────────────

function LivesDisplay({ lives }: { lives: number }) {
  return (
    <div className="flex gap-1.5 items-center">
      {Array.from({ length: MAX_LIVES }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'w-2.5 h-2.5 border border-charcoal transition-colors duration-200',
            i < lives ? 'bg-charcoal' : 'bg-transparent',
          )}
        />
      ))}
    </div>
  );
}

// ── Drop gap ──────────────────────────────────────────────────────────────────

interface DropGapProps {
  isActive: boolean;
  isTop?: boolean;
  isBottom?: boolean;
  gapRef: (el: HTMLDivElement | null) => void;
}

function DropGap({ isActive, isTop, isBottom, gapRef }: DropGapProps) {
  const isBoundary = isTop || isBottom;

  return (
    <div
      ref={gapRef}
      className={cn(
        'relative flex items-center justify-center transition-all duration-75',
        isActive ? 'h-12 bg-thermal-green/10' : isBoundary ? 'h-8' : 'h-5',
      )}
    >
      {/* Horizontal rule */}
      <div className={cn(
        'absolute inset-x-0 top-1/2 -translate-y-1/2 transition-all duration-75',
        isActive ? 'h-0.5 bg-thermal-green' : isBoundary ? 'h-px bg-charcoal/40' : 'h-px bg-charcoal/20',
      )} />

      {/* Label pill */}
      <span className={cn(
        'relative z-10 px-2 py-0.5 leading-none bg-paper-white transition-colors duration-75 font-mono font-bold uppercase tracking-widest',
        isActive
          ? 'text-[9px] text-thermal-green border border-thermal-green/50'
          : isBoundary
            ? 'text-[9px] text-charcoal/50 border border-charcoal/20'
            : 'text-[9px] text-charcoal/35',
      )}>
        {isActive
          ? (isTop ? '▲ highest' : isBottom ? '▼ lowest' : '↓ drop here')
          : (isTop ? '▲ highest' : isBottom ? '▼ lowest' : '·')}
      </span>
    </div>
  );
}

// ── Placed card (compact) ─────────────────────────────────────────────────────

interface PlacedCardProps {
  entity: Entity;
  attribute: string;
  category: string;
  isError: boolean;
}

function PlacedCard({ entity, attribute, category, isError }: Omit<PlacedCardProps, 'isAnchor'>) {
  return (
    <motion.div layout layoutId={entity.id} transition={{ type: 'spring', stiffness: 380, damping: 32 }}>
      <div
        className={cn(
          'flex items-center justify-between px-2.5 py-2 font-mono bg-paper-white border-y border-charcoal/10',
          isError && 'border-l-2 border-l-red-500',
        )}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-bold text-charcoal uppercase tracking-wide truncate text-[10px] leading-tight">
            {entity.name}
          </span>
        </div>
        <span className="text-[10px] tabular-nums text-charcoal/55 font-bold ml-2 shrink-0">
          {fmtVal(entity[attribute] as number, attribute, category)}
        </span>
      </div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ContinuumGame() {
  const {
    status,
    category,
    attribute,
    attributeLabel,
    placedCards,
    errorPlacedIds,
    initialAnchorIds,
    currentCard,
    lives,
    score,
    errorCardId,
    startDailyGame,
    startDailyGameForCategory,
    placeCard,
    resolveError,
    reset,
  } = useContinuumStore();

  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

  // Tutorial state — null means hidden, a number is the current step index
  const [tutorialStep, setTutorialStep] = useState<number | null>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tutorial') !== null) {
      localStorage.removeItem(TUTORIAL_KEY);
      return 0;
    }
    return !localStorage.getItem(TUTORIAL_KEY) ? 0 : null;
  });

  // Remove ?tutorial param from URL after it has been consumed
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tutorial') !== null) {
      const url = new URL(window.location.href);
      url.searchParams.delete('tutorial');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  const completeTutorial = () => {
    localStorage.setItem(TUTORIAL_KEY, '1');
    setTutorialStep(null);
  };

  const resolveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-start daily whenever IDLE
  useEffect(() => {
    if (status === 'IDLE') startDailyGame();
  }, [status, startDailyGame]);

  // Error animation timer + haptic buzz
  useEffect(() => {
    if (status !== 'ERROR' || !errorCardId) return;
    vibrate([60, 50, 60, 50, 120]); // strong stutter pattern for wrong placement
    resolveTimerRef.current = setTimeout(resolveError, FLICKER_MS + SLIDE_MS);
    return () => { if (resolveTimerRef.current) clearTimeout(resolveTimerRef.current); };
  }, [status, errorCardId, resolveError]);

  const canPlace = status === 'PLAYING' && currentCard !== null;

  // ── Drag state ──
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [activeGap, setActiveGap] = useState<number | null>(null);
  const isDragging = dragPos !== null;

  const timelineRef = useRef<HTMLDivElement>(null);
  const gapRefs = useRef<(HTMLDivElement | null)[]>([]);
  gapRefs.current = new Array(placedCards.length + 1).fill(null);

  const findActiveGap = useCallback((clientY: number): number | null => {
    const tEl = timelineRef.current;
    if (!tEl) return null;
    const tRect = tEl.getBoundingClientRect();
    if (clientY < tRect.top - 80 || clientY > tRect.bottom + 80) return null;

    let closest: number | null = null;
    let closestDist = Infinity;
    gapRefs.current.forEach((el, idx) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      const dist = Math.abs(clientY - centerY);
      if (dist < closestDist) {
        closestDist = dist;
        closest = idx;
      }
    });
    return closest;
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!canPlace) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragPos({ x: e.clientX, y: e.clientY });
    setActiveGap(findActiveGap(e.clientY));
  }, [canPlace, findActiveGap]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    setDragPos({ x: e.clientX, y: e.clientY });
    const gap = findActiveGap(e.clientY);
    setActiveGap(prev => {
      if (gap !== prev && gap !== null) vibrate(8); // light tick on gap change
      return gap;
    });
  }, [isDragging, findActiveGap]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const gap = findActiveGap(e.clientY);
    // Visual gap 0 is "above highest" → store insertion index = placedCards.length (end of ascending array)
    if (gap !== null && canPlace) placeCard(placedCards.length - gap);
    setDragPos(null);
    setActiveGap(null);
  }, [isDragging, canPlace, placeCard, findActiveGap, placedCards.length]);

  const isLost = status === 'LOST';

  // ── IDLE / loading ──
  if (status === 'IDLE') {
    return (
      <>
        <VennBackground />
        <div className="max-w-sm md:max-w-md mx-auto w-full flex flex-col h-dvh md:h-[calc(100dvh-3.5rem)]">
          <ContinuumLogoStrip />
          <div className="flex-1 flex items-center justify-center font-mono text-[10px] text-charcoal/30 uppercase tracking-widest">
            Loading…
          </div>
          <ContinuumFooter onPrivacy={() => setShowPrivacyPolicy(true)} />
        </div>
      </>
    );
  }

  // ── PLAYING / ERROR ──
  const gapCount = placedCards.length + 1;
  // Reversed for display: highest value at top, lowest at bottom.
  const displayCards = [...placedCards].reverse();

  return (
    // Mobile: full dvh (no bottom nav). Desktop: subtract GameNav height (3.5rem).
    // Max-width centers the game in a phone-width column on wide screens.
    <>
    <VennBackground />
    <div className="flex flex-col font-mono h-dvh md:h-[calc(100dvh-3.5rem)] max-w-sm md:max-w-md mx-auto w-full">

      <ContinuumLogoStrip />

      {/* ── Header ── */}
      <div className="shrink-0 border-b border-charcoal/15 bg-paper-white/95 backdrop-blur-sm">

        {/* Mobile header row */}
        <div className="md:hidden px-4 py-3 flex items-center gap-3">
          {/* Left: hamburger — same position as Scalar */}
          <button
            onClick={() => setShowMenu(m => !m)}
            className="w-8 h-8 border border-charcoal flex items-center justify-center text-charcoal hover:bg-charcoal hover:text-paper-white transition-colors touch-manipulation shrink-0"
            aria-label="Menu"
          >
            {showMenu ? <X size={13} /> : <Menu size={13} />}
          </button>

          {/* Center: metric label */}
          <div className="flex-1 min-w-0">
            <div className="text-[9px] text-charcoal/35 uppercase tracking-widest mb-0.5 font-mono">
              Rank by
            </div>
            <div className="font-bold uppercase tracking-widest text-charcoal text-sm font-mono truncate">
              {attributeLabel}
            </div>
          </div>

          {/* Right: lives + score */}
          <div className="flex flex-col items-end gap-1 shrink-0" data-tutorial="continuum-lives">
            <LivesDisplay lives={lives} />
            <span className="text-[9px] text-charcoal/35 uppercase tracking-widest tabular-nums">
              {score} placed
            </span>
          </div>
        </div>

        {/* Desktop header row — matches Scalar's desktop layout pattern */}
        <div className="hidden md:flex items-center justify-between px-4 py-3">
          {/* Left: category selector + metric label stacked */}
          <div className="shrink-0 flex flex-col gap-1.5">
            <div className="flex gap-1">
              {Object.keys(CONTINUUM_METRICS).map(cat => {
                const isActive = cat === category;
                return (
                  <button
                    key={cat}
                    onClick={() => { if (!isActive) startDailyGameForCategory(cat); }}
                    className={cn(
                      'flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-widest border transition-colors touch-manipulation',
                      isActive
                        ? 'bg-charcoal text-paper-white border-charcoal'
                        : 'bg-paper-white text-charcoal border-charcoal/30 hover:border-charcoal',
                    )}
                  >
                    <span className="text-xs leading-none">{CATEGORY_ICONS[cat] ?? '🎮'}</span>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                );
              })}
            </div>
            <div>
              <div className="text-[9px] text-charcoal/35 uppercase tracking-widest font-mono">
                Rank by: <span className="text-charcoal font-bold">{attributeLabel}</span>
              </div>
            </div>
          </div>

          {/* Right: lives + score */}
          <div className="flex flex-col items-end gap-1 shrink-0" data-tutorial="continuum-lives">
            <LivesDisplay lives={lives} />
            <span className="text-[9px] text-charcoal/35 uppercase tracking-widest tabular-nums">
              {score} placed
            </span>
          </div>
        </div>

        {/* Mobile slide-down menu */}
        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden border-t border-charcoal/10 md:hidden"
            >
              <div className="px-4 py-3 flex flex-col gap-3">
                {/* Category selector */}
                <div className="flex flex-col gap-1.5">
                  <div className="w-full flex items-center gap-2">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-charcoal/40 shrink-0">Category</span>
                    <div className="flex-1 h-px bg-charcoal/10" />
                  </div>
                  <div className="flex gap-1">
                    {Object.keys(CONTINUUM_METRICS).map(cat => {
                      const isActive = cat === category;
                      return (
                        <button
                          key={cat}
                          onClick={() => {
                            if (!isActive) startDailyGameForCategory(cat);
                            setShowMenu(false);
                          }}
                          className={cn(
                            'flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-[11px] font-bold uppercase tracking-widest border transition-colors touch-manipulation',
                            isActive
                              ? 'bg-charcoal text-paper-white border-charcoal'
                              : 'bg-paper-white text-charcoal border-charcoal/30 hover:border-charcoal',
                          )}
                        >
                          <span className="text-sm leading-none">{CATEGORY_ICONS[cat] ?? '🎮'}</span>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="h-px bg-charcoal/15" />
                {/* Difficulty placeholder */}
                <div className="flex flex-col gap-1.5">
                  <div className="w-full flex items-center gap-2">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-charcoal/40 shrink-0">Difficulty</span>
                    <div className="flex-1 h-px bg-charcoal/10" />
                  </div>
                  <div className="flex gap-1">
                    {(['Novice', 'Scholar', 'Prodigy'] as const).map(d => (
                      <button
                        key={d}
                        disabled
                        className="flex-1 text-[10px] font-bold uppercase tracking-widest text-charcoal/25 border border-charcoal/15 px-2 py-2 cursor-not-allowed"
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                  <span className="text-[8px] text-charcoal/25 uppercase tracking-widest">Coming soon</span>
                </div>
                <div className="h-px bg-charcoal/15" />
                <button
                  onClick={() => navigate('/')}
                  className="w-full flex items-center justify-center gap-2.5 bg-charcoal text-paper-white px-4 py-3 text-[11px] font-bold uppercase tracking-widest hover:opacity-80 active:opacity-70 transition-opacity touch-manipulation shadow-[3px_3px_0px_0px_rgba(24,24,27,0.25)]"
                >
                  <Search size={13} />
                  Play Scalar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Body: split panel ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: timeline — content centered vertically when few cards */}
        <div
          ref={timelineRef}
          data-tutorial="continuum-timeline"
          className="overflow-y-auto border-r border-charcoal/15 bg-paper-white"
          style={{ width: '60%' }}
        >
          {/* Centering wrapper: min-h-full so flex justify-center kicks in when content is short */}
          <div className="min-h-full flex flex-col justify-center">
            {/* Top gap (index 0) */}
            <DropGap
              isActive={isDragging && activeGap === 0}
              isTop
              isBottom={gapCount === 1}
              gapRef={el => { gapRefs.current[0] = el; }}
            />
            {displayCards.map((card, cardIdx) => {
              const gapBelow = cardIdx + 1;
              return (
                <React.Fragment key={card.id}>
                  <PlacedCard
                    entity={card}
                    attribute={attribute}
                    category={category}
                    isError={errorPlacedIds.has(card.id)}
                  />
                  <DropGap
                    isActive={isDragging && activeGap === gapBelow}
                    isBottom={gapBelow === gapCount - 1}
                    gapRef={el => { gapRefs.current[gapBelow] = el; }}
                  />
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Right: current card to drag */}
        <div
          data-tutorial="continuum-card"
          className="flex flex-col items-center justify-center gap-3 p-3"
          style={{ width: '40%' }}
        >
          <AnimatePresence mode="wait">
            {currentCard && status === 'PLAYING' && (
              <motion.div
                key={currentCard.id}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: isDragging ? 0.3 : 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.88 }}
                transition={{ duration: 0.15 }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                style={{ touchAction: 'none', cursor: isDragging ? 'grabbing' : 'grab' }}
                className="w-full bg-charcoal border-2 border-charcoal text-paper-white px-3 py-4 shadow-[3px_3px_0px_0px_#F97316] select-none"
              >
                <div className="text-[8px] text-paper-white/35 uppercase tracking-widest mb-1.5">
                  drag to place
                </div>
                <div className="font-bold uppercase tracking-wide text-sm leading-tight">
                  {currentCard.name}
                </div>
              </motion.div>
            )}
            {status === 'ERROR' && (
              <motion.div
                key="correcting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full border-2 border-dashed border-charcoal/20 h-20 flex items-center justify-center text-[9px] text-charcoal/30 uppercase tracking-widest"
              >
                Correcting…
              </motion.div>
            )}
          </AnimatePresence>

          {!isDragging && canPlace && (
            <p className="text-[8px] text-charcoal/25 uppercase tracking-widest text-center leading-relaxed">
              drag card to the<br />correct position
            </p>
          )}
        </div>
      </div>

      {/* ── Drag ghost ── */}
      {isDragging && dragPos && currentCard && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: dragPos.x,
            top: dragPos.y,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="bg-charcoal text-paper-white px-3 py-2 font-mono text-xs font-bold uppercase tracking-wide shadow-[3px_3px_0px_0px_#F97316] border-2 border-charcoal whitespace-nowrap">
            {currentCard.name}
          </div>
        </div>
      )}

      <ContinuumFooter onPrivacy={() => setShowPrivacyPolicy(true)} />

    </div>

    {/* ── Round Over modal ── */}
    <ContinuumGameOverModal
      isOpen={isLost}
      score={score}
      category={category}
      attribute={attribute}
      attributeLabel={attributeLabel}
      placedCards={placedCards}
      initialAnchorIds={initialAnchorIds}
      errorPlacedIds={errorPlacedIds}
      onPlayAgain={reset}
    />

    <PrivacyPolicyModal isOpen={showPrivacyPolicy} onClose={() => setShowPrivacyPolicy(false)} />

    {/* First-time tutorial overlay */}
    {tutorialStep !== null && (
      <TutorialOverlay
        steps={CONTINUUM_TUTORIAL_STEPS}
        currentStep={tutorialStep}
        onNext={() => setTutorialStep(s => (s ?? 0) + 1)}
        onBack={() => setTutorialStep(s => Math.max(0, (s ?? 0) - 1))}
        onSkip={completeTutorial}
        onComplete={completeTutorial}
      />
    )}
    </>
  );
}

// ── Round Over modal ──────────────────────────────────────────────────────────

type CardRevealType = 'anchor' | 'correct' | 'error';

function RevealCard({
  card, attribute, category, type, rank,
}: {
  card: Entity;
  attribute: string;
  category: string;
  type: CardRevealType;
  rank: number;
}) {
  return (
    <div
      className={cn(
        'border px-3 py-2.5 font-mono text-xs flex items-center justify-between',
        type === 'anchor'  && 'border-l-2 border-l-thermal-green border-y border-r border-charcoal/15 bg-paper-white',
        type === 'correct' && 'border-y border-charcoal/12 bg-paper-white',
        type === 'error'   && 'border-y border-charcoal/12 bg-folded-pattern',
      )}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-[9px] text-charcoal/25 tabular-nums w-5 shrink-0 text-right">
          {rank}.
        </span>
        {type === 'anchor' && (
          <span className="text-[7px] font-bold uppercase tracking-widest text-thermal-green shrink-0 border border-thermal-green/70 px-1 py-px leading-tight">
            REF
          </span>
        )}
        {type === 'error' && (
          <Flag size={9} className="text-charcoal/35 shrink-0" />
        )}
        <span className={cn(
          'font-bold uppercase tracking-wide truncate',
          type === 'error' ? 'text-charcoal/45' : 'text-charcoal',
        )}>
          {card.name}
        </span>
      </div>
      <span className={cn(
        'tabular-nums font-bold ml-2 shrink-0',
        type === 'error' ? 'text-charcoal/35' : 'text-charcoal/60',
      )}>
        {fmtVal(card[attribute] as number, attribute, category)}
      </span>
    </div>
  );
}

interface ContinuumGameOverModalProps {
  isOpen: boolean;
  score: number;
  category: string;
  attribute: string;
  attributeLabel: string;
  placedCards: Entity[];
  initialAnchorIds: Set<string>;
  errorPlacedIds: Set<string>;
  onPlayAgain: () => void;
}

function ContinuumGameOverModal({
  isOpen, score, category, attribute, attributeLabel,
  placedCards, initialAnchorIds, errorPlacedIds, onPlayAgain,
}: ContinuumGameOverModalProps) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const sorted = [...placedCards].sort(
    (a, b) => (a[attribute] as number) - (b[attribute] as number),
  );

  const getType = (card: Entity): CardRevealType => {
    if (initialAnchorIds.has(card.id)) return 'anchor';
    if (errorPlacedIds.has(card.id))   return 'error';
    return 'correct';
  };

  const dateString = useContinuumStore(s => s.dateString);
  const shareText = generateContinuumShareText(dateString, category, score);

  const handleShare = async () => {
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ text: shareText });
      } else {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch { /* cancelled */ }
  };

  return (
    <Dialog.Root open={isOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            'fixed z-50 bg-paper-white shadow-hard focus:outline-none',
            'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-md border border-charcoal',
            'max-h-[85dvh] flex flex-col',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          )}
          // No onEscapeKeyDown / onInteractOutside — modal is sticky until Play Again
          onEscapeKeyDown={e => e.preventDefault()}
          onInteractOutside={e => e.preventDefault()}
        >
          {/* Sticky header */}
          <div className="shrink-0">
            <Dialog.Title className="w-full text-lg font-black uppercase tracking-wider py-2 px-4 border-b border-charcoal bg-charcoal text-paper-white font-mono text-center">
              Round Over
            </Dialog.Title>
          </div>

          <Dialog.Description className="sr-only">
            Round summary for Continuum
          </Dialog.Description>

          {/* Body: fixed height, scrolls internally so footer always visible */}
          <div className="flex flex-col px-3 pt-3 pb-2 gap-3 min-h-0 flex-1 overflow-hidden">
            {/* Score + metric — shrink-0 so it never scrolls away */}
            <div className="shrink-0 text-center font-mono">
              <span className="text-charcoal font-black text-3xl tabular-nums">{score}</span>
              <span className="text-charcoal/60 font-bold text-sm ml-2 uppercase tracking-wide">placed</span>
              <div className="text-[10px] text-charcoal/40 uppercase tracking-widest mt-0.5">{attributeLabel}</div>
            </div>

            {/* Legend — shrink-0 */}
            <div className="shrink-0 flex gap-4 justify-center text-[9px] text-charcoal/40 uppercase tracking-widest">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 border-l-2 border-l-thermal-green border border-charcoal/15 bg-paper-white" />
                Ref
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 border border-charcoal/15 bg-paper-white" />
                Correct
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 border border-charcoal/15 bg-folded-pattern" />
                Wrong
              </span>
            </div>

            {/* Reveal list — scrollable */}
            <div className="overflow-y-auto flex-1 min-h-0">
              <div className="flex flex-col border border-charcoal/15">
                {sorted.map((card, idx) => (
                  <RevealCard
                    key={card.id}
                    card={card}
                    attribute={attribute}
                    category={category}
                    type={getType(card)}
                    rank={idx + 1}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Sticky footer */}
          <div className="shrink-0 flex flex-col gap-2 px-3 pt-2 pb-3 border-t border-charcoal/20">
            <button
              onClick={handleShare}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-charcoal text-paper-white font-bold border border-charcoal hover:bg-paper-white hover:text-charcoal transition-colors uppercase text-sm tracking-wide"
            >
              <Share2 size={14} />
              {copied ? 'Copied!' : 'Share Result'}
            </button>
            <div className="flex gap-2">
              <button
                onClick={onPlayAgain}
                className="flex-1 px-4 py-2 border border-charcoal font-bold hover:bg-charcoal hover:text-paper-white transition-colors uppercase text-sm tracking-wide flex items-center justify-center gap-1.5"
              >
                <RotateCcw size={13} />
                Play Again
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex-1 px-4 py-2 border border-charcoal font-bold hover:bg-charcoal hover:text-paper-white transition-colors uppercase text-sm tracking-wide"
              >
                Play Scalar →
              </button>
            </div>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSeAPZsI6lxoo4WZIz3o5Vr0dpKqgPVK_GgDrYyVoGuHeSeyIg/viewform?usp=publish-editor"
              target="_blank"
              rel="noopener noreferrer"
              className="text-center text-[10px] font-bold uppercase tracking-widest text-charcoal/40 hover:text-charcoal/70 transition-colors underline underline-offset-2"
            >
              Submit Feedback
            </a>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
