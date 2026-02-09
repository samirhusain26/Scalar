import { track } from '@vercel/analytics';

export function trackGameEvent(
    name: string,
    data?: Record<string, string | number | boolean>
) {
    track(name, data);
}
