import type { VideoDetail } from '../catalog/types';
import { playbackPolicy } from './policy';

export type PlaybackStatus = 'idle' | 'ready' | 'playing' | 'paused' | 'ended';

export type PlaybackSnapshot = {
    video: VideoDetail | null;
    status: PlaybackStatus;
    positionSeconds: number;
    durationSeconds: number;
    screenHidden: boolean;
    shouldKeepAudio: boolean;
    adsEnabled: false;
    pictureInPictureEnabled: boolean;
    floatingMiniPlayer: boolean;
};

export type PlaybackSession = {
    load(video: VideoDetail): void;
    play(): void;
    pause(): void;
    toggle(): void;
    seek(seconds: number): void;
    hideScreen(): void;
    showScreen(): void;
    stop(): void;
    report(positionSeconds: number, durationSeconds: number, ended: boolean): void;
    snapshot(): PlaybackSnapshot;
};

export function createPlaybackSession(): PlaybackSession {
    let video: VideoDetail | null = null;
    let status: PlaybackStatus = 'idle';
    let positionSeconds = 0;
    let durationSeconds = 0;
    let screenHidden = false;

    function snap(): PlaybackSnapshot {
        const shouldKeepAudio =
            playbackPolicy.continueWhenScreenHidden &&
            video !== null &&
            (status === 'playing' || (status === 'paused' && screenHidden));
        return {
            video,
            status,
            positionSeconds,
            durationSeconds,
            screenHidden,
            shouldKeepAudio: shouldKeepAudio && status === 'playing',
            adsEnabled: playbackPolicy.adsEnabled,
            pictureInPictureEnabled: playbackPolicy.pictureInPictureEnabled,
            floatingMiniPlayer: playbackPolicy.floatingMiniPlayer,
        };
    }

    return {
        load(next) {
            video = next;
            status = 'ready';
            positionSeconds = 0;
            durationSeconds = next.durationSeconds;
            screenHidden = false;
        },
        play() {
            if (!video) {
                return;
            }
            status = 'playing';
        },
        pause() {
            if (status === 'playing') {
                status = 'paused';
            }
        },
        toggle() {
            if (status === 'playing') {
                status = 'paused';
                return;
            }
            if (video) {
                status = 'playing';
            }
        },
        seek(seconds) {
            if (!video) {
                return;
            }
            positionSeconds = Math.max(0, seconds);
        },
        hideScreen() {
            screenHidden = true;
        },
        showScreen() {
            screenHidden = false;
        },
        stop() {
            video = null;
            status = 'idle';
            positionSeconds = 0;
            durationSeconds = 0;
            screenHidden = false;
        },
        report(position, duration, ended) {
            positionSeconds = position;
            if (duration > 0) {
                durationSeconds = duration;
            }
            if (ended) {
                status = 'ended';
            }
        },
        snapshot: snap,
    };
}
