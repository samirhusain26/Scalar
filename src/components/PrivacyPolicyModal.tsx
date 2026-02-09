import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '../utils/cn';

interface PrivacyPolicyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function PrivacyPolicyModal({ isOpen, onClose }: PrivacyPolicyModalProps) {
    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <Dialog.Content className={cn(
                    "fixed z-50 bg-paper-white shadow-hard p-6 focus:outline-none overflow-y-auto max-h-[85vh]",
                    "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-2xl border border-charcoal",
                    "data-[state=open]:animate-in data-[state=closed]:animate-out",
                    "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                    "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                )}>
                    {/* Title */}
                    <Dialog.Title className="w-full text-2xl font-black uppercase tracking-wider py-4 border border-charcoal bg-charcoal text-paper-white text-center mb-6 font-serif-display">
                        Privacy Policy
                    </Dialog.Title>

                    <Dialog.Description className="sr-only">
                        Privacy policy for Scalar
                    </Dialog.Description>

                    <div className="space-y-6 text-sm text-charcoal font-mono">

                        {/* Overview */}
                        <p className="text-center leading-relaxed">
                            Scalar is a client-side game that runs entirely in your browser.<br />
                            We do not require accounts, collect personal information, or use cookies.
                        </p>

                        {/* Information We Collect */}
                        <section>
                            <h3 className="font-black uppercase text-xs tracking-widest mb-3 border-b border-charcoal/20 pb-1">
                                Information We Collect
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-bold text-xs mb-1">Local Storage</h4>
                                    <p className="text-xs text-charcoal/70 leading-relaxed">
                                        Your game state (guesses, moves, hints, active category) and tutorial
                                        preferences are saved to your browser's local storage. This data never
                                        leaves your device and is not transmitted to any server.
                                    </p>
                                </div>

                                <div>
                                    <h4 className="font-bold text-xs mb-1">Analytics (Vercel Analytics)</h4>
                                    <p className="text-xs text-charcoal/70 leading-relaxed">
                                        We use Vercel Analytics to understand general usage patterns. This collects:
                                    </p>
                                    <ul className="mt-1.5 space-y-1 text-xs text-charcoal/70 leading-relaxed list-disc list-inside">
                                        <li>Page views</li>
                                        <li>Device type, browser, and operating system</li>
                                        <li>Country-level location (derived from IP, anonymized)</li>
                                        <li>Game events: category played, move count, and whether hints were used</li>
                                    </ul>
                                    <p className="mt-1.5 text-xs text-charcoal/70 leading-relaxed">
                                        Vercel Analytics does not use cookies. Visitors are identified via a
                                        daily-reset hash that cannot track you across sessions or websites.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Information We Do Not Collect */}
                        <section>
                            <h3 className="font-black uppercase text-xs tracking-widest mb-3 border-b border-charcoal/20 pb-1">
                                Information We Do Not Collect
                            </h3>
                            <ul className="space-y-1 text-xs text-charcoal/70 leading-relaxed list-disc list-inside">
                                <li>Names, email addresses, or any personal identifiers</li>
                                <li>Passwords or account credentials</li>
                                <li>Cookies or cross-site tracking data</li>
                                <li>Precise geolocation</li>
                            </ul>
                        </section>

                        {/* Third-Party Services */}
                        <section>
                            <h3 className="font-black uppercase text-xs tracking-widest mb-3 border-b border-charcoal/20 pb-1">
                                Third-Party Services
                            </h3>
                            <p className="text-xs text-charcoal/70 leading-relaxed">
                                The only third-party service used is{' '}
                                <a
                                    href="https://vercel.com/legal/privacy-policy"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline underline-offset-2 hover:text-charcoal transition-colors"
                                >
                                    Vercel Analytics
                                </a>
                                . No other analytics, advertising, or tracking services are integrated.
                            </p>
                        </section>

                        {/* Data Retention */}
                        <section>
                            <h3 className="font-black uppercase text-xs tracking-widest mb-3 border-b border-charcoal/20 pb-1">
                                Data Retention
                            </h3>
                            <p className="text-xs text-charcoal/70 leading-relaxed">
                                Local storage data remains on your device until you clear your browser data.
                                Analytics data is retained by Vercel in accordance with their{' '}
                                <a
                                    href="https://vercel.com/legal/privacy-policy"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline underline-offset-2 hover:text-charcoal transition-colors"
                                >
                                    privacy policy
                                </a>
                                .
                            </p>
                        </section>

                        {/* Contact */}
                        <section>
                            <h3 className="font-black uppercase text-xs tracking-widest mb-3 border-b border-charcoal/20 pb-1">
                                Contact
                            </h3>
                            <p className="text-xs text-charcoal/70 leading-relaxed">
                                If you have questions about this policy, you can reach the developer at{' '}
                                <a
                                    href="https://www.samirhusain.info"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline underline-offset-2 hover:text-charcoal transition-colors"
                                >
                                    www.samirhusain.info
                                </a>
                                .
                            </p>
                        </section>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="w-full mt-6 px-4 py-3 bg-charcoal text-paper-white font-bold border border-charcoal hover:bg-paper-white hover:text-charcoal transition-colors uppercase text-sm tracking-wide"
                    >
                        Got It
                    </button>

                    <Dialog.Close className="absolute top-4 right-4 text-paper-white opacity-70 hover:opacity-100 transition-opacity" aria-label="Close">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </Dialog.Close>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
