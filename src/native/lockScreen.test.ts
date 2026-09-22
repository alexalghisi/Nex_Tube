import { describe, expect, it, vi } from 'vitest';
import { bindLockScreen } from './lockScreen';

describe('bindLockScreen', () => {
    it('is a no-op when mediaSession is missing', () => {
        const release = bindLockScreen(null, { play() {}, pause() {} });
        expect(typeof release).toBe('function');
        release();
    });

    it('wires play and pause onto mediaSession', () => {
        const handlers: Record<string, (() => void) | null> = {};
        const play = vi.fn();
        const pause = vi.fn();
        const prev = globalThis.navigator;
        const Meta = class {
            title: string;
            constructor(init: { title: string }) {
                this.title = init.title;
            }
        };
        Object.defineProperty(globalThis, 'navigator', {
            configurable: true,
            value: {
                mediaSession: {
                    metadata: null,
                    setActionHandler(name: string, handler: (() => void) | null) {
                        handlers[name] = handler;
                    },
                },
            },
        });
        (globalThis as { MediaMetadata?: unknown }).MediaMetadata = Meta;
        const release = bindLockScreen(
            {
                id: 'bbb',
                title: 'Big Buck Bunny',
                channelId: 'blender',
                channelName: 'Blender Foundation',
                thumbnailUrl: 'https://img.example/b.jpg',
                durationSeconds: 596,
                viewCount: 1,
                publishedAt: '2008-04-10T00:00:00.000Z',
                topic: 'Film',
            },
            { play, pause }
        );
        handlers.play?.();
        handlers.pause?.();
        expect(play).toHaveBeenCalledTimes(1);
        expect(pause).toHaveBeenCalledTimes(1);
        release();
        Object.defineProperty(globalThis, 'navigator', {
            configurable: true,
            value: prev,
        });
        delete (globalThis as { MediaMetadata?: unknown }).MediaMetadata;
    });
});
