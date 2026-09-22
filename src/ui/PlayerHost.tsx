import { ResizeMode, Video } from 'expo-av';
import { useEffect, useRef } from 'react';
import { Animated, PanResponder, StyleSheet, useWindowDimensions } from 'react-native';
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
    const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

    useEffect(() => {
        if (watchOpen) {
            pan.setValue({ x: 0, y: 0 });
            pan.setOffset({ x: 0, y: 0 });
        }
    }, [watchOpen, pan]);

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gesture) =>
                !watchOpen && (Math.abs(gesture.dx) > 3 || Math.abs(gesture.dy) > 3),
            onPanResponderGrant: () => {
                pan.extractOffset();
            },
            onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
                useNativeDriver: false,
            }),
            onPanResponderRelease: () => {
                pan.flattenOffset();
            },
        })
    ).current;

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
        <Animated.View
            {...(!full ? panResponder.panHandlers : {})}
            style={[
                full
                    ? [styles.fullWrap, { top: headerOffset }]
                    : [styles.miniWrap, pan.getLayout()],
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
        </Animated.View>
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
