import { describe, expect, it } from 'vitest';
import { createLocalCatalog, HOME_TOPICS } from './localCatalog';

describe('createLocalCatalog', () => {
    const catalog = createLocalCatalog();

    it('lists the full home shelf and a single topic', async () => {
        const all = await catalog.listHome();
        expect(all.length).toBeGreaterThan(6);
        const film = await catalog.listHome('Film');
        expect(film.every((v) => v.topic === 'Film')).toBe(true);
        expect(HOME_TOPICS).toContain('Film');
    });

    it('searches title and channel', async () => {
        const hits = await catalog.search('blender');
        expect(hits.some((v) => v.id === 'bbb')).toBe(true);
        expect(await catalog.search('   ')).toEqual(await catalog.listHome());
    });

    it('loads a playable muxed stream', async () => {
        const video = await catalog.getVideo('bbb');
        expect(video.title).toBe('Big Buck Bunny');
        expect(video.streams[0].kind).toBe('muxed');
        expect(video.streams[0].url).toContain('bunny/trailer.mp4');
        expect(video.related.every((v) => v.id !== 'bbb')).toBe(true);
    });

    it('rejects an unknown id', async () => {
        await expect(catalog.getVideo('missing')).rejects.toThrow('Unknown video missing');
    });
});
