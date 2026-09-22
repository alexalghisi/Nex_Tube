import { Ionicons } from '@expo/vector-icons';
import {
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { colors, radii, space } from '../theme';
import { useGoogleSession } from './GoogleGate';

export function GoogleConnectScreen({
    onContinueGuest,
}: {
    onContinueGuest: () => void;
}) {
    const google = useGoogleSession();

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.card}>
                    <View style={styles.logoRow}>
                        <View style={styles.logoBadge}>
                            <Ionicons name="play" size={24} color={colors.text} />
                        </View>
                        <Text style={styles.brandTitle}>Nex Tube</Text>
                    </View>

                    <Text style={styles.subtitle}>
                        Ad-free streaming with background audio and movable mini player
                    </Text>

                    <View style={styles.featureList}>
                        <View style={styles.featureItem}>
                            <Ionicons
                                name="ban-outline"
                                size={20}
                                color={colors.accent}
                                style={styles.featureIcon}
                            />
                            <View style={styles.featureTextCol}>
                                <Text style={styles.featureTitle}>Zero Ads</Text>
                                <Text style={styles.featureDesc}>
                                    Stream every video with no commercial interruptions.
                                </Text>
                            </View>
                        </View>

                        <View style={styles.featureItem}>
                            <Ionicons
                                name="musical-notes-outline"
                                size={20}
                                color={colors.accent}
                                style={styles.featureIcon}
                            />
                            <View style={styles.featureTextCol}>
                                <Text style={styles.featureTitle}>Background & Lock-Screen Playback</Text>
                                <Text style={styles.featureDesc}>
                                    Audio keeps playing when you close the screen or switch apps.
                                </Text>
                            </View>
                        </View>

                        <View style={styles.featureItem}>
                            <Ionicons
                                name="albums-outline"
                                size={20}
                                color={colors.accent}
                                style={styles.featureIcon}
                            />
                            <View style={styles.featureTextCol}>
                                <Text style={styles.featureTitle}>Floating Mini Player</Text>
                                <Text style={styles.featureDesc}>
                                    Drag and place the playback video anywhere on your display.
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.actions}>
                        <Pressable
                            onPress={() => {
                                google.signIn().catch(() => undefined);
                            }}
                            style={styles.primaryBtn}
                            accessibilityRole="button"
                            accessibilityLabel={
                                google.missingKey
                                    ? `Sign in (${google.missingKey})`
                                    : 'Sign in with Google'
                            }
                        >
                            <Ionicons name="logo-google" size={18} color={colors.surface} />
                            <Text style={styles.primaryBtnText}>
                                {google.missingKey
                                    ? `Sign in (${google.missingKey})`
                                    : google.busy
                                    ? 'Signing in…'
                                    : 'Connect with Google'}
                            </Text>
                        </Pressable>

                        {google.missingKey ? (
                            <View style={styles.missingBadge}>
                                <Ionicons name="alert-circle-outline" size={16} color={colors.accent} />
                                <Text style={styles.missingNotice}>
                                    Missing {google.missingKey}
                                </Text>
                            </View>
                        ) : null}

                        {google.error && !google.missingKey ? (
                            <Text style={styles.errorNotice}>{google.error}</Text>
                        ) : null}

                        <Pressable
                            onPress={onContinueGuest}
                            style={styles.secondaryBtn}
                            accessibilityRole="button"
                            accessibilityLabel="Continue as Guest"
                        >
                            <Text style={styles.secondaryBtnText}>Continue as Guest</Text>
                        </Pressable>
                        <Text style={styles.footnote}>
                            You can sign in or connect your account at any time from Library.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    container: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: space.lg,
        paddingVertical: space.xl,
    },
    card: {
        width: '100%',
        maxWidth: 480,
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.line,
        paddingHorizontal: space.xl,
        paddingVertical: space.xl,
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: space.sm,
    },
    logoBadge: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: space.md,
    },
    brandTitle: {
        color: colors.text,
        fontSize: 24,
        fontWeight: '700',
        letterSpacing: -0.5,
    },
    subtitle: {
        color: colors.muted,
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: space.lg,
    },
    featureList: {
        gap: space.md,
        marginVertical: space.md,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: colors.chip,
        borderRadius: radii.md,
        padding: space.md,
        borderWidth: 1,
        borderColor: colors.line,
    },
    featureIcon: {
        marginRight: space.md,
        marginTop: 2,
    },
    featureTextCol: {
        flex: 1,
    },
    featureTitle: {
        color: colors.text,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2,
    },
    featureDesc: {
        color: colors.muted,
        fontSize: 12,
        lineHeight: 16,
    },
    actions: {
        marginTop: space.lg,
        gap: space.sm,
        alignItems: 'stretch',
    },
    primaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: space.sm,
        backgroundColor: colors.text,
        borderRadius: radii.md,
        paddingVertical: 14,
        paddingHorizontal: space.md,
    },
    primaryBtnText: {
        color: colors.surface,
        fontSize: 14,
        fontWeight: '700',
    },
    missingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: space.xs,
        paddingVertical: 4,
    },
    missingNotice: {
        color: colors.accent,
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
    errorNotice: {
        color: colors.accent,
        fontSize: 12,
        textAlign: 'center',
    },
    secondaryBtn: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.chip,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: colors.line,
        paddingVertical: 13,
        paddingHorizontal: space.md,
        marginTop: space.xs,
    },
    secondaryBtnText: {
        color: colors.text,
        fontSize: 14,
        fontWeight: '600',
    },
    footnote: {
        color: colors.muted,
        fontSize: 11,
        textAlign: 'center',
        marginTop: space.xs,
    },
});

