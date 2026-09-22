import type { VideoSummary } from '../catalog/types';

export function pushHistory(
    list: VideoSummary[],
    video: VideoSummary,
    cap = 50
): VideoSummary[] {
    return [video, ...list.filter((item) => item.id !== video.id)].slice(0, cap);
}

export function toggleLike(list: VideoSummary[], video: VideoSummary): VideoSummary[] {
    if (list.some((item) => item.id === video.id)) {
        return list.filter((item) => item.id !== video.id);
    }
    return [video, ...list];
}

export function isLiked(list: VideoSummary[], id: string): boolean {
    return list.some((item) => item.id === id);
}
