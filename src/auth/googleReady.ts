export type GoogleClientIds = {
    webClientId?: string;
    iosClientId?: string;
    androidClientId?: string;
};

export function googleIdsFromEnv(env: Record<string, string | undefined>): GoogleClientIds {
    return {
        webClientId: env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || undefined,
        iosClientId: env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || undefined,
        androidClientId: env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || undefined,
    };
}

export function googleReadyOnThisPlatform(os: string, ids: GoogleClientIds): boolean {
    if (os === 'ios') {
        return Boolean(ids.iosClientId || ids.webClientId);
    }
    if (os === 'android') {
        return Boolean(ids.androidClientId || ids.webClientId);
    }
    return Boolean(ids.webClientId);
}
