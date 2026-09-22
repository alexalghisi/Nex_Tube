import type { Catalog, MediaStream, StreamKind, VideoDetail, VideoSummary } from './types';

export const DEFAULT_INVIDIOUS_ORIGINS = [
    'https://inv.nadeko.net',
    'https://invidious.nerdvpn.de',
    'https://yewtu.be',
];

type InvThumb = { url: string; width: number; quality?: string };
type InvStream = {
    url: string;
    type?: string;
    qualityLabel?: string;
    bitrate?: string | number;
};
type InvVideo = {
    videoId: string;
    title: string;
    author: string;
    authorId: string;
    lengthSeconds: number;
    viewCount?: number;
    published?: number;
    publishedText?: string;
    description?: string;
    likeCount?: number;
    videoThumbnails?: InvThumb[];
    formatStreams?: InvStream[];
    adaptiveFormats?: InvStream[];
    recommendedVideos?: InvVideo[];
};

export function createInvidiousCatalog(
    fetchImpl: typeof fetch,
    origins: string[] = DEFAULT_INVIDIOUS_ORIGINS
): Catalog {
    async function pull<T>(path: string): Promise<{ data: T; origin: string }> {
        let last: Error = new Error('No Invidious origin answered');
        for (const origin of origins) {
            try {
                const res = await fetchImpl(`${origin}${path}`, {
                    headers: { Accept: 'application/json' },
                    signal: AbortSignal.timeout(2500),
                });
                if (!res.ok) {
                    throw new Error(`${origin} ${res.status}`);
                }
                const data = (await res.json()) as T;
                return { data, origin };
            } catch (err) {
                last = err instanceof Error ? err : new Error(String(err));
            }
        }
        throw last;
    }

    return {
        async listHome(topic) {
            const q = topic && topic !== 'All' ? topic : '';
            if (q) {
                return this.search(q);
            }
            const { data, origin } = await pull<InvVideo[]>('/api/v1/trending');
            return data.filter((row) => row.videoId).map((row) => toSummary(row, origin));
        },
        async search(q) {
            const query = encodeURIComponent(q.trim());
            const { data, origin } = await pull<InvVideo[]>(
                `/api/v1/search?q=${query}&type=video`
            );
            return data.filter((row) => row.videoId).map((row) => toSummary(row, origin));
        },
        async getVideo(id) {
            const { data, origin } = await pull<InvVideo>(`/api/v1/videos/${id}`);
            if (!data.videoId) {
                throw new Error(`Invidious returned no video for ${id}`);
            }
            const summary = toSummary(data, origin);
            const streams = [
                ...(data.formatStreams ?? []).map((s) => toStream(s, 'muxed')),
                ...(data.adaptiveFormats ?? []).map((s) => toStream(s, kindFromMime(s.type))),
            ].filter((s) => s.url);
            const related = (data.recommendedVideos ?? [])
                .filter((row) => row.videoId)
                .map((row) => toSummary(row, origin));
            const detail: VideoDetail = {
                ...summary,
                description: data.description ?? '',
                likeCount: data.likeCount ?? 0,
                streams,
                related,
            };
            return detail;
        },
    };
}

function toSummary(row: InvVideo, origin: string): VideoSummary {
    const publishedAt =
        typeof row.published === 'number' && row.published > 0
            ? new Date(row.published * 1000).toISOString()
            : '1970-01-01T00:00:00.000Z';
    return {
        id: row.videoId,
        title: row.title,
        channelId: row.authorId,
        channelName: row.author,
        thumbnailUrl: pickThumb(row.videoThumbnails, origin),
        durationSeconds: row.lengthSeconds ?? 0,
        viewCount: row.viewCount ?? 0,
        publishedAt,
        topic: 'All',
    };
}

function pickThumb(list: InvThumb[] | undefined, origin: string): string {
    if (!list || list.length === 0) {
        return '';
    }
    const ranked = [...list].sort((a, b) => a.width - b.width);
    const mid = ranked.find((t) => t.width >= 320) ?? ranked[ranked.length - 1];
    return absUrl(origin, mid.url);
}

function toStream(row: InvStream, kind: StreamKind): MediaStream {
    const bitrate =
        typeof row.bitrate === 'number' ? row.bitrate : Number(row.bitrate) || 0;
    return {
        url: row.url,
        kind,
        mimeType: row.type ?? 'application/octet-stream',
        qualityLabel: row.qualityLabel ?? kind,
        bitrate,
    };
}

function kindFromMime(type: string | undefined): StreamKind {
    if (type && type.startsWith('audio/')) {
        return 'audio';
    }
    if (type && type.startsWith('video/')) {
        return 'video';
    }
    return 'muxed';
}

function absUrl(origin: string, url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    if (url.startsWith('//')) {
        return `https:${url}`;
    }
    return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
}
