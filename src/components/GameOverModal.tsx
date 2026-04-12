import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Share2, Loader2, Image as ImageIcon } from 'lucide-react';
import { toPng } from 'html-to-image';
import { cn } from '../utils/cn';
import { useGameStore } from '../store/gameStore';
import { ElementCellCard } from './ElementCellCard';
import { CountryDetailCard } from './CountryDetailCard';
import { trackGameEvent } from '../utils/analytics';
import { CATEGORY_ICONS, formatDateLabel, getPuzzleNumber, generateShareText } from '../utils/dailyUtils';
import { encodeChallenge } from '../utils/challengeUtils';
import gameDataRaw from '../assets/data/gameData.json';
import type {
    Entity,
    GameData,
    GameMode,
    DailyMeta,
} from '../types';

const gameData = gameDataRaw as unknown as GameData;

const supportsShare = typeof navigator !== 'undefined' && 'share' in navigator;

function downloadPng(dataUrl: string) {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'scalar-result.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

interface GameOverModalProps {
    isOpen: boolean;
    targetEntity: Entity;
    moves: number;
    activeCategory: string;
    activeMode: GameMode;
    dailyMeta?: DailyMeta;
    dateString: string;
    shareCardRef: React.RefObject<HTMLDivElement | null>;
    onReset: () => void;
    /** Called when the user closes the modal via X / overlay in daily mode. */
    onDismissDaily: () => void;
}

export function GameOverModal({
    isOpen,
    targetEntity,
    moves,
    activeCategory,
    activeMode,
    dailyMeta,
    dateString,
    shareCardRef,
    onReset,
    onDismissDaily,
}: GameOverModalProps) {
    const navigate = useNavigate();

    const [blobReady, setBlobReady] = useState(false);
    const [shareState, setShareState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
    const [textCopied, setTextCopied] = useState(false);
    const filePromiseRef = useRef<Promise<File> | null>(null);
    const dataUrlRef = useRef<string | null>(null);

    // Pre-generate the share image as soon as the modal opens so it's ready
    // the moment the user taps Share — keeping us within the browser's
    // user-gesture window when we call navigator.share().
    useEffect(() => {
        if (!isOpen) {
            filePromiseRef.current = null;
            dataUrlRef.current = null;
            setBlobReady(false);
            setShareState('idle');
            return;
        }

        const node = shareCardRef.current;
        if (!node) return;

        const promise = toPng(node, {
            pixelRatio: 2,
            cacheBust: true,
            style: { position: 'static', left: 'auto', top: 'auto' },
        }).then(async (dataUrl) => {
            dataUrlRef.current = dataUrl;
            const blob = await (await fetch(dataUrl)).blob();
            return new File([blob], 'scalar-result.png', { type: 'image/png' });
        });

        filePromiseRef.current = promise;
        promise.then(() => setBlobReady(true)).catch(() => setBlobReady(false));
    }, [isOpen, shareCardRef]);

    const buildShareText = () => {
        const icon = CATEGORY_ICONS[activeCategory] ?? '🎮';
        const catName = activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1);
        const header = activeMode === 'daily'
            ? `SCALAR Daily #${getPuzzleNumber(dateString)} (${formatDateLabel(dateString)}) • ${icon} ${catName} • ${moves} Moves`
            : `SCALAR • ${icon} ${catName} • ${moves} Moves`;
        const url = activeMode === 'daily'
            ? 'https://scalargame.com'
            : `${window.location.origin}${window.location.pathname}?challenge=${encodeChallenge(activeCategory, targetEntity.id, moves)}`;
        return `${header}\n${url}`;
    };

    const handleShareText = async () => {
        const schema = gameData.schemaConfig[activeCategory] || [];
        const text = generateShareText(activeMode, dateString, activeCategory, moves, guesses, schema, targetEntity.id);
        try {
            if (supportsShare) {
                await navigator.share({ title: 'Scalar', text });
            } else {
                await navigator.clipboard.writeText(text);
                setTextCopied(true);
                setTimeout(() => setTextCopied(false), 2000);
            }
            trackGameEvent('challenge_shared', { category: activeCategory, mode: activeMode });
        } catch {
            // User cancelled or clipboard denied — ignore
        }
    };

    const handleShare = async () => {
        if (!filePromiseRef.current) return;
        setShareState('busy');
        try {
            const file = await filePromiseRef.current;
            const text = buildShareText();

            if (supportsShare) {
                try {
                    await navigator.share({ files: [file], text, title: 'Scalar' });
                } catch (err) {
                    if (err instanceof Error && err.name === 'AbortError') {
                        setShareState('idle');
                        return;
                    }
                    // Files not supported by this browser — fall back to download
                    if (dataUrlRef.current) downloadPng(dataUrlRef.current);
                }
            } else {
                // Desktop without Web Share API — download the image
                if (dataUrlRef.current) downloadPng(dataUrlRef.current);
            }

            trackGameEvent('image_shared', { category: activeCategory, mode: activeMode });
            setShareState('done');
            setTimeout(() => setShareState('idle'), 2000);
        } catch {
            setShareState('error');
            setTimeout(() => setShareState('idle'), 2000);
        }
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            if (activeMode === 'daily') {
                onDismissDaily();
            } else if (useGameStore.getState().gameStatus === 'SOLVED') {
                onReset();
            }
        }
    };

    const guesses = useGameStore(state => state.guesses);
    const streak = dailyMeta?.currentStreak ?? 0;
    const maxStreak = dailyMeta?.maxStreak ?? 0;

    return (
        <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <Dialog.Content
                    className={cn(
                    "fixed z-50 bg-paper-white shadow-hard focus:outline-none",
                    "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-md border border-charcoal",
                    "max-h-[85dvh] flex flex-col",
                    "data-[state=open]:animate-in data-[state=closed]:animate-out",
                    "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                    "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                )}>

                    {/* Sticky header */}
                    <div className="shrink-0 relative">
                        <Dialog.Title className="w-full text-lg font-black uppercase tracking-wider py-2 px-4 border-b border-charcoal bg-charcoal text-paper-white font-serif-display text-center">
                            Puzzle Complete
                        </Dialog.Title>
                        <Dialog.Close className="absolute right-3 top-1/2 -translate-y-1/2 z-50 p-2 text-paper-white hover:text-paper-white/70 transition-colors" aria-label="Close">
                            <X size={20} />
                        </Dialog.Close>
                    </div>

                    <Dialog.Description className="sr-only">
                        Puzzle completion summary
                    </Dialog.Description>

                    {/* Body: card has fixed max-height so footer always shows */}
                    <div className="flex flex-col px-3 pt-2 pb-2 gap-2">

                        {/* Daily badge */}
                        {activeMode === 'daily' && (
                            <div className="w-full flex items-center justify-center">
                                <span className="bg-charcoal text-paper-white font-mono text-[10px] font-bold uppercase tracking-widest px-3 py-1">
                                    Daily · {dateString.slice(5).replace('-', '/')}
                                </span>
                            </div>
                        )}

                        {/* Entity card — capped height, scrolls internally */}
                        <div className="max-h-[30vh] overflow-y-auto w-full">
                            {activeCategory === 'elements' ? (
                                <ElementCellCard
                                    entity={targetEntity}
                                    schema={gameData.schemaConfig[activeCategory] || []}
                                />
                            ) : activeCategory === 'countries' ? (
                                <CountryDetailCard entity={targetEntity} />
                            ) : (
                                <div className="flex flex-col items-center gap-2">
                                    {typeof targetEntity.image === 'string' && targetEntity.image && (
                                        <img
                                            src={targetEntity.image}
                                            alt={targetEntity.name}
                                            className="w-16 h-16 object-contain border border-charcoal/20"
                                        />
                                    )}
                                    <span className="text-2xl font-black uppercase tracking-wide">{targetEntity.name}</span>
                                </div>
                            )}
                        </div>

                        {/* Total Moves */}
                        <div className="font-mono text-sm font-bold text-charcoal/70 tracking-wide text-center">
                            <span className="text-charcoal font-black text-lg">{moves}</span> Moves
                        </div>

                        {/* Daily streak */}
                        {activeMode === 'daily' && streak > 0 && (
                            <div className="font-mono text-xs text-charcoal/70 text-center">
                                🔥 <strong>{streak}</strong> day streak
                                {maxStreak > streak && (
                                    <span className="text-charcoal/40 ml-2">· Best: {maxStreak}</span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Sticky footer buttons */}
                    <div className="shrink-0 flex flex-col gap-2 px-3 pt-2 pb-3 border-t border-charcoal/20">
                        {/* Share row: text share (primary) + image share (secondary, narrow) */}
                        <div className="flex gap-2">
                            <button
                                onClick={handleShareText}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-charcoal text-paper-white font-bold border border-charcoal hover:bg-paper-white hover:text-charcoal transition-colors uppercase text-sm tracking-wide"
                            >
                                <Share2 size={14} />
                                <span>{textCopied ? 'Copied!' : 'Share Result'}</span>
                            </button>
                            <button
                                onClick={handleShare}
                                disabled={shareState === 'busy' || shareState === 'done'}
                                title="Share image"
                                className="flex items-center justify-center gap-1.5 px-4 py-2 border border-charcoal font-bold hover:bg-charcoal hover:text-paper-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {shareState === 'busy' || (!blobReady && shareState === 'idle')
                                    ? <Loader2 size={14} className="animate-spin" />
                                    : <ImageIcon size={14} />
                                }
                            </button>
                        </div>

                        {activeMode === 'daily' ? (
                            <button
                                onClick={() => navigate('/continuum')}
                                className="w-full px-4 py-2 border border-charcoal font-bold hover:bg-charcoal hover:text-paper-white transition-colors uppercase text-sm tracking-wide"
                            >
                                Play Continuum →
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={onReset}
                                    className="w-full px-4 py-2 border border-charcoal font-bold hover:bg-charcoal hover:text-paper-white transition-colors uppercase text-sm tracking-wide"
                                >
                                    Play Again
                                </button>
                                <button
                                    onClick={() => navigate('/continuum')}
                                    className="text-center text-[10px] font-bold uppercase tracking-widest text-charcoal/40 hover:text-charcoal/70 transition-colors underline underline-offset-2"
                                >
                                    Try Continuum →
                                </button>
                            </>
                        )}

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
