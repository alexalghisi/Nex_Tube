import type { MediaStream } from './types';

export function pickPlaybackStreams(streams: MediaStream[]): {
    videoUrl: string | null;
    audioUrl: string | null;
} {
    const muxed = best(streams.filter((s) => s.kind === 'muxed'));
    if (muxed) {
        return { videoUrl: muxed.url, audioUrl: null };
    }
    const video = best(streams.filter((s) => s.kind === 'video'));
    const audio = best(streams.filter((s) => s.kind === 'audio'));
    return {
        videoUrl: video?.url ?? audio?.url ?? null,
        audioUrl: audio?.url ?? null,
    };
}

export function urlWhileScreenHidden(streams: MediaStream[]): string | null {
    const picked = pickPlaybackStreams(streams);
    return picked.audioUrl ?? picked.videoUrl;
}

function best(list: MediaStream[]): MediaStream | null {
    if (list.length === 0) {
        return null;
    }
    return [...list].sort((a, b) => b.bitrate - a.bitrate)[0];
}
