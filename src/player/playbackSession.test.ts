import { describe, expect, it } from 'vitest';
import { createLocalCatalog } from '../catalog/localCatalog';
import { createPlaybackSession } from './playbackSession';
import { playbackPolicy } from './policy';

describe('createPlaybackSession', () => {
    it('keeps audio up after the watch pane closes', async () => {
        const video = await createLocalCatalog().getVideo('bbb');
        const session = createPlaybackSession();
        session.load(video);
        session.play();
        session.hideScreen();
        const snap = session.snapshot();
        expect(snap.status).toBe('playing');
        expect(snap.screenHidden).toBe(true);
        expect(snap.shouldKeepAudio).toBe(true);
        expect(snap.adsEnabled).toBe(false);
        expect(playbackPolicy.adsEnabled).toBe(false);
        expect(playbackPolicy.continueWhenScreenHidden).toBe(true);
    });

    it('stops the session when the mini player is dismissed', async () => {
        const video = await createLocalCatalog().getVideo('sintel');
        const session = createPlaybackSession();
        session.load(video);
        session.play();
        session.stop();
        expect(session.snapshot()).toMatchObject({
            video: null,
            status: 'idle',
            shouldKeepAudio: false,
        });
    });

    it('marks the clip ended from the player report', async () => {
        const video = await createLocalCatalog().getVideo('flower');
        const session = createPlaybackSession();
        session.load(video);
        session.play();
        session.report(60, 60, true);
        expect(session.snapshot().status).toBe('ended');
        expect(session.snapshot().shouldKeepAudio).toBe(false);
    });
});
