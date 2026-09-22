import { describe, expect, it } from 'vitest';
import { createCatalog } from './catalog/createCatalog';
import { pickPlaybackStreams, urlWhileScreenHidden } from './catalog/streamPick';
import { isLiked, pushHistory, toggleLike } from './library/watchLog';
import { createPlaybackSession } from './player/playbackSession';

describe('watch flow', () => {
    it('plays from search, survives a closed screen, and records history', async () => {
        const catalog = createCatalog({
            remoteFirst: false,
            fetchImpl: async () => {
                throw new Error('network should stay unused');
            },
        });
        const hits = await catalog.search('bunny');
        expect(hits[0].id).toBe('bbb');
        const video = await catalog.getVideo(hits[0].id);
        const urls = pickPlaybackStreams(video.streams);
        expect(urls.videoUrl).toContain('bunny/trailer.mp4');

        const session = createPlaybackSession();
        session.load(video);
        session.play();
        session.hideScreen();
        expect(urlWhileScreenHidden(video.streams)).toBe(urls.videoUrl);
        expect(session.snapshot().shouldKeepAudio).toBe(true);
        expect(session.snapshot().adsEnabled).toBe(false);
        expect(session.snapshot().pictureInPictureEnabled).toBe(true);
        expect(session.snapshot().floatingMiniPlayer).toBe(true);

        const history = pushHistory([], video);
        expect(history[0].id).toBe('bbb');
    });

    it('falls back to the local shelf when Invidious is down', async () => {
        const catalog = createCatalog({
            remoteFirst: true,
            origins: ['https://down.example'],
            fetchImpl: async () => new Response('nope', { status: 503 }),
        });
        const home = await catalog.listHome('Film');
        expect(home.every((v) => v.topic === 'Film')).toBe(true);
        expect(home.length).toBeGreaterThan(0);
    });

    it('manages playback controls, toggle, and stop', async () => {
        const catalog = createCatalog({ remoteFirst: false });
        const video = await catalog.getVideo('bbb');
        const session = createPlaybackSession();

        session.load(video);
        session.play();
        expect(session.snapshot().status).toBe('playing');

        session.toggle();
        expect(session.snapshot().status).toBe('paused');

        session.toggle();
        expect(session.snapshot().status).toBe('playing');

        session.report(10, 30, false);
        expect(session.snapshot().positionSeconds).toBe(10);
        expect(session.snapshot().durationSeconds).toBe(30);

        session.stop();
        expect(session.snapshot().status).toBe('idle');
        expect(session.snapshot().video).toBeNull();
        expect(session.snapshot().shouldKeepAudio).toBe(false);
    });

    it('handles like and library collection state', async () => {
        const catalog = createCatalog({ remoteFirst: false });
        const video = await catalog.getVideo('bbb');

        expect(isLiked([], video.id)).toBe(false);
        const likedOnce = toggleLike([], video);
        expect(isLiked(likedOnce, video.id)).toBe(true);
        expect(likedOnce.length).toBe(1);

        const unliked = toggleLike(likedOnce, video);
        expect(isLiked(unliked, video.id)).toBe(false);
        expect(unliked.length).toBe(0);
    });

    it('filters catalog topics correctly', async () => {
        const catalog = createCatalog({ remoteFirst: false });
        const allVideos = await catalog.listHome('All');
        const musicVideos = await catalog.listHome('Music');
        const natureVideos = await catalog.listHome('Nature');

        expect(allVideos.length).toBeGreaterThan(0);
        expect(musicVideos.every((item) => item.topic === 'Music')).toBe(true);
        expect(natureVideos.every((item) => item.topic === 'Nature')).toBe(true);
    });
});

