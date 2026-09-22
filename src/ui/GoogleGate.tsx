import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Alert, Platform } from 'react-native';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';
import {
    googleIdsFromEnv,
    googleReadyOnThisPlatform,
    missingGoogleKeyForPlatform,
} from '../auth/googleReady';
import { loadGoogleProfile } from '../auth/loadProfile';
import type { GoogleProfile } from '../auth/types';

WebBrowser.maybeCompleteAuthSession();

const PROFILE_KEY = 'nex.google.profile';
const MISSING_IDS = 'Set EXPO_PUBLIC_GOOGLE_*_CLIENT_ID for this platform';

type GoogleCtx = {
    profile: GoogleProfile | null;
    configured: boolean;
    busy: boolean;
    error: string | null;
    missingKey: string | null;
    sessionRestored: boolean;
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
};

const Ctx = createContext<GoogleCtx | null>(null);

export function useGoogleSession(): GoogleCtx {
    const value = useContext(Ctx);
    if (!value) {
        throw new Error('useGoogleSession needs GoogleGate');
    }
    return value;
}

export function GoogleGate({ children }: { children: ReactNode }) {
    const ids = googleIdsFromEnv(process.env);
    if (!googleReadyOnThisPlatform(Platform.OS, ids)) {
        return <IdleGate ids={ids}>{children}</IdleGate>;
    }
    return <LiveGate ids={ids}>{children}</LiveGate>;
}

function useStoredProfile() {
    const [profile, setProfile] = useState<GoogleProfile | null>(null);
    const [sessionRestored, setSessionRestored] = useState(false);

    useEffect(() => {
        let alive = true;
        AsyncStorage.getItem(PROFILE_KEY)
            .then((raw) => {
                if (!alive || !raw) {
                    return;
                }
                setProfile(JSON.parse(raw) as GoogleProfile);
            })
            .catch(() => undefined)
            .finally(() => {
                if (alive) {
                    setSessionRestored(true);
                }
            });
        return () => {
            alive = false;
        };
    }, []);

    const persist = useCallback(async (next: GoogleProfile | null) => {
        setProfile(next);
        if (next) {
            await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(next));
            return;
        }
        await AsyncStorage.removeItem(PROFILE_KEY);
    }, []);

    return { profile, sessionRestored, persist };
}

function IdleGate({
    children,
    ids,
}: {
    children: ReactNode;
    ids: ReturnType<typeof googleIdsFromEnv>;
}) {
    const { profile, sessionRestored, persist } = useStoredProfile();
    const [error, setError] = useState<string | null>(null);
    const missingKey = missingGoogleKeyForPlatform(Platform.OS, ids);

    const value = useMemo<GoogleCtx>(
        () => ({
            profile,
            configured: false,
            busy: false,
            error,
            missingKey,
            sessionRestored,
            async signIn() {
                const message = missingKey ? `Missing ${missingKey}` : MISSING_IDS;
                setError(message);
                if (Platform.OS === 'web') {
                    if (typeof window !== 'undefined' && typeof window.alert === 'function') {
                        window.alert(message);
                    }
                } else {
                    Alert.alert('Google Client ID Missing', message);
                }
            },
            async signOut() {
                setError(null);
                await persist(null);
            },
        }),
        [profile, error, persist, missingKey, sessionRestored]
    );

    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function LiveGate({
    children,
    ids,
}: {
    children: ReactNode;
    ids: ReturnType<typeof googleIdsFromEnv>;
}) {
    const [request, response, promptAsync] = Google.useAuthRequest({
        webClientId: ids.webClientId,
        iosClientId: ids.iosClientId,
        androidClientId: ids.androidClientId,
        scopes: [
            'openid',
            'profile',
            'email',
            'https://www.googleapis.com/auth/youtube.readonly',
        ],
    });
    const { profile, sessionRestored, persist } = useStoredProfile();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (response?.type !== 'success' || !response.authentication?.accessToken) {
            if (response?.type === 'error') {
                setError(response.error?.message ?? 'Google sign-in failed');
            }
            return;
        }
        const token = response.authentication.accessToken;
        setBusy(true);
        loadGoogleProfile(token, fetch)
            .then((next) => persist(next))
            .then(() => setError(null))
            .catch((err: unknown) => {
                setError(err instanceof Error ? err.message : 'Google sign-in failed');
            })
            .finally(() => setBusy(false));
    }, [persist, response]);

    const signIn = useCallback(async () => {
        setError(null);
        if (!request) {
            setError(MISSING_IDS);
            return;
        }
        setBusy(true);
        try {
            await promptAsync();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Google sign-in failed');
        } finally {
            setBusy(false);
        }
    }, [promptAsync, request]);

    const signOut = useCallback(async () => {
        setError(null);
        await persist(null);
    }, [persist]);

    const value = useMemo(
        () => ({
            profile,
            configured: request !== null,
            busy,
            error,
            missingKey: null,
            sessionRestored,
            signIn,
            signOut,
        }),
        [profile, request, busy, error, sessionRestored, signIn, signOut]
    );

    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

