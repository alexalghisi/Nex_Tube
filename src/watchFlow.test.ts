import { describe, expect, it } from 'vitest';
import { createCatalog } from './catalog/createCatalog';
import { pickPlaybackStreams, urlWhileScreenHidden } from './catalog/streamPick';
import { pushHistory } from './library/watchLog';
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
});
