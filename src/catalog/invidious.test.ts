import { describe, expect, it } from 'vitest';
import { createInvidiousCatalog } from './invidious';

function json(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

describe('createInvidiousCatalog', () => {
    it('walks origins until one answers trending', async () => {
        const calls: string[] = [];
        const catalog = createInvidiousCatalog(async (input) => {
            const url = String(input);
            calls.push(url);
            if (url.startsWith('https://dead.example')) {
                return json({ error: 'down' }, 502);
            }
            return json([
                {
                    videoId: 'dQw4w9WgXcQ',
                    title: 'Never Gonna Give You Up',
                    author: 'Rick Astley',
                    authorId: 'rick',
                    lengthSeconds: 213,
                    viewCount: 1500000000,
                    published: 1234567890,
                    videoThumbnails: [{ url: '/vi/x/mq.jpg', width: 320 }],
                },
            ]);
        }, ['https://dead.example', 'https://ok.example']);

        const home = await catalog.listHome();
        expect(calls[0]).toBe('https://dead.example/api/v1/trending');
        expect(home[0].id).toBe('dQw4w9WgXcQ');
        expect(home[0].thumbnailUrl).toBe('https://ok.example/vi/x/mq.jpg');
        expect(home[0].publishedAt).toBe('2009-02-13T23:31:30.000Z');
    });

    it('maps muxed and adaptive streams on the watch call', async () => {
        const catalog = createInvidiousCatalog(async () => {
            return json({
                videoId: 'abc',
                title: 'Clip',
                author: 'Desk',
                authorId: 'desk',
                lengthSeconds: 12,
                description: 'A clip',
                likeCount: 9,
                formatStreams: [
                    {
                        url: 'https://cdn.example/full.mp4',
                        type: 'video/mp4',
                        qualityLabel: '360p',
                        bitrate: 800000,
                    },
                ],
                adaptiveFormats: [
                    {
                        url: 'https://cdn.example/a.m4a',
                        type: 'audio/mp4',
                        bitrate: 128000,
                    },
                ],
                recommendedVideos: [
                    {
                        videoId: 'rel',
                        title: 'Related',
                        author: 'Desk',
                        authorId: 'desk',
                        lengthSeconds: 8,
                    },
                ],
            });
        }, ['https://ok.example']);

        const video = await catalog.getVideo('abc');
        expect(video.streams).toHaveLength(2);
        expect(video.streams[1].kind).toBe('audio');
        expect(video.related[0].id).toBe('rel');
    });
});
