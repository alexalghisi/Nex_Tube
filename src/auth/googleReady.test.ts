import { describe, expect, it } from 'vitest';
import { googleIdsFromEnv, googleReadyOnThisPlatform } from './googleReady';

describe('googleReadyOnThisPlatform', () => {
    const ids = {
        webClientId: 'web.apps.googleusercontent.com',
        iosClientId: 'ios.apps.googleusercontent.com',
        androidClientId: 'and.apps.googleusercontent.com',
    };

    it('requires the web client on web', () => {
        expect(googleReadyOnThisPlatform('web', {})).toBe(false);
        expect(googleReadyOnThisPlatform('web', { webClientId: ids.webClientId })).toBe(true);
    });

    it('accepts the native client or the web client on phones', () => {
        expect(googleReadyOnThisPlatform('ios', { iosClientId: ids.iosClientId })).toBe(true);
        expect(googleReadyOnThisPlatform('ios', { webClientId: ids.webClientId })).toBe(true);
        expect(googleReadyOnThisPlatform('android', { androidClientId: ids.androidClientId })).toBe(
            true
        );
        expect(googleReadyOnThisPlatform('android', {})).toBe(false);
    });
});

describe('googleIdsFromEnv', () => {
    it('drops empty strings', () => {
        expect(
            googleIdsFromEnv({
                EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: '',
                EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: 'ios.apps.googleusercontent.com',
            })
        ).toEqual({
            webClientId: undefined,
            iosClientId: 'ios.apps.googleusercontent.com',
            androidClientId: undefined,
        });
    });
});
