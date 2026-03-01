import { useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { toPng } from 'html-to-image';
import { Share2, X, Loader2, Image as ImageIcon, MessageSquare } from 'lucide-react';
import { cn } from '../utils/cn';
import { trackGameEvent } from '../utils/analytics';
import { generateShareText } from '../utils/dailyUtils';
import type { GameMode, GuessResult, SchemaField } from '../types';

interface SharePopoverProps {
    shareCardRef: React.RefObject<HTMLDivElement | null>;
    containerClassName?: string;
    triggerClassName?: string;
    triggerLabel?: string;
    activeMode: GameMode;
    dateString: string;
    activeCategory: string;
    moves: number;
    guesses: GuessResult[];
    schema: SchemaField[];
    entityId: string;
}

type ActionState = 'idle' | 'busy' | 'done' | 'error';

const supportsShare = typeof navigator !== 'undefined' && 'share' in navigator;

function downloadPng(dataUrl: string) {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'scalar-result.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

async function copyTextToClipboard(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        let ok = false;
        try { ok = document.execCommand('copy'); } catch { /* ignore */ }
        document.body.removeChild(ta);
        return ok;
    }
}

export function SharePopover({
    shareCardRef,
    containerClassName,
    triggerClassName,
    triggerLabel = 'Share',
    activeMode,
    dateString,
    activeCategory,
    moves,
    guesses,
    schema,
    entityId,
}: SharePopoverProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [blobReady, setBlobReady] = useState(false);
    const [imageState, setImageState] = useState<ActionState>('idle');
    const [textState, setTextState] = useState<ActionState>('idle');

    // Holds Promise<Blob> — started when modal opens, passed directly into
    // ClipboardItem on click so Safari never sees an await before clipboard.write().
    const blobPromiseRef = useRef<Promise<Blob> | null>(null);
    const dataUrlRef = useRef<string | null>(null);

    // Pre-generate the image as soon as the modal opens.
    useEffect(() => {
        if (!isOpen) {
            blobPromiseRef.current = null;
            dataUrlRef.current = null;
            setBlobReady(false);
            setImageState('idle');
            setTextState('idle');
            return;
        }

        const node = shareCardRef.current;
        if (!node) return;

        blobPromiseRef.current = toPng(node, {
            pixelRatio: 2,
            cacheBust: true,
            style: { position: 'static', left: 'auto', top: 'auto' },
        }).then(async (dataUrl) => {
            dataUrlRef.current = dataUrl;
            const res = await fetch(dataUrl);
            return res.blob();
        });

        blobPromiseRef.current
            .then(() => setBlobReady(true))
            .catch(() => setBlobReady(false));
    }, [isOpen, shareCardRef]);

    // ── Share Image ─────────────────────────────────────────────────────────
    //
    // NOT async. The entire clipboard setup happens synchronously within the
    // click event so Safari never loses the user-gesture flag:
    //
    //   1. Build (or reuse) the Promise<Blob> — synchronous ref lookup.
    //   2. Pass that Promise directly into new ClipboardItem() — synchronous.
    //   3. Call navigator.clipboard.write() — synchronous initiation.
    //
    // The browser holds the clipboard open and waits for the Promise to resolve
    // on its own — no await needed before the write call.
    const handleShareImage = () => {
        const node = shareCardRef.current;
        if (!node) return;
        setImageState('busy');

        // Ensure a blob promise exists (fallback if pre-generation hasn't started)
        if (!blobPromiseRef.current) {
            blobPromiseRef.current = toPng(node, {
                pixelRatio: 2,
                cacheBust: true,
                style: { position: 'static', left: 'auto', top: 'auto' },
            }).then(async (dataUrl) => {
                dataUrlRef.current = dataUrl;
                const res = await fetch(dataUrl);
                return res.blob();
            });
        }

        const blobPromise = blobPromiseRef.current;

        // ── Clipboard path (Promise pattern — Safari 16+, iOS Chrome, Chrome, Firefox) ──
        //
        // Both new ClipboardItem() and navigator.clipboard.write() are called
        // synchronously here — no await precedes them. Safari sees this as an
        // immediate response to the user's click and allows it.
        if (typeof navigator.clipboard?.write === 'function') {
            const clipItem = new ClipboardItem({ 'image/png': blobPromise });
            const writeOp = navigator.clipboard.write([clipItem]);

            writeOp
                .then(() => {
                    setImageState('done');
                    trackGameEvent('image_shared', { category: activeCategory, mode: activeMode });
                    // Reset label after 2 s so user can copy again if needed
                    setTimeout(() => setImageState('idle'), 2000);
                })
                .catch((err: unknown) => {
                    console.warn('[Share] clipboard write failed:', err instanceof Error ? `${err.name}: ${err.message}` : err);
                    // Blob may still be fine (e.g. clipboard permission denied) — try
                    // native share or download as a graceful fallback.
                    blobPromise
                        .then((blob) => fallbackToShareOrDownload(blob))
                        .catch(() => {
                            setImageState('error');
                            setTimeout(() => setImageState('idle'), 2000);
                        });
                });
            return;
        }

        // ── No clipboard.write support: native share or download ────────────────
        blobPromise
            .then((blob) => fallbackToShareOrDownload(blob))
            .catch(() => {
                setImageState('error');
                setTimeout(() => setImageState('idle'), 2000);
            });
    };

    const fallbackToShareOrDownload = (blob: Blob) => {
        const file = new File([blob], 'scalar-result.png', { type: 'image/png' });
        const canFileShare = supportsShare && (
            typeof navigator.canShare !== 'function' || navigator.canShare({ files: [file] })
        );

        if (canFileShare) {
            navigator.share({ files: [file], title: 'Scalar' })
                .then(() => {
                    setImageState('done');
                    trackGameEvent('image_shared', { category: activeCategory, mode: activeMode });
                    setTimeout(() => setIsOpen(false), 400);
                })
                .catch((err: unknown) => {
                    if (err instanceof Error && err.name === 'AbortError') {
                        setImageState('idle');
                    } else {
                        triggerDownload(blob);
                    }
                });
        } else {
            triggerDownload(blob);
        }
    };

    const triggerDownload = (blob: Blob) => {
        if (dataUrlRef.current) {
            downloadPng(dataUrlRef.current);
        } else {
            const url = URL.createObjectURL(blob);
            downloadPng(url);
            URL.revokeObjectURL(url);
        }
        setImageState('done');
        trackGameEvent('image_shared', { category: activeCategory, mode: activeMode });
        setTimeout(() => setIsOpen(false), 400);
    };

    // ── Share Text (WhatsApp / SMS) ─────────────────────────────────────────
    const handleShareText = async () => {
        const text = generateShareText(
            activeMode, dateString, activeCategory, moves, guesses, schema, entityId,
        );
        setTextState('busy');
        try {
            if (supportsShare) {
                await navigator.share({ text, title: 'Scalar' });
            } else {
                const ok = await copyTextToClipboard(text);
                if (!ok) {
                    setTextState('error');
                    setTimeout(() => setTextState('idle'), 2000);
                    return;
                }
            }
            trackGameEvent('challenge_shared', { category: activeCategory, moves });
            setTextState('done');
            setTimeout(() => setIsOpen(false), 800);
        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
                setTextState('idle');
            } else {
                setTextState('error');
                setTimeout(() => setTextState('idle'), 2000);
            }
        }
    };

    // ── Derived UI labels ───────────────────────────────────────────────────
    const imageLabel =
        imageState === 'error' ? 'Failed — try again'
        : imageState === 'done' ? 'Copied!'
        : imageState === 'busy' ? 'Working…'
        : !blobReady            ? 'Preparing…'
        : 'Share Image';
    const imageSubtitle = !supportsShare
        ? 'Download PNG'
        : 'Instagram · Snapchat · any app';

    const textLabel =
        textState === 'done'    ? (supportsShare ? 'Opened!' : 'Copied!')
        : textState === 'error' ? 'Failed — try again'
        : textState === 'busy'  ? 'Opening…'
        : 'Share Text';
    const textSubtitle = supportsShare ? 'WhatsApp · SMS · more' : 'Copy to clipboard';

    return (
        <div className={cn(containerClassName)}>
            <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
                <Dialog.Trigger asChild>
                    <button
                        className={cn(
                            'flex items-center gap-1.5 font-bold uppercase tracking-widest transition-all',
                            triggerClassName,
                        )}
                    >
                        <Share2 size={12} />
                        <span>{triggerLabel}</span>
                    </button>
                </Dialog.Trigger>

                <Dialog.Portal>
                    {/* z-[60]: sits above the GameOverModal which is z-50 */}
                    <Dialog.Overlay className="fixed inset-0 bg-black/60 z-[60] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                    <Dialog.Content
                        className={cn(
                            'fixed z-[60] bg-paper-white shadow-hard focus:outline-none',
                            'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
                            'w-[92vw] max-w-sm border border-charcoal',
                            'data-[state=open]:animate-in data-[state=closed]:animate-out',
                            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
                            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
                        )}
                    >
                        {/* Header */}
                        <div className="relative shrink-0">
                            <Dialog.Title className="w-full py-3 px-4 border-b border-charcoal bg-charcoal text-paper-white font-serif-display font-black uppercase tracking-wider text-base text-center">
                                Share Result
                            </Dialog.Title>
                            <Dialog.Close
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-paper-white hover:text-paper-white/60 transition-colors"
                                aria-label="Close"
                            >
                                <X size={18} />
                            </Dialog.Close>
                        </div>

                        <Dialog.Description className="sr-only">
                            Choose how to share your result
                        </Dialog.Description>

                        {/* Options */}
                        <div className="flex flex-col divide-y divide-graphite">

                            {/* Share Image */}
                            <button
                                onClick={handleShareImage}
                                disabled={imageState === 'busy' || imageState === 'done'}
                                className="w-full flex items-center gap-4 px-5 py-5 text-left hover:bg-charcoal hover:text-paper-white transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="shrink-0">
                                    {imageState === 'busy'
                                        ? <Loader2 size={20} className="animate-spin" />
                                        : <ImageIcon size={20} />
                                    }
                                </div>
                                <div className="min-w-0">
                                    <div className="text-[12px] font-bold uppercase tracking-widest leading-tight">
                                        {imageLabel}
                                    </div>
                                    <div className="text-[11px] opacity-50 group-hover:opacity-70 mt-1 leading-tight">
                                        {imageSubtitle}
                                    </div>
                                </div>
                            </button>

                            {/* Share Text */}
                            <button
                                onClick={handleShareText}
                                disabled={textState === 'busy' || textState === 'done'}
                                className="w-full flex items-center gap-4 px-5 py-5 text-left hover:bg-charcoal hover:text-paper-white transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="shrink-0">
                                    {textState === 'busy'
                                        ? <Loader2 size={20} className="animate-spin" />
                                        : <MessageSquare size={20} />
                                    }
                                </div>
                                <div className="min-w-0">
                                    <div className="text-[12px] font-bold uppercase tracking-widest leading-tight">
                                        {textLabel}
                                    </div>
                                    <div className="text-[11px] opacity-50 group-hover:opacity-70 mt-1 leading-tight">
                                        {textSubtitle}
                                    </div>
                                </div>
                            </button>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </div>
    );
}
