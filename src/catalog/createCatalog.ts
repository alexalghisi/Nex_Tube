import { createInvidiousCatalog, DEFAULT_INVIDIOUS_ORIGINS } from './invidious';
import { createLocalCatalog } from './localCatalog';
import type { Catalog, VideoDetail, VideoId, VideoSummary } from './types';

export function createCatalog(opts?: {
    fetchImpl?: typeof fetch;
    origins?: string[];
    remoteFirst?: boolean;
}): Catalog {
    const local = createLocalCatalog();
    const remote = createInvidiousCatalog(
        opts?.fetchImpl ?? fetch,
        opts?.origins ?? DEFAULT_INVIDIOUS_ORIGINS
    );
    const remoteFirst = opts?.remoteFirst ?? true;

    async function first<T>(remoteCall: () => Promise<T>, localCall: () => Promise<T>): Promise<T> {
        if (!remoteFirst) {
            return localCall();
        }
        try {
            return await remoteCall();
        } catch {
            return localCall();
        }
    }

    return {
        listHome(topic) {
            return first(() => remote.listHome(topic), () => local.listHome(topic));
        },
        search(q) {
            return first(() => remote.search(q), () => local.search(q));
        },
        getVideo(id: VideoId) {
            return first(() => remote.getVideo(id), () => local.getVideo(id));
        },
    };
}

export type { Catalog, VideoDetail, VideoSummary };
