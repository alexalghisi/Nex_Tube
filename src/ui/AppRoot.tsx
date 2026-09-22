import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Image,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    useWindowDimensions,
    View,
} from 'react-native';
import { createCatalog } from '../catalog/createCatalog';
import { DEFAULT_INVIDIOUS_ORIGINS } from '../catalog/invidious';
import { formatDuration, formatViews, publishedDay } from '../catalog/format';
import { HOME_TOPICS } from '../catalog/localCatalog';
import type { VideoDetail, VideoSummary } from '../catalog/types';
import { isLiked, pushHistory, toggleLike } from '../library/watchLog';
import { armBackgroundAudio } from '../native/audioMode';
import { bindLockScreen } from '../native/lockScreen';
import { createPlaybackSession } from '../player/playbackSession';
import { colors, radii, space } from '../theme';
import { useGoogleSession } from './GoogleGate';
import { PlayerHost } from './PlayerHost';

const HISTORY_KEY = 'nex.history';
const LIKES_KEY = 'nex.likes';

type Tab = 'home' | 'search' | 'library';

export function AppRoot() {
    const catalog = useMemo(() => {
        const extra = process.env.EXPO_PUBLIC_INVIDIOUS_ORIGIN;
        return createCatalog({
            remoteFirst: Boolean(extra),
            origins: extra ? [extra, ...DEFAULT_INVIDIOUS_ORIGINS] : DEFAULT_INVIDIOUS_ORIGINS,
        });
    }, []);
    const sessionRef = useRef(createPlaybackSession());
    const [snap, setSnap] = useState(() => sessionRef.current.snapshot());
    const push = useCallback(() => {
        setSnap(sessionRef.current.snapshot());
    }, []);

    const [tab, setTab] = useState<Tab>('home');
    const [topic, setTopic] = useState<(typeof HOME_TOPICS)[number]>('All');
    const [query, setQuery] = useState('');
    const [watchOpen, setWatchOpen] = useState(false);
    const [feed, setFeed] = useState<VideoSummary[] | null>(null);
    const [history, setHistory] = useState<VideoSummary[]>([]);
    const [likes, setLikes] = useState<VideoSummary[]>([]);
    const [loadError, setLoadError] = useState<string | null>(null);
    const { width } = useWindowDimensions();
    const tv = Platform.OS !== 'web' && Boolean(Platform.isTV);
    const cols = tv ? 4 : width >= 1100 ? 4 : width >= 740 ? 3 : width >= 520 ? 2 : 1;
    const tileW = Math.floor((width - space.lg * 2 - space.md * (cols - 1)) / cols);

    const refresh = useCallback(() => {
        setLoadError(null);
        const job =
            tab === 'search'
                ? catalog.search(query)
                : catalog.listHome(topic);
        job.then(setFeed).catch((err: unknown) => {
            setLoadError(err instanceof Error ? err.message : 'Could not load videos');
            setFeed([]);
        });
    }, [catalog, query, tab, topic]);

    useEffect(() => {
        const delay = tab === 'search' ? 250 : 0;
        const timer = setTimeout(() => {
            refresh();
        }, delay);
        return () => clearTimeout(timer);
    }, [refresh, tab]);

    useEffect(() => {
        armBackgroundAudio().catch(() => undefined);
        AsyncStorage.getItem(HISTORY_KEY)
            .then((raw) => raw && setHistory(JSON.parse(raw) as VideoSummary[]))
            .catch(() => undefined);
        AsyncStorage.getItem(LIKES_KEY)
            .then((raw) => raw && setLikes(JSON.parse(raw) as VideoSummary[]))
            .catch(() => undefined);
    }, []);

    useEffect(() => {
        return bindLockScreen(snap.video, {
            play() {
                sessionRef.current.play();
                push();
            },
            pause() {
                sessionRef.current.pause();
                push();
            },
        });
    }, [snap.video, push]);

    const openVideo = useCallback(
        async (id: string) => {
            try {
                const video = await catalog.getVideo(id);
                sessionRef.current.load(video);
                sessionRef.current.play();
                sessionRef.current.showScreen();
                setWatchOpen(true);
                setLoadError(null);
                push();
                setHistory((prev) => {
                    const next = pushHistory(prev, video);
                    AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next)).catch(() => undefined);
                    return next;
                });
            } catch (err) {
                setLoadError(err instanceof Error ? err.message : 'Could not open video');
            }
        },
        [catalog, push]
    );

    const hideWatch = useCallback(() => {
        sessionRef.current.hideScreen();
        setWatchOpen(false);
        push();
    }, [push]);

    const stop = useCallback(() => {
        sessionRef.current.stop();
        setWatchOpen(false);
        push();
    }, [push]);

    const toggle = useCallback(() => {
        sessionRef.current.toggle();
        push();
    }, [push]);

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar style="light" />
            <Header
                watchOpen={watchOpen}
                onBack={hideWatch}
                onHome={() => {
                    setTab('home');
                    setWatchOpen(false);
                    sessionRef.current.hideScreen();
                    push();
                }}
            />
            {watchOpen && snap.video ? (
                <WatchBody
                    video={snap.video}
                    liked={isLiked(likes, snap.video.id)}
                    onLike={() => {
                        setLikes((prev) => {
                            const next = toggleLike(prev, snap.video!);
                            AsyncStorage.setItem(LIKES_KEY, JSON.stringify(next)).catch(
                                () => undefined
                            );
                            return next;
                        });
                    }}
                    onOpen={openVideo}
                />
            ) : (
                <Main
                    tab={tab}
                    topic={topic}
                    query={query}
                    feed={feed}
                    loadError={loadError}
                    history={history}
                    likes={likes}
                    tileW={tileW}
                    onTopic={setTopic}
                    onQuery={setQuery}
                    onOpen={openVideo}
                />
            )}
            <PlayerHost
                snap={snap}
                watchOpen={watchOpen}
                headerOffset={space.header}
                onReport={(position, duration, ended) => {
                    const before = sessionRef.current.snapshot().status;
                    sessionRef.current.report(position, duration, ended);
                    if (ended || sessionRef.current.snapshot().status !== before) {
                        push();
                    }
                }}
            />
            {!watchOpen && snap.video ? (
                <MiniBar
                    title={snap.video.title}
                    channel={snap.video.channelName}
                    playing={snap.status === 'playing'}
                    onOpen={() => {
                        sessionRef.current.showScreen();
                        setWatchOpen(true);
                        push();
                    }}
                    onToggle={toggle}
                    onClose={stop}
                />
            ) : null}
            {!watchOpen ? <TabBar tab={tab} onTab={setTab} /> : null}
        </SafeAreaView>
    );
}

function Header({
    watchOpen,
    onBack,
    onHome,
}: {
    watchOpen: boolean;
    onBack: () => void;
    onHome: () => void;
}) {
    const google = useGoogleSession();
    return (
        <View style={styles.header}>
            {watchOpen ? (
                <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Back">
                    <Ionicons name="chevron-back" size={26} color={colors.text} />
                </Pressable>
            ) : (
                <Pressable onPress={onHome} style={styles.brand} accessibilityRole="button">
                    <View style={styles.logo}>
                        <Ionicons name="play" size={14} color={colors.text} />
                    </View>
                    <Text style={styles.brandText}>Nex Tube</Text>
                </Pressable>
            )}
            <View style={styles.headerRight}>
                {google.profile ? (
                    <View style={styles.avatar}>
                        {google.profile.pictureUrl ? (
                            <Image
                                source={{ uri: google.profile.pictureUrl }}
                                style={styles.avatarImg}
                            />
                        ) : (
                            <Text style={styles.avatarLetter}>
                                {google.profile.name.slice(0, 1).toUpperCase()}
                            </Text>
                        )}
                    </View>
                ) : (
                    <Pressable
                        onPress={() => {
                            google.signIn().catch(() => undefined);
                        }}
                        style={styles.signIn}
                        accessibilityRole="button"
                        accessibilityLabel="Sign in with Google"
                    >
                        <Text style={styles.signInText}>
                            {google.busy ? 'Signing in…' : 'Sign in'}
                        </Text>
                    </Pressable>
                )}
            </View>
        </View>
    );
}

function Main({
    tab,
    topic,
    query,
    feed,
    loadError,
    history,
    likes,
    tileW,
    onTopic,
    onQuery,
    onOpen,
}: {
    tab: Tab;
    topic: (typeof HOME_TOPICS)[number];
    query: string;
    feed: VideoSummary[] | null;
    loadError: string | null;
    history: VideoSummary[];
    likes: VideoSummary[];
    tileW: number;
    onTopic: (topic: (typeof HOME_TOPICS)[number]) => void;
    onQuery: (q: string) => void;
    onOpen: (id: string) => void;
}) {
    const google = useGoogleSession();
    return (
        <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
                styles.scrollBody,
                { paddingBottom: space.tab + space.mini + space.lg },
            ]}
        >
            {tab === 'search' ? (
                <TextInput
                    value={query}
                    onChangeText={onQuery}
                    placeholder="Search Nex Tube"
                    placeholderTextColor={colors.muted}
                    style={styles.search}
                    autoCapitalize="none"
                    autoCorrect={false}
                    accessibilityLabel="Search"
                />
            ) : null}
            {tab === 'home' ? (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chips}
                >
                    {HOME_TOPICS.map((item) => {
                        const on = item === topic;
                        return (
                            <Pressable
                                key={item}
                                onPress={() => onTopic(item)}
                                style={[styles.chip, on && styles.chipOn]}
                                accessibilityRole="button"
                                accessibilityState={{ selected: on }}
                            >
                                <Text style={[styles.chipText, on && styles.chipTextOn]}>
                                    {item}
                                </Text>
                            </Pressable>
                        );
                    })}
                </ScrollView>
            ) : null}
            {tab === 'library' ? (
                <Library
                    history={history}
                    likes={likes}
                    tileW={tileW}
                    onOpen={onOpen}
                />
            ) : (
                <Shelf
                    items={feed}
                    error={loadError}
                    tileW={tileW}
                    onOpen={onOpen}
                />
            )}
            {tab === 'library' && google.error ? (
                <Text style={styles.warn}>{google.error}</Text>
            ) : null}
        </ScrollView>
    );
}

function Library({
    history,
    likes,
    tileW,
    onOpen,
}: {
    history: VideoSummary[];
    likes: VideoSummary[];
    tileW: number;
    onOpen: (id: string) => void;
}) {
    const google = useGoogleSession();
    return (
        <View>
            <View style={styles.accountRow}>
                <Text style={styles.section}>
                    {google.profile ? google.profile.name : 'Signed out'}
                </Text>
                {google.profile ? (
                    <Pressable onPress={() => google.signOut()} accessibilityRole="button">
                        <Text style={styles.link}>Sign out</Text>
                    </Pressable>
                ) : (
                    <Pressable
                        onPress={() => {
                            google.signIn().catch(() => undefined);
                        }}
                        accessibilityRole="button"
                    >
                        <Text style={styles.link}>Sign in with Google</Text>
                    </Pressable>
                )}
            </View>
            {google.profile ? (
                <Text style={styles.meta}>{google.profile.email}</Text>
            ) : (
                <Text style={styles.meta}>
                    Google works on iOS, Android, and web once the client IDs are set.
                </Text>
            )}
            <Text style={styles.section}>History</Text>
            {history.length === 0 ? (
                <Text style={styles.meta}>Nothing played yet.</Text>
            ) : (
                history.map((item) => (
                    <VideoRow key={item.id} item={item} width={Math.min(tileW, 360)} onOpen={onOpen} />
                ))
            )}
            <Text style={styles.section}>Liked</Text>
            {likes.length === 0 ? (
                <Text style={styles.meta}>No liked videos.</Text>
            ) : (
                likes.map((item) => (
                    <VideoRow key={item.id} item={item} width={Math.min(tileW, 360)} onOpen={onOpen} />
                ))
            )}
        </View>
    );
}

function Shelf({
    items,
    error,
    tileW,
    onOpen,
}: {
    items: VideoSummary[] | null;
    error: string | null;
    tileW: number;
    onOpen: (id: string) => void;
}) {
    if (items === null) {
        return (
            <View style={styles.grid}>
                {['a', 'b', 'c', 'd', 'e', 'f'].map((key) => (
                    <View key={key} style={{ width: tileW, marginBottom: space.lg }}>
                        <View style={[styles.thumbPh, { width: tileW, height: (tileW * 9) / 16 }]} />
                        <View style={styles.linePh} />
                    </View>
                ))}
            </View>
        );
    }
    if (error) {
        return <Text style={styles.warn}>{error}</Text>;
    }
    if (items.length === 0) {
        return <Text style={styles.meta}>No videos in this shelf.</Text>;
    }
    return (
        <View style={[styles.grid, { gap: space.md }]}>
            {items.map((item) => (
                <VideoTile key={item.id} item={item} width={tileW} onOpen={onOpen} />
            ))}
        </View>
    );
}

function VideoTile({
    item,
    width,
    onOpen,
}: {
    item: VideoSummary;
    width: number;
    onOpen: (id: string) => void;
}) {
    return (
        <Pressable
            onPress={() => onOpen(item.id)}
            style={{ width, marginBottom: space.lg }}
            accessibilityRole="button"
            accessibilityLabel={item.title}
        >
            <View>
                <Image
                    source={{ uri: item.thumbnailUrl }}
                    style={{ width, height: (width * 9) / 16, backgroundColor: colors.surface }}
                    accessibilityIgnoresInvertColors
                />
                <View style={styles.duration}>
                    <Text style={styles.durationText}>{formatDuration(item.durationSeconds)}</Text>
                </View>
            </View>
            <Text style={styles.title} numberOfLines={2}>
                {item.title}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
                {item.channelName} · {formatViews(item.viewCount)} · {publishedDay(item.publishedAt)}
            </Text>
        </Pressable>
    );
}

function VideoRow({
    item,
    width,
    onOpen,
}: {
    item: VideoSummary;
    width: number;
    onOpen: (id: string) => void;
}) {
    const thumbW = Math.min(180, width);
    return (
        <Pressable
            onPress={() => onOpen(item.id)}
            style={styles.row}
            accessibilityRole="button"
            accessibilityLabel={item.title}
        >
            <Image
                source={{ uri: item.thumbnailUrl }}
                style={{ width: thumbW, height: (thumbW * 9) / 16, backgroundColor: colors.surface }}
            />
            <View style={styles.rowBody}>
                <Text style={styles.title} numberOfLines={2}>
                    {item.title}
                </Text>
                <Text style={styles.meta} numberOfLines={2}>
                    {item.channelName}
                </Text>
            </View>
        </Pressable>
    );
}

function WatchBody({
    video,
    liked,
    onLike,
    onOpen,
}: {
    video: VideoDetail;
    liked: boolean;
    onLike: () => void;
    onOpen: (id: string) => void;
}) {
    return (
        <ScrollView
            style={styles.scroll}
            contentContainerStyle={{ paddingBottom: space.xl }}
        >
            <View style={styles.playerSlot} />
            <View style={styles.watchPad}>
                <Text style={styles.watchTitle}>{video.title}</Text>
                <Text style={styles.meta}>
                    {formatViews(video.viewCount)} · {publishedDay(video.publishedAt)}
                </Text>
                <View style={styles.channelRow}>
                    <View style={styles.channelDot}>
                        <Text style={styles.avatarLetter}>
                            {video.channelName.slice(0, 1).toUpperCase()}
                        </Text>
                    </View>
                    <Text style={styles.channelName}>{video.channelName}</Text>
                    <Pressable
                        onPress={onLike}
                        style={styles.likeBtn}
                        accessibilityRole="button"
                        accessibilityState={{ selected: liked }}
                    >
                        <Ionicons
                            name={liked ? 'thumbs-up' : 'thumbs-up-outline'}
                            size={18}
                            color={colors.text}
                        />
                        <Text style={styles.likeText}>{video.likeCount}</Text>
                    </Pressable>
                </View>
                <Text style={styles.desc}>{video.description}</Text>
                <Text style={styles.section}>Up next</Text>
                {video.related.map((item) => (
                    <VideoRow key={item.id} item={item} width={320} onOpen={onOpen} />
                ))}
            </View>
        </ScrollView>
    );
}

function MiniBar({
    title,
    channel,
    playing,
    onOpen,
    onToggle,
    onClose,
}: {
    title: string;
    channel: string;
    playing: boolean;
    onOpen: () => void;
    onToggle: () => void;
    onClose: () => void;
}) {
    return (
        <View style={styles.miniBar}>
            <Pressable style={styles.miniHit} onPress={onOpen} accessibilityRole="button">
                <View style={styles.miniSpacer} />
                <View style={styles.miniCopy}>
                    <Text style={styles.miniTitle} numberOfLines={1}>
                        {title}
                    </Text>
                    <Text style={styles.meta} numberOfLines={1}>
                        {channel}
                    </Text>
                </View>
            </Pressable>
            <Pressable onPress={onToggle} accessibilityRole="button" accessibilityLabel={playing ? 'Pause' : 'Play'}>
                <Ionicons name={playing ? 'pause' : 'play'} size={22} color={colors.text} />
            </Pressable>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Stop">
                <Ionicons name="close" size={22} color={colors.text} />
            </Pressable>
        </View>
    );
}

function TabBar({ tab, onTab }: { tab: Tab; onTab: (tab: Tab) => void }) {
    return (
        <View style={styles.tabs}>
            {(
                [
                    ['home', 'home', 'Home'],
                    ['search', 'search', 'Search'],
                    ['library', 'person-circle', 'Library'],
                ] as const
            ).map(([name, icon, label]) => {
                const on = tab === name;
                return (
                    <Pressable
                        key={name}
                        onPress={() => onTab(name)}
                        style={styles.tab}
                        accessibilityRole="button"
                        accessibilityState={{ selected: on }}
                    >
                        <Ionicons
                            name={icon}
                            size={22}
                            color={on ? colors.text : colors.muted}
                        />
                        <Text style={[styles.tabText, on && styles.tabTextOn]}>{label}</Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    header: {
        height: space.header,
        paddingHorizontal: space.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.line,
    },
    brand: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.sm,
    },
    logo: {
        width: 28,
        height: 20,
        borderRadius: radii.sm,
        backgroundColor: colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
    },
    brandText: {
        color: colors.text,
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    signIn: {
        borderWidth: 1,
        borderColor: '#3ea6ff',
        borderRadius: radii.pill,
        paddingHorizontal: space.md,
        paddingVertical: 6,
    },
    signInText: {
        color: '#3ea6ff',
        fontWeight: '600',
        fontSize: 13,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.surface,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarImg: {
        width: 32,
        height: 32,
    },
    avatarLetter: {
        color: colors.text,
        fontWeight: '700',
    },
    scroll: {
        flex: 1,
    },
    scrollBody: {
        paddingHorizontal: space.lg,
        paddingTop: space.md,
    },
    chips: {
        gap: space.sm,
        paddingBottom: space.md,
    },
    chip: {
        backgroundColor: colors.chip,
        paddingHorizontal: space.md,
        paddingVertical: 6,
        borderRadius: radii.pill,
    },
    chipOn: {
        backgroundColor: colors.chipOn,
    },
    chipText: {
        color: colors.text,
        fontSize: 13,
        fontWeight: '600',
    },
    chipTextOn: {
        color: colors.bg,
    },
    search: {
        backgroundColor: colors.surface,
        color: colors.text,
        borderRadius: radii.pill,
        paddingHorizontal: space.lg,
        paddingVertical: 10,
        marginBottom: space.md,
        fontSize: 16,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
    },
    thumbPh: {
        backgroundColor: colors.surface,
        borderRadius: radii.sm,
    },
    linePh: {
        height: 12,
        marginTop: space.sm,
        width: '70%',
        backgroundColor: colors.surface,
        borderRadius: radii.sm,
    },
    title: {
        color: colors.text,
        fontSize: 15,
        fontWeight: '600',
        marginTop: space.sm,
    },
    meta: {
        color: colors.muted,
        fontSize: 12,
        marginTop: 4,
    },
    duration: {
        position: 'absolute',
        right: 6,
        bottom: 6,
        backgroundColor: 'rgba(0,0,0,0.8)',
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderRadius: 2,
    },
    durationText: {
        color: colors.text,
        fontSize: 12,
        fontWeight: '700',
    },
    warn: {
        color: colors.accent,
        marginTop: space.md,
    },
    section: {
        color: colors.text,
        fontSize: 16,
        fontWeight: '700',
        marginTop: space.lg,
        marginBottom: space.sm,
    },
    accountRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    link: {
        color: '#3ea6ff',
        fontWeight: '600',
    },
    row: {
        flexDirection: 'row',
        gap: space.md,
        marginBottom: space.md,
    },
    rowBody: {
        flex: 1,
    },
    playerSlot: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: colors.player,
    },
    watchPad: {
        paddingHorizontal: space.lg,
        paddingTop: space.md,
    },
    watchTitle: {
        color: colors.text,
        fontSize: 18,
        fontWeight: '700',
    },
    channelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.sm,
        marginTop: space.md,
    },
    channelDot: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    channelName: {
        color: colors.text,
        fontWeight: '700',
        flex: 1,
    },
    likeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: colors.surface,
        paddingHorizontal: space.md,
        paddingVertical: 8,
        borderRadius: radii.pill,
    },
    likeText: {
        color: colors.text,
        fontWeight: '600',
    },
    desc: {
        color: colors.text,
        marginTop: space.md,
        lineHeight: 20,
    },
    miniBar: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: space.tab,
        height: space.mini,
        backgroundColor: colors.surface,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.line,
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: space.md,
        gap: space.md,
        zIndex: 19,
    },
    miniHit: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    miniSpacer: {
        width: 114,
        height: space.mini,
    },
    miniCopy: {
        flex: 1,
        paddingHorizontal: space.sm,
    },
    miniTitle: {
        color: colors.text,
        fontWeight: '600',
    },
    tabs: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: space.tab,
        backgroundColor: colors.bg,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.line,
        flexDirection: 'row',
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
    },
    tabText: {
        color: colors.muted,
        fontSize: 10,
    },
    tabTextOn: {
        color: colors.text,
    },
});
