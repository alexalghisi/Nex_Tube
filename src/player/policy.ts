export const playbackPolicy = {
    adsEnabled: false as const,
    continueWhenScreenHidden: true as const,
    lockScreenControls: true as const,
};

export type PlaybackPolicy = typeof playbackPolicy;
