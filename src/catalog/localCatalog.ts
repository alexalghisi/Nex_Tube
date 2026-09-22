import type { Catalog, MediaStream, VideoDetail, VideoSummary } from './types';

type Seed = {
    id: string;
    url: string;
    thumbnailUrl: string;
    title: string;
    channelId: string;
    channelName: string;
    durationSeconds: number;
    viewCount: number;
    publishedAt: string;
    topic: string;
    description: string;
    likeCount: number;
};

const SEED: Seed[] = [
    {
        id: 'bbb',
        url: 'https://media.w3.org/2010/05/bunny/trailer.mp4',
        thumbnailUrl: 'https://media.w3.org/2010/05/bunny/poster.png',
        title: 'Big Buck Bunny',
        channelId: 'blender',
        channelName: 'Blender Foundation',
        durationSeconds: 32,
        viewCount: 18422031,
        publishedAt: '2008-04-10T00:00:00.000Z',
        topic: 'Film',
        description: 'A giant rabbit makes peace with the rodents who wrecked his home.',
        likeCount: 412003,
    },
    {
        id: 'bbb-cut',
        url: 'https://media.w3.org/2010/05/bunny/movie.mp4',
        thumbnailUrl: 'https://peach.blender.org/wp-content/uploads/poster_bunny_small.jpg',
        title: 'Big Buck Bunny — W3C cut',
        channelId: 'blender',
        channelName: 'Blender Foundation',
        durationSeconds: 60,
        viewCount: 2201450,
        publishedAt: '2008-05-17T00:00:00.000Z',
        topic: 'Film',
        description: 'The W3C host of the open movie, used here as a second playable cut.',
        likeCount: 44102,
    },
    {
        id: 'sintel',
        url: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
        thumbnailUrl: 'https://media.w3.org/2010/05/sintel/poster.png',
        title: 'Sintel',
        channelId: 'blender',
        channelName: 'Blender Foundation',
        durationSeconds: 52,
        viewCount: 15330890,
        publishedAt: '2010-09-27T00:00:00.000Z',
        topic: 'Film',
        description: 'A girl searches for a baby dragon after a storm tears them apart.',
        likeCount: 301448,
    },
    {
        id: 'sintel-hd',
        url: 'https://media.w3.org/2010/05/sintel/trailer_hd.mp4',
        thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8f/Sintel_poster.jpg',
        title: 'Sintel — HD trailer',
        channelId: 'blender',
        channelName: 'Blender Foundation',
        durationSeconds: 52,
        viewCount: 6102290,
        publishedAt: '2010-09-27T00:00:00.000Z',
        topic: 'Film',
        description: 'The same Sintel trailer in the HD file W3C keeps on the media host.',
        likeCount: 142880,
    },
    {
        id: 'sintel-480',
        url: 'https://download.blender.org/durian/trailer/sintel_trailer-480p.mp4',
        thumbnailUrl: 'https://media.w3.org/2010/05/sintel/poster.png',
        title: 'Sintel — 480p from Blender',
        channelId: 'blender',
        channelName: 'Blender Foundation',
        durationSeconds: 52,
        viewCount: 1882210,
        publishedAt: '2010-05-12T00:00:00.000Z',
        topic: 'Film',
        description: 'The 480p trailer served from Blender’s own download host.',
        likeCount: 38821,
    },
    {
        id: 'w3movie',
        url: 'https://media.w3.org/2010/05/video/movie_300.mp4',
        thumbnailUrl: 'https://media.w3.org/2010/05/video/poster.png',
        title: 'W3C Movie 300',
        channelId: 'w3c',
        channelName: 'W3C Media',
        durationSeconds: 30,
        viewCount: 220145,
        publishedAt: '2010-05-01T00:00:00.000Z',
        topic: 'Science',
        description: 'A short public test clip from the W3C media archive.',
        likeCount: 4102,
    },
    {
        id: 'flower',
        url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
        thumbnailUrl: 'https://media.w3.org/2010/05/video/poster.png',
        title: 'Flower',
        channelId: 'mdn',
        channelName: 'MDN Web Docs',
        durationSeconds: 5,
        viewCount: 540221,
        publishedAt: '2024-01-12T00:00:00.000Z',
        topic: 'Nature',
        description: 'A CC0 flower clip MDN ships with the video element docs.',
        likeCount: 9021,
    },
    {
        id: 'sample',
        url: 'https://filesamples.com/samples/video/mp4/sample_640x360.mp4',
        thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Big_buck_bunny_poster_big.jpg',
        title: 'Sample 640×360',
        channelId: 'filesamples',
        channelName: 'File Samples',
        durationSeconds: 30,
        viewCount: 176900,
        publishedAt: '2023-07-05T00:00:00.000Z',
        topic: 'Music',
        description: 'A public MP4 sample used when a second muxed file is handy.',
        likeCount: 2994,
    },
];

export const HOME_TOPICS = ['All', 'Film', 'Nature', 'Science', 'Music'] as const;

export function createLocalCatalog(): Catalog {
    const summaries = SEED.map(toSummary);

    function related(id: string): VideoSummary[] {
        return summaries.filter((item) => item.id !== id).slice(0, 8);
    }

    return {
        async listHome(topic) {
            if (!topic || topic === 'All') {
                return summaries;
            }
            return summaries.filter((item) => item.topic === topic);
        },
        async search(q) {
            const needle = q.trim().toLowerCase();
            if (!needle) {
                return summaries;
            }
            return summaries.filter((item) => {
                return (
                    item.title.toLowerCase().includes(needle) ||
                    item.channelName.toLowerCase().includes(needle) ||
                    item.topic.toLowerCase().includes(needle)
                );
            });
        },
        async getVideo(id) {
            const seed = SEED.find((item) => item.id === id);
            if (!seed) {
                throw new Error(`Unknown video ${id}`);
            }
            const summary = toSummary(seed);
            const stream: MediaStream = {
                url: seed.url,
                kind: 'muxed',
                mimeType: 'video/mp4',
                qualityLabel: '480p',
                bitrate: 1_200_000,
            };
            const detail: VideoDetail = {
                ...summary,
                description: seed.description,
                likeCount: seed.likeCount,
                streams: [stream],
                related: related(id),
            };
            return detail;
        },
    };
}

function toSummary(seed: Seed): VideoSummary {
    return {
        id: seed.id,
        title: seed.title,
        channelId: seed.channelId,
        channelName: seed.channelName,
        thumbnailUrl: seed.thumbnailUrl,
        durationSeconds: seed.durationSeconds,
        viewCount: seed.viewCount,
        publishedAt: seed.publishedAt,
        topic: seed.topic,
    };
}
