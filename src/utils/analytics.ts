import { track } from '@vercel/analytics';
import posthog from 'posthog-js';
import Clarity from '@microsoft/clarity';

export function trackGameEvent(
    name: string,
    data?: Record<string, string | number | boolean>
) {
    track(name, data);
    posthog.capture(name, data);
    Clarity.event(name);
}
