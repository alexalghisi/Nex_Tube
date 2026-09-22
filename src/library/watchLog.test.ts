import { describe, expect, it } from 'vitest';
import { createLocalCatalog } from '../catalog/localCatalog';
import { isLiked, pushHistory, toggleLike } from './watchLog';

describe('watchLog', () => {
    it('puts the latest watch first and drops a duplicate', async () => {
        const catalog = createLocalCatalog();
        const a = await catalog.getVideo('bbb');
        const b = await catalog.getVideo('sintel');
        const once = pushHistory([], a, 2);
        const twice = pushHistory(pushHistory(once, b, 2), a, 2);
        expect(twice.map((v) => v.id)).toEqual(['bbb', 'sintel']);
    });

    it('toggles a like', async () => {
        const video = await createLocalCatalog().getVideo('sintel');
        const liked = toggleLike([], video);
        expect(isLiked(liked, video.id)).toBe(true);
        expect(isLiked(toggleLike(liked, video), video.id)).toBe(false);
    });
});
