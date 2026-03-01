import { useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../utils/cn';

// ── Constants ─────────────────────────────────────────────────────────────────

const VISITS_KEY = 'scalar-install-visits';
const NEVER_SHOW_KEY = 'scalar-install-nope';

// ── Types ─────────────────────────────────────────────────────────────────────

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

type Platform = 'android' | 'ios' | 'desktop';

// ── Module-level: capture beforeinstallprompt as early as possible ────────────
// The event fires before React renders, so we capture it at module scope.

let _deferredPrompt: BeforeInstallPromptEvent | null = null;
let _promptListenerAttached = false;

function ensureInstallListener() {
    if (_promptListenerAttached) return;
    _promptListenerAttached = true;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault(); // Block the browser's default mini-infobar
        _deferredPrompt = e as BeforeInstallPromptEvent;
    });
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function detectPlatform(): Platform {
    const ua = navigator.userAgent;
    // iPadOS 13+ reports as MacIntel with multiple touch points — check both
    const isIOS =
        /iPad|iPhone|iPod/.test(ua) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (isIOS) return 'ios';
    if (/Android/.test(ua)) return 'android';
    return 'desktop';
}

function isAlreadyInstalled(): boolean {
    if (window.matchMedia('(display-mode: standalone)').matches) return true;
    // Safari on iOS sets navigator.standalone when added to home screen
    const nav = navigator as { standalone?: boolean };
    return nav.standalone === true;
}

/**
 * Increments the visit counter and returns whether the modal should open.
 * Call exactly once per page load.
 */
function checkShouldShow(): boolean {
    if (localStorage.getItem(NEVER_SHOW_KEY)) return false;
    if (detectPlatform() === 'desktop') return false;
    if (isAlreadyInstalled()) return false;

    const raw = localStorage.getItem(VISITS_KEY);
    const prev = raw ? parseInt(raw, 10) : 0;
    const next = prev + 1;
    localStorage.setItem(VISITS_KEY, String(next));

    // Show on the 2nd and 3rd visit only
    return next === 2 || next === 3;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function IOSShareIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn('inline-block', className)}
            aria-hidden="true"
        >
            {/* Arrow pointing up */}
            <path d="M12 15V3" />
            <path d="M7 8l5-5 5 5" />
            {/* Tray / box bottom */}
            <path d="M20 17v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2" />
        </svg>
    );
}

function IOSContent() {
    return (
        <div className="space-y-5">
            <p className="text-sm font-mono text-charcoal/80 leading-relaxed">
                Add Scalar to your home screen for instant access:
            </p>

            <ol className="space-y-4">
                {([
                    {
                        step: '1',
                        content: (
                            <>
                                Tap the{' '}
                                <span className="inline-flex items-center gap-1 border border-charcoal/40 px-1.5 py-0.5 bg-charcoal/5 font-mono text-[11px] align-middle">
                                    <IOSShareIcon className="w-3.5 h-3.5" />
                                    <span className="font-bold">Share</span>
                                </span>{' '}
                                icon in your browser's toolbar.
                            </>
                        ),
                    },
                    {
                        step: '2',
                        content: (
                            <>
                                Scroll down in the sheet and tap{' '}
                                <span className="font-bold text-charcoal">"Add to Home Screen"</span>.
                            </>
                        ),
                    },
                    {
                        step: '3',
                        content: (
                            <>
                                Tap <span className="font-bold text-charcoal">"Add"</span> to confirm.
                            </>
                        ),
                    },
                ] as const).map(({ step, content }) => (
                    <li key={step} className="flex gap-3 items-start">
                        <span className="shrink-0 w-5 h-5 flex items-center justify-center bg-charcoal text-paper-white text-[11px] font-black mt-0.5">
                            {step}
                        </span>
                        <p className="text-sm font-mono text-charcoal/80 leading-relaxed">
                            {content}
                        </p>
                    </li>
                ))}
            </ol>
        </div>
    );
}

function AndroidContent({ onInstall }: { onInstall: () => void }) {
    return (
        <div className="space-y-4">
            <p className="text-sm font-mono text-charcoal/80 leading-relaxed">
                Install Scalar on your home screen for instant, offline-ready access — no app store required.
            </p>
            <button
                onClick={onInstall}
                className="w-full bg-charcoal text-paper-white py-3 font-bold uppercase text-sm tracking-wide hover:bg-paper-white hover:text-charcoal border border-charcoal transition-colors touch-manipulation focus:outline-none"
            >
                Install App
            </button>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

/**
 * Self-contained PWA install modal.
 * Renders nothing on desktop. Shows on the 2nd and 3rd visit on mobile.
 * Just drop <PWAInstallModal /> anywhere in your component tree.
 */
export function PWAInstallModal() {
    const [isOpen, setIsOpen] = useState(false);
    const platform = useRef<Platform>('desktop');
    const initialized = useRef(false);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        ensureInstallListener();
        platform.current = detectPlatform();

        if (checkShouldShow()) {
            setIsOpen(true);
        }
    }, []);

    const handleDismiss = () => setIsOpen(false);

    const handleNeverShow = () => {
        localStorage.setItem(NEVER_SHOW_KEY, '1');
        setIsOpen(false);
    };

    const handleAndroidInstall = async () => {
        if (!_deferredPrompt) {
            // Prompt not available (already installed, or browser doesn't support)
            handleNeverShow();
            return;
        }
        await _deferredPrompt.prompt();
        const { outcome } = await _deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            localStorage.setItem(NEVER_SHOW_KEY, '1');
        }
        _deferredPrompt = null;
        setIsOpen(false);
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) handleDismiss(); }}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

                <Dialog.Content
                    className={cn(
                        'fixed z-50 focus:outline-none',
                        'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
                        'w-[95vw] max-w-sm',
                        'border border-charcoal bg-paper-white shadow-hard',
                        'data-[state=open]:animate-in data-[state=closed]:animate-out',
                        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
                        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
                    )}
                >
                    {/* Sticky header */}
                    <div className="bg-charcoal text-paper-white px-5 py-4 flex items-center justify-between">
                        <Dialog.Title className="font-serif-display font-black text-xl uppercase tracking-wider">
                            Add to Home Screen
                        </Dialog.Title>
                        <Dialog.Close
                            onClick={handleDismiss}
                            className="text-paper-white/70 hover:text-paper-white transition-colors touch-manipulation p-1 focus:outline-none"
                            aria-label="Close"
                        >
                            <X size={20} />
                        </Dialog.Close>
                    </div>

                    <Dialog.Description className="sr-only">
                        Install Scalar on your home screen for quick offline access.
                    </Dialog.Description>

                    {/* Body */}
                    <div className="px-5 py-5">
                        {platform.current === 'ios'
                            ? <IOSContent />
                            : <AndroidContent onInstall={handleAndroidInstall} />
                        }
                    </div>

                    {/* Footer */}
                    <div className="px-5 pb-5 flex flex-col gap-2 border-t border-charcoal/10 pt-4">
                        <button
                            onClick={handleDismiss}
                            className="w-full py-2.5 font-bold uppercase text-sm tracking-wide border border-charcoal/30 text-charcoal/70 hover:border-charcoal hover:text-charcoal transition-colors touch-manipulation focus:outline-none font-mono"
                        >
                            Maybe Later
                        </button>
                        <button
                            onClick={handleNeverShow}
                            className="text-center text-[10px] font-mono text-charcoal/40 hover:text-charcoal/70 transition-colors touch-manipulation py-1 focus:outline-none"
                        >
                            Do not show this again
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
