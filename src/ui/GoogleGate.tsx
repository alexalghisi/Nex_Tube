import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';
import { googleIdsFromEnv, googleReadyOnThisPlatform } from '../auth/googleReady';
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
        return <IdleGate>{children}</IdleGate>;
    }
    return <LiveGate ids={ids}>{children}</LiveGate>;
}

function useStoredProfile() {
    const [profile, setProfile] = useState<GoogleProfile | null>(null);

    useEffect(() => {
        let alive = true;
        AsyncStorage.getItem(PROFILE_KEY)
            .then((raw) => {
                if (!alive || !raw) {
                    return;
                }
                setProfile(JSON.parse(raw) as GoogleProfile);
            })
            .catch(() => undefined);
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

    return { profile, persist };
}

function IdleGate({ children }: { children: ReactNode }) {
    const { profile, persist } = useStoredProfile();
    const [error, setError] = useState<string | null>(null);

    const value = useMemo<GoogleCtx>(
        () => ({
            profile,
            configured: false,
            busy: false,
            error,
            async signIn() {
                setError(MISSING_IDS);
            },
            async signOut() {
                setError(null);
                await persist(null);
            },
        }),
        [profile, error, persist]
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
    const { profile, persist } = useStoredProfile();
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
            signIn,
            signOut,
        }),
        [profile, request, busy, error, signIn, signOut]
    );

    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
