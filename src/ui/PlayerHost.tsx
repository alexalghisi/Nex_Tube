import { ResizeMode, Video } from 'expo-av';
import { useEffect, useRef } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { pickPlaybackStreams } from '../catalog/streamPick';
import type { PlaybackSnapshot } from '../player/playbackSession';
import { colors, space } from '../theme';

type Props = {
    snap: PlaybackSnapshot;
    watchOpen: boolean;
    headerOffset: number;
    onReport: (position: number, duration: number, ended: boolean) => void;
};

export function PlayerHost({ snap, watchOpen, headerOffset, onReport }: Props) {
    const ref = useRef<Video>(null);
    const { width } = useWindowDimensions();
    const uri = snap.video ? pickPlaybackStreams(snap.video.streams).videoUrl : null;
    const fullHeight = (width * 9) / 16;

    useEffect(() => {
        if (!uri || !ref.current) {
            return;
        }
        if (snap.status === 'playing') {
            ref.current.playAsync().catch(() => undefined);
            return;
        }
        if (snap.status === 'paused') {
            ref.current.pauseAsync().catch(() => undefined);
        }
    }, [snap.status, uri]);

    if (!uri) {
        return null;
    }

    const full = watchOpen;
    return (
        <View
            style={[
                full ? [styles.fullWrap, { top: headerOffset }] : styles.miniWrap,
                { pointerEvents: 'box-none' },
            ]}
        >
            <Video
                ref={ref}
                source={{ uri }}
                style={full ? [styles.full, { width, height: fullHeight }] : styles.mini}
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay={snap.status === 'playing'}
                useNativeControls={full}
                onPlaybackStatusUpdate={(status) => {
                    if (!status.isLoaded) {
                        return;
                    }
                    onReport(
                        status.positionMillis / 1000,
                        (status.durationMillis ?? 0) / 1000,
                        Boolean(status.didJustFinish)
                    );
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    fullWrap: {
        position: 'absolute',
        left: 0,
        right: 0,
        zIndex: 20,
        backgroundColor: colors.player,
    },
    miniWrap: {
        position: 'absolute',
        left: 0,
        bottom: space.tab,
        zIndex: 20,
        width: 114,
        height: space.mini,
        backgroundColor: colors.player,
    },
    full: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: colors.player,
    },
    mini: {
        width: 114,
        height: space.mini,
        backgroundColor: colors.player,
    },
});
