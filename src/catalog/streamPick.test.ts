import { describe, expect, it } from 'vitest';
import { pickPlaybackStreams, urlWhileScreenHidden } from './streamPick';
import type { MediaStream } from './types';

const muxed: MediaStream = {
    url: 'https://cdn.example/full.mp4',
    kind: 'muxed',
    mimeType: 'video/mp4',
    qualityLabel: '720p',
    bitrate: 2_000_000,
};
const video: MediaStream = {
    url: 'https://cdn.example/v.mp4',
    kind: 'video',
    mimeType: 'video/mp4',
    qualityLabel: '1080p',
    bitrate: 4_000_000,
};
const audio: MediaStream = {
    url: 'https://cdn.example/a.m4a',
    kind: 'audio',
    mimeType: 'audio/mp4',
    qualityLabel: 'audio',
    bitrate: 128_000,
};

describe('pickPlaybackStreams', () => {
    it('prefers a muxed file when one exists', () => {
        expect(pickPlaybackStreams([audio, muxed, video])).toEqual({
            videoUrl: muxed.url,
            audioUrl: null,
        });
    });

    it('pairs adaptive video and audio', () => {
        expect(pickPlaybackStreams([video, audio])).toEqual({
            videoUrl: video.url,
            audioUrl: audio.url,
        });
    });
});

describe('urlWhileScreenHidden', () => {
    it('drops to audio so a locked phone keeps the track', () => {
        expect(urlWhileScreenHidden([video, audio])).toBe(audio.url);
    });

    it('keeps the muxed file when that is all we have', () => {
        expect(urlWhileScreenHidden([muxed])).toBe(muxed.url);
    });
});
