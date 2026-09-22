function iosGoogleScheme() {
    const clientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';
    if (!clientId.endsWith('.apps.googleusercontent.com')) {
        return null;
    }
    const id = clientId.replace(/\.apps\.googleusercontent\.com$/, '');
    return `com.googleusercontent.apps.${id}`;
}

const googleScheme = iosGoogleScheme();

module.exports = {
    expo: {
        name: 'Nex Tube',
        slug: 'nex-tube',
        scheme: 'nextube',
        version: '1.0.0',
        orientation: 'default',
        icon: './assets/icon.png',
        userInterfaceStyle: 'dark',
        backgroundColor: '#0f0f0f',
        newArchEnabled: true,
        ios: {
            supportsTablet: true,
            bundleIdentifier: 'com.alexalghisi.nextube',
            infoPlist: {
                UIBackgroundModes: ['audio'],
                CFBundleURLTypes: [
                    {
                        CFBundleURLSchemes: googleScheme
                            ? ['nextube', googleScheme]
                            : ['nextube'],
                    },
                ],
            },
        },
        android: {
            package: 'com.alexalghisi.nextube',
            adaptiveIcon: {
                backgroundColor: '#0f0f0f',
                foregroundImage: './assets/android-icon-foreground.png',
                backgroundImage: './assets/android-icon-background.png',
                monochromeImage: './assets/android-icon-monochrome.png',
            },
            permissions: [
                'FOREGROUND_SERVICE',
                'FOREGROUND_SERVICE_MEDIA_PLAYBACK',
                'WAKE_LOCK',
                'INTERNET',
            ],
            predictiveBackGestureEnabled: false,
        },
        web: {
            bundler: 'metro',
            output: 'single',
            favicon: './assets/favicon.png',
        },
        plugins: [
            'expo-web-browser',
            [
                'expo-av',
                {
                    microphonePermission: false,
                },
            ],
        ],
    },
};
