export type VideoId = string;

export type VideoSummary = {
    id: VideoId;
    title: string;
    channelId: string;
    channelName: string;
    thumbnailUrl: string;
    durationSeconds: number;
    viewCount: number;
    publishedAt: string;
    topic: string;
};

export type StreamKind = 'muxed' | 'video' | 'audio';

export type MediaStream = {
    url: string;
    kind: StreamKind;
    mimeType: string;
    qualityLabel: string;
    bitrate: number;
};

export type VideoDetail = VideoSummary & {
    description: string;
    likeCount: number;
    streams: MediaStream[];
    related: VideoSummary[];
};

export type Catalog = {
    listHome(topic?: string): Promise<VideoSummary[]>;
    search(q: string): Promise<VideoSummary[]>;
    getVideo(id: VideoId): Promise<VideoDetail>;
};
