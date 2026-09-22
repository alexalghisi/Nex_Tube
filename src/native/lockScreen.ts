import type { VideoSummary } from '../catalog/types';

type MediaSessionLike = {
    metadata: unknown;
    setActionHandler(name: string, handler: (() => void) | null): void;
};

type MediaMetadataCtor = new (init: {
    title: string;
    artist: string;
    artwork: { src: string; sizes: string; type: string }[];
}) => unknown;

export function bindLockScreen(
    video: VideoSummary | null,
    controls: { play(): void; pause(): void }
): () => void {
    if (typeof navigator === 'undefined') {
        return () => undefined;
    }
    const session = (navigator as { mediaSession?: MediaSessionLike }).mediaSession;
    const Meta = (globalThis as { MediaMetadata?: MediaMetadataCtor }).MediaMetadata;
    if (!session || !Meta) {
        return () => undefined;
    }
    session.metadata = video
        ? new Meta({
              title: video.title,
              artist: video.channelName,
              artwork: video.thumbnailUrl
                  ? [{ src: video.thumbnailUrl, sizes: '512x512', type: 'image/jpeg' }]
                  : [],
          })
        : null;
    session.setActionHandler('play', () => controls.play());
    session.setActionHandler('pause', () => controls.pause());
    return () => {
        session.setActionHandler('play', null);
        session.setActionHandler('pause', null);
    };
}
